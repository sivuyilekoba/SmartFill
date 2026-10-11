// Walks the page (including shadow roots and same-origin iframes) and turns each
// candidate form control into a rich FieldDescriptor that the matcher can score.

export interface FieldOption {
  value: string;
  text: string;
}

export interface FieldDescriptor {
  element: HTMLElement;
  tagName: string;
  type: string;
  name: string;
  id: string;
  autocomplete: string;
  placeholder: string;
  ariaLabel: string;
  labels: string[];
  legend: string;
  surroundingText: string;
  precedingText: string;
  required: boolean;
  maxLength: number | null;
  min: string;
  max: string;
  step: string;
  pattern: string;
  options: FieldOption[];
  isFile: boolean;
  isVisible: boolean;
  /** Best human-readable name, used in the fill report. */
  label: string;
}

const SKIP_INPUT_TYPES = new Set(['button', 'submit', 'reset', 'hidden', 'image']);
const FILLABLE_SELECTOR = 'input, textarea, select, [contenteditable="true"]';

/** Collect the text of every label associated with an element. */
export function getLabelStrings(el: HTMLElement): string[] {
  const doc = el.ownerDocument;
  const texts: string[] = [];
  if (!doc) return texts;

  if (el.id) {
    doc.querySelectorAll('label').forEach((label) => {
      const htmlFor = (label as HTMLLabelElement).htmlFor;
      if (htmlFor && htmlFor === el.id) texts.push(label.textContent ?? '');
    });
  }

  const wrapping = el.closest('label');
  if (wrapping) texts.push(wrapping.textContent ?? '');

  const ariaLabelledBy = el.getAttribute('aria-labelledby');
  if (ariaLabelledBy) {
    ariaLabelledBy.split(/\s+/).forEach((id) => {
      const target = doc.getElementById(id);
      if (target) texts.push(target.textContent ?? '');
    });
  }

  return texts.map((t) => t.replace(/\s+/g, ' ').trim()).filter(Boolean);
}

export function getLegendText(el: HTMLElement): string {
  const fieldset = el.closest('fieldset');
  const legend = fieldset?.querySelector('legend');
  return (legend?.textContent ?? '').replace(/\s+/g, ' ').trim();
}

const LABEL_LIKE_TAGS = new Set(['LABEL', 'SPAN', 'DIV', 'P', 'B', 'STRONG', 'H1', 'H2', 'H3', 'H4', 'TD', 'TH', 'DT', 'LI']);

/**
 * Text of the nearest preceding element when it looks like a field label.
 * Many ATS layouts (`<div><label>Name</label><input></div>` without `for`) rely
 * on this instead of a proper label association.
 */
function getPrecedingText(el: HTMLElement): string {
  let sibling = el.previousElementSibling;
  while (sibling && !(sibling.textContent ?? '').trim()) sibling = sibling.previousElementSibling;
  if (!sibling || !LABEL_LIKE_TAGS.has(sibling.tagName)) return '';
  return (sibling.textContent ?? '').replace(/\s+/g, ' ').trim().slice(0, 60);
}

/** Text in the field's immediate wrapper, with controls stripped out. */
function getSurroundingText(el: HTMLElement): string {
  let parentText = '';
  const parent = el.parentElement;
  if (parent && (parent.textContent ?? '').length < 400) {
    const clone = parent.cloneNode(true) as HTMLElement;
    clone
      .querySelectorAll('input, textarea, select, label, button, script, style')
      .forEach((node) => node.remove());
    parentText = (clone.textContent ?? '').replace(/\s+/g, ' ').trim();
  }

  return parentText.slice(0, 160);
}

/**
 * Visibility check that works for `position: fixed` elements (unlike the old
 * `offsetParent` test) and correctly rejects `display:none` / `visibility:hidden`.
 */
export function isVisible(el: HTMLElement): boolean {
  const rect = el.getBoundingClientRect();
  const hasBox = rect.width > 0 || rect.height > 0;

  const withCheck = el as HTMLElement & { checkVisibility?: (options?: object) => boolean };
  if (typeof withCheck.checkVisibility === 'function') {
    try {
      return hasBox && withCheck.checkVisibility({ checkOpacity: true, checkVisibilityCSS: true });
    } catch {
      // Older Chromium signatures - fall through to the computed-style check.
    }
  }

  if (!hasBox) return false;
  const style = el.ownerDocument.defaultView?.getComputedStyle(el);
  if (!style) return true;
  return style.display !== 'none' && style.visibility !== 'hidden' && style.opacity !== '0';
}

export function describeElement(el: HTMLElement): FieldDescriptor | null {
  const tagName = el.tagName;

  if (tagName === 'INPUT') {
    const input = el as HTMLInputElement;
    const type = (input.type || 'text').toLowerCase();
    if (SKIP_INPUT_TYPES.has(type)) return null;
  }

  const labels = getLabelStrings(el);
  const ariaLabel = (el.getAttribute('aria-label') ?? '').trim();
  const placeholder = (el.getAttribute('placeholder') ?? '').trim();
  const legend = getLegendText(el);
  const surroundingText = getSurroundingText(el);
  const precedingText = getPrecedingText(el);
  const isFile = tagName === 'INPUT' && (el as HTMLInputElement).type === 'file';

  const options: FieldOption[] =
    el instanceof HTMLSelectElement
      ? Array.from(el.options).map((option) => ({
          value: option.value,
          text: (option.textContent ?? '').trim()
        }))
      : [];

  const type = tagName === 'INPUT' ? ((el as HTMLInputElement).type || 'text').toLowerCase() : '';
  const name = el.getAttribute('name') ?? '';
  const id = el.id ?? '';
  const autocomplete = el.getAttribute('autocomplete') ?? '';

  const rawMaxLength = (el as HTMLInputElement).maxLength;
  const maxLength = typeof rawMaxLength === 'number' && rawMaxLength > 0 ? rawMaxLength : null;

  const label =
    labels[0] || ariaLabel || placeholder || legend || name || id || tagName.toLowerCase();

  return {
    element: el,
    tagName,
    type,
    name,
    id,
    autocomplete,
    placeholder,
    ariaLabel,
    labels,
    legend,
    surroundingText,
    precedingText,
    required: el.hasAttribute('required') || el.getAttribute('aria-required') === 'true',
    maxLength,
    min: el.getAttribute('min') ?? '',
    max: el.getAttribute('max') ?? '',
    step: el.getAttribute('step') ?? '',
    pattern: el.getAttribute('pattern') ?? '',
    options,
    isFile,
    isVisible: isVisible(el),
    label
  };
}

function walk(node: ParentNode, out: HTMLElement[]): void {
  node.querySelectorAll<HTMLElement>(FILLABLE_SELECTOR).forEach((el) => out.push(el));

  node.querySelectorAll<HTMLElement>('*').forEach((el) => {
    const shadow = el.shadowRoot;
    if (shadow) walk(shadow, out);
  });

  node.querySelectorAll<HTMLIFrameElement>('iframe').forEach((frame) => {
    try {
      const doc = frame.contentDocument;
      if (doc) walk(doc, out);
    } catch {
      // Cross-origin frame - not accessible, skip.
    }
  });
}

export interface CollectOptions {
  requireVisible?: boolean;
}

export function collectFields(root: ParentNode = document, options: CollectOptions = {}): FieldDescriptor[] {
  const requireVisible = options.requireVisible ?? true;

  const elements: HTMLElement[] = [];
  walk(root, elements);

  const seen = new Set<HTMLElement>();
  const result: FieldDescriptor[] = [];

  for (const el of elements) {
    if (seen.has(el)) continue;
    seen.add(el);

    const descriptor = describeElement(el);
    if (!descriptor) continue;
    if (requireVisible && !descriptor.isVisible) continue;
    result.push(descriptor);
  }

  return result;
}
