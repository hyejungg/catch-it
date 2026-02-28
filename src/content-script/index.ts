import { getSettings } from '@/shared/storage/settings-storage';
import type { SaveHighlightRequestMessage } from '@/shared/types/messages';

const POPOVER_ID = 'catchit-selection-popover';
const MIN_SELECTION_LENGTH = 3;

let currentSelectionText = '';
let isAltPressed = false;

function removePopover(): void {
  const existing = document.getElementById(POPOVER_ID);
  if (existing) {
    existing.remove();
  }
}

function clearSelection(): void {
  window.getSelection()?.removeAllRanges();
}

function createPopover(x: number, y: number): HTMLDivElement {
  removePopover();

  const popover = document.createElement('div');
  popover.id = POPOVER_ID;
  popover.style.position = 'fixed';
  popover.style.left = `${x}px`;
  popover.style.top = `${Math.max(y, 12)}px`;
  popover.style.transform = 'translate(-50%, calc(-100% - 8px))';
  popover.style.zIndex = '2147483647';
  popover.style.display = 'flex';
  popover.style.gap = '6px';
  popover.style.alignItems = 'center';
  popover.style.padding = '8px';
  popover.style.borderRadius = '10px';
  popover.style.background = '#ffffff';
  popover.style.border = '1px solid #e2e8f0';
  popover.style.boxShadow = '0 8px 20px rgba(15, 23, 42, 0.15)';
  popover.style.fontFamily = 'Inter, Pretendard, -apple-system, sans-serif';

  const title = document.createElement('span');
  title.textContent = 'CatchIt';
  title.style.fontSize = '12px';
  title.style.fontWeight = '600';
  title.style.color = '#334155';
  title.style.marginRight = '2px';

  const saveButton = document.createElement('button');
  saveButton.type = 'button';
  saveButton.textContent = '저장';
  saveButton.style.border = 'none';
  saveButton.style.background = '#f43f5e';
  saveButton.style.color = '#ffffff';
  saveButton.style.padding = '6px 10px';
  saveButton.style.borderRadius = '8px';
  saveButton.style.fontSize = '12px';
  saveButton.style.fontWeight = '600';
  saveButton.style.cursor = 'pointer';

  const cancelButton = document.createElement('button');
  cancelButton.type = 'button';
  cancelButton.textContent = '취소';
  cancelButton.style.border = '1px solid #cbd5e1';
  cancelButton.style.background = '#ffffff';
  cancelButton.style.color = '#475569';
  cancelButton.style.padding = '6px 10px';
  cancelButton.style.borderRadius = '8px';
  cancelButton.style.fontSize = '12px';
  cancelButton.style.cursor = 'pointer';

  saveButton.addEventListener('click', () => {
    if (!currentSelectionText) {
      removePopover();
      return;
    }

    const message: SaveHighlightRequestMessage = {
      type: 'HIGHLIGHT_SAVE_REQUEST',
      payload: {
        text: currentSelectionText,
        url: window.location.href,
        title: document.title,
        tags: []
      }
    };

    try {
      chrome.runtime.sendMessage(message, () => {
        void chrome.runtime.lastError;
      });
    } catch (error) {
      console.debug('[CatchIt] failed to send save request:', error);
    }

    removePopover();
    clearSelection();
    currentSelectionText = '';
  });

  cancelButton.addEventListener('click', () => {
    removePopover();
    clearSelection();
    currentSelectionText = '';
  });

  popover.addEventListener('mousedown', (event) => {
    event.stopPropagation();
  });

  popover.appendChild(title);
  popover.appendChild(saveButton);
  popover.appendChild(cancelButton);

  document.body.appendChild(popover);

  // If there's not enough room above the selected text, place popover below it.
  const bounds = popover.getBoundingClientRect();
  if (bounds.top < 8) {
    popover.style.transform = 'translate(-50%, 8px)';
  }

  return popover;
}

async function handleMouseUp(event: MouseEvent): Promise<void> {
  try {
    if ((event.target as HTMLElement | null)?.closest(`#${POPOVER_ID}`)) {
      return;
    }

    const settings = await getSettings();
    if (settings.requireAlt && !(event.altKey || isAltPressed)) {
      removePopover();
      return;
    }

    const selection = window.getSelection();
    const text = selection?.toString().trim() ?? '';
    if (!selection || selection.rangeCount === 0 || text.length < MIN_SELECTION_LENGTH) {
      removePopover();
      return;
    }

    const range = selection.getRangeAt(0);
    const rect = range.getBoundingClientRect();
    if (rect.width === 0 && rect.height === 0) {
      removePopover();
      return;
    }

    currentSelectionText = text;
    createPopover(rect.left + rect.width / 2, rect.top);
  } catch (error) {
    console.debug('[CatchIt] handleMouseUp failed:', error);
    removePopover();
  }
}

document.addEventListener('mouseup', (event) => {
  void handleMouseUp(event);
});

document.addEventListener('mousedown', (event) => {
  if ((event.target as HTMLElement | null)?.closest(`#${POPOVER_ID}`)) {
    return;
  }
  removePopover();
});

document.addEventListener('keydown', (event) => {
  if (event.key === 'Alt') {
    isAltPressed = true;
  }
});

document.addEventListener('keyup', (event) => {
  if (event.key === 'Alt') {
    isAltPressed = false;
  }
});
