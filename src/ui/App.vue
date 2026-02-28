<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { deleteHighlight, getHighlights } from '@/shared/storage/highlight-storage';
import { searchHighlights, sortHighlightsByCreatedAt } from '@/shared/storage/highlight-selectors';
import type { Highlight } from '@/shared/types/highlight';

const searchQuery = ref('');
const highlights = ref<Highlight[]>([]);
const mockHighlights: Highlight[] = [
  {
    id: 'sample-1',
    text: '현재 페이지 컨텍스트(링크/제목/문맥)가 빠지면 재사용성이 크게 떨어진다.',
    url: 'https://example.com/blog/future-of-ai',
    title: '왜 우리는 항상 정보를 잃어버릴까?',
    createdAt: Date.now() - 1000 * 60 * 30,
    tags: ['ux', 'context'],
    notion: { status: 'synced' }
  },
  {
    id: 'sample-2',
    text: '드래그 한 번으로 텍스트와 URL, 제목, 저장 시간을 함께 수집한다.',
    url: 'https://example.com/blog/future-of-ai',
    title: '왜 우리는 항상 정보를 잃어버릴까?',
    createdAt: Date.now() - 1000 * 60 * 5,
    tags: ['workflow'],
    notion: { status: 'pending' }
  }
];

function canUseChromeStorage(): boolean {
  return typeof chrome !== 'undefined' && Boolean(chrome.storage?.local);
}

async function loadHighlights(): Promise<void> {
  if (!canUseChromeStorage()) {
    highlights.value = sortHighlightsByCreatedAt(mockHighlights, 'desc');
    return;
  }

  const stored = await getHighlights();
  highlights.value = sortHighlightsByCreatedAt(stored, 'desc');
}

const filteredHighlights = computed(() => {
  return searchHighlights(highlights.value, searchQuery.value);
});

function formatDate(createdAt: number): string {
  return new Intl.DateTimeFormat('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  }).format(createdAt);
}

async function copyHighlight(item: Highlight): Promise<void> {
  await navigator.clipboard.writeText(item.text);
}

function openSource(url: string): void {
  window.open(url, '_blank', 'noopener,noreferrer');
}

function removeHighlight(id: string): void {
  void (async () => {
    if (!canUseChromeStorage()) {
      highlights.value = highlights.value.filter((item) => item.id !== id);
      return;
    }

    const deleted = await deleteHighlight(id);
    if (!deleted) {
      return;
    }

    await loadHighlights();
  })();
}

onMounted(() => {
  void loadHighlights();
});
</script>

<template>
  <main class="min-h-screen bg-slate-50 p-4 text-slate-800">
    <header class="mb-4 flex items-center justify-between rounded-lg bg-white p-3 shadow-sm">
      <h1 class="text-lg font-semibold">CatchIt Dashboard</h1>
      <span class="rounded bg-brand-600 px-2 py-1 text-xs text-white">Mock Data</span>
    </header>

    <section class="mb-3 rounded-lg bg-white p-3 shadow-sm">
      <input
        v-model="searchQuery"
        type="text"
        placeholder="저장된 텍스트 검색..."
        class="w-full rounded-md border border-slate-200 px-3 py-2 text-sm outline-none transition focus:border-brand-600"
      />
    </section>

    <section class="rounded-lg bg-white p-3 shadow-sm">
      <div class="mb-3 flex items-center justify-between">
        <p class="text-xs text-slate-500">최근 저장된 항목 {{ filteredHighlights.length }}개</p>
        <button
          type="button"
          class="rounded border border-slate-200 px-2 py-1 text-xs text-slate-600 hover:bg-slate-100"
        >
          Sync Now
        </button>
      </div>

      <div v-if="filteredHighlights.length === 0" class="py-8 text-center text-sm text-slate-500">
        검색 결과가 없습니다.
      </div>

      <ul v-else class="space-y-3">
        <li
          v-for="item in filteredHighlights"
          :key="item.id"
          class="rounded-lg border border-slate-200 bg-white p-3"
        >
          <p class="mb-2 text-sm leading-relaxed text-slate-800">{{ item.text }}</p>
          <p class="truncate text-xs font-medium text-slate-700">{{ item.title }}</p>
          <p class="truncate text-xs text-slate-500">{{ item.url }}</p>

          <div class="mt-2 flex flex-wrap gap-1">
            <span
              v-for="tag in item.tags"
              :key="tag"
              class="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] text-slate-600"
            >
              #{{ tag }}
            </span>
          </div>

          <div class="mt-3 flex items-center justify-between">
            <span class="text-[11px] text-slate-500">{{ formatDate(item.createdAt) }}</span>
            <span
              class="rounded px-1.5 py-0.5 text-[10px] font-medium"
              :class="
                item.notion?.status === 'synced'
                  ? 'bg-emerald-50 text-emerald-600'
                  : item.notion?.status === 'failed'
                    ? 'bg-red-50 text-red-600'
                    : 'bg-slate-100 text-slate-500'
              "
            >
              {{ item.notion?.status ?? 'pending' }}
            </span>
          </div>

          <div class="mt-3 flex gap-2">
            <button
              type="button"
              class="rounded border border-slate-200 px-2 py-1 text-xs text-slate-700 hover:bg-slate-100"
              @click="copyHighlight(item)"
            >
              복사
            </button>
            <button
              type="button"
              class="rounded border border-slate-200 px-2 py-1 text-xs text-slate-700 hover:bg-slate-100"
              @click="openSource(item.url)"
            >
              원문 열기
            </button>
            <button
              type="button"
              class="rounded border border-red-200 px-2 py-1 text-xs text-red-600 hover:bg-red-50"
              @click="removeHighlight(item.id)"
            >
              삭제
            </button>
          </div>
        </li>
      </ul>
    </section>
  </main>
</template>
