import {
  DEFAULT_APP_SETTINGS,
  resolveInitialAppLanguage,
  type AppSettings
} from '@/shared/types/settings';

export const SETTINGS_STORAGE_KEY = 'settings';

export async function getSettings(): Promise<AppSettings> {
  const data = await chrome.storage.local.get(SETTINGS_STORAGE_KEY);
  const stored = (data[SETTINGS_STORAGE_KEY] as Partial<AppSettings> | undefined) ?? {};

  return {
    ...DEFAULT_APP_SETTINGS,
    ...stored,
    language: resolveInitialAppLanguage(stored.language)
  };
}

export async function saveSettings(settings: AppSettings): Promise<void> {
  await chrome.storage.local.set({
    [SETTINGS_STORAGE_KEY]: {
      ...settings,
      language: resolveInitialAppLanguage(settings.language)
    }
  });
}
