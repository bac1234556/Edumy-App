---
trigger: model_decision
description: "Apply when working on login, register, logout, token storage, session restore, password or any screen that shows personal or bank data."
---

# 30 — Authentication, session & security (NFR-M01, NFR-M02, BE-01, ADR-002 of the backend)

## Model
- One Edumy account works on web and app. Each login = one independent server session ("refresh-token family").
  Logging out in the app does not log out the web, and vice versa.
- Access token: JWT, ~15 min, kept **in memory only** (Zustand `session.accessToken`).
- Refresh token: opaque string from `/auth/mobile/*` responses, kept **only** in `expo-secure-store`
  (Keychain / Keystore). Key name: `edumy.refreshToken`. Never AsyncStorage, never logs, never Redux devtools.
- Tokens rotate: every refresh returns a new refresh token; save it immediately, the old one is dead.
  Re-using an old refresh token makes the server end the whole session (reuse detection) → user must log in again.

## Endpoints (mobile only — see docs/ai/api-contract.md)
`POST /auth/mobile/register` · `POST /auth/mobile/login` · `POST /auth/mobile/refresh` · `POST /auth/mobile/logout`
→ `{accessToken, expiresAt, refreshToken, refreshExpiresAt}` (logout → 204).
If these endpoints are not deployed yet (backend prompt B01), STOP: do not fall back to the cookie endpoints.

## Flows
1. **App start:** read refresh token → none: `anonymous`. Present: call refresh → success: store tokens, `GET /me`,
   `authenticated`; 401/400: delete token, `anonymous`; network error: keep token, show offline state with "Thử lại".
2. **Login / register:** on success store tokens, `GET /me`, go to tabs. Register already logs in (UC-G05).
3. **Logout:** call `/auth/mobile/logout {refreshToken}`; **whatever the result**, delete the secure-store token,
   clear the query cache (`queryClient.clear()`), reset session, go to login.
4. **Session ended elsewhere** (password changed on web, account locked by admin): the next refresh fails →
   same cleanup as logout, then a short message "Phiên đăng nhập đã kết thúc, vui lòng đăng nhập lại".
5. **Forgot password:** `POST /auth/password/forgot {email}` → always show the same message
   ("Nếu email tồn tại, hướng dẫn đã được gửi"). Resetting happens through the email link on the website.
6. **Email verification:** the link in the email opens the website. In the app: banner + "Gửi lại thư"
   (`POST /auth/email-verification/resend`, 429 → countdown). Re-read `GET /me` when the app returns to foreground.
7. **Change password:** `PUT /me/password {currentPassword,newPassword}` — the current app session stays valid,
   all other sessions (web included) end.

## Password policy (mirror the server, server still decides)
8–72 characters, at least one letter and one digit; new ≠ current. Use a zod schema in `features/auth/logic.ts`.

## Never
- Log request/response bodies of auth, profile, payout-account or withdrawal endpoints.
- Show a full bank account number (only `•••• 1234`).
- Put tokens in URLs, deep links, analytics, or error reports.
- Implement "remember password". Biometric unlock is out of scope unless a prompt asks for it.
