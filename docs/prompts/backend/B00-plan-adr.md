# B00 — Kế hoạch, ADR và cập nhật phạm vi (HARD STOP)

Bối cảnh: nhóm làm app React Native dùng chung backend và thêm phân hệ 06 "Chia doanh thu và Rút tiền".
Đặc tả: `docs/requirements/EDU-MOB-SRS-001.md` (mục 5, 6, 8 và các quyết định D-M).

**Điều kiện:** SRS v3.0 xếp "chia doanh thu giảng viên" ngoài phạm vi và `AGENTS.md` §8 ghi "never implement".
Chỉ tiếp tục nếu tôi xác nhận trong hội thoại rằng **giảng viên hướng dẫn đã duyệt Q-M03**. Nếu chưa, chỉ viết bản nháp ADR.

**Việc cần làm — chỉ tài liệu, KHÔNG sửa code**
1. Đọc `AGENTS.md`, `docs/ai/01-architecture.md`, `03-data-model-mysql.md`, `04-security.md`, `05-api-contract.md`,
   ADR-002, ADR-004, ADR-006, ADR-010, ADR-011 và đặc tả mobile.
2. Viết `docs/ai/adr/ADR-015-mobile-auth.md`: nhóm `/auth/mobile/*`, refresh token trong body, không kiểm `Origin`,
   giữ nguyên xoay vòng / phát hiện dùng lại / giới hạn tốc độ của ADR-002; phân tích rủi ro.
3. Viết `docs/ai/adr/ADR-016-revenue-share-payout.md`: module `payout` mới (bảng sở hữu, phụ thuộc
   `commerce → payout::api`, `payout → shared, identity::api, authoring::api`), sổ thu nhập bất biến theo dòng đơn × người nhận,
   gọi đồng bộ `MANDATORY` từ bước cấp ghi danh dùng chung của T2 và UC-A18 (giống ADR-004), số dư được tính ra,
   chính sách đáo hạn `monthly|immediate`, khóa theo giảng viên, thứ tự khóa mới so với ADR-011.
   Ghi rõ hai điều chỉnh so với đề xuất ban đầu: không lưu cột trên `orders` (D-M03), không lưu cột số dư (D-M04).
4. Đề xuất DDL cho V7 (cột tỷ lệ của đồng GV) và V8 (ba bảng `payout`) theo quy ước đặt tên của `docs/ai/03`,
   kèm CHECK, UNIQUE, index, và cột sinh cho "mỗi giảng viên tối đa một yêu cầu `requested`" (cùng kỹ thuật `orders.pending_student_id`).
5. Đề xuất cập nhật `AGENTS.md` (bảng module, §8 phạm vi), `docs/ai/01-architecture.md` (cây module `payout`, §1.8, §1.9, §1.10),
   danh sách mã lỗi mới và danh sách endpoint mới.
6. Liệt kê các test cần có cho B01–B05.

**Dừng lại** sau khi trình bày kế hoạch ≤ 15 gạch đầu dòng và các file ADR. Không tạo migration, không sửa Java.
