## Mô tả thay đổi (Description)
<!-- Tóm tắt ngắn gọn những thay đổi được thực hiện trong PR này -->

Closes #<!-- Ghi số issue vào đây, ví dụ: Closes #12 -->

---

## Loại thay đổi (Type of Change)
- [ ] `feat`: Tính năng mới
- [ ] `fix`: Sửa lỗi
- [ ] `docs`: Tài liệu
- [ ] `test`: Bổ sung hoặc chỉnh sửa test
- [ ] `chore`: Cập nhật cấu hình, dependencies, CI/CD

---

## Phân hệ ảnh hưởng (Affected Module)
- [ ] `module:auth`
- [ ] `module:catalog`
- [ ] `module:instructor`
- [ ] `module:learning`
- [ ] `module:admin`
- [ ] `area:backend`
- [ ] `area:mobile`
- [ ] `area:devops`

---

## Ảnh chụp màn hình / Video minh họa (Screenshots / Screen Recording)
<!-- Bắt buộc nếu có thay đổi giao diện Mobile UI -->
*Dán ảnh hoặc video tại đây*

---

## Hướng dẫn kiểm thử (How to Test)
1. Bước 1:
2. Bước 2:
3. Bước 3:

---

## Tiêu chuẩn hoàn thành (Definition of Done)
<!-- Ghi N/A và lý do cho mục UI/API/Android không áp dụng; không coi kiểm tra chưa chạy là PASS. -->
- [ ] CI đã chạy thật; có lệnh, kết quả và link run (ghi rõ FAIL/SKIPPED nếu có)
- [ ] Ít nhất 1 approval từ thành viên khác trước khi merge
- [ ] Code đã tự test trên điện thoại Android thật hoặc máy ảo (Emulator)
- [ ] API có mô tả trên Swagger, validate input, trả lỗi đúng format `{ success, data, message }`
- [ ] Màn hình Mobile có đủ 3 trạng thái: Loading, Empty, Error
- [ ] Toàn bộ Acceptance Criteria trong Issue đã được đáp ứng
- [ ] Không có conflict với nhánh `develop`
