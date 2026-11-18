"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { useReducedMotion } from "framer-motion";
import { useT } from "@/lib/i18n/LocaleProvider";

export function FindLoading() {
  const t = useT();
  const reduceMotion = useReducedMotion();
  const copies = [t("find.loadingFollow"), t("find.loadingSearch")];
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const id = window.setInterval(() => {
      setIndex((prev) => (prev + 1) % copies.length);
    }, 2200);
    return () => window.clearInterval(id);
  }, [copies.length]);

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
        {copies[index]}
      </p>
    </div>
  );
}
