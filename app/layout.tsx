import type { Metadata, Viewport } from "next";
import { Inter, Noto_Sans_KR } from "next/font/google";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AmplitudeInit } from "@/components/analytics/AmplitudeInit";
import { LocaleProviders } from "@/components/i18n/LocaleProviders";
import {
  DEFAULT_DESCRIPTION,
  DEFAULT_OG_IMAGE_PATH,
  DEFAULT_TITLE,
  SITE_NAME,
  absoluteAssetUrl,
  getSiteUrl,
} from "@/lib/seo/metadata";
import { getDictionary } from "@/lib/i18n";
import {
  localeToHtmlLang,
  localeToOgLocale,
} from "@/lib/i18n";
import { getRequestLocale } from "@/lib/i18n/server";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  weight: ["300", "400", "500", "600", "700"],
});

const notoSansKr = Noto_Sans_KR({
  subsets: ["latin"],
  variable: "--font-noto",
  weight: ["300", "400", "500", "700"],
});

const defaultOg = absoluteAssetUrl(DEFAULT_OG_IMAGE_PATH);

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getRequestLocale();
  const dict = getDictionary(locale);
  return {
    metadataBase: new URL(getSiteUrl()),
    title: dict.seo.defaultTitle || DEFAULT_TITLE,
    description: dict.seo.defaultDescription || DEFAULT_DESCRIPTION,
    applicationName: SITE_NAME,
    robots: { index: true, follow: true },
    icons: {
      icon: "/images/favicon.ico",
    },
    openGraph: {
      type: "website",
      siteName: SITE_NAME,
      locale: localeToOgLocale(locale),
      title: dict.seo.defaultTitle || DEFAULT_TITLE,
      description: dict.seo.defaultDescription || DEFAULT_DESCRIPTION,
      images: [{ url: defaultOg, alt: SITE_NAME }],
    },
    twitter: {
      card: "summary_large_image",
      title: dict.seo.defaultTitle || DEFAULT_TITLE,
      description: dict.seo.defaultDescription || DEFAULT_DESCRIPTION,
      images: [defaultOg],
    },
  };
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getRequestLocale();

  return (
    <html lang={localeToHtmlLang(locale)}>
      <body
        className={`${inter.variable} ${notoSansKr.variable} min-h-[100dvh] bg-background font-sans text-foreground`}
      >
        <AmplitudeInit />
        <LocaleProviders initialLocale={locale}>
          <TooltipProvider delayDuration={200}>{children}</TooltipProvider>
        </LocaleProviders>
      </body>
    </html>
  );
}
