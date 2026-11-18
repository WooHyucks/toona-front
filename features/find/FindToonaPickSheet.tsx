"use client";

import { useEffect, useState } from "react";
import { ExternalLink, Loader2 } from "lucide-react";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { LocaleLink } from "@/components/i18n/LocaleLink";
import { fetchWeekendPicks, getWeekendPickItems } from "@/lib/api/weekend-picks";
import {
  getCachedOfficialUrl,
  pickThumbnailUrl,
  resolvePickOfficialUrl,
} from "@/features/weekend-picks/open";
import { findPlatformLabel } from "@/features/find/platform";
import { FindCover } from "@/features/find/FindCover";
import type { WeekendPickItem } from "@/types/api";
import {
  trackFindToonapickClicked,
  trackFindToonapickShown,
} from "@/lib/analytics";
import { useLocale, useT } from "@/lib/i18n/LocaleProvider";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  source: "find_success" | "find_similar";
  findStatus?: string;
  attempt?: number;
  sessionId?: string | null;
};

export function FindToonaPickSheet({
  open,
  onOpenChange,
  source,
  findStatus,
  attempt,
  sessionId,
}: Props) {
  const t = useT();
  const { locale } = useLocale();
  const [items, setItems] = useState<WeekendPickItem[]>([]);
  const [index, setIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const [failed, setFailed] = useState(false);
  const [officialUrl, setOfficialUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    setLoading(true);
    setFailed(false);
    setIndex(0);
    setItems([]);
    setOfficialUrl(null);

    fetchWeekendPicks()
      .then((data) => {
        if (cancelled) return;
        const next = getWeekendPickItems(data);
        setItems(next);
        setFailed(next.length === 0);
        if (next.length > 0) {
          trackFindToonapickShown({
            source,
            find_status: findStatus,
            attempt,
            session_id: sessionId ?? undefined,
            pick_count: next.length,
          });
        }
      })
      .catch(() => {
        if (!cancelled) setFailed(true);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [open, source, findStatus, attempt, sessionId]);

  const current = items[index] ?? null;

  useEffect(() => {
    if (!current) {
      setOfficialUrl(null);
      return;
    }
    const cached =
      current.webtoon.officialUrl?.trim() ||
      getCachedOfficialUrl(current.webtoon.id);
    setOfficialUrl(cached);
    void resolvePickOfficialUrl(current.webtoon).then(setOfficialUrl);
  }, [current]);

  const thumb = current ? pickThumbnailUrl(current.webtoon) : null;
  const platform = current
    ? findPlatformLabel(String(current.webtoon.platform ?? ""), locale)
    : "";
  const reason = current?.reason?.trim() || "";

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="max-h-[90dvh]">
        <DrawerHeader className="pb-2">
          <DrawerTitle className="text-[20px] tracking-[-0.02em]">
            {t("find.toonaPickTitle")}
          </DrawerTitle>
          <DrawerDescription>{t("find.toonaPickSub")}</DrawerDescription>
        </DrawerHeader>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 pb-2">
          {loading ? (
            <div
              className="flex min-h-[240px] flex-col items-center justify-center"
              role="status"
              aria-busy="true"
            >
              <Loader2 className="h-6 w-6 animate-spin text-primary" aria-hidden />
              <p className="mt-3 text-[14px] text-muted-foreground">
                {t("find.toonaPickLoading")}
              </p>
            </div>
          ) : null}

          {!loading && (failed || !current) ? (
            <div className="flex min-h-[200px] flex-col items-center justify-center text-center">
              <p className="text-[15px] font-semibold text-foreground">
                {t("find.toonaPickFailTitle")}
              </p>
              <p className="mt-2 text-[13px] text-muted-foreground">
                {t("find.toonaPickFailDesc")}
              </p>
              <Button asChild className="mt-5 min-h-12 w-full max-w-sm text-[14px] font-semibold">
                <LocaleLink href="/onboarding" onClick={() => onOpenChange(false)}>
                  {t("find.personalizeCta")}
                </LocaleLink>
              </Button>
            </div>
          ) : null}

          {!loading && current ? (
            <div className="mx-auto w-full max-w-sm pb-2">
              <FindCover
                src={thumb}
                title={current.webtoon.title}
                priority
                className="mx-auto aspect-[2/3] w-[160px] md:w-[180px]"
              />
              <h3 className="mt-4 text-center text-[20px] font-bold leading-snug tracking-[-0.03em] text-foreground">
                {current.webtoon.title}
              </h3>
              {platform ? (
                <p className="mt-1 text-center text-[12px] text-muted-foreground">
                  {platform}
                </p>
              ) : null}
              {reason ? (
                <p className="mt-3 text-center text-[14px] leading-relaxed text-muted-foreground">
                  {reason}
                </p>
              ) : (
                <p className="mt-3 text-center text-[14px] leading-relaxed text-muted-foreground">
                  {t("find.defaultReason")}
                </p>
              )}
            </div>
          ) : null}
        </div>

        {!loading && current ? (
          <DrawerFooter>
            {officialUrl ? (
              <Button asChild className="min-h-12 w-full text-[15px] font-semibold">
                <a
                  href={officialUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`${current.webtoon.title} ${t("find.openThis")}`}
                  onClick={() =>
                    trackFindToonapickClicked({
                      source,
                      find_status: findStatus,
                      attempt,
                      session_id: sessionId ?? undefined,
                      title: current.webtoon.title,
                      platform: String(current.webtoon.platform ?? ""),
                      position: current.position,
                    })
                  }
                >
                  {t("find.openThis")}
                  <ExternalLink className="h-4 w-4" aria-hidden />
                </a>
              </Button>
            ) : (
              <Button asChild className="min-h-12 w-full text-[15px] font-semibold">
                <LocaleLink
                  href={`/webtoon/${encodeURIComponent(current.webtoon.id)}`}
                  onClick={() => {
                    trackFindToonapickClicked({
                      source,
                      find_status: findStatus,
                      attempt,
                      session_id: sessionId ?? undefined,
                      title: current.webtoon.title,
                      platform: String(current.webtoon.platform ?? ""),
                      position: current.position,
                    });
                    onOpenChange(false);
                  }}
                >
                  {t("find.openThis")}
                </LocaleLink>
              </Button>
            )}
            {items.length > 1 ? (
              <Button
                type="button"
                variant="secondary"
                className="mt-0 min-h-11 w-full text-[14px] font-semibold"
                onClick={() => setIndex((prev) => (prev + 1) % items.length)}
              >
                {t("find.otherPick")}
              </Button>
            ) : null}
          </DrawerFooter>
        ) : null}
      </DrawerContent>
    </Drawer>
  );
}
