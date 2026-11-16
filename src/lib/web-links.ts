// src/lib/web-links.ts
// Direct website links for actions requiring web browser interaction (UC-M01).

import { ENV } from '../config/env';

export const webLinks = {
  course: (slug: string) => `${ENV.WEB_BASE_URL}/courses/${encodeURIComponent(slug)}`,
  order: (orderCode: string) => `${ENV.WEB_BASE_URL}/orders/${encodeURIComponent(orderCode)}`,
  certificate: (code: string) => `${ENV.WEB_BASE_URL}/certificates/${encodeURIComponent(code)}`,
  cart: () => `${ENV.WEB_BASE_URL}/cart`,
} as const;
