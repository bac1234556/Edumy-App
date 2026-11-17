// src/lib/web-links.ts
// Direct website links for actions handled in the web browser.

import { ENV } from '../config/env';

export const webLinks = {
  course: (id: number) => `${ENV.WEB_BASE_URL}/courses/${id}`,
  certificateVerify: (code: string) =>
    `${ENV.WEB_BASE_URL}/certificates/verify/${encodeURIComponent(code)}`,
} as const;
