# M00 — Khởi tạo dự án

**Mục tiêu:** tạo khung dự án Expo + TypeScript đúng cấu trúc trong `.agents/rules/10-architecture.md`, chưa có tính năng.

**Đọc trước:** `AGENTS.md` §3, `.agents/rules/10-architecture.md`, `.agents/rules/60-testing.md`.

**Việc cần làm**
1. Tạo app bằng `npx create-expo-app@latest` (template TypeScript có Expo Router). Bật `strict` trong `tsconfig.json`.
2. Cài các thư viện của `AGENTS.md` §3 bằng `npx expo install` (không tự ghi số phiên bản).
3. Tạo cây thư mục `src/` theo rules 10 với file rỗng có export tối thiểu: `config/env.ts`, `api/query-keys.ts`,
   `lib/money.ts`, `lib/date.ts`, `lib/web-links.ts`, `store/session.ts`, `components/ui/` (Screen, Text, Button,
   Loading, EmptyState, ErrorState, MoneyText).
4. `src/config/env.ts` đọc `EXPO_PUBLIC_API_BASE_URL`, `EXPO_PUBLIC_WEB_BASE_URL`; thiếu biến thì ném lỗi rõ ràng lúc khởi động.
   Tạo `.env.example`, thêm `.env` vào `.gitignore`.
5. Hiện thực `formatVnd`, `formatDate`, `formatDateTime` (giờ `Asia/Ho_Chi_Minh`) và `webLinks` (`course`, `order`,
   `certificate`, `cart` — đường dẫn cart để trong một hằng số, ghi chú Q-M02). Kiểm tra `Intl` timeZone trên Hermes;
   nếu không hỗ trợ thì DỪNG và hỏi trước khi thêm thư viện.
6. Cấu hình ESLint + Prettier, jest-expo + Testing Library; script `lint`, `test`, `typecheck`.
7. Copy `docs/` của bộ kit vào repo nếu chưa có.

**Không được:** thêm màn hình tính năng, thêm thư viện ngoài danh sách, viết cứng URL.

**Xong khi:** `npx expo start` chạy được màn hình trống; `npx tsc --noEmit`, `npm run lint`, `npm test` xanh;
có test cho `formatVnd` và `formatDate*` (kể cả ranh giới tháng giờ Việt Nam). Cập nhật `docs/ai/progress.md`.
