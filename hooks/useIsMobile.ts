"use client";

import { useEffect, useState } from "react";
import { isMobileUserAgent } from "@/lib/naver-webtoon";

/** Client-only after mount to avoid SSR/hydration mismatch. */
export function useIsMobile(): boolean {
  const [mobile, setMobile] = useState(false);

  useEffect(() => {
    setMobile(isMobileUserAgent());
  }, []);

  return mobile;
}
