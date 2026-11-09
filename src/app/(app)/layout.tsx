import { Suspense } from "react";
import { requireUser } from "@/lib/auth";
import { AppShell } from "@/components/app-shell/app-shell";
import { AppShellSkeleton } from "@/components/app-shell/app-shell-skeleton";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<AppShellSkeleton />}>
      <AuthedShell>{children}</AuthedShell>
    </Suspense>
  );
}

async function AuthedShell({ children }: { children: React.ReactNode }) {
  const user = await requireUser();
  return (
    <AppShell user={{ name: user.name, email: user.email, photoUrl: user.photoUrl }}>
      {children}
    </AppShell>
  );
}
