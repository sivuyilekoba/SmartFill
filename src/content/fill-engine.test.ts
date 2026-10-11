import { beforeEach, describe, expect, it } from 'vitest';
import { fillElement } from './fill-engine';

beforeEach(() => {
  document.body.innerHTML = '';
});

describe('fillElement', () => {
  it('fills a text input and dispatches input/change events', () => {
    const input = document.createElement('input');
    document.body.appendChild(input);

    const seen: string[] = [];
    input.addEventListener('input', () => seen.push('input'));
    input.addEventListener('change', () => seen.push('change'));

    expect(fillElement(input, 'Grace Hopper')).toBe('filled');
    expect(input.value).toBe('Grace Hopper');
    expect(seen).toContain('input');
    expect(seen).toContain('change');
  });

  it('truncates values that exceed maxlength', () => {
    const input = document.createElement('input');
    input.maxLength = 4;
    document.body.appendChild(input);

    expect(fillElement(input, 'abcdefgh')).toBe('filled');
    expect(input.value).toBe('abcd');
  });

  it('never writes to file inputs', () => {
    const input = document.createElement('input');
    input.type = 'file';
    document.body.appendChild(input);

    expect(fillElement(input, 'C:/resume.pdf')).toBe('skipped');
    expect(input.value).toBe('');
  });

  it('selects the option whose text matches the intended value', () => {
    const select = document.createElement('select');
    select.innerHTML = '<option value="">Select</option><option value="1">Yes</option><option value="0">No</option>';
    document.body.appendChild(select);

    expect(fillElement(select, 'yes')).toBe('filled');
    expect(select.value).toBe('1');
  });

  it('checks a checkbox when the value is true', () => {
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    document.body.appendChild(checkbox);

    expect(fillElement(checkbox, true)).toBe('filled');
    expect(checkbox.checked).toBe(true);
  });

  it('leaves a checkbox untouched when the value is false', () => {
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.checked = true;
    document.body.appendChild(checkbox);

    expect(fillElement(checkbox, false)).toBe('skipped');
    expect(checkbox.checked).toBe(true);
  });

  it('picks the radio whose label matches the answer', () => {
    document.body.innerHTML = `
      <label><input type="radio" name="auth" value="yes"> Yes</label>
      <label><input type="radio" name="auth" value="no"> No</label>`;
    const radios = document.querySelectorAll<HTMLInputElement>('input[type="radio"]');

    expect(fillElement(radios[0], false)).toBe('filled');
    expect(radios[1].checked).toBe(true);
    expect(radios[0].checked).toBe(false);
  });

  it('skips a value that violates the pattern attribute', () => {
    const input = document.createElement('input');
    input.setAttribute('pattern', '[0-9]{5}');
    document.body.appendChild(input);

    expect(fillElement(input, 'abc')).toBe('skipped');
    expect(fillElement(input, '12345')).toBe('filled');
  });
});
