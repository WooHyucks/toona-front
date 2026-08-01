export type Webtoon = {
  id: string;
  title: string;
  author: string | null;
  thumb_url: string | null;
  link: string | null;
  day_of_week: string;
  platform: string;
  genre: string | null;
  rank: number | null;
  /** mock field — 상세 소개는 추후 DB 연동 */
  description?: string | null;
  status?: "ongoing" | "completed" | null;
};

export const GENRE_ORDER = [
  "Fantasy",
  "Romance",
  "Action",
  "Drama",
  "Comedy",
  "Thriller",
  "Historical",
  "Sports",
] as const;

export const QUICK_GENRE_CHIPS = [
  "전체",
  "Fantasy",
  "Romance",
  "Action",
  "Historical",
  "Drama",
] as const;

export const GENRE_LABELS: Record<string, string> = {
  Fantasy: "판타지",
  Romance: "로맨스",
  Action: "액션",
  Drama: "드라마",
  Comedy: "코미디",
  Thriller: "스릴러",
  Historical: "무협/사극",
  Sports: "스포츠",
};

export const DAY_TAG: Record<string, string> = {
  mon: "월",
  tue: "화",
  wed: "수",
  thu: "목",
  fri: "금",
  sat: "토",
  sun: "일",
};

export const DAY_LABELS: Record<string, string> = {
  mon: "월요일",
  tue: "화요일",
  wed: "수요일",
  thu: "목요일",
  fri: "금요일",
  sat: "토요일",
  sun: "일요일",
};

export function getDayLabel(day: string) {
  return DAY_TAG[day] ?? DAY_TAG[day.toLowerCase()] ?? day.slice(0, 1);
}

export function getGenreLabel(genre: string | null | undefined) {
  if (!genre) return "기타";
  return GENRE_LABELS[genre] ?? genre;
}

export function getTasteKeywords(webtoon: Webtoon): string[] {
  const base = [getGenreLabel(webtoon.genre)];
  if (webtoon.platform === "naver") base.push("네이버");
  if (webtoon.platform === "kakao") base.push("카카오");
  if (webtoon.day_of_week) base.push(`${getDayLabel(webtoon.day_of_week)}요 연재`);
  return base.slice(0, 3);
}

export function getMockDescription(webtoon: Webtoon): string {
  if (webtoon.description) return webtoon.description;
  const genre = getGenreLabel(webtoon.genre);
  return `${webtoon.author ?? "작가"}의 ${genre} 웹툰. 탄탄한 캐릭터와 몰입감 있는 전개로 많은 독자에게 사랑받고 있어요.`;
}

export function getRecommendationReason(
  source: Webtoon,
  target: Webtoon,
  index: number
): string {
  if (index === 0) {
    return `선택한 작품처럼 ${getGenreLabel(source.genre)} 장르의 몰입감과 성장의 쾌감이 돋보이는 작품이에요.`;
  }
  return `빠른 전개와 강한 카타르시스를 좋아했다면 이어서 추천하고 싶은 작품이에요.`;
}

export const ANALYSIS_TRAITS = [
  "성장형 주인공",
  "압도적인 먼치킨",
  "치밀한 세계관",
  "빠른 전개와 카타르시스",
] as const;
