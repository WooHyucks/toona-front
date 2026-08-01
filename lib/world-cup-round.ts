import type { WorldCupRound, WorldCupTournament } from "@/types/api";

export function roundLabel(round: WorldCupRound | null | undefined): string {
  switch (round) {
    case "ROUND_OF_16":
      return "16강";
    case "QUARTER_FINAL":
      return "8강";
    case "SEMI_FINAL":
      return "4강";
    case "FINAL":
      return "결승";
    default:
      return "월드컵";
  }
}

/** e.g. "16강 · 1/8", "결승" */
export function formatRoundProgress(params: {
  round: WorldCupRound | null | undefined;
  matchIndex: number | null | undefined;
}): string {
  const { round, matchIndex } = params;
  const idx = (matchIndex ?? 0) + 1;
  switch (round) {
    case "ROUND_OF_16":
      return `16강 · ${idx}/8`;
    case "QUARTER_FINAL":
      return `8강 · ${idx}/4`;
    case "SEMI_FINAL":
      return `4강 · ${idx}/2`;
    case "FINAL":
      return "결승";
    default:
      return roundLabel(round);
  }
}

export function tournamentBar(tournament: WorldCupTournament): {
  completed: number;
  total: number;
  ratio: number;
} {
  const completed = tournament.completedMatches ?? 0;
  const total = tournament.totalMatches || 15;
  return {
    completed,
    total,
    ratio: total > 0 ? Math.min(1, Math.max(0, completed / total)) : 0,
  };
}

/** Short banner when round advances */
export function nextRoundBanner(
  from: WorldCupRound | null | undefined,
  to: WorldCupRound | null | undefined
): string | null {
  if (!from || !to || from === to) return null;
  if (to === "QUARTER_FINAL") return "이제 8강이에요";
  if (to === "SEMI_FINAL") return "이제 4강이에요";
  if (to === "FINAL") return "결승이에요";
  return null;
}
