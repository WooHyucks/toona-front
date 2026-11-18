import { en } from "./en";
import { ko, type Dictionary } from "./ko";
import {
  DEFAULT_LOCALE,
  isLocale,
  normalizeLocale,
  type Locale,
} from "./types";

export type { Dictionary, Locale };
export {
  DEFAULT_LOCALE,
  LANG_COOKIE,
  LANG_QUERY,
  LANG_STORAGE_KEY,
  LOCALES,
  isLocale,
  normalizeLocale,
} from "./types";

const dictionaries: Record<Locale, Dictionary> = { ko, en };

export function getDictionary(locale: Locale): Dictionary {
  return dictionaries[locale] ?? dictionaries[DEFAULT_LOCALE];
}

type NestedValue = string | { [key: string]: NestedValue };

function getPath(dict: Dictionary, path: string): string | undefined {
  const parts = path.split(".");
  let cur: NestedValue = dict as unknown as NestedValue;
  for (const part of parts) {
    if (cur == null || typeof cur !== "object") return undefined;
    cur = (cur as Record<string, NestedValue>)[part];
  }
  return typeof cur === "string" ? cur : undefined;
}

export function translate(
  dict: Dictionary,
  path: string,
  vars?: Record<string, string | number>
): string {
  const raw = getPath(dict, path) ?? getPath(ko, path) ?? path;
  if (!vars) return raw;
  return Object.entries(vars).reduce(
    (text, [key, value]) =>
      text.replaceAll(`{${key}}`, String(value ?? "")),
    raw
  );
}

/**
 * Priority:
 * 1. URL ?lang=
 * 2. stored/cookie preference
 * 3. browser Accept-Language / navigator
 * 4. default ko
 */
export function resolveLocale(input: {
  urlLang?: string | null;
  storedLang?: string | null;
  acceptLanguage?: string | null;
}): Locale {
  if (isLocale(input.urlLang)) return input.urlLang;
  const fromUrl = normalizeLocale(input.urlLang);
  if (fromUrl) return fromUrl;

  if (isLocale(input.storedLang)) return input.storedLang;
  const fromStored = normalizeLocale(input.storedLang);
  if (fromStored) return fromStored;

  const accept = input.acceptLanguage?.split(",")[0]?.trim();
  const fromBrowser = normalizeLocale(accept);
  if (fromBrowser) return fromBrowser;

  return DEFAULT_LOCALE;
}

export function localeToHtmlLang(locale: Locale): string {
  return locale === "en" ? "en" : "ko";
}

export function localeToOgLocale(locale: Locale): string {
  return locale === "en" ? "en_US" : "ko_KR";
}

/** Preserve existing query (incl. UTM) while setting/removing lang. */
export function withLangParam(
  href: string,
  locale: Locale,
  options?: { dropDefault?: boolean }
): string {
  const dropDefault = options?.dropDefault ?? false;
  try {
    const base =
      typeof window !== "undefined"
        ? window.location.origin
        : "https://toona.shop";
    const url = new URL(href, base);
    if (dropDefault && locale === DEFAULT_LOCALE) {
      url.searchParams.delete("lang");
    } else {
      url.searchParams.set("lang", locale);
    }
    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    const join = href.includes("?") ? "&" : "?";
    if (dropDefault && locale === DEFAULT_LOCALE) return href;
    return `${href}${join}lang=${locale}`;
  }
}
