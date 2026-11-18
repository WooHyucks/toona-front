import { getDictionary, type Locale } from "@/lib/i18n";
import { DEFAULT_LOCALE } from "@/lib/i18n/types";

function dictFor(locale?: Locale) {
  return getDictionary(locale ?? DEFAULT_LOCALE);
}

export function findPlatformLabel(
  platform: string | null | undefined,
  locale?: Locale
): string {
  const upper = platform?.trim().toUpperCase();
  if (!upper) return "";
  const d = dictFor(locale).platform;
  if (upper === "NAVER") return d.NAVER;
  if (upper === "KAKAO") return d.KAKAO;
  if (upper === "KAKAO_PAGE" || upper === "KAKAOPAGE") return d.KAKAO_PAGE;
  if (upper === "LEZHIN") return d.LEZHIN;
  if (upper === "BOMTOON") return d.BOMTOON;
  if (upper === "RIDI") return d.RIDI;
  if (upper === "OTHER") return "";
  return platform?.trim() ?? "";
}

export function findOfficialCtaLabel(
  platform: string | null | undefined,
  locale?: Locale
): string {
  const d = dictFor(locale);
  const label = findPlatformLabel(platform, locale);
  if (label) return d.platform.viewOn.replace("{platform}", label);
  return d.platform.officialView;
}
