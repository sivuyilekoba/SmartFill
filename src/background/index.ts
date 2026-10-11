// Background service worker: context menu + keyboard shortcut entry points.

import { ensureContentScript } from '../shared/inject';
import { getActiveProfile } from '../shared/profile';

const MENU_ID = 'smartfill-fill';
const PROFILES_KEY = 'smartfill.profiles';

chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: MENU_ID,
    title: 'SmartFill: fill this form',
    contexts: ['page', 'editable']
  });

  // First run: send the user straight to the profile editor.
  void chrome.storage.local.get(PROFILES_KEY, (items) => {
    const existing = (items as Record<string, unknown>)[PROFILES_KEY];
    if (!existing) void chrome.runtime.openOptionsPage();
  });
});

async function fillTab(tabId: number): Promise<void> {
  const ready = await ensureContentScript(tabId);
  if (!ready) return;

  const profile = await getActiveProfile();
  chrome.tabs.sendMessage(tabId, {
    type: 'smartfill:fill',
    mode: profile ? 'profile' : 'dummy',
    profileId: profile?.id ?? null
  });
}

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === MENU_ID && tab?.id != null) void fillTab(tab.id);
});

chrome.commands.onCommand.addListener((command, tab) => {
  if (command === 'fill-application' && tab?.id != null) void fillTab(tab.id);
});
