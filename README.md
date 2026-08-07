# TOONA Frontend

웹툰 통합 추천 서비스 TOONA 프론트엔드 (Next.js 14 App Router).

## 필수: 백엔드 실행

이 앱은 **Supabase를 직접 조회하지 않습니다.**  
TOONA FastAPI가 필요합니다.

```bash
# toona-backend 예시
cd toona-backend
source .venv/bin/activate
python api_server.py
# http://localhost:8000
```

헬스 확인: `GET http://localhost:8000/health`  
OpenAPI: `http://localhost:8000/docs`

## 프론트 실행

```bash
cp .env.example .env.local
# NEXT_PUBLIC_TOONA_API_BASE=http://localhost:8000

npm install
npm run dev
```

http://localhost:3000

`next.config.mjs`의 `images.remotePatterns`를 바꾼 뒤에는 **개발 서버를 재시작**하세요.

## 환경변수

| 키 | 설명 |
|----|------|
| `NEXT_PUBLIC_TOONA_API_BASE` | FastAPI Base URL. 로컬 `http://localhost:8000` · 프로덕션 `https://toona-api-610048355251.asia-northeast3.run.app` |
| `NEXT_PUBLIC_SITE_URL` | 사이트 absolute origin (OG/canonical). 운영 필수. 예: `https://toona.kr` |

> 기존 `NEXT_PUBLIC_SUPABASE_*`는 신규 데이터 경로에서 사용하지 않습니다.

## SEO / Open Graph

페이지별 metadata는 서버에서 생성됩니다 (`lib/seo/*`).

| 경로 | 전략 |
|------|------|
| `/home` | TOONA 추천 가치 + `/images/meta.png` |
| `/world-cup` | 주말 정주행 미끼 (현재 OG 이미지는 meta.png 공용) |
| `/webtoon/[id]` | 작품명 동적 title/description, thumbnail OG |
| `/recommendations/[webtoonId]` | 추천 결과 공유용 · source 작품명 title · OG 이미지 source 썸네일 (없으면 meta.png) |
| `/onboarding/result?webtoonId=` | → `/recommendations/[webtoonId]` redirect |
| `/world-cup/result/[resultId]` | **미구현** (라우트 없음) |

운영 배포 전 `NEXT_PUBLIC_SITE_URL`을 설정하세요. 미설정 시 fallback `https://toona.kr`.

## 사용자 플로우

1. **온보딩 선택**: 검색 또는 장르 목록에서 재밌게 본 웹툰 1개 선택 (`recommendationReady=true`)
2. **취향 분석**: `GET /api/webtoons/{id}/taste-analysis` → `analysis.axes` 레이더 + summary/tags
3. **추천 결과**: `/recommendations/{webtoonId}` — `GET /api/recommendations` → `sections.completed` / `sections.ongoing` (+ 친구 공유)
4. **홈**: `heroSlides` 슬라이더 + 오늘 인기 + 판타지/액션/무협/로맨스/완결
5. **공식 플랫폼 이동**: `officialUrl` 오픈 + `POST /api/webtoon-actions` (`CLICKED`)

재방문: `toona_onboarding_completed=true` + favorite id → `/home`

## 추천 결과 공유

공유 URL은 **sourceWebtoonId route param**만으로 복구됩니다. sessionStorage / React state에 의존하지 않습니다. 추천 snapshot을 저장하지 않고 API를 다시 호출합니다.

| | |
|--|--|
| 공유 URL | `/recommendations/{sourceWebtoonId}?source=share` |
| Canonical | `/recommendations/{sourceWebtoonId}` (query 제외) |
| 내부 이동 | 분석 CTA → `/recommendations/{id}` (+ optional `source`) |
| Legacy | `/onboarding/result?webtoonId=` · `/recommendations?source=` → redirect |
| 공유 | Web Share: `title` + `url`만 (`text` 제외 → 카톡 채팅 말풍선 방지) |
| 미리보기 본문 | OG title/description/썸네일 (링크 카드 안 문구) |
| 공유받은 CTA | 「내가 재밌게 본 웹툰도 골라보기」→ `/onboarding` · 「다른 웹툰 둘러보기」→ `/home#home-browse` |
| Metadata | title/description은 작품명 · OG 이미지는 source `thumbnailUrl` (없으면 `/images/meta.png`) |
| Analytics | `recommendation_share_clicked` · `shared_recommendation_viewed` · `_home_clicked` · `_webtoon_clicked` |

월드컵 결과 공유와는 별개입니다.

## 웹툰 이상형 월드컵 (`/world-cup`)

광고·공유 유입용 **16강 토너먼트** (총 15경기). 랜딩·장르 선택·시작 버튼 없음 — 진입 즉시 세션 생성.

| | |
|--|--|
| 경로 | `/world-cup` · 다시하기 `/world-cup?mode=replay` |
| mode | `ACQUISITION`(기본) / `REPLAY` |
| API | `POST /sessions` · `POST /{id}/choices` · `GET /{id}` · `GET /results/{resultId}` |
| sessionStorage | `toona_world_cup_id` (+ winner / resultId / mode 스냅샷) |
| UNKNOWN_BOTH | **16강만** 노출 |
| 완료 | 서버 `winner` → 「비슷한 웹툰 보기」→ 기존 `/onboarding/analyzing` → 추천 → `/home` |
| 홈 | Hero 아래 「월드컵 다시 하기」→ `mode=REPLAY` |

상세 계약: [`WORLD_CUP.md`](./WORLD_CUP.md)

공유 페이지(`/world-cup/result/{resultId}`)는 TODO.

## localStorage

| Key | 용도 |
|-----|------|
| `toona_session_id` | 익명 행동 로그·API 식별용 (`crypto.randomUUID`). **게스트 인증 토큰이 아님** |
| `toona_recent_taste_source` | 최근 추천 기준 웹툰 1개 (동일 브라우저 재방문 UX). TTL 30일 |
| `toona_favorite_webtoon_id` | 선택 작품 |
| `toona_favorite_webtoon_title` | 선택 작품 제목 |
| `toona_onboarding_completed` | 온보딩 완료 |

### sessionId vs recentTasteSource

| | `toona_session_id` | `toona_recent_taste_source` |
|--|--|--|
| 역할 | 익명 행동 로그 연결, API `sessionId`, 월드컵/클릭 기록 | 같은 브라우저에서 최근 추천 기준 작품 복구 |
| 권한 | 없음 (인증 아님) | 없음 (서버 권한 검증에 사용하지 않음) |
| 동기화 | 기기 간 없음 | 기기 간 없음 · 시크릿 모드·다른 브라우저에서 유지 안 됨 |

### 최근 선택 웹툰 (`lib/recentTasteSource.ts`)

재방문 시 홈에 「추천 이어보기」 카드를 보여 줍니다. **취향 프로필·추천 결과 snapshot은 저장하지 않습니다.**

저장 시점: 분석 시작 (`prepareTasteAnalysis`) — 월드컵 winner CTA, 홈/온보딩 선택, SEO `/webtoon/[id]` CTA.

값 예시:

```json
{
  "webtoonId": "uuid",
  "title": "화산귀환",
  "thumbnailUrl": "https://...",
  "platform": "NAVER",
  "source": "WORLD_CUP",
  "updatedAt": "2026-08-01T12:00:00.000Z"
}
```

`source`: `WORLD_CUP` | `HOME` | `SHARED` | `SEO`

삭제 조건: JSON/필수필드 오류, TTL 30일 초과, 사용자가 「최근 선택 지우기」, taste-analysis 404.

추천 이어보기: 저장된 `webtoonId`로 기존 `/onboarding/analyzing` → taste-analysis / recommendations API를 **다시 호출**합니다.

향후 로그인 도입 시: localStorage → 계정 프로필로 migration하고, 로그인 전 값은 브라우저 로컬 캐시로만 취급하면 됩니다.

취향 다시 설정: 홈 헤더 「취향 다시 설정」→ `/onboarding`

## 온보딩 API

| 화면 | API |
|------|-----|
| 초기 목록 / 장르 | `GET /api/webtoons?recommendationReady=true&limit=12` (+ `genre=`) |
| 검색 | `GET /api/search/webtoons?q=...&recommendationReady=true&limit=10` |
| 선택 로그 | `POST /api/webtoon-actions` `actionType=SELECTED` |
| 취향 | `GET /api/webtoons/{id}/taste-analysis` (`analysis`만) |
| 추천 | `GET /api/recommendations?webtoonId=&sessionId=` |

## 홈 API (병렬)

- `GET /api/recommendations` → `heroSlides` (0~3)
- `GET /api/rankings?type=weekday&day={today}`
- `GET /api/webtoons?genre=Fantasy|Action|Historical|Romance&limit=20`
- `GET /api/webtoons?status=COMPLETED&limit=20`

홈 브라우징에서는 `recommendationReady`를 보내지 않습니다.

## 회차 표시 (`lib/episode.ts`)

| status | 규칙 |
|--------|------|
| COMPLETED | `totalEpisodeCount` → `총 n화` / 없으면 `latest` → `n화 완결` / 둘 다 없으면 `완결` |
| ONGOING | `latest` → `n화까지` / 없으면 `연재 중` |
| HIATUS | `latest` → `휴재 · n화` / 없으면 `휴재 중` |

가짜 숫자는 만들지 않습니다.

## 취향 axes (고정 순서)

`growth` → `catharsis` → `immersion` → `relationships` → `worldbuilding`  
5개가 아니면 레이더를 그리지 않고 태그 UI로 fallback합니다.

## 외부 이미지 도메인

`next.config.mjs` remotePatterns:

- `image-comic.pstatic.net`
- `kr-a.kakaopagecdn.com`
- `page.kakaocdn.net`

썸네일은 CDN hotlink 차단을 피하기 위해 `<img referrerPolicy="no-referrer">` 기반 `WebtoonThumbnail` / `WebtoonCover`를 사용합니다. 실패 시 TOONA fallback cover.

## 저장 기능 한계

백엔드는 `SAVED` 행동 로그만 지원하며 저장 목록 조회 API는 없습니다.  
홈의 저장 버튼은 현재 비활성(준비 중)입니다.

## 주요 계약

상세: [`FRONTEND_API.md`](./FRONTEND_API.md)

## TODO

- 저장 목록 API 연동
- analytics SDK 연결
- 레거시 Supabase 헬퍼/`getRankedWebtoons` 파일 삭제
- 백엔드: 상세/랭킹 회차 필드 OpenAPI와 실응답 일치 여부 지속 검증
