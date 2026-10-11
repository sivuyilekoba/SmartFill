// Helpers for injecting (and reaching) the content script on demand.
//
// The extension deliberately does NOT register a declarative content script for
// <all_urls>. Instead we inject `content.js` into the active tab only after the
// user interacts (popup click, keyboard shortcut, context menu), which relies on
// the lightweight `activeTab` permission and keeps the extension from reading
// pages the user never asked it to touch.

export function pingTab(tabId: number): Promise<boolean> {
  return new Promise((resolve) => {
    try {
      chrome.tabs.sendMessage(tabId, { type: 'smartfill:ping' }, () => {
        const failed = Boolean(chrome.runtime.lastError);
        // Touch lastError so Chrome does not log "Unchecked runtime.lastError".
        void chrome.runtime.lastError;
        resolve(!failed);
      });
    } catch {
      resolve(false);
    }
  });
}

/** Ensures the content script is present in `tabId`, injecting it if necessary. */
export async function ensureContentScript(tabId: number): Promise<boolean> {
  if (await pingTab(tabId)) return true;

  try {
    await chrome.scripting.executeScript({
      target: { tabId, allFrames: false },
      files: ['content.js']
    });
  } catch {
    return false;
  }

  return await pingTab(tabId);
}
