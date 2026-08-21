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

### 7. `lifetime_collection_created`

| | |
|--|--|
| 의미 | 추천 결과에서 첫 인생 웹툰 보관함 생성 성공 |
| 시점 | `CreateLifetimeCollectionCta` POST 성공 (`alreadyExists` 제외) |
| Properties | `sourceWebtoonId`, `sourceTitle` |

### 8. `lifetime_webtoon_added`

| | |
|--|--|
| 의미 | 홈에서 인생 웹툰 추가 성공 |
| 시점 | `LifetimeWebtoonsSection` POST 성공 (`alreadyExists` 제외) |
| Properties | `webtoonId`, `title` |

### 9. `webtoon_clicked`

| | |
|--|--|
| 의미 | 네이버 공식 작품 열기 (CLICKED API와 별개) |
| 시점 | NAVER `openWebtoon` / `openNaverOfficial` |
| Properties | `platform` (`naver`), `openTarget` (`app_bridge` \| `web_fallback`), `webtoonId`, `naverTitleId` |

### 10. Weekend Picks inline experiment

공통 properties: `webtoonId`, `title`, `position`, `label`, `weekKey`  
리뷰: `videoId`, `videoType` (`shorts` \| `review`)  
읽기: `platform`, `openTarget` (`app_bridge` \| `web`)

| Event | 시점 |
|--|--|
| `weekend_picks_view` | 추천 모달이 실제로 열림 (weekKey당 1회) |
| `weekend_pick_impression` | 카드가 뷰포트에 진입 (작품당 1회) |
| `weekend_review_open` | 「리뷰로 찍먹」 |
| `weekend_review_play` | 시트에서 썸네일 탭 → iframe 생성 |
| `weekend_review_close` | 리뷰 레이어 닫기 (X, 작품 목록으로, 바깥 탭) |
| `weekend_direct_read_click` | 카드 「바로 보러가기」 |
| `weekend_review_read_click` | 시트에서 웹툰 CTA |
| `weekend_personalize_click` | 「내 취향으로 추천받기」 |

## Funnel (Amplitude에서 생성)

### Funnel A — Direct 추천 → 홈

```
page_view
  → webtoon_selected
  → recommendation_viewed   (filter: source = direct)
  → lifetime_collection_created
  → home_view
```

### Funnel B — 월드컵 → 추천 → 홈

```
worldcup_view
  → worldcup_completed
  → recommendation_viewed   (filter: source = worldcup)
  → home_view
```

### Funnel C — Weekend Picks

```
weekend_picks_view → weekend_direct_read_click
weekend_picks_view → weekend_review_open → weekend_review_read_click
weekend_picks_view → weekend_personalize_click
```

## 코드 위치

| 이벤트 | 파일 |
|--------|------|
| `page_view` | `features/onboarding/components/OnboardingSearchScreen.tsx` |
| `webtoon_selected` | `lib/taste-flow.ts` |
| `worldcup_view` / `worldcup_completed` | `features/world-cup/components/WorldCupScreen.tsx` |
| `recommendation_viewed` | `features/onboarding/components/ResultScreen.tsx` |
| `home_view` | `features/home/HomeClient.tsx` |
| `lifetime_collection_created` | `features/lifetime/CreateLifetimeCollectionCta.tsx` |
| `lifetime_webtoon_added` | `features/lifetime/LifetimeWebtoonsSection.tsx` |
| `webtoon_clicked` | `lib/open-webtoon.ts` (NAVER official open) |
| `weekend_picks_view` | `features/weekend-picks/WeekendPicksSection.tsx` |
| `weekend_pick_impression` | `features/weekend-picks/WeekendPickCard.tsx` |
| `weekend_review_open` / `weekend_review_play` / `weekend_review_close` | weekend-picks section / review sheet |
| `weekend_direct_read_click` / `weekend_review_read_click` | pick card / review sheet |
| `weekend_personalize_click` | `WeekendPicksSection` |
| init | `components/analytics/AmplitudeInit.tsx` (root layout) |

## 주의

- React Strict Mode 중복을 막기 위해 view 계열은 `sendOnce` 사용
- 기존 `track()` CustomEvent는 Amplitude로 보내지 않음
