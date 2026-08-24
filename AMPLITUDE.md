# TOONA Amplitude 이벤트

유입 Hook · 추천 전환 · Weekend Picks 실험을 보기 위한 클라이언트 이벤트입니다.

구현: `lib/analytics.ts` · SDK: `@amplitude/analytics-browser` · init: `components/analytics/AmplitudeInit.tsx`

`track()` CustomEvent(`toona:analytics`)는 **Amplitude로 보내지 않습니다.** 아래 표의 이벤트만 `amplitude.track` 됩니다.

## 환경변수

| Key | 용도 |
|-----|------|
| `NEXT_PUBLIC_AMPLITUDE_API_KEY` | Browser SDK API Key (클라이언트 공개용) |
| `AMPLITUDE_SECRET_KEY` | **프론트 사용 금지** (서버 Export 등) |

키가 없으면 Amplitude는 no-op입니다. 서비스 기능은 막지 않습니다.

`NEXT_PUBLIC_*`는 **빌드 시점**에 번들에 들어갑니다. Vercel에 추가·변경한 뒤에는 **Redeploy**가 필요합니다.

## 한눈에 보기

| Event | 의미 | 중복 |
|-------|------|------|
| `page_view` | 온보딩 검색 화면 표시 | JS 세션 1회 |
| `webtoon_selected` | 추천 기준 웹툰 선택 (월드컵 제외) | 선택마다 |
| `worldcup_view` | 월드컵 첫 대결 UI 표시 | JS 세션 1회 |
| `worldcup_completed` | 월드컵 winner 확정 | winner id당 1회 |
| `recommendation_viewed` | 추천 결과 정상 표시 | sourceWebtoonId + source 1회 |
| `home_view` | 홈 정상 표시 | JS 세션 1회 |
| `webtoon_clicked` | 네이버 공식 작품 열기 | 클릭마다 |
| `weekend_picks_view` | Weekend Picks 모달이 열림 | weekKey당 1회 |
| `weekend_pick_impression` | 픽 카드가 화면에 보임 | weekKey + 작품당 1회 |
| `weekend_review_open` | 「리뷰로 찍먹」 | 클릭마다 |
| `weekend_review_play` | 리뷰 썸네일 탭 → iframe 재생 | 클릭마다 |
| `weekend_review_close` | 리뷰 레이어 닫기 | 닫을 때마다 |
| `weekend_direct_read_click` | 카드 「바로 보러가기」 | 클릭마다 |
| `weekend_review_read_click` | 리뷰에서 웹툰 CTA | 클릭마다 |
| `weekend_personalize_click` | 「내 취향으로 추천받기」 | 클릭마다 |

JS 세션 = 탭을 새로고침하기 전까지의 in-memory `sendOnce`. Amplitude User Session과 다릅니다.

---

## 온보딩 · 추천

### `page_view`

| | |
|--|--|
| 의미 | 일반 추천 진입 화면이 보임 |
| 시점 | `/onboarding` `OnboardingSearchScreen` mount |
| Properties | 없음 |
| 중복 | JS 세션당 1회 |

다른 라우트(`/home`, `/search` 등)의 page view는 보내지 않습니다.

### `webtoon_selected`

| | |
|--|--|
| 의미 | 추천 기준 웹툰 1개를 고르고 분석을 시작 |
| 시점 | `prepareTasteAnalysis()` (`origin !== WORLD_CUP`) |
| Properties | `webtoonId`, `title` |
| 중복 | 선택마다 |

월드컵 winner CTA는 **보내지 않습니다.** (`worldcup_completed`로 구분)

### `recommendation_viewed`

| | |
|--|--|
| 의미 | 추천 결과가 정상 표시됨 (empty / error 제외) |
| 시점 | `ResultScreen` `status === success` |
| Properties | `sourceWebtoonId`, `sourceTitle`, `source` |
| `source` | `"direct"` \| `"worldcup"` |
| 중복 | `sourceWebtoonId` + `source` 조합당 1회 |

`source=worldcup`은 분석 플로우 query `source=world-cup`일 때만입니다. 공유 진입(`share`)도 Amplitude에는 `"direct"`로 집계됩니다.

---

## 월드컵

### `worldcup_view`

| | |
|--|--|
| 의미 | 16강 첫 대결 UI가 실제로 표시됨 |
| 시점 | `WorldCupScreen`에서 첫 `IN_PROGRESS` match 적용 |
| Properties | 없음 |
| 중복 | JS 세션당 1회 |

### `worldcup_completed`

| | |
|--|--|
| 의미 | 결승까지 끝나 winner가 확정됨 |
| 시점 | `WorldCupScreen` `applyCompleted` |
| Properties | `winnerWebtoonId`, `winnerTitle` |
| 중복 | winner id 기준 1회 |

---

## 홈

### `home_view`

| | |
|--|--|
| 의미 | TOONA 홈이 정상 표시됨 |
| 시점 | `/home` `HomeClient` `status === success` |
| Properties | 없음 |
| 중복 | JS 세션당 1회 |

로딩·에러 화면에서는 보내지 않습니다.

---

## 공식 작품 열기

### `webtoon_clicked`

| | |
|--|--|
| 의미 | 네이버 공식 URL / 앱 브릿지로 작품을 염 |
| 시점 | `openNaverUrl` (`openWebtoon` NAVER, `openNaverOfficial`) |
| Properties | `platform` (`naver`), `openTarget` (`app_bridge` \| `web_fallback`), `webtoonId`, `naverTitleId` |
| 중복 | 클릭마다 |

카카오 iframe(`/viewer`)·알 수 없는 플랫폼 외부 링크는 **이 이벤트를 보내지 않습니다.**  
Weekend Picks 「바로 보러가기」는 아래 `weekend_*_read_click`를 씁니다. 네이버 카드가 `<a>`로 바로 나가면 `webtoon_clicked`는 안 붙습니다.

백엔드 `POST` `actionType=CLICKED`와는 별개입니다.

---

## Weekend Picks

온보딩 검색·홈 모두 같은 모달입니다. 데이터가 없거나 실패하면 모달·이벤트 모두 없습니다.

첫 방문은 `localStorage` `toona_weekend_picks_seen`이 없을 때 자동으로 열립니다. 재방문은 홈/온보딩의 「이번 주말 투나 PICK 보기」로 다시 엽니다.

### 공통 properties

픽 단위 이벤트:

| Key | 값 |
|-----|-----|
| `webtoonId` | 작품 id |
| `title` | 작품 제목 |
| `position` | 픽 순서 |
| `label` | 에디토리얼 라벨 |
| `weekKey` | 주 식별자 |

리뷰 이벤트 추가: `videoId`, `videoType` (`shorts` \| `review`)  
읽기 이벤트 추가: `platform` (소문자, 없으면 `unknown`), `openTarget` (`app_bridge` \| `web`)

### `weekend_picks_view`

| | |
|--|--|
| 의미 | 추천 모달이 실제로 열림 (자동 / 다시 보기 모두) |
| 시점 | `WeekendPicksSection` `open === true` 이고 아이템이 있을 때 |
| Properties | `weekKey`, `pickCount` |
| 중복 | `weekKey`당 JS 세션 1회 |

섹션만 마운트되고 모달이 닫혀 있으면 보내지 않습니다.

### `weekend_pick_impression`

| | |
|--|--|
| 의미 | 카드가 뷰포트에 들어옴 |
| 시점 | `IntersectionObserver` threshold `0.45` |
| 중복 | `weekKey` + `webtoonId`당 1회 |

모바일 캐러셀은 보이는 카드만, 데스크톱 3열은 열린 순간 여러 장이 같이 잡힐 수 있습니다.

### `weekend_review_open`

| | |
|--|--|
| 의미 | 「리뷰로 찍먹」 |
| 시점 | 카드에서 리뷰 레이어를 열 때 |

### `weekend_review_play`

| | |
|--|--|
| 의미 | 리뷰 썸네일을 눌러 YouTube iframe이 생성됨 |
| 시점 | `WeekendReviewSheet` `loadIframe` |

자동재생은 없습니다. 썸네일 탭 전에 닫으면 이 이벤트는 없습니다.

### `weekend_review_close`

| | |
|--|--|
| 의미 | 리뷰 레이어를 닫음 |
| 시점 | X · 「작품 목록으로」 · 바깥(오버레이) 탭 · Escape/다이얼로그 dismiss (리뷰가 열려 있을 때) |

추천 모달 자체는 닫히지 않습니다. embedded 시트는 부모 `closeReview`가 1회만 보냅니다.

### `weekend_direct_read_click`

| | |
|--|--|
| 의미 | 카드 「바로 보러가기」 |
| 시점 | 네이버 `<a>` 클릭 또는 카카오/기타 `onDirectRead` |

### `weekend_review_read_click`

| | |
|--|--|
| 의미 | 리뷰 레이어의 웹툰 CTA |
| 카카오 카피 | 「카카오웹툰에서 보기」 |
| 네이버 카피 | 앱 브릿지 가능 시 「네이버웹툰 앱에서 보기」, 아니면 「네이버웹툰에서 보기」 |

### `weekend_personalize_click`

| | |
|--|--|
| 의미 | 「내 취향으로 추천받기」 |
| 시점 | 모달 하단 CTA |
| Properties | `weekKey` |

온보딩에서는 검색 포커스, 홈에서는 `/onboarding`으로 이동합니다.

---

## 현재 보내지 않음

코드에 함수는 남아 있지만 **지금은 Amplitude에 안 갑니다.**

| Event | 이유 |
|-------|------|
| `lifetime_collection_created` | 추천 결과 CTA가 보관함 생성이 아니라 「더 많은 웹툰 추천 받기」→ `/home` |
| `lifetime_webtoon_added` | 홈 인생 웹툰 섹션이 비활성 |

아래도 Amplitude가 아닙니다.

- `track()` CustomEvent (`world_cup_*`, `shared_recommendation_*`, `recent_recommendation_*` 등)
- 인스타그램 아이콘 클릭
- 추천 결과 「더 많은 웹툰 추천 받기」 / 「홈으로」 자체 클릭
- 카카오 `/viewer` 진입

---

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

### Funnel C — Weekend Picks

```
weekend_picks_view → weekend_direct_read_click
weekend_picks_view → weekend_review_open → weekend_review_play → weekend_review_read_click
weekend_picks_view → weekend_review_open → weekend_review_read_click
weekend_picks_view → weekend_personalize_click
```

온보딩에서 픽을 본 뒤 `weekend_personalize_click` → `webtoon_selected` → Funnel A로 이어질 수 있습니다.

---

## 코드 위치

| 이벤트 | 파일 |
|--------|------|
| `page_view` | `features/onboarding/components/OnboardingSearchScreen.tsx` |
| `webtoon_selected` | `lib/taste-flow.ts` |
| `worldcup_view` / `worldcup_completed` | `features/world-cup/components/WorldCupScreen.tsx` |
| `recommendation_viewed` | `features/onboarding/components/ResultScreen.tsx` |
| `home_view` | `features/home/HomeClient.tsx` |
| `webtoon_clicked` | `lib/open-webtoon.ts` (`openNaverUrl`) |
| `weekend_picks_view` / `weekend_review_open` / `weekend_personalize_click` | `features/weekend-picks/WeekendPicksSection.tsx` |
| `weekend_pick_impression` / `weekend_direct_read_click` | `features/weekend-picks/WeekendPickCard.tsx` |
| `weekend_review_play` / `weekend_review_read_click` | `features/weekend-picks/WeekendReviewSheet.tsx` |
| `weekend_review_close` | `WeekendPicksSection` (embedded) · `WeekendReviewSheet` (standalone) |
| init | `components/analytics/AmplitudeInit.tsx` (root layout) |

---

## 주의

- React Strict Mode 중복을 막기 위해 view 계열은 `sendOnce`를 씁니다.
- `sendOnce`는 새로고침하면 초기화됩니다. 같은 `weekKey`라도 재방문 새로고침 후 모달을 다시 열면 `weekend_picks_view`가 한 번 더 갑니다.
- 기존 `track()`은 콘솔/CustomEvent 전용입니다.
