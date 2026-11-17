# API Contract — Edumy Mobile

> **Lưu ý:** Hợp đồng API chính thức hiện tại đã chuyển sang **`docs/ai/api-contract-v2.md`** và **`docs/ai/openapi.json`**.
>
> - Đọc [api-contract-v2.md](./api-contract-v2.md) cho danh sách endpoint, response envelope `{ success, message, data, errors }` và mã lỗi v2.
> - Đọc [openapi.json](./openapi.json) (sinh `src/api/schema.d.ts` bằng `npm run gen:api`).
> - **BR-MOBILE-SCOPE:** Không bao giờ gọi `/cart/**`, `/orders/**`, `/payments/**` hoặc các endpoint soạn khóa học.
