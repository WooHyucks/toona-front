"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";
import { AnimatePresence } from "framer-motion";
import { WebtoonBottomSheet } from "@/features/webtoons/components/WebtoonBottomSheet";
import type { Webtoon } from "@/features/webtoons/model";

type WebtoonSheetContextValue = {
  openWebtoon: (webtoon: Webtoon) => void;
};

const WebtoonSheetContext = createContext<WebtoonSheetContextValue | null>(
  null
);

export function WebtoonSheetProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sheet, setSheet] = useState<Webtoon | null>(null);

  const openWebtoon = useCallback((webtoon: Webtoon) => {
    setSheet(webtoon);
  }, []);

  const value = useMemo(() => ({ openWebtoon }), [openWebtoon]);

  return (
    <WebtoonSheetContext.Provider value={value}>
      {children}
      <AnimatePresence>
        {sheet ? (
          <WebtoonBottomSheet webtoon={sheet} onClose={() => setSheet(null)} />
        ) : null}
      </AnimatePresence>
    </WebtoonSheetContext.Provider>
  );
}

export function useWebtoonSheet() {
  const context = useContext(WebtoonSheetContext);
  if (!context) {
    throw new Error("useWebtoonSheet must be used within WebtoonSheetProvider");
  }
  return context;
}
