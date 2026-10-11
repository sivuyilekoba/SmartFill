# SmartFill — Job Application Autofill

A Chrome extension (Manifest V3) that dynamically detects form fields on job
application pages and fills them with either **your saved profile** or **realistic
placeholder data** — so you stop re-typing the same details after uploading your résumé.

## Features

- **Any site** — works on Workday, Greenhouse, Lever, iCIMS and plain HTML forms alike.
- **Smart detection** — scores every field against label, `aria-label`, `autocomplete`,
  `name`/`id`, placeholder, `<fieldset>` legend and surrounding text.
- **Skips instead of guessing** — fields it cannot confidently identify are left alone
  and listed in the fill report.
- **Framework-safe** — uses native value setters and real `input` events, so React, Vue
  and Angular forms actually register the values.
- **Profile mode** — personal details, links, work authorisation, employment, education,
  EEO and long answers, with support for **multiple profiles**.
- **Dummy mode** — plausible, clearly fictional data (example.com emails, 555 phone numbers).
- **Safety first** — never fills file inputs, captchas, or sensitive fields like SSN/card numbers.
- **Undo** — one click restores the values that were on the page before filling.
- **Shortcut + context menu** — `Alt+Shift+F` or right-click → *SmartFill: fill this form*.

## Install (development build)

```bash
npm install
npm run icons      # generate PNG icons (already committed)
npm run build      # outputs dist/
```

Then in Chrome: `chrome://extensions` → enable **Developer mode** → **Load unpacked** →
select the `dist/` folder.

## Development

```bash
npm run dev        # Vite dev server for the popup/options pages
npm run build      # production build into dist/
npm run typecheck  # tsc --noEmit
npm test           # Vitest unit tests
```

## Project structure

```
src/
  content/
    field-detector.ts   DOM walk (shadow roots + same-origin iframes) → rich descriptors
    field-matcher.ts    weighted scoring → { category, confidence }
    fill-engine.ts      framework-safe value writing, constraints, undo primitives
    index.ts            message listener / entry point
  shared/
    categories.ts       category catalogue + alias dictionary
    profile.ts          profile schema, storage, migration, value mapping
    generators.ts       plausible random values per category
    inject.ts           on-demand content-script injection
    messaging.ts        typed message contracts
    text.ts             normalisation + phrase matching
  popup/                popup UI
  options/              profile editor UI
  background/           service worker (context menu + commands)
```

## Permissions & privacy

| Permission | Why |
| --- | --- |
| `activeTab` | Reads the current page **only after you click** the extension or use the shortcut. |
| `scripting` | Injects the fill engine into that tab on demand. |
| `storage` | Saves your profiles locally. |
| `contextMenus` | Adds the right-click "fill this form" entry. |

SmartFill makes **no network requests**. Your profile never leaves your browser — see
[PRIVACY.md](PRIVACY.md).

## Known limitations

- **Résumé uploads cannot be automated** — browsers block setting `<input type="file">`
  programmatically. SmartFill highlights the field so you can attach the file, then fills
  the rest.
- Cross-origin iframes and closed shadow roots are not reachable.
- Captchas are always skipped.

## Migration from v1

On first run the extension migrates your old details (`firstName`, `lastName`, `email`,
`phone`) into a new profile automatically.

The original v1 sources are kept in [`legacy/`](legacy) for reference.
