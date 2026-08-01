import { fetchWebtoons } from "@/lib/api/webtoons";
import { mapListItemToWebtoon } from "@/lib/api/mappers";
import type { Webtoon } from "@/features/webtoons/model";

/** FastAPI-backed webtoon list (replaces Supabase direct query). */
export async function getWebtoons(limit = 100): Promise<Webtoon[]> {
  const res = await fetchWebtoons({ limit });
  return res.items.map(mapListItemToWebtoon);
}
