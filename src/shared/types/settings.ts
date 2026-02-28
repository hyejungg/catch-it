export interface AppSettings {
  requireAlt: boolean;
  autoSync: boolean;
  notionToken: string;
  notionDbId: string;
}

export const DEFAULT_APP_SETTINGS: AppSettings = {
  requireAlt: false,
  autoSync: true,
  notionToken: '',
  notionDbId: ''
};
