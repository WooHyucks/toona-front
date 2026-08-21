import type { DayOfWeek, ToonaGenre, Platform } from "./types";

export const GENRE_LABELS: Record<ToonaGenre, string> = {
  Fantasy: "판타지",
  Action: "액션",
  Romance: "로맨스",
  Drama: "드라마",
  Comedy: "코미디",
  Thriller: "스릴러",
  Sports: "스포츠",
  Historical: "무협·사극",
};

export const QUICK_GENRE_CHIPS: Array<ToonaGenre | "all"> = [
  "all",
  "Fantasy",
  "Action",
  "Romance",
  "Drama",
  "Comedy",
];

export const ALL_GENRES: ToonaGenre[] = [
  "Action",
  "Romance",
  "Drama",
  "Fantasy",
  "Comedy",
  "Thriller",
  "Sports",
  "Historical",
];

/** Short day labels (월·화·수…) */
export const DAY_LABEL: Record<DayOfWeek, string> = {
  mon: "월",
  tue: "화",
  wed: "수",
  thu: "목",
  fri: "금",
  sat: "토",
  sun: "일",
};

/** Spec alias — same short labels as DAY_LABEL */
export const DAY_LABELS: Record<DayOfWeek, string> = {
  mon: "월",
  tue: "화",
  wed: "수",
  thu: "목",
  fri: "금",
  sat: "토",
  sun: "일",
};

export const DAY_FROM_JS_INDEX: Record<number, DayOfWeek> = {
  0: "sun",
  1: "mon",
  2: "tue",
  3: "wed",
  4: "thu",
  5: "fri",
  6: "sat",
};

export const ALL_DAYS: DayOfWeek[] = [
  "mon",
  "tue",
  "wed",
  "thu",
  "fri",
  "sat",
  "sun",
];

export const PLATFORM_LABELS: Record<Platform, string> = {
  naver: "네이버웹툰",
  kakao: "카카오웹툰",
};

export const PLATFORM_BADGE_COLORS: Record<
  Platform,
  { bg: string; text: string; accent: string }
> = {
  naver: { bg: "#00D564", text: "#071A0D", accent: "#00D564" },
  kakao: { bg: "#FFD400", text: "#181000", accent: "#FFD400" },
};

export const ALL_PLATFORMS: Platform[] = ["naver", "kakao"];

export const STATUS_LABELS = {
  ongoing: "연재중",
  completed: "완결",
  hiatus: "휴재",
} as const;

export function isSupportedPlatform(value: string): value is Platform {
  return value === "naver" || value === "kakao";
}

export function formatDaysOfWeek(days: DayOfWeek[]): string {
  return days.map((day) => DAY_LABEL[day]).join("·");
}

export function getGenreLabel(genre: ToonaGenre | null | undefined): string {
  if (!genre) return "";
  return GENRE_LABELS[genre] ?? genre;
}

export function getPlatformExternalLabel(platform: Platform): string {
  switch (platform) {
    case "naver":
      return "네이버웹툰에서 보기";
    case "kakao":
      /** Kakao opens in-app viewer — avoid “카카오웹툰에서 보기” implying external-only */
      return "웹툰 바로 보기";
  }
}

/** Asia/Seoul weekday without extra date libraries */
export function getSeoulDayOfWeek(date = new Date()): DayOfWeek {
  const koreaDate = new Date(
    date.toLocaleString("en-US", { timeZone: "Asia/Seoul" })
  );
  return DAY_FROM_JS_INDEX[koreaDate.getDay()] ?? "mon";
}

export function getTodayDayOfWeek(): DayOfWeek {
  return getSeoulDayOfWeek();
}
