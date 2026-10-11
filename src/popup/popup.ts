import { ensureContentScript } from '../shared/inject';
import type { Message, MessageResponse, FillReport } from '../shared/messaging';
import { loadStore } from '../shared/profile';

const profileSelect = document.getElementById('profileSelect') as HTMLSelectElement;
const fillProfileBtn = document.getElementById('fillProfileBtn') as HTMLButtonElement;
const fillDummyBtn = document.getElementById('fillDummyBtn') as HTMLButtonElement;
const undoBtn = document.getElementById('undoBtn') as HTMLButtonElement;
const clearBtn = document.getElementById('clearBtn') as HTMLButtonElement;
const settingsBtn = document.getElementById('settingsBtn') as HTMLButtonElement;
const statusEl = document.getElementById('status') as HTMLDivElement;
const reportDetails = document.getElementById('reportDetails') as HTMLDetailsElement;
const reportList = document.getElementById('reportList') as HTMLUListElement;

type StatusType = 'success' | 'error' | 'info';

function showStatus(message: string, type: StatusType = 'info'): void {
  statusEl.textContent = message;
  statusEl.className = `status show ${type}`;
}

function clearStatus(): void {
  statusEl.className = 'status';
  reportDetails.hidden = true;
  reportDetails.open = false;
  reportList.innerHTML = '';
}

async function activeTabId(): Promise<number | null> {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  return tab?.id ?? null;
}

function sendMessage(tabId: number, message: Message): Promise<MessageResponse | undefined> {
  return new Promise((resolve) => {
    chrome.tabs.sendMessage(tabId, message, (response) => {
      void chrome.runtime.lastError;
      resolve(response as MessageResponse | undefined);
    });
  });
}

async function withContentScript(action: (tabId: number) => Promise<void>): Promise<void> {
  const tabId = await activeTabId();
  if (tabId === null) {
    showStatus('No active tab found.', 'error');
    return;
  }

  const ready = await ensureContentScript(tabId);
  if (!ready) {
    showStatus('SmartFill cannot run on this page. Try a normal website tab.', 'error');
    return;
  }

  await action(tabId);
}

function renderReport(report: FillReport): void {
  const parts: string[] = [];

  for (const outcome of report.outcomes) {
    const label = outcome.label || outcome.category;
    const suffix = outcome.reason ? ` — ${outcome.reason}` : '';
    parts.push(`<li><b>${escapeHtml(label)}</b>: ${outcome.status}${escapeHtml(suffix)}</li>`);
  }

  reportList.innerHTML = parts.join('');
  reportDetails.hidden = parts.length === 0;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

async function runFill(mode: 'dummy' | 'profile'): Promise<void> {
  clearStatus();
  fillProfileBtn.disabled = true;
  fillDummyBtn.disabled = true;

  try {
    await withContentScript(async (tabId) => {
      const profileId = mode === 'profile' ? profileSelect.value || null : null;
      const response = await sendMessage(tabId, { type: 'smartfill:fill', mode, profileId });

      if (!response || !response.ok) {
        showStatus(response && 'error' in response ? response.error : 'Could not reach the page.', 'error');
        return;
      }
      if (!('report' in response)) return;

      const { report } = response;
      if (report.total === 0) {
        showStatus('No form fields found on this page.', 'error');
        return;
      }

      const message = `Filled ${report.filled} of ${report.total} fields` +
        (report.skipped ? ` · ${report.skipped} skipped` : '') +
        (report.failed ? ` · ${report.failed} failed` : '');
      showStatus(message + '.', report.filled > 0 ? 'success' : 'info');
      renderReport(report);
    });
  } finally {
    fillProfileBtn.disabled = false;
    fillDummyBtn.disabled = false;
  }
}

async function runSimple(message: Message, successText: (response: MessageResponse) => string): Promise<void> {
  clearStatus();
  await withContentScript(async (tabId) => {
    const response = await sendMessage(tabId, message);
    if (!response || !response.ok) {
      showStatus(response && 'error' in response ? response.error : 'Could not reach the page.', 'error');
      return;
    }
    showStatus(successText(response), 'success');
  });
}

async function initProfiles(): Promise<void> {
  const store = await loadStore();

  if (store.profiles.length === 0) {
    profileSelect.innerHTML = '<option value="">No profile saved</option>';
    fillProfileBtn.disabled = true;
    return;
  }

  profileSelect.innerHTML = store.profiles
    .map((profile) => `<option value="${profile.id}">${escapeHtml(profile.name)}</option>`)
    .join('');
  profileSelect.value = store.defaultId ?? store.profiles[0].id;
}

fillProfileBtn.addEventListener('click', () => void runFill('profile'));
fillDummyBtn.addEventListener('click', () => void runFill('dummy'));

undoBtn.addEventListener('click', () => {
  void runSimple({ type: 'smartfill:revert' }, (response) => {
    const reverted = 'reverted' in response ? response.reverted : 0;
    return reverted > 0 ? `Restored ${reverted} fields.` : 'Nothing to undo.';
  });
});

clearBtn.addEventListener('click', () => {
  void runSimple({ type: 'smartfill:clear' }, (response) => {
    const cleared = 'cleared' in response ? response.cleared ?? 0 : 0;
    return cleared > 0 ? `Cleared ${cleared} fields.` : 'No fields to clear.';
  });
});

settingsBtn.addEventListener('click', () => {
  void chrome.runtime.openOptionsPage();
});

void initProfiles();
