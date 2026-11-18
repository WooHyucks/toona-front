"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { DesktopContent } from "@/features/shell/DesktopContent";
import { ErrorState } from "@/components/common/ErrorState";
import { Button } from "@/components/ui/button";
import {
  confirmFindCandidate,
  continueFindSession,
  createFindSession,
  getFindSession,
} from "@/lib/api/find";
import { ToonaApiError } from "@/lib/api/client";
import { LanguageSwitcher } from "@/components/i18n/LanguageSwitcher";
import { useT } from "@/lib/i18n/LocaleProvider";
import { getSessionId } from "@/lib/session";
import {
  trackFindAllCandidatesRejected,
  trackFindCandidateRejected,
  trackFindCandidatesShown,
  trackFindConfirmed,
  trackFindContinueAfterSimilar,
  trackFindError,
  trackFindNeedMoreInfo,
  trackFindNeedMoreInfoShown,
  trackFindOfficialClicked,
  trackFindPageView,
  trackFindRefined,
  trackFindResultClicked,
  trackFindResultShown,
  trackFindSimilarClicked,
  trackFindSimilarShown,
  trackFindStarted,
  trackFindToonapickCtaClicked,
  trackFindViewed,
} from "@/lib/analytics";
import type {
  FindCandidate,
  FindConfirmedWebtoon,
  FindSessionResponse,
  FindTurnResponse,
} from "@/types/api";
import { FindCandidateCard } from "./FindCandidateCard";
import { FindDiscoveryCta } from "./FindDiscoveryCta";
import { FindFollowUpForm } from "./FindFollowUpForm";
import { FindFound } from "./FindFound";
import { FindIdleForm } from "./FindIdleForm";
import { FindLoading } from "./FindLoading";
import { FindMemoryTrail } from "./FindMemoryTrail";
import { FindSimilarHero } from "./FindSimilarHero";
import { FindToonaPickSheet } from "./FindToonaPickSheet";
import {
  clearStoredFindSessionId,
  getStoredFindSessionId,
  storeFindSessionId,
} from "./storage";

type Phase =
  | "idle"
  | "loading"
  | "candidates"
  | "need_more"
  | "similar"
  | "confirming"
  | "found"
  | "error";

type RetryKind = "start" | "continue" | "confirm" | "restore";

function userMemoriesFromSession(data: FindSessionResponse): string[] {
  return data.messages
    .filter((item) => item.role === "user")
    .map((item) => item.content.trim())
    .filter(Boolean);
}

function lastAssistantQuestion(data: FindSessionResponse): string | null {
  if (data.followUpQuestion?.trim()) return data.followUpQuestion.trim();
  const last = [...data.messages]
    .reverse()
    .find((item) => item.role === "assistant");
  return last?.content.trim() || null;
}

function candidateStats(list: FindCandidate[]) {
  return {
    candidate_count: list.length,
    verified_count: list.filter((item) => item.verified === true).length,
    thumbnail_count: list.filter((item) => Boolean(item.thumbnailUrl?.trim()))
      .length,
    official_url_count: list.filter((item) => Boolean(item.officialUrl?.trim()))
      .length,
  };
}

function similarStats(list: FindCandidate[]) {
  return {
    similar_count: list.length,
    verified_count: list.filter((item) => item.verified === true).length,
    thumbnail_count: list.filter((item) => Boolean(item.thumbnailUrl?.trim()))
      .length,
    official_url_count: list.filter((item) => Boolean(item.officialUrl?.trim()))
      .length,
  };
}

export function FindScreen() {
  const t = useT();
  const reduceMotion = useReducedMotion();
  const [phase, setPhase] = useState<Phase>("idle");
  const [draft, setDraft] = useState("");
  const [followUp, setFollowUp] = useState("");
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [turnCount, setTurnCount] = useState(0);
  const [attempt, setAttempt] = useState(0);
  const [memories, setMemories] = useState<string[]>([]);
  const [followUpQuestion, setFollowUpQuestion] = useState<string | null>(null);
  const [assistantNote, setAssistantNote] = useState<string | null>(null);
  const [candidates, setCandidates] = useState<FindCandidate[]>([]);
  const [similar, setSimilar] = useState<FindCandidate[]>([]);
  const [rejectedIds, setRejectedIds] = useState<string[]>([]);
  const [confirmed, setConfirmed] = useState<FindConfirmedWebtoon | null>(null);
  const [refineOpen, setRefineOpen] = useState(false);
  const [continueAfterSimilar, setContinueAfterSimilar] = useState(false);
  const [toonaPickOpen, setToonaPickOpen] = useState(false);
  const [toonaPickSource, setToonaPickSource] = useState<
    "find_success" | "find_similar"
  >("find_success");
  const [retryKind, setRetryKind] = useState<RetryKind>("start");
  const lastContinue = useRef<{ message: string; reject: boolean }>({
    message: "",
    reject: false,
  });
  const lastConfirmId = useRef<string | null>(null);
  const inFlight = useRef(false);
  const lastStartMessage = useRef("");
  const restoring = useRef(false);

  const fade = reduceMotion
    ? undefined
    : {
        initial: { opacity: 0, y: 8 },
        animate: { opacity: 1, y: 0 },
        transition: { duration: 0.22, ease: "easeOut" as const },
      };

  useEffect(() => {
    trackFindPageView();
    trackFindViewed();
  }, []);

  const applyTurn = useCallback(
    (data: FindTurnResponse, nextMemories: string[], nextTurn: number) => {
      const nextAttempt = data.attempt ?? nextMemories.length;
      const nextSimilar = data.similar ?? [];
      const shownCandidates = data.candidates.slice(0, 3);
      setSessionId(data.sessionId);
      storeFindSessionId(data.sessionId);
      setMemories(nextMemories);
      setFollowUpQuestion(data.followUpQuestion);
      setAssistantNote(data.message?.trim() || null);
      setCandidates(shownCandidates);
      setSimilar(nextSimilar);
      setRefineOpen(false);
      setContinueAfterSimilar(false);
      setFollowUp("");
      setTurnCount(nextTurn);
      setAttempt(nextAttempt);
      if (data.status === "CANDIDATES") {
        setPhase("candidates");
        trackFindCandidatesShown({
          session_id: data.sessionId,
          turn_number: nextTurn,
          ...candidateStats(shownCandidates),
        });
        // MVP: only when a result card is actually on screen
        if (shownCandidates.length > 0) {
          trackFindResultShown({
            session_id: data.sessionId,
            result_type: "candidate",
            result_count: shownCandidates.length,
            attempt: nextAttempt,
          });
        }
      } else if (data.status === "SIMILAR") {
        setPhase("similar");
        const heroCount = nextSimilar.length > 0 ? 1 : 0;
        trackFindSimilarShown({
          session_id: data.sessionId,
          turn_number: nextTurn,
          attempt: nextAttempt,
          ...similarStats(nextSimilar.slice(0, 1)),
        });
        if (heroCount > 0) {
          trackFindResultShown({
            session_id: data.sessionId,
            result_type: "similar",
            result_count: heroCount,
            attempt: nextAttempt,
          });
        }
      } else {
        setPhase("need_more");
        trackFindNeedMoreInfo({
          session_id: data.sessionId,
          turn_number: nextTurn,
          attempt: nextAttempt,
        });
        trackFindNeedMoreInfoShown({
          session_id: data.sessionId,
          attempt: nextAttempt,
        });
      }
    },
    []
  );

  const restore = useCallback(async () => {
    const stored = getStoredFindSessionId();
    if (!stored) return;
    restoring.current = true;
    setPhase("loading");
    setRetryKind("restore");
    try {
      const data = await getFindSession(stored);
      const mems = userMemoriesFromSession(data);
      const nextSimilar = data.similar ?? [];
      setSessionId(data.sessionId);
      setTurnCount(data.turnCount);
      setAttempt(data.attempt ?? mems.length);
      setMemories(mems);
      setFollowUpQuestion(lastAssistantQuestion(data));
      setAssistantNote(null);
      setCandidates(data.candidates.slice(0, 3));
      setSimilar(nextSimilar);
      if (data.status === "FOUND" && data.webtoon) {
        setConfirmed(data.webtoon);
        setPhase("found");
      } else if (data.status === "CANDIDATES") {
        // Restore: show UI, but do not re-fire MVP conversion events
        setPhase("candidates");
      } else if (data.status === "SIMILAR") {
        setPhase("similar");
      } else {
        setPhase("need_more");
      }
    } catch {
      clearStoredFindSessionId();
      setPhase("idle");
    } finally {
      restoring.current = false;
    }
  }, []);

  useEffect(() => {
    void restore();
  }, [restore]);

  function reset() {
    clearStoredFindSessionId();
    setPhase("idle");
    setDraft("");
    setFollowUp("");
    setSessionId(null);
    setTurnCount(0);
    setAttempt(0);
    setMemories([]);
    setFollowUpQuestion(null);
    setAssistantNote(null);
    setCandidates([]);
    setSimilar([]);
    setRejectedIds([]);
    setConfirmed(null);
    setRefineOpen(false);
    setContinueAfterSimilar(false);
    setToonaPickOpen(false);
    lastStartMessage.current = "";
  }

  function openToonaPick(source: "find_success" | "find_similar") {
    setToonaPickSource(source);
    trackFindToonapickCtaClicked({
      session_id: sessionId ?? undefined,
      turn_number: turnCount,
      attempt,
      source,
      find_status: source === "find_success" ? "FOUND" : "SIMILAR",
    });
    setToonaPickOpen(true);
  }

  async function startSearch(message = draft.trim()) {
    const trimmed = message.trim();
    if (!trimmed || inFlight.current) return;
    inFlight.current = true;
    lastStartMessage.current = trimmed;
    setRetryKind("start");
    setPhase("loading");
    try {
      const data = await createFindSession({
        message: trimmed,
        guestToken: getSessionId() || null,
      });
      trackFindStarted({
        session_id: data.sessionId,
        turn_number: 1,
        input_length: trimmed.length,
        memory_length: trimmed.length,
      });
      applyTurn(data, [trimmed], 1);
    } catch (err) {
      trackFindError({
        attempt: 1,
        error_type:
          err instanceof ToonaApiError ? err.code || "api_error" : "api_error",
      });
      setPhase("error");
    } finally {
      inFlight.current = false;
    }
  }

  async function continueSearch(rawMessage: string, rejectCurrent: boolean) {
    if (!sessionId || inFlight.current) return;
    const trimmed =
      rawMessage.trim() || (rejectCurrent ? "전부 아니에요." : "");
    if (!trimmed) return;
    const fromNeedMore = phase === "need_more";
    const continueAttempt = attempt + 1;
    inFlight.current = true;
    lastContinue.current = { message: trimmed, reject: rejectCurrent };
    setRetryKind("continue");
    setPhase("loading");
    const nextRejected = rejectCurrent
      ? Array.from(
          new Set([...rejectedIds, ...candidates.map((item) => item.id)])
        )
      : rejectedIds;
    if (rejectCurrent) {
      trackFindCandidateRejected({
        session_id: sessionId,
        turn_number: turnCount,
        candidate_count: candidates.length,
      });
    }
    try {
      const data = await continueFindSession(sessionId, {
        message: trimmed,
        rejectedCandidateIds: nextRejected,
      });
      setRejectedIds(nextRejected);
      if (fromNeedMore) {
        trackFindRefined({
          session_id: sessionId,
          turn_number: turnCount + 1,
          attempt: data.attempt ?? continueAttempt,
          memory_length: trimmed.length,
        });
      }
      applyTurn(data, [...memories, trimmed], turnCount + 1);
    } catch (err) {
      if (err instanceof ToonaApiError && err.code === "already_found") {
        try {
          const data = await getFindSession(sessionId);
          if (data.webtoon) {
            setConfirmed(data.webtoon);
            setPhase("found");
            return;
          }
        } catch {
          /* fall through */
        }
      }
      trackFindError({
        session_id: sessionId,
        attempt: continueAttempt,
        error_type:
          err instanceof ToonaApiError ? err.code || "api_error" : "api_error",
      });
      setPhase("error");
    } finally {
      inFlight.current = false;
    }
  }

  function rejectCandidate(candidateId: string) {
    const remaining = candidates.filter((item) => item.id !== candidateId);
    const nextRejected = Array.from(new Set([...rejectedIds, candidateId]));
    setRejectedIds(nextRejected);
    setCandidates(remaining);
    trackFindCandidateRejected({
      session_id: sessionId ?? undefined,
      turn_number: turnCount,
      candidate_count: remaining.length,
    });
    if (remaining.length === 0) {
      trackFindAllCandidatesRejected({
        session_id: sessionId ?? undefined,
        turn_number: turnCount,
        candidate_count: 0,
      });
      setRefineOpen(true);
    }
  }

  async function confirm(candidateId: string) {
    if (!sessionId || inFlight.current) return;
    inFlight.current = true;
    lastConfirmId.current = candidateId;
    setRetryKind("confirm");
    setPhase("confirming");
    try {
      const data = await confirmFindCandidate(sessionId, { candidateId });
      setConfirmed(data.webtoon);
      setPhase("found");
      trackFindConfirmed({
        session_id: sessionId,
        turn_number: turnCount,
        platform: data.webtoon.platform,
        webtoon_title: data.webtoon.title,
        verified: data.webtoon.verified,
      });
      trackFindResultClicked({
        action: "confirmed",
        result_type: "candidate",
        title: data.webtoon.title,
        platform: data.webtoon.platform,
        attempt,
        session_id: sessionId,
      });
    } catch (err) {
      if (err instanceof ToonaApiError && err.code === "already_found") {
        try {
          const data = await getFindSession(sessionId);
          if (data.webtoon) {
            setConfirmed(data.webtoon);
            setPhase("found");
            return;
          }
        } catch {
          /* fall through */
        }
      }
      trackFindError({
        session_id: sessionId,
        attempt,
        error_type:
          err instanceof ToonaApiError ? err.code || "api_error" : "api_error",
      });
      setPhase("error");
    } finally {
      inFlight.current = false;
    }
  }

  function retry() {
    if (retryKind === "start") {
      void startSearch(lastStartMessage.current || draft);
      return;
    }
    if (retryKind === "continue") {
      void continueSearch(
        lastContinue.current.message,
        lastContinue.current.reject
      );
      return;
    }
    if (retryKind === "confirm" && lastConfirmId.current) {
      void confirm(lastConfirmId.current);
      return;
    }
    void restore();
  }

  const busy = phase === "loading" || phase === "confirming";
  const heroSimilar = similar[0] ?? null;

  return (
    <div className="pb-16 md:pb-20">
      <DesktopContent narrow className="max-w-[720px] pt-8 md:pt-12">
        <div className="mb-4 flex justify-end md:hidden">
          <LanguageSwitcher />
        </div>
        {phase === "idle" ? (
          <motion.div {...fade}>
            <FindIdleForm
              value={draft}
              onChange={setDraft}
              onSubmit={() => void startSearch()}
              disabled={busy}
            />
          </motion.div>
        ) : null}

        {phase === "loading" ? <FindLoading /> : null}

        {phase === "error" ? (
          <ErrorState
            title={t("find.errorTitle")}
            description={t("find.errorDesc")}
            onRetry={retry}
            retryLabel={t("common.retry")}
            secondaryAction={{ label: t("common.fromStart"), onClick: reset }}
          />
        ) : null}

        {phase === "candidates" || phase === "confirming" ? (
          <motion.div {...fade}>
            <FindMemoryTrail memories={memories} compact />
            <h2 className="text-[22px] font-bold tracking-[-0.03em] text-foreground">
              {t("find.candidatesTitle")}
            </h2>
            <div
              className={
                candidates.length >= 3
                  ? "mt-5 grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3"
                  : "mt-5 grid grid-cols-1 gap-3 md:grid-cols-2"
              }
            >
              {candidates.map((candidate, index) => (
                <FindCandidateCard
                  key={candidate.id}
                  candidate={candidate}
                  disabled={busy}
                  priority={index === 0}
                  onConfirm={(id) => void confirm(id)}
                  onReject={rejectCandidate}
                />
              ))}
            </div>
            {refineOpen ? (
              <div className="mt-8">
                <p className="text-[18px] font-bold tracking-[-0.03em] text-foreground">
                  {t("find.refineHint")}
                </p>
                <p className="mt-2 text-[14px] text-muted-foreground">
                  {t("find.refineExample")}
                </p>
                <FindFollowUpForm
                  value={followUp}
                  onChange={setFollowUp}
                  disabled={busy}
                  ctaLabel={t("find.refineCta")}
                  placeholder={t("find.refinePlaceholder")}
                  onSubmit={() => void continueSearch(followUp, true)}
                />
              </div>
            ) : null}
            <button
              type="button"
              onClick={reset}
              className="mt-8 text-[13px] text-muted-foreground underline-offset-2 hover:text-foreground hover:underline"
            >
              {t("find.findOther")}
            </button>
          </motion.div>
        ) : null}

        {phase === "similar" ? (
          <motion.div {...fade}>
            <FindMemoryTrail memories={memories} compact />
            <h2 className="text-[22px] font-bold tracking-[-0.03em] text-foreground">
              {t("find.similarTitle")}
            </h2>
            <p className="mt-2 text-[14px] leading-relaxed text-muted-foreground">
              {t("find.similarSubLine1")}
              <br />
              {t("find.similarSubLine2")}
            </p>
            {heroSimilar ? (
              <div className="mt-6">
                <FindSimilarHero
                  item={heroSimilar}
                  onOfficialClick={() => {
                    trackFindSimilarClicked({
                      session_id: sessionId ?? undefined,
                      turn_number: turnCount,
                      attempt,
                      title: heroSimilar.title,
                      platform: heroSimilar.platform,
                      position: 1,
                    });
                    trackFindOfficialClicked({
                      session_id: sessionId ?? undefined,
                      turn_number: turnCount,
                      platform: heroSimilar.platform,
                      webtoon_title: heroSimilar.title,
                    });
                    trackFindResultClicked({
                      action: "official_clicked",
                      result_type: "similar",
                      title: heroSimilar.title,
                      platform: heroSimilar.platform,
                      attempt,
                      session_id: sessionId ?? undefined,
                    });
                  }}
                />
              </div>
            ) : (
              <p className="mt-6 text-[14px] text-muted-foreground">
                {assistantNote?.trim() || t("find.similarEmpty")}
              </p>
            )}

            <FindDiscoveryCta
              variant="similar"
              onOpenToonaPick={() => openToonaPick("find_similar")}
            />

            {!continueAfterSimilar ? (
              <button
                type="button"
                disabled={busy}
                onClick={() => {
                  trackFindContinueAfterSimilar({
                    session_id: sessionId ?? undefined,
                    turn_number: turnCount,
                    attempt,
                  });
                  setContinueAfterSimilar(true);
                }}
                className="mt-6 min-h-10 w-full text-[13px] font-medium text-muted-foreground underline-offset-2 hover:text-foreground hover:underline disabled:opacity-50"
              >
                {t("find.continueMemory")}
              </button>
            ) : (
              <div className="mt-6">
                <p className="text-[16px] font-bold tracking-[-0.02em] text-foreground">
                  {t("find.moreMemoryTitle")}
                </p>
                <FindFollowUpForm
                  value={followUp}
                  onChange={setFollowUp}
                  disabled={busy}
                  ctaLabel={t("find.refineCta")}
                  placeholder={t("find.refinePlaceholder")}
                  onSubmit={() => void continueSearch(followUp, false)}
                />
              </div>
            )}
            <button
              type="button"
              onClick={reset}
              className="mt-6 text-[13px] text-muted-foreground underline-offset-2 hover:text-foreground hover:underline"
            >
              {t("find.findOther")}
            </button>
          </motion.div>
        ) : null}

        {phase === "need_more" ? (
          <motion.div {...fade}>
            <FindMemoryTrail memories={memories} compact />
            <h2 className="text-[22px] font-bold tracking-[-0.03em] text-foreground">
              {t("find.needMoreTitle")}
            </h2>
            <p className="mt-1 text-[13px] font-medium text-muted-foreground">
              {t("find.needMoreHint")}
            </p>
            {followUpQuestion ? (
              <p className="mt-4 text-[16px] font-semibold leading-snug text-foreground">
                {followUpQuestion}
              </p>
            ) : (
              <p className="mt-4 text-[15px] font-semibold leading-snug text-foreground">
                {t("find.needMoreFallback")}
              </p>
            )}
            <FindFollowUpForm
              value={followUp}
              onChange={setFollowUp}
              disabled={busy}
              ctaLabel={t("find.refineCta")}
              placeholder={t("find.refinePlaceholder")}
              onSubmit={() => void continueSearch(followUp, false)}
            />
            <Button
              type="button"
              variant="ghost"
              className="mt-3 min-h-11 w-full text-[13px] text-muted-foreground"
              onClick={reset}
            >
              {t("find.findOther")}
            </Button>
          </motion.div>
        ) : null}

        {phase === "found" && confirmed ? (
          <motion.div {...fade}>
            <FindFound
              webtoon={confirmed}
              onOfficialClick={() => {
                trackFindOfficialClicked({
                  session_id: sessionId ?? undefined,
                  turn_number: turnCount,
                  platform: confirmed.platform,
                  webtoon_title: confirmed.title,
                });
                trackFindResultClicked({
                  action: "official_clicked",
                  result_type: "candidate",
                  title: confirmed.title,
                  platform: confirmed.platform,
                  attempt,
                  session_id: sessionId ?? undefined,
                });
              }}
              onOpenToonaPick={() => openToonaPick("find_success")}
              onReset={reset}
            />
          </motion.div>
        ) : null}
      </DesktopContent>

      <FindToonaPickSheet
        open={toonaPickOpen}
        onOpenChange={setToonaPickOpen}
        source={toonaPickSource}
        findStatus={toonaPickSource === "find_success" ? "FOUND" : "SIMILAR"}
        attempt={attempt}
        sessionId={sessionId}
      />
    </div>
  );
}
