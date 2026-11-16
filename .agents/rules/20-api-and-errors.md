---
trigger: glob
globs: "src/api/**, src/features/**/api.ts, src/features/**/hooks.ts"
description: "HTTP client, token refresh, generated types and RFC 9457 error handling for Edumy Mobile."
---

# 20 — API client & errors

Endpoint list and shapes: @docs/ai/api-contract.md (read it; never call an endpoint that is not listed there).

## Client
- One axios instance in `src/api/client.ts`, `baseURL = env.apiBaseUrl` (ends with `/api/v1`), JSON, timeout 15 s.
- Request interceptor adds `Authorization: Bearer <accessToken>` when a session exists.
- Generated types: `npx openapi-typescript <API_ORIGIN>/v3/api-docs -o src/api/schema.d.ts` (backend in `dev` profile).
  Use `components['schemas'][...]` types in `api.ts`. If a needed schema is missing from OpenAPI → STOP and ask.

## Token refresh (NFR-M02) — single flight
- On a 401 from any endpoint except `/auth/mobile/*`: if no refresh is running, start ONE
  `POST /auth/mobile/refresh {refreshToken}`; all other 401 requests wait for that same promise, then retry once
  with the new access token.
- Refresh fails (401/400) → clear secure store + session, navigate to login. Network error during refresh → keep
  tokens, surface a retryable network error (do not log the user out because of airplane mode).
- A request is retried at most once (flag on the config) — no refresh loops.
- Store the new refresh token from every refresh response (tokens rotate; the old one becomes invalid).

## ProblemDetail → AppError (`src/api/problem.ts`)
Server errors look like `{type,title,status,detail,code,traceId,errors?:[{field,message}]}`.
Convert every failure into `AppError {kind:'problem'|'network'|'timeout', status, code, message, fieldErrors, retryAfterSec, traceId}`.
- `message` = server `detail` (Vietnamese) when present, else a generic Vietnamese text by status.
- `fieldErrors` = `errors[]` → react-hook-form `setError(field, …)`.
- 429 → read `Retry-After` header (seconds) into `retryAfterSec`; disable the action and show a countdown.
- Show `traceId` only in a small "Mã lỗi" line on generic error screens (helps backend debugging).

## Codes with dedicated UX (do not show a generic toast)
| Code | UX |
|---|---|
| `UNAUTHENTICATED` | refresh flow / back to login |
| `AUTH_INVALID_CREDENTIALS` | "Email hoặc mật khẩu không đúng" under the form |
| `AUTH_ACCOUNT_LOCKED` | blocking message: account locked, contact support |
| `AUTH_LOGIN_TEMPORARILY_BLOCKED` | countdown from `Retry-After` |
| `EMAIL_ALREADY_REGISTERED` | field error on `email` |
| `TOKEN_RESEND_TOO_SOON` / `RATE_LIMITED` | countdown from `Retry-After` |
| `ENROLLMENT_REQUIRED` | navigate to the course page |
| `RESOURCE_NOT_FOUND` | "Không tìm thấy" screen (never reveal more) |
| `CART_COURSE_FREE` | offer "Ghi danh miễn phí" instead |
| `CART_COURSE_ALREADY_OWNED` | offer "Vào học" |
| `CART_OWN_COURSE`, `ENROLLMENT_OWN_COURSE` | "Bạn là giảng viên của khóa học này" |
| `CART_ITEM_DUPLICATE` | refresh cart, show "Đã có trong giỏ" |
| `REVIEW_HIDDEN_BY_ADMIN`, `QA_CONTENT_HIDDEN_BY_ADMIN` | read-only state, explain it was hidden by an admin |
| `QA_QUESTION_DUPLICATE` | "Bạn vừa gửi câu hỏi này" |
| `WITHDRAWAL_BELOW_MINIMUM`, `WITHDRAWAL_EXCEEDS_BALANCE`, `PAYOUT_ACCOUNT_REQUIRED`, `WITHDRAWAL_ALREADY_OPEN` | form-level messages (UC-I27 E1–E4) |
| `SERVICE_UNAVAILABLE` (503) | retryable error state |

## Downloads
Certificate PDF needs the bearer token: use `FileSystem.downloadAsync(url, localUri, {headers:{Authorization}})`,
then `Sharing.shareAsync(localUri)`. Delete old files in the cache directory; never keep PDFs in documents.
