import { Logo } from "@/components/logo";
import { Skeleton } from "@/components/ui/skeleton";

export function AppShellSkeleton() {
  return (
    <div className="min-h-dvh bg-sidebar md:p-2">
      <aside className="fixed inset-y-0 left-0 hidden w-64 flex-col gap-6 p-4 md:flex">
        <Logo className="px-1 pt-1" />
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-9 bg-sidebar-accent" />
          ))}
        </div>
      </aside>
      <header className="flex h-14 items-center justify-center border-b md:hidden">
        <Logo />
      </header>
      <main className="min-h-[calc(100dvh-3.5rem)] bg-background md:ml-64 md:min-h-[calc(100dvh-1rem)] md:rounded-2xl md:border">
        <TrackerSkeleton />
      </main>
    </div>
  );
}

export function TrackerSkeleton() {
  return (
    <div className="mx-auto w-full max-w-5xl space-y-4 px-4 py-5 sm:px-6 md:py-8 lg:px-10">
      <Skeleton className="h-8 w-40" />
      <Skeleton className="h-14 rounded-2xl" />
      <Skeleton className="mt-8 h-7 w-56" />
      <Skeleton className="h-48 rounded-2xl" />
      <Skeleton className="h-36 rounded-2xl" />
    </div>
  );
}
