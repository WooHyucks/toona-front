import { cn } from "@/lib/utils";

const CDN_HOSTS = [
  "image-comic.pstatic.net",
  "kr-a.kakaopagecdn.com",
  "page.kakaocdn.net",
];

function shouldBypassOptimizer(src: string): boolean {
  try {
    const { hostname } = new URL(src);
    return CDN_HOSTS.some(
      (host) => hostname === host || hostname.endsWith(`.${host}`),
    );
  } catch {
    return false;
  }
}

type WebtoonCoverProps = {
  src: string | null | undefined;
  alt?: string;
  className?: string;
  fill?: boolean;
  sizes?: string;
  priority?: boolean;
};

export function WebtoonCover({
  src,
  alt = "",
  className,
  fill = false,
  priority = false,
}: WebtoonCoverProps) {
  if (!src) {
    return (
      <div
        className={cn(fill && "absolute inset-0", "bg-elevated", className)}
        aria-hidden={!alt}
      />
    );
  }

  const loading = priority ? "eager" : "lazy";

  // Naver/Kakao CDN blocks Next.js image optimizer (server fetch → 403).
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      referrerPolicy="no-referrer"
      loading={loading}
      decoding="async"
      className={cn(
        fill && "absolute inset-0 h-full w-full",
        "object-cover object-top",
        className,
      )}
      data-bypass-optimizer={shouldBypassOptimizer(src) ? "1" : undefined}
    />
  );
}
