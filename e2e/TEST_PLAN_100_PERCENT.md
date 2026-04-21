# Repeto E2E 100% Coverage Plan

## Goal
- Cover all business modules and all visible interactive controls.
- Validate that every user action has visible UI feedback.
- Validate tutor and student account interaction mechanics end-to-end.
- Validate state persistence after save/reload/session restart.
- Validate visual consistency with design baselines.
- Keep tests deterministic and traceable by scenario IDs.

## Definition Of 100%
- Module coverage: each page/flow from tutor app, public pages, auth, and student portal has E2E scenarios.
- Control coverage: every visible button, link-button, and checkbox on target routes is activated at least once.
- Effect coverage: each activation must cause one observable UI change.
- Persistence coverage: changed state is saved and stays after reload/new session.
- Cross-account coverage: tutor action appears in student account where expected.
- Visual consistency coverage: critical pages/components match approved visual baseline.
- Contract coverage: API constraints for critical business logic are validated through E2E API steps.

## Observable UI Effect Rules
- URL/path/hash changes.
- Dialog/popup opens or closes.
- Checkbox/aria state changes.
- Alert/toast appears.
- Section/tab selection state changes.

## Checkbox Quality Contract
- Works: checkbox changes checked/aria-checked state on interaction.
- Saves: persisted value is confirmed after explicit save (if required), reload, and fresh session.
- Looks consistent: checkbox size, spacing, label alignment, focus ring, and disabled style match design baseline.

## Cross-Account Interaction Contract (Tutor <-> Student)
- Invite/activate student account from tutor side is reflected in student auth flow.
- Booking created on public page appears in tutor notifications and can be confirmed/rejected.
- Confirmed booking side effects are visible in both sides where applicable (lesson/student linkage).
- Tutor updates to homework/payments/materials are validated through student-authenticated portal endpoints when OTP test-harness is available.
- Unlink/account guard scenarios are enforced for both account types.

## Execution Layers
1. Smoke Layer
- File: e2e/smoke.spec.ts
- Purpose: critical availability and route health.

2. Journey Layer
- File: e2e/journeys.spec.ts
- Purpose: main user workflows across all modules.

2.1 Interaction Coverage 80 Layer
- File: e2e/interaction-coverage-80.spec.ts
- Purpose: weighted interaction matrix for broad UI behavior coverage target (>=80% by risk-weight score).

3. Domain Deep Layer (EXT)
- File: e2e/ext.spec.ts
- Purpose: edge cases, negative paths, and business guardrails.

4. Control Contract Layer
- File: e2e/controls-contract.spec.ts
- Purpose: each visible button/checkbox has UI effect.

5. Cross-Account Sync Layer
- File: e2e/cross-account-sync.spec.ts
- Purpose: tutor->student and student->tutor visible state propagation.

6. Persistence Contract Layer
- File: e2e/persistence-contract.spec.ts
- Purpose: save/reload/new-session persistence for checkboxes and critical toggles.

7. Visual Consistency Layer
- Files: e2e/fullset-screenshots.spec.ts (capture), e2e/visual-consistency.spec.ts (assert gate)
- Purpose: detect UI drift against baseline snapshots on critical screens/components.

8. Real-World Chains Layer
- File: e2e/real-world-chains.spec.ts
- Purpose: full student+tutor lifecycle chains (booking/confirm/reschedule/late-cancel/homework/upload/multi-tutor switch).

## Coverage Map
- Auth and access: smoke + ext + controls-contract.
- Dashboard: smoke + journeys + controls-contract.
- Students and student card: journeys + ext + controls-contract.
- Schedule: smoke + journeys + ext + controls-contract.
- Finance: smoke + journeys + controls-contract.
- Payments: smoke + journeys + ext + controls-contract.
- Packages: smoke + journeys + ext + controls-contract.
- Files: smoke + journeys + ext + controls-contract.
- Notifications: smoke + journeys + ext + controls-contract.
- Settings: smoke + journeys + ext + controls-contract.
- Support: smoke + journeys + controls-contract.
- Public tutor + booking: smoke + journeys + ext + controls-contract.
- Student portal auth guards: smoke + ext.
- Tutor/student cross-account mechanics: ext + cross-account-sync.
- Checkbox persistence and save behavior: ext + persistence-contract.
- Design consistency: fullset-screenshots + visual-consistency.
- Real product chains: real-world-chains.

## Safety Policy For Full Control Sweep
- External links are skipped in control contract tests.
- Potentially destructive controls are skipped by safety regex in generic sweep.
- Destructive actions are covered in dedicated domain tests with cleanup in ext.spec.ts.

## Current Readiness Snapshot (Without Running)
- Implemented strict layers: smoke, journeys, ext, controls-contract, cross-account-sync, persistence-contract, visual-consistency.
- Implemented real-world layer: real-world-chains (requires test harness env).
- Visual note: first run of visual-consistency requires baseline snapshots initialization.
- Harness note: student-authenticated chains use non-production OTP harness endpoint and messenger outbox endpoint.
- Current status in this document is implementation readiness, not execution result.

## Run Order
1. npm run test:e2e:smoke
2. npm run test:e2e:journeys
3. npm run test:e2e:interaction80
4. npm run test:e2e:ext
5. npm run test:e2e:controls
6. npm run test:e2e:sync
7. npm run test:e2e:persistence
8. npm run test:e2e:visual
9. npm run test:e2e:realworld
10. Single strict gate command: npm run test:e2e:100
11. Full gate with real-world chains: npm run test:e2e:100:full
12. Optional core-only gate: npm run test:e2e:100:core
13. Visual baseline initialization (first run only): npm run test:e2e:visual:update

## Harness Environment (for real-world layer)
- `MESSENGER_TEST_MODE=record` (recommended for deterministic outbox assertions).
- `E2E_TEST_HARNESS_KEY=<secret>` and request header `x-test-harness-key`.
- Optional multi-tutor chain: `E2E_SECOND_TUTOR_EMAIL`, `E2E_SECOND_TUTOR_PASSWORD`.

## Exit Criteria
- All strict layers are green.
- No uncovered route from scope inventory.
- No control without visible UI effect in control-contract reports.
- No checkbox/toggle regression after reload/new session.
- No cross-account propagation mismatch for tutor/student mechanics.
- No unexpected visual diffs on approved baseline set.
- No uncleaned test data after EXT run.

## Reporting
- Keep TEST_COVERAGE_MATRIX.md aligned with implemented IDs.
- Keep controls-contract failures as blocking defects for UI feedback regressions.
- Treat persistence/cross-account/visual regressions as release blockers.
- Keep real user-chain mapping updated in e2e/REAL_WORLD_SCENARIOS_100.md.
