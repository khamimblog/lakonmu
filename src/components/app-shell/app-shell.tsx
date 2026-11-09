"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu } from "lucide-react";
import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { NAV_MAIN, NAV_SECONDARY, NavList } from "./nav";
import { UserMenu, type ShellUser } from "./user-menu";

function SidebarBody({ user, onNavigate }: { user: ShellUser; onNavigate?: () => void }) {
  return (
    <div className="flex h-full flex-col gap-6 p-4">
      <Link href="/tracker" onClick={onNavigate} className="px-1 pt-1">
        <Logo />
      </Link>
      <nav className="flex flex-1 flex-col gap-4" aria-label="Main">
        <NavList items={NAV_MAIN} onNavigate={onNavigate} />
        <Separator className="bg-sidebar-border" />
        <NavList items={NAV_SECONDARY} onNavigate={onNavigate} />
      </nav>
      <UserMenu user={user} />
    </div>
  );
}

export function AppShell({ user, children }: { user: ShellUser; children: React.ReactNode }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="min-h-dvh bg-sidebar md:p-2">
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 hidden w-64 md:block">
        <SidebarBody user={user} />
      </aside>

      {/* Mobile top bar */}
      <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b bg-sidebar/90 px-4 backdrop-blur md:hidden">
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" aria-label="Open menu" className="-ml-2">
              <Menu />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-72 bg-sidebar p-0">
            <SheetTitle className="sr-only">Navigation</SheetTitle>
            <SidebarBody user={user} onNavigate={() => setOpen(false)} />
          </SheetContent>
        </Sheet>
        <Logo />
        <UserMenu user={user} compact />
      </header>

      <main className="min-h-[calc(100dvh-3.5rem)] bg-background md:ml-64 md:min-h-[calc(100dvh-1rem)] md:rounded-2xl md:border md:shadow-sm">
        {children}
      </main>
    </div>
  );
}
