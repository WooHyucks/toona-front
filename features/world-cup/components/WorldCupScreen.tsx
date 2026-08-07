"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ErrorState } from "@/components/common/ErrorState";
import { WorldCupMatchView } from "@/features/world-cup/components/WorldCupMatch";
import { WorldCupSkeleton } from "@/features/world-cup/components/WorldCupSkeleton";
import { WorldCupWinnerView } from "@/features/world-cup/components/WorldCupWinner";
import { worldCupErrorCopy } from "@/features/world-cup/messages";
import { track, trackWorldcupCompleted, trackWorldcupView } from "@/lib/analytics";
import { ToonaApiError } from "@/lib/api/client";
import {
  createWorldCupSession,
  fetchWorldCupSession,
  submitWorldCupChoice,
} from "@/lib/api/world-cup";
import { getSessionId } from "@/lib/session";
import { prepareTasteAnalysis } from "@/lib/taste-flow";
import { nextRoundBanner } from "@/lib/world-cup-round";
import {
  clearWorldCupSession,
  getStoredWorldCupId,
  getStoredWorldCupWinner,
  setStoredWorldCupId,
  setStoredWorldCupMode,
  setStoredWorldCupResultId,
  setStoredWorldCupWinner,
} from "@/lib/world-cup-session";
import type {
  WorldCupChoiceAction,
  WorldCupCompletedResponse,
  WorldCupInProgressResponse,
  WorldCupMatch,
  WorldCupMode,
  WorldCupRound,
  WorldCupTournament,
  WorldCupWebtoon,
} from "@/types/api";

type Phase = "initializing" | "playing" | "completed" | "error";

function resolveMode(searchMode: string | null): WorldCupMode {
  if (searchMode?.toLowerCase() === "replay") return "REPLAY";
  return "ACQUISITION";
}

export function WorldCupScreen() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const mode = resolveMode(searchParams.get("mode"));

  const [phase, setPhase] = useState<Phase>("initializing");
  const [worldCupId, setWorldCupId] = useState<string | null>(null);
  const [sessionMode, setSessionMode] = useState<WorldCupMode>(mode);
  const [title, setTitle] = useState("웹툰 이상형 월드컵");
  const [match, setMatch] = useState<WorldCupMatch | null>(null);
  const [tournament, setTournament] = useState<WorldCupTournament>({
    size: 16,
    completedMatches: 0,
    totalMatches: 15,
  });
  const [winner, setWinner] = useState<WorldCupWebtoon | null>(null);
  const [resultId, setResultId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [highlight, setHighlight] = useState<"left" | "right" | null>(null);
  const [roundBanner, setRoundBanner] = useState<string | null>(null);
  const [continuing, setContinuing] = useState(false);
  const [restarting, setRestarting] = useState(false);
  const [errorTitle, setErrorTitle] = useState("");
  const [errorDescription, setErrorDescription] = useState("");
  const [errorCode, setErrorCode] = useState<string | null>(null);

  const submittingRef = useRef(false);
  const prevRoundRef = useRef<WorldCupRound | null>(null);
  const bannerTimerRef = useRef<number | null>(null);
  const bootKeyRef = useRef(0);

  const showError = useCallback((err: unknown) => {
    const copy = worldCupErrorCopy(err);
    setErrorCode(copy.code);
    setErrorTitle(copy.title);
    setErrorDescription(copy.description);
    setPhase("error");
  }, []);

  const applyInProgress = useCallback((res: WorldCupInProgressResponse) => {
    const prevRound = prevRoundRef.current;
    const nextRound = res.match.round;
    const banner = nextRoundBanner(prevRound, nextRound);
    if (banner) {
      setRoundBanner(banner);
      if (bannerTimerRef.current) window.clearTimeout(bannerTimerRef.current);
      bannerTimerRef.current = window.setTimeout(() => {
        setRoundBanner(null);
      }, 700);
    }
    prevRoundRef.current = nextRound;

    setWorldCupId(res.worldCupId);
    setStoredWorldCupId(res.worldCupId);
    setSessionMode(res.mode);
    setStoredWorldCupMode(res.mode);
    setTitle(res.title || "웹툰 이상형 월드컵");
    setMatch(res.match);
    setTournament(res.tournament);
    setWinner(null);
    setResultId(null);
    setHighlight(null);
    setPhase("playing");

    trackWorldcupView();

    track("world_cup_match_viewed", {
      worldCupId: res.worldCupId,
      mode: res.mode,
      round: res.match.round,
      matchIndex: res.match.matchIndex,
      completedMatches: res.tournament.completedMatches,
      source: "world-cup",
    });
  }, []);

  const applyCompleted = useCallback((res: WorldCupCompletedResponse) => {
    setWorldCupId(res.worldCupId);
    setStoredWorldCupId(res.worldCupId);
    setSessionMode(res.mode);
    setStoredWorldCupMode(res.mode);
    setTitle(res.title || "웹툰 이상형 월드컵");
    setTournament(res.tournament);
    setWinner(res.winner);
    setStoredWorldCupWinner(res.winner);
    setResultId(res.resultId);
    setStoredWorldCupResultId(res.resultId);
    setMatch(null);
    setHighlight(null);
    setPhase("completed");

    trackWorldcupCompleted(res.winner.id, res.winner.title);

    track("world_cup_completed", {
      worldCupId: res.worldCupId,
      mode: res.mode,
      winnerWebtoonId: res.winner.id,
      resultId: res.resultId,
      completedMatches: res.tournament.completedMatches,
      source: "world-cup",
    });
  }, []);

  const startFreshSession = useCallback(
    async (nextMode: WorldCupMode, signal?: AbortSignal) => {
      clearWorldCupSession();
      const sessionId = getSessionId();
      const res = await createWorldCupSession(
        { sessionId, mode: nextMode },
        signal
      );

      track("world_cup_session_created", {
        worldCupId: res.worldCupId,
        mode: res.mode,
        source: "world-cup",
      });

      if (res.status === "IN_PROGRESS") {
        prevRoundRef.current = null;
        applyInProgress(res);
        return;
      }
      if (res.status === "COMPLETED") {
        applyCompleted(res);
      }
    },
    [applyCompleted, applyInProgress]
  );

  const resyncSession = useCallback(
    async (id: string) => {
      const res = await fetchWorldCupSession(id);
      if (res.status === "IN_PROGRESS") {
        applyInProgress(res);
        return;
      }
      if (res.status === "COMPLETED") {
        applyCompleted(res);
        return;
      }
      clearWorldCupSession();
      showError(
        new ToonaApiError("expired_world_cup", "월드컵이 만료됐어요.", 410)
      );
    },
    [applyCompleted, applyInProgress, showError]
  );

  // Boot: restore or create — no landing
  useEffect(() => {
    const bootKey = ++bootKeyRef.current;
    let cancelled = false;
    const controller = new AbortController();

    track("world_cup_viewed", { mode, source: "world-cup" });
    setPhase("initializing");

    (async () => {
      try {
        const storedId = getStoredWorldCupId();
        if (storedId) {
          try {
            const res = await fetchWorldCupSession(
              storedId,
              controller.signal
            );
            if (cancelled || bootKey !== bootKeyRef.current) return;

            if (res.status === "IN_PROGRESS") {
              applyInProgress(res);
              return;
            }
            if (res.status === "COMPLETED") {
              // Home "다시 하기" (?mode=replay) after a finished cup → new session
              if (mode === "REPLAY") {
                clearWorldCupSession();
              } else {
                applyCompleted(res);
                return;
              }
            } else {
              clearWorldCupSession();
            }
          } catch (err) {
            if (cancelled || (err as Error).name === "AbortError") return;
            clearWorldCupSession();
            if (
              err instanceof ToonaApiError &&
              err.code === "expired_world_cup"
            ) {
              showError(err);
              return;
            }
          }
        }

        await startFreshSession(mode, controller.signal);
      } catch (err) {
        if (cancelled || bootKey !== bootKeyRef.current) return;
        if ((err as Error).name === "AbortError") return;
        showError(err);
      }
    })();

    return () => {
      cancelled = true;
      controller.abort();
      if (bannerTimerRef.current) window.clearTimeout(bannerTimerRef.current);
    };
  }, [
    mode,
    applyCompleted,
    applyInProgress,
    showError,
    startFreshSession,
  ]);

  async function handleChoice(action: WorldCupChoiceAction) {
    if (!worldCupId || !match || submittingRef.current) return;
    submittingRef.current = true;
    setSubmitting(true);
    setHighlight(
      action === "SELECTED_LEFT"
        ? "left"
        : action === "SELECTED_RIGHT"
          ? "right"
          : null
    );

    const prevCompleted = tournament.completedMatches;

    try {
      const res = await submitWorldCupChoice(worldCupId, {
        matchId: match.matchId,
        leftWebtoonId: match.left.id,
        rightWebtoonId: match.right.id,
        action,
      });

      if (action === "UNKNOWN_BOTH") {
        track("world_cup_unknown_both", {
          worldCupId,
          mode: sessionMode,
          round: match.round,
          matchIndex: match.matchIndex,
          completedMatches: res.tournament.completedMatches,
          source: "world-cup",
        });
      } else {
        track("world_cup_webtoon_selected", {
          worldCupId,
          mode: sessionMode,
          round: match.round,
          matchIndex: match.matchIndex,
          action,
          selectedWebtoonId:
            action === "SELECTED_LEFT" ? match.left.id : match.right.id,
          completedMatches: res.tournament.completedMatches,
          source: "world-cup",
        });
      }

      if (
        res.status === "IN_PROGRESS" &&
        res.match.round !== match.round &&
        res.tournament.completedMatches > prevCompleted
      ) {
        track("world_cup_round_completed", {
          worldCupId,
          mode: sessionMode,
          round: match.round,
          completedMatches: res.tournament.completedMatches,
          source: "world-cup",
        });
      }

      if (res.status === "IN_PROGRESS") {
        applyInProgress(res);
        return;
      }
      if (res.status === "COMPLETED") {
        applyCompleted(res);
      }
    } catch (err) {
      setHighlight(null);
      if (
        err instanceof ToonaApiError &&
        (err.code === "invalid_match" ||
          err.code === "duplicate_choice" ||
          err.code === "unknown_not_allowed")
      ) {
        try {
          await resyncSession(worldCupId);
          return;
        } catch (resyncErr) {
          showError(resyncErr);
          return;
        }
      }
      showError(err);
    } finally {
      submittingRef.current = false;
      setSubmitting(false);
    }
  }

  function handleSimilar() {
    if (!winner || continuing) return;
    setContinuing(true);
    track("world_cup_similar_webtoons_clicked", {
      worldCupId,
      winnerWebtoonId: winner.id,
      resultId,
      mode: sessionMode,
      source: "world-cup",
    });
    router.push(
      prepareTasteAnalysis(winner.id, winner.title, {
        source: "world-cup",
        origin: "WORLD_CUP",
        thumbnailUrl: winner.thumbnailUrl,
        platform: String(winner.platform ?? ""),
      })
    );
  }

  async function handleRestart() {
    if (restarting) return;
    setRestarting(true);
    track("world_cup_restarted", {
      worldCupId,
      mode: "REPLAY",
      source: "world-cup",
    });
    setPhase("initializing");
    try {
      await startFreshSession("REPLAY");
    } catch (err) {
      showError(err);
    } finally {
      setRestarting(false);
    }
  }

  async function handleRetryFromError() {
    setPhase("initializing");
    try {
      if (
        errorCode === "invalid_match" ||
        errorCode === "duplicate_choice"
      ) {
        const id = worldCupId ?? getStoredWorldCupId();
        if (id) {
          await resyncSession(id);
          return;
        }
      }
      clearWorldCupSession();
      await startFreshSession(
        errorCode === "expired_world_cup" ? mode : "ACQUISITION"
      );
    } catch (err) {
      showError(err);
    }
  }

  if (phase === "initializing") {
    return <WorldCupSkeleton />;
  }

  if (phase === "error") {
    const storedWinner = getStoredWorldCupWinner();
    return (
      <ErrorState
        fullPage
        code={errorCode}
        title={errorTitle}
        description={errorDescription}
        onRetry={() => void handleRetryFromError()}
        retryLabel={
          errorCode === "insufficient_reserves"
            ? "새 월드컵 시작"
            : "새로 시작하기"
        }
        secondaryAction={
          errorCode === "insufficient_reserves" && match
            ? {
                label: "현재 작품 중 선택하기",
                onClick: () => setPhase("playing"),
              }
            : storedWinner
              ? {
                  label: "결과 화면으로",
                  onClick: () => {
                    setWinner(storedWinner);
                    setPhase("completed");
                  },
                }
              : undefined
        }
      />
    );
  }

  if (phase === "completed" && winner) {
    return (
      <WorldCupWinnerView
        winner={winner}
        continuing={continuing}
        restarting={restarting}
        onSimilar={handleSimilar}
        onRestart={() => void handleRestart()}
      />
    );
  }

  if (phase === "playing" && match) {
    return (
      <WorldCupMatchView
        title={title}
        match={match}
        tournament={tournament}
        submitting={submitting}
        highlight={highlight}
        roundBanner={roundBanner}
        onChoice={(action) => void handleChoice(action)}
      />
    );
  }

  return <WorldCupSkeleton />;
}
