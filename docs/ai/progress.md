# Build progress — Edumy Mobile

Resume from the first unit that is not `done`. Never redo a committed unit. One row per prompt run.

| unit | status | commit | checks (tsc · lint · test) | notes / open questions |
|---|---|---|---|---|
| B00 backend plan + ADR-015/016 (backend repo) | todo | | | needs Q-M03 approval |
| B01 mobile auth endpoints (backend repo) | done | 7b77faf | test: 8/8 pass · ModularityTest pass | MobileTokens, rotation, reuse detection |
| M00 bootstrap | done | 9d370d7 | tsc: pass · lint: pass · test: 12/12 pass | Clean mono to mobile client, Expo SDK 51, Router, UI primitives |
| M01 API client, errors, types | done | pending | tsc: pass · lint: pass · test: 27/27 pass | Single-flight 401 refresh, ProblemDetail AppError, SecureStore tokens, schema.d.ts |
| M02 auth & session | done | pending | tsc: pass · lint: pass · test: 36/36 pass | login, register, forgot-password, session restore, logout, password zod |
| M03 shell, account, profile | todo | | | |
| M04 catalog & course page | todo | | | |
| M05 cart & orders (no payment) | todo | | | Q-M02 cart URL |
| M06 learning | todo | | | |
| M07 Q&A, reviews, certificates | todo | | | G-01 |
| B02 co-instructor shares (backend repo) | todo | | | |
| B03 payout ledger (backend repo) | todo | | | |
| B04 withdrawals + admin + mails (backend repo) | todo | | | |
| B05 backend review & race tests (backend repo) | todo | | | |
| M08 instructor earnings | todo | | | blocked by B03 |
| M09 payout account & withdrawals | todo | | | blocked by B04 |
| M10 polish & hand-over | todo | | | |
| Ads | blocked | | | Q-M01 |
