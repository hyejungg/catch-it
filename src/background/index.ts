import {
  addHighlight,
  getHighlights,
  getHighlightById,
  updateHighlight
} from '@/shared/storage/highlight-storage';
import { getSettings } from '@/shared/storage/settings-storage';
import type { Highlight } from '@/shared/types/highlight';
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

function mapNotionError(status: number, fallback: string): string {
  if (status === 401) return 'Notion 인증 실패(401)';
  if (status === 403) return 'Notion 권한 오류(403)';
  if (status === 429) return 'Notion 요청 제한(429)';
  return fallback || `Notion 동기화 실패(${status})`;
}

function toISOStringFromTimestamp(timestamp: number): string {
  return new Date(timestamp).toISOString();
}

async function createNotionPage(
  highlight: Highlight,
  notionToken: string,
  notionDbId: string
): Promise<string> {
  const body = {
    parent: { database_id: notionDbId },
    properties: {
      Name: {
        title: [{ text: { content: highlight.title || 'Untitled' } }]
      },
      Quote: {
        rich_text: [{ text: { content: highlight.text.slice(0, 1900) } }]
      },
      URL: { url: highlight.url },
      SavedAt: { date: { start: toISOStringFromTimestamp(highlight.createdAt) } },
      Tags: {
        multi_select: highlight.tags.map((tag) => ({ name: tag }))
      }
    }
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

  if (!response.ok || !parsed.id) {
    throw new Error(mapNotionError(response.status, parsed.message ?? 'Notion API 응답 오류'));
  }

  return parsed.id;
}

async function syncHighlightToNotion(highlight: Highlight): Promise<'synced' | 'failed'> {
  const settings = await getSettings();
  if (!settings.notionToken || !settings.notionDbId) {
    await updateHighlight(highlight.id, {
      notion: {
        status: 'failed',
        error: 'Notion 설정 누락: 토큰 또는 Database ID를 확인하세요.'
      }
    });
    return 'failed';
  }

  await updateHighlight(highlight.id, {
    notion: { status: 'pending', error: undefined }
  });

  try {
    const pageId = await createNotionPage(highlight, settings.notionToken, settings.notionDbId);
    await updateHighlight(highlight.id, {
      notion: {
        status: 'synced',
        pageId,
        syncedAt: Date.now(),
        error: undefined
      }
    });
    return 'synced';
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Notion 동기화 실패';
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
    return { total: 0, synced: 0, failed: 0 };
  }

  const highlights = await getHighlights();
  const targets = highlights.filter((item) => item.notion?.status !== 'synced');

  let synced = 0;
  let failed = 0;

  for (const item of targets) {
    const result = await syncHighlightToNotion(item);
    if (result === 'synced') synced += 1;
    else failed += 1;
  }

  return {
    total: targets.length,
    synced,
    failed
  };
}

async function testNotionConnection(): Promise<{ ok: boolean; message: string }> {
  const settings = await getSettings();
  if (!settings.notionToken || !settings.notionDbId) {
    return {
      ok: false,
      message: 'Notion 설정 누락: 토큰 또는 Database ID를 확인하세요.'
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
      message: mapNotionError(response.status, parsed.message ?? '연동 확인 실패')
    };
  }

  return {
    ok: true,
    message: 'Notion 연동 확인 성공'
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
          notion: { status: 'pending' }
        });

        const settings = await getSettings();
        if (settings.autoSync) {
          const latest = await getHighlightById(created.id);
          if (latest) {
            void syncHighlightToNotion(latest);
          }
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
        sendResponse({ ok: false, message: '연동 확인 중 오류 발생' });
      }
    })();

    return true;
  }
});
