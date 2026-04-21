# E2E / Playwright Full Coverage Matrix (v2)

## Goal
- Rebuild UI E2E coverage from current product behavior (frontend + backend after major refactor).
- Split checks into `smoke` (critical availability) and `journeys` (business flows and interaction mechanics).
- Track scenarios by stable IDs so coverage can be expanded without losing traceability.

## Coverage Rules
- `SMK-*`: Fast critical path checks. Must pass on every PR.
- `JRN-*`: User journeys and interaction mechanics. Run on PR and nightly.
- `INT80-*`: Weighted interaction scenarios targeting >=80% business interaction score.
- `EXT-*`: Deep scenarios for edge cases, negative paths, integrations, policy behavior, and portal guardrails.
- `CTRL-*`: Per-control contract checks: every visible button/checkbox must produce observable UI effect.
- `SYNC-*`: Cross-account tutor<->student state propagation checks.
- `PERS-*`: Save/reload/new-session persistence checks.
- `VIS-*`: Visual regression checks against approved baseline.
- `RWC-*`: Real-world full lifecycle chains across tutor/public/student accounts.

## Scope Inventory
- Authentication and access control
- Dashboard
- Students list and student card
- Schedule
- Finance overview
- Payments
- Packages
- Files and access sharing
- Notifications
- Settings
- Support center
- Public tutor page and booking
- Student portal
- Landing and auth entry points

See also: `e2e/REAL_WORLD_SCENARIOS_100.md` for full user-lifecycle chain coverage status.

## Smoke Scenarios (`e2e/smoke.spec.ts`)
- `SMK-AUTH-001`: Unauthorized tutor route redirects to auth entry.
- `SMK-AUTH-002`: Auth page renders and can switch between tutor/student sign-in views.
- `SMK-ROUTE-001`: `/dashboard` renders main dashboard shell.
- `SMK-ROUTE-002`: `/students` renders students overlay shell.
- `SMK-ROUTE-003`: `/schedule` renders schedule toolbar and create action.
- `SMK-ROUTE-004`: `/finance` renders finance overview widgets.
- `SMK-ROUTE-005`: `/payments` renders payments overlay shell.
- `SMK-ROUTE-006`: `/packages` renders packages overlay shell.
- `SMK-ROUTE-007`: `/files` renders files overlay shell.
- `SMK-ROUTE-008`: `/notifications` renders notifications toolbar.
- `SMK-ROUTE-009`: `/settings` renders settings layout.
- `SMK-ROUTE-010`: `/support` renders support home.
- `SMK-PUBLIC-001`: Public tutor page and booking page are reachable with current tutor slug.
- `SMK-STUDENT-001`: `/student` route requires student auth and redirects correctly.

## Journey Scenarios (`e2e/journeys.spec.ts`)
- `JRN-NAV-001`: App shell navigation works through current header/sidebar links.
- `JRN-STUD-001`: Students filters, search and open-card flow work.
- `JRN-STUD-002`: Student card tabs switch and preserve stable rendering.
- `JRN-SCHED-001`: Schedule view modes (month/week/day) and date navigation work.
- `JRN-SCHED-002`: Schedule create-lesson modal opens and closes.
- `JRN-PAY-001`: Payments tabs/search/create modal interaction works.
- `JRN-PKG-001`: Packages type/status tabs and create modal interaction work.
- `JRN-FILE-001`: Files tabs switch and cloud-connect empty-state branch is handled.
- `JRN-NOTIF-001`: Notifications tabs switch and bulk-read action branch is checked.
- `JRN-SET-001`: Settings section navigation and theme controls work.
- `JRN-SUP-001`: Support search to results and article navigation works.
- `JRN-PUBLIC-001`: Public tutor to booking transition works.

## Interaction Coverage 80 Scenarios (`e2e/interaction-coverage-80.spec.ts`)
- `INT80-CHAIN-001`: Auth gateway story (tutor/student switch + protected route guards).
- `INT80-CHAIN-002`: Tutor workday story (dashboard -> students -> student card -> schedule).
- `INT80-CHAIN-003`: Finance story (overview -> payments -> packages with create dialogs).
- `INT80-CHAIN-004`: Operations story (files -> notifications -> settings).
- `INT80-CHAIN-005`: Support story (search -> results/article -> return to dashboard).
- `INT80-CHAIN-006`: Public funnel story (public profile -> booking route branch).
- `INT80-CHAIN-007`: Quick actions story (dashboard add menu -> student/schedule flows).
- `INT80-CHAIN-008`: Session recovery story (cookie drop -> re-login -> continue work).

## Extended Scenarios (`e2e/ext.spec.ts`)
- `EXT-AUTH-001`: Auth negative/recovery paths, student OTP negative, invalid platform-payment completion.
- `EXT-STUD-001`: Students lifecycle, account link/unlink, notes CRUD, homework CRUD.
- `EXT-SCHED-001`: Recurrence creation and lesson status transition matrix.
- `EXT-SCHED-002`: Availability weekly slots and date overrides edge cases.
- `EXT-PAY-001`: Linked/manual payments, method matrix, invalid link guards.
- `EXT-PKG-001`: Private/public package flow and validity behavior on public profile.
- `EXT-FILE-001`: Sync branches and share/revoke checks.
- `EXT-NOTIF-001`: Booking confirm/reject and invalid reschedule action guards.
- `EXT-SET-001`: Slug/publish guards and settings persistence checks.
- `EXT-PUBLIC-001`: Public profile sections and dialogs.
- `EXT-BOOK-001`: Booking wizard until OTP step.
- `EXT-PORTAL-001`: Student portal OTP/auth guard paths.
- `EXT-RESP-001`: Mobile nav/FAB mechanics.
- `EXT-A11Y-001`: Keyboard and dialog semantics.

## Controls Contract Scenarios (`e2e/controls-contract.spec.ts`)
- `CTRL-DASH-001`: `/dashboard` every visible control has UI effect.
- `CTRL-STUD-001`: `/students` every visible control has UI effect.
- `CTRL-SCHED-001`: `/schedule` every visible control has UI effect.
- `CTRL-FIN-001`: `/finance` every visible control has UI effect.
- `CTRL-PAY-001`: `/payments` every visible control has UI effect.
- `CTRL-PKG-001`: `/packages` every visible control has UI effect.
- `CTRL-FILES-001`: `/files` every visible control has UI effect.
- `CTRL-NOTIF-001`: `/notifications` every visible control has UI effect.
- `CTRL-SET-001`: `/settings` every visible control has UI effect.
- `CTRL-SUP-001`: `/support` every visible control has UI effect.
- `CTRL-PUBLIC-001`: `/t/:slug` every visible control has UI effect.
- `CTRL-BOOK-001`: `/t/:slug/book` every visible control has UI effect.
- `CTRL-AUTH-001`: `/auth?view=signin` every visible control has UI effect.
- `CTRL-AUTH-002`: `/auth?view=student` every visible control has UI effect.
- `CTRL-CHECKBOX-001`: Every visible checkbox on `/settings` toggles state.

## Strict 100% Mandatory Layers

### Cross-Account Sync Scenarios (`e2e/cross-account-sync.spec.ts`)
- `SYNC-INVITE-001`: Tutor account invite/activate flow is reflected in student auth entry.
- `SYNC-BOOK-001`: Public booking appears in tutor notifications and transitions confirm/reject states.
- `SYNC-PORTAL-001`: Booking wizard handoff reaches OTP step and event is visible in tutor notifications.
- `SYNC-LINK-001`: Link/unlink account transitions are consistent on both account types.

### Persistence Scenarios (`e2e/persistence-contract.spec.ts`)
- `PERS-CHECKBOX-001`: Every settings checkbox persists after save + reload.
- `PERS-CHECKBOX-002`: Checkbox states persist after new browser context/session.
- `PERS-TOGGLE-001`: Critical account toggle `showPublicPackages` persists across API/UI reload and fresh session.

### Visual Consistency Scenarios (`e2e/visual-consistency.spec.ts`)
- `VIS-DESKTOP-001`: Critical desktop routes match baseline snapshots.
- `VIS-MOBILE-001`: Critical mobile routes match baseline snapshots.
- `VIS-COMPONENT-001`: Core controls (checkboxes, buttons, tab groups, dialogs) match baseline styling/states.

### Real-World Chains (`e2e/real-world-chains.spec.ts`)
- `RWC-BOOK-001`: Booking -> tutor confirms -> student sees lesson in portal -> student reschedules -> tutor receives reschedule request.
- `RWC-BOOK-004`: Student late-cancels lesson -> lateCancelCharge is recorded -> tutor gets cancellation notification.
- `RWC-HW-001/002`: Tutor creates lesson+homework(+materials if available) -> student sees homework -> marks done and uploads file -> tutor gets HOMEWORK_SUBMITTED.
- `RWC-MULTI-001`: One student account linked to two tutors and tutor switching list is visible in portal (requires second tutor credentials).

## Readiness Snapshot (Without Running)
- Implemented executable layers: `SMK`, `JRN`, `EXT`, `CTRL`, `SYNC`, `PERS`, `VIS`.
- Implemented executable real-world layer: `RWC`.
- Visual snapshot note: `VIS-*` assertions require initialized baseline snapshots on first run.
- This snapshot tracks implementation state, not green execution state.

## Data & Environment Requirements
- Running frontend on `http://localhost:3300`.
- Running backend API behind `/api` proxy (default dev setup).
- Existing demo tutor account for automation login.
- At least one tutor slug available for public page checks.
- For deterministic messenger checks: `MESSENGER_TEST_MODE=record`.
- For OTP harness access: `E2E_TEST_HARNESS_KEY` (+ `x-test-harness-key` header in tests).
- For `RWC-MULTI-001`: `E2E_SECOND_TUTOR_EMAIL` and `E2E_SECOND_TUTOR_PASSWORD`.

## Execution Commands
- Smoke: `npm run test:e2e:smoke`
- Journeys: `npm run test:e2e:journeys`
- Interaction 80: `npm run test:e2e:interaction80`
- Interaction 80 headed: `npm run test:e2e:interaction80:headed`
- Interaction 80 UI mode: `npm run test:e2e:interaction80:ui`
- Extended: `npm run test:e2e:ext`
- Controls contract: `npm run test:e2e:controls`
- Cross-account sync: `npm run test:e2e:sync`
- Persistence: `npm run test:e2e:persistence`
- Visual consistency: `npm run test:e2e:visual`
- Visual baseline init: `npm run test:e2e:visual:update`
- Real-world chains: `npm run test:e2e:realworld`
- 100% core gate: `npm run test:e2e:100:core`
- 100% gate: `npm run test:e2e:100`
- 100% full gate (with real-world): `npm run test:e2e:100:full`
- Full current suite: `npm run test:e2e`

