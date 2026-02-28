# CatchIt — 웹 텍스트 노션 동기화 및 수집기
> Chrome Extension (MV3) 형태의 하이라이트 수집 도구  
> 웹에서 텍스트를 드래그하면 즉시 저장 여부 UI가 뜨고, 링크/제목과 함께 수집된다.  
> 기본은 로컬 저장(chrome.storage.local), 옵션으로 Notion DB로 동기화(Push Sync)한다.

---

## 1. 배경 및 목적

### 1.1 문제 정의
- 웹에서 유용한 문장을 발견해도 저장/정리/재발견의 비용이 크다.
- 단순 메모 앱은 “현재 페이지 컨텍스트(링크/제목/문맥)”가 빠져 재사용성이 떨어진다.
- LLM으로 요약/정리는 가능하지만, **드래그 기반 수집 + 즉시 저장 + 브라우저 내 목록/재방문 루프**는 별도 도구가 더 빠르고 반복 사용성이 높다.

### 1.2 목표(Goals)
- 드래그 → 저장까지 최소 클릭(1~2번)으로 끝나는 수집 경험 제공
- 저장 시 **텍스트 + URL + 페이지 제목 + 저장 시각**을 자동 수집
- 확장 프로그램 내부에서 빠르게 목록/검색/삭제 가능
- 옵션 기능: Notion DB로 **동기화(Push Sync)**

### 1.3 비목표(Non-goals)
- 서버 DB/계정/로그인/멀티 디바이스 동기화(자체 서비스) 제공하지 않음
- Notion → 로컬로의 Pull Sync, 양방향 충돌 해결은 MVP에서 제외
- 웹페이지에 하이라이트를 “영구 표시(재방문 시 표시 유지)”는 MVP에서 제외
- 고급 템플릿/요약/분석 기능은 범위 밖(수집/관리/동기화 중심)

---

## 2. 제품 정의

### 2.1 한 줄 정의
웹에서 드래그한 하이라이트를 로컬에 저장하고, 원하면 Notion DB에 동기화할 수 있는 Chrome 확장 프로그램.

### 2.2 핵심 가치
- **수집 UX**: 드래그 기반, 컨텍스트 자동 수집
- **보관 UX**: 확장 내부 목록에서 빠른 검색/정리
- **옵션 동기화**: Notion DB에 중앙 보관(개인 워크스페이스 활용)

---

## 3. 사용자 시나리오(User Stories)

### 3.1 하이라이트 수집
- 사용자는 웹페이지에서 텍스트를 드래그하고, 뜨는 UI에서 “캐치잇”을 눌러 하이라이트를 저장한다.
- 저장된 항목은 URL과 제목을 포함한다.

### 3.2 목록 확인 및 관리
- 사용자는 확장 프로그램 UI(사이드 패널 또는 옵션/페이지)에서 저장된 하이라이트 목록을 확인한다.
- 사용자는 검색/태그(옵션)/삭제를 통해 항목을 관리한다.
- 사용자는 항목 클릭으로 원문 URL을 새 탭으로 연다.

### 3.3 Notion 동기화(옵션)
- 사용자는 Notion API 토큰 및 Database ID(또는 선택 UI)를 설정하고 Sync를 활성화한다.
- 이후 저장되는 하이라이트는 Notion DB에 자동 생성되거나, 수동 “Sync now”로 배치 동기화된다.

---

## 4. UX / IA(정보 구조)

### 4.1 드래그 시 플로팅 UI(콘텐츠 스크립트)
- 텍스트 드래그 완료 시 선택 영역 근처에 작은 팝오버 표시
  - 버튼: **저장 / 취소**
  - 옵션(가능하면): 태그 입력, “Notion에도 동기화” 상태 표시(ON일 경우 자동)
  - UX 피로도 제어(설정에서 옵션 제공):
    - 기본: 드래그 시 항상 표시
    - 옵션: `Alt` 누르고 드래그할 때만 표시

### 4.2 확장 프로그램 UI
> 구현 선택지: Side Panel 권장(“옆 패널” 요구와 자연스럽게 일치)  
> 대안: Popup + “Open Dashboard” 버튼으로 별도 페이지

#### 4.2.1 Dashboard(목록)
- 검색창
- 필터(옵션): 태그, 날짜
- 리스트 아이템
  - 텍스트(요약 표시: N자 제한)
  - 사이트 도메인 / 제목
  - 저장 시각
  - 상태: Notion sync 상태(옵션)
- 아이템 액션
  - 원문 열기
  - 복사
  - 삭제

#### 4.2.2 Settings(설정)
- 수집 UI 표시 방식: 항상 / Alt+Drag
- 저장소: 기본 로컬(chrome.storage.local) 고정
- Notion 연동:
  - Integration Token 입력
  - Database ID 입력(또는 선택 지원 시 선택)
  - Sync ON/OFF 토글
  - Sync now 버튼
  - 동기화 로그/오류 표시(간단)

---

## 5. 기술 스택 제안(요구 조건 반영)

### 5.1 기본 스택(권장)
- **Chrome Extension Manifest V3**
- UI 프레임워크: Tailwind cs, primeVue
- 프레임워크/빌드: Vue3/Vite

### 5.2 저장소
- 기본: `chrome.storage.local`
- (선택) 향후 확장 시: IndexedDB(대량 데이터/검색 성능)

### 5.3 ID 생성
- 항목 식별자는 **UUID** 사용(예: `crypto.randomUUID()`)

### 5.4 Notion 연동
- Notion API 호출은 Background(Service Worker)에서 수행 권장
- 토큰은 로컬에만 저장 (`chrome.storage.local`)
- 동기화는 MVP에서 **Push only** (로컬 → Notion)

---

## 6. 기능 요구사항(Functional Requirements)

### 6.1 하이라이트 수집(필수)
**FR-1.** 사용자가 페이지에서 텍스트를 드래그하면 팝오버가 뜬다.  
**FR-2.** 팝오버에는 저장/취소 버튼이 있어야 한다.  
**FR-3.** 저장 시 아래 메타데이터를 함께 저장한다:
- `id`(UUID)
- `text`(선택된 텍스트)
- `url`(현재 페이지 URL)
- `title`(페이지 제목)
- `createdAt`(timestamp)

**FR-4.** (옵션) 저장 시 선택 영역 앞/뒤 문맥 일부를 저장할 수 있다:
- `contextBefore`, `contextAfter` (각 N자 제한)

**FR-5.** 동일 텍스트+URL 중복 저장 방지 옵션(선택):
- 기본은 허용(단, 설정으로 중복 방지 가능)

### 6.2 로컬 저장/조회(필수)
**FR-6.** 저장된 항목은 `chrome.storage.local`에 보관한다.  
**FR-7.** Dashboard에서 목록을 조회할 수 있다.  
**FR-8.** Dashboard에서 검색(텍스트 포함 검색)을 제공한다.  
**FR-9.** 항목 클릭 시 원문 URL을 새 탭에서 열 수 있다.  
**FR-10.** 항목 복사(텍스트만 / 텍스트+URL) 기능 제공.  
**FR-11.** 항목 삭제 기능 제공.

### 6.3 태그(선택/권장)
**FR-12.** 항목에 태그를 추가/편집할 수 있다.  
**FR-13.** 태그 필터링을 제공한다.

### 6.4 Notion 동기화(옵션, 구현 목표에 포함)
**FR-14.** 사용자는 Notion Integration Token을 설정 화면에서 입력/저장할 수 있다.  
**FR-15.** 사용자는 Notion Database ID를 설정할 수 있다.  
**FR-16.** Sync ON/OFF 토글을 제공한다.  
**FR-17.** Sync ON 상태에서 새로 저장된 항목은 Notion DB에 자동 생성된다(가능하면 비동기/큐 처리).  
**FR-18.** “Sync now” 버튼으로 로컬 항목 중 미동기화 항목을 배치로 동기화한다.  
**FR-19.** 동기화 결과를 로컬에 기록한다:
- `notion.pageId`
- `notion.syncedAt`
- `notion.status` (`synced|failed|pending`)
- `notion.error`(선택)

**Notion DB 필드(권장 스키마)**
- Name (title): 페이지 제목 또는 자동 생성 제목
- Quote (rich_text): 선택 텍스트
- URL (url): 원문 링크
- SavedAt (date): 저장 시각
- Tags (multi_select): 태그(옵션)

**동기화 범위**
- MVP: **로컬 → Notion 생성만**(Push-only)
- Pull/양방향/충돌 해결은 제외

---

## 7. 비기능 요구사항(Non-Functional Requirements)

### 7.1 성능
- 드래그 후 팝오버 표시: 200ms 이내 목표
- 저장 처리: 300ms 이내(로컬)
- Dashboard 초기 로딩: 1초 이내(일반 데이터량 기준)

### 7.2 호환성
- Chrome 최신 버전 기준(MV3)
- Side Panel은 Chrome 지원 범위 내에서 사용(미지원 시 Dashboard 페이지 대체 가능)

### 7.3 보안/프라이버시
- 서버 저장 없음(기본)
- Notion 토큰은 로컬 저장, 외부 전송은 Notion API 호출에 한정
- 사용자가 민감 정보 하이라이트 저장 가능성 안내(설정/온보딩에 경고 문구)

---

## 8. 에러 처리 요구사항

### 8.1 수집 관련
- 선택 텍스트가 너무 짧으면(예: 1~2자) 저장 버튼 비활성화(옵션)
- iframe/특수 페이지에서 selection 접근 실패 시 안내 토스트(간단)

### 8.2 Notion 동기화 관련
- 인증 실패(401), 권한 오류(403), 레이트리밋(429) 구분하여 메시지 표시
- 실패 항목은 `failed`로 표시하고 재시도 가능해야 함
- 네트워크 실패 시 큐에 남겨 재시도(간단한 방식으로 구현)

---

## 9. 범위(Scope) — 하루 구현 기준 MVP

### 9.1 MUST(필수)
- 드래그 감지 + 팝오버(저장/취소)
- 로컬 저장(chrome.storage.local)
- Dashboard 목록/검색/삭제/원문 열기/복사

### 9.2 SHOULD(권장)
- Settings(Alt+Drag 토글)
- Notion Push Sync(토큰 + DB ID + Sync now + 상태 표시)

### 9.3 COULD(있으면 좋은)
- 태그/필터
- 문맥(contextBefore/contextAfter)
- 중복 방지 옵션
- Side Panel 정식 지원(미지원 환경 대체 UI)

---
---

## 10. 구현 메모(설계 가이드)

### 10.1 확장 아키텍처
- `content-script`: selection 감지 + 팝오버 UI + 메시지 전송
- `service-worker(background)`: 저장 처리/Notion API 호출/동기화 큐
- `ui (dashboard/settings)`: Vue 3 기반 SPA (side panel 또는 extension page)

### 10.2 데이터 구조(예시)
```json
{
  "id": "uuid",
  "text": "selected text",
  "url": "https://...",
  "title": "Page Title",
  "createdAt": 1730000000000,
  "tags": ["tag1", "tag2"],
  "contextBefore": " ... ",
  "contextAfter": " ... ",
  "notion": {
    "status": "synced",
    "pageId": "xxxx",
    "syncedAt": 1730000000000,
    "error": null
  }
}

## 11. UI/UX Style Guide (디자인 스펙)

### 11.1 디자인 컨셉
- **Minimal & Flat:** 브라우징 경험을 방해하지 않는 깔끔하고 직관적인 디자인
- **Focus:** 텍스트와 하이라이트 자체에 집중할 수 있도록 여백과 선명한 대비 활용

### 11.2 Color Palette (Tailwind CSS 기준)
- **Primary (브랜드/강조):** `indigo-600` (#4F46E5) / Hover 시 `indigo-700` (#4338CA)
  - 팝오버의 '저장' 버튼, Dashboard의 주요 액션 버튼, 활성화된 태그에 사용
- **Background (배경):** - 기본 배경: `white` (#FFFFFF)
  - 확장 프로그램 앱 배경 (Dashboard): `slate-50` (#F8FAFC)
- **Text (텍스트):**
  - 기본 텍스트 (본문): `slate-800` (#1E293B)
  - 보조 텍스트 (URL, 날짜, 메타데이터): `slate-500` (#64748B)
- **Semantic (상태):**
  - 성공 (동기화 완료): `emerald-500` (#10B981)
  - 에러 (동기화 실패): `red-500` (#EF4444)

### 11.3 Typography (글꼴)
- **기본 폰트:** 웹 환경에 최적화된 Sans-serif (Pretendard 또는 Inter 권장)
- **계층 구조:**
  - `text-lg` / `font-semibold` : Dashboard 페이지 제목
  - `text-base` / `font-medium` : 리스트 아이템의 제목(Title)
  - `text-sm` / `font-normal` : 저장된 텍스트 본문(Quote)
  - `text-xs` / `text-slate-500` : URL 및 날짜 정보

### 11.4 UI Components (PrimeVue 활용)
- **버튼 (Button):** 모서리가 둥근 형태 (Tailwind `rounded-md` 또는 `rounded-lg`)
- **팝오버 (Popover/Tooltip):** 그림자를 주어 웹페이지와 분리감 부여 (`shadow-lg`, `border border-slate-200`)
- **리스트 (DataView/List):** 항목 간 구분선 (`divide-y divide-slate-100`) 또는 카드형 레이아웃 (`bg-white shadow-sm`)
