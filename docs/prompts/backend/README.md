# Prompts backend (chạy trong workspace repo `Edumy`)

Các prompt này chạy trong repo backend, nơi `AGENTS.md` và `docs/ai/*` sẵn có quy định cách làm (ADR trước,
migration mới V7+, `ModularityTest` xanh, plan trước khi sửa `commerce` / `identity` / `db/migration`).
Copy `EDU-MOB-SRS-001.md` (bản xuất của tài liệu đặc tả) vào `docs/requirements/` của repo backend trước khi chạy B00.

| Prompt | Nội dung | Mở khóa cho app |
|---|---|---|
| B00 | Kế hoạch + ADR-015, ADR-016 + cập nhật phạm vi — **HARD STOP chờ duyệt** | tất cả |
| B01 | Endpoint đăng nhập cho mobile (`identity`) | M02 |
| B02 | Tỷ lệ chia doanh thu của đồng GV (`authoring`, V7) | — |
| B03 | Module `payout`: sổ thu nhập + ghi trong T2 / UC-A18 (V8) | M08 |
| B04 | Tài khoản nhận tiền, yêu cầu rút, admin xử lý, thư, chế độ đáo hạn | M09 |
| B05 | Rà soát, test tranh chấp, IDOR, mutation check | — |
