# CatchIt

웹에서 드래그한 텍스트를 빠르게 저장하고, 필요하면 Notion DB로 동기화하는 Chrome Extension(MV3)입니다.

## 주요 기능
- 텍스트 드래그 시 팝오버(태그 입력 + 저장) 표시, 태그 입력 중 오버레이 하이라이트 유지
- 로컬 저장(`chrome.storage.local`) 기반 하이라이트 관리
- Dashboard 목록/검색/복사/원문 열기/삭제
- Settings에서 수집/동기화 옵션 관리
  - `Alt + Drag` 수집 옵션
  - Notion Token / Database ID 저장
  - Auto Sync 토글
- Notion Push Sync
  - 저장 시 자동 동기화(옵션)
  - `Sync Now` 배치 동기화
  - 상태 기록(`ready`, `sync`, `failed`)
  - `Database ID` 변경 시 기존 상태 배지 `ready`로 초기화
  - `연동 확인` 실행 시 Notion DB 기준으로 `sync/ready` 상태 재평가

## 기술 스택
- Vue 3 + TypeScript + Vite
- Tailwind CSS
- Chrome Extension Manifest V3

## 로컬 개발
### 1) 설치
```bash
npm install
```

### 2) 빌드
```bash
npm run build
```

### 3) (선택) 개발 서버
```bash
npm run dev
```

## Chrome 확장 프로그램으로 실행
### 1) 확장 빌드
```bash
npm run build
```

### 2) 확장 로드
1. Chrome에서 `chrome://extensions` 접속
2. 우상단 `개발자 모드` ON
3. `압축해제된 확장 프로그램을 로드합니다` 클릭
4. 프로젝트의 `dist` 폴더 선택
   - `/Users/kimhyejeong/Documents/projects_code/vue/catch-it/dist`

### 3) 기본 동작 확인
1. 일반 웹페이지에서 텍스트 드래그
2. 팝오버에서 `저장`
3. 확장 아이콘을 눌러 Dashboard에서 항목 생성 확인

## Notion 동기화 설정
1. 확장 UI에서 `설정` 이동
2. `Integration Token`, `Database ID` 입력
   - 권장 템플릿: `https://hyejung.notion.site/31524f69b47280bc8ba8da1da05f968e?v=31524f69b472805eb47f000cf0dda711&source=copy_link` 복제 후 연동
   - Integration Token: `https://www.notion.so/my-integrations`에서 Internal Integration 생성 후 Secret 복사
   - Database ID: 대상 DB 페이지 URL의 마지막 32자리 식별자 복사
   - 대상 DB에 해당 Integration을 `Connections`로 연결
3. `Auto Sync` ON 후 저장 테스트
4. `연동 확인` 클릭 후 상태 메시지(`sync n / ready n`) 확인
5. Dashboard에서 `Sync Now` 클릭해 동기화 결과 확인

## QA
- 수동 QA 항목은 아래 문서 참고:
  - `docs/qa/1-mvp-qa-checklist.md`

## 스크립트
- `npm run dev`: Vite 개발 서버
- `npm run build`: 프로덕션 빌드(`dist` 생성)
- `npm run lint`: ESLint 검사
- `npm run lint:fix`: ESLint 자동 수정
- `npm run format`: Prettier 포맷
- `npm run typecheck`: 타입 검사

## 현재 상태
- MVP 구현 단계 완료
- 다음 단계: QA 체크리스트 실행 후 이슈 보완

## 출시 체크리스트 (Chrome Web Store)
1. Notion 토큰 재발급(기존 노출 토큰 폐기)
2. 개인정보처리방침 URL 준비 및 스토어 등록 정보 입력
3. `npm run build` 후 `dist` 폴더 기준 최종 QA
4. 스토어 업로드용 ZIP 생성(`dist` 내부 파일만 압축)
5. CWS Developer Dashboard에 업로드 후 심사 제출

### 매니페스트 반영 사항
- 버전: `0.1.1`
- 최소 크롬 버전: `114`
- 권한 최소화: `tabs` 제거
- host permissions 최소화: `https://api.notion.com/*`만 유지
- content script 매치 범위: `http/https`로 제한
- 확장 아이콘 등록: `icons/icon-{16,32,48,128}.png`
