// Typed contracts for messages exchanged between the popup / background / options
// pages and the injected content script.

import type { Category } from './categories';

export interface DetectedFieldSummary {
  category: Category;
  confidence: number;
  label: string;
}

export interface FillOutcome {
  category: Category;
  label: string;
  status: 'filled' | 'skipped' | 'failed';
  reason?: string;
}

export interface FillReport {
  filled: number;
  skipped: number;
  failed: number;
  total: number;
  outcomes: FillOutcome[];
}

export type Message =
  | { type: 'smartfill:ping' }
  | { type: 'smartfill:detect' }
  | { type: 'smartfill:fill'; mode: 'dummy' | 'profile'; profileId?: string | null }
  | { type: 'smartfill:clear' }
  | { type: 'smartfill:revert' };

export type MessageResponse =
  | { ok: true }
  | { ok: true; detected: DetectedFieldSummary[] }
  | { ok: true; report: FillReport }
  | { ok: true; reverted: number; cleared?: number }
  | { ok: false; error: string };

export interface FillMessage {
  type: 'smartfill:fill';
  mode: 'dummy' | 'profile';
  profileId?: string | null;
}
