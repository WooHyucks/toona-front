"use client";

import { Button } from "@/components/ui/button";
import { useT } from "@/lib/i18n/LocaleProvider";

type Props = {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  disabled?: boolean;
  ctaLabel: string;
  placeholder?: string;
};

export function FindFollowUpForm({
  value,
  onChange,
  onSubmit,
  disabled,
  ctaLabel,
  placeholder,
}: Props) {
  const t = useT();
  const resolvedPlaceholder = placeholder ?? t("find.refinePlaceholder");

  return (
    <form
      className="mt-4"
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit();
      }}
    >
      <label htmlFor="find-follow-up" className="sr-only">
        {t("find.moreMemoryTitle")}
      </label>
      <textarea
        id="find-follow-up"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        disabled={disabled}
        rows={4}
        maxLength={2000}
        placeholder={resolvedPlaceholder}
        className="min-h-[112px] w-full resize-y rounded-2xl border border-border bg-card px-4 py-3.5 text-base leading-relaxed text-foreground placeholder:text-muted-foreground/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 disabled:opacity-50 md:text-[15px]"
        onKeyDown={(event) => {
          if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
            event.preventDefault();
            onSubmit();
          }
        }}
      />
      <Button
        type="submit"
        disabled={disabled || !value.trim()}
        className="mt-4 min-h-12 w-full text-[15px] font-semibold"
      >
        {ctaLabel}
      </Button>
    </form>
  );
}
