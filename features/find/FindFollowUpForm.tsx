"use client";

import { Button } from "@/components/ui/button";

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
  placeholder = "정확하지 않아도 괜찮아요. 기억나는 대로 적어주세요.",
}: Props) {
  return (
    <form
      className="mt-4"
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit();
      }}
    >
      <label htmlFor="find-follow-up" className="sr-only">
        추가로 기억나는 내용
      </label>
      <textarea
        id="find-follow-up"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        disabled={disabled}
        rows={4}
        maxLength={2000}
        placeholder={placeholder}
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
