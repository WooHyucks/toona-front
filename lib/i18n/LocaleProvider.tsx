"use client";

import {
  createContext,
  Suspense,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { getDictionary, translate, withLangParam } from "./index";
import type { Dictionary } from "./ko";
import {
  DEFAULT_LOCALE,
  LANG_COOKIE,
  LANG_QUERY,
  LANG_STORAGE_KEY,
  isLocale,
  type Locale,
} from "./types";

type LocaleContextValue = {
  locale: Locale;
  dict: Dictionary;
  t: (path: string, vars?: Record<string, string | number>) => string;
  setLocale: (next: Locale) => void;
  hrefWithLang: (href: string) => string;
};

const LocaleContext = createContext<LocaleContextValue | null>(null);

function writeCookie(locale: Locale) {
  try {
    document.cookie = `${LANG_COOKIE}=${locale};path=/;max-age=${
      60 * 60 * 24 * 365
    };samesite=lax`;
  } catch {
    /* ignore */
  }
}

function writeStorage(locale: Locale) {
  try {
    localStorage.setItem(LANG_STORAGE_KEY, locale);
  } catch {
    /* Instagram / private mode may block */
  }
}

type Props = {
  initialLocale: Locale;
  children: React.ReactNode;
};

/**
 * Keeps ?lang= in sync. Isolated under Suspense so the tree
 * never blanks while searchParams resolve (FOUC-safe).
 */
function LocaleUrlSync({
  locale,
  setLocaleState,
}: {
  locale: Locale;
  setLocaleState: (next: Locale) => void;
}) {
  const searchParams = useSearchParams();

  useEffect(() => {
    const urlLang = searchParams.get(LANG_QUERY);
    if (isLocale(urlLang) && urlLang !== locale) {
      setLocaleState(urlLang);
      writeCookie(urlLang);
      writeStorage(urlLang);
    }
  }, [searchParams, locale, setLocaleState]);

  return null;
}

export function LocaleProvider({ initialLocale, children }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const [locale, setLocaleState] = useState<Locale>(
    isLocale(initialLocale) ? initialLocale : DEFAULT_LOCALE
  );

  useEffect(() => {
    if (typeof document !== "undefined") {
      document.documentElement.lang = locale === "en" ? "en" : "ko";
    }
  }, [locale]);

  const setLocale = useCallback(
    (next: Locale) => {
      if (!isLocale(next) || next === locale) return;
      setLocaleState(next);
      writeCookie(next);
      writeStorage(next);

      try {
        const params = new URLSearchParams(
          typeof window !== "undefined" ? window.location.search : ""
        );
        params.set(LANG_QUERY, next);
        const qs = params.toString();
        router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
      } catch {
        router.replace(`${pathname}?${LANG_QUERY}=${next}`, { scroll: false });
      }
    },
    [locale, pathname, router]
  );

  const dict = useMemo(() => getDictionary(locale), [locale]);

  const t = useCallback(
    (path: string, vars?: Record<string, string | number>) =>
      translate(dict, path, vars),
    [dict]
  );

  const hrefWithLang = useCallback(
    (href: string) => withLangParam(href, locale),
    [locale]
  );

  const value = useMemo(
    () => ({ locale, dict, t, setLocale, hrefWithLang }),
    [locale, dict, t, setLocale, hrefWithLang]
  );

  return (
    <LocaleContext.Provider value={value}>
      <Suspense fallback={null}>
        <LocaleUrlSync locale={locale} setLocaleState={setLocaleState} />
      </Suspense>
      {children}
    </LocaleContext.Provider>
  );
}

export function useLocale(): LocaleContextValue {
  const ctx = useContext(LocaleContext);
  if (!ctx) {
    const dict = getDictionary(DEFAULT_LOCALE);
    return {
      locale: DEFAULT_LOCALE,
      dict,
      t: (path, vars) => translate(dict, path, vars),
      setLocale: () => undefined,
      hrefWithLang: (href) => href,
    };
  }
  return ctx;
}

export function useT() {
  return useLocale().t;
}
