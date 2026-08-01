"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bookmark, Compass, Home, UserRound } from "lucide-react";
import { cn } from "@/lib/utils";

const TABS = [
  { href: "/home", label: "홈", icon: Home },
  { href: "/search", label: "발견", icon: Compass },
  { href: "/my", label: "저장", icon: Bookmark },
  { href: "/my?tab=profile", label: "마이", icon: UserRound },
] as const;

export function MobileBottomNavigation() {
  const pathname = usePathname();

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/95 backdrop-blur-md md:hidden">
      <div className="mx-auto grid max-w-app grid-cols-4 px-2 pb-[env(safe-area-inset-bottom)] pt-1">
        {TABS.map((tab) => {
          const active =
            tab.href === "/home"
              ? pathname === "/home"
              : pathname.startsWith(tab.href.split("?")[0]);
          const Icon = tab.icon;

          return (
            <Link
              key={tab.href + tab.label}
              href={tab.href}
              className={cn(
                "flex min-h-[52px] flex-col items-center justify-center gap-0.5 text-[11px] font-medium",
                active ? "text-primary" : "text-muted-foreground"
              )}
            >
              <Icon className={cn("h-5 w-5", active && "stroke-[2.25]")} />
              {tab.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
