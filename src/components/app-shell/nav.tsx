"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  BookOpenText,
  ClipboardCheck,
  Clock,
  FolderKanban,
  Settings,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

type NavItem = { href: string; label: string; icon: LucideIcon; soon?: string };

export const NAV_MAIN: NavItem[] = [
  { href: "/tracker", label: "Time Tracker", icon: Clock },
  { href: "/learnings", label: "Learnings", icon: BookOpenText, soon: "Phase 2" },
  { href: "/reports", label: "Reports", icon: BarChart3, soon: "Phase 2" },
  { href: "/assessments", label: "Assessments", icon: ClipboardCheck, soon: "Phase 3" },
];

export const NAV_SECONDARY: NavItem[] = [
  { href: "/projects", label: "Projects", icon: FolderKanban, soon: "Phase 2" },
  { href: "/settings", label: "Settings", icon: Settings, soon: "Phase 5" },
];

export function NavList({ items, onNavigate }: { items: NavItem[]; onNavigate?: () => void }) {
  const pathname = usePathname();
  return (
    <ul className="space-y-0.5">
      {items.map((item) => {
        const active = pathname.startsWith(item.href);
        const Icon = item.icon;
        const content = (
          <>
            <Icon className="size-4 shrink-0" />
            <span className="truncate">{item.label}</span>
            {item.soon && (
              <span className="ml-auto rounded-full bg-sidebar-accent px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
                {item.soon}
              </span>
            )}
          </>
        );
        const cls = cn(
          "flex h-9 items-center gap-2.5 rounded-lg px-2.5 text-sm transition-colors",
          active
            ? "bg-sidebar-accent font-medium text-sidebar-accent-foreground shadow-xs"
            : "text-sidebar-foreground/75 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground",
          item.soon && "cursor-default opacity-60 hover:bg-transparent hover:text-sidebar-foreground/75",
        );
        return (
          <li key={item.href}>
            {item.soon ? (
              <span className={cls} aria-disabled>
                {content}
              </span>
            ) : (
              <Link href={item.href} className={cls} onClick={onNavigate}>
                {content}
              </Link>
            )}
          </li>
        );
      })}
    </ul>
  );
}
