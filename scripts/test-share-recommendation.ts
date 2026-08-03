/**
 * Smoke tests for shareRecommendationResult (no Jest).
 * Run: npx --yes tsx scripts/test-share-recommendation.ts
 */
import assert from "node:assert/strict";
import { shareRecommendationResult } from "../lib/share/recommendation";
import {
  recommendationHref,
  recommendationResultPath,
  recommendationShareUrl,
} from "../lib/recommendations-path";

async function main() {
  assert.equal(recommendationResultPath("abc"), "/recommendations/abc");
  assert.equal(
    recommendationHref("abc", { source: "world-cup" }),
    "/recommendations/abc?source=world-cup"
  );
  assert.ok(recommendationShareUrl("abc").includes("/recommendations/abc"));
  assert.ok(recommendationShareUrl("abc").includes("source=share"));

  {
    // @ts-expect-error intentional SSR
    delete globalThis.window;
    const outcome = await shareRecommendationResult({
      sourceTitle: "화산귀환",
      sourceWebtoonId: "w1",
      shareUrl: "https://toona.kr/recommendations/w1?source=share",
    });
    assert.equal(outcome, "failed");
  }

  {
    const calls: string[] = [];
    Object.defineProperty(globalThis, "window", {
      value: {},
      configurable: true,
    });
    Object.defineProperty(globalThis, "navigator", {
      value: {
        share: async () => {
          calls.push("share");
        },
        canShare: () => true,
      },
      configurable: true,
    });
    const outcome = await shareRecommendationResult({
      sourceTitle: "화산귀환",
      sourceWebtoonId: "w1",
      shareUrl: "https://toona.kr/recommendations/w1?source=share",
    });
    assert.equal(outcome, "shared");
    assert.deepEqual(calls, ["share"]);
  }

  {
    Object.defineProperty(globalThis, "navigator", {
      value: {
        share: async () => {
          const err = new Error("dismissed");
          err.name = "AbortError";
          throw err;
        },
        canShare: () => true,
      },
      configurable: true,
    });
    const outcome = await shareRecommendationResult({
      sourceTitle: "화산귀환",
      sourceWebtoonId: "w1",
      shareUrl: "https://example.com/r",
    });
    assert.equal(outcome, "cancelled");
  }

  {
    let copied = "";
    Object.defineProperty(globalThis, "navigator", {
      value: {
        clipboard: {
          writeText: async (t: string) => {
            copied = t;
          },
        },
      },
      configurable: true,
    });
    const outcome = await shareRecommendationResult({
      sourceTitle: "화산귀환",
      sourceWebtoonId: "w1",
      shareUrl: "https://example.com/r",
    });
    assert.equal(outcome, "copied");
    assert.equal(copied, "https://example.com/r");
  }

  console.log("shareRecommendationResult tests passed");
}

void main();
