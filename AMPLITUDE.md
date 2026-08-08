# TOONA Amplitude 이벤트

유입 Hook과 웹툰 추천 니즈 확인용 이벤트입니다.  
구현: `lib/analytics.ts` · SDK: `@amplitude/analytics-browser`

## 환경변수

| Key | 용도 |
|-----|------|
| `NEXT_PUBLIC_AMPLITUDE_API_KEY` | Browser SDK API Key (클라이언트 공개용) |
| `AMPLITUDE_SECRET_KEY` | **프론트 사용 금지** (서버 Export 등) |

키가 없으면 Amplitude는 no-op입니다. 서비스 기능은 막지 않습니다.

`NEXT_PUBLIC_*`는 **빌드 시점**에 번들에 들어갑니다. Vercel에 추가한 뒤에는 **Redeploy**가 필요합니다.

## 이벤트 목록

### 1. `page_view`

| | |
|--|--|
| 의미 | 일반 TOONA 추천 진입 페이지 표시 |
| 시점 | `/onboarding` (`OnboardingSearchScreen`) mount 시 |
| Properties | 없음 |
| 중복 | JS 세션당 1회 (`sendOnce`) |

### 2. `webtoon_selected`

| | |
|--|--|
| 의미 | 사용자가 추천 기준 웹툰 1개를 선택하고 분석을 시작 |
| 시점 | `prepareTasteAnalysis()` 호출 시 (`origin !== WORLD_CUP`) |
| Properties | `webtoonId`, `title` |
| 중복 | 선택마다 전송 (클릭 액션) |

월드컵 winner CTA로 분석을 시작하는 경우는 **보내지 않습니다.**  
(`worldcup_completed`로 구분)

### 3. `worldcup_view`

| | |
|--|--|
| 의미 | 웹툰 이상형 월드컵 첫 대결 UI가 실제로 표시됨 |
| 시점 | `WorldCupScreen`에서 첫 `IN_PROGRESS` match 적용 시 |
| Properties | 없음 |
| 중복 | JS 세션당 1회 |

### 4. `worldcup_completed`

| | |
|--|--|
| 의미 | 16강 결승까지 완료되어 winner 확정 |
| 시점 | `WorldCupScreen` `applyCompleted` |
| Properties | `winnerWebtoonId`, `winnerTitle` |
| 중복 | winner id 기준 1회 |

### 5. `recommendation_viewed`

| | |
|--|--|
| 의미 | 추천 결과가 정상 표시됨 (empty/error 제외) |
| 시점 | `ResultScreen` status === `success` |
| Properties | `sourceWebtoonId`, `sourceTitle`, `source` |
| `source` 값 | `"direct"` \| `"worldcup"` |
| 중복 | `sourceWebtoonId` + `source` 조합당 1회 |

`source=worldcup`은 분석 플로우 query `source=world-cup`일 때입니다.

### 6. `home_view`

| | |
|--|--|
| 의미 | TOONA 홈이 정상 표시됨 |
| 시점 | `/home` (`HomeClient`) status === `success` |
| Properties | 없음 |
| 중복 | JS 세션당 1회 |

로딩·에러 화면에서는 보내지 않습니다.

## Funnel (Amplitude에서 생성)

### Funnel A — Direct 추천 → 홈

```
page_view
  → webtoon_selected
  → recommendation_viewed   (filter: source = direct)
  → home_view
```

### Funnel B — 월드컵 → 추천 → 홈

```
worldcup_view
  → worldcup_completed
  → recommendation_viewed   (filter: source = worldcup)
  → home_view
```

## 코드 위치

| 이벤트 | 파일 |
|--------|------|
| `page_view` | `features/onboarding/components/OnboardingSearchScreen.tsx` |
| `webtoon_selected` | `lib/taste-flow.ts` |
| `worldcup_view` / `worldcup_completed` | `features/world-cup/components/WorldCupScreen.tsx` |
| `recommendation_viewed` | `features/onboarding/components/ResultScreen.tsx` |
| `home_view` | `features/home/HomeClient.tsx` |
| init | `components/analytics/AmplitudeInit.tsx` (root layout) |

## 주의

- React Strict Mode 중복을 막기 위해 view 계열은 `sendOnce` 사용
- 기존 `track()` CustomEvent는 Amplitude로 보내지 않음
