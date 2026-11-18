export type Locale = "ko" | "en";

export const LOCALES: Locale[] = ["ko", "en"];
export const DEFAULT_LOCALE: Locale = "ko";
export const LANG_COOKIE = "toona_lang";
export const LANG_STORAGE_KEY = "toona_lang";
export const LANG_QUERY = "lang";

export function isLocale(value: string | null | undefined): value is Locale {
  return value === "ko" || value === "en";
}

export function normalizeLocale(
  value: string | null | undefined
): Locale | null {
  if (!value) return null;
  const lower = value.trim().toLowerCase();
  if (lower === "ko" || lower.startsWith("ko-")) return "ko";
  if (lower === "en" || lower.startsWith("en-")) return "en";
  return null;
}
