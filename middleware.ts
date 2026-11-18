import { NextResponse, type NextRequest } from "next/server";
import {
  DEFAULT_LOCALE,
  LANG_COOKIE,
  LANG_QUERY,
  isLocale,
  normalizeLocale,
  type Locale,
} from "@/lib/i18n/types";

function localeFromAcceptLanguage(header: string | null): Locale | null {
  if (!header) return null;
  const first = header.split(",")[0]?.trim();
  return normalizeLocale(first);
}

/**
 * Decide locale early for Instagram in-app WebView:
 * URL ?lang= wins, then cookie, then Accept-Language, then ko.
 * Sets cookie so SSR html lang / client provider stay aligned (reduces FOUC).
 */
export function middleware(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const urlLang = searchParams.get(LANG_QUERY);
  const cookieLang = request.cookies.get(LANG_COOKIE)?.value;
  const accept = request.headers.get("accept-language");

  let locale: Locale = DEFAULT_LOCALE;
  if (isLocale(urlLang)) {
    locale = urlLang;
  } else if (isLocale(cookieLang)) {
    locale = cookieLang;
  } else {
    locale = localeFromAcceptLanguage(accept) ?? DEFAULT_LOCALE;
  }

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-toona-locale", locale);

  const response = NextResponse.next({
    request: { headers: requestHeaders },
  });

  const existing = request.cookies.get(LANG_COOKIE)?.value;
  if (existing !== locale) {
    response.cookies.set(LANG_COOKIE, locale, {
      path: "/",
      maxAge: 60 * 60 * 24 * 365,
      sameSite: "lax",
    });
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all paths except static assets / Next internals.
     */
    "/((?!_next/static|_next/image|favicon.ico|images/|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
