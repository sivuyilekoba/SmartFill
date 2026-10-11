import { afterEach, describe, expect, it, vi } from 'vitest';
import { collectFields } from './field-detector';

function mockRectSizes(): void {
  vi.spyOn(Element.prototype, 'getBoundingClientRect').mockImplementation(function (this: Element) {
    const size = this.getAttribute('data-size') === 'zero' ? 0 : 10;
    return {
      width: size, height: size, top: 0, left: 0, right: size, bottom: size, x: 0, y: 0,
      toJSON: () => ({})
    } as DOMRect;
  });
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe('collectFields visibility filtering', () => {
  it('excludes zero-size (hidden) fields by default', () => {
    mockRectSizes();
    document.body.innerHTML = `
      <input type="text" name="visible">
      <input type="text" name="invisible" data-size="zero">`;

    const fields = collectFields(document);
    expect(fields.map((field) => field.name)).toEqual(['visible']);
  });

  it('can include hidden fields when visibility is not required', () => {
    mockRectSizes();
    document.body.innerHTML = `
      <input type="text" name="visible">
      <input type="text" name="invisible" data-size="zero">`;

    const fields = collectFields(document, { requireVisible: false });
    expect(fields.map((field) => field.name).sort()).toEqual(['invisible', 'visible']);
  });
});
