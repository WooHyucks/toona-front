const VIDEO_ID_RE = /^[\w-]{11}$/;

function isVideoId(value: string | null | undefined): boolean {
  return Boolean(value && VIDEO_ID_RE.test(value));
}

/**
 * Safely extract a YouTube video id from watch / youtu.be / shorts / embed URLs.
 */
export function extractYoutubeVideoId(
  url: string | null | undefined
): string | null {
  if (!url) return null;
  const trimmed = url.trim();
  if (!trimmed) return null;
  if (isVideoId(trimmed)) return trimmed;

  try {
    const parsed = new URL(trimmed);
    const host = parsed.hostname.replace(/^www\./, "").toLowerCase();

    if (host === "youtu.be") {
      const id = parsed.pathname.split("/").filter(Boolean)[0] ?? "";
      return isVideoId(id) ? id : null;
    }

    const isYoutube =
      host === "youtube.com" ||
      host === "m.youtube.com" ||
      host === "music.youtube.com" ||
      host === "youtube-nocookie.com" ||
      host.endsWith(".youtube.com");
    if (!isYoutube) return null;

    const fromQuery = parsed.searchParams.get("v")?.trim() ?? "";
    if (isVideoId(fromQuery)) return fromQuery;

    const parts = parsed.pathname.split("/").filter(Boolean);
    if (
      (parts[0] === "shorts" ||
        parts[0] === "embed" ||
        parts[0] === "live" ||
        parts[0] === "v") &&
      isVideoId(parts[1])
    ) {
      return parts[1] ?? null;
    }
  } catch {
    /* fall through */
  }

  const watch = trimmed.match(/[?&]v=([\w-]{11})/);
  if (watch?.[1]) return watch[1];
  const short = trimmed.match(/youtu\.be\/([\w-]{11})/);
  if (short?.[1]) return short[1];
  const shorts = trimmed.match(/\/shorts\/([\w-]{11})/);
  if (shorts?.[1]) return shorts[1];
  return null;
}

export function isYoutubeShortsUrl(url: string | null | undefined): boolean {
  if (!url) return false;
  try {
    const parsed = new URL(url.trim());
    return parsed.pathname.toLowerCase().includes("/shorts/");
  } catch {
    return /youtube\.com\/shorts\//i.test(url);
  }
}

export function youtubeEmbedUrl(videoId: string): string {
  return `https://www.youtube.com/embed/${encodeURIComponent(videoId)}`;
}

export function youtubeWatchUrl(videoId: string): string {
  return `https://www.youtube.com/watch?v=${encodeURIComponent(videoId)}`;
}

export function youtubeThumbnailUrl(videoId: string): string {
  return `https://i.ytimg.com/vi/${encodeURIComponent(videoId)}/hqdefault.jpg`;
}

export function resolveYoutubeVideoId(review: {
  videoId?: string | null;
  videoUrl?: string | null;
}): string | null {
  if (isVideoId(review.videoId?.trim())) return review.videoId!.trim();
  return extractYoutubeVideoId(review.videoUrl);
}
