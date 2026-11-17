---
trigger: glob
globs: "src/api/**, src/features/**/api.ts, src/features/**/hooks.ts"
description: "HTTP client, token refresh, generated types and v2 error handling for Edumy Mobile."
---

# 20 — API client & errors (v2)

Endpoint list and shapes: `@docs/ai/api-contract-v2.md` and `@docs/ai/openapi.json` (never call `/cart/**` or `/orders/**`).

## Client & Envelope
- One axios instance in `src/api/client.ts`, `baseURL = env.apiBaseUrl` (ends with `/api/v1`), JSON, timeout 15 s.
- Response envelope: `{ success: true, message: "OK", data: T, errors: null }`. Always unwrap using `unwrap<T>(response.data)` from `src/api/envelope.ts` (never use `.data || response.data`).
- Generated types: `npm run gen:api` (`openapi-typescript docs/ai/openapi.json -o src/api/schema.d.ts`).
  Use `components['schemas'][...]` in `api.ts`. Never hand-write types for server responses.

## Token refresh — single flight + epoch guard
- On a 401 from any endpoint except `/auth/mobile/*`: if no refresh is running, start ONE
  `POST /auth/mobile/refresh {refreshToken}` recording `epochAtStart = useSessionStore.getState().sessionEpoch`.
- When refresh returns, if `sessionEpoch !== epochAtStart` (e.g., user logged out mid-flight), **do NOT** save tokens and reject with `SESSION_ENDED`.
- Refresh fails with 401 or 403 → remove token, `clearSession()`, trigger `onSessionExpired`.
- Normal 403 errors (e.g., `NOT_ENROLLED`, `FORBIDDEN`) **never** trigger token refresh.
- Requests to `/auth/mobile/*` **never** go through the refresh flow.
- Network/timeout error during refresh → keep tokens and surface retryable network error.

## Error Envelope v2 → `AppError` (`src/api/problem.ts`)
Server error envelope:
```json
{
  "success": false,
  "message": "<Vietnamese user message>",
  "data": null,
  "errors": {
    "code": "UPPER_SNAKE_CODE",
    "fields": { "<field>": "<msg>" },
    "traceId": "<uuid>"
  }
}
```
Convert every failure into `AppError {kind:'problem'|'network'|'timeout'|'unknown', status, code, message, fieldErrors, retryAfterSec, traceId}`:
- `code = body.errors?.code`
- `fieldErrors = body.errors?.fields` (only string entries; **never** put `code` or `traceId` into `fieldErrors`)
- `traceId = body.errors?.traceId`
- `message = body.message` (when string), else fallback by HTTP status.
- 429 → read `Retry-After` header (seconds) into `retryAfterSec`.

## Codes with dedicated actions/UX (otherwise show server `message`)
| Code | UX / Action |
|---|---|
| `AUTH_REFRESH_INVALID` / `AUTH_REFRESH_REUSED` / `AUTH_ACCOUNT_LOCKED` | Clear token/session on restore or refresh → login |
| `EMAIL_RESEND_TOO_SOON` / `RATE_LIMITED` (429) | Disable button + countdown from `retryAfterSec` |
| `CURRENT_PASSWORD_INCORRECT` (422) | Field error on `currentPassword` |
| `NOT_ENROLLED` (403) | Navigate back to course page with notification |
| `PAYOUT_ACCOUNT_REQUIRED` (422) | `confirm` → navigate to `/instructor/payout-account` |
| `WITHDRAWAL_ALREADY_OPEN` (409) | Navigate to `/instructor/withdrawals` |
| `WITHDRAWAL_EXCEEDS_BALANCE` / `WITHDRAWAL_BELOW_MINIMUM` (422) | Inline error under amount input |

## Downloads
Certificate PDF needs the bearer token: on native use `FileSystem.downloadAsync(url, localUri, {headers:{Authorization}})`,
then `Sharing.shareAsync(localUri)`. On web open `verifyUrl` via `WebBrowser.openBrowserAsync`.
