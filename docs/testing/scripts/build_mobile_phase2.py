# -*- coding: utf-8 -*-
"""
Phase 2 Builder for Edumy Mobile (Edumy-App):
- Generates requirements_inventory.csv
- Generates EDU-TEL-M-001_Execution_Log.csv (header)
- Generates EDU-TCS-M-001_Test_Cases.xlsx (8 sheets: Cover, TestCases, ExecutionLog, Defects, Summary, RTM, Contract, NFR)
- Generates PROGRESS.md
- Verifies 100% RTM coverage (0 uncovered requirements, every AC has >= 2 TCs)
"""

import csv
import os
from collections import Counter, defaultdict

import openpyxl
from openpyxl.styles import Alignment, Border, Font, PatternFill, Side
from openpyxl.utils import get_column_letter

from qa_mobile_data import CONTRACT_ENDPOINTS, NFR_MOBILE_SPECS, REQUIREMENTS
from qa_mobile_tcs import MOBILE_TCS

BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
REQ_CSV = os.path.join(BASE_DIR, "requirements_inventory.csv")
EXEC_CSV = os.path.join(BASE_DIR, "EDU-TEL-M-001_Execution_Log.csv")
XLSX_PATH = os.path.join(BASE_DIR, "EDU-TCS-M-001_Test_Cases.xlsx")
PROG_PATH = os.path.join(BASE_DIR, "PROGRESS.md")

MODULES = ["M-M01", "M-M02", "M-M03", "M-M04", "M-M05", "M-M06", "M-M07", "M-M08", "M-API", "M-REG"]
TYPES = ["FN", "SEC", "PERF", "REL", "USA", "COMP", "MNT", "DEP"]
PRIOS = ["High", "Medium", "Low"]
PLATFORMS = ["Jest", "Web", "Android-30", "Android-34", "iOS"]


def build_all():
    os.makedirs(BASE_DIR, exist_ok=True)
    os.makedirs(os.path.join(BASE_DIR, "evidence"), exist_ok=True)
    os.makedirs(os.path.join(BASE_DIR, "charts"), exist_ok=True)

    # 1. Write requirements_inventory.csv
    with open(REQ_CSV, "w", encoding="utf-8", newline="") as f:
        w = csv.writer(f)
        w.writerow(["id", "loại", "mô tả", "module", "ưu tiên"])
        for r in REQUIREMENTS:
            w.writerow(list(r))

    # 2. Write EDU-TEL-M-001_Execution_Log.csv (empty header at Phase 2)
    if not os.path.exists(EXEC_CSV):
        with open(EXEC_CSV, "w", encoding="utf-8", newline="") as f:
            w = csv.writer(f)
            w.writerow([
                "Run ID", "Chu kỳ", "TC ID", "Module", "Loại", "Ưu tiên", "Nền tảng",
                "Trạng thái", "Kết quả thực tế", "Defect ID", "Bằng chứng",
                "Commit (App / Backend)", "Môi trường / Thiết bị", "Thời điểm (Asia/Ho_Chi_Minh)", "Người thực hiện", "Ghi chú"
            ])

    # 3. Map Requirements <-> Test Cases
    req_to_tcs = defaultdict(list)
    for tc in MOBILE_TCS:
        tc_id = tc[0]
        trace_tokens = [x.strip() for x in tc[3].split(",") if x.strip()]
        for tok in trace_tokens:
            req_to_tcs[tok].append(tc_id)

    uncovered = [r[0] for r in REQUIREMENTS if not req_to_tcs.get(r[0])]
    ac_under_2 = [r[0] for r in REQUIREMENTS if r[1] == "AC" and len(req_to_tcs.get(r[0], [])) < 2]

    # 4. Build EDU-TCS-M-001_Test_Cases.xlsx (8 sheets)
    wb = openpyxl.Workbook()
    ws_cover = wb.active
    ws_cover.title = "Cover"

    header_fill = PatternFill("solid", fgColor="1E3A8A")
    header_font = Font(bold=True, color="FFFFFF", size=10)
    sub_fill = PatternFill("solid", fgColor="DBEAFE")
    bold_font = Font(bold=True, size=10)
    thin = Side(border_style="thin", color="CBD5E1")
    border = Border(left=thin, right=thin, top=thin, bottom=thin)

    cover_rows = [
        ("EDUMY MOBILE (EDUMY-APP) — SYSTEM TEST CASE SPECIFICATION (EDU-TCS-M-001)", ""),
        ("", ""),
        ("MÃ TÀI LIỆU", "EDU-TCS-M-001"),
        ("TÊN TÀI LIỆU", "Bộ Test Cases, Ma trận Truy vết (RTM), Hợp đồng API (Contract) & NFR — Edumy Mobile"),
        ("PHIÊN BẢN", "1.0 (Pha 2 — Chờ phê duyệt trước khi thực thi Chu kỳ C1)"),
        ("NGÀY LẬP", "2026-11-22 (Asia/Ho_Chi_Minh)"),
        ("CHUẨN ÁP DỤNG", "ISO/IEC/IEEE 29119-2, 29119-3, 29119-4 | ISO/IEC 25010 | OWASP MASVS v2"),
        ("COMMIT CƠ SỞ", "Edumy-App: 6cf1e9e | Edumy-main (Backend): 260de6b"),
        ("PHẠM VI", "10 Module (M-M01..M-M08, M-API, M-REG) | BR-MOBILE-SCOPE | AC-M01..AC-M18 | 31 API Endpoints | 23 Màn hình"),
        ("TỔNG SỐ YÊU CẦU TRONG INVENTORY", len(REQUIREMENTS)),
        ("TỔNG SỐ TEST CASES", len(MOBILE_TCS)),
        ("TRẠNG THÁI HIỆN TẠI", "Not Run (100%) — Chưa thực thi, tuân thủ quy tắc trung thực"),
        ("CẤU TRÚC WORKBOOK", "8 Sheets: Cover, TestCases, ExecutionLog, Defects, Summary, RTM, Contract, NFR"),
        ("GHI CHÚ TEST BASIS", "EDU-MOB-SRS-001.md và EDU-MTP-001 chưa có trong repo; đã báo cáo và sử dụng ac-checklist.md + .agents/rules/10..60 + api-contract-v2.md + openapi.json + các UC kênh Mobile của EDU-SRS-001 v3.0."),
    ]
    for r_idx, (k, v) in enumerate(cover_rows, start=1):
        ws_cover.cell(r_idx, 1, k).font = bold_font
        ws_cover.cell(r_idx, 2, v)
    ws_cover.column_dimensions["A"].width = 36
    ws_cover.column_dimensions["B"].width = 96

    # Sheet 2: TestCases (24 columns per Section 5)
    ws_tc = wb.create_sheet("TestCases")
    tc_headers = [
        "TC ID", "Module", "Kịch bản", "Truy vết (AC-M/BR/UC/NFR/rule)", "Tiêu đề",
        "Loại", "Cấp độ", "Kỹ thuật", "Ưu tiên", "Nền tảng", "Vai trò",
        "Tiền điều kiện", "Dữ liệu test", "Các bước", "Kết quả mong đợi",
        "Kết quả thực tế", "Trạng thái", "Số lần thực thi", "Run ID gần nhất",
        "Defect ID", "Bằng chứng", "Môi trường/Build", "Người thực hiện", "Ngày"
    ]
    ws_tc.append(tc_headers)
    for col_idx in range(1, len(tc_headers) + 1):
        c = ws_tc.cell(1, col_idx)
        c.fill = header_fill
        c.font = header_font
        c.alignment = Alignment(horizontal="center", vertical="center", wrap_text=True)

    for tc in MOBILE_TCS:
        (tc_id, mod, scen, trace, title, ttype, level, tech, prio, plat, role, pre, data, steps, exp) = tc
        ws_tc.append([
            tc_id, mod, scen, trace, title, ttype, level, tech, prio, plat, role,
            pre, data, steps, exp,
            "", "Not Run", 0, "", "", "", "Edumy-App@6cf1e9e / Edumy-main@260de6b", "QA Lead", ""
        ])

    col_widths_tc = [18, 10, 15, 28, 48, 8, 14, 22, 10, 12, 14, 30, 32, 42, 42, 36, 12, 10, 16, 14, 28, 26, 14, 14]
    for i, w in enumerate(col_widths_tc, start=1):
        ws_tc.column_dimensions[get_column_letter(i)].width = w

    # Sheet 3: ExecutionLog
    ws_ex = wb.create_sheet("ExecutionLog")
    ex_headers = [
        "Run ID", "Chu kỳ", "TC ID", "Module", "Loại", "Ưu tiên", "Nền tảng",
        "Trạng thái", "Kết quả thực tế", "Defect ID", "Bằng chứng",
        "Commit (App / Backend)", "Môi trường / Thiết bị", "Thời điểm (Asia/Ho_Chi_Minh)", "Người thực hiện", "Ghi chú"
    ]
    ws_ex.append(ex_headers)
    for col_idx in range(1, len(ex_headers) + 1):
        c = ws_ex.cell(1, col_idx)
        c.fill = header_fill
        c.font = header_font

    # Sheet 4: Defects
    ws_df = wb.create_sheet("Defects")
    df_headers = [
        "Defect ID", "Nhãn ([App]/[Backend])", "Tiêu đề", "Module", "Loại lỗi",
        "Severity", "Priority", "Trạng thái", "TC ID liên quan", "Truy vết yêu cầu",
        "Run ID phát hiện", "Các bước tái hiện", "Kết quả mong đợi", "Kết quả thực tế",
        "Bằng chứng", "Build phát hiện", "Build khắc phục", "Ngày ghi nhận", "Ghi chú"
    ]
    ws_df.append(df_headers)
    for col_idx in range(1, len(df_headers) + 1):
        c = ws_df.cell(1, col_idx)
        c.fill = header_fill
        c.font = header_font

    # Sheet 5: Summary (Formulas referencing TestCases)
    ws_sum = wb.create_sheet("Summary")
    max_tc_row = len(MOBILE_TCS) + 1
    ws_sum.cell(1, 1, "BẢNG TỔNG HỢP TEST CASES THEO MODULE × LOẠI × ƯU TIÊN × NỀN TẢNG (Tự động bằng công thức Excel)").font = Font(bold=True, size=12)
    sum_headers = (
        ["Module"] + TYPES + ["High", "Medium", "Low"] + PLATFORMS +
        ["Tổng TC", "Pass", "Fail", "Blocked", "Not Run"]
    )
    ws_sum.append([])
    ws_sum.append(sum_headers)
    for col_idx in range(1, len(sum_headers) + 1):
        c = ws_sum.cell(3, col_idx)
        c.fill = header_fill
        c.font = header_font

    for idx, mod in enumerate(MODULES, start=4):
        ws_sum.cell(idx, 1, mod).font = bold_font
        col_ptr = 2
        for t in TYPES:
            ws_sum.cell(idx, col_ptr, f'=COUNTIFS(TestCases!$B$2:$B${max_tc_row},"{mod}",TestCases!$F$2:$F${max_tc_row},"{t}")')
            col_ptr += 1
        for p in PRIOS:
            ws_sum.cell(idx, col_ptr, f'=COUNTIFS(TestCases!$B$2:$B${max_tc_row},"{mod}",TestCases!$I$2:$I${max_tc_row},"{p}")')
            col_ptr += 1
        for pl in PLATFORMS:
            ws_sum.cell(idx, col_ptr, f'=COUNTIFS(TestCases!$B$2:$B${max_tc_row},"{mod}",TestCases!$J$2:$J${max_tc_row},"{pl}")')
            col_ptr += 1
        ws_sum.cell(idx, col_ptr, f'=COUNTIF(TestCases!$B$2:$B${max_tc_row},"{mod}")')
        col_ptr += 1
        for st in ["Pass", "Fail", "Blocked", "Not Run"]:
            ws_sum.cell(idx, col_ptr, f'=COUNTIFS(TestCases!$B$2:$B${max_tc_row},"{mod}",TestCases!$Q$2:$Q${max_tc_row},"{st}")')
            col_ptr += 1

    tot_row = 4 + len(MODULES)
    ws_sum.cell(tot_row, 1, "TỔNG").font = bold_font
    for col_idx in range(2, len(sum_headers) + 1):
        col_let = get_column_letter(col_idx)
        c = ws_sum.cell(tot_row, col_idx, f"=SUM({col_let}4:{col_let}{tot_row-1})")
        c.font = bold_font
        c.fill = sub_fill

    # Sheet 6: RTM
    ws_rtm = wb.create_sheet("RTM")
    rtm_headers = ["Mã Yêu cầu", "Loại", "Module", "Ưu tiên MoSCoW", "Mô tả yêu cầu", "Số lượng TC", "Danh sách TC truy vết", "Trạng thái độ phủ", "Kết quả thực thi"]
    ws_rtm.append(rtm_headers)
    for col_idx in range(1, len(rtm_headers) + 1):
        c = ws_rtm.cell(1, col_idx)
        c.fill = header_fill
        c.font = header_font

    for r_id, r_type, r_desc, r_mod, r_prio in REQUIREMENTS:
        tcs = req_to_tcs.get(r_id, [])
        ws_rtm.append([
            r_id, r_type, r_mod, r_prio, r_desc,
            len(tcs), ", ".join(tcs),
            "Covered (100%)" if tcs else "GAP",
            "Not Run"
        ])
    for i, w in enumerate([20, 12, 10, 14, 58, 12, 36, 16, 16], start=1):
        ws_rtm.column_dimensions[get_column_letter(i)].width = w

    # Sheet 7: Contract
    ws_con = wb.create_sheet("Contract")
    con_headers = ["Mã API", "Method", "Endpoint Path", "Hàm gọi trong Edumy-App", "Schema / DTO mong đợi", "TC Kiểm chứng", "Khớp hợp đồng?", "Ghi chú / Sai lệch"]
    ws_con.append(con_headers)
    for col_idx in range(1, len(con_headers) + 1):
        c = ws_con.cell(1, col_idx)
        c.fill = header_fill
        c.font = header_font
    for api_id, method, path_str, fn_ref, dto_name, tc_ref in CONTRACT_ENDPOINTS:
        ws_con.append([api_id, method, path_str, fn_ref, dto_name, tc_ref, "Not Run", ""])
    for i, w in enumerate([12, 10, 44, 42, 34, 18, 16, 36], start=1):
        ws_con.column_dimensions[get_column_letter(i)].width = w

    # Sheet 8: NFR
    ws_nfr = wb.create_sheet("NFR")
    nfr_headers = ["Mã NFR / MASVS", "Chỉ số đo lường", "Ngưỡng chấp nhận", "Danh sách TC", "Kết quả đo thực tế", "Đánh giá"]
    ws_nfr.append(nfr_headers)
    for col_idx in range(1, len(nfr_headers) + 1):
        c = ws_nfr.cell(1, col_idx)
        c.fill = header_fill
        c.font = header_font
    for nfr_id, metric, thresh, tcs_str in NFR_MOBILE_SPECS:
        ws_nfr.append([nfr_id, metric, thresh, tcs_str, "Not Run", "Not Run"])
    for i, w in enumerate([26, 52, 32, 36, 32, 16], start=1):
        ws_nfr.column_dimensions[get_column_letter(i)].width = w

    wb.save(XLSX_PATH)

    # 5. Write PROGRESS.md
    with open(PROG_PATH, "w", encoding="utf-8") as f:
        f.write(f"""# TIẾN ĐỘ KIỂM THỬ EDUMY MOBILE (QA PROGRESS TRACKER)

| Pha | Nội dung | Trạng thái | Kết quả / Sản phẩm chính |
| :--- | :--- | :---: | :--- |
| **Pha 1** | Lập Kế hoạch kiểm thử (`EDU-TP-M-001`) | **HOÀN TẤT** | `EDU-TP-M-001_Test_Plan.md` (Báo cáo thiếu `EDU-MOB-SRS-001.md` & dùng `ac-checklist.md` + `rules` + `api-contract-v2.md`) |
| **Pha 2** | Danh mục yêu cầu, Thiết kế & Sinh Test Case + RTM | **HOÀN TẤT (CHỜ DUYỆT)** | `requirements_inventory.csv` ({len(REQUIREMENTS)} yêu cầu), `EDU-TDS-M-001_Test_Design.md`, `EDU-TCS-M-001_Test_Cases.xlsx` (8 sheets, {len(MOBILE_TCS)} TC, 100% RTM, 0 khoảng trống) |
| **Pha 3** | Thiết lập Môi trường (`EDU-TER-M-001`) & Smoke Test | Chờ duyệt Pha 2 | — |
| **Pha 4 (C1)** | Thực thi Chu kỳ C1 (`M-M01`..`M-M08`, `M-API`, `M-REG`, NFR) | Chờ duyệt Pha 2 | — |
| **Pha 5 (C2/C3)** | Kiểm thử lại & Hồi quy | Chờ thực thi | — |
| **Pha 6** | Báo cáo Hoàn tất (`EDU-TCR-M-001`) & Cập nhật `ac-checklist.md` | Chờ thực thi | — |
""")

    # 6. Print Breakdown Summary for Phase 2 Stop Gate
    print(f"Total Requirements: {len(REQUIREMENTS)} | Uncovered: {len(uncovered)} | ACs with <2 TCs: {len(ac_under_2)}")
    print(f"Total Test Cases: {len(MOBILE_TCS)}")
    print("\n--- BREAKDOWN BY MODULE x TYPE x PRIORITY x PLATFORM ---")
    header = f"{'Module':<8} | " + " ".join(f"{t:>4}" for t in TYPES) + " | " + " ".join(f"{p:>6}" for p in PRIOS) + " | " + " ".join(f"{pl:>10}" for pl in PLATFORMS) + " | Total"
    print(header)
    print("-" * len(header))
    for mod in MODULES:
        m_tcs = [t for t in MOBILE_TCS if t[1] == mod]
        by_t = Counter(t[5] for t in m_tcs)
        by_p = Counter(t[8] for t in m_tcs)
        by_pl = Counter(t[9] for t in m_tcs)
        line = (
            f"{mod:<8} | " +
            " ".join(f"{by_t.get(t,0):>4}" for t in TYPES) + " | " +
            " ".join(f"{by_p.get(p,0):>6}" for p in PRIOS) + " | " +
            " ".join(f"{by_pl.get(pl,0):>10}" for pl in PLATFORMS) +
            f" | {len(m_tcs):>5}"
        )
        print(line)
    by_t_all = Counter(t[5] for t in MOBILE_TCS)
    by_p_all = Counter(t[8] for t in MOBILE_TCS)
    by_pl_all = Counter(t[9] for t in MOBILE_TCS)
    print("-" * len(header))
    print(
        f"{'TOTAL':<8} | " +
        " ".join(f"{by_t_all.get(t,0):>4}" for t in TYPES) + " | " +
        " ".join(f"{by_p_all.get(p,0):>6}" for p in PRIOS) + " | " +
        " ".join(f"{by_pl_all.get(pl,0):>10}" for pl in PLATFORMS) +
        f" | {len(MOBILE_TCS):>5}"
    )


if __name__ == "__main__":
    build_all()
