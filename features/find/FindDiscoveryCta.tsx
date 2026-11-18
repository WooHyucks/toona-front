"use client";

import { Button } from "@/components/ui/button";
import { useT } from "@/lib/i18n/LocaleProvider";

type Props = {
  variant: "found" | "similar";
  onOpenToonaPick: () => void;
};

export function FindDiscoveryCta({ variant, onOpenToonaPick }: Props) {
  const t = useT();

  if (variant === "found") {
    return (
      <div className="mt-12 border-t border-border pt-8">
        <p className="text-[16px] font-semibold tracking-[-0.02em] text-foreground">
          {t("find.discoveryFoundLine1")}
        </p>
        <p className="mt-1 text-[15px] font-semibold tracking-[-0.02em] text-foreground">
          {t("find.discoveryFoundLine2")}
        </p>
        <p className="mt-2 text-[14px] leading-relaxed text-muted-foreground">
          {t("find.discoveryFoundBody1")}
          <br />
          {t("find.discoveryFoundBody2")}
        </p>
        <Button
          type="button"
          variant="secondary"
          className="mt-4 min-h-12 w-full text-[14px] font-semibold"
          onClick={onOpenToonaPick}
        >
          {t("find.toonaPickCta")}
        </Button>
      </div>
    );
  }

  return (
    <div className="mt-10 border-t border-border pt-8">
      <p className="text-[16px] font-semibold tracking-[-0.02em] text-foreground">
        {t("find.discoverySimilarLine1")}
        <br />
        {t("find.discoverySimilarLine2")}
      </p>
      <p className="mt-2 text-[14px] leading-relaxed text-muted-foreground">
        {t("find.discoverySimilarBody1")}
        <br />
        {t("find.discoverySimilarBody2")}
      </p>
      <Button
        type="button"
        className="mt-4 min-h-12 w-full text-[15px] font-semibold"
        onClick={onOpenToonaPick}
      >
        {t("find.toonaPickCta")}
      </Button>
    </div>
  );
}
