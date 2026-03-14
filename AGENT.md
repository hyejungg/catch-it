# agent.md

## 작업 기준(Working baseline)
- 코드 작업은 **plan.md** 와 **mockup.html** 을 기준(소스 오브 트루스)으로 진행한다.
- 문서와 코드가 불일치할 경우, **우선 plan.md/mockup.html에 맞게 코드를 수정**한다.
  - 불가피하게 plan.md/mockup.html을 수정해야 한다면, 그 사유와 변경 내용을 진행 문서에 반드시 기록한다(아래 참고).

## 진행 문서 작성(Progress documentation)
- 의미 있는 작업 단위(마일스톤/진행 구간)마다 아래 경로로 문서를 작성한다.
  - `docs/progress/1-{progress-name}.md`
- 진행 문서는 **작업을 하면서 수시로 업데이트**한다(작업 완료 후 일괄 작성 금지).

### 진행 문서 기본 구성
각 `docs/progress/1-{progress-name}.md`에는 최소 아래 항목을 포함한다.

- **목표(Goal)**
- **범위(Scope)**: 포함/제외 명시
- **변경 사항(Changes)**: 파일/모듈/기능 단위
- **상태(Status)**: `todo` / `in-progress` / `done` / `blocked`
- **메모(Notes)**: 결정/트레이드오프/문서 대비 편차
- **다음(Next)**

### 파일명 규칙
- `{progress-name}`은 짧고 명확한 **kebab-case**로 작성한다.
- 예시:
  - `1-capture-popover`
  - `1-storage-crud`
  - `1-dashboard-list`
  - `1-notion-push-sync`

---

## GitHub 컨벤션(Commit / PR)

### 커밋 메시지 규칙: Gitmoji + 일반적으로 널리 쓰는 포맷
- **형식**
  - `:gitmoji: <type>(<scope>): <subject>`
- **예시**
  - `✨ feat(content): 드래그 팝오버 표시`
  - `🐛 fix(ui): 목록 검색 시 공백 처리`
  - `🔧 chore(build): mv3 manifest 권한 정리`
  - `📝 docs: prd 업데이트`
  - `♻️ refactor(storage): highlight 저장 로직 정리`
  - `✅ test: notion sync 유닛 테스트 추가`

#### type (권장)
- `feat`: 기능 추가
- `fix`: 버그 수정
- `chore`: 설정/의존성/빌드/잡일
- `docs`: 문서
- `refactor`: 리팩토링(기능 변경 없음)
- `style`: 포맷/스타일(로직 변경 없음)
- `test`: 테스트 추가/수정

#### scope (권장)
- `content` (content-script)
- `background` (service worker)
- `ui` (dashboard/settings)
- `storage`
- `notion`
- `build`
- `docs`

#### Gitmoji 매핑(권장, 널리 사용)
- `✨` 기능 추가 (feat)
- `🐛` 버그 수정 (fix)
- `📝` 문서 (docs)
- `🎨` 코드 스타일/포맷(가독성) (style)
- `♻️` 리팩토링 (refactor)
- `✅` 테스트 (test)
- `🚀` 배포/릴리즈(선택)
- `🔧` 설정/환경/도구(chore)
- `⬆️` 의존성 업그레이드(chore)
- `🔥` 코드/파일 제거(주의)
- `🚑️` 핫픽스(긴급)

> 참고: Gitmoji는 “이모지 의미”가 팀마다 달라지기 쉬우니, 위 매핑을 프로젝트 표준으로 고정한다.

### 작은 단위 커밋 원칙(필수)
- 커밋은 **가능한 한 작게** 유지한다.
- **한 커밋 = 하나의 논리적 변경 단위**를 원칙으로 한다.
  - (좋음) popover UI 추가만
  - (나쁨) popover + 저장소 스키마 변경 + 대시보드 UI까지 한 번에
- 커밋 시점 기준:
  - “빌드가 깨지지 않는 상태”에서 커밋한다.
  - 실패하는 실험/임시 코드는 stash 또는 별도 브랜치 사용.

### 브랜치/PR 규칙(선택)
- 브랜치명: `feature/<short-desc>`, `fix/<short-desc>`, `chore/<short-desc>`
- PR 제목: 커밋 규칙과 동일하게 작성
- PR 본문(간단 템플릿)
  - 무엇을 했는가
  - 어떻게 테스트했는가
  - 스크린샷(필요 시)

---

## 코드 컨벤션(Code convention)

### 기본 원칙
- 코드 스타일은 **ESLint 규칙을 단일 소스 오브 트루스**로 삼는다.
- 포맷팅은 **Prettier**로 통일하고, ESLint와 충돌하지 않도록 설정한다.
- 저장 시 자동 포맷(에디터) + CI에서 lint 체크를 권장한다.

### ESLint/Prettier 규칙(권장)
- Vue 3 + TypeScript 사용
- 권장 프리셋(예)
  - `eslint:recommended`
  - `plugin:vue/vue3-recommended`
  - `@typescript-eslint/recommended` (TS 사용 시)
  - `prettier` (충돌 방지)

### 네이밍/구조 규칙
- 파일/폴더: `kebab-case`
- 컴포넌트: `PascalCase.vue`
- 변수/함수: `camelCase`
- 상수: `UPPER_SNAKE_CASE` (전역 상수/토큰만)
- 타입/인터페이스: `PascalCase`

### Vue 작성 규칙(권장)
- `script setup` 사용
- UI 컴포넌트는 “프리젠테이션”과 “비즈니스 로직” 분리

### 타입/에러 처리
- TypeScript 사용: shared types를 `/src/shared/types`에 모은다.
- 에러 메시지는 사용자용(짧게) + 내부 로그용(상세) 분리한다.
- Notion 토큰/DB ID 등 민감값은 로그에 남기지 않는다.

### 디렉토리 가이드(권장)
- `src/content-script/*`
- `src/background/*`
- `src/ui/*`
- `src/shared/*` (types, storage helpers, notion client)

---
