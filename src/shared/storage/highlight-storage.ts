import type { Highlight, HighlightCreateInput } from '@/shared/types/highlight';

export const HIGHLIGHTS_STORAGE_KEY = 'highlights';

function createHighlight(input: HighlightCreateInput): Highlight {
  return {
    ...input,
    id: input.id ?? crypto.randomUUID(),
    createdAt: input.createdAt ?? Date.now()
  };
}

export async function getHighlights(): Promise<Highlight[]> {
  const data = await chrome.storage.local.get(HIGHLIGHTS_STORAGE_KEY);
  return (data[HIGHLIGHTS_STORAGE_KEY] as Highlight[] | undefined) ?? [];
}

export async function saveHighlights(highlights: Highlight[]): Promise<void> {
  await chrome.storage.local.set({ [HIGHLIGHTS_STORAGE_KEY]: highlights });
}

export async function getHighlightById(id: string): Promise<Highlight | null> {
  const highlights = await getHighlights();
  return highlights.find((highlight) => highlight.id === id) ?? null;
}

export async function addHighlight(input: HighlightCreateInput): Promise<Highlight> {
  const highlights = await getHighlights();
  const newHighlight = createHighlight(input);
  highlights.unshift(newHighlight);
  await saveHighlights(highlights);
  return newHighlight;
}

export async function updateHighlight(
  id: string,
  updates: Partial<Omit<Highlight, 'id' | 'createdAt'>>
): Promise<Highlight | null> {
  const highlights = await getHighlights();
  const index = highlights.findIndex((highlight) => highlight.id === id);

  if (index < 0) {
    return null;
  }

  const updated: Highlight = {
    ...highlights[index],
    ...updates,
    id: highlights[index].id,
    createdAt: highlights[index].createdAt
  };

  highlights[index] = updated;
  await saveHighlights(highlights);
  return updated;
}

export async function upsertHighlight(highlight: Highlight): Promise<Highlight> {
  const highlights = await getHighlights();
  const index = highlights.findIndex((item) => item.id === highlight.id);

  if (index < 0) {
    highlights.unshift(highlight);
  } else {
    highlights[index] = highlight;
  }

  await saveHighlights(highlights);
  return highlight;
}

export async function deleteHighlight(id: string): Promise<boolean> {
  const highlights = await getHighlights();
  const next = highlights.filter((highlight) => highlight.id !== id);

  if (next.length === highlights.length) {
    return false;
  }

  await saveHighlights(next);
  return true;
}

export async function clearHighlights(): Promise<void> {
  await saveHighlights([]);
}
