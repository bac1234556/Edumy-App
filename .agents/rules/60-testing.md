---
trigger: glob
globs: "**/*.test.ts, **/*.test.tsx, jest.config.*, package.json"
description: "Testing rules for Edumy Mobile (jest-expo + Testing Library)."
---

# 60 — Testing (NFR-M10)

- Runner: `jest-expo` preset; UI: `@testing-library/react-native`. Tests live next to the code: `logic.test.ts`,
  `Component.test.tsx`.
- Mock the network at the feature `api.ts` boundary (jest.mock of the module) or with a fake axios adapter in
  `src/api/client.test.ts`. Never call the real backend from unit tests.
- **Must-have tests:**
  - `resolveCourseAction` — every row of the D-M02 table, including anonymous + paid and instructor + owned.
  - `formatVnd`, `formatDate*` — rounding, zero, large values, the Vietnam time zone at a month boundary.
  - `problem.ts` — ProblemDetail with/without `errors[]`, 429 with `Retry-After`, network error, timeout.
  - Token refresh — 5 parallel 401s → exactly one refresh call, all 5 retried; refresh 401 → session cleared;
    network error during refresh → tokens kept.
  - Withdrawal form validation — below 100.000 đ, above available, non-integer, empty.
  - Instructor tab visibility (D-M01) — role only, earnings only, both, neither.
  - Cart reason labels and "no checkout button" (query by text must not find "Thanh toán" as a button).
- Before finishing any task run: `npx tsc --noEmit`, `npm run lint`, `npm test` and paste the summary lines.
- Never disable, skip or weaken a test to make a task pass.
