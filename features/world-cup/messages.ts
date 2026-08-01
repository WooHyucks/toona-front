import { ToonaApiError } from "@/lib/api/client";

export function worldCupErrorCopy(err: unknown): {
  title: string;
  description: string;
  code: string;
} {
  if (err instanceof ToonaApiError) {
    switch (err.code) {
      case "contender_set_unavailable":
        return {
          code: err.code,
          title: "월드컵을 준비하고 있어요",
          description: "잠시 후 다시 시도해주세요.",
        };
      case "invalid_contender_set":
        return {
          code: err.code,
          title: "월드컵 작품 구성을 확인하고 있어요",
          description: "잠시 후 다시 시도해주세요.",
        };
      case "expired_world_cup":
        return {
          code: err.code,
          title: "진행 중이던 월드컵이 만료됐어요",
          description: "새로 시작해 주세요.",
        };
      case "insufficient_reserves":
        return {
          code: err.code,
          title: "교체할 작품이 부족해요",
          description: "현재 작품 중 하나를 고르거나 새 월드컵을 시작해 주세요.",
        };
      case "unknown_not_allowed":
        return {
          code: err.code,
          title: "이 라운드에서는 건너뛸 수 없어요",
          description: "둘 중 하나를 골라 주세요.",
        };
      case "invalid_match":
      case "duplicate_choice":
        return {
          code: err.code,
          title: "선택이 반영되지 않았어요",
          description: "현재 경기를 다시 불러올게요.",
        };
      case "invalid_mode":
      case "invalid_choice_action":
      case "bad_request":
        return {
          code: err.code,
          title: "요청을 처리하지 못했어요",
          description: "다시 시도해 주세요.",
        };
      case "invalid_world_cup":
        return {
          code: err.code,
          title: "월드컵을 찾을 수 없어요",
          description: "새로 시작해 주세요.",
        };
      case "completed_world_cup":
        return {
          code: err.code,
          title: "이미 끝난 월드컵이에요",
          description: "새 월드컵을 시작해 주세요.",
        };
      default:
        return {
          code: err.code,
          title: "잠시 문제가 생겼어요",
          description: err.message || "다시 시도해 주세요.",
        };
    }
  }
  return {
    code: "network_error",
    title: "연결이 불안정해요",
    description: "네트워크 상태를 확인한 뒤 다시 시도해 주세요.",
  };
}
