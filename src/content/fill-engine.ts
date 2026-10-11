// Applies values to form controls in a way that modern frameworks notice:
// we call the *native* prototype value setter (so React's value tracker and
// Vue/Angular's internal bindings register the change) and dispatch real input
// events, then respect the element's HTML constraints.

import { normalizeText } from '../shared/text';
import { getLabelStrings } from './field-detector';

export type FillStatus = 'filled' | 'skipped' | 'failed';

export function setNativeValue(element: HTMLElement, value: string): void {
  let prototype: object = HTMLInputElement.prototype;
  if (element instanceof HTMLTextAreaElement) prototype = HTMLTextAreaElement.prototype;
  else if (element instanceof HTMLSelectElement) prototype = HTMLSelectElement.prototype;

  const descriptor = Object.getOwnPropertyDescriptor(prototype, 'value');
  if (descriptor?.set) descriptor.set.call(element, value);
  else (element as HTMLInputElement).value = value;
}

export function dispatchInputEvents(element: HTMLElement, value: string): void {
  element.dispatchEvent(new Event('focus', { bubbles: true }));

  try {
    element.dispatchEvent(new InputEvent('input', { bubbles: true, data: value }));
  } catch {
    element.dispatchEvent(new Event('input', { bubbles: true }));
  }

  element.dispatchEvent(new Event('change', { bubbles: true }));
  element.dispatchEvent(new Event('blur', { bubbles: true }));
}

function fillTextInput(element: HTMLElement, value: string | boolean): FillStatus {
  let text = typeof value === 'boolean' ? (value ? 'Yes' : 'No') : value;
  if (!text) return 'skipped';

  const maxLength = (element as HTMLInputElement).maxLength;
  if (typeof maxLength === 'number' && maxLength > 0 && text.length > maxLength) {
    text = text.slice(0, maxLength);
  }

  if (element instanceof HTMLInputElement && element.type === 'number') {
    const parsed = Number(text);
    if (Number.isFinite(parsed)) {
      let numeric = parsed;
      const min = element.min !== '' ? Number(element.min) : NaN;
      const max = element.max !== '' ? Number(element.max) : NaN;
      if (Number.isFinite(min)) numeric = Math.max(min, numeric);
      if (Number.isFinite(max)) numeric = Math.min(max, numeric);
      text = String(numeric);
    }
  }

  const pattern = element.getAttribute('pattern');
  if (pattern) {
    try {
      if (!new RegExp(`^(?:${pattern})$`).test(text)) return 'skipped';
    } catch {
      // Malformed pattern attribute - ignore rather than block the fill.
    }
  }

  setNativeValue(element, text);
  dispatchInputEvents(element, text);
  return 'filled';
}

function fillSelect(select: HTMLSelectElement, value: string | boolean): FillStatus {
  const options = Array.from(select.options).filter((option) => !option.disabled);
  if (options.length === 0) return 'skipped';

  const intent = typeof value === 'boolean' ? (value ? 'yes' : 'no') : value;
  const wanted = normalizeText(intent);
  if (!wanted.trim()) return 'skipped';

  const chosen =
    options.find((option) => option.value && normalizeText(option.value) === wanted) ??
    options.find((option) => normalizeText(option.textContent ?? '') === wanted) ??
    options.find((option) => normalizeText(`${option.textContent ?? ''} ${option.value}`).includes(wanted));

  if (!chosen) return 'skipped';

  select.value = chosen.value;
  select.dispatchEvent(new Event('input', { bubbles: true }));
  select.dispatchEvent(new Event('change', { bubbles: true }));
  return 'filled';
}

function radioText(radio: HTMLInputElement): string {
  return normalizeText(`${getLabelStrings(radio).join(' ')} ${radio.value}`);
}

function fillRadioGroup(radio: HTMLInputElement, value: string | boolean): FillStatus {
  // Radios sharing a name form one logical group. Search the whole form/document
  // for them; only fall back to the nearest container when the radios are unnamed.
  let group: HTMLInputElement[];

  if (radio.name) {
    const root: ParentNode = radio.form ?? radio.ownerDocument;
    group = Array.from(root.querySelectorAll<HTMLInputElement>('input[type="radio"]')).filter(
      (candidate) => candidate.name === radio.name && !candidate.disabled
    );
  } else {
    const scope: ParentNode = radio.closest('fieldset') ?? radio.parentElement ?? radio.ownerDocument;
    group = Array.from(scope.querySelectorAll<HTMLInputElement>('input[type="radio"]')).filter(
      (candidate) => !candidate.name && !candidate.disabled
    );
  }

  if (group.length === 0) return 'skipped';

  const intent = typeof value === 'boolean' ? (value ? 'yes' : 'no') : value;
  const wanted = normalizeText(intent);

  const chosen = group.find((candidate) => radioText(candidate).includes(wanted));
  if (!chosen) return 'skipped';

  chosen.checked = true;
  chosen.dispatchEvent(new Event('input', { bubbles: true }));
  chosen.dispatchEvent(new Event('change', { bubbles: true }));
  return 'filled';
}

function fillCheckbox(checkbox: HTMLInputElement, value: string | boolean): FillStatus {
  const shouldCheck = value === true || value === 'true' || value === 'yes';
  // We only ever *check* boxes. Randomly un-checking a consent box is harmful,
  // and leaving an unchecked box untouched is the safe default.
  if (!shouldCheck) return 'skipped';

  if (!checkbox.checked) {
    checkbox.checked = true;
    checkbox.dispatchEvent(new Event('input', { bubbles: true }));
    checkbox.dispatchEvent(new Event('change', { bubbles: true }));
  }
  return 'filled';
}

function fillContentEditable(element: HTMLElement, value: string | boolean): FillStatus {
  const text = typeof value === 'boolean' ? (value ? 'Yes' : 'No') : value;
  if (!text) return 'skipped';

  element.focus();
  element.textContent = text;
  try {
    element.dispatchEvent(new InputEvent('input', { bubbles: true, data: text }));
  } catch {
    element.dispatchEvent(new Event('input', { bubbles: true }));
  }
  element.dispatchEvent(new Event('change', { bubbles: true }));
  element.blur();
  return 'filled';
}

export function fillElement(element: HTMLElement, value: string | boolean): FillStatus {
  if (element instanceof HTMLSelectElement) return fillSelect(element, value);

  if (element instanceof HTMLInputElement) {
    if (element.type === 'file') return 'skipped';
    if (element.type === 'radio') return fillRadioGroup(element, value);
    if (element.type === 'checkbox') return fillCheckbox(element, value);
    return fillTextInput(element, value);
  }

  if (element instanceof HTMLTextAreaElement) return fillTextInput(element, value);
  if (element.isContentEditable) return fillContentEditable(element, value);

  return 'skipped';
}
