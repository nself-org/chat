# nself-chat Refactor Plan (Private, Gitignored)

## 1) Purpose

Define an end-to-end, AI-executable migration plan to evolve `nself-chat` into a clean, durable monorepo shape:

```text
root/
├── backend/
└── frontend/
```

This plan is planning-only and is designed so a future agent can execute with minimal ambiguity.

## 2) Required Outcomes

1. Keep nSelf CLI as the backend infrastructure foundation.
2. Preserve ability to run nChat independently.
3. Preserve ability to integrate nChat into ecosystem deployments (`nself-family`, `nself-tv`).
4. Keep "code once, deploy everywhere" as the default engineering strategy.
5. Support platform-specific behavior/skins where required (especially iOS/Android push/background behavior).
6. Maintain strict test discipline:
- unit tests for every changed/new function/hook/lib/API handler
- 100 percent changed-file coverage (statements/branches/functions/lines)
- contract/integration/security tests for touched boundaries

## 3) Decision Summary (Recommended Architecture)

## 3.1 Backend Decision

Use public `backend/` in repo (not only gitignored local backend), plus gitignored local runtime state.

1. `backend/` stays versioned and public for reproducibility.
2. `.backend/` stays gitignored for local generated state/secrets.
3. `README` documents both local standalone mode and shared-backend ecosystem mode.

## 3.2 Frontend Decision

Use one unified `frontend/` workspace with app targets and shared packages:

```text
frontend/
├── apps/
│   ├── web/        # Next.js
│   ├── mobile/     # React Native (Expo)
│   └── desktop/    # Tauri wrapper + shared web/core packages
├── packages/
│   ├── core/       # domain models, use-cases, business logic
│   ├── api/        # typed API/GraphQL clients + SDK wrappers
│   ├── state/      # shared state contracts and sync primitives
│   ├── ui/         # reusable design tokens and component primitives
│   ├── config/     # shared lint/ts/build configs
│   └── testing/    # shared test utilities and fixtures
└── tooling/
```

Rationale:

1. Best balance of code reuse + native capability.
2. Better mobile background/push reliability than pure Capacitor for chat-critical behavior.
3. Preserves existing Next.js investment for web.
4. Allows platform-specific override layers without forking business logic.

## 3.3 Platform-Specific Override Model

Use layered UI and capability adapters:

1. `packages/core`: no platform code.
2. `packages/api`: no platform code.
3. `packages/state`: no platform code.
4. `packages/ui`: common primitives + token system.
5. Per-app adapters in each target app:
- `frontend/apps/mobile/src/adapters/ios/*`
- `frontend/apps/mobile/src/adapters/android/*`
- `frontend/apps/web/src/adapters/*`
- `frontend/apps/desktop/src/adapters/*`

Rule:

Platform overrides are allowed only for device APIs, OS UX conventions, and performance constraints. Core domain logic must remain shared.

## 4) Repo Target State

## 4.1 Target Root Tree

```text
nself-chat/
├── README.md
├── backend/
├── frontend/
├── docs/
├── .claude/              # gitignored agent planning/control
├── .backend/             # gitignored local nSelf runtime
├── package.json
├── pnpm-workspace.yaml
└── ...tooling files
```

## 4.2 Backend Target Tree

```text
backend/
├── apps/
├── services/
├── db/
│   ├── migrations/
│   ├── schemas/
│   └── seed/
├── hasura/
├── infra/
├── scripts/
└── docs/
```

## 4.3 Frontend Target Tree

```text
frontend/
├── apps/
│   ├── web/
│   ├── mobile/
│   └── desktop/
├── packages/
│   ├── core/
│   ├── api/
│   ├── state/
│   ├── ui/
│   ├── config/
│   └── testing/
├── tooling/
└── docs/
```

## 5) Migration Constraints (Non-Negotiable)

1. No feature freeze without explicit release note.
2. No schema/API breaking changes without versioned contract migration plan.
3. No untested moved code.
4. No partial cutover per app surface without adapter compatibility layer.
5. No secrets in repo (including temporary migration scripts).
6. Keep CI green at each migration slice.

## 6) Execution Strategy (Phased)

## Phase 0: Discovery and Freeze

1. Inventory current root folders and runtime commands.
2. Inventory all backend entry points and nSelf init/build dependencies.
3. Inventory frontend runtime surfaces (web/mobile/desktop/platforms).
4. Freeze current contracts (API schema snapshots, event schemas).
5. Define migration rollback points.

Done when:

1. inventory doc is complete
2. contract snapshots exist
3. rollback plan is approved
4. baseline test suite is passing

## Phase 1: Workspace Skeleton

1. Create `frontend/` with target subtrees.
2. Keep existing app code intact; add bridge scripts so old commands still work.
3. Introduce workspace package boundaries (`apps/*`, `packages/*`).
4. Wire root scripts to support both legacy and new paths during transition.

Done when:

1. both legacy and new command aliases work
2. no feature behavior changes shipped yet
3. CI runs in dual-mode (legacy + new skeleton)

## Phase 2: Shared Package Foundations

1. Extract domain models/use-cases into `frontend/packages/core`.
2. Extract typed API clients/contracts into `frontend/packages/api`.
3. Extract shared state logic into `frontend/packages/state`.
4. Extract reusable test fixtures into `frontend/packages/testing`.

Done when:

1. extracted packages have unit tests
2. changed-file coverage is 100 percent
3. legacy apps consume packages without regressions

## Phase 3: Web App Migration

1. Move current Next.js web app into `frontend/apps/web`.
2. Keep routing and SEO behavior stable.
3. Replace local relative imports with workspace package imports.
4. Validate auth/session, real-time messaging, and notifications behavior parity.

Done when:

1. web parity matrix passes
2. performance baseline unchanged or improved
3. no contract regressions

## Phase 4: Mobile Strategy Cutover (Expo RN)

1. Establish `frontend/apps/mobile` with Expo RN baseline.
2. Implement shared core/state/api package consumption.
3. Add push/background adapters (iOS/Android specific).
4. Implement platform-specific overrides for device-native capabilities.

Done when:

1. critical flows pass on iOS + Android
2. background/push behavior passes test matrix
3. shared logic coverage remains enforced

## Phase 5: Desktop Strategy Cutover (Tauri)

1. Establish `frontend/apps/desktop` with Tauri host.
2. Reuse shared core/api/state and UI system.
3. Add desktop-specific capability adapters (notifications/filesystem/deep links).
4. Validate IPC boundaries and security constraints.

Done when:

1. desktop core chat flows pass
2. Tauri security checklist passes
3. desktop packaging pipeline is reproducible

## Phase 6: UI System and Theme Layer

1. Create `frontend/packages/ui` token and primitive system.
2. Define base theme + brand override slots.
3. Add platform-specific style adapters for iOS/Android/desktop/web differences.
4. Prevent logic leakage into UI package.

Done when:

1. all apps use shared token system
2. theme override examples exist
3. visual regression tests are passing

## Phase 7: Backend Contract Hardening

1. Align backend contracts with extracted frontend packages.
2. Add/refresh schema versioning and migration checks.
3. Validate nSelf init/build/update flows for local and CI.
4. Add explicit standalone and shared-backend mode docs.

Done when:

1. contract compatibility tests pass
2. migration rollback tests pass
3. standalone/shared mode docs are complete

## Phase 8: CI/CD and Release Gate Hardening

1. Update CI to run per-surface test matrices (web/mobile/desktop/backend).
2. Enforce changed-file 100 percent coverage.
3. Enforce security scans (SAST/dependencies/secrets/infra).
4. Add release artifact checks for each app target.

Done when:

1. all gates block unsafe merges
2. flaky tests are triaged and policy-enforced
3. release candidate checklist is executable

## Phase 9: Legacy Path Removal and Final Cutover

1. Remove temporary bridge scripts and legacy import patterns.
2. Remove obsolete top-level app paths once parity is confirmed.
3. Finalize docs and onboarding around canonical `backend/frontend` model.
4. Lock repo conventions and add guardrails to prevent architecture drift.

Done when:

1. no legacy path dependencies remain
2. all tests and contract checks pass
3. full migration sign-off is recorded

## 7) Detailed Task/Ticket Matrix

## 7.1 PM-Level Tickets (Top Layer)

1. `NC-001` Architecture freeze and baseline inventory.
2. `NC-002` Workspace skeleton and compatibility shims.
3. `NC-003` Shared package extraction (`core/api/state/testing`).
4. `NC-004` Web app migration to `frontend/apps/web`.
5. `NC-005` Mobile app establishment in `frontend/apps/mobile`.
6. `NC-006` Desktop app establishment in `frontend/apps/desktop`.
7. `NC-007` Shared UI/token/theming system rollout.
8. `NC-008` Backend contract hardening and docs completion.
9. `NC-009` CI/CD release gate hardening.
10. `NC-010` Legacy cleanup and final cutover.

Each ticket must include:

1. scope paths
2. out-of-scope paths
3. dependencies
4. completion criteria
5. test plan
6. security impact
7. rollback strategy

## 7.2 Definition of Done (Per Ticket)

1. all ticket acceptance criteria met
2. all required tests added/updated
3. changed-file coverage = 100 percent
4. security and contract tests pass
5. docs updated in same change set
6. dual code review approved
7. dual QA pass recorded
8. residual risks documented

## 8) Testing Plan (Detailed)

## 8.1 Unit Tests

1. domain models and validation
2. reducers/state transitions
3. API client serialization/deserialization
4. adapter behavior per platform

## 8.2 Integration Tests

1. frontend package -> backend contract validation
2. auth/session refresh/reconnect behavior
3. message send/receive/order/read-state semantics
4. offline queue + resync behavior

## 8.3 E2E Tests

1. web critical user journeys
2. mobile critical user journeys (real device/simulator)
3. desktop critical user journeys
4. cross-device continuity (send on one, read on another)

## 8.4 Security Tests

1. token abuse (stale/replay/revoked)
2. unauthorized resource access
3. multi-tenant boundary abuse
4. secrets scan gate verification

## 9) Risk Register and Mitigation

1. Risk: migration stalls active feature delivery.
Mitigation: enforce short slices and compatibility shims.

2. Risk: mobile push/background regressions.
Mitigation: dedicated adapter tests and device matrix gate.

3. Risk: API contract drift during extraction.
Mitigation: schema snapshot tests + generated client contract checks.

4. Risk: package boundary violations.
Mitigation: lint rules and import boundary enforcement.

5. Risk: CI duration explosion.
Mitigation: changed-scope test partitioning with nightly full matrix.

## 10) Rollback Strategy

1. Keep legacy entry points until phase parity is proven.
2. Gate deletions to Phase 9 only.
3. Tag pre-cutover states and maintain reversible migration commits.
4. If major regression appears, revert to last parity tag and reopen only failed ticket scope.

## 11) Documentation Deliverables

1. root README architecture section rewrite (`backend/frontend` canonical)
2. frontend architecture doc (`apps + packages`)
3. backend contract doc (standalone/shared modes)
4. contributor guide for package boundaries and test obligations
5. release checklist for multi-target app builds

## 12) Final Recommendation

Proceed with:

1. public `backend/` + gitignored `.backend/`
2. unified `frontend/` workspace with `apps/*` and `packages/*`
3. Next.js (web) + Expo RN (mobile) + Tauri (desktop)
4. strict shared-core logic with platform adapter overrides

This delivers the clean root shape you want, keeps nSelf backend promotion strong, and supports "code once, deploy everywhere" without sacrificing native platform quality.
