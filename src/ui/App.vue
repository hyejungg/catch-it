<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue';
import {
  HIGHLIGHTS_STORAGE_KEY,
  deleteHighlight,
  getHighlights
} from '@/shared/storage/highlight-storage';
import { searchHighlights, sortHighlightsByCreatedAt } from '@/shared/storage/highlight-selectors';
import { getSettings, saveSettings } from '@/shared/storage/settings-storage';
import { normalizeNotionSyncStatus, type Highlight } from '@/shared/types/highlight';
import type {
  SyncNowRequestMessage,
  SyncNowResult,
  TestNotionConnectionRequestMessage
} from '@/shared/types/messages';
import { DEFAULT_APP_SETTINGS, type AppSettings } from '@/shared/types/settings';

const searchQuery = ref('');
const highlights = ref<Highlight[]>([]);
const currentView = ref<'dashboard' | 'settings'>('dashboard');
const settings = ref<AppSettings>({ ...DEFAULT_APP_SETTINGS });
const syncNowMessage = ref('');
const isSyncNowRunning = ref(false);
const notionConnectionMessage = ref('');
const isTestingNotionConnection = ref(false);
const onStorageChanged = (
  changes: Record<string, chrome.storage.StorageChange>,
  areaName: string
): void => {
  if (areaName !== 'local' || !changes[HIGHLIGHTS_STORAGE_KEY]) {
    return;
  }

  void loadHighlights();
};
function canUseChromeStorage(): boolean {
  return typeof chrome !== 'undefined' && Boolean(chrome.storage?.local);
}

function canUseChromeRuntime(): boolean {
  return typeof chrome !== 'undefined' && Boolean(chrome.runtime?.sendMessage);
}

function toggleView(): void {
  currentView.value = currentView.value === 'dashboard' ? 'settings' : 'dashboard';
}

async function loadHighlights(): Promise<void> {
  if (!canUseChromeStorage()) {
    highlights.value = [];
    return;
  }

  const stored = await getHighlights();
  highlights.value = sortHighlightsByCreatedAt(stored, 'desc');
}

async function loadSettings(): Promise<void> {
  if (!canUseChromeStorage()) {
    settings.value = { ...DEFAULT_APP_SETTINGS };
    return;
  }

  settings.value = await getSettings();
}

function updateSettings<K extends keyof AppSettings>(key: K, value: AppSettings[K]): void {
  settings.value = {
    ...settings.value,
    [key]: value
  };

  if (!canUseChromeStorage()) {
    return;
  }

  void saveSettings(settings.value);
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

function getNotionStatus(item: Highlight): 'ready' | 'sync' | 'failed' {
  return normalizeNotionSyncStatus(item.notion?.status);
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

function runSyncNow(): void {
  if (!canUseChromeRuntime() || isSyncNowRunning.value) {
    return;
  }

  isSyncNowRunning.value = true;
  syncNowMessage.value = '';

  const request: SyncNowRequestMessage = { type: 'SYNC_NOW_REQUEST' };
  chrome.runtime.sendMessage(
    request,
    (response?: { ok?: boolean; result?: SyncNowResult }) => {
      isSyncNowRunning.value = false;

      if (chrome.runtime.lastError || !response?.ok || !response.result) {
        syncNowMessage.value = 'Sync now 실패';
        return;
      }

      const { total, synced, failed } = response.result;
      syncNowMessage.value = `동기화 ${synced}/${total} (실패 ${failed})`;
    }
  );
}

function runTestNotionConnection(): void {
  if (!canUseChromeRuntime() || isTestingNotionConnection.value) {
    return;
  }

  isTestingNotionConnection.value = true;
  notionConnectionMessage.value = '';

  const request: TestNotionConnectionRequestMessage = {
    type: 'TEST_NOTION_CONNECTION_REQUEST'
  };
  chrome.runtime.sendMessage(request, (response?: { ok?: boolean; message?: string }) => {
    isTestingNotionConnection.value = false;

    if (chrome.runtime.lastError || !response) {
      notionConnectionMessage.value = '연동 확인 실패';
      return;
    }

    notionConnectionMessage.value = response.message ?? '연동 확인 완료';
  });
}

function openNotionDatabase(): void {
  const dbId = settings.value.notionDbId.trim().replaceAll('-', '');
  if (!dbId) {
    notionConnectionMessage.value = 'Database ID를 먼저 입력하세요.';
    return;
  }

  window.open(`https://www.notion.so/${dbId}`, '_blank', 'noopener,noreferrer');
}

onMounted(() => {
  void loadHighlights();
  void loadSettings();

  if (!canUseChromeStorage()) {
    return;
  }

  chrome.storage.onChanged.addListener(onStorageChanged);
});

onUnmounted(() => {
  if (!canUseChromeStorage()) {
    return;
  }

  chrome.storage.onChanged.removeListener(onStorageChanged);
});
</script>

<template>
  <main class="min-h-screen bg-slate-50 p-4 text-slate-800">
    <header class="mb-4 flex items-center justify-between rounded-lg bg-white p-3 shadow-sm">
      <div class="flex items-center gap-2">
        <div class="flex h-8 w-8 items-center justify-center rounded-lg bg-rose-100 text-rose-500">C</div>
        <div>
          <h1 class="text-base font-semibold text-slate-800">CatchIt - 웹 텍스트 수집기</h1>
          <p class="text-xs text-slate-500">
            {{ currentView === 'dashboard' ? 'Dashboards' : 'Settings' }}
          </p>
        </div>
      </div>
      <button
        type="button"
        :class="
          currentView === 'settings'
            ? 'bg-rose-50 text-rose-600'
            : 'text-slate-500 hover:bg-slate-100 hover:text-slate-700'
        "
        class="rounded-md p-1.5 text-xs transition-colors"
        @click="toggleView"
      >
        {{ currentView === 'dashboard' ? '설정' : '대시보드' }}
      </button>
    </header>

    <template v-if="currentView === 'dashboard'">
      <section class="mb-3 rounded-lg bg-white p-3 shadow-sm">
        <input
          v-model="searchQuery"
          type="text"
          placeholder="저장된 텍스트 검색..."
          class="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-transparent focus:ring-2 focus:ring-rose-500"
        />
      </section>

      <section class="rounded-lg bg-white p-3 shadow-sm">
        <div class="mb-3 flex items-center justify-between">
          <p class="text-xs text-slate-500">
            최근 저장된 항목 <span class="ml-1 text-rose-500">{{ filteredHighlights.length }}</span>
          </p>
          <button
            type="button"
            class="rounded px-2 py-1 text-xs font-medium text-rose-500 hover:bg-rose-50"
            :disabled="isSyncNowRunning"
            @click="runSyncNow"
          >
            {{ isSyncNowRunning ? 'Syncing...' : 'Sync Now' }}
          </button>
        </div>
        <p v-if="syncNowMessage" class="mb-2 text-[11px] text-slate-500">{{ syncNowMessage }}</p>

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
                class="rounded-full border border-rose-100 bg-rose-50 px-2 py-0.5 text-[10px] text-rose-600"
              >
                #{{ tag }}
              </span>
            </div>

            <div class="mt-3 flex items-center justify-between">
              <span class="text-[11px] text-slate-500">{{ formatDate(item.createdAt) }}</span>
              <span
                class="rounded px-1.5 py-0.5 text-[10px] font-medium"
                :class="
                  getNotionStatus(item) === 'sync'
                    ? 'bg-emerald-50 text-emerald-600'
                    : getNotionStatus(item) === 'failed'
                      ? 'bg-red-50 text-red-600'
                      : 'bg-slate-100 text-slate-500'
                "
              >
                {{ getNotionStatus(item) }}
              </span>
            </div>

            <div class="mt-3 flex gap-2">
              <button
                type="button"
                class="rounded border border-slate-200 px-2 py-1 text-xs text-slate-700 hover:bg-rose-50 hover:text-rose-600"
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
    </template>

    <section v-else class="space-y-3">
      <div class="rounded-lg bg-white p-3 shadow-sm">
        <p class="mb-2 text-sm font-medium text-slate-800">Notion 연동</p>
        <label class="mb-1 block text-xs text-slate-600">Integration Token</label>
        <input
          :value="settings.notionToken"
          type="password"
          placeholder="secret_..."
          class="mb-3 w-full rounded-md border border-slate-200 px-3 py-2 text-sm outline-none transition focus:border-rose-500 focus:ring-1 focus:ring-rose-500"
          @input="updateSettings('notionToken', ($event.target as HTMLInputElement).value)"
        />

        <label class="mb-1 block text-xs text-slate-600">Database ID</label>
        <input
          :value="settings.notionDbId"
          type="text"
          placeholder="database id"
          class="w-full rounded-md border border-slate-200 px-3 py-2 text-sm outline-none transition focus:border-rose-500 focus:ring-1 focus:ring-rose-500"
          @input="updateSettings('notionDbId', ($event.target as HTMLInputElement).value)"
        />

        <div class="mt-3 rounded-md border border-rose-100 bg-rose-50/50 p-2 text-[11px] text-slate-600">
          <p class="font-medium text-slate-700">Notion 키/DB ID 가져오는 방법</p>
          <p class="mt-1">
            권장: 아래 템플릿을 먼저 복제한 뒤 Notion API 연동
            <a
              href="https://www.notion.so/hyejung/e8124f69b472835095ca81add015a1fc?v=cb024f69b47283e08bd5889aecb68f50&source=copy_link"
              target="_blank"
              rel="noopener noreferrer"
              class="text-rose-600 underline"
            >
              템플릿 복제 링크
            </a>
          </p>
          <p class="mt-1">
            1) Integration Token: Notion
            <a
              href="https://www.notion.so/my-integrations"
              target="_blank"
              rel="noopener noreferrer"
              class="text-rose-600 underline"
            >
              My integrations
            </a>
            에서 Internal Integration 생성 후 Secret 복사
          </p>
          <p class="mt-1">
            2) Database ID: 대상 DB 페이지 URL의 마지막 값(보통 32자리)을 복사하거나
            <a
              href="https://www.notion.so/help/add-and-manage-connections-with-the-api"
              target="_blank"
              rel="noopener noreferrer"
              class="text-rose-600 underline"
            >
              연결 권한 가이드
            </a>
            를 따라 Integration 연결
          </p>
        </div>

        <div class="mt-3 flex flex-wrap gap-2">
          <button
            type="button"
            class="rounded-md bg-rose-500 px-3 py-1.5 text-xs font-medium text-white hover:bg-rose-600"
            :disabled="isTestingNotionConnection"
            @click="runTestNotionConnection"
          >
            {{ isTestingNotionConnection ? '확인 중...' : '연동 확인' }}
          </button>
          <button
            type="button"
            class="rounded-md border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100"
            @click="openNotionDatabase"
          >
            Notion DB 바로가기
          </button>
        </div>
        <p v-if="notionConnectionMessage" class="mt-2 text-[11px] text-slate-500">
          {{ notionConnectionMessage }}
        </p>
      </div>

      <div class="rounded-lg bg-white p-3 shadow-sm">
        <p class="mb-2 text-sm font-medium text-slate-800">동작 설정</p>

        <label class="mb-2 flex items-center justify-between text-sm text-slate-700">
          <span>자동 동기화 (Auto Sync)</span>
          <button
            type="button"
            :class="settings.autoSync ? 'bg-rose-500' : 'bg-slate-200'"
            class="relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none"
            @click="updateSettings('autoSync', !settings.autoSync)"
          >
            <span
              :class="settings.autoSync ? 'translate-x-5' : 'translate-x-1'"
              class="inline-block h-3 w-3 transform rounded-full bg-white shadow-sm transition-transform"
            />
          </button>
        </label>

        <label class="flex items-center justify-between text-sm text-slate-700">
          <span>Alt + Drag에서만 팝오버 표시</span>
          <button
            type="button"
            :class="settings.requireAlt ? 'bg-rose-500' : 'bg-slate-200'"
            class="relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none"
            @click="updateSettings('requireAlt', !settings.requireAlt)"
          >
            <span
              :class="settings.requireAlt ? 'translate-x-5' : 'translate-x-1'"
              class="inline-block h-3 w-3 transform rounded-full bg-white shadow-sm transition-transform"
            />
          </button>
        </label>
      </div>
    </section>
  </main>
</template>
