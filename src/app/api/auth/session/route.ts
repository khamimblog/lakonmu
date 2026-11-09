import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { adminAuth } from "@/lib/firebase/admin";
import { SESSION_COOKIE, SESSION_MAX_AGE_MS, upsertUser } from "@/lib/auth";
import { isValidTimeZone } from "@/lib/time";

const bodySchema = z.object({
  idToken: z.string().min(1),
  timezone: z.string().optional(),
});

/** Exchange a fresh Firebase ID token for an httpOnly session cookie. */
export async function POST(req: NextRequest) {
  const parsed = bodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const { idToken, timezone } = parsed.data;
  try {
    const decoded = await adminAuth().verifyIdToken(idToken);
    // Only accept tokens from a sign-in that just happened.
    if (Date.now() / 1000 - decoded.auth_time > 5 * 60) {
      return NextResponse.json({ error: "Recent sign-in required" }, { status: 401 });
    }
    if (!decoded.email) {
      return NextResponse.json({ error: "Google account has no email" }, { status: 400 });
    }

    await upsertUser({
      firebaseUid: decoded.uid,
      email: decoded.email,
      name: (decoded.name as string | undefined) ?? null,
      photoUrl: decoded.picture ?? null,
      timezone: timezone && isValidTimeZone(timezone) ? timezone : undefined,
    });

    const sessionCookie = await adminAuth().createSessionCookie(idToken, {
      expiresIn: SESSION_MAX_AGE_MS,
    });

    const res = NextResponse.json({ ok: true });
    res.cookies.set(SESSION_COOKIE, sessionCookie, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: SESSION_MAX_AGE_MS / 1000,
    });
    return res;
  } catch (err) {
    console.error("[auth/session] failed", err);
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}

export async function DELETE() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set(SESSION_COOKIE, "", { path: "/", maxAge: 0 });
  return res;
}
