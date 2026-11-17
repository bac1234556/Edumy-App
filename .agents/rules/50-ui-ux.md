---
trigger: glob
globs: "app/**/*.tsx, src/components/**/*.tsx, src/features/**/components/**/*.tsx"
description: "UI/UX conventions and cross-platform dialog rules of Edumy Mobile."
---

# 50 — UI & UX conventions

## Platform rules (Android, iOS, Web)
- **Cấm dùng trực tiếp `Alert.alert`.** Mọi hộp thoại xác nhận hoặc thông báo phải đi qua `src/lib/dialog.ts` (`confirm` / `notify`), không import `Alert` ở nơi khác (enforced by ESLint `no-restricted-syntax`).
- Mọi tính năng (đăng nhập, đăng xuất, xác nhận, tải/xem chứng chỉ, mở web, kênh giảng viên, rút tiền) phải chạy được trên cả Android, iOS và Web (`expo start --web`).

## Copy
- All user-facing text in Vietnamese, natural tone. Single language (no i18n library).
- Show server Vietnamese `message` as-is unless a specific action/code UX applies.
- Standard labels: "Khám phá", "Học tập", "Giảng viên", "Tài khoản", "Vào học", "Học tiếp",
  "Mua trên website", "Đăng nhập để ghi danh", "Ghi danh miễn phí", "Đánh dấu hoàn thành", "Rút tiền",
  "Doanh số bán", "Thu nhập thực nhận".

## Formats
- Money: `formatVnd(499000)` → `499.000 đ`; free → "Miễn phí". Integer only.
- Dates: `formatDate(iso)` → `16/11/2026`, `formatDateTime(iso)` → `16/11/2026 14:05` (or `14:05 16/11/2026`), in `Asia/Ho_Chi_Minh`.
- Progress: `{progressPercent}%` from the server + progress bar.

## Screen states & interaction
- Every screen has Loading, Empty, Error (with retry + small `traceId`), and Content states. Lists use pull-to-refresh and infinite scroll (page size 20).
- Disable submit buttons while a mutation is running (`isPending`) to prevent double submit.
- Destructive actions (delete question/answer, cancel withdrawal, accept/decline co-instructor invitation, logout) confirm via `confirm(...)` from `src/lib/dialog.ts`.
- Keep form values on error; show field errors under each input.
- On foreground return (`AppState` active), invalidate `['learning']`, `['certificates']`, `['earnings']`, `['instructor']`, `['auth', 'me']`.

## Accessibility & Visual
- Touch targets ≥ 44 pt; icon-only buttons have Vietnamese `accessibilityLabel`; respect font scaling; usable from 360 pt width.
- Use `src/components/ui/*` primitives and `src/theme/tokens.ts`. Icons from `@expo/vector-icons`.
