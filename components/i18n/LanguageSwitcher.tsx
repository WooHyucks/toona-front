"use client";

import { cn } from "@/lib/utils";
import { useLocale } from "@/lib/i18n/LocaleProvider";
import type { Locale } from "@/lib/i18n/types";

type Props = {
  className?: string;
  /** compact = pill in mobile header */
  size?: "sm" | "md";
};

export function LanguageSwitcher({ className, size = "sm" }: Props) {
  const { locale, setLocale, t } = useLocale();

  function select(next: Locale) {
    setLocale(next);
  }

  return (
    <div
      role="group"
      aria-label={t("lang.switcherAria")}
      className={cn(
        "inline-flex items-center rounded-xl border border-border bg-card text-[11px] font-semibold tracking-wide",
        size === "md" ? "h-10 px-1" : "h-9 px-1",
        className
      )}
    >
      <span className="px-1.5 text-muted-foreground" aria-hidden>
        🌐
      </span>
      {(["ko", "en"] as const).map((code) => {
        const active = locale === code;
        return (
          <button
            key={code}
            type="button"
            onClick={() => select(code)}
            aria-pressed={active}
            className={cn(
              "min-h-8 min-w-9 rounded-lg px-2 transition-colors",
              active
                ? "bg-primary/15 text-primary"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {t(`lang.${code}`)}
          </button>
        );
      })}
    </div>
  );
}
