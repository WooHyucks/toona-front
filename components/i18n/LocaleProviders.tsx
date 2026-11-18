"use client";

import { LocaleProvider } from "@/lib/i18n/LocaleProvider";
import type { Locale } from "@/lib/i18n/types";

type Props = {
  initialLocale: Locale;
  children: React.ReactNode;
};

/** SSR-resolved locale from middleware → first paint matches ?lang= / cookie. */
export function LocaleProviders({ initialLocale, children }: Props) {
  return (
    <LocaleProvider initialLocale={initialLocale}>{children}</LocaleProvider>
  );
}
