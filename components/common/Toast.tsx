"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export function Toast({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed bottom-24 left-1/2 z-50 max-w-[90vw] -translate-x-1/2 rounded-xl bg-foreground px-4 py-2.5 text-[13px] font-medium text-background shadow-lg md:bottom-8"
    >
      {message}
    </div>
  );
}

export function useToast(durationMs = 2400) {
  const [message, setMessage] = useState<string | null>(null);
  const timer = useRef<number | null>(null);

  const showToast = useCallback(
    (next: string) => {
      setMessage(next);
      if (timer.current) window.clearTimeout(timer.current);
      timer.current = window.setTimeout(() => setMessage(null), durationMs);
    },
    [durationMs]
  );

  useEffect(() => {
    return () => {
      if (timer.current) window.clearTimeout(timer.current);
    };
  }, []);

  return { toast: message, showToast };
}
