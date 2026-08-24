"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import {
  BookOpenCheck,
  Compass,
  Home,
  LayoutGrid,
  RotateCcw,
  Search,
  User,
} from "lucide-react";
import { ToonaLogo } from "@/components/brand/ToonaLogo";
import { ToonaInstagramLink } from "@/components/brand/ToonaInstagramLink";
import { cn } from "@/lib/utils";

export const NAV = [
  { id: "home", href: "/home", icon: Home, label: "홈" },
  { id: "discover", href: "/discover", icon: Compass, label: "발견" },
  {
    id: "completed",
    href: "/discover?c=completed",
    icon: BookOpenCheck,
    label: "완결작",
  },
  {
    id: "platform",
    href: "/discover?c=platform",
    icon: LayoutGrid,
    label: "플랫폼",
  },
  { id: "search", href: "/search", icon: Search, label: "검색" },
  { id: "profile", href: "/profile", icon: User, label: "프로필" },
  {
    id: "retaste",
    href: "/onboarding",
    icon: RotateCcw,
    label: "취향 다시 설정",
  },
] as const;

const MOBILE_TABS = [
  { id: "home", href: "/home", label: "홈", icon: Home },
  { id: "discover", href: "/discover", label: "발견", icon: Compass },
  {
    id: "completed",
    href: "/discover?c=completed",
    label: "완결",
    icon: BookOpenCheck,
  },
  { id: "search", href: "/search", label: "검색", icon: Search },
] as const;

function useDiscoverCategory() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  if (!pathname.startsWith("/discover")) return null;
  return searchParams.get("c");
}

function isNavActive(
  id: string,
  pathname: string,
  discoverCategory: string | null
) {
  if (id === "home") {
    return pathname === "/home" || pathname.startsWith("/home/");
  }
  if (id === "search") return pathname.startsWith("/search");
  if (id === "profile") return pathname.startsWith("/profile");
  if (id === "retaste") return pathname.startsWith("/onboarding");
  if (id === "discover") {
    return pathname.startsWith("/discover") && !discoverCategory;
  }
  if (id === "completed") {
    return pathname.startsWith("/discover") && discoverCategory === "completed";
  }
  if (id === "platform") {
    return pathname.startsWith("/discover") && discoverCategory === "platform";
  }
  return false;
}

function DesktopSidebarInner() {
  const pathname = usePathname();
  const discoverCategory = useDiscoverCategory();

  return (
    <aside className="hidden h-full w-[220px] shrink-0 flex-col border-r border-border bg-background lg:w-[248px] md:flex">
      <div className="mb-10 px-6 pt-8 lg:px-8">
        <Link href="/home" className="inline-flex items-center" aria-label="Toona 홈">
          <ToonaLogo size="md" priority />
        </Link>
      </div>

      <nav className="flex flex-1 flex-col gap-1 px-3 lg:px-4" aria-label="주요 메뉴">
        {NAV.map((item) => {
          const { id, href, icon: Icon, label } = item;
          const active = isNavActive(id, pathname, discoverCategory);

          return (
            <Link
              key={id}
              href={href}
              prefetch
              scroll={false}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors lg:px-4 lg:py-3",
                active
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-card hover:text-foreground"
              )}
            >
              <Icon className="h-[17px] w-[17px] shrink-0 lg:h-[18px] lg:w-[18px]" />
              <span className="text-[13px] font-medium lg:text-[14px]">{label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="space-y-4 px-6 pb-8 lg:px-8">
        <Link
          href="/search"
          prefetch
          className="flex items-center gap-2 rounded-xl border border-border bg-card px-3 py-2.5 text-[12px] text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground lg:text-[13px]"
        >
          <Search className="h-3.5 w-3.5 shrink-0" />
          웹툰 검색…
        </Link>
        <p className="text-[11px] leading-relaxed text-muted-foreground/80 lg:text-[12px]">
          네이버 · 카카오 웹툰을
          <br />
          한 곳에서 발견하세요
        </p>
        <ToonaInstagramLink className="h-10 w-10 rounded-xl bg-card" />
      </div>
    </aside>
  );
}

export function DesktopSidebar() {
  return (
    <Suspense
      fallback={
        <aside className="hidden w-[220px] shrink-0 border-r border-border bg-background lg:w-[248px] md:block" />
      }
    >
      <DesktopSidebarInner />
    </Suspense>
  );
}

function MobileBottomNavInner() {
  const pathname = usePathname();
  const discoverCategory = useDiscoverCategory();

  return (
    <nav
      className="shrink-0 border-t border-border bg-background md:hidden"
      aria-label="하단 내비게이션"
    >
      <div
        className="flex justify-around gap-0.5 px-1 pt-1.5"
        style={{ paddingBottom: "max(6px, env(safe-area-inset-bottom))" }}
      >
        {MOBILE_TABS.map(({ id, href, label, icon: Icon }) => {
          const active = isNavActive(id, pathname, discoverCategory);

          return (
            <Link
              key={id}
              href={href}
              prefetch
              scroll={false}
              aria-current={active ? "page" : undefined}
              aria-label={label}
              className="flex min-h-[56px] min-w-[64px] flex-1 flex-col items-center justify-center gap-1 px-1"
            >
              <div
                className={cn(
                  "flex h-9 w-9 items-center justify-center rounded-xl transition-colors",
                  active && "bg-primary/15"
                )}
              >
                <Icon
                  className={cn(
                    "h-5 w-5",
                    active ? "text-primary" : "text-muted-foreground"
                  )}
                  aria-hidden
                />
              </div>
              <span
                className={cn(
                  "text-[11px] font-medium leading-none",
                  active ? "text-primary" : "text-muted-foreground"
                )}
              >
                {label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

export function MobileBottomNav() {
  return (
    <Suspense
      fallback={<nav className="h-[60px] shrink-0 border-t border-border md:hidden" />}
    >
      <MobileBottomNavInner />
    </Suspense>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-[100dvh] overflow-hidden bg-background">
      <DesktopSidebar />
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <div className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden scrollbar-hide md:py-2 lg:py-4">
          {children}
        </div>
        <MobileBottomNav />
      </div>
    </div>
  );
}
