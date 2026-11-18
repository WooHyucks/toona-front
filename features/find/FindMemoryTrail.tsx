"use client";

import { useT } from "@/lib/i18n/LocaleProvider";

type Props = {
  memories: string[];
  question?: string | null;
  /** Compact summary — avoids chat-bubble clutter */
  compact?: boolean;
};

export function FindMemoryTrail({
  memories,
  question,
  compact = false,
}: Props) {
  const t = useT();

  if (memories.length === 0 && !question) return null;

  if (compact) {
    const latest = memories[memories.length - 1] ?? "";
    const summary =
      latest.length > 72 ? `${latest.slice(0, 72).trim()}…` : latest;
    return (
      <section className="mb-5" aria-label={t("find.memoryTrailAria")}>
        {summary ? (
          <p className="line-clamp-2 text-[13px] leading-relaxed text-muted-foreground">
            <span className="font-medium text-foreground/80">
              {t("find.memoryTrailPrefix")}
            </span>
            {summary}
          </p>
        ) : null}
      </section>
    );
  }

  return (
    <section className="mb-6 space-y-4" aria-label={t("find.memoryTrailAria")}>
      {memories.length > 0 ? (
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            {t("find.memoryTrail")}
          </p>
          <div className="mt-2 space-y-2">
            {memories.map((memory, index) => (
              <p
                key={`${index}-${memory.slice(0, 24)}`}
                className="whitespace-pre-wrap rounded-2xl bg-card px-4 py-3 text-[13px] leading-relaxed text-foreground"
              >
                {memory}
              </p>
            ))}
          </div>
        </div>
      ) : null}
      {question ? (
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            {t("find.toonaQuestion")}
          </p>
          <p className="mt-2 text-[15px] font-semibold leading-snug tracking-[-0.02em] text-foreground">
            {question}
          </p>
        </div>
      ) : null}
    </section>
  );
}
