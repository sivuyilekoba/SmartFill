import { describe, expect, it } from 'vitest';
import { collectFields, describeElement } from './field-detector';
import { matchField } from './field-matcher';
import type { FieldDescriptor } from './field-detector';

function descriptorFor(html: string, selector = 'input, textarea, select'): FieldDescriptor {
  document.body.innerHTML = html;
  const element = document.body.querySelector(selector) as HTMLElement | null;
  if (!element) throw new Error('No element matched selector');
  const descriptor = describeElement(element);
  if (!descriptor) throw new Error('Element was filtered out');
  return descriptor;
}

function categoryOf(html: string): string {
  return matchField(descriptorFor(html)).category;
}

describe('matchField', () => {
  it('detects a first name from its label', () => {
    expect(categoryOf('<label for="fn">First Name</label><input id="fn" type="text">')).toBe('firstName');
  });

  it('detects last name from a surname label', () => {
    expect(categoryOf('<label for="ln">Surname</label><input id="ln" type="text">')).toBe('lastName');
  });

  it('does not misread "Company Name" as a person name', () => {
    expect(categoryOf('<input id="companyName" name="companyName" type="text">')).toBe('currentCompany');
  });

  it('does not match "headphone" as a phone field', () => {
    expect(categoryOf('<input id="headphone" name="headphone" type="text">')).toBe('unknown');
  });

  it('uses the autocomplete attribute as a strong hint', () => {
    expect(categoryOf('<input autocomplete="postal-code" type="text">')).toBe('zip');
  });

  it('detects email from the input type alone', () => {
    expect(categoryOf('<input type="email">')).toBe('email');
  });

  it('detects a work-authorisation radio group from its fieldset legend', () => {
    const html = `
      <fieldset>
        <legend>Are you authorized to work in the United States?</legend>
        <input type="radio" name="workAuth" value="yes">
      </fieldset>`;
    expect(categoryOf(html, 'input[type="radio"]')).toBe('authorizedToWork');
  });

  it('treats file inputs as the résumé upload', () => {
    expect(categoryOf('<input type="file" id="resume">')).toBe('resumeUpload');
  });

  it('returns unknown for an unlabelled generic field', () => {
    expect(categoryOf('<input id="zz9" name="zz9" type="text">')).toBe('unknown');
  });
});

describe('collectFields', () => {
  it('skips hidden, button and submit inputs', () => {
    document.body.innerHTML = `
      <input type="hidden" name="csrf">
      <button type="submit">Go</button>
      <input type="submit" value="Send">
      <input type="text" name="real">`;
    const fields = collectFields(document, { requireVisible: false });
    expect(fields).toHaveLength(1);
    expect(fields[0].name).toBe('real');
  });

  it('includes textareas and selects', () => {
    document.body.innerHTML = `<textarea name="bio"></textarea><select name="degree"><option>A</option></select>`;
    const fields = collectFields(document, { requireVisible: false });
    expect(fields.map((field) => field.tagName).sort()).toEqual(['SELECT', 'TEXTAREA']);
  });

  it('finds fields inside open shadow roots', () => {
    document.body.innerHTML = '<div id="host"></div>';
    const host = document.getElementById('host')!;
    const shadow = host.attachShadow({ mode: 'open' });
    shadow.innerHTML = '<input name="firstName" id="shadowFirst">';

    const fields = collectFields(document, { requireVisible: false });
    expect(fields).toHaveLength(1);
    expect(fields[0].name).toBe('firstName');
  });
});
