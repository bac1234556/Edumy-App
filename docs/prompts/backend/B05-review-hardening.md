# B05 — Rà soát và gia cố phân hệ 06

**Việc cần làm**
1. Tự rà soát B01–B04 theo `docs/prompts/P10-code-review.md` của repo (bảo mật, đúng nghiệp vụ, cấu trúc, dữ liệu).
2. Mutation check: lần lượt gỡ khóa theo giảng viên, UNIQUE của sổ thu nhập, lời gọi `EarningApi` trong `fulfil`,
   kiểm tổng tỷ lệ; chạy test liên quan để chứng minh test đỏ; khôi phục file nguyên byte; ghi kết quả vào `progress.md`.
3. Cập nhật `docs/ai/progress.md`, `05-api-contract.md`, danh sách mã lỗi, sơ đồ `docs/modulith` (chạy `ModularityTest`).
4. Liệt kê rủi ro còn lại (ví dụ: chưa có thử lại thư, chuyển khoản thủ công).

**Xong khi:** `./mvnw test` xanh, dán dòng tổng kết và thời gian chạy.
