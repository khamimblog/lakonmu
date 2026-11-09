import { Suspense } from "react";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { Logo } from "@/components/logo";
import { GoogleSignInButton } from "./google-sign-in-button";

export const metadata: Metadata = { title: "Sign in" };

async function RedirectIfSignedIn() {
  if (await getCurrentUser()) redirect("/tracker");
  return null;
}

export default function LoginPage() {
  return (
    <main className="relative flex min-h-dvh items-center justify-center overflow-hidden px-4">
      <Suspense fallback={null}>
        <RedirectIfSignedIn />
      </Suspense>
      <div
        aria-hidden
        className="pointer-events-none absolute -top-40 left-1/2 h-[480px] w-[720px] -translate-x-1/2 rounded-full bg-primary/20 blur-3xl"
      />
      <div className="relative w-full max-w-sm">
        <Logo className="mb-10 justify-center" />
        <div className="rounded-2xl border bg-card/80 p-6 shadow-xl backdrop-blur sm:p-8">
          <h1 className="text-xl font-semibold tracking-tight">Welcome back</h1>
          <p className="mt-1.5 text-sm text-muted-foreground">
            Track what you work on today. Remember what you learned forever.
          </p>
          <GoogleSignInButton className="mt-6 w-full" />
        </div>
        <p className="mt-6 text-center text-xs text-muted-foreground">
          One activity, one day. Pause any time, reflect when you finish.
        </p>
      </div>
    </main>
  );
}
