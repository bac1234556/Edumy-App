---
trigger: glob
globs: "app/**/*.tsx, src/components/**/*.tsx, src/features/**/components/**/*.tsx"
description: "UI/UX conventions of Edumy Mobile: Vietnamese copy, formats, screen states, accessibility."
---

# 50 — UI & UX conventions (NFR-M03…NFR-M08)

## Copy
- All user-facing text in Vietnamese, natural tone, no machine-translated phrasing. Keep strings in the component
  or in `src/features/<f>/copy.ts`; no i18n library (single language).
- Server error texts are already Vietnamese: show `detail` as is.
- Labels used everywhere: "Khám phá", "Học tập", "Giỏ hàng", "Tài khoản", "Giảng viên", "Vào học", "Học tiếp",
  "Thêm vào giỏ", "Mua trên website", "Ghi danh miễn phí", "Đánh dấu hoàn thành", "Rút tiền".

## Formats
- Money: `formatVnd(499000)` → `499.000 đ`; free → "Miễn phí". Integer only.
- Dates: `formatDate(iso)` → `16/11/2026`, `formatDateTime(iso)` → `14:05 16/11/2026`, both in `Asia/Ho_Chi_Minh`.
  Verify that `Intl.DateTimeFormat` with `timeZone` works on the Hermes version in use; if not, ask before adding a library.
- Progress: `{progressPercent}%` from the server + a progress bar.

## Every screen has four states
Loading (skeleton or spinner) · Empty (EmptyState with a next step, e.g. empty cart → "Khám phá khóa học") ·
Error (ErrorState with message + "Thử lại", `traceId` small) · Content. Lists use pull-to-refresh and infinite scroll
(page size 20).

## Interaction
- Disable submit buttons while a mutation is running (no double submit, NFR-M06).
- Destructive actions (delete question/answer, withdraw review, cancel withdrawal, logout) ask for confirmation.
- Forms keep their values on error; field errors appear under the field.
- After returning from the website (AppState `active`), refetch My learning, Cart, Orders, Earnings.

## Accessibility
Touch targets ≥ 44 pt; icon-only buttons have `accessibilityLabel` in Vietnamese; respect system font scaling
(no fixed heights on text containers); sufficient contrast in light and dark mode. Layout works from 360 pt width.

## Visual
Use `src/components/ui/*` primitives and one theme file (colors, spacing scale of 4, radius 8, font sizes).
No UI kit library unless a prompt asks for it. Icons from `@expo/vector-icons`.
