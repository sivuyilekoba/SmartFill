import { deleteAllData, emptyProfile, loadStore, saveStore } from '../shared/profile';
import type { Profile, ProfileStore } from '../shared/profile';

const profileSelect = document.getElementById('profileSelect') as HTMLSelectElement;
const newProfileBtn = document.getElementById('newProfileBtn') as HTMLButtonElement;
const deleteProfileBtn = document.getElementById('deleteProfileBtn') as HTMLButtonElement;
const exportBtn = document.getElementById('exportBtn') as HTMLButtonElement;
const importBtn = document.getElementById('importBtn') as HTMLButtonElement;
const importInput = document.getElementById('importInput') as HTMLInputElement;
const deleteAllBtn = document.getElementById('deleteAllBtn') as HTMLButtonElement;
const toastEl = document.getElementById('toast') as HTMLDivElement;

const boundInputs = Array.from(document.querySelectorAll<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>('[data-path]'));

let store: ProfileStore = { profiles: [], defaultId: null };
let current: Profile | null = null;
let saveTimer: number | undefined;
let toastTimer: number | undefined;

// ---------------------------------------------------------------------------
// Path helpers (support arrays, e.g. employment.previous.0.company)
// ---------------------------------------------------------------------------

function getByPath(target: unknown, path: string): unknown {
  return path.split('.').reduce<unknown>((accumulator, key) => {
    if (accumulator === null || accumulator === undefined) return undefined;
    return (accumulator as Record<string, unknown>)[key];
  }, target);
}

function setByPath(target: object, path: string, value: unknown): void {
  const parts = path.split('.');
  let cursor = target as Record<string, unknown>;

  for (let i = 0; i < parts.length - 1; i++) {
    const key = parts[i];
    const nextIsIndex = /^\d+$/.test(parts[i + 1]);
    let next = cursor[key];
    if (next === undefined || next === null || typeof next !== 'object') {
      next = nextIsIndex ? [] : {};
      cursor[key] = next;
    }
    cursor = next as Record<string, unknown>;
  }

  cursor[parts[parts.length - 1]] = value;
}

// ---------------------------------------------------------------------------
// Toast
// ---------------------------------------------------------------------------

function toast(message: string, isError = false): void {
  toastEl.textContent = message;
  toastEl.className = `toast show${isError ? ' error' : ''}`;
  window.clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => {
    toastEl.className = 'toast';
  }, 2200);
}

// ---------------------------------------------------------------------------
// Rendering
// ---------------------------------------------------------------------------

function renderProfileSelect(): void {
  profileSelect.innerHTML = store.profiles
    .map((profile) => `<option value="${profile.id}">${escapeHtml(profile.name || 'Untitled')}</option>`)
    .join('');
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function renderForm(): void {
  if (!current) return;

  for (const input of boundInputs) {
    const path = input.getAttribute('data-path');
    if (!path) continue;
    const value = getByPath(current, path);

    if (input.dataset.type === 'boolean') {
      input.value = value ? 'true' : 'false';
    } else {
      input.value = value === undefined || value === null ? '' : String(value);
    }
  }
}

function updateSelectedOptionLabel(): void {
  if (!current) return;
  const option = profileSelect.querySelector<HTMLOptionElement>(`option[value="${current.id}"]`);
  if (option) option.textContent = current.name || 'Untitled';
}

// ---------------------------------------------------------------------------
// Persistence
// ---------------------------------------------------------------------------

function scheduleSave(): void {
  window.clearTimeout(saveTimer);
  saveTimer = window.setTimeout(() => {
    void saveStore(store).then(() => toast('Saved'));
  }, 450);
}

function applyInputToModel(input: HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement): void {
  if (!current) return;

  const path = input.getAttribute('data-path');
  if (!path) return;

  const value = input.dataset.type === 'boolean' ? input.value === 'true' : input.value;
  setByPath(current, path, value);

  if (path === 'name') updateSelectedOptionLabel();
  scheduleSave();
}

// ---------------------------------------------------------------------------
// Profile management
// ---------------------------------------------------------------------------

function selectProfile(id: string): void {
  const profile = store.profiles.find((candidate) => candidate.id === id) ?? store.profiles[0] ?? null;
  current = profile;
  if (!profile) return;
  store.defaultId = profile.id;
  profileSelect.value = profile.id;
  renderForm();
  scheduleSave();
}

function addProfile(): void {
  const profile = emptyProfile(`Profile ${store.profiles.length + 1}`);
  store.profiles.push(profile);
  store.defaultId = profile.id;
  renderProfileSelect();
  selectProfile(profile.id);
  toast('Profile created');
}

function removeProfile(): void {
  if (!current) return;
  if (store.profiles.length <= 1) {
    toast('You need at least one profile', true);
    return;
  }
  const confirmed = window.confirm(`Delete "${current.name || 'this profile'}"? This cannot be undone.`);
  if (!confirmed) return;

  store.profiles = store.profiles.filter((profile) => profile.id !== current?.id);
  store.defaultId = store.profiles[0].id;
  renderProfileSelect();
  selectProfile(store.defaultId);
  void saveStore(store);
  toast('Profile deleted');
}

// ---------------------------------------------------------------------------
// Import / export
// ---------------------------------------------------------------------------

function exportJson(): void {
  const blob = new Blob([JSON.stringify(store, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = 'smartfill-profiles.json';
  anchor.click();
  URL.revokeObjectURL(url);
}

async function importJson(file: File): Promise<void> {
  try {
    const text = await file.text();
    const parsed = JSON.parse(text) as ProfileStore;
    if (!parsed || !Array.isArray(parsed.profiles) || parsed.profiles.length === 0) {
      toast('That file does not contain any profiles', true);
      return;
    }
    store = { profiles: parsed.profiles, defaultId: parsed.defaultId ?? parsed.profiles[0].id };
    await saveStore(store);
    renderProfileSelect();
    selectProfile(store.defaultId ?? store.profiles[0].id);
    toast('Profiles imported');
  } catch {
    toast('Could not read that file', true);
  }
}

async function handleDeleteAll(): Promise<void> {
  const confirmed = window.confirm('Delete ALL profiles and personal data? This cannot be undone.');
  if (!confirmed) return;

  await deleteAllData();
  store = { profiles: [], defaultId: null };
  current = null;
  await bootstrap();
  toast('All data deleted');
}

// ---------------------------------------------------------------------------
// Bootstrap
// ---------------------------------------------------------------------------

function bindEvents(): void {
  boundInputs.forEach((input) => {
    input.addEventListener('input', () => applyInputToModel(input));
    input.addEventListener('change', () => applyInputToModel(input));
  });

  profileSelect.addEventListener('change', () => selectProfile(profileSelect.value));
  newProfileBtn.addEventListener('click', addProfile);
  deleteProfileBtn.addEventListener('click', removeProfile);
  exportBtn.addEventListener('click', exportJson);
  importBtn.addEventListener('click', () => importInput.click());
  importInput.addEventListener('change', () => {
    const file = importInput.files?.[0];
    if (file) void importJson(file);
    importInput.value = '';
  });
  deleteAllBtn.addEventListener('click', () => void handleDeleteAll());
}

async function bootstrap(): Promise<void> {
  store = await loadStore();

  if (store.profiles.length === 0) {
    const profile = emptyProfile('My Profile');
    store = { profiles: [profile], defaultId: profile.id };
    await saveStore(store);
  }

  renderProfileSelect();
  selectProfile(store.defaultId ?? store.profiles[0].id);
}

void bootstrap().then(bindEvents);
