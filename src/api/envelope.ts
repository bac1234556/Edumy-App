// src/api/envelope.ts
// Helpers to unwrap backend v2 ApiResponse envelopes and represent paged responses.

import { components } from './schema';

export type PageMeta = components['schemas']['PageMeta'];

export interface Page<T> {
  content: T[];
  page: PageMeta;
}

export interface ApiEnvelope<T> {
  success: boolean;
  message?: string | null;
  data: T;
  errors?: unknown;
}

/**
 * Unwraps v2 backend ApiResponse `{ success, message, data, errors }`.
 * Handles falsy valid `data` values (`null`, `0`, `false`, `""`) accurately.
 */
export function unwrap<T>(body: unknown): T {
  if (
    body !== null &&
    typeof body === 'object' &&
    !Array.isArray(body) &&
    'success' in body &&
    'data' in body
  ) {
    return (body as ApiEnvelope<T>).data;
  }
  return body as T;
}
