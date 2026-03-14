import { getLocaleMessages } from '@/shared/i18n';
import { getSettings } from '@/shared/storage/settings-storage';

const POPOVER_ID = 'catchit-selection-popover';
const STYLE_ID = 'catchit-selection-style';
const PERSISTENT_HIGHLIGHT_NAME = 'catchit-selection';
const MIN_SELECTION_LENGTH = 3;

let currentSelectionText = '';
let isAltPressed = false;
let currentSelectionRange: Range | null = null;

interface SaveHighlightRequestMessage {
  type: 'HIGHLIGHT_SAVE_REQUEST';
  payload: {
    text: string;
    url: string;
    title: string;
    tags: string[];
    contextBefore?: string;
    contextAfter?: string;
  };
}

function removePopoverElement(): void {
  const popover = document.getElementById(POPOVER_ID);
  if (popover) {
    popover.remove();
  }
}

function removePopover(): void {
  removePopoverElement();
  clearPersistentSelectionHighlight();
}

function clearSelection(): void {
  window.getSelection()?.removeAllRanges();
}

function ensureSelectionStyle(): void {
  if (document.getElementById(STYLE_ID)) {
    return;
  }

  const style = document.createElement('style');
  style.id = STYLE_ID;
  style.textContent = `
    ::selection {
      background: #fecdd3;
      color: #881337;
    }
    ::-moz-selection {
      background: #fecdd3;
      color: #881337;
    }
    ::highlight(catchit-selection) {
      background: #fecdd3;
      color: #881337;
    }
  `;
  document.documentElement.appendChild(style);
}

function setPersistentSelectionHighlight(range: Range): void {
  currentSelectionRange = range.cloneRange();

  const cssAny = CSS as unknown as {
    highlights?: {
      set: (name: string, highlight: unknown) => void;
    };
  };
  const highlightCtor = (globalThis as unknown as { Highlight?: new (range: Range) => unknown })
    .Highlight;

  if (!cssAny.highlights || !highlightCtor) {
    return;
  }

  cssAny.highlights.set(PERSISTENT_HIGHLIGHT_NAME, new highlightCtor(currentSelectionRange));
}

function clearPersistentSelectionHighlight(): void {
  currentSelectionRange = null;

  const cssAny = CSS as unknown as {
    highlights?: {
      delete: (name: string) => void;
    };
  };
  if (!cssAny.highlights) {
    return;
  }

  cssAny.highlights.delete(PERSISTENT_HIGHLIGHT_NAME);
}

function createPopover(x: number, y: number, language: 'en' | 'ko'): HTMLDivElement {
  removePopoverElement();
  const messages = getLocaleMessages(language);

  const popover = document.createElement('div');
  popover.id = POPOVER_ID;
  popover.style.position = 'fixed';
  popover.style.left = `${x}px`;
  popover.style.top = `${Math.max(y, 12)}px`;
  popover.style.transform = 'translate(-50%, calc(-100% - 8px))';
  popover.style.zIndex = '2147483647';
  popover.style.display = 'flex';
  popover.style.gap = '8px';
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

  const tagInput = document.createElement('input');
  tagInput.type = 'text';
  tagInput.placeholder = messages.contentTagPlaceholder;
  tagInput.style.width = '140px';
  tagInput.style.border = '1px solid #cbd5e1';
  tagInput.style.borderRadius = '8px';
  tagInput.style.padding = '6px 8px';
  tagInput.style.fontSize = '12px';
  tagInput.style.color = '#334155';
  tagInput.style.outline = 'none';

  const saveButton = document.createElement('button');
  saveButton.type = 'button';
  saveButton.textContent = messages.contentSave;
  saveButton.style.border = 'none';
  saveButton.style.background = '#f43f5e';
  saveButton.style.color = '#ffffff';
  saveButton.style.padding = '6px 10px';
  saveButton.style.borderRadius = '8px';
  saveButton.style.fontSize = '12px';
  saveButton.style.fontWeight = '600';
  saveButton.style.cursor = 'pointer';

  saveButton.addEventListener('click', () => {
    if (!currentSelectionText) {
      removePopover();
      return;
    }

    const tags = tagInput.value
      .split(',')
      .map((tag) => tag.trim())
      .filter((tag) => tag.length > 0);

    const message: SaveHighlightRequestMessage = {
      type: 'HIGHLIGHT_SAVE_REQUEST',
      payload: {
        text: currentSelectionText,
        url: window.location.href,
        title: document.title,
        tags
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

  popover.addEventListener('mousedown', (event) => {
    event.stopPropagation();
  });

  popover.appendChild(title);
  popover.appendChild(tagInput);
  popover.appendChild(saveButton);

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
    setPersistentSelectionHighlight(range);
    clearSelection();
    createPopover(rect.left + rect.width / 2, rect.top, settings.language);
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

ensureSelectionStyle();
