# M09 — Tài khoản nhận tiền và rút tiền

**Phụ thuộc:** M08; backend **B04 đã xong**. **UC:** I26, I27, I28. **Quy tắc:** BR-51…BR-56. **AC:** AC-M14…M17.

**Đọc trước:** rules 30 phần "Never", rules 40 phần "Instructor money mode", đặc tả 6.3–6.5, api-contract §6.

**Việc cần làm**
1. `instructor/payout-account`: xem (chỉ 4 số cuối) và khai báo/sửa (ngân hàng, số tài khoản, chủ tài khoản,
   **mật khẩu hiện tại**). Không log, không giữ số tài khoản trong state sau khi gửi xong.
2. `instructor/withdrawals/new`: hiện số dư khả dụng và tài khoản nhận; nhập số tiền nguyên VND; kiểm trước
   ≥ `minWithdrawal` và ≤ khả dụng (chỉ để UX); xử lý đủ E1–E4 từ server; chưa có tài khoản → chuyển sang màn khai báo.
3. `instructor/withdrawals`: lịch sử với 4 trạng thái và nhãn tiếng Việt, hiện mã chuyển khoản hoặc lý do từ chối;
   hủy yêu cầu `requested` (có xác nhận).
4. Sau mỗi thao tác: invalidate `earningsSummary` và `withdrawals`.

**Xong khi:** test validate form rút tiền (dưới mức tối thiểu, vượt số dư, số lẻ, rỗng); test hiển thị số tài khoản đã che;
thử thủ công AC-M14 và AC-M15 với backend ở profile demo. Lệnh kiểm tra xanh.
