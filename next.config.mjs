/** @type {import('next').NextConfig} */
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
};

export default nextConfig;
