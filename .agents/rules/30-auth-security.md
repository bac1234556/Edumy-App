---
trigger: model_decision
description: "Apply when working on login, register, logout, token storage, session restore, password or any screen that shows personal or bank data."
---

# 30 — Authentication, session & security

## Model
- One Edumy account works on web and app. Each mobile login = one independent refresh-token family.
- Access token: JWT, kept **in memory only** (Zustand `session.accessToken`).
- Refresh token: opaque string from `/auth/mobile/*` responses, stored via platform adapter `src/api/tokens.ts`:
  - **Native (Android/iOS):** `expo-secure-store` (`edumy.refreshToken`).
  - **Web:** **in-memory only** (never `localStorage`, never `AsyncStorage`). Page reload on web requires signing in again.
- Tokens rotate: every refresh returns a new refresh token; reuse ends the session family.

## Endpoints (mobile only — see `docs/ai/api-contract-v2.md`)
`POST /auth/mobile/register` · `POST /auth/mobile/login` · `POST /auth/mobile/refresh` · `POST /auth/mobile/logout`
· `POST /auth/forgot-password` · `POST /auth/verification-email/resend`.
Never fall back to cookie endpoints.

## Flows
1. **App start (`useRestoreSession`):**
   - Read refresh token → none: `clearSession()` (`unauthenticated`).
   - Present: call `refresh` → save rotated refresh token → call `GET /me` → `setSession`.
   - Delete token ONLY when server responds `401` with `AUTH_REFRESH_INVALID`/`AUTH_REFRESH_REUSED` or `403` with `AUTH_ACCOUNT_LOCKED`.
   - On network error or timeout → **keep token** and enter `offline` status with banner "Không kết nối được máy chủ" + "Thử lại" button.
2. **Login / register:** on success store refresh token, fetch `/me`, `setSession`, go to tabs.
3. **Logout (`useLogout`):** exact order:
   1. Read refresh token.
   2. `clearSession()` immediately (increments `sessionEpoch`).
   3. `await queryClient.cancelQueries()`.
   4. `queryClient.clear()`.
   5. `await removeRefreshToken()`.
   6. Best-effort `POST /auth/mobile/logout {refreshToken}` with timeout (ignore failures).
   7. `router.replace('/(auth)/login')`.
4. **Session expired (`onSessionExpired`):** root layout clears TanStack Query cache, navigates to `/(auth)/login`, and calls `notify('Phiên đăng nhập đã hết hạn', ...)`.
5. **Forgot password:** `POST /auth/forgot-password {email}`.
6. **Email verification:** banner shown when `me.emailVerified === false`. Resend calls `POST /auth/verification-email/resend` (429 → `Retry-After` countdown). Re-read `GET /me` on foreground.
7. **Change password:** `PUT /me/password {currentPassword, newPassword}` revokes **all** refresh tokens across devices → show `notify('Đã đổi mật khẩu', 'Vui lòng đăng nhập lại trên mọi thiết bị.')` and execute the full logout flow. Map `CURRENT_PASSWORD_INCORRECT` to `currentPassword` field error.

## Password policy
8–72 characters, at least one letter and one digit; new ≠ current.

## Never
- Log request/response bodies of auth, profile, payout-account or withdrawal endpoints.
- Show a full bank account number (only `•••• 1234`).
- Put tokens in URLs, deep links, analytics, `localStorage`, `AsyncStorage`, or error reports.
