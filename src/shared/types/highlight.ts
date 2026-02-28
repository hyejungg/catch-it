export type NotionSyncStatus = 'pending' | 'synced' | 'failed';

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
