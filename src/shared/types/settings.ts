export type AppLanguage = 'en' | 'ko';

export function resolveAppLanguage(value: string | null | undefined): AppLanguage {
  const normalized = value?.trim().toLowerCase() ?? '';
  if (normalized.startsWith('ko')) {
    return 'ko';
  }
  if (normalized.startsWith('en')) {
    return 'en';
  }
  return 'en';
}

export function detectBrowserLanguage(): AppLanguage {
  if (typeof chrome !== 'undefined' && chrome.i18n?.getUILanguage) {
    return resolveAppLanguage(chrome.i18n.getUILanguage());
  }

  if (typeof navigator !== 'undefined') {
    return resolveAppLanguage(navigator.language);
  }

  return 'en';
}

export function resolveInitialAppLanguage(value: string | null | undefined): AppLanguage {
  if (value) {
    return resolveAppLanguage(value);
  }

  return detectBrowserLanguage();
}

export interface AppSettings {
  language: AppLanguage;
  requireAlt: boolean;
  autoSync: boolean;
  notionToken: string;
  notionDbId: string;
}

export const DEFAULT_APP_SETTINGS: AppSettings = {
  language: 'en',
  requireAlt: false,
  autoSync: true,
  notionToken: '',
  notionDbId: ''
};
