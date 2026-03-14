import {
  addHighlight,
  getHighlights,
  getHighlightById,
  saveHighlights,
  updateHighlight
} from '@/shared/storage/highlight-storage';
import { getLocaleMessages, type LocaleMessages } from '@/shared/i18n';
import { getSettings, SETTINGS_STORAGE_KEY } from '@/shared/storage/settings-storage';
import { normalizeNotionSyncStatus, type Highlight } from '@/shared/types/highlight';
import type {
  SaveHighlightRequestMessage,
  SyncNowRequestMessage,
  SyncNowResult,
  TestNotionConnectionRequestMessage
} from '@/shared/types/messages';

function isSaveHighlightRequestMessage(message: unknown): message is SaveHighlightRequestMessage {
  if (!message || typeof message !== 'object') {
    return false;
  }

  const candidate = message as Partial<SaveHighlightRequestMessage>;
  return (
    candidate.type === 'HIGHLIGHT_SAVE_REQUEST' &&
    typeof candidate.payload?.text === 'string' &&
    typeof candidate.payload?.url === 'string' &&
    typeof candidate.payload?.title === 'string'
  );
}

function isSyncNowRequestMessage(message: unknown): message is SyncNowRequestMessage {
  if (!message || typeof message !== 'object') {
    return false;
  }

  const candidate = message as Partial<SyncNowRequestMessage>;
  return candidate.type === 'SYNC_NOW_REQUEST';
}

function isTestNotionConnectionRequestMessage(
  message: unknown
): message is TestNotionConnectionRequestMessage {
  if (!message || typeof message !== 'object') {
    return false;
  }

  const candidate = message as Partial<TestNotionConnectionRequestMessage>;
  return candidate.type === 'TEST_NOTION_CONNECTION_REQUEST';
}

function mapNotionError(status: number, fallback: string, messages: LocaleMessages): string {
  if (status === 401) return messages.notionAuthFailed401;
  if (status === 403) return messages.notionPermission403;
  if (status === 429) return messages.notionRateLimit429;
  return fallback || messages.notionSyncFailed(status);
}

function logSync(message: string, data?: Record<string, unknown>): void {
  if (data) {
    console.info('[CatchIt][Sync]', message, data);
    return;
  }
  console.info('[CatchIt][Sync]', message);
}

function maskIdentifier(value: string): string {
  const compact = value.replaceAll('-', '');
  if (!compact) return '(empty)';
  if (compact.length <= 4) return `***${compact}`;
  return `***${compact.slice(-4)}`;
}

function toISOStringFromTimestamp(timestamp: number): string {
  return new Date(timestamp).toISOString();
}

type NotionPropertyType = 'title' | 'rich_text' | 'url' | 'date' | 'multi_select';

interface NotionDatabaseProperty {
  id: string;
  type: NotionPropertyType | string;
  name?: string;
}

interface NotionDatabaseInfo {
  id: string;
  title?: Array<{ plain_text?: string }>;
  properties: Record<string, NotionDatabaseProperty>;
}

interface NotionQueryResponse {
  results: Array<{ id?: string }>;
  has_more?: boolean;
  next_cursor?: string | null;
  message?: string;
}

function normalizeNotionId(value: string): string {
  return value.trim().replaceAll('-', '');
}

async function getNotionDatabaseInfo(
  notionToken: string,
  notionDbId: string,
  messages: LocaleMessages
): Promise<NotionDatabaseInfo> {
  const response = await fetch(`https://api.notion.com/v1/databases/${normalizeNotionId(notionDbId)}`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${notionToken}`,
      'Notion-Version': '2022-06-28'
    }
  });

  const raw = await response.text();
  let parsed: NotionDatabaseInfo | { message?: string } = { properties: {}, id: '' };
  if (raw) {
    try {
      parsed = JSON.parse(raw) as NotionDatabaseInfo | { message?: string };
    } catch {
      parsed = { properties: {}, id: '' };
    }
  }

  if (!response.ok || !('properties' in parsed)) {
    const message = 'message' in parsed ? parsed.message : messages.notionDatabaseFetchFailed;
    throw new Error(mapNotionError(response.status, message ?? messages.notionDatabaseFetchFailed, messages));
  }

  return parsed;
}

async function queryNotionDatabasePageIds(
  notionToken: string,
  notionDbId: string,
  messages: LocaleMessages
): Promise<Set<string>> {
  const pageIds = new Set<string>();
  let nextCursor: string | null = null;
  let hasMore = true;

  while (hasMore) {
    const body = nextCursor ? { page_size: 100, start_cursor: nextCursor } : { page_size: 100 };
    const response = await fetch(
      `https://api.notion.com/v1/databases/${normalizeNotionId(notionDbId)}/query`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${notionToken}`,
          'Notion-Version': '2022-06-28',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
      }
    );

    const raw = await response.text();
    let parsed: NotionQueryResponse = { results: [] };
    if (raw) {
      try {
        parsed = JSON.parse(raw) as NotionQueryResponse;
      } catch {
        parsed = { results: [] };
      }
    }

    if (!response.ok) {
      throw new Error(
        mapNotionError(response.status, parsed.message ?? messages.notionDatabaseFetchFailed, messages)
      );
    }

    for (const item of parsed.results ?? []) {
      if (item.id) {
        pageIds.add(item.id.replaceAll('-', ''));
      }
    }

    hasMore = Boolean(parsed.has_more);
    nextCursor = parsed.next_cursor ?? null;
  }

  return pageIds;
}

function findPropertyNameByType(
  properties: Record<string, NotionDatabaseProperty>,
  type: NotionPropertyType
): string | null {
  const entry = Object.entries(properties).find(([, property]) => property.type === type);
  return entry ? entry[0] : null;
}

async function createNotionPage(
  highlight: Highlight,
  notionToken: string,
  notionDbId: string,
  messages: LocaleMessages
): Promise<string> {
  logSync('Notion page create request', {
    highlightId: highlight.id,
    dbId: maskIdentifier(notionDbId),
    textLength: highlight.text.length,
    tagsCount: highlight.tags.length
  });

  const database = await getNotionDatabaseInfo(notionToken, notionDbId, messages);
  const titleProperty = findPropertyNameByType(database.properties, 'title');
  const richTextProperty = findPropertyNameByType(database.properties, 'rich_text');
  const urlProperty = findPropertyNameByType(database.properties, 'url');
  const dateProperty = findPropertyNameByType(database.properties, 'date');
  const tagsProperty = findPropertyNameByType(database.properties, 'multi_select');

  logSync('Notion database schema mapped', {
    highlightId: highlight.id,
    titleProperty,
    richTextProperty,
    urlProperty,
    dateProperty,
    tagsProperty
  });

  if (!titleProperty) {
    throw new Error(messages.notionMissingTitleProperty);
  }

  const properties: Record<string, unknown> = {
    [titleProperty]: {
      title: [{ text: { content: highlight.title || 'Untitled' } }]
    }
  };

  if (richTextProperty) {
    properties[richTextProperty] = {
      rich_text: [{ text: { content: highlight.text.slice(0, 1900) } }]
    };
  }

  if (urlProperty) {
    properties[urlProperty] = { url: highlight.url };
  }

  if (dateProperty) {
    properties[dateProperty] = { date: { start: toISOStringFromTimestamp(highlight.createdAt) } };
  }

  if (tagsProperty) {
    properties[tagsProperty] = {
      multi_select: highlight.tags.map((tag) => ({ name: tag }))
    };
  }

  const body = {
    parent: { database_id: normalizeNotionId(notionDbId) },
    properties
  };

  const response = await fetch('https://api.notion.com/v1/pages', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${notionToken}`,
      'Notion-Version': '2022-06-28',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(body)
  });

  const raw = await response.text();
  let parsed: { id?: string; message?: string } = {};
  if (raw) {
    try {
      parsed = JSON.parse(raw) as { id?: string; message?: string };
    } catch {
      parsed = {};
    }
  }

  logSync('Notion page create response', {
    highlightId: highlight.id,
    status: response.status,
    ok: response.ok,
    hasPageId: Boolean(parsed.id),
    errorMessage: parsed.message ?? null
  });

  if (!response.ok || !parsed.id) {
    throw new Error(
      mapNotionError(response.status, parsed.message ?? messages.notionApiResponseError, messages)
    );
  }

  return parsed.id;
}

async function syncHighlightToNotion(highlight: Highlight): Promise<'sync' | 'failed'> {
  logSync('Sync highlight started', {
    highlightId: highlight.id,
    currentStatus: normalizeNotionSyncStatus(highlight.notion?.status)
  });

  const settings = await getSettings();
  const messages = getLocaleMessages(settings.language);
  if (!settings.notionToken || !settings.notionDbId) {
    logSync('Sync skipped: missing Notion settings', {
      highlightId: highlight.id,
      hasToken: Boolean(settings.notionToken),
      hasDatabaseId: Boolean(settings.notionDbId)
    });

    await updateHighlight(highlight.id, {
      notion: {
        status: 'ready',
        error: messages.missingNotionSettings
      }
    });
    return 'failed';
  }

  await updateHighlight(highlight.id, {
    notion: { status: 'ready', error: undefined }
  });

  try {
    const pageId = await createNotionPage(
      highlight,
      settings.notionToken,
      settings.notionDbId,
      messages
    );
    await updateHighlight(highlight.id, {
      notion: {
        status: 'sync',
        pageId,
        syncedAt: Date.now(),
        error: undefined
      }
    });
    logSync('Sync highlight success', {
      highlightId: highlight.id,
      pageId: maskIdentifier(pageId)
    });
    return 'sync';
  } catch (error) {
    const message =
      error instanceof Error ? error.message : messages.notionSyncFailed(0);
    logSync('Sync highlight failed', {
      highlightId: highlight.id,
      message
    });
    await updateHighlight(highlight.id, {
      notion: {
        status: 'failed',
        error: message
      }
    });
    return 'failed';
  }
}

async function syncNow(): Promise<SyncNowResult> {
  const settings = await getSettings();
  if (!settings.notionToken || !settings.notionDbId) {
    logSync('Sync now skipped: missing Notion settings', {
      hasToken: Boolean(settings.notionToken),
      hasDatabaseId: Boolean(settings.notionDbId)
    });
    return { total: 0, synced: 0, failed: 0 };
  }

  const highlights = await getHighlights();
  const targets = highlights.filter((item) => normalizeNotionSyncStatus(item.notion?.status) !== 'sync');
  logSync('Sync now started', {
    totalHighlights: highlights.length,
    targetCount: targets.length
  });

  let synced = 0;
  let failed = 0;

  for (const item of targets) {
    const result = await syncHighlightToNotion(item);
    if (result === 'sync') synced += 1;
    else failed += 1;
  }

  const result = {
    total: targets.length,
    synced,
    failed
  };
  logSync('Sync now finished', result);
  return result;
}

async function resetAllHighlightsReadyOnDbChange(): Promise<number> {
  const highlights = await getHighlights();
  if (highlights.length === 0) {
    return 0;
  }

  const next = highlights.map((highlight) => ({
    ...highlight,
    notion: {
      ...highlight.notion,
      status: 'ready' as const,
      error: undefined
    }
  }));
  await saveHighlights(next);
  return next.length;
}

async function reconcileHighlightSyncStatesByDatabase(
  notionToken: string,
  notionDbId: string,
  messages: LocaleMessages
): Promise<{ total: number; sync: number; ready: number }> {
  const highlights = await getHighlights();
  if (highlights.length === 0) {
    return { total: 0, sync: 0, ready: 0 };
  }

  const pageIds = await queryNotionDatabasePageIds(notionToken, notionDbId, messages);
  let syncCount = 0;
  let readyCount = 0;

  const next = highlights.map((highlight) => {
    const pageId = highlight.notion?.pageId?.replaceAll('-', '') ?? '';
    if (pageId && pageIds.has(pageId)) {
      syncCount += 1;
      return {
        ...highlight,
        notion: {
          ...highlight.notion,
          status: 'sync' as const,
          error: undefined
        }
      };
    }

    readyCount += 1;
    return {
      ...highlight,
      notion: {
        ...highlight.notion,
        status: 'ready' as const,
        error: undefined
      }
    };
  });

  await saveHighlights(next);
  return {
    total: next.length,
    sync: syncCount,
    ready: readyCount
  };
}

async function testNotionConnection(): Promise<{ ok: boolean; message: string }> {
  const settings = await getSettings();
  const messages = getLocaleMessages(settings.language);
  if (!settings.notionToken || !settings.notionDbId) {
    return {
      ok: false,
      message: messages.missingNotionSettings
    };
  }

  const response = await fetch(
    `https://api.notion.com/v1/databases/${settings.notionDbId.replaceAll('-', '')}`,
    {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${settings.notionToken}`,
        'Notion-Version': '2022-06-28'
      }
    }
  );

  logSync('Notion connection test response', {
    status: response.status,
    ok: response.ok,
    dbId: maskIdentifier(settings.notionDbId)
  });

  if (!response.ok) {
    const raw = await response.text();
    let parsed: { message?: string } = {};
    if (raw) {
      try {
        parsed = JSON.parse(raw) as { message?: string };
      } catch {
        parsed = {};
      }
    }

    return {
      ok: false,
      message: mapNotionError(
        response.status,
        parsed.message ?? messages.notionConnectionTestFailed,
        messages
      )
    };
  }

  const reconciled = await reconcileHighlightSyncStatesByDatabase(
    settings.notionToken,
    settings.notionDbId,
    messages
  );
  logSync('Notion connection reconcile finished', reconciled);

  return {
    ok: true,
    message: messages.notionConnectionSuccess(reconciled.sync, reconciled.ready)
  };
}

chrome.runtime.onInstalled.addListener(() => {
  console.log('CatchIt background initialized');
  if (chrome.sidePanel?.setPanelBehavior) {
    void chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true });
  }
});

chrome.runtime.onStartup.addListener(() => {
  if (chrome.sidePanel?.setPanelBehavior) {
    void chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true });
  }
});

chrome.storage.onChanged.addListener((changes, areaName) => {
  if (areaName !== 'local') {
    return;
  }

  const settingsChange = changes[SETTINGS_STORAGE_KEY];
  if (!settingsChange) {
    return;
  }

  const oldDbId = normalizeNotionId(
    (settingsChange.oldValue as { notionDbId?: string } | undefined)?.notionDbId ?? ''
  );
  const newDbId = normalizeNotionId(
    (settingsChange.newValue as { notionDbId?: string } | undefined)?.notionDbId ?? ''
  );

  if (!oldDbId || !newDbId || oldDbId === newDbId) {
    return;
  }

  void (async () => {
    try {
      const resetCount = await resetAllHighlightsReadyOnDbChange();
      logSync('Database ID changed: reset highlight statuses to ready', {
        oldDbId: maskIdentifier(oldDbId),
        newDbId: maskIdentifier(newDbId),
        resetCount
      });
    } catch (error) {
      console.error('[CatchIt] failed to reset statuses after db change:', error);
    }
  })();
});

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (isSaveHighlightRequestMessage(message)) {
    void (async () => {
      try {
        const created = await addHighlight({
          text: message.payload.text,
          url: message.payload.url,
          title: message.payload.title,
          tags: message.payload.tags ?? [],
          contextBefore: message.payload.contextBefore,
          contextAfter: message.payload.contextAfter,
          notion: { status: 'ready' }
        });

        const settings = await getSettings();
        if (settings.autoSync && settings.notionToken && settings.notionDbId) {
          logSync('Auto sync triggered after save', { highlightId: created.id });
          const latest = await getHighlightById(created.id);
          if (latest) {
            void syncHighlightToNotion(latest);
          }
        } else {
          logSync('Auto sync not triggered after save', {
            highlightId: created.id,
            autoSync: settings.autoSync,
            hasToken: Boolean(settings.notionToken),
            hasDatabaseId: Boolean(settings.notionDbId)
          });
        }

        sendResponse({ ok: true });
      } catch (error) {
        console.error('[CatchIt] failed to save highlight:', error);
        sendResponse({ ok: false });
      }
    })();

    return true;
  }

  if (isSyncNowRequestMessage(message)) {
    void (async () => {
      try {
        const result = await syncNow();
        sendResponse({ ok: true, result });
      } catch (error) {
        console.error('[CatchIt] sync now failed:', error);
        sendResponse({ ok: false });
      }
    })();

    return true;
  }

  if (isTestNotionConnectionRequestMessage(message)) {
    void (async () => {
      try {
        const result = await testNotionConnection();
        sendResponse(result);
      } catch (error) {
        console.error('[CatchIt] notion connection test failed:', error);
        const settings = await getSettings();
        const messages = getLocaleMessages(settings.language);
        sendResponse({ ok: false, message: messages.notionConnectionRuntimeError });
      }
    })();

    return true;
  }
});
