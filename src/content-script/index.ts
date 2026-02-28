document.addEventListener('mouseup', () => {
  const selectedText = window.getSelection()?.toString().trim();
  if (!selectedText) {
    return;
  }

  console.debug('[CatchIt] selection detected:', selectedText.slice(0, 32));
});
