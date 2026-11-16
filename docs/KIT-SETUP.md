# Cài bộ kit vào repo mobile

1. Tạo thư mục/repo riêng cho app (không lồng trong repo backend), ví dụ `edumy-mobile/`.
2. Copy toàn bộ nội dung bộ kit vào gốc repo đó: `AGENTS.md`, `.agents/`, `docs/`.
   Lưu ý thư mục `.agents` bắt đầu bằng dấu chấm (bị ẩn trên một số hệ điều hành).
3. Xuất tài liệu đặc tả ra Markdown → `docs/requirements/EDU-MOB-SRS-001.md`.
4. Mở thư mục bằng Antigravity, vào Customizations → Rules để kiểm tra agent đã thấy `AGENTS.md` và 6 file trong
   `.agents/rules/` (file thiếu frontmatter `trigger` sẽ bị bỏ qua im lặng).
5. Chạy prompt theo thứ tự trong `docs/prompts/README.md`. Prompt `backend/B0x` chạy trong workspace repo backend.

Cách nạp rule: `AGENTS.md` luôn bật; `10`, `20`, `50`, `60` bật theo đường dẫn file đang sửa (`glob`);
`30`, `40` để agent tự đọc khi việc liên quan (`model_decision`). Mỗi file rule phải nhỏ hơn 24 KB.
