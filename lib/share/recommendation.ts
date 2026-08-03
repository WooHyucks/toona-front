export type ShareOutcome = "shared" | "copied" | "cancelled" | "failed";

export type ShareRecommendationInput = {
  sourceTitle: string;
  sourceWebtoonId: string;
  shareUrl: string;
};

function isAbortError(err: unknown): boolean {
  if (!err || typeof err !== "object") return false;
  const e = err as { name?: string };
  return e.name === "AbortError";
}

async function copyToClipboard(text: string): Promise<boolean> {
  if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      /* fall through */
    }
  }

  if (typeof document === "undefined") return false;

  try {
    const input = document.createElement("textarea");
    input.value = text;
    input.setAttribute("readonly", "");
    input.style.position = "fixed";
    input.style.left = "-9999px";
    document.body.appendChild(input);
    input.select();
    const ok = document.execCommand("copy");
    document.body.removeChild(input);
    return ok;
  } catch {
    return false;
  }
}

/**
 * Prefer Web Share API; fall back to clipboard.
 * AbortError (user dismisses sheet) → "cancelled" — no error toast.
 */
export async function shareRecommendationResult(
  input: ShareRecommendationInput
): Promise<ShareOutcome> {
  if (typeof window === "undefined") return "failed";

  const title = `${input.sourceTitle}과 비슷한 웹툰 추천`;
  const text = `${input.sourceTitle} 좋아하면 이것도 재밌을 것 같아.`;
  const data: ShareData = {
    title,
    text,
    url: input.shareUrl,
  };

  const canNativeShare =
    typeof navigator.share === "function" &&
    (typeof navigator.canShare !== "function" || navigator.canShare(data));

  if (canNativeShare) {
    try {
      await navigator.share(data);
      return "shared";
    } catch (err) {
      if (isAbortError(err)) return "cancelled";
      // Fall through to clipboard
    }
  }

  const copied = await copyToClipboard(input.shareUrl);
  return copied ? "copied" : "failed";
}
