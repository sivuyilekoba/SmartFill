import { describe, expect, it } from 'vitest';
import { emptyProfile, valueFromProfile } from './profile';
import { randomValueFor } from './generators';

describe('emptyProfile', () => {
  it('creates a profile with blank fields and safe work-auth defaults', () => {
    const profile = emptyProfile('Test');
    expect(profile.name).toBe('Test');
    expect(profile.personal.firstName).toBe('');
    expect(profile.workAuth.authorizedToWork).toBe(true);
    expect(profile.workAuth.requiresSponsorship).toBe(false);
    expect(profile.education.history).toEqual([]);
  });
});

describe('valueFromProfile', () => {
  it('builds a full name from first and last name when no override exists', () => {
    const profile = emptyProfile();
    profile.personal.firstName = 'Ada';
    profile.personal.lastName = 'Lovelace';
    expect(valueFromProfile(profile, 'fullName')).toBe('Ada Lovelace');
  });

  it('prefers an explicit full name override', () => {
    const profile = emptyProfile();
    profile.personal.firstName = 'Ada';
    profile.personal.lastName = 'Lovelace';
    profile.personal.fullName = 'Ada King-Lovelace';
    expect(valueFromProfile(profile, 'fullName')).toBe('Ada King-Lovelace');
  });

  it('returns null for missing optional values so the field is skipped', () => {
    const profile = emptyProfile();
    expect(valueFromProfile(profile, 'linkedin')).toBeNull();
    expect(valueFromProfile(profile, 'gender')).toBeNull();
  });

  it('returns booleans for work-authorisation categories', () => {
    const profile = emptyProfile();
    profile.workAuth.requiresSponsorship = true;
    expect(valueFromProfile(profile, 'authorizedToWork')).toBe(true);
    expect(valueFromProfile(profile, 'requiresSponsorship')).toBe(true);
  });

  it('falls back to the first previous role and education entry', () => {
    const profile = emptyProfile();
    profile.employment.previous.push({ company: 'Acme', title: 'Engineer', start: '2019', end: '2022' });
    profile.education.history.push({ degree: "Bachelor's", school: 'State U', fieldOfStudy: 'CS', graduationYear: '2019' });

    expect(valueFromProfile(profile, 'prevCompany')).toBe('Acme');
    expect(valueFromProfile(profile, 'prevTitle')).toBe('Engineer');
    expect(valueFromProfile(profile, 'graduationYear')).toBe('2019');
  });
});

describe('randomValueFor', () => {
  it('produces plausible, non-real data', () => {
    expect(randomValueFor('email')).toMatch(/@example\.com$/);
    expect(randomValueFor('phone')).toMatch(/^\(555\) 01/);
    expect(randomValueFor('authorizedToWork')).toBe(true);
  });

  it('never generates values for protected fields', () => {
    expect(randomValueFor('ssn')).toBeNull();
    expect(randomValueFor('captcha')).toBeNull();
    expect(randomValueFor('resumeUpload')).toBeNull();
  });
});
