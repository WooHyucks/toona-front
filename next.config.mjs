/** @type {import('next').NextConfig} */
const nextConfig = {
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
