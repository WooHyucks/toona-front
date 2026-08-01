/**
 * Lightweight Node smoke tests for recentTasteSource (no Jest).
 * Run: npx --yes tsx scripts/test-recent-taste-source.ts
 */
import assert from "node:assert/strict";
import {
  RECENT_TASTE_SOURCE_KEY,
  RECENT_TASTE_SOURCE_TTL_DAYS,
  clearRecentTasteSource,
  getRecentTasteSource,
  isRecentTasteSourceValid,
  setRecentTasteSource,
} from "../lib/recentTasteSource";

type Store = Map<string, string>;

function mockBrowser(store: Store) {
  const localStorage = {
    getItem: (k: string) => (store.has(k) ? store.get(k)! : null),
    setItem: (k: string, v: string) => {
      store.set(k, v);
    },
    removeItem: (k: string) => {
      store.delete(k);
    },
  };
  Object.defineProperty(globalThis, "window", {
    value: { localStorage },
    configurable: true,
  });
  Object.defineProperty(globalThis, "localStorage", {
    value: localStorage,
    configurable: true,
  });
}

function resetStore(): Store {
  const store = new Map<string, string>();
  mockBrowser(store);
  return store;
}

function daysAgoIso(days: number): string {
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
}

const base = {
  webtoonId: "w1",
  title: "화산귀환",
  thumbnailUrl: "https://example.com/a.jpg",
  platform: "NAVER" as const,
  source: "HOME" as const,
};

assert.equal(isRecentTasteSourceValid(null), false);
assert.equal(isRecentTasteSourceValid({}), false);
assert.equal(
  isRecentTasteSourceValid({
    ...base,
    updatedAt: "not-a-date",
  }),
  false
);
assert.equal(
  isRecentTasteSourceValid({
    ...base,
    updatedAt: new Date().toISOString(),
  }),
  true
);

{
  const store = resetStore();
  setRecentTasteSource(base);
  const got = getRecentTasteSource();
  assert.ok(got);
  assert.equal(got.webtoonId, "w1");
  assert.equal(got.title, "화산귀환");
  assert.equal(got.source, "HOME");
  assert.ok(store.has(RECENT_TASTE_SOURCE_KEY));
}

{
  resetStore();
  setRecentTasteSource(base);
  clearRecentTasteSource();
  assert.equal(getRecentTasteSource(), null);
}

{
  const store = resetStore();
  store.set(RECENT_TASTE_SOURCE_KEY, "{not-json");
  assert.equal(getRecentTasteSource(), null);
  assert.equal(store.has(RECENT_TASTE_SOURCE_KEY), false);
}

{
  const store = resetStore();
  store.set(
    RECENT_TASTE_SOURCE_KEY,
    JSON.stringify({ webtoonId: "w1", updatedAt: new Date().toISOString() })
  );
  assert.equal(getRecentTasteSource(), null);
  assert.equal(store.has(RECENT_TASTE_SOURCE_KEY), false);
}

{
  resetStore();
  setRecentTasteSource({
    ...base,
    updatedAt: daysAgoIso(RECENT_TASTE_SOURCE_TTL_DAYS - 1),
  });
  assert.ok(getRecentTasteSource());
}

{
  const store = resetStore();
  setRecentTasteSource({
    ...base,
    updatedAt: daysAgoIso(RECENT_TASTE_SOURCE_TTL_DAYS + 1),
  });
  assert.equal(getRecentTasteSource(), null);
  assert.equal(store.has(RECENT_TASTE_SOURCE_KEY), false);
}

{
  // SSR: no window
  // @ts-expect-error intentional
  delete globalThis.window;
  Object.defineProperty(globalThis, "localStorage", {
    value: undefined,
    configurable: true,
  });
  assert.equal(getRecentTasteSource(), null);
  setRecentTasteSource(base); // must not throw
}

console.log("recentTasteSource tests passed");
