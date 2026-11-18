import { cookies, headers } from "next/headers";
import { getDictionary, resolveLocale } from "./index";
import {
  DEFAULT_LOCALE,
  LANG_COOKIE,
  LANG_QUERY,
  isLocale,
  type Locale,
} from "./types";

export async function getRequestLocale(): Promise<Locale> {
  const headerStore = headers();
  const fromMiddleware = headerStore.get("x-toona-locale");
  if (isLocale(fromMiddleware)) return fromMiddleware;

  const cookieStore = cookies();
  const cookieLang = cookieStore.get(LANG_COOKIE)?.value;
  const accept = headerStore.get("accept-language");

  // URL lang is applied in middleware → cookie/header; still resolve safely.
  return resolveLocale({
    urlLang: null,
    storedLang: cookieLang,
    acceptLanguage: accept,
  });
}

export async function getServerDictionary() {
  const locale = await getRequestLocale();
  return { locale, dict: getDictionary(locale) };
}

export function readUrlLangFromSearchParams(
  searchParams: Record<string, string | string[] | undefined> | undefined
): Locale | null {
  if (!searchParams) return null;
  const raw = searchParams[LANG_QUERY];
  const value = Array.isArray(raw) ? raw[0] : raw;
  return isLocale(value) ? value : null;
}

export { DEFAULT_LOCALE };
