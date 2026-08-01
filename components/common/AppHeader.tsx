"use client";

import Link from "next/link";
import { Search, Bookmark, type LucideIcon } from "lucide-react";
import { ToonaLogo } from "@/components/brand/ToonaLogo";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type AppHeaderProps = {
  title?: string;
  showSearch?: boolean;
  showMy?: boolean;
  className?: string;
  trailing?: React.ReactNode;
};

export function AppHeader({
  showSearch = false,
  showMy = false,
  className,
  trailing,
}: AppHeaderProps) {
  return (
    <header
      className={cn(
        "sticky top-0 z-40 border-b border-border/70 bg-background/90 backdrop-blur-md",
        className
      )}
    >
      <div className="mx-auto flex h-14 max-w-content items-center justify-between px-4 pt-safe sm:px-6">
        <Link href="/home" aria-label="Toona 홈">
          <ToonaLogo size="sm" priority />
        </Link>
        <div className="flex items-center gap-1">
          {trailing}
          {showSearch && (
            <IconLink href="/search" icon={Search} label="검색" />
          )}
          {showMy && (
            <IconLink href="/my" icon={Bookmark} label="저장·마이" />
          )}
        </div>
      </div>
    </header>
  );
}

function IconLink({
  href,
  icon: Icon,
  label,
}: {
  href: string;
  icon: LucideIcon;
  label: string;
}) {
  return (
    <Button asChild variant="ghost" size="icon" className="touch-target">
      <Link href={href} aria-label={label}>
        <Icon className="h-5 w-5" />
      </Link>
    </Button>
  );
}
