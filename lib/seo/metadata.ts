import type { Metadata } from "next";

/** Production site origin — never use localhost as deployed canonical. */
export function getSiteUrl(): string {
  const raw =
    process.env.NEXT_PUBLIC_SITE_URL?.trim() ||
    process.env.VERCEL_PROJECT_PRODUCTION_URL?.trim();
  if (raw) {
    const withProto = raw.startsWith("http") ? raw : `https://${raw}`;
    return withProto.replace(/\/$/, "");
  }
  if (process.env.NODE_ENV === "development") {
    return "http://localhost:3000";
  }
  // Safe production fallback until NEXT_PUBLIC_SITE_URL is set
  return "https://toona.kr";
}

export const SITE_NAME = "TOONA";

/** Existing static OG asset under /public */
export const DEFAULT_OG_IMAGE_PATH = "/images/meta.png";

/**
 * World-cup dedicated OG is not in the repo yet.
 * Until then we reuse the default asset (real file only).
 */
export const WORLD_CUP_OG_IMAGE_PATH = DEFAULT_OG_IMAGE_PATH;

export const DEFAULT_TITLE =
  "TOONA | 재밌게 본 웹툰과 비슷한 작품 찾기";

export const DEFAULT_DESCRIPTION =
  "재밌게 본 웹툰 하나를 고르면 취향을 분석하고 비슷한 작품을 추천해드려요.";

export function absoluteUrl(pathname: string): string {
  const path = pathname.startsWith("/") ? pathname : `/${pathname}`;
  return `${getSiteUrl()}${path}`;
}

export function absoluteAssetUrl(pathOrUrl: string | null | undefined): string {
  if (!pathOrUrl) return absoluteUrl(DEFAULT_OG_IMAGE_PATH);
  if (/^https?:\/\//i.test(pathOrUrl)) return pathOrUrl;
  return absoluteUrl(pathOrUrl.startsWith("/") ? pathOrUrl : `/${pathOrUrl}`);
}

type BuildMetadataInput = {
  title: string;
  description: string;
  pathname: string;
  /** Path or absolute URL. Defaults to TOONA meta.png */
  image?: string | null;
  /** Optional override for og:title */
  openGraphTitle?: string;
  /** Optional override for og:description */
  openGraphDescription?: string;
  robots?: Metadata["robots"];
  type?: "website" | "article";
};

export function buildPageMetadata(input: BuildMetadataInput): Metadata {
  const url = absoluteUrl(input.pathname);
  const imageUrl = absoluteAssetUrl(input.image ?? DEFAULT_OG_IMAGE_PATH);
  const ogTitle = input.openGraphTitle ?? input.title;
  const ogDescription = input.openGraphDescription ?? input.description;

  return {
    title: {
      absolute: input.title,
    },
    description: input.description,
    applicationName: SITE_NAME,
    alternates: {
      canonical: url,
    },
    robots: input.robots ?? { index: true, follow: true },
    openGraph: {
      title: ogTitle,
      description: ogDescription,
      url,
      siteName: SITE_NAME,
      locale: "ko_KR",
      type: input.type ?? "website",
      images: [
        {
          url: imageUrl,
          alt: ogTitle,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: ogTitle,
      description: ogDescription,
      images: [imageUrl],
    },
  };
}
