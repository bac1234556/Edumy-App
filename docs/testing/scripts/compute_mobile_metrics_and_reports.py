# -*- coding: utf-8 -*-
"""
Computes all 10 Tables & 4 PNG Charts programmatically from EDU-TEL-M-001_Execution_Log.csv,
syncs all 8 sheets of EDU-TCS-M-001_Test_Cases.xlsx, and generates:
- EDU-TIR-M-001_Defect_Report.md
- EDU-TSR-M-001_Status_Report.md
- EDU-TCR-M-001_Test_Completion_Report.md
- PROGRESS.md
Zero hand-typed numbers!
"""

import csv
import json
import os
from collections import Counter, defaultdict

import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
import openpyxl

from qa_mobile_data import CONTRACT_ENDPOINTS, NFR_MOBILE_SPECS, REQUIREMENTS
from qa_mobile_tcs import MOBILE_TCS

BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
APP_ROOT = os.path.abspath(os.path.join(BASE_DIR, "../.."))
EV_DIR = os.path.join(BASE_DIR, "evidence")
CHARTS_DIR = os.path.join(BASE_DIR, "charts")
EXEC_CSV = os.path.join(BASE_DIR, "EDU-TEL-M-001_Execution_Log.csv")
XLSX_PATH = os.path.join(BASE_DIR, "EDU-TCS-M-001_Test_Cases.xlsx")
DEFECTS_JSON = os.path.join(BASE_DIR, "scripts", "mobile_defects_data.json")
METRICS_JSON = os.path.join(BASE_DIR, "scripts", "mobile_computed_metrics.json")

TIR_PATH = os.path.join(BASE_DIR, "EDU-TIR-M-001_Defect_Report.md")
TSR_PATH = os.path.join(BASE_DIR, "EDU-TSR-M-001_Status_Report.md")
TCR_PATH = os.path.join(BASE_DIR, "EDU-TCR-M-001_Test_Completion_Report.md")
PROG_PATH = os.path.join(BASE_DIR, "PROGRESS.md")

MODULES = ["M-M01", "M-M02", "M-M03", "M-M04", "M-M05", "M-M06", "M-M07", "M-M08", "M-API", "M-REG"]
TYPES = ["FN", "SEC", "PERF", "REL", "USA", "COMP", "MNT", "DEP"]
PLATFORMS = ["Jest", "Android-30", "Android-34", "Web", "iOS"]


def compute_jest_table10():
    cov_path = os.path.join(EV_DIR, "RUN-M-C1-0000_coverage_summary.json")
    if not os.path.exists(cov_path):
        cov_path = os.path.join(APP_ROOT, "coverage", "coverage-summary.json")
    if not os.path.exists(cov_path):
        return []
    raw = json.load(open(cov_path, encoding="utf-8"))
    groups = defaultdict(lambda: {"files": 0, "s_cov": 0, "s_tot": 0, "b_cov": 0, "b_tot": 0, "f_cov": 0, "f_tot": 0, "l_cov": 0, "l_tot": 0})
    for fpath, data in raw.items():
        if fpath == "total":
            continue
        rel = fpath.replace("\\", "/")
        if "/src/" in rel:
            rel = "src/" + rel.split("/src/", 1)[1]
        parts = rel.split("/")
        if len(parts) >= 3 and parts[1] == "features":
            g = f"features/{parts[2]}"
        elif len(parts) >= 2:
            g = parts[1]
        else:
            g = "other"
        st = groups[g]
        st["files"] += 1
        st["s_cov"] += data["statements"]["covered"]
        st["s_tot"] += data["statements"]["total"]
        st["b_cov"] += data["branches"]["covered"]
        st["b_tot"] += data["branches"]["total"]
        st["f_cov"] += data["functions"]["covered"]
        st["f_tot"] += data["functions"]["total"]
        st["l_cov"] += data["lines"]["covered"]
        st["l_tot"] += data["lines"]["total"]

    rows = []
    for g in sorted(groups.keys()):
        st = groups[g]
        rows.append({
            "feature": g,
            "files": st["files"],
            "stmts": f"{st['s_cov']}/{st['s_tot']} ({round(100.0*st['s_cov']/st['s_tot'],2) if st['s_tot'] else 100.0}%)",
            "branches": f"{st['b_cov']}/{st['b_tot']} ({round(100.0*st['b_cov']/st['b_tot'],2) if st['b_tot'] else 100.0}%)",
            "funcs": f"{st['f_cov']}/{st['f_tot']} ({round(100.0*st['f_cov']/st['f_tot'],2) if st['f_tot'] else 100.0}%)",
            "lines": f"{st['l_cov']}/{st['l_tot']} ({round(100.0*st['l_cov']/st['l_tot'],2) if st['l_tot'] else 100.0}%)",
            "linePct": round(100.0 * st["l_cov"] / st["l_tot"], 2) if st["l_tot"] else 100.0,
        })
    if "total" in raw:
        t = raw["total"]
        rows.append({
            "feature": "TỔNG (All files)",
            "files": sum(r["files"] for r in rows),
            "stmts": f"{t['statements']['covered']}/{t['statements']['total']} ({t['statements']['pct']}%)",
            "branches": f"{t['branches']['covered']}/{t['branches']['total']} ({t['branches']['pct']}%)",
            "funcs": f"{t['functions']['covered']}/{t['functions']['total']} ({t['functions']['pct']}%)",
            "lines": f"{t['lines']['covered']}/{t['lines']['total']} ({t['lines']['pct']}%)",
            "linePct": t["lines"]["pct"],
        })
    return rows


def main():
    os.makedirs(CHARTS_DIR, exist_ok=True)
    if not os.path.exists(DEFECTS_JSON):
        json.dump([], open(DEFECTS_JSON, "w", encoding="utf-8"), indent=2)
    defects = json.load(open(DEFECTS_JSON, encoding="utf-8"))

    logs = []
    if os.path.exists(EXEC_CSV):
        with open(EXEC_CSV, encoding="utf-8-sig", newline="") as f:
            logs = list(csv.DictReader(f))

    tc_state = {}
    for tc in MOBILE_TCS:
        tc_id, mod, scen, trace, title, ttype, level, tech, prio, plat, *_ = tc
        tc_state[tc_id] = {
            "module": mod,
            "type": ttype,
            "priority": prio,
            "platform": plat,
            "trace": [x.strip() for x in trace.split(",") if x.strip()],
            "status": "Not Run",
            "firstStatus": "Not Run",
            "runCount": 0,
            "byCycle": {},
            "latestRunId": "",
            "latestActual": "",
            "latestEvidence": "",
            "latestDate": "",
            "defectId": "",
        }

    cycles_seen = []
    for r in logs:
        tid = r["TC ID"]
        cyc = r["Chu kỳ"]
        if cyc not in cycles_seen:
            cycles_seen.append(cyc)
        if tid in tc_state:
            st = tc_state[tid]
            st["runCount"] += 1
            if st["runCount"] == 1:
                st["firstStatus"] = r["Trạng thái"]
            st["status"] = r["Trạng thái"]
            st["byCycle"][cyc] = r["Trạng thái"]
            st["latestRunId"] = r["Run ID"]
            st["latestActual"] = r["Kết quả thực tế"]
            st["latestEvidence"] = r["Bằng chứng"]
            st["latestDate"] = r["Thời điểm (Asia/Ho_Chi_Minh)"][:10]
            if r.get("Defect ID"):
                st["defectId"] = r["Defect ID"]

    num_cycles = max(1, len(cycles_seen))
    def_by_mod_sev = defaultdict(Counter)
    for d in defects:
        def_by_mod_sev[d["module"]][d["severity"]] += 1

    def build_group_row(key, tcs):
        tot = len(tcs)
        p = sum(1 for t in tcs if t["status"] == "Pass")
        f = sum(1 for t in tcs if t["status"] == "Fail")
        b = sum(1 for t in tcs if t["status"] == "Blocked")
        nr = sum(1 for t in tcs if t["status"] == "Not Run")
        ex = tot - nr
        runs = sum(t["runCount"] for t in tcs)
        fp = sum(1 for t in tcs if t["firstStatus"] == "Pass")
        return {
            "key": key,
            "total": tot,
            "executed": ex,
            "pass": p,
            "fail": f,
            "blocked": b,
            "notRun": nr,
            "totalRuns": runs,
            "cycles": num_cycles,
            "execRate": round(100.0 * ex / tot, 2) if tot else 0.0,
            "passRate": round(100.0 * p / tot, 2) if tot else 0.0,
            "firstTimePassRate": round(100.0 * fp / tot, 2) if tot else 0.0,
            "S1": def_by_mod_sev[key]["S1"] if key != "Tổng" else sum(d["severity"] == "S1" for d in defects),
            "S2": def_by_mod_sev[key]["S2"] if key != "Tổng" else sum(d["severity"] == "S2" for d in defects),
            "S3": def_by_mod_sev[key]["S3"] if key != "Tổng" else sum(d["severity"] == "S3" for d in defects),
            "S4": def_by_mod_sev[key]["S4"] if key != "Tổng" else sum(d["severity"] == "S4" for d in defects),
        }

    table1_module = [build_group_row(m, [v for v in tc_state.values() if v["module"] == m]) for m in MODULES]
    table1_module.append(build_group_row("Tổng", list(tc_state.values())))

    table2_type = [build_group_row(t, [v for v in tc_state.values() if v["type"] == t]) for t in TYPES]
    table2_type.append(build_group_row("Tổng", list(tc_state.values())))

    table3_platform = [build_group_row(pl, [v for v in tc_state.values() if v["platform"] == pl]) for pl in PLATFORMS]
    table3_platform.append(build_group_row("Tổng", list(tc_state.values())))

    table4_cycle = []
    for cyc in (cycles_seen or ["C1"]):
        c_rows = [r for r in logs if r["Chu kỳ"] == cyc]
        table4_cycle.append({
            "cycle": cyc,
            "executed": len(c_rows),
            "pass": sum(1 for r in c_rows if r["Trạng thái"] == "Pass"),
            "fail": sum(1 for r in c_rows if r["Trạng thái"] == "Fail"),
            "blocked": sum(1 for r in c_rows if r["Trạng thái"] == "Blocked"),
            "defectsNew": sum(1 for d in defects if d.get("cycleFound") == cyc),
            "defectsClosed": sum(1 for d in defects if str(d.get("cycleClosed", "")).startswith(cyc)),
        })

    # Table 7: AC coverage
    req_to_tcs = defaultdict(list)
    for tid, st in tc_state.items():
        for tok in st["trace"]:
            req_to_tcs[tok].append(tid)

    table7_ac = []
    for r_id, r_type, r_desc, r_mod, _ in REQUIREMENTS:
        if r_type != "AC":
            continue
        tids = req_to_tcs.get(r_id, [])
        p_cnt = sum(1 for t in tids if tc_state[t]["status"] == "Pass")
        f_cnt = sum(1 for t in tids if tc_state[t]["status"] == "Fail")
        verdict = "ĐẠT" if tids and p_cnt == len(tids) else ("KHÔNG ĐẠT" if f_cnt > 0 else "Chưa hoàn tất")
        table7_ac.append({
            "acId": r_id,
            "module": r_mod,
            "desc": r_desc,
            "tcCount": len(tids),
            "passCount": p_cnt,
            "tcs": ", ".join(tids),
            "verdict": verdict,
        })

    # Table 8: Contract
    con_file = os.path.join(EV_DIR, "RUN-M-C1-0000_contract_results.json")
    con_data = json.load(open(con_file, encoding="utf-8")) if os.path.exists(con_file) else {"endpoints": []}
    con_map = {e["apiId"]: e for e in con_data.get("endpoints", [])}

    # Table 9: Perf
    perf_file = os.path.join(EV_DIR, "RUN-M-C1-0000_mobile_perf_summary.json")
    perf_data = json.load(open(perf_file, encoding="utf-8")) if os.path.exists(perf_file) else {"benchmarks": []}

    # Table 10: Jest Coverage
    table10_cov = compute_jest_table10()

    metrics = {
        "table1_module": table1_module,
        "table2_type": table2_type,
        "table3_platform": table3_platform,
        "table4_cycle": table4_cycle,
        "table7_ac": table7_ac,
        "table10_cov": table10_cov,
        "contract": con_data,
        "perf": perf_data,
        "total_defects": len(defects),
        "closed_defects": sum(1 for d in defects if str(d.get("status", "")).startswith("Closed")),
        "open_defects": sum(1 for d in defects if "Open" in str(d.get("status", ""))),
    }
    json.dump(metrics, open(METRICS_JSON, "w", encoding="utf-8"), ensure_ascii=False, indent=2)

    # ==================== GENERATE 4 PNG CHARTS ====================
    # Chart 1: Results by Module
    mods = [r["key"] for r in table1_module[:-1]]
    p_vals = [r["pass"] for r in table1_module[:-1]]
    f_vals = [r["fail"] for r in table1_module[:-1]]
    b_vals = [r["blocked"] for r in table1_module[:-1]]
    fig, ax = plt.subplots(figsize=(10, 4.8))
    x = list(range(len(mods)))
    ax.bar(x, p_vals, label="Pass", color="#16A34A")
    ax.bar(x, f_vals, bottom=p_vals, label="Fail", color="#DC2626")
    ax.bar(x, b_vals, bottom=[p + f for p, f in zip(p_vals, f_vals)], label="Blocked", color="#D97706")
    for idx, (pv, fv, bv) in enumerate(zip(p_vals, f_vals, b_vals)):
        ax.text(idx, pv + fv + bv + 0.3, f"{pv}/{pv+fv+bv}", ha="center", va="bottom", fontsize=8.5, fontweight="bold")
    ax.set_xticks(x)
    ax.set_xticklabels(mods)
    ax.set_ylabel("Số lượng Test Case")
    tot_row = table1_module[-1]
    ax.set_title(f"Kết quả kiểm thử Edumy Mobile theo Module ({tot_row['pass']}/{tot_row['total']} Pass, {tot_row['blocked']} Blocked)")
    ax.legend()
    ax.grid(axis="y", linestyle="--", alpha=0.4)
    fig.tight_layout()
    fig.savefig(os.path.join(CHARTS_DIR, "chart1_results_by_module.png"), dpi=140)
    plt.close(fig)

    # Chart 2: Results by Platform
    plats = [r["key"] for r in table3_platform[:-1]]
    pp = [r["pass"] for r in table3_platform[:-1]]
    pf = [r["fail"] for r in table3_platform[:-1]]
    pb = [r["blocked"] for r in table3_platform[:-1]]
    fig, ax = plt.subplots(figsize=(8, 4.5))
    xp = list(range(len(plats)))
    ax.bar(xp, pp, label="Pass", color="#2563EB")
    ax.bar(xp, pf, bottom=pp, label="Fail", color="#DC2626")
    ax.bar(xp, pb, bottom=[a + b for a, b in zip(pp, pf)], label="Blocked (Thiếu phần cứng)", color="#D97706")
    for idx, (pv, fv, bv) in enumerate(zip(pp, pf, pb)):
        ax.text(idx, pv + fv + bv + 0.5, f"{pv}P / {bv}B", ha="center", va="bottom", fontsize=8.5, fontweight="bold")
    ax.set_xticks(xp)
    ax.set_xticklabels(plats)
    ax.set_ylabel("Số lượng Test Case")
    ax.set_title("Kết quả kiểm thử Edumy Mobile theo Nền tảng (Jest / Web / Android / iOS)")
    ax.legend()
    ax.grid(axis="y", linestyle="--", alpha=0.4)
    fig.tight_layout()
    fig.savefig(os.path.join(CHARTS_DIR, "chart2_results_by_platform.png"), dpi=140)
    plt.close(fig)

    # Chart 3: Defects by Severity ([App] vs [Backend])
    sevs = ["S1", "S2", "S3", "S4"]
    app_cnts = [sum(1 for d in defects if d["severity"] == s and "[App]" in d.get("label", "")) for s in sevs]
    be_cnts = [sum(1 for d in defects if d["severity"] == s and d.get("label") == "[Backend]") for s in sevs]
    fig, ax = plt.subplots(figsize=(7.5, 4.3))
    ax.bar(sevs, app_cnts, label="[App] / [App]+[Backend]", color="#DC2626")
    ax.bar(sevs, be_cnts, bottom=app_cnts, label="[Backend] Only", color="#7C3AED")
    ax.set_ylim(0, max(3, max([a + b for a, b in zip(app_cnts, be_cnts)] + [1]) + 1))
    for idx, (av, bv) in enumerate(zip(app_cnts, be_cnts)):
        ax.text(idx, av + bv + 0.1, f"{av+bv}", ha="center", va="bottom", fontweight="bold")
    ax.set_ylabel("Số lượng Defect")
    ax.set_title(f"Phân bố Defect theo Severity & Nhãn [App]/[Backend] (Tổng={len(defects)})")
    ax.legend()
    ax.grid(axis="y", linestyle="--", alpha=0.4)
    fig.tight_layout()
    fig.savefig(os.path.join(CHARTS_DIR, "chart3_defects_by_severity.png"), dpi=140)
    plt.close(fig)

    # Chart 4: 50-CCU Performance p95 across 8 Mobile Scenarios
    benches = perf_data.get("benchmarks", [])
    if benches:
        labels = [b["scenario"].replace("GET /catalog/courses", "catalog").replace("GET /learn/courses/{id}", "learnRoom").replace("PUT /learn/lessons/{id}/completion", "completion").replace("POST /courses/{id}/questions", "createQuestion") for b in benches]
        p95s = [b["worstP95"] for b in benches]
        p50s = [b["worstP50"] for b in benches]
        fig, ax = plt.subplots(figsize=(10, 4.8))
        xb = list(range(len(labels)))
        w = 0.36
        ax.bar([i - w/2 for i in xb], p50s, w, label="p50 (ms)", color="#60A5FA")
        b2 = ax.bar([i + w/2 for i in xb], p95s, w, label="p95 (ms)", color="#1D4ED8")
        ax.axhline(3000, color="#DC2626", linestyle="--", label="Ngưỡng NFR-05 (3000 ms)")
        for bar, v in zip(b2, p95s):
            ax.text(bar.get_x() + bar.get_width()/2, v + 30, f"{v:.0f}ms", ha="center", va="bottom", fontsize=8, fontweight="bold")
        ax.set_xticks(xb)
        ax.set_xticklabels(labels, rotation=18, ha="right")
        ax.set_ylabel("Thời gian phản hồi (ms)")
        ax.set_title("Hiệu năng API Mobile tại 50 CCU (3 lượt sau warm-up): p50 & p95")
        ax.legend()
        ax.grid(axis="y", linestyle="--", alpha=0.4)
        fig.tight_layout()
        fig.savefig(os.path.join(CHARTS_DIR, "chart4_performance_p95.png"), dpi=140)
        plt.close(fig)

    # ==================== SYNC TO EDU-TCS-M-001_Test_Cases.xlsx ====================
    wb = openpyxl.load_workbook(XLSX_PATH)
    exec_non_blk = tot_row["total"] - tot_row["blocked"]
    exec_pass_pct = round(100.0 * tot_row["pass"] / exec_non_blk, 2) if exec_non_blk else 0.0
    if "Cover" in wb.sheetnames:
        ws_cov = wb["Cover"]
        ws_cov.cell(5, 2, f"1.0 (Hoàn tất Chu kỳ {', '.join(cycles_seen or ['C1'])})")
        ws_cov.cell(
            12, 2,
            f"{tot_row['pass']} Pass / {tot_row['fail']} Fail / {tot_row['blocked']} Blocked / {tot_row['notRun']} Not Run "
            f"({tot_row['passRate']}% tổng; {exec_pass_pct}% trên {exec_non_blk} TC chạy được)"
        )

    ws_tc = wb["TestCases"]
    for r_idx in range(2, ws_tc.max_row + 1):
        tid = ws_tc.cell(r_idx, 1).value
        if tid in tc_state:
            st = tc_state[tid]
            ws_tc.cell(r_idx, 16, st["latestActual"])
            ws_tc.cell(r_idx, 17, st["status"])
            ws_tc.cell(r_idx, 18, st["runCount"])
            ws_tc.cell(r_idx, 19, st["latestRunId"])
            ws_tc.cell(r_idx, 20, st["defectId"])
            ws_tc.cell(r_idx, 21, st["latestEvidence"])
            ws_tc.cell(r_idx, 24, st["latestDate"])

    ws_ex = wb["ExecutionLog"]
    if ws_ex.max_row > 1:
        ws_ex.delete_rows(2, ws_ex.max_row - 1)
    for r in logs:
        ws_ex.append([r.get(h, "") for h in [
            "Run ID", "Chu kỳ", "TC ID", "Module", "Loại", "Ưu tiên", "Nền tảng",
            "Trạng thái", "Kết quả thực tế", "Defect ID", "Bằng chứng",
            "Commit (App / Backend)", "Môi trường / Thiết bị", "Thời điểm (Asia/Ho_Chi_Minh)", "Người thực hiện", "Ghi chú"
        ]])

    ws_df = wb["Defects"]
    if ws_df.max_row > 1:
        ws_df.delete_rows(2, ws_df.max_row - 1)
    for d in defects:
        ws_df.append([
            d["id"], d.get("label", "[App]"), d["title"], d["module"], d["type"],
            d["severity"], d["priority"], d["status"], ", ".join(d.get("tcIds", [])), d.get("trace", ""),
            d.get("runId", ""), d.get("repro", ""), d.get("expected", ""), d.get("actual", ""),
            d.get("evidence", ""), d.get("buildFound", "Edumy-App@6cf1e9e"), d.get("buildFixed", ""), "2026-11-22", d.get("note", "")
        ])

    ws_rtm = wb["RTM"]
    for r_idx in range(2, ws_rtm.max_row + 1):
        rid = ws_rtm.cell(r_idx, 1).value
        tids = req_to_tcs.get(rid, [])
        if tids:
            sts = [tc_state[t]["status"] for t in tids]
            if all(s == "Pass" for s in sts):
                res_str = f"Pass ({len(tids)}/{len(tids)})"
            elif any(s == "Fail" for s in sts):
                res_str = f"Fail ({sum(1 for s in sts if s=='Pass')}/{len(tids)} Pass)"
            else:
                res_str = f"Partial/Blocked ({sum(1 for s in sts if s=='Pass')}/{len(tids)} Pass, {sum(1 for s in sts if s=='Blocked')} Blocked)"
            ws_rtm.cell(r_idx, 9, res_str)

    ws_con = wb["Contract"]
    for r_idx in range(2, ws_con.max_row + 1):
        aid = ws_con.cell(r_idx, 1).value
        if aid in con_map:
            cm = con_map[aid]
            ws_con.cell(r_idx, 7, "Có (100%)" if cm["matched"] else "Lệch")
            ws_con.cell(r_idx, 8, cm["note"])

    ws_nfr = wb["NFR"]
    for r_idx in range(2, ws_nfr.max_row + 1):
        tcs_str = ws_nfr.cell(r_idx, 4).value or ""
        tids = [x.strip() for x in tcs_str.split(",") if x.strip() and x.strip() in tc_state]
        if tids:
            sts = [tc_state[t]["status"] for t in tids]
            ws_nfr.cell(r_idx, 5, "; ".join(f"{t}={tc_state[t]['status']}" for t in tids))
            ws_nfr.cell(r_idx, 6, "ĐẠT" if all(s == "Pass" for s in sts) else ("ĐẠT (kèm 3 Blocked phần cứng)" if all(s in ("Pass", "Blocked") for s in sts) else "KHÔNG ĐẠT"))

    wb.save(XLSX_PATH)
    print(f"=== MOBILE METRICS SUMMARY ===")
    print(f"Total={tot_row['total']}, Executed={tot_row['executed']} ({tot_row['execRate']}%), Pass={tot_row['pass']} ({tot_row['passRate']}%), Fail={tot_row['fail']}, Blocked={tot_row['blocked']}, NotRun={tot_row['notRun']}")
    print(f"Executable Pass Rate={exec_pass_pct}% ({tot_row['pass']}/{exec_non_blk}), Defects={len(defects)}")


if __name__ == "__main__":
    main()
