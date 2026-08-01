"use client";

import { useCallback, useEffect, useState } from "react";

const SAVED_KEY = "toona.saved.webtoonIds";

export function useSavedWebtoons() {
  const [savedIds, setSavedIds] = useState<string[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(SAVED_KEY);
      setSavedIds(raw ? (JSON.parse(raw) as string[]) : []);
    } catch {
      setSavedIds([]);
    } finally {
      setReady(true);
    }
  }, []);

  const persist = useCallback((ids: string[]) => {
    setSavedIds(ids);
    localStorage.setItem(SAVED_KEY, JSON.stringify(ids));
  }, []);

  const toggleSave = useCallback(
    (id: string) => {
      persist(
        savedIds.includes(id)
          ? savedIds.filter((item) => item !== id)
          : [...savedIds, id]
      );
    },
    [persist, savedIds]
  );

  const isSaved = useCallback(
    (id: string) => savedIds.includes(id),
    [savedIds]
  );

  return { savedIds, ready, toggleSave, isSaved };
}
