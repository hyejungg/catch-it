import type { Highlight } from '@/shared/types/highlight';

const STORAGE_KEY = 'highlights';

export async function getHighlights(): Promise<Highlight[]> {
  const data = await chrome.storage.local.get(STORAGE_KEY);
  return (data[STORAGE_KEY] as Highlight[] | undefined) ?? [];
}

export async function saveHighlights(highlights: Highlight[]): Promise<void> {
  await chrome.storage.local.set({ [STORAGE_KEY]: highlights });
}
