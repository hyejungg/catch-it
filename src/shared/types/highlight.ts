export type NotionSyncStatus = 'ready' | 'sync' | 'failed';

export function normalizeNotionSyncStatus(status: unknown): NotionSyncStatus {
  if (status === 'sync' || status === 'failed' || status === 'ready') {
    return status;
  }
  return 'ready';
}

export interface NotionSyncMetadata {
  status: NotionSyncStatus;
  pageId?: string;
  syncedAt?: number;
  error?: string;
}

export interface Highlight {
  id: string;
  text: string;
  url: string;
  title: string;
  createdAt: number;
  tags: string[];
  contextBefore?: string;
  contextAfter?: string;
  notion?: NotionSyncMetadata;
}

export type HighlightCreateInput = Omit<Highlight, 'id' | 'createdAt'> & {
  id?: string;
  createdAt?: number;
};
