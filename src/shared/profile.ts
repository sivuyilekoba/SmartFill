// Profile schema, persistence and the category -> value mapping used when
// filling in "profile" mode.

import type { Category } from './categories';
import { BOOLEAN_CATEGORIES } from './categories';

export interface WorkExperience {
  company: string;
  title: string;
  start: string;
  end: string;
}

export interface EducationEntry {
  degree: string;
  school: string;
  fieldOfStudy: string;
  graduationYear: string;
}

export interface Profile {
  id: string;
  name: string;
  personal: {
    firstName: string;
    middleName: string;
    lastName: string;
    preferredName: string;
    fullName: string;
    email: string;
    phone: string;
    address1: string;
    address2: string;
    city: string;
    state: string;
    zip: string;
    country: string;
    dob: string;
  };
  links: {
    linkedin: string;
    github: string;
    portfolio: string;
    website: string;
    twitter: string;
  };
  workAuth: {
    authorizedToWork: boolean;
    requiresSponsorship: boolean;
  };
  employment: {
    currentCompany: string;
    currentTitle: string;
    yearsExperience: string;
    currentSalary: string;
    desiredSalary: string;
    noticePeriod: string;
    previous: WorkExperience[];
  };
  education: {
    degree: string;
    school: string;
    fieldOfStudy: string;
    graduationYear: string;
    history: EducationEntry[];
  };
  eeo: {
    gender: string;
    race: string;
    veteran: string;
    disability: string;
  };
  longText: {
    aboutYourself: string;
    whyCompany: string;
    coverLetter: string;
  };
}

export interface ProfileStore {
  profiles: Profile[];
  defaultId: string | null;
}

export const SCHEMA_VERSION = 2;
const PROFILES_KEY = 'smartfill.profiles';
const DEFAULT_ID_KEY = 'smartfill.defaultProfileId';
const SCHEMA_KEY = 'smartfill.schemaVersion';
const LEGACY_KEYS = ['firstName', 'lastName', 'email', 'phone'];

export function newId(): string {
  return `p_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export function emptyProfile(name = 'My Profile'): Profile {
  return {
    id: newId(),
    name,
    personal: {
      firstName: '', middleName: '', lastName: '', preferredName: '', fullName: '',
      email: '', phone: '', address1: '', address2: '', city: '', state: '', zip: '',
      country: '', dob: ''
    },
    links: { linkedin: '', github: '', portfolio: '', website: '', twitter: '' },
    workAuth: { authorizedToWork: true, requiresSponsorship: false },
    employment: {
      currentCompany: '', currentTitle: '', yearsExperience: '', currentSalary: '',
      desiredSalary: '', noticePeriod: '', previous: []
    },
    education: { degree: '', school: '', fieldOfStudy: '', graduationYear: '', history: [] },
    eeo: { gender: '', race: '', veteran: '', disability: '' },
    longText: { aboutYourself: '', whyCompany: '', coverLetter: '' }
  };
}

// ---------------------------------------------------------------------------
// chrome.storage helpers (safe to call outside an extension context)
// ---------------------------------------------------------------------------

function hasStorage(): boolean {
  return typeof chrome !== 'undefined' && Boolean(chrome?.storage?.local);
}

function storageGet(keys: string[] | string): Promise<Record<string, unknown>> {
  return new Promise((resolve) => {
    if (!hasStorage()) return resolve({});
    chrome.storage.local.get(keys, (items) => resolve(items as Record<string, unknown>));
  });
}

function storageSet(items: Record<string, unknown>): Promise<void> {
  return new Promise((resolve) => {
    if (!hasStorage()) return resolve();
    chrome.storage.local.set(items, () => resolve());
  });
}

function storageRemove(keys: string[]): Promise<void> {
  return new Promise((resolve) => {
    if (!hasStorage()) return resolve();
    chrome.storage.local.remove(keys, () => resolve());
  });
}

// ---------------------------------------------------------------------------
// Load / save
// ---------------------------------------------------------------------------

export async function loadStore(): Promise<ProfileStore> {
  const raw = await storageGet([PROFILES_KEY, DEFAULT_ID_KEY]);
  const store = raw[PROFILES_KEY] as ProfileStore | undefined;

  if (store && Array.isArray(store.profiles) && store.profiles.length > 0) {
    return { profiles: store.profiles, defaultId: store.defaultId ?? store.profiles[0].id };
  }

  const migrated = await migrateLegacy();
  return migrated ?? { profiles: [], defaultId: null };
}

export async function saveStore(store: ProfileStore): Promise<void> {
  await storageSet({
    [PROFILES_KEY]: store,
    [DEFAULT_ID_KEY]: store.defaultId,
    [SCHEMA_KEY]: SCHEMA_VERSION
  });
}

export async function getActiveProfile(profileId?: string | null): Promise<Profile | null> {
  const store = await loadStore();
  if (store.profiles.length === 0) return null;
  if (profileId) {
    const match = store.profiles.find((p) => p.id === profileId);
    if (match) return match;
  }
  const byDefault = store.profiles.find((p) => p.id === store.defaultId);
  return byDefault ?? store.profiles[0];
}

/** Rebuilds a v2 profile from the v1 flat storage keys, then persists it. */
async function migrateLegacy(): Promise<ProfileStore | null> {
  const legacy = await storageGet(LEGACY_KEYS);
  const { firstName, lastName, email, phone } = legacy as Record<string, string | undefined>;

  if (!firstName && !lastName && !email && !phone) return null;

  const profile = emptyProfile('Migrated profile');
  profile.personal.firstName = firstName ?? '';
  profile.personal.lastName = lastName ?? '';
  profile.personal.email = email ?? '';
  profile.personal.phone = phone ?? '';

  const store: ProfileStore = { profiles: [profile], defaultId: profile.id };
  await saveStore(store);
  await storageRemove(LEGACY_KEYS);
  return store;
}

export async function deleteAllData(): Promise<void> {
  await storageRemove([PROFILES_KEY, DEFAULT_ID_KEY, SCHEMA_KEY, ...LEGACY_KEYS]);
}

// ---------------------------------------------------------------------------
// Category -> value mapping
// ---------------------------------------------------------------------------

export function isBooleanCategory(category: Category): boolean {
  return BOOLEAN_CATEGORIES.includes(category);
}

function firstPrevious(profile: Profile): WorkExperience | undefined {
  return profile.employment.previous[0];
}

/**
 * Resolve the value a profile holds for a category, or null when the user has
 * not provided one (we would rather skip a field than fill it incorrectly).
 */
export function valueFromProfile(profile: Profile, category: Category): string | boolean | null {
  const p = profile.personal;
  const links = profile.links;
  const emp = profile.employment;

  switch (category) {
    case 'firstName': return p.firstName || null;
    case 'middleName': return p.middleName || null;
    case 'lastName': return p.lastName || null;
    case 'fullName': {
      const combined = `${p.firstName} ${p.lastName}`.trim();
      return p.fullName || combined || null;
    }
    case 'preferredName': return p.preferredName || p.firstName || null;
    case 'email': return p.email || null;
    case 'phone': return p.phone || null;
    case 'address1': return p.address1 || null;
    case 'address2': return p.address2 || null;
    case 'city': return p.city || null;
    case 'state': return p.state || null;
    case 'zip': return p.zip || null;
    case 'country': return p.country || null;
    case 'dob': return p.dob || null;

    case 'linkedin': return links.linkedin || null;
    case 'github': return links.github || null;
    case 'portfolio': return links.portfolio || null;
    case 'website': return links.website || links.portfolio || null;
    case 'twitter': return links.twitter || null;

    case 'authorizedToWork': return profile.workAuth.authorizedToWork;
    case 'requiresSponsorship': return profile.workAuth.requiresSponsorship;

    case 'currentCompany': return emp.currentCompany || null;
    case 'currentTitle': return emp.currentTitle || null;
    case 'yearsExperience': return emp.yearsExperience || null;
    case 'currentSalary': return emp.currentSalary || null;
    case 'desiredSalary': return emp.desiredSalary || null;
    case 'noticePeriod': return emp.noticePeriod || null;
    case 'prevCompany': return firstPrevious(profile)?.company || null;
    case 'prevTitle': return firstPrevious(profile)?.title || null;

    case 'degree': return profile.education.degree || null;
    case 'school': return profile.education.school || null;
    case 'fieldOfStudy': return profile.education.fieldOfStudy || null;
    case 'graduationYear':
      return profile.education.graduationYear || profile.education.history[0]?.graduationYear || null;

    case 'gender': return profile.eeo.gender || null;
    case 'race': return profile.eeo.race || null;
    case 'veteran': return profile.eeo.veteran || null;
    case 'disability': return profile.eeo.disability || null;

    case 'aboutYourself': return profile.longText.aboutYourself || null;
    case 'whyCompany': return profile.longText.whyCompany || null;
    case 'coverLetter': return profile.longText.coverLetter || null;

    default: return null;
  }
}
