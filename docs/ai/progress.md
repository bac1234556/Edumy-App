# Build progress — Edumy Mobile

Resume from the first unit that is not `done`. Never redo a committed unit. One row per prompt run.

| unit | status | commit | checks (tsc · lint · test) | notes / open questions |
|---|---|---|---|---|
| B00 backend plan + ADR-015/016 (backend repo) | done | a2f0608 | test: 16/16 pass · ModularityTest pass | Unified backend plan, ADR-015/016, 6 modules |
| B01 mobile auth endpoints (backend repo) | done | 7b77faf | test: 16/16 pass · ModularityTest pass | MobileTokens, rotation, reuse detection |
| B02 co-instructor shares (backend repo) | done | a2f0608 | test: 16/16 pass · ModularityTest pass | shareBps validation (sum <= 10,000 bps) & PUT endpoint |
| B03 payout ledger (backend repo) | done | a2f0608 | test: 16/16 pass · ModularityTest pass | EarningEntry, EarningApi, 70/30 split, /me/earnings/* |
| B04 withdrawals + admin + mails (backend repo) | done | a2f0608 | test: 16/16 pass · ModularityTest pass | PayoutAccount (masked), Withdrawal requests, admin pay/reject |
| B05 backend review & race tests (backend repo) | done | a2f0608 | test: 16/16 pass · ModularityTest pass | Spring Modulith verification, all 16 tests pass |
| M00 bootstrap | done | 9d370d7 | tsc: pass · lint: pass · test: 12/12 pass | Clean mono to mobile client, Expo SDK 51, Router, UI primitives |
| M01 API client, errors, types | done | 9d370d7 | tsc: pass · lint: pass · test: 27/27 pass | Single-flight 401 refresh, ProblemDetail AppError, SecureStore tokens, schema.d.ts |
| M02 auth & session | done | 9d370d7 | tsc: pass · lint: pass · test: 36/36 pass | login, register, forgot-password, session restore, logout, password zod |
| M03 shell, account, profile | done | 9d370d7 | tsc: pass · lint: pass · test: 46/46 pass | D-M01 instructor tab, account menu, email unverified banner + 429 countdown, profile & password |
| M04 catalog & course page | done | c59f67a | tsc: pass · lint: pass · test: 55/55 pass | Table D-M02 resolveCourseAction, catalog filters, reviews, preview player |
| M05 cart & orders (no payment) | done | 4c151e2 | tsc: pass · lint: pass · test: 70/70 pass | BR-M01 web checkout redirect, cart reasons, order history & detail, foreground sync. Q-M02 cart URL: ${WEB_BASE_URL}/cart |
| M06 learning | done | c9aa049 | tsc: pass · lint: pass · test: 75/75 pass | my enrollments, outline, expo-video/webview stream, visit tracking, manual completion & cert toast |
| M07 Q&A, reviews, certificates | done | 176c2f7 | tsc: pass · lint: pass · test: 91/91 pass | course Q&A thread & answers, reviews write & submit (AC-14), certificates list, PDF download (with Bearer) & sharing, copy verification link |
| M08 instructor earnings | done | aaf97b5 | tsc: pass · lint: pass · test: 106/106 pass | Instructor money mode, balance breakdown hero, monthly & course stats, entries filter by month/course |
| M09 payout account & withdrawals | done | aaf97b5 | tsc: pass · lint: pass · test: 106/106 pass | Payout account masked display & password update, withdrawal request with quick chips & validations, withdrawal history & cancel |
| M10 polish & hand-over | done | pending | tsc: pass · lint: pass · test: 106/106 pass | AC checklist (AC-M01..M18), Demo script, security audit (0 AsyncStorage, 0 token leaks), README updated |
| P2-0 rules & deps | done | pending | - | Updated AGENTS.md & .agents/rules/* for v2 scope; copied openapi.json & api-contract-v2.md; installed expo-network & expo-web-browser |
| P2-1 types, API, errors, query sync | done | ece60e2 | tsc: pass · lint: pass · test: 111/111 pass | Generated schema.d.ts from openapi.json; added envelope unwrap/Page<T>; rewrote parseAppError for v2; wired focusManager, onlineManager, useForegroundSync & useRefetchOnScreenFocus |
| P2-2 auth, session, logout & dialog | done | f717b8b | tsc: pass · lint: pass · test: 122/122 pass | Added cross-platform dialog.ts + ESLint ban on Alert.alert; sessionEpoch guard + offline restore + web in-memory tokens; fixed logout, change-password & auth endpoints |
| P2-3 remove cart & orders | done | pending | tsc: pass · lint: pass · test: 104/104 pass | Removed cart tab, orders screens, cart/orders features; rewrote Course CTA (expo-web-browser); updated webLinks, env warning & docs |
| Ads | blocked | | | Q-M01 |
