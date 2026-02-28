import { addHighlight } from '@/shared/storage/highlight-storage';
import type { SaveHighlightRequestMessage } from '@/shared/types/messages';

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

chrome.runtime.onInstalled.addListener(() => {
  console.log('CatchIt background initialized');
});

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (!isSaveHighlightRequestMessage(message)) {
    return;
  }

  void (async () => {
    try {
      await addHighlight({
        text: message.payload.text,
        url: message.payload.url,
        title: message.payload.title,
        tags: message.payload.tags ?? [],
        contextBefore: message.payload.contextBefore,
        contextAfter: message.payload.contextAfter,
        notion: { status: 'pending' }
      });

      sendResponse({ ok: true });
    } catch (error) {
      console.error('[CatchIt] failed to save highlight:', error);
      sendResponse({ ok: false });
    }
  })();

  return true;
});
