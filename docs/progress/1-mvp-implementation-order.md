# Progress: MVP Implementation Order

## 목표(Goal)
- `docs/plan.md`와 `docs/mockup.html`을 기준으로 MVP 구현 순서를 정리한다.
- 영향 범위가 작은 컴포넌트부터 개발해 리스크를 낮추고, 먼저 프로젝트 세팅을 완료한다.

## 범위(Scope)
- 포함:
  - 프로젝트 초기 세팅 작업 정의
  - 컴포넌트/모듈 단위 구현 순서 정의(작은 영향 범위 우선)
  - 각 단계 산출물/완료 기준 정의
- 제외:
  - 실제 코드 구현
  - Notion Pull Sync, 양방향 동기화, 충돌 해결
  - 재방문 시 영구 하이라이트 표시

## 변경 사항(Changes)
- 신규: `docs/progress/1-mvp-implementation-order.md`
- 기준 문서 분석 결과 반영:
  - `docs/plan.md`의 MUST/SHOULD 중심 단계화
  - `docs/mockup.html`의 화면/상태/액션 흐름 기반 컴포넌트 분해
- 세팅 진행 반영:
  - Vue3 + Vite + TypeScript + Tailwind + PrimeVue + ESLint/Prettier 기본 구성 완료
  - MV3 `manifest.json` + `background/content/ui` 엔트리 구성 완료
  - 개발 서버 기본 경로 확인을 위한 `index.html` 엔트리 추가
- 데이터 레이어 진행 반영:
  - `Highlight` 타입 확장(`HighlightCreateInput`, `NotionSyncMetadata`)
  - `chrome.storage.local` 기반 CRUD 유틸(`add/get/update/upsert/delete/clear`) 구현
  - 검색/정렬/태그 필터 selector 유틸 추가

## 상태(Status)
- `in-progress`

## 메모(Notes)
- 우선순위 기준:
  1. 사용자 체감이 빠른 기능
  2. 다른 모듈에 의존성이 낮은 기능
  3. 데이터 구조 확정에 도움이 되는 기능
- 구현 순서는 MVP 완성 속도를 기준으로 재배치했다.
- `plan.md`에 명시된 소스 오브 트루스 기준을 따르며, 문서와 코드 충돌 시 문서 기준으로 수정한다.

## 개발 순서(작은 영향 범위 → 큰 영향 범위)

### 0) 프로젝트 세팅 (가장 먼저)
- 작업:
  - Vue3 + Vite + TypeScript 기반 확장앱 프로젝트 구조 정리
  - Tailwind CSS, PrimeVue, ESLint, Prettier 설정
  - MV3 `manifest` 기본 엔트리 연결(content/background/ui)
  - 공통 타입/스토리지 유틸 기본 뼈대 생성
- 완료 기준:
  - `npm run dev` 또는 빌드 명령으로 확장 기본 화면 로드
  - lint/format 기본 동작 확인
  - 최소 1개 content script + 1개 UI 페이지 + background 등록 확인
- 상태: `done`

### 1) 공통 데이터 모델/저장소 레이어
- 작업:
  - Highlight 타입 정의(`id`, `text`, `url`, `title`, `createdAt`, `tags`, `notion`)
  - `chrome.storage.local` CRUD 유틸 작성
  - 검색/정렬을 위한 기본 selector 함수 작성
- 완료 기준:
  - 저장/조회/삭제/목록 반환 유닛 단위 검증 가능
- 상태: `done`

### 2) Dashboard 검색/리스트 뼈대 (UI 단독)
- 작업:
  - Dashboard 레이아웃(헤더, 검색창, 빈 상태, 카드 리스트)
  - 더미 데이터 바인딩으로 렌더링 먼저 완성
  - 항목 액션 버튼(복사/원문열기/삭제) UI 연결
- 완료 기준:
  - mockup과 유사한 리스트/검색 인터랙션 동작
  - 저장소 연동 전에도 UI 플로우 검증 가능
- 상태: `todo`

### 3) Dashboard + 저장소 연동
- 작업:
  - 실제 storage 데이터 로딩
  - 검색 필터링/삭제/복사/원문열기 동작 연결
  - Notion 상태 배지(`pending|synced|failed`) 렌더링 연결
- 완료 기준:
  - 로컬 데이터 기준 FR-7~FR-11 충족
- 상태: `todo`

### 4) Settings 화면(일반 설정 + Notion 입력 UI)
- 작업:
  - `requireAlt`, `autoSync`, `notionToken`, `notionDbId` 폼 구성
  - 설정값 로드/저장 로직 연결
  - 기초 유효성(빈 값, 형식) 처리
- 완료 기준:
  - 설정 변경 후 재진입 시 값 유지
- 상태: `todo`

### 5) Content Script 드래그 감지 + 팝오버
- 작업:
  - 텍스트 선택 감지, 길이 조건, 팝오버 위치 계산
  - 저장/취소 버튼 및 태그 입력(선택)
  - `requireAlt` 설정 반영
- 완료 기준:
  - FR-1~FR-3 기본 저장 트리거 가능
- 상태: `todo`

### 6) Background 저장 파이프라인
- 작업:
  - content → background 메시지 채널 구성
  - UUID 생성 후 highlight 저장 처리
  - 저장 결과를 UI가 즉시 반영하도록 이벤트/재조회 전략 수립
- 완료 기준:
  - 드래그 저장 시 Dashboard 목록에서 즉시 확인 가능
- 상태: `todo`

### 7) Notion Push Sync (SHOULD)
- 작업:
  - background에서 Notion API 호출 모듈 작성
  - Auto Sync / Sync now 동작 연결
  - 상태 기록(`pageId`, `syncedAt`, `status`, `error`) 반영
  - 실패 재시도 기본 로직(간단 큐) 추가
- 완료 기준:
  - FR-14~FR-19 충족(푸시 전용)
- 상태: `todo`

### 8) 품질/마감
- 작업:
  - 에러 메시지 분리(사용자용/내부로그용)
  - 민감정보 마스킹 점검(Notion 토큰/DB ID)
  - 주요 흐름 수동 테스트 체크리스트 작성
- 완료 기준:
  - MUST 범위 안정 동작 + SHOULD 주요 플로우 확인
- 상태: `todo`

## 다음(Next)
- 1순위 실행: `2) Dashboard 검색/리스트 뼈대 (UI 단독)`
- 이후: `3) Dashboard + 저장소 연동`
