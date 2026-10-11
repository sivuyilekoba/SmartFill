// Shared text normalisation used by the field matcher.
//
// We turn any raw hint (attribute value, label text, placeholder...) into a
// padded, lowercase, token stream such as " first name " so that phrase lookups
// can use plain substring checks without false positives like "headphone"
// matching "phone" (its token stream is " headphone ", which does not contain
// " phone ").

const ABBREVIATIONS: Record<string, string> = {
  fname: 'first name',
  lname: 'last name',
  mname: 'middle name',
  surname: 'surname',
  addr: 'address',
  add1: 'address 1',
  add2: 'address 2',
  dob: 'date of birth',
  tel: 'phone',
  mob: 'mobile',
  org: 'organization',
  yrs: 'years',
  yr: 'year',
  exp: 'experience',
  univ: 'university'
};

/**
 * Normalise a raw hint string into a padded space-delimited token stream.
 * CamelCase, snake_case, kebab-case and punctuation are all handled.
 */
export function normalizeText(input: string | null | undefined): string {
  if (!input) return ' ';

  // Split camelCase / PascalCase before lower-casing.
  let value = input.replace(/([a-z0-9])([A-Z])/g, '$1 $2');
  value = value.replace(/[^A-Za-z0-9]+/g, ' ').toLowerCase().trim();

  if (!value) return ' ';

  const tokens = value
    .split(/\s+/)
    .flatMap((token) => (ABBREVIATIONS[token] ?? token).split(' '));

  return ` ${tokens.join(' ')} `;
}

/** True when the (already normalised) haystack contains the given phrase. */
export function containsPhrase(haystack: string, phrase: string): boolean {
  return haystack.includes(normalizeText(phrase));
}
