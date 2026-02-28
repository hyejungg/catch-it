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
