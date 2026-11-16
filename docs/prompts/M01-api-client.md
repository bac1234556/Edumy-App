# M01 — API client, lỗi RFC 9457, sinh kiểu từ OpenAPI

**Mục tiêu:** một tầng mạng duy nhất, đúng `.agents/rules/20-api-and-errors.md`. Chưa làm luồng đăng nhập (M02).

**Đọc trước:** rules 20, `docs/ai/api-contract.md` (phần đầu và §1), rules 30 phần "Model".

**Việc cần làm**
1. Sinh `src/api/schema.d.ts` bằng openapi-typescript từ `/v3/api-docs` của backend profile `dev`; thêm script
   `npm run gen:api`. Nếu backend chưa chạy được, DỪNG và hỏi (không viết tay schema).
2. `src/api/client.ts`: một instance axios, `baseURL` từ env, timeout 15 s, interceptor gắn Bearer từ store.
3. `src/api/tokens.ts`: đọc/ghi/xóa refresh token trong expo-secure-store (key `edumy.refreshToken`); access token chỉ trong bộ nhớ.
4. Interceptor 401 với **làm mới token một luồng duy nhất** (single-flight) gọi `/auth/mobile/refresh`. Endpoint này
   đang ⛔ (B01): viết code theo hợp đồng trong api-contract, nhưng test bằng adapter giả, không gọi backend thật.
5. `src/api/problem.ts`: chuyển mọi lỗi thành `AppError` (problem / network / timeout, `fieldErrors`, `retryAfterSec`, `traceId`).
6. Hàm tiện ích nối `fieldErrors` vào react-hook-form.
7. `src/api/query-keys.ts`: khai báo khóa cho mọi resource trong api-contract.

**Xong khi:** test chứng minh: 5 request 401 song song → đúng 1 lần refresh và cả 5 được gửi lại; refresh trả 401 →
xóa token và session; lỗi mạng khi refresh → giữ token; ProblemDetail có/không `errors[]`; 429 đọc `Retry-After`.
Lệnh kiểm tra xanh, cập nhật progress.
