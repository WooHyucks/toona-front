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
