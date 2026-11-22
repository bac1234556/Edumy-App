# TIẾN ĐỘ KIỂM THỬ EDUMY MOBILE (QA PROGRESS TRACKER)

| Pha | Nội dung | Trạng thái | Kết quả / Sản phẩm chính |
| :--- | :--- | :---: | :--- |
| **Pha 1** | Lập Kế hoạch kiểm thử (`EDU-TP-M-001`) | **HOÀN TẤT** | `EDU-TP-M-001_Test_Plan.md` |
| **Pha 2** | Danh mục yêu cầu, Thiết kế & Sinh Test Case + RTM | **HOÀN TẤT** | `requirements_inventory.csv` (111 yêu cầu), `EDU-TDS-M-001_Test_Design.md`, `EDU-TCS-M-001_Test_Cases.xlsx` (8 sheets, 92 TC, 100% RTM) |
| **Pha 3** | Thiết lập Môi trường (`EDU-TER-M-001`) & Smoke Test | **HOÀN TẤT** | `EDU-TER-M-001_Test_Environment.md`, stack `edumy-test` healthy & seeded, Expo Web bundle `dist-web-qa` |
| **Pha 4 (C1)** | Thực thi Chu kỳ C1 (`92 TC`, `RUN-M-C1-0001..0092`) | **HOÀN TẤT** | `84 Pass / 5 Fail / 3 Blocked / 0 Not Run` (`91.30%`), phát hiện 4 Defect (`DEF-M-001..004`); `EDU-TSR-M-001_Status_Report.md` |
| **Pha 5 (C2/C3)** | Sửa lỗi `[App]`, Kiểm thử lại (`C2`: 10 runs) & Hồi quy (`C3`: 75 runs) | **HOÀN TẤT** | Đóng 100% lỗi `[App]` (`DEF-M-003`, `DEF-M-004 [App]`); kết quả sau C3: **89 Pass / 0 Fail (`[Backend]`) / 3 Blocked / 0 Not Run** (`96.74%` tổng; `100.0%` trên 89 TC chạy được; tổng **177 lượt chạy**) |
| **Pha 6** | Báo cáo Hoàn tất (`EDU-TCR-M-001`) & Cập nhật `ac-checklist.md` | **HOÀN TẤT** | `EDU-TCR-M-001_Test_Completion_Report.md` (10 bảng + 4 biểu đồ PNG), cập nhật `docs/ai/ac-checklist.md` & `docs/ai/progress.md` |
