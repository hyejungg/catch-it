export interface SaveHighlightRequestPayload {
  text: string;
  url: string;
  title: string;
  tags: string[];
  contextBefore?: string;
  contextAfter?: string;
}

export interface SaveHighlightRequestMessage {
  type: 'HIGHLIGHT_SAVE_REQUEST';
  payload: SaveHighlightRequestPayload;
}

export interface SyncNowRequestMessage {
  type: 'SYNC_NOW_REQUEST';
}

export interface SyncNowResult {
  total: number;
  synced: number;
  failed: number;
}
