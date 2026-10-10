"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { useReducedMotion } from "framer-motion";

const COPIES = [
  "기억을 따라가고 있어요...",
  "비슷한 웹툰을 찾고 있어요...",
];

export function FindLoading() {
  const reduceMotion = useReducedMotion();
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const id = window.setInterval(() => {
      setIndex((prev) => (prev + 1) % COPIES.length);
    }, 2200);
    return () => window.clearInterval(id);
  }, []);

  return (
    <div
      className="flex min-h-[48vh] flex-col items-center justify-center px-6 text-center"
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <Loader2
        className={
          reduceMotion
            ? "h-6 w-6 text-primary"
            : "h-6 w-6 animate-spin text-primary"
        }
        aria-hidden
      />
      <p className="mt-5 text-[16px] font-semibold tracking-[-0.02em] text-foreground">
        {COPIES[index]}
      </p>
    </div>
  );
}
