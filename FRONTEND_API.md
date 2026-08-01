# TOONA 웹툰 월드컵

프론트·백엔드·DB·변경 이력을 한곳에 모은 문서입니다.  
상세 API 계약은 `FRONTEND_API.md` §11과 `/docs`도 함께 참고하세요.

|           |                                              |
| --------- | -------------------------------------------- |
| Base URL  | `http://localhost:8000`                      |
| OpenAPI   | `/docs`                                      |
| Migration | `migrations/004_world_cup.sql`               |
| Code      | `world_cup/*`, `app/api/routes/world_cup.py` |
| Tests     | `test_world_cup.py`                          |

---

## 1. 제품 요약

**카피:** 웹툰 월드컵으로 이번 주말 몰아볼 작품 찾기  
**서브:** 7번만 고르면 취향에 맞는 정주행 작품을 추천해드려요.

### 플로우

```
랜딩 → 장르(또는 전체) 선택
     → 작품 2개 비교 (왼쪽 / 오른쪽 / 둘 다 안 봤어요)
     → 유효 선택 7회
     → 취향 분석 (summary · tags · axes 5개)
     → 주말 정주행 추천 최대 3개
     → resultId 공유
```

### 중요

- **고정 8강·4강·결승 브래킷이 아닙니다.**
- 서버는 동적 1v1 취향 배틀입니다.
- `UNKNOWN_BOTH`(둘 다 안 봤어요)는 비선호가 아니며, 취향 점수에 **반영하지 않습니다.**

---

## 2. 핵심 용어

| 용어               | 의미                                                 |
| ------------------ | ---------------------------------------------------- |
| 유효 선택          | `SELECTED_LEFT` 또는 `SELECTED_RIGHT`                |
| `completedChoices` | 유효 선택 누적                                       |
| `requiredChoices`  | **7** (고정)                                         |
| `skipCount`        | `UNKNOWN_BOTH` 누적                                  |
| 완료 조건          | `completedChoices >= 7`                              |
| `maxSkipCount`     | **12** — 초과·후보 부족 시 `insufficient_candidates` |

| action           | 의미            | completedChoices           |
| ---------------- | --------------- | -------------------------- |
| `SELECTED_LEFT`  | 왼쪽 선택       | +1                         |
| `SELECTED_RIGHT` | 오른쪽 선택     | +1                         |
| `UNKNOWN_BOTH`   | 둘 다 안 봤어요 | 증가 없음 (`skipCount` +1) |

세션 상태: `IN_PROGRESS` · `COMPLETED` · `EXPIRED` (생성 후 24시간)

---

## 3. API

공통 에러 형식:

```json
{ "error": "...", "message": "...", "requestId": "..." }
```

### 3.1 `POST /api/world-cup/sessions`

세션 생성 + 첫 대결.

**Request**

```json
{ "sessionId": "anon-1", "genre": "Historical" }
```

- `sessionId` 필수
- `genre` 생략 가능 → 전체 pool
- 허용 장르: `Action` · `Romance` · `Drama` · `Fantasy` · `Comedy` · `Thriller` · `Sports` · `Historical`  
  (한글 alias: 판타지, 액션, 로맨스, 무협, … — 기존 목록 API와 동일)

**Response (요약)**

```json
{
  "worldCupId": "uuid",
  "status": "IN_PROGRESS",
  "genre": "Historical",
  "progress": {
    "completedChoices": 0,
    "requiredChoices": 7,
    "skipCount": 0
  },
  "match": {
    "matchId": "uuid",
    "left": {
      "id": "...",
      "title": "...",
      "platform": "NAVER",
      "thumbnailUrl": "...",
      "genres": [],
      "latestEpisodeNumber": null,
      "totalEpisodeCount": null
    },
    "right": {
      "id": "...",
      "title": "...",
      "platform": "KAKAO",
      "status": "COMPLETED",
      "thumbnailUrl": "...",
      "genres": [],
      "latestEpisodeNumber": 84,
      "totalEpisodeCount": 84
    }
  },
  "expiresAt": "..."
}
```

후보 조건: `recommendationReady=true`(태그 있음), 제목·status 존재. 동일 작품/조합 재노출 방지.

### 3.2 `POST /api/world-cup/{worldCupId}/choices`

**Request**

```json
{
  "matchId": "uuid",
  "leftWebtoonId": "uuid",
  "rightWebtoonId": "uuid",
  "action": "SELECTED_LEFT"
}
```

서버가 현재 활성 match와 left/right ID를 검증합니다. 프론트가 임의 ID를 보내도 거절합니다.  
`selectedWebtoonId`는 서버가 action으로 계산합니다.

- **미완료:** 다음 `match` 반환
- **완료:** `status=COMPLETED` + `result` (추가 API 호출 없이 결과 포함)
- **동일 match + 동일 action 재전송:** idempotent (진행도 이중 증가 없음)
- **동일 match + 다른 action:** `duplicate_choice`

### 3.3 `GET /api/world-cup/{worldCupId}`

새로고침·복귀용.

- `IN_PROGRESS` → `progress` + 현재 `match`
- `COMPLETED` → `result`
- `EXPIRED` → `expired_world_cup` 또는 status

### 3.4 `GET /api/world-cup/results/{resultId}`

공유용 공개 결과.

포함: `resultId`, `analysis`, `selectedHighlights`, `recommendations`, `createdAt`  
**비포함:** `sessionId`, raw choice log, 내부 점수

### 3.5 완료 시 `result` 구조

```json
{
  "resultId": "uuid",
  "worldCupId": "uuid",
  "analysis": {
    "summary": "성장형 주인공과 통쾌한 전개를 좋아해요.",
    "tags": [
      { "key": "growth_protagonist", "label": "성장형 주인공", "score": 92 }
    ],
    "axes": [
      { "code": "growth", "label": "성장감", "score": 92 },
      { "code": "catharsis", "label": "통쾌함", "score": 88 },
      { "code": "immersion", "label": "몰입감", "score": 81 },
      { "code": "relationships", "label": "관계성", "score": 46 },
      { "code": "worldbuilding", "label": "세계관", "score": 90 }
    ]
  },
  "selectedHighlights": [
    { "id": "...", "title": "...", "thumbnailUrl": "https://..." }
  ],
  "recommendations": [
    {
      "recommendationType": "BINGE",
      "score": 0.82,
      "recommendationReason": "완결작이라 이번 주말 정주행하기 좋아요.",
      "matchedTags": [],
      "webtoon": {
        "id": "...",
        "title": "...",
        "platform": "KAKAO",
        "status": "COMPLETED",
        "thumbnailUrl": "https://...",
        "officialUrl": "https://...",
        "genres": ["Fantasy"],
        "latestEpisodeNumber": 84,
        "totalEpisodeCount": 84
      }
    }
  ],
  "share": { "path": "/world-cup/result/{resultId}" }
}
```

- `axes` 정확히 5개, 고정 순서, 0~100 integer, deterministic
- `recommendations` 0~3개 (`BINGE` / `BEST_MATCH` / `DISCOVERY`)
- 세션에서 **노출·선택**한 작품은 추천에서 제외
- 완결 후보가 있으면 BINGE에 완결 우선
- 가짜 작품·실시간 LLM 호출 없음
- 회차 표시 문구는 프론트가 `status` + 숫자로 조합 (`108화까지` / `총 82화`)

### 3.6 에러 코드

| error                     | HTTP | 의미               |
| ------------------------- | ---- | ------------------ |
| `invalid_genre`           | 400  | 장르 오류          |
| `bad_request`             | 400  | sessionId 등       |
| `invalid_choice_action`   | 400  | action 오류        |
| `invalid_world_cup`       | 404  | 세션 없음          |
| `result_not_found`        | 404  | 공유 결과 없음     |
| `expired_world_cup`       | 410  | 만료               |
| `completed_world_cup`     | 409  | 이미 완료          |
| `invalid_match`           | 409  | match/ID 불일치    |
| `duplicate_choice`        | 409  | 다른 action 재시도 |
| `insufficient_candidates` | 422  | 비교 후보 부족     |

---

## 4. 백엔드 구조

| 영역       | 파일                                             |
| ---------- | ------------------------------------------------ |
| API 라우트 | `app/api/routes/world_cup.py`                    |
| DI         | `app/api/dependencies.py` → `WorldCupServiceDep` |
| Schema     | `app/schemas/world_cup.py`                       |
| 예외       | `app/api/exceptions.py` → `WorldCupAppError`     |
| Service    | `world_cup/service.py`                           |
| Repository | `world_cup/repository.py`                        |
| Constants  | `world_cup/constants.py`                         |

앱 등록: `app/main.py` → `include_router(world_cup.router)`

### 재사용하는 기존 로직

| 기능             | 소스                                                 |
| ---------------- | ---------------------------------------------------- |
| 작품 카드 직렬화 | `recommendation.service.serialize_webtoon`           |
| 후보 점수        | `recommendation.scoring.score_candidate`             |
| 역할 선정        | `recommendation.scoring.select_role_recommendations` |
| 5축              | `taste.axes.compute_taste_axes`                      |
| 작품 분석        | `taste.analyzer.analyze_webtoon`                     |
| 장르 alias       | `app.services.webtoon_service.normalize_genre_query` |
| 태깅 후보 pool   | `RecommendationRepository.list_candidates_with_tags` |

### 후보·완화

1. 선택 genre + recommendationReady + 인기
2. 장르 완화 / 전체 pool
3. skip 누적 시 exposed(미선택) 재사용 검토
4. **selected 작품은 재사용 금지**
5. 그래도 부족 → `insufficient_candidates`

---

## 5. DB (migration 004)

Supabase SQL Editor에서 실행:

```text
migrations/004_world_cup.sql
```

| 테이블               | 역할                                               |
| -------------------- | -------------------------------------------------- |
| `world_cup_sessions` | 세션·진행도·노출/선택 ID·분석 snapshot·`result_id` |
| `world_cup_matches`  | 현재/과거 대결 (PENDING → ANSWERED)                |
| `world_cup_choices`  | 선택 이력 (`unique(match_id)` → 이중 처리 방지)    |

세션 snapshot 컬럼: `analysis_summary`, `analysis_tags`, `analysis_axes`, `recommendation_results`, `selected_highlights`  
→ 알고리즘이 바뀌어도 공유 결과는 변하지 않음.

---

## 6. 로컬 실행

```bash
# 1) Supabase에 004 적용 후

# 2) API
.venv/bin/uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload

# 3) 문서
open http://localhost:8000/docs

# 4) 테스트
.venv/bin/python -m unittest test_world_cup.py -q
```

월드컵 후보는 **태깅된 작품**이 필요하므로, 미태깅이 많으면:

```bash
PYTHONUNBUFFERED=1 .venv/bin/python scripts/tag_webtoons.py --platform all --limit 200
```

---

## 7. 변경 이력 (CHANGES)

### 웹툰 월드컵 MVP (2026-07-31)

- migration `004_world_cup.sql` — sessions / matches / choices
- 동적 1v1 취향 배틀 (고정 8강 브래킷 아님)
- `SELECTED_LEFT` / `SELECTED_RIGHT` / `UNKNOWN_BOTH`, 유효 선택 7회
- 취향 태그·5축 합성 + 주말 정주행 추천 최대 3개 + result snapshot 공유
- API: `POST/GET /api/world-cup/...`

---

## 8. 프론트 구현 체크리스트

1. `POST /sessions` → `match` 렌더 (썸네일·제목·장르·회차)
2. 왼쪽 / 오른쪽 / 둘 다 안 봤어요 → `POST /choices`
3. `progress.completedChoices / requiredChoices`로 진행 UI
4. `UNKNOWN_BOTH`여도 진행 바는 올리지 않음
5. 마지막 응답 `COMPLETED`면 `result`로 취향·추천 화면
6. 공유: `result.share.path` 또는 `GET /results/{resultId}`
7. 새로고침: `GET /{worldCupId}`로 match 복구
8. Supabase 직접 조회 금지 — FastAPI만

---

## 9. 관련 문서

| 문서                         | 내용                           |
| ---------------------------- | ------------------------------ |
| `FRONTEND_API.md` §11        | 프론트 계약 (이 문서와 동기화) |
| `BACKEND_STRUCTURE.md`       | 모듈 역할 표                   |
| `README.md`                  | 마이그레이션·테스트 명령       |
| `CHANGES.md`                 | 릴리스 노트                    |
| `docs/NEXT_BACKEND_STEPS.md` | 후속 TODO                      |
| `/docs`                      | OpenAPI 실시간 스키마          |
