"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import {
  BookOpenCheck,
  Compass,
  Home,
  LayoutGrid,
  RotateCcw,
  ScanSearch,
  Search,
  User,
} from "lucide-react";
import { ToonaLogo } from "@/components/brand/ToonaLogo";
import { ToonaInstagramLink } from "@/components/brand/ToonaInstagramLink";
import { LanguageSwitcher } from "@/components/i18n/LanguageSwitcher";
import { LocaleLink } from "@/components/i18n/LocaleLink";
import { useT } from "@/lib/i18n/LocaleProvider";
import { cn } from "@/lib/utils";

const NAV_IDS = [
  { id: "home", href: "/home", icon: Home, labelKey: "nav.home" },
  { id: "discover", href: "/discover", icon: Compass, labelKey: "nav.discover" },
  {
    id: "completed",
    href: "/discover?c=completed",
    icon: BookOpenCheck,
    labelKey: "nav.completedWorks",
  },
  {
    id: "platform",
    href: "/discover?c=platform",
    icon: LayoutGrid,
    labelKey: "nav.platform",
  },
  { id: "search", href: "/search", icon: Search, labelKey: "nav.search" },
  { id: "find", href: "/find", icon: ScanSearch, labelKey: "nav.find" },
  { id: "profile", href: "/profile", icon: User, labelKey: "nav.profile" },
  {
    id: "retaste",
    href: "/onboarding",
    icon: RotateCcw,
    labelKey: "nav.retaste",
  },
] as const;

const MOBILE_TAB_IDS = [
  { id: "home", href: "/home", labelKey: "nav.home", icon: Home },
  { id: "discover", href: "/discover", labelKey: "nav.discover", icon: Compass },
  {
    id: "completed",
    href: "/discover?c=completed",
    labelKey: "nav.completed",
    icon: BookOpenCheck,
  },
  { id: "search", href: "/search", labelKey: "nav.search", icon: Search },
] as const;

/** @deprecated Prefer NAV_IDS + useT — kept for any external imports */
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
  { id: "find", href: "/find", icon: ScanSearch, label: "웹툰 찾기" },
  { id: "profile", href: "/profile", icon: User, label: "프로필" },
  {
    id: "retaste",
    href: "/onboarding",
    icon: RotateCcw,
    label: "취향 다시 설정",
  },
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
  if (id === "find") return pathname.startsWith("/find");
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
  const t = useT();

  return (
    <aside className="hidden h-full w-[220px] shrink-0 flex-col border-r border-border bg-background lg:w-[248px] md:flex">
      <div className="mb-10 flex items-start justify-between gap-2 px-6 pt-8 lg:px-8">
        <LocaleLink href="/home" className="inline-flex items-center" aria-label={t("common.homeAria")}>
          <ToonaLogo size="md" priority />
        </LocaleLink>
        <LanguageSwitcher />
      </div>

      <nav className="flex flex-1 flex-col gap-1 px-3 lg:px-4" aria-label={t("nav.mainMenu")}>
        {NAV_IDS.map((item) => {
          const { id, href, icon: Icon, labelKey } = item;
          const active = isNavActive(id, pathname, discoverCategory);
          const label = t(labelKey);

          return (
            <LocaleLink
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
            </LocaleLink>
          );
        })}
      </nav>

      <div className="space-y-4 px-6 pb-8 lg:px-8">
        <LocaleLink
          href="/search"
          prefetch
          className="flex items-center gap-2 rounded-xl border border-border bg-card px-3 py-2.5 text-[12px] text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground lg:text-[13px]"
        >
          <Search className="h-3.5 w-3.5 shrink-0" />
          {t("nav.searchHint")}
        </LocaleLink>
        <p className="text-[11px] leading-relaxed text-muted-foreground/80 lg:text-[12px]">
          {t("nav.taglineLine1")}
          <br />
          {t("nav.taglineLine2")}
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
  const t = useT();

  return (
    <nav
      className="shrink-0 border-t border-border bg-background md:hidden"
      aria-label={t("nav.bottomNav")}
    >
      <div
        className="flex justify-around gap-0.5 px-1 pt-1.5"
        style={{ paddingBottom: "max(6px, env(safe-area-inset-bottom))" }}
      >
        {MOBILE_TAB_IDS.map(({ id, href, labelKey, icon: Icon }) => {
          const active = isNavActive(id, pathname, discoverCategory);
          const label = t(labelKey);

          return (
            <LocaleLink
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
            </LocaleLink>
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
