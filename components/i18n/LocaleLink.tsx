"use client";

import Link, { type LinkProps } from "next/link";
import { useLocale } from "@/lib/i18n/LocaleProvider";

type Props = LinkProps &
  Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, keyof LinkProps> & {
    children: React.ReactNode;
  };

/** Next Link that preserves current ?lang= (and other query via hrefWithLang). */
export function LocaleLink({ href, ...rest }: Props) {
  const { hrefWithLang } = useLocale();
  const nextHref =
    typeof href === "string" ? hrefWithLang(href) : href;
  return <Link href={nextHref} {...rest} />;
}
