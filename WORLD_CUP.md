# TOONA 웹툰 월드컵

프론트·백엔드·DB·운영을 한곳에 모은 문서입니다.  
API 축약본: `FRONTEND_API.md` §11 · OpenAPI: `/docs`

| | |
|--|--|
| Base URL | `http://localhost:8000` |
| OpenAPI | `/docs` |
| Migration | `004_world_cup.sql` + **`005_world_cup_tournament.sql`** |
| Contender JSON | `data/world_cup/acquisition-main-v1.json` |
| Seed CLI | `scripts/seed_world_cup_set.py` |
| Validate CLI | `scripts/validate_world_cup_set.py` |
| Code | `world_cup/*`, `app/api/routes/world_cup.py` |
| Tests | `test_world_cup.py` |

---

## 1. 제품 역할 (중요)

웹툰 월드컵은 TOONA의 **핵심 추천 기능이 아닙니다.**

외부 광고·공유로 신규 사용자를 유입시키는 **일회성 마케팅 미끼**입니다.

첫 유입에서 중요한 것:

1. 제시된 작품을 **대부분 알고 있을 것** (초유명 16강)
2. 완료 후 기존 **taste-analysis → recommendations → 홈**으로 자연스럽게 이동

월드컵 백엔드는 **winner 하나만** 결정합니다.  
분석·추천은 월드컵에서 계산하지 않습니다.

### 최종 플로우

```
광고 / 공유 링크
  → 이번 주말 정주행 월드컵 (mode=ACQUISITION)
  → 유명 웹툰 16강 (총 15경기)
  → 결승 승자 = winner
  → 프론트: “당신의 최애 웹툰은 {title}이군요”
  → [분석하기] → GET /api/webtoons/{winner.id}/taste-analysis
  → GET /api/recommendations?webtoonId={winner.id}&sessionId=...
  → TOONA 홈
```

홈 **월드컵 다시 하기** → 같은 `POST /sessions`에 `mode=REPLAY`  
(MVP: 동일 `acquisition-main-v1` 세트, `sessionSeed`만 달라 대진이 조금 바뀜)

---

## 2. Mode

| mode | 용도 |
|------|------|
| `ACQUISITION` | 광고·첫 유입 **기본값**. 장르 선택 없음. size=16 고정 |
| `REPLAY` | 홈 “다시 하기”. MVP는 acquisition 세트 재사용 |

요청에 `genre` 필드 없음. 보내도 무시되지 않고 스키마에 없음.

---

## 3. 정식 16강 토너먼트

| round | 경기 수 |
|-------|---------|
| `ROUND_OF_16` | 8 |
| `QUARTER_FINAL` | 4 |
| `SEMI_FINAL` | 2 |
| `FINAL` | 1 |
| **합계** | **15** |

규칙:

- 사용자가 고른 작품만 다음 라운드 진출
- 결승 승자 = 응답 `winner`
- 세션 생성 시 `contender_snapshot` + `bracket_snapshot` 저장  
  → 이후 운영 세트가 바뀌어도 **진행 중 세션 대진은 불변**
- 세션 TTL **24시간** (`expiresAt`)

### 대진 연결

```
R16 match 0 winner vs match 1 winner → QF 0
R16 2·3 → QF 1
R16 4·5 → QF 2
R16 6·7 → QF 3
QF 0·1 → SF 0
QF 2·3 → SF 1
SF 0·1 → FINAL
```

### 시드·대진 변형

- PRIMARY 16개에 `seedOrder` / `popularityTier` 저장
- classic 16-seed 배치로 상위 시드가 R16에서 바로 붙지 않게 함
- `sessionSeed` (`{mode}:{sessionId}`)로 하프 스왑·쿼터 회전·좌우 플립만 허용
- **같은 sessionSeed → 같은 대진**
- ACQUISITION v1의 후보 16명 자체는 고정 (랜덤 추출 없음)

---

## 4. 운영 큐레이션 세트

일반 `webtoons` 조회에서 **무작위 16개 선택하지 않습니다.**

### 테이블

| 테이블 | 역할 |
|--------|------|
| `world_cup_contender_sets` | 세트 메타 (`code`, `title`, `mode`, `size=16`, `is_active`, `version`) |
| `world_cup_contender_set_items` | 작품 (`role=PRIMARY\|RESERVE`, `seed_order`, `popularity_tier`) |

초기 세트:

| 필드 | 값 |
|------|-----|
| code | `acquisition-main-v1` |
| title | `이번 주말 정주행 월드컵` |
| mode | `ACQUISITION` |
| size | 16 |
| PRIMARY | 16 |
| RESERVE | 8 (최소 4 필요) |

시드 파일은 **webtoon UUID가 아니라** `platform` + `platformId`로 적고, seed 스크립트가 UUID로 resolve합니다.  
없는 작품은 **조용히 skip하지 않고 실패**합니다.

### 작품 필수 조건 (PRIMARY·RESERVE 공통)

- `webtoons`에 존재
- recommendation 태그 존재 (= `recommendationReady`)
- taste-analysis / recommendations **source**로 사용 가능
- `thumbnailUrl`(`thumb_url`), `officialUrl`(`link`), `title`, `status` 존재

하나라도 실패하면 다른 작품으로 **자동 교체하지 않습니다.**  
`invalid_contender_set` / CLI 검증 실패로 남깁니다.

### 운영 선별 기준 (코드가 유명세를 추측하지 않음)

- 국내 웹툰 이용자 높은 인지도
- 네이버·카카오 균형 (현재 v1: 태그 준비된 Kakao가 적어 NAVER 비중 높음)
- 장르·성별 취향 편중 최소화
- 연재·완결 혼합
- 월드컵에서 비교할 감정이 생기는 작품
- 최종 winner여도 추천 품질이 충분한 작품

`popularityScore` / ranking은 **발굴 참고만**. 자동 최종 선정 금지.

### acquisition-main-v1 구성 (platformId)

**PRIMARY (표시 16)**

| seed | platform | platformId | 작품 (참고) |
|------|----------|------------|-------------|
| 1 | naver | 769209 | 화산귀환 |
| 2 | naver | 641253 | 외모지상주의 |
| 3 | naver | 703846 | 여신강림 |
| 4 | naver | 783053 | 김부장 |
| 5 | naver | 736277 | 싸움독학 |
| 6 | naver | 800770 | 재벌집 막내아들 |
| 7 | naver | 758037 | 참교육 |
| 8 | naver | 721948 | 스터디그룹 |
| 9 | naver | 717481 | 일렉시드 |
| 10 | naver | 570503 | 연애혁명 |
| 11 | kakao | 2310 | 닥터 최태수 |
| 12 | kakao | 2473 | 이번 생은 가주가 되겠습니다 |
| 13 | naver | 597447 | 프리드로우 |
| 14 | naver | 730656 | 사신소년 |
| 15 | naver | 119874 | 덴마 |
| 16 | naver | 812629 | 내향남녀 |

**RESERVE (UNKNOWN_BOTH 교체용)**

| seed | platform | platformId | 작품 (참고) |
|------|----------|------------|-------------|
| 17–24 | naver/kakao | 710751, 773797, 796075, 747271, 828715, 789979, 3211, 557672 | 약한영웅, 나 혼자 만렙 뉴비, 절대검감, 나노마신, 절대회귀, 멸망 이후의 세계, 무한의 마법사, 기기괴괴 |

목록 변경 시 JSON 수정 → validate → seed `--activate`.

---

## 5. UNKNOWN_BOTH

| 라운드 | 정책 |
|--------|------|
| `ROUND_OF_16` | 허용. `completedMatches` 증가 없음. `matchIndex` 유지. 슬롯 2작품을 unused reserve 2개로 교체. snapshot 반영. 동일 작품 재사용 금지 |
| `QUARTER_FINAL` 이후 | 거절 (`unknown_not_allowed`) |

reserve 부족 시 `insufficient_reserves`.

프론트: 8강부터 “둘 다 안 봤어요” 버튼을 숨기거나 비활성.

---

## 6. API

공통 에러:

```json
{ "error": "...", "message": "...", "requestId": "..." }
```

세션 상태: `IN_PROGRESS` · `COMPLETED` · `EXPIRED`

### 6.1 `POST /api/world-cup/sessions`

**Request**

```json
{ "sessionId": "anon-session-id", "mode": "ACQUISITION" }
```

| 필드 | 필수 | 설명 |
|------|------|------|
| `sessionId` | ✅ | 익명/기기 세션 키 |
| `mode` | | 기본 `ACQUISITION`. `REPLAY` 가능 |

**Response (진행 중)**

```json
{
  "worldCupId": "uuid",
  "status": "IN_PROGRESS",
  "mode": "ACQUISITION",
  "title": "이번 주말 정주행 월드컵",
  "tournament": {
    "size": 16,
    "currentRound": "ROUND_OF_16",
    "currentMatchIndex": 0,
    "completedMatches": 0,
    "totalMatches": 15
  },
  "match": {
    "matchId": "uuid",
    "round": "ROUND_OF_16",
    "matchIndex": 0,
    "left": {
      "id": "...",
      "title": "화산귀환",
      "platform": "NAVER",
      "author": "...",
      "status": "ONGOING",
      "thumbnailUrl": "https://...",
      "officialUrl": "https://...",
      "genres": ["Historical", "Fantasy"],
      "latestEpisodeNumber": 200,
      "totalEpisodeCount": null
    },
    "right": { }
  },
  "expiresAt": "2026-08-02T10:00:00+00:00"
}
```

### 6.2 `POST /api/world-cup/{worldCupId}/choices`

**Request**

```json
{
  "matchId": "...",
  "leftWebtoonId": "...",
  "rightWebtoonId": "...",
  "action": "SELECTED_LEFT"
}
```

| action | 의미 |
|--------|------|
| `SELECTED_LEFT` | 왼쪽 승자 진출, `completedMatches` +1 |
| `SELECTED_RIGHT` | 오른쪽 승자 진출, `completedMatches` +1 |
| `UNKNOWN_BOTH` | 16강만. 진행도 유지 + reserve 교체 |

서버가 현재 `matchId` / left / right ID를 검증합니다. 위조·불일치 → `invalid_match`.

- 미완료 → 다음 `match` 포함
- 완료 → 아래 완료 응답

### 6.3 완료 응답

```json
{
  "worldCupId": "uuid",
  "status": "COMPLETED",
  "mode": "ACQUISITION",
  "title": "이번 주말 정주행 월드컵",
  "tournament": {
    "size": 16,
    "completedMatches": 15,
    "totalMatches": 15
  },
  "winner": {
    "id": "...",
    "title": "화산귀환",
    "platform": "NAVER",
    "author": "...",
    "status": "ONGOING",
    "thumbnailUrl": "https://...",
    "officialUrl": "https://...",
    "genres": ["Historical", "Fantasy"],
    "latestEpisodeNumber": 200,
    "totalEpisodeCount": null
  },
  "resultId": "uuid",
  "expiresAt": "..."
}
```

**절대 포함하지 않음:** `analysis`, `axes`, `recommendations`, `selectedHighlights`

프론트는 `winner.id`만 기존 단일 작품 분석·추천 플로우에 넘깁니다.

### 6.4 `GET /api/world-cup/{worldCupId}`

새로고침 복구.  
`IN_PROGRESS` → 현재 `match` / `COMPLETED` → `winner`.

### 6.5 `GET /api/world-cup/results/{resultId}`

공유용 공개 결과. **winner만.**  
`sessionId` / raw choices 비노출.

### 에러 코드

| error | HTTP | 의미 |
|-------|------|------|
| `invalid_mode` | 400 | mode 오류 |
| `bad_request` | 400 | sessionId 등 |
| `invalid_choice_action` | 400 | action 오류 |
| `unknown_not_allowed` | 400 | 8강+에서 UNKNOWN_BOTH |
| `invalid_world_cup` | 404 | 세션 없음 |
| `result_not_found` | 404 | 공유 결과 없음 |
| `expired_world_cup` | 410 | 만료 |
| `completed_world_cup` | 409 | 이미 완료에 choice |
| `invalid_match` | 409 | match 불일치 |
| `duplicate_choice` | 409 | 동일 match 재시도 |
| `insufficient_reserves` | 422 | reserve 고갈 |
| `invalid_contender_set` | 422 | 활성 세트 readiness 실패 |
| `contender_set_unavailable` | 503 | 활성 세트 없음 (시드 미적용) |

---

## 7. 프론트 연동 체크리스트

1. 랜딩 CTA → `POST /sessions` (`mode=ACQUISITION`, `genre` 없음)
2. `tournament.currentRound` / `completedMatches` / `totalMatches`로 진행 UI
3. 카드: `match.left` / `match.right` (thumbnail · title · platform)
4. 16강만 `UNKNOWN_BOTH` 노출
5. `COMPLETED` → “최애는 {winner.title}” + 분석 CTA
6. 분석: `GET /api/webtoons/{winner.id}/taste-analysis`
7. 추천: `GET /api/recommendations?webtoonId={winner.id}&sessionId=...`
8. 홈 다시 하기 → `mode=REPLAY`
9. 공유 시 `resultId` → `GET /results/{resultId}`

---

## 8. 운영: 마이그레이션 · 시드 · 검증

### 반드시 이 순서

시드 스크립트만 돌리면 아래 에러가 납니다:

```text
Could not find the table 'public.world_cup_contender_sets' (PGRST205)
```

**원인:** `005` SQL이 Supabase에 아직 없음. (터미널의 `# 1) ...` 주석은 실행이 아님)

```bash
# ① Supabase Dashboard → SQL Editor
#    migrations/005_world_cup_tournament.sql 전체 붙여넣기 → Run
#    (004가 없다면 004도 먼저)

# ② 시드 + 활성화
.venv/bin/python -m scripts.seed_world_cup_set \
  data/world_cup/acquisition-main-v1.json --activate

# ③ 검증
.venv/bin/python -m scripts.validate_world_cup_set acquisition-main-v1
```

성공 시 validate 예:

- `primary_count=16` / `reserve_count=8`
- platforms / genres / statuses 분포
- `OK: set is ready for activation`

검증 실패 세트는 `--activate` 불가.  
`--allow-invalid`는 insert만 허용하고 activate는 막습니다.

### 스키마 요약 (005)

- `world_cup_contender_sets` / `world_cup_contender_set_items` 생성
- `world_cup_sessions`에 `mode`, `tournament_*`, `winner_webtoon_id`, snapshots 등 추가
- `world_cup_matches`에 `round`, `match_index`, `winner_webtoon_id` 추가  
- 구(동적 7선택) 컬럼은 호환용으로 잔존. **새 API 계약은 토너먼트 필드만 사용**

---

## 9. 테스트 (백엔드)

`test_world_cup.py` 커버:

- ACQUISITION 기본 mode, size=16, totalMatches=15, 첫 round=ROUND_OF_16
- 세션 contender snapshot, 동일 seed 대진 안정성
- 16→8→4→결승, 승자만 진출, 결승=winner
- R16 UNKNOWN_BOTH reserve 교체·진행도 유지 / 8강+ 거절
- COMPLETED에 analysis/recommendations 없음
- 잘못된 세트 검증 실패

```bash
.venv/bin/python -m unittest test_world_cup -q
```

---

## 10. 하지 말 것

- 일반 DB에서 랜덤 16개 선택
- 추천 점수만으로 첫 유입 후보 자동 선정
- 사용자에게 첫 진입 장르 선택 요구
- 후보 부족 시 덜 유명한 작품 자동 삽입
- 유효 선택 7회 / 고정 브래킷이 아닌 동적 배틀 방식
- 선택하지 않은 작품이 다음 라운드 진출
- 월드컵 결과에서 새 분석·추천 계산
- 월드컵을 TOONA 핵심 제품처럼 과도 확장
- 복잡한 운영 어드민
- 기존 taste-analysis / recommendations API 변경

---

## 11. 완료 조건 (체크)

- [ ] Supabase에 `005_world_cup_tournament.sql` 적용
- [ ] `acquisition-main-v1` seed + activate + validate OK
- [ ] 첫 유입 월드컵 = 16강 / 총 15경기
- [ ] 운영 큐레이션 고정 세트 (랜덤 pool 아님)
- [ ] 선택 승자만 진출 → 결승 `winner`
- [ ] R16 UNKNOWN_BOTH → reserve 교체
- [ ] winner 이후 기존 분석·추천 API
- [ ] 홈에서 `REPLAY`로 다시 시작 가능
- [ ] 월드컵은 유입 미끼 역할에 집중
