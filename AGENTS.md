# AGENTS.md — Edumy Mobile (React Native)

> Always-on rules for every AI agent working in this repo (Antigravity, Claude Code, Cursor…).
> Keep this file short. Topic rules live in `.agents/rules/` (loaded on demand). Read them BEFORE writing code.

## 1. Project in one paragraph
Edumy Mobile is the React Native app of **Edumy**, an online-course marketplace. It is a **client of the existing
Edumy backend** (Spring Boot, REST `/api/v1`) and shares the **same accounts and data** as the Edumy web SPA:
a course bought on the web appears in the app, progress made in the app appears on the web.
**BR-MOBILE-SCOPE:** The app = **learning + instructor channel** (view + light actions). The website handles all commerce (cart, checkout, orders, payments) and course authoring.
Admins never use the app. University project ("đồ án"): the app is **never published** to App Store / Google Play.
UI text is **Vietnamese**; code, identifiers and comments are **English**.

## 2. Sources of truth (highest first)
1. `docs/ai/api-contract-v2.md` — every endpoint the app may call, response envelope v2, request/response shapes, error codes.
2. `docs/ai/openapi.json` (exported from backend `/v3/api-docs`, `dev` profile) — exact wire types for `openapi-typescript`.
3. `docs/requirements/EDU-MOB-SRS-001.md` (when present) and backend business rules (e.g., BR-PAY-HOLD) — enforced by the server; the app never relaxes them.
If two sources conflict, or a schema/endpoint is missing → **STOP and report** the discrepancy. Never guess business rules or hand-write server response types.

## 3. Tech stack (do not change without asking)
Expo SDK 51 (managed workflow, TypeScript `strict`) · Expo Router (file-based routes) · TanStack Query (server state) ·
Zustand (small client state: session only) · axios (HTTP + interceptors) · expo-secure-store (native refresh token) ·
expo-network (onlineManager) · expo-web-browser (website handoff) ·
react-hook-form + zod (forms) · expo-video (direct media) · react-native-webview (other video URLs) ·
expo-file-system + expo-sharing (certificate PDF) · expo-clipboard · @expo/vector-icons ·
openapi-typescript (types generated from `docs/ai/openapi.json`) · jest-expo + @testing-library/react-native.
**Never invent versions.** Add packages only with `npx expo install <pkg>` and ask before adding any new package.

## 4. Hard scope rules (never implement in the app)
- **BR-MOBILE-SCOPE — No cart, no orders, no payment.** Never call `/cart/**`, `/orders/**`, `/payments/**`, `/webhooks/**`. Never recreate cart or order history tabs/screens.
  Paid courses → button **"Mua trên website"** opening `${WEB_BASE_URL}/courses/{id}` via `expo-web-browser`.
- **No course authoring.** No curriculum builder, video/media upload, lesson reordering, or revenue-share editing in the app.
  The Instructor tab ("Giảng viên") supports view + light actions only (overview, courses, student roster, Q&A replies, co-instructor invitations, earnings, payout account, withdrawals).
- No offline video download, no In-App Purchase, no push notifications, no ads (Q-M01 blocked).
- Never use cookie-based web auth endpoints (`/auth/login`, `/auth/register`, `/auth/refresh`, `/auth/logout`). Use `/auth/mobile/*` only.

## 5. Architecture rules (details: `.agents/rules/10-architecture.md`)
- `app/` = Expo Router routes only: thin screens that compose feature hooks and UI components.
- `src/features/<feature>/` = `api.ts` (typed fetchers using generated types + `unwrap`), `hooks.ts` (TanStack Query), `logic.ts` (pure functions),
  `components/`, tests next to the code. Features: `auth`, `profile`, `catalog`, `learning`, `qa`, `reviews`, `certificates`, `instructor`.
- `src/api/` = `client.ts` (single axios instance + epoch-guarded refresh), `envelope.ts` (`unwrap`, `Page<T>`), `problem.ts` (v2 error envelope), `query-keys.ts`, `tokens.ts`, generated `schema.d.ts`.
- `src/lib/dialog.ts` = cross-platform `confirm` & `notify`. Direct `Alert.alert` calls are **forbidden** anywhere else (enforced by ESLint).
- Components never call axios/fetch directly; they use feature hooks. No business logic in screens.
- The server is the source of truth: after a mutation, invalidate related queries; never patch money/progress locally.

## 6. Coding rules
- TypeScript strict, no `any`, no hand-written server response types (always derive from `src/api/schema.d.ts`). Functional components + hooks only.
- Money = integer VND as `number`; format only through `src/lib/money.ts` (`499.000 đ`). Never compute percentages, platform fees, or revenue shares in the app.
- Time = ISO-8601 UTC from the server; display only through `src/lib/date.ts` in `Asia/Ho_Chi_Minh`.
- Errors = v2 error envelope `{success:false, message, data:null, errors:{code, fields, traceId}}`: show server Vietnamese `message`; map `errors.fields` to form fields; honour `Retry-After` on 429. Every screen has loading, empty and error states.
- All features must work on Android, iOS, and Web (`expo start --web`).
- Never log or display tokens, passwords, or full bank account numbers (only last 4 digits).
- Base URLs come from `src/config/env.ts` (`EXPO_PUBLIC_API_BASE_URL`, `EXPO_PUBLIC_WEB_BASE_URL`), never hard-coded.

## 7. How you (the agent) must work
1. Read `.agents/rules/*` and `docs/ai/api-contract-v2.md`.
2. Plan before editing anything non-trivial. If the contract/OpenAPI disagrees with the server → STOP and report.
3. Make clean, minimal changes. No new dependencies without asking.
4. Write/adjust tests. Run `npx tsc --noEmit`, `npm run lint`, `npm test`, and smoke test on Android Emulator with the real backend. **Never claim "done" without saying what ran and the result.**
5. Update `docs/ai/progress.md` after each phase.

Commit style: Conventional Commits, scope = feature — `feat(instructor): add overview and course roster`.
