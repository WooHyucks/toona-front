import type { WorldCupMode, WorldCupWebtoon } from "@/types/api";

const WORLD_CUP_ID_KEY = "toona_world_cup_id";
const WORLD_CUP_WINNER_KEY = "toona_world_cup_winner";
const WORLD_CUP_MODE_KEY = "toona_world_cup_mode";
const WORLD_CUP_RESULT_KEY = "toona_world_cup_result_id";

export function getStoredWorldCupId(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return sessionStorage.getItem(WORLD_CUP_ID_KEY);
  } catch {
    return null;
  }
}

export function setStoredWorldCupId(worldCupId: string) {
  try {
    sessionStorage.setItem(WORLD_CUP_ID_KEY, worldCupId);
  } catch {
    /* ignore */
  }
}

export function getStoredWorldCupMode(): WorldCupMode | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(WORLD_CUP_MODE_KEY);
    if (raw === "ACQUISITION" || raw === "REPLAY") return raw;
    return null;
  } catch {
    return null;
  }
}

export function setStoredWorldCupMode(mode: WorldCupMode) {
  try {
    sessionStorage.setItem(WORLD_CUP_MODE_KEY, mode);
  } catch {
    /* ignore */
  }
}

export function getStoredWorldCupWinner(): WorldCupWebtoon | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(WORLD_CUP_WINNER_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as WorldCupWebtoon;
  } catch {
    return null;
  }
}

export function setStoredWorldCupWinner(winner: WorldCupWebtoon) {
  try {
    sessionStorage.setItem(WORLD_CUP_WINNER_KEY, JSON.stringify(winner));
  } catch {
    /* ignore */
  }
}

export function getStoredWorldCupResultId(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return sessionStorage.getItem(WORLD_CUP_RESULT_KEY);
  } catch {
    return null;
  }
}

export function setStoredWorldCupResultId(resultId: string) {
  try {
    sessionStorage.setItem(WORLD_CUP_RESULT_KEY, resultId);
  } catch {
    /* ignore */
  }
}

export function clearWorldCupSession() {
  try {
    sessionStorage.removeItem(WORLD_CUP_ID_KEY);
    sessionStorage.removeItem(WORLD_CUP_WINNER_KEY);
    sessionStorage.removeItem(WORLD_CUP_MODE_KEY);
    sessionStorage.removeItem(WORLD_CUP_RESULT_KEY);
  } catch {
    /* ignore */
  }
}
