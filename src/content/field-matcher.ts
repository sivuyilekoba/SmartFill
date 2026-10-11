// Scores a FieldDescriptor against the alias dictionary and returns the most
// likely category. Below the confidence threshold we deliberately return
// `unknown` so we never guess at a field we cannot identify.

import type { Category } from '../shared/categories';
import { ALL_CATEGORIES, AUTOCOMPLETE_MAP, CATEGORY_ALIASES } from '../shared/categories';
import { containsPhrase, normalizeText } from '../shared/text';
import type { FieldDescriptor } from './field-detector';

export interface MatchResult {
  category: Category;
  confidence: number;
}

interface Signal {
  text: string;
  weight: number;
  strong: boolean;
}

const THRESHOLD = 0.5;
const CONFIDENCE_SCALE = 14;
const AMBIGUITY_RATIO = 0.9;

function buildSignals(field: FieldDescriptor): Signal[] {
  const signals: Signal[] = [];

  if (field.autocomplete) signals.push({ text: normalizeText(field.autocomplete), weight: 10, strong: true });

  const labelsText = normalizeText(field.labels.join(' '));
  if (labelsText.trim()) signals.push({ text: labelsText, weight: 6, strong: true });

  if (field.ariaLabel) signals.push({ text: normalizeText(field.ariaLabel), weight: 5, strong: true });
  if (field.legend) signals.push({ text: normalizeText(field.legend), weight: 5, strong: true });
  if (field.name) signals.push({ text: normalizeText(field.name), weight: 4, strong: true });
  if (field.id) signals.push({ text: normalizeText(field.id), weight: 4, strong: true });
  if (field.placeholder) signals.push({ text: normalizeText(field.placeholder), weight: 3, strong: false });
  if (field.surroundingText) signals.push({ text: normalizeText(field.surroundingText), weight: 1, strong: false });

  return signals;
}

export function matchField(field: FieldDescriptor): MatchResult {
  // File inputs are always the résumé/document upload.
  if (field.isFile) return { category: 'resumeUpload', confidence: 1 };

  // The autocomplete attribute is a near-perfect hint when present.
  const autoToken = field.autocomplete
    .toLowerCase()
    .split(/\s+/)
    .find((token) => token in AUTOCOMPLETE_MAP);
  if (autoToken) return { category: AUTOCOMPLETE_MAP[autoToken], confidence: 0.95 };

  const signals = buildSignals(field);
  const scores = new Map<Category, number>();

  for (const category of ALL_CATEGORIES) {
    const spec = CATEGORY_ALIASES[category];
    if (!spec) continue;

    let score = 0;
    for (const signal of signals) {
      let specificity = 0;
      for (const alias of spec.positive) {
        if (containsPhrase(signal.text, alias)) {
          specificity = Math.max(specificity, alias.trim().split(/\s+/).length);
        }
      }
      if (specificity > 0) score += signal.weight + specificity * 1.5;
    }
    if (score === 0) continue;

    const vetoed = (spec.negative ?? []).some((negative) =>
      signals.some((signal) => signal.strong && containsPhrase(signal.text, negative))
    );
    if (vetoed) continue;

    scores.set(category, score);
  }

  // Input-type hints.
  const boost = (category: Category, amount: number): void => {
    scores.set(category, (scores.get(category) ?? 0) + amount);
  };
  if (field.type === 'email') boost('email', 8);
  if (field.type === 'tel') boost('phone', 8);
  if (field.type === 'url') boost('website', 3);

  const ranked = [...scores.entries()].sort((a, b) => b[1] - a[1]);
  if (ranked.length === 0) return { category: 'unknown', confidence: 0 };

  const [bestCategory, bestScore] = ranked[0];
  let confidence = Math.min(1, bestScore / CONFIDENCE_SCALE);

  const runnerUp = ranked[1];
  if (runnerUp && runnerUp[1] >= bestScore * AMBIGUITY_RATIO) confidence *= 0.7;

  if (confidence < THRESHOLD) return { category: 'unknown', confidence };
  return { category: bestCategory, confidence };
}
