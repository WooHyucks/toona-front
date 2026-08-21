/** @type {import('next').NextConfig} */
const LOCAL_API_BASE = (
  process.env.TOONA_API_INTERNAL_BASE || "http://127.0.0.1:8000"
).replace(/\/$/, "");

const nextConfig = {
  // Ensure Amplitude key is available to the client bundle at build time.
  env: {
    NEXT_PUBLIC_AMPLITUDE_API_KEY:
      process.env.NEXT_PUBLIC_AMPLITUDE_API_KEY ?? "",
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "image-comic.pstatic.net",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "kr-a.kakaopagecdn.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "page.kakaocdn.net",
        pathname: "/**",
      },
    ],
  },
  async rewrites() {
    // Dev-only proxy so phones on the LAN can use same-origin `/api` + `/content`.
    // Do not proxy Next's own `/api/webtoon` (singular) or `/api/recommend`.
    if (process.env.NODE_ENV === "production") return [];
    return [
      {
        source: "/content/:path*",
        destination: `${LOCAL_API_BASE}/content/:path*`,
      },
      {
        source: "/api/webtoon-actions",
        destination: `${LOCAL_API_BASE}/api/webtoon-actions`,
      },
      {
        source: "/api/webtoon-actions/:path*",
        destination: `${LOCAL_API_BASE}/api/webtoon-actions/:path*`,
      },
      {
        source: "/api/webtoons",
        destination: `${LOCAL_API_BASE}/api/webtoons`,
      },
      {
        source: "/api/webtoons/:path*",
        destination: `${LOCAL_API_BASE}/api/webtoons/:path*`,
      },
      {
        source: "/api/search/:path*",
        destination: `${LOCAL_API_BASE}/api/search/:path*`,
      },
      {
        source: "/api/rankings",
        destination: `${LOCAL_API_BASE}/api/rankings`,
      },
      {
        source: "/api/recommendations",
        destination: `${LOCAL_API_BASE}/api/recommendations`,
      },
      {
        source: "/api/lifetime-webtoons",
        destination: `${LOCAL_API_BASE}/api/lifetime-webtoons`,
      },
      {
        source: "/api/lifetime-webtoons/:path*",
        destination: `${LOCAL_API_BASE}/api/lifetime-webtoons/:path*`,
      },
      {
        source: "/api/world-cup/:path*",
        destination: `${LOCAL_API_BASE}/api/world-cup/:path*`,
      },
    ];
  },
};

export default nextConfig;
