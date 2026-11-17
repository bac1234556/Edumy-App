---
trigger: glob
globs: "**/*.test.ts, **/*.test.tsx, jest.config.*, package.json"
description: "Testing rules for Edumy Mobile (jest-expo + Testing Library)."
---

# 60 — Testing

- Runner: `jest-expo` preset; UI: `@testing-library/react-native`. Tests live next to code: `logic.test.ts`, `*.test.ts(x)`.
- Mock the network at `api.ts` or with `axios-mock-adapter` in `src/api/__tests__/`. Never call the real backend from unit tests.
- **Must-have tests:**
  - `parseAppError` (`src/api/__tests__/problem.test.ts`) — real v2 server payloads (`AUTH_INVALID_CREDENTIALS`, `VALIDATION_ERROR` with `fields`, `WITHDRAWAL_EXCEEDS_BALANCE`, 500, 429 `Retry-After`, network, timeout; never leak `code`/`traceId` into `fieldErrors`).
  - `client.ts` — single-flight 401 refresh, logout mid-refresh (`sessionEpoch` guard prevents saving rotated tokens), refresh 401/403 triggers `onSessionExpired`, network error keeps tokens.
  - `useRestoreSession` — network error keeps refresh token (`offline`), 401 `AUTH_REFRESH_REUSED` deletes token.
  - `dialog.ts` — `confirm` on web calls `window.confirm`.
  - `resolveCourseAction` — paid (logged-in/anon → `BUY_ON_WEB`), free (anon → `LOGIN_TO_ENROLL`, logged-in → `FREE_ENROLL`), owned (`OPEN_LEARNING`), instructor (`null`).
  - `shouldShowInstructorTab` — `INSTRUCTOR` role (case-insensitive), `hasEarnings: true`, both, neither.
  - BR-PAY-HOLD formatter (`holdDays: 0`, `holdDays: 7`, `nextMaturityAt`) & withdrawal error code handling (`PAYOUT_ACCOUNT_REQUIRED`, `WITHDRAWAL_ALREADY_OPEN`, `WITHDRAWAL_EXCEEDS_BALANCE`, `WITHDRAWAL_BELOW_MINIMUM`).
  - `formatVnd`, `formatDate*`, `webLinks`.
- Before finishing any phase run: `npx tsc --noEmit`, `npm run lint`, `npm test` and paste the summary lines.
- Never disable, skip or weaken a test to make a task pass.
