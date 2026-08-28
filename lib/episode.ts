import type { WebtoonStatus } from "@/types/api";

export type EpisodeLabelInput = {
  status: WebtoonStatus | string | null | undefined;
  latestEpisodeNumber?: number | null;
  totalEpisodeCount?: number | null;
};

function normalizeStatus(
  status: EpisodeLabelInput["status"]
): WebtoonStatus | null {
  if (!status) return null;
  const upper = String(status).toUpperCase();
  if (upper === "COMPLETED") return "COMPLETED";
  if (upper === "ONGOING") return "ONGOING";
  if (upper === "HIATUS") return "HIATUS";
  return null;
}

/**
 * Compose episode display label from status + API numbers.
 * Never invents numbers — returns null when nothing meaningful can be shown.
 */
export function getEpisodeLabel({
  status,
  latestEpisodeNumber,
  totalEpisodeCount,
}: EpisodeLabelInput): string | null {
  const normalized = normalizeStatus(status);
  const latest =
    typeof latestEpisodeNumber === "number" && Number.isFinite(latestEpisodeNumber)
      ? latestEpisodeNumber
      : null;
  const total =
    typeof totalEpisodeCount === "number" && Number.isFinite(totalEpisodeCount)
      ? totalEpisodeCount
      : null;

  if (normalized === "COMPLETED") {
    if (total != null) return `총 ${total}화`;
    if (latest != null) return `${latest}화 완결`;
    return "완결";
  }

  if (normalized === "ONGOING") {
    if (latest != null) return `${latest}화까지`;
    return "연재 중";
  }

  if (normalized === "HIATUS") {
    if (latest != null) return `휴재 · ${latest}화`;
    return "휴재 중";
  }

  if (latest != null) return `${latest}화`;
  if (total != null) return `총 ${total}화`;
  return null;
}

function asFiniteNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return null;
}

/** User-facing status only when the API value is known. Never invents. */
export function serializationStatusLabel(
  status: string | null | undefined
): "연재중" | "완결" | "휴재" | null {
  if (!status) return null;
  const raw = String(status).trim();
  if (!raw || raw.toLowerCase() === "unknown") return null;
  const upper = raw.toUpperCase();
  if (raw === "연재중" || upper === "ONGOING" || upper === "SERIALIZING") {
    return "연재중";
  }
  if (raw === "완결" || upper === "COMPLETED" || upper === "COMPLETE") {
    return "완결";
  }
  if (raw === "휴재" || upper === "HIATUS") return "휴재";
  return null;
}

/**
 * BEST/alternative card meta: `196화 · 연재중` / `57화 · 완결`.
 * Prefers explicit episodeCount + serializationStatus, then older fields.
 */
export function getEpisodeStatusLine(input: {
  episodeCount?: number | string | null;
  serializationStatus?: string | null;
  status?: WebtoonStatus | string | null;
  latestEpisodeNumber?: number | string | null;
  totalEpisodeCount?: number | string | null;
}): string | null {
  const count =
    asFiniteNumber(input.episodeCount) ??
    asFiniteNumber(input.totalEpisodeCount) ??
    asFiniteNumber(input.latestEpisodeNumber);
  const status = serializationStatusLabel(
    input.serializationStatus ?? input.status
  );
  if (count != null && status) return `${count}화 · ${status}`;
  if (count != null) return `${count}화`;
  if (status) return status;
  return null;
}
