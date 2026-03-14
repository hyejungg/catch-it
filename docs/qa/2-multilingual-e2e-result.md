# QA Result: Multilingual E2E

## 실행 정보
- 실행 날짜: 2026-03-14
- 실행자: Codex (Playwright MCP)
- 대상 커밋: `2ec0f6c`
- 브라우저/환경: Playwright Chromium + `vite preview` (`http://127.0.0.1:4173/sidepanel.html`)
- 결과 요약: `partial`

## 실행 범위
- Side Panel UI 진입
- 브라우저 언어 기반 초기 렌더링 확인
- Settings 언어 전환 버튼 동작 확인
- Dashboard/Settings 주요 텍스트 즉시 재렌더링 확인
- 미리보기 환경 재진입 시 저장 기반 persistence 한계 확인

## 확인 완료

### 1) 초기 언어 렌더링
- Playwright 브라우저 환경에서 첫 진입 시 한국어 UI로 렌더링됨
- 확인 문구:
  - `CatchIt - 웹 텍스트 수집기`
  - `대시보드`
  - `저장된 텍스트 검색...`
  - `최근 저장된 항목 0`
  - `지금 동기화`

판정:
- 현재 실행 브라우저 언어가 `ko` 계열일 때 초기 UI가 한국어로 시작하는 동작 확인

### 2) Settings 언어 전환
- 헤더 우측 `설정` 버튼 클릭 후 Settings 진입 확인
- 언어 선택 버튼 `영어`, `한국어` 노출 확인
- `영어` 버튼 클릭 시 전체 UI가 즉시 영어로 전환됨

영어 전환 후 확인 문구:
- `CatchIt - Web Text Collector`
- `Settings`
- `Language`
- `Notion Integration`
- `Test Connection`
- `Open Notion DB`
- `Behavior Settings`

판정:
- 언어 전환 즉시 반영 `pass`

### 3) Dashboard 재렌더링
- 영어 전환 후 `Dashboard` 버튼 클릭
- Dashboard 문구가 영어로 유지되는지 확인

확인 문구:
- `Dashboard`
- `Search saved text...`
- `Recent items 0`
- `Sync Now`
- `No matching results found.`

판정:
- Dashboard/Settings 간 이동 시 선택 언어 유지 `pass`

## 관찰 사항
- Notion 안내 영역 링크 문구와 본문 문구가 영어/한국어 각각 자연스럽게 치환됨
- 버튼/placeholder/헤더/빈 상태 문구는 전환 직후 즉시 반영됨
- 현재 미리보기 환경에서는 저장된 데이터가 없어 목록/상태 배지의 실제 다국어 조합은 제한적으로만 확인 가능

## 제한 사항
- 이번 실행은 Chrome 확장 런타임이 아닌 `vite preview` 기준 확인이다.
- 따라서 `chrome.storage.local` 기반 언어 저장 유지 여부는 이 환경에서 완전한 E2E로 검증할 수 없다.
- 실제로 동일 URL을 새로 다시 열면 브라우저 언어 기준 초기값으로 돌아왔고, 이는 preview 환경에서 저장소가 비활성인 영향으로 판단된다.
- content script 팝오버와 background 연동 메시지의 실제 확장 런타임 E2E는 Chrome 확장 로드 환경에서 별도 수동 QA가 필요하다.

## 결론
- 브라우저 언어 기반 초기 렌더링과 Settings 내 즉시 언어 전환은 확인됐다.
- 다만 "사용자가 바꾼 언어가 이후에도 유지되는지"는 실제 확장 런타임에서 추가 확인이 필요하므로 전체 판정은 `partial`로 기록한다.

## 후속 권장
1. Chrome에 `dist` 확장을 실제 로드한 뒤 언어 변경 후 브라우저 재실행/재진입 유지 여부를 수동 QA로 확인
2. content script 팝오버의 `Save` / `저장`, `Tags (comma separated)` / `태그(쉼표 구분)` 전환 확인
3. Notion 연동 성공/실패 메시지가 선택 언어와 일치하는지 확장 런타임에서 재확인
