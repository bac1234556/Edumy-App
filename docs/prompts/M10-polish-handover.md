# M10 — Hoàn thiện và bàn giao

**Phụ thuộc:** M01–M09.

**Việc cần làm**
1. Rà mọi màn theo rules 50: 4 trạng thái, nút khóa khi đang gửi, xác nhận trước thao tác hủy/xóa, nhãn trợ năng,
   chiều rộng 360 pt, chế độ tối.
2. Rà bảo mật theo rules 30: tìm trong code mọi chỗ dùng AsyncStorage, `console.log`, URL có token; báo cáo kết quả.
3. Lập `docs/ai/ac-checklist.md`: từng AC-M01…AC-M18 → cách thử (test tự động hoặc bước thủ công) → kết quả.
4. Viết `docs/demo-script.md` cho buổi bảo vệ: chạy backend profile demo (`maturity=immediate`), mua khóa trên web,
   thấy khóa trên app, học và nhận chứng chỉ, giảng viên xem doanh thu và rút tiền, admin chi trên web.
5. Cập nhật README: cài đặt, biến môi trường, chạy trên máy ảo/điện thoại, lệnh kiểm tra.

**Không được:** thêm tính năng mới (kể cả quảng cáo) trong prompt này.

**Xong khi:** `npx tsc --noEmit`, `npm run lint`, `npm test` xanh; checklist AC đầy đủ; progress cập nhật.
