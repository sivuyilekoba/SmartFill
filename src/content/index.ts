// Content-script entry point. Injected on demand (activeTab + scripting) rather
// than declared for <all_urls>, so the extension only touches a page after the
// user explicitly asks it to.

import { NEVER_FILL } from '../shared/categories';
import { randomValueFor } from '../shared/generators';
import type { Message, MessageResponse, FillOutcome, FillReport, DetectedFieldSummary } from '../shared/messaging';
import { getActiveProfile, valueFromProfile } from '../shared/profile';
import type { Profile } from '../shared/profile';
import { collectFields } from './field-detector';
import type { FieldDescriptor } from './field-detector';
import { matchField } from './field-matcher';
import { dispatchInputEvents, fillElement, setNativeValue } from './fill-engine';

declare global {
  interface Window {
    __smartfillContentLoaded?: boolean;
  }
}

interface SnapshotEntry {
  element: HTMLElement;
  value: string;
  checked: boolean | null;
}

let lastSnapshot: SnapshotEntry[] | null = null;
const highlighted = new Map<HTMLElement, string>();

function snapshotOf(element: HTMLElement): SnapshotEntry {
  const input = element as HTMLInputElement;
  return {
    element,
    value: typeof input.value === 'string' ? input.value : '',
    checked: typeof input.checked === 'boolean' ? input.checked : null
  };
}

function highlightElement(element: HTMLElement): void {
  if (!highlighted.has(element)) highlighted.set(element, element.style.outline);
  element.style.outline = '2px solid #667eea';
  element.style.outlineOffset = '2px';
  try {
    element.scrollIntoView({ behavior: 'smooth', block: 'center' });
  } catch {
    // scrollIntoView options unsupported - non fatal.
  }
}

function clearHighlights(): void {
  highlighted.forEach((previous, element) => {
    element.style.outline = previous;
    element.style.outlineOffset = '';
  });
  highlighted.clear();
}

function detectFields(): DetectedFieldSummary[] {
  return collectFields(document).map((field) => {
    const match = matchField(field);
    return { category: match.category, confidence: match.confidence, label: field.label };
  });
}

async function fillForm(mode: 'dummy' | 'profile', profileId?: string | null): Promise<FillReport> {
  const fields = collectFields(document);
  const outcomes: FillOutcome[] = [];
  const snapshot: SnapshotEntry[] = [];

  let profile: Profile | null = null;
  if (mode === 'profile') {
    profile = await getActiveProfile(profileId);
    if (!profile) {
      return { filled: 0, skipped: fields.length, failed: 0, total: fields.length, outcomes };
    }
  }

  let filled = 0;
  let skipped = 0;
  let failed = 0;

  for (const field of fields) {
    try {
      const match = matchField(field);
      const label = field.label || match.category;

      if (match.category === 'resumeUpload') {
        highlightElement(field.element);
        skipped++;
        outcomes.push({ category: 'resumeUpload', label, status: 'skipped', reason: 'Upload this file manually' });
        continue;
      }

      if (NEVER_FILL.includes(match.category)) {
        skipped++;
        outcomes.push({ category: match.category, label, status: 'skipped', reason: 'Protected field - never auto-filled' });
        continue;
      }

      if (match.confidence < 0.5) {
        skipped++;
        outcomes.push({ category: match.category, label, status: 'skipped', reason: 'Could not identify field' });
        continue;
      }

      const value = mode === 'profile' && profile
        ? valueFromProfile(profile, match.category)
        : randomValueFor(match.category);

      if (value === null || value === undefined || value === '') {
        skipped++;
        outcomes.push({
          category: match.category,
          label,
          status: 'skipped',
          reason: mode === 'profile' ? 'Not in your profile' : 'No generator for this field'
        });
        continue;
      }

      snapshot.push(snapshotOf(field.element));
      const status = fillElement(field.element, value);

      if (status === 'filled') {
        filled++;
        outcomes.push({ category: match.category, label, status: 'filled' });
      } else {
        skipped++;
        outcomes.push({ category: match.category, label, status, reason: 'Value did not fit this control' });
      }
    } catch (error) {
      failed++;
      outcomes.push({
        category: 'unknown',
        label: field.label,
        status: 'failed',
        reason: error instanceof Error ? error.message : String(error)
      });
    }
  }

  lastSnapshot = snapshot;
  return { filled, skipped, failed, total: fields.length, outcomes };
}

function revertFill(): number {
  if (!lastSnapshot) return 0;

  let restored = 0;
  for (const entry of lastSnapshot) {
    const element = entry.element;
    if (!element.isConnected) continue;

    try {
      if (entry.checked !== null) {
        (element as HTMLInputElement).checked = entry.checked;
        element.dispatchEvent(new Event('change', { bubbles: true }));
      } else {
        setNativeValue(element, entry.value);
        dispatchInputEvents(element, entry.value);
      }
      restored++;
    } catch {
      // Skip elements that can no longer be written.
    }
  }

  clearHighlights();
  lastSnapshot = null;
  return restored;
}

function clearForm(): number {
  const fields: FieldDescriptor[] = collectFields(document, { requireVisible: false });
  lastSnapshot = fields.map((field) => snapshotOf(field.element));

  let cleared = 0;
  for (const field of fields) {
    const element = field.element;
    if (element instanceof HTMLInputElement && element.type === 'file') continue;

    if (element instanceof HTMLInputElement && (element.type === 'checkbox' || element.type === 'radio')) {
      element.checked = false;
      element.dispatchEvent(new Event('change', { bubbles: true }));
      cleared++;
      continue;
    }

    setNativeValue(element, '');
    dispatchInputEvents(element, '');
    cleared++;
  }

  return cleared;
}

async function handle(message: Message): Promise<MessageResponse> {
  switch (message.type) {
    case 'smartfill:ping':
      return { ok: true };
    case 'smartfill:detect':
      return { ok: true, detected: detectFields() };
    case 'smartfill:fill':
      return { ok: true, report: await fillForm(message.mode, message.profileId) };
    case 'smartfill:clear':
      return { ok: true, reverted: 0, cleared: clearForm() };
    case 'smartfill:revert':
      return { ok: true, reverted: revertFill() };
    default:
      return { ok: false, error: 'Unknown message' };
  }
}

if (!window.__smartfillContentLoaded) {
  window.__smartfillContentLoaded = true;

  chrome.runtime.onMessage.addListener((message: Message, _sender, sendResponse) => {
    handle(message)
      .then(sendResponse)
      .catch((error) => sendResponse({ ok: false, error: String(error) } satisfies MessageResponse));
    return true; // keep the channel open for the async response
  });
}
