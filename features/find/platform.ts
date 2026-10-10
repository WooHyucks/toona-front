export function findPlatformLabel(platform: string | null | undefined): string {
  const upper = platform?.trim().toUpperCase();
  if (!upper) return "";
  if (upper === "NAVER") return "네이버웹툰";
  if (upper === "KAKAO") return "카카오웹툰";
  if (upper === "KAKAO_PAGE" || upper === "KAKAOPAGE") return "카카오페이지";
  if (upper === "LEZHIN") return "레진코믹스";
  if (upper === "BOMTOON") return "봄툰";
  if (upper === "RIDI") return "리디";
  if (upper === "OTHER") return "";
  return platform?.trim() ?? "";
}

export function findOfficialCtaLabel(platform: string | null | undefined): string {
  const label = findPlatformLabel(platform);
  if (label) return `${label}에서 보기`;
  return "공식 웹툰에서 보기";
}
