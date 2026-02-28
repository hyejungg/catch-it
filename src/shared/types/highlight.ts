export type NotionSyncStatus = 'pending' | 'synced' | 'failed';

export interface Highlight {
  id: string;
  text: string;
  url: string;
  title: string;
  createdAt: number;
  tags: string[];
  contextBefore?: string;
  contextAfter?: string;
  notion?: {
    status: NotionSyncStatus;
    pageId?: string;
    syncedAt?: number;
    error?: string;
  };
}
