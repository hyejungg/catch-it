# Progress: Multilingual Support Plan

## 목표(Goal)
- 현재 한국어로만 노출되는 UI 텍스트를 다국어 구조로 전환한다.
- 기본 표시 언어를 영어(`en`)로 설정하고, 사용자가 한국어(`ko`)로 전환할 수 있게 한다.
- 확장 UI(`Dashboard`, `Settings`)와 웹 페이지 내 팝오버(content script)까지 동일한 언어 선택 기준을 적용한다.

## 배경(Background)
- 현재는 `src/ui/App.vue`, `src/content-script/index.ts`, `src/background/index.ts`에 사용자 노출 문구가 직접 하드코딩되어 있다.
- 설정 저장 구조(`src/shared/types/settings.ts`)에는 언어 정보가 없어, 향후 다른 언어를 추가하기 어려운 상태다.
- 영어를 기본값으로 두면 Chrome Web Store 노출, 해외 사용자 대응, 추후 언어 추가 확장성이 좋아진다.

## 범위(Scope)
- 포함:
  - 영어 기본값 + 한국어 선택 기능 설계
  - 언어 설정 저장 방식 정의
  - 번역 리소스 구조 정의
  - 적용 대상 화면 및 메시지 정리
  - 구현 순서와 해야 할 일 명시
- 제외:
  - 실제 번역 문구 확정
  - 브라우저 locale 자동 감지 기반 초기 언어 결정
  - 일본어/중국어 등 추가 언어 구현
  - Chrome Web Store 설명문/스크린샷 현지화

## 현재 상태(Current State)
- `Dashboard`, `Settings`, content script 팝오버에 영어/한국어 다국어 전환이 적용되었다.
- 언어 우선순위는 `저장된 사용자 선택값 > 브라우저 언어 > en fallback`으로 동작한다.
- 브라우저 언어가 `ko` 계열이면 한국어, `en` 계열 또는 미지원 언어이면 영어로 시작한다.
- 사용자가 언어를 변경하면 `chrome.storage.local`에 저장되어 같은 브라우저에서 유지된다.
- background의 주요 Notion 연동 메시지와 날짜 포맷도 현재 언어 기준으로 표시된다.

## 제안 방향(Proposed Approach)

### 1) 언어 정책
- 기본 언어 결정 순서:
  1. 사용자가 저장한 언어값
  2. 브라우저 UI 언어
  3. fallback 영어(`en`)
- 사용자 선택 언어: 한국어(`ko`)
- 최초 진입 시 저장된 언어값이 없으면 브라우저 언어를 확인한다.
- 브라우저 언어가 한국어 계열(`ko`, `ko-KR`)이면 `ko`로 시작하고, 그 외에는 `en`으로 시작한다.
- 브라우저 언어가 지원 대상(`en`, `ko`)에 해당하지 않으면 무조건 `en`을 사용한다.
- 브라우저 언어를 확인할 수 없는 경우에도 `en`을 fallback으로 사용한다.
- 사용자가 한 번 언어를 변경하면 해당 값은 `chrome.storage.local`에 저장하고, 같은 브라우저에서는 이후에도 동일 언어를 계속 사용한다.
- 즉, 기본값은 영어지만 사용자가 `ko`를 선택한 이후에는 재실행/재진입 후에도 한국어가 유지되어야 한다.

### 2) 설정 저장 구조 확장
- `AppSettings`에 `language: 'en' | 'ko'` 필드를 추가한다.
- 정적 기본값으로 `language: 'en'`을 두되, 초기 로드 시 저장값이 없으면 브라우저 언어 감지 결과로 덮어쓴다.
- 기존 저장 데이터에는 해당 필드가 없으므로, 현재 `getSettings()`의 merge 방식으로 무중단 호환 가능하다.

예상 변경 대상:
- `src/shared/types/settings.ts`
- `src/shared/storage/settings-storage.ts`
- `src/content-script/index.ts` 내 로컬 `AppSettings` 정의 제거 또는 공통 타입 재사용

### 3) 번역 리소스 구조 도입
- 공통 번역 사전을 `src/shared/i18n` 하위로 분리한다.
- 예시 구조:
  - `src/shared/i18n/locales/en.ts`
  - `src/shared/i18n/locales/ko.ts`
  - `src/shared/i18n/index.ts`
- 키 기반 접근으로 문자열을 관리한다.

예시 키:
- `app.title`
- `nav.dashboard`
- `nav.settings`
- `dashboard.searchPlaceholder`
- `dashboard.recentCount`
- `actions.save`
- `actions.delete`
- `settings.language`
- `settings.languageEnglish`
- `settings.languageKorean`
- `notion.testConnectionFailed`

### 4) UI 적용 원칙
- 사용자에게 보이는 모든 문구는 번역 키를 통해 렌더링한다.
- 조건부 문자열도 직접 조합하지 말고, 가능하면 파라미터 기반 포맷 함수를 사용한다.
- 날짜/시간 포맷도 언어 설정에 따라 `en-US`, `ko-KR`로 분기한다.

예시:
- `formatDate(createdAt, language)`
- `t('dashboard.syncSummary', { synced, total, failed })`

### 5) 적용 대상 우선순위
1. 확장 패널 UI(`src/ui/App.vue`)
2. content script 팝오버(`src/content-script/index.ts`)
3. background 응답 메시지(`src/background/index.ts`)
4. README 및 사용자 가이드 문서

## 상세 작업 항목(Todo)

### A. 설계/구조
- [x] `AppLanguage = 'en' | 'ko'` 타입 정의
- [x] `AppSettings`에 `language` 필드 추가
- [x] 공통 i18n 유틸(`t`, locale map, fallback`) 설계
- [x] 번역 키 네이밍 규칙 정의

### B. UI 언어 전환 기능
- [x] Settings 화면에 언어 선택 UI 추가
- [x] 저장된 값이 없을 때 브라우저 언어 기준으로 초기 선택값 결정
- [x] 언어 변경 시 즉시 현재 화면 텍스트 재렌더링
- [x] 저장 후 재진입 시 이전 선택 언어 유지
- [x] 브라우저 재시작, 확장 재오픈 이후에도 마지막 선택 언어가 유지되는지 확인

### C. Dashboard/Settings 번역 적용
- [x] 헤더 타이틀/서브타이틀 다국어화
- [x] 검색 placeholder, 빈 상태, 버튼 텍스트 번역 적용
- [x] Notion 관련 상태/에러/도움말 문구 번역 적용
- [x] `Sync now`, `Test connection`, `Open Notion` 문구 영어 기본값으로 전환
- [x] 날짜 포맷 로케일 분기 적용

### D. Content Script 번역 적용
- [x] 팝오버의 태그 placeholder 번역 적용
- [x] 저장 버튼 번역 적용
- [x] 설정에서 저장된 언어값을 읽어 팝오버 생성 시 반영
- [x] content script 내부 중복 settings 타입 제거 후 공통 타입 사용
- [x] 저장된 언어값이 없을 때 content script도 동일한 브라우저 언어 fallback 규칙 사용

### E. Background 메시지 번역 적용
- [x] `runSyncNow`, `runTestNotionConnection` 응답 메시지 번역 구조로 이동
- [x] Notion 에러 매핑 문구 다국어화
- [x] background가 사용자 메시지를 직접 완성할지, 코드만 전달하고 UI에서 번역할지 결정

권장안:
- background는 에러 코드/상태 코드 중심으로 응답
- UI에서 현재 언어 기준으로 최종 문구를 조합

이유:
- background는 화면 언어 컨텍스트를 직접 가지지 않는 편이 단순하다.
- 동일 이벤트를 여러 UI에서 재사용할 때 번역 책임을 한 곳으로 모을 수 있다.

### F. 문서/출시 반영
- [x] README 기능 설명을 영어 기본 UI 기준으로 보정
- [ ] 설정 화면 스크린샷/설명 문구 갱신 필요 여부 확인
- [ ] Chrome Web Store 설명문 다국어 운영 여부 별도 검토

## 권장 구현 순서(Recommended Order)

### 1) 설정/타입 확장
- `language` 필드와 기본값 추가
- 기존 저장 데이터와 호환되는지 확인

### 2) i18n 리소스/유틸 추가
- locale 파일 생성
- 번역 키 및 fallback 함수 구성

### 3) `App.vue` 전환
- 하드코딩 문자열 제거
- Settings에 언어 선택 UI 추가
- 날짜 포맷 로케일 반영

### 4) content script 전환
- 팝오버 문자열 번역 연결
- settings 기반 언어 반영

### 5) background 메시지 정리
- 사용자 메시지 직접 반환 구조 축소
- UI 번역 우선 구조로 정리

### 6) 문서/QA 업데이트
- README 보정
- 수동 테스트 항목 추가

## 의사결정 포인트(Decisions)

### 1) 영어를 기본값으로 둘 것인가
- 제안: 브라우저 언어 우선, 미확인 시 `en`
- 이유:
  - 첫 실행 UX가 브라우저 환경과 더 자연스럽게 맞는다.
  - 한국어 브라우저 사용자는 별도 변경 없이 바로 `ko` UI를 볼 수 있다.
  - 지원하지 않는 브라우저 언어는 모두 `en`으로 수렴시켜 분기 수를 최소화할 수 있다.
  - 언어를 찾지 못하는 경우에도 `en` fallback으로 동작을 단순하게 유지할 수 있다.

### 2) 브라우저 언어 자동 감지를 넣을 것인가
- 제안: 최초 1회 초기값 결정에만 사용
- 이유:
  - 사용자가 직접 선택한 이후에는 저장값이 우선이므로 예측 가능성이 유지된다.
  - 자동 감지를 매 진입마다 적용하면 사용자의 명시적 선택을 덮을 위험이 있다.
  - 초기 진입 UX만 개선하고 상태 관리 복잡도는 크게 늘리지 않는다.

### 3) 번역 책임을 어디에 둘 것인가
- 제안: UI 중심 번역
- background/content script는 가능한 한 원시 상태값 또는 번역 키를 전달

## 리스크(Risks)
- 문자열이 여러 파일에 흩어져 있어 일부 문구가 누락될 수 있다.
- background 메시지를 그대로 유지하면 언어가 섞여 보일 수 있다.
- 날짜/숫자 포맷만 영어식으로 바뀌어도 UX 차이가 커 보일 수 있으므로 함께 검토해야 한다.
- README와 실제 UI 캡처/가이드가 어긋날 수 있다.

## QA 체크포인트(QA)
- [x] 신규 설치 시 브라우저 언어가 `ko`면 한국어, 그 외에는 영어로 시작하는가
- [x] 기존 설치 사용자도 저장값이 없으면 브라우저 언어 기준으로 자연스럽게 초기화되는가
- [x] Settings에서 한국어 선택 시 Dashboard, Settings, 팝오버 문구가 즉시 바뀌는가
- [x] 새로고침/브라우저 재실행 후에도 선택 언어가 유지되는가
- [x] 사용자가 한 번 `ko`로 바꾸면 같은 브라우저에서는 계속 한국어로 시작하는가
- [x] 브라우저 언어가 `ja`, `fr`, `de` 등 지원하지 않는 값이면 항상 `en`으로 시작하는가
- [x] 브라우저 언어를 읽지 못하는 경우 `en`으로 안전하게 fallback 되는가
- [x] Notion 연동 실패/성공 메시지가 선택 언어와 일치하는가
- [x] 날짜 형식이 언어 설정에 맞게 보이는가

## 완료 기준(Definition of Done)
- 저장된 언어가 없을 때 브라우저 언어를 기준으로 초기 언어가 결정된다.
- 브라우저 언어를 확인할 수 없으면 영어(`en`)로 동작한다.
- Settings에서 한국어 전환이 가능하다.
- 사용자가 한국어로 전환한 뒤에는 해당 브라우저에서 지속적으로 한국어가 유지된다.
- 확장 패널과 content script의 사용자 노출 텍스트가 동일한 언어 기준으로 보인다.
- 주요 상태/오류 메시지가 선택 언어와 일치한다.
- 관련 문서가 변경된 UI 기준으로 갱신된다.

## 다음 액션(Next)
- 후속 작업:
  1. 설정 화면 스크린샷과 스토어 소개 이미지를 다국어 UI 기준으로 갱신
  2. Chrome Web Store 설명문을 영어/한국어 운영 정책에 맞게 정리
  3. `typecheck` 실패 원인인 Node 타입 설정 누락을 별도 정리
