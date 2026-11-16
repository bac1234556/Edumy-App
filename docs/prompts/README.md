# Prompts cho Antigravity — Edumy Mobile

Cách dùng: mở **đúng workspace**, mở một hội thoại agent mới cho mỗi prompt, dán nguyên nội dung file prompt.
Agent tự đọc `AGENTS.md` và `.agents/rules/*` của workspace đó.

## Hai workspace, hai bộ quy tắc
| Workspace | Prompt | Quy tắc agent đọc |
|---|---|---|
| Repo **backend** `Edumy` (Spring Boot) | `backend/B00`–`B05` | `AGENTS.md` sẵn có của backend (Antigravity đọc được `AGENTS.md`) |
| Repo **mobile** `edumy-mobile` (React Native) | `M00`–`M10` | `AGENTS.md` + `.agents/rules/*` của bộ kit này |

Đặt app mobile ở **repo/thư mục riêng**, không lồng vào trong repo backend: Antigravity nạp rules từ thư mục cha
lên tới gốc repo, nên lồng vào sẽ trộn hai bộ quy tắc.

## Thứ tự chạy
```
B00 (duyệt) ─► B01 ─────────────► M02
M00 ─► M01 ──────────────────────► M02 ─► M03 ─► M04 ─► M05 ─► M06 ─► M07
B02 ─► B03 ─► B04 ─► B05 ───────────────────────────────────► M08 ─► M09 ─► M10
```
- **Điểm dừng bắt buộc (HARD STOP):** B00 chỉ lập kế hoạch và viết ADR, chờ bạn duyệt. Prompt nào gặp endpoint
  chưa có trong `docs/ai/api-contract.md` hoặc đang ⛔ thì agent phải dừng và báo cần chạy prompt backend nào.
- **Quảng cáo:** chưa có prompt. Chỉ viết sau khi chốt Q-M01 trong đặc tả.
- Sau mỗi prompt: đọc báo cáo cuối của agent (file đã đổi, UC/BR, lệnh đã chạy), kiểm tra `docs/ai/progress.md`, commit.

## Mẹo
- Nếu agent đề xuất thêm thư viện ngoài danh sách trong `AGENTS.md`, trả lời có/không rõ ràng trước khi cho chạy tiếp.
- Giữ backend chạy profile `dev` khi làm app (Swagger và `/v3/api-docs` chỉ bật ở `dev`).
- Máy ảo Android gọi máy local qua `10.0.2.2`; điện thoại thật dùng IP LAN của máy chạy backend.
- Thêm origin của Expo vào `edumy.cors.allowed-origins` chỉ khi chạy bản web của Expo; app native không cần CORS.
