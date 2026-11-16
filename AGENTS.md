# AGENTS.md — Edumy Mobile (React Native)

> Always-on rules for every AI agent working in this repo (Antigravity, Claude Code, Cursor…).
> Keep this file short. Topic rules live in `.agents/rules/` (loaded on demand). Read them BEFORE writing code.

## 1. Project in one paragraph
Edumy Mobile is the React Native app of **Edumy**, an online-course marketplace. It is a **client of the existing
Edumy backend** (Spring Boot, REST `/api/v1`) and shares the **same accounts and data** as the Edumy web SPA:
a course bought on the web appears in the app, progress made in the app appears on the web.
The app serves **students** (browse, free enrol, learn, Q&A, reviews, certificates, cart without checkout, order
history) and an **instructor money mode** (earnings, payout account, withdrawals). Admins never use the app.
University project ("đồ án"): the app is **never published** to App Store / Google Play.
UI text is **Vietnamese**; code, identifiers and comments are **English**.

## 2. Sources of truth (highest first)
1. `docs/requirements/EDU-MOB-SRS-001.md` — mobile business spec (UC-M, BR-42…BR-56, BR-M01, D-M, NFR-M, AC-M).
   If the file is missing, ask the user to export it from the shared spec document; do not invent rules.
2. `docs/ai/api-contract.md` — every endpoint the app may call, request/response shapes, error codes.
3. The backend's generated OpenAPI (`/v3/api-docs`, backend `dev` profile) — the exact wire types.
4. Backend business rules EDU-SRS-001 v3.0 (BR-01…BR-41) — enforced by the server; the app never relaxes them.
If two sources conflict, or a rule/endpoint is missing → **STOP and ask**. Never guess business rules or endpoints.

## 3. Tech stack (do not change without asking)
Expo (managed workflow, TypeScript `strict`) · Expo Router (file-based routes) · TanStack Query (server state) ·
Zustand (small client state: session only) · axios (HTTP + interceptors) · expo-secure-store (refresh token) ·
react-hook-form + zod (forms) · expo-video (direct media) · react-native-webview (other video URLs) ·
expo-file-system + expo-sharing (certificate PDF) · expo-clipboard · @expo/vector-icons ·
openapi-typescript (types generated from the backend OpenAPI) · jest-expo + @testing-library/react-native.
**Never invent versions.** Create the project with `npx create-expo-app@latest` and add packages with
`npx expo install <pkg>` (it picks versions compatible with the Expo SDK). Any package not listed above → propose and ask.

## 4. Hard scope rules (never implement in the app)
- **No payment.** Never call `POST /orders`, `POST /orders/{code}/payments`, `GET /orders/{code}/payments/current`,
  `POST /orders/{code}/cancel`, `/webhooks/**`. No QR, no checkout button anywhere. Paid courses → "Mua trên website" (UC-M01).
- No course authoring, co-instructor management, revenue-share editing, admin features (`/admin/**`, `/instructor/**`
  authoring endpoints), instructor self-registration.
- No offline video download, no In-App Purchase, no push notifications.
- **Ads are BLOCKED** until open question Q-M01 is answered. Do not add any ad SDK or ad UI.
- Never use the web auth endpoints `/auth/login`, `/auth/register`, `/auth/refresh`, `/auth/logout` (cookie-based).
  The app uses `/auth/mobile/*` only (BE-01).

## 5. Architecture rules (details: `.agents/rules/10-architecture.md`)
- `app/` = Expo Router routes only: thin screens that compose feature hooks and UI components.
- `src/features/<feature>/` = `api.ts` (typed fetchers), `hooks.ts` (TanStack Query), `logic.ts` (pure functions),
  `components/`, tests next to the code. Features: auth, profile, catalog, cart, orders, learning, qa, reviews,
  certificates, earnings, withdrawals.
- `src/api/` = the single axios client, token refresh, ProblemDetail parsing, generated `schema.d.ts`.
- Components never call axios/fetch directly; they use feature hooks. No business logic in screens.
- The server is the source of truth: after a mutation, invalidate the related queries; never patch money/progress locally.

## 6. Coding rules
- TypeScript strict, no `any` (use generated types). Functional components + hooks only.
- Money = integer VND as `number`; format only through `src/lib/money.ts` (`499.000 đ`). Never do percentage or
  revenue-share maths in the app: show server values.
- Time = ISO-8601 UTC from the server; display only through `src/lib/date.ts` in `Asia/Ho_Chi_Minh`.
- Errors = RFC 9457 ProblemDetail: show the server's Vietnamese `detail`; map `errors[]` to form fields;
  honour `Retry-After` on 429. Every screen has loading, empty and error states.
- Never log or display tokens, passwords, bank account numbers (only the last 4 digits are ever shown).
- Base URLs come from `src/config/env.ts` (`EXPO_PUBLIC_API_BASE_URL`, `EXPO_PUBLIC_WEB_BASE_URL`), never hard-coded.

## 7. How you (the agent) must work
1. Restate the task with the UC/BR/AC codes it touches. Read the matching `.agents/rules/*` and `docs/ai/api-contract.md`.
2. Plan in ≤10 bullets before editing anything non-trivial. If the plan needs a backend endpoint that is not in
   `api-contract.md` (or is marked NOT READY) → STOP and say which backend prompt (B0x) must run first.
3. Make the smallest change that satisfies the task. No drive-by refactors, no new dependencies without asking.
4. Write/adjust tests. Run `npx tsc --noEmit`, `npm run lint`, `npm test`. **Never claim "done" without saying what ran.**
5. Finish with: changed files · UC/BR/AC covered · checks run + result · open questions. Update `docs/ai/progress.md`.

Commit style: Conventional Commits, scope = feature — `feat(cart): add item from course page [UC-S01]`.
