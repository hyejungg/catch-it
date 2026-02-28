import type { Highlight } from '@/shared/types/highlight';

function includesQuery(value: string, query: string): boolean {
  return value.toLowerCase().includes(query);
}

export function sortHighlightsByCreatedAt(
  highlights: Highlight[],
  order: 'asc' | 'desc' = 'desc'
): Highlight[] {
  const sorted = [...highlights].sort((a, b) => a.createdAt - b.createdAt);
  return order === 'asc' ? sorted : sorted.reverse();
}

export function searchHighlights(highlights: Highlight[], rawQuery: string): Highlight[] {
  const query = rawQuery.trim().toLowerCase();
  if (!query) {
    return highlights;
  }

  return highlights.filter((highlight) => {
    return (
      includesQuery(highlight.text, query) ||
      includesQuery(highlight.title, query) ||
      includesQuery(highlight.url, query) ||
      highlight.tags.some((tag) => includesQuery(tag, query))
    );
  });
}

export function filterHighlightsByTag(highlights: Highlight[], tag: string): Highlight[] {
  const normalizedTag = tag.trim().toLowerCase();
  if (!normalizedTag) {
    return highlights;
  }

  return highlights.filter((highlight) =>
    highlight.tags.some((item) => item.toLowerCase() === normalizedTag)
  );
}
