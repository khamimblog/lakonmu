import "server-only";
import { cache } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users, type User } from "@/db/schema";
import { adminAuth } from "@/lib/firebase/admin";

export const SESSION_COOKIE = "__session";
export const SESSION_MAX_AGE_MS = 14 * 24 * 60 * 60 * 1000; // Firebase max is 14 days

/**
 * Local-only escape hatch so the app can run before Firebase is configured.
 * Never active in production builds.
 */
const DEV_BYPASS =
  process.env.NODE_ENV !== "production" && process.env.AUTH_DEV_BYPASS === "true";

export async function upsertUser(input: {
  firebaseUid: string;
  email: string;
  name?: string | null;
  photoUrl?: string | null;
  timezone?: string;
}): Promise<User> {
  const [row] = await db
    .insert(users)
    .values({
      firebaseUid: input.firebaseUid,
      email: input.email,
      name: input.name ?? null,
      photoUrl: input.photoUrl ?? null,
      timezone: input.timezone ?? "UTC",
    })
    .onConflictDoUpdate({
      target: users.firebaseUid,
      set: {
        email: input.email,
        name: input.name ?? null,
        photoUrl: input.photoUrl ?? null,
        ...(input.timezone ? { timezone: input.timezone } : {}),
        updatedAt: Date.now(),
      },
    })
    .returning();
  return row;
}

export const getCurrentUser = cache(async (): Promise<User | null> => {
  // Mark everything below as per-request (it uses the clock and the database).
  await connection();
  const session = (await cookies()).get(SESSION_COOKIE)?.value;

  if (DEV_BYPASS) {
    return upsertUser({ firebaseUid: "dev-user", email: "dev@localhost", name: "Dev User" });
  }

  if (!session) return null;

  try {
    const decoded = await adminAuth().verifySessionCookie(session);
    const user = await db.query.users.findFirst({
      where: eq(users.firebaseUid, decoded.uid),
    });
    return user ?? null;
  } catch {
    return null;
  }
});

export async function requireUser(): Promise<User> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user;
}
