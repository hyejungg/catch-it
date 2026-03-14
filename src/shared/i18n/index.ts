import type { AppLanguage } from '@/shared/types/settings';

export interface SyncSummaryParams {
  synced: number;
  total: number;
  failed: number;
}

export interface LocaleMessages {
  appTitle: string;
  viewDashboard: string;
  viewSettings: string;
  switchToDashboard: string;
  switchToSettings: string;
  searchPlaceholder: string;
  recentItemsLabel: (count: number) => string;
  syncNow: string;
  syncingNow: string;
  syncNowFailed: string;
  syncNowSummary: (params: SyncSummaryParams) => string;
  noSearchResults: string;
  notionStatusReady: string;
  notionStatusSync: string;
  notionStatusFailed: string;
  copy: string;
  openSource: string;
  delete: string;
  settingsLanguage: string;
  languageEnglish: string;
  languageKorean: string;
  notionIntegration: string;
  integrationTokenLabel: string;
  integrationTokenPlaceholder: string;
  databaseIdLabel: string;
  databaseIdPlaceholder: string;
  notionGuideTitle: string;
  notionGuideIntro: string;
  templateCopyLink: string;
  notionGuideTokenBeforeLink: string;
  notionGuideTokenAfterLink: string;
  notionGuideDatabaseId: string;
  notionGuideConnectionsBeforeLink: string;
  notionGuideConnectionsLink: string;
  testingConnection: string;
  testConnection: string;
  openNotionDatabase: string;
  notionConnectionFailed: string;
  notionConnectionCompleted: string;
  notionDatabaseRequired: string;
  behaviorSettings: string;
  autoSync: string;
  requireAlt: string;
  supportProject: string;
  contentTagPlaceholder: string;
  contentSave: string;
  missingNotionSettings: string;
  notionAuthFailed401: string;
  notionPermission403: string;
  notionRateLimit429: string;
  notionSyncFailed: (status: number) => string;
  notionApiResponseError: string;
  notionDatabaseFetchFailed: string;
  notionConnectionTestFailed: string;
  notionConnectionSuccess: (sync: number, ready: number) => string;
  notionConnectionRuntimeError: string;
  notionMissingTitleProperty: string;
}

const en: LocaleMessages = {
  appTitle: 'CatchIt - Web Text Collector',
  viewDashboard: 'Dashboard',
  viewSettings: 'Settings',
  switchToDashboard: 'Dashboard',
  switchToSettings: 'Settings',
  searchPlaceholder: 'Search saved text...',
  recentItemsLabel: (count) => `Recent items ${count}`,
  syncNow: 'Sync Now',
  syncingNow: 'Syncing...',
  syncNowFailed: 'Sync now failed',
  syncNowSummary: ({ synced, total, failed }) => `Synced ${synced}/${total} (failed ${failed})`,
  noSearchResults: 'No matching results found.',
  notionStatusReady: 'Ready',
  notionStatusSync: 'Synced',
  notionStatusFailed: 'Failed',
  copy: 'Copy',
  openSource: 'Open Source',
  delete: 'Delete',
  settingsLanguage: 'Language',
  languageEnglish: 'English',
  languageKorean: 'Korean',
  notionIntegration: 'Notion Integration',
  integrationTokenLabel: 'Integration Token',
  integrationTokenPlaceholder: 'secret_...',
  databaseIdLabel: 'Database ID',
  databaseIdPlaceholder: 'database id',
  notionGuideTitle: 'How to get your Notion token and database ID',
  notionGuideIntro: 'Recommended: duplicate the template below before connecting Notion API.',
  templateCopyLink: 'Duplicate template',
  notionGuideTokenBeforeLink: '1) Integration Token: open',
  notionGuideTokenAfterLink: 'and create an Internal Integration, then copy the Secret.',
  notionGuideDatabaseId:
    '2) Database ID: copy the last value in the target database page URL, usually 32 characters.',
  notionGuideConnectionsBeforeLink: '3) Connect the Integration to the target database using the',
  notionGuideConnectionsLink: 'Connections guide',
  testingConnection: 'Checking...',
  testConnection: 'Test Connection',
  openNotionDatabase: 'Open Notion DB',
  notionConnectionFailed: 'Connection test failed',
  notionConnectionCompleted: 'Connection test completed',
  notionDatabaseRequired: 'Enter a Database ID first.',
  behaviorSettings: 'Behavior Settings',
  autoSync: 'Auto Sync',
  requireAlt: 'Show popover only on Alt + Drag',
  supportProject: 'Buy me a coffee',
  contentTagPlaceholder: 'Tags (comma separated)',
  contentSave: 'Save',
  missingNotionSettings: 'Missing Notion settings: check the token or database ID.',
  notionAuthFailed401: 'Notion authentication failed (401)',
  notionPermission403: 'Notion permission error (403)',
  notionRateLimit429: 'Notion rate limit exceeded (429)',
  notionSyncFailed: (status) => `Notion sync failed (${status})`,
  notionApiResponseError: 'Invalid response from Notion API',
  notionDatabaseFetchFailed: 'Failed to fetch Notion database',
  notionConnectionTestFailed: 'Connection test failed',
  notionConnectionSuccess: (sync, ready) =>
    `Notion connection succeeded (sync ${sync} / ready ${ready})`,
  notionConnectionRuntimeError: 'An error occurred while checking the connection',
  notionMissingTitleProperty: 'The Notion database is missing a title property.'
};

const ko: LocaleMessages = {
  appTitle: 'CatchIt - 웹 텍스트 수집기',
  viewDashboard: '대시보드',
  viewSettings: '설정',
  switchToDashboard: '대시보드',
  switchToSettings: '설정',
  searchPlaceholder: '저장된 텍스트 검색...',
  recentItemsLabel: (count) => `최근 저장된 항목 ${count}`,
  syncNow: '지금 동기화',
  syncingNow: '동기화 중...',
  syncNowFailed: 'Sync now 실패',
  syncNowSummary: ({ synced, total, failed }) => `동기화 ${synced}/${total} (실패 ${failed})`,
  noSearchResults: '검색 결과가 없습니다.',
  notionStatusReady: '준비됨',
  notionStatusSync: '동기화됨',
  notionStatusFailed: '실패',
  copy: '복사',
  openSource: '원문 열기',
  delete: '삭제',
  settingsLanguage: '언어',
  languageEnglish: '영어',
  languageKorean: '한국어',
  notionIntegration: 'Notion 연동',
  integrationTokenLabel: 'Integration Token',
  integrationTokenPlaceholder: 'secret_...',
  databaseIdLabel: 'Database ID',
  databaseIdPlaceholder: 'database id',
  notionGuideTitle: 'Notion 키/DB ID 가져오는 방법',
  notionGuideIntro: '권장: 아래 템플릿을 먼저 복제한 뒤 Notion API 연동',
  templateCopyLink: '템플릿 복제 링크',
  notionGuideTokenBeforeLink: '1) Integration Token:',
  notionGuideTokenAfterLink: '에서 Internal Integration 생성 후 Secret 복사',
  notionGuideDatabaseId:
    '2) Database ID: 대상 DB 페이지 URL의 마지막 값(보통 32자리)을 복사',
  notionGuideConnectionsBeforeLink: '3) 대상 DB에 Integration 연결:',
  notionGuideConnectionsLink: '연결 권한 가이드',
  testingConnection: '확인 중...',
  testConnection: '연동 확인',
  openNotionDatabase: 'Notion DB 바로가기',
  notionConnectionFailed: '연동 확인 실패',
  notionConnectionCompleted: '연동 확인 완료',
  notionDatabaseRequired: 'Database ID를 먼저 입력하세요.',
  behaviorSettings: '동작 설정',
  autoSync: '자동 동기화 (Auto Sync)',
  requireAlt: 'Alt + Drag에서만 팝오버 표시',
  supportProject: 'Buy me a coffee',
  contentTagPlaceholder: '태그(쉼표 구분)',
  contentSave: '저장',
  missingNotionSettings: 'Notion 설정 누락: 토큰 또는 Database ID를 확인하세요.',
  notionAuthFailed401: 'Notion 인증 실패(401)',
  notionPermission403: 'Notion 권한 오류(403)',
  notionRateLimit429: 'Notion 요청 제한(429)',
  notionSyncFailed: (status) => `Notion 동기화 실패(${status})`,
  notionApiResponseError: 'Notion API 응답 오류',
  notionDatabaseFetchFailed: 'Database 조회 실패',
  notionConnectionTestFailed: '연동 확인 실패',
  notionConnectionSuccess: (sync, ready) =>
    `Notion 연동 확인 성공 (sync ${sync} / ready ${ready})`,
  notionConnectionRuntimeError: '연동 확인 중 오류 발생',
  notionMissingTitleProperty: 'Notion DB에 title 타입 속성이 없습니다.'
};

const localeMessages: Record<AppLanguage, LocaleMessages> = {
  en,
  ko
};

export function getLocaleMessages(language: AppLanguage): LocaleMessages {
  return localeMessages[language] ?? localeMessages.en;
}

export function formatDateByLanguage(timestamp: number, language: AppLanguage): string {
  const locale = language === 'ko' ? 'ko-KR' : 'en-US';
  return new Intl.DateTimeFormat(locale, {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  }).format(timestamp);
}
