# M08 — Chế độ Giảng viên: doanh thu

**Phụ thuộc:** backend **B03 đã xong** (các endpoint `/me/earnings/*` có trong OpenAPI). Nếu chưa → DỪNG.
**UC:** I25. **Quy tắc:** D-M01, BR-42…BR-50, BR-53.

**Đọc trước:** rules 40 phần "Instructor money mode", đặc tả mục 5–6, api-contract §6.

**Việc cần làm**
1. Chạy lại `npm run gen:api`; đối chiếu shape thật với api-contract §6, cập nhật api-contract nếu backend khác đề xuất.
2. Mở rộng `shouldShowInstructorTab(me, earningsSummary)`: vai trò `instructor` HOẶC `hasEarnings` (BR-53).
3. Màn `instructor/earnings`: thẻ số dư (khả dụng, chờ đáo hạn, đang rút, đã rút, tổng), giải thích đáo hạn
   ("Thu nhập tháng M được rút từ ngày 01 tháng sau"), nhãn "Chế độ demo" khi `maturityPolicy = immediate`,
   thu nhập theo tháng và theo khóa (vai trò GV chính / đồng GV).
4. `instructor/entries`: danh sách bút toán có lọc theo khóa và tháng; mỗi dòng hiện giá chốt, % phí, % chia, số tiền, ngày đáo hạn.
5. Ghi chú trên màn: tỷ lệ chia được GV chính chỉnh trên website.

**Không được:** tự tính phí, tỷ lệ, đáo hạn hay số dư. Chỉ hiển thị số của server.

**Xong khi:** test `shouldShowInstructorTab` đủ 4 trường hợp; màn có đủ 4 trạng thái; lệnh kiểm tra xanh.
