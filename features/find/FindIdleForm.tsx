"use client";

import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useT } from "@/lib/i18n/LocaleProvider";

type Props = {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  disabled?: boolean;
};

export function FindIdleForm({ value, onChange, onSubmit, disabled }: Props) {
  const t = useT();
  const helpers = [
    t("find.helpers.scene"),
    t("find.helpers.character"),
    t("find.helpers.setting"),
    t("find.helpers.art"),
  ];

  return (
    <form
      className="mx-auto w-full max-w-xl"
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit();
      }}
    >
      <div className="flex items-center justify-center gap-2">
        <h1 className="text-center text-[28px] font-bold tracking-[-0.04em] text-foreground md:text-[34px]">
          {t("find.title")}
        </h1>
        <span className="rounded-md border border-border bg-elevated px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
          {t("find.beta")}
        </span>
      </div>
      <p className="mx-auto mt-3 max-w-sm text-center text-[14px] leading-relaxed text-muted-foreground md:text-[15px]">
        {t("find.subtitleLine1")}
        <br />
        {t("find.subtitleLine2")}
      </p>

      <label htmlFor="find-memory" className="sr-only">
        {t("find.memoryLabel")}
      </label>
      <textarea
        id="find-memory"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        disabled={disabled}
        rows={5}
        maxLength={2000}
        placeholder={t("find.placeholder")}
        className="mt-8 min-h-[148px] w-full resize-y rounded-2xl border border-border bg-card px-4 py-3.5 text-base leading-relaxed text-foreground placeholder:text-muted-foreground/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 disabled:opacity-50"
        onKeyDown={(event) => {
          if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
            event.preventDefault();
            onSubmit();
          }
        }}
      />

      <p className="mt-3 text-[12px] font-medium text-muted-foreground">
        {t("find.helperTitle")}
      </p>
      <ul className="mt-1.5 space-y-0.5 text-[12px] leading-relaxed text-muted-foreground/90">
        {helpers.map((item) => (
          <li key={item}>· {item}</li>
        ))}
      </ul>

      <Button
        type="submit"
        disabled={disabled || !value.trim()}
        className="mt-6 min-h-12 w-full text-[15px] font-semibold"
      >
        <Search className="h-4 w-4" aria-hidden />
        {t("find.cta")}
      </Button>
    </form>
  );
}
