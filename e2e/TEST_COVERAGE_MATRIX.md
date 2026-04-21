# E2E / Playwright Full Coverage Matrix (v2)

## Goal
- Rebuild UI E2E coverage from current product behavior (frontend + backend after major refactor).
- Split checks into `smoke` (critical availability) and `journeys` (business flows and interaction mechanics).
- Track scenarios by stable IDs so coverage can be expanded without losing traceability.

## Coverage Rules
- `SMK-*`: Fast critical path checks. Must pass on every PR.
- `JRN-*`: User journeys and interaction mechanics. Run on PR and nightly.
- `EXT-*`: Deep scenarios for full 100% target (edge cases, negative paths, integrations, policy behavior, portals).

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

## Extended Scenarios For 100% Target (Backlog)
- `EXT-AUTH-*`: Signup code verification, reset password, invalid credentials, expired token, payment return flow.
- `EXT-STUD-*`: Full create/edit/archive/unarchive, portal invite, unlink, notes CRUD, homework CRUD, lesson CRUD, debt filters.
- `EXT-SCHED-*`: Recurrence creation, cancel/no-show/reschedule transitions, calendar export (Google/Yandex), availability editor edge cases.
- `EXT-PAY-*`: Manual and linked payment creation, deletion permissions, method/status matrix, notifications side-effects.
- `EXT-PKG-*`: Public vs private packages full CRUD, discount rules, validity expiration behavior.
- `EXT-FILE-*`: Cloud sync, share modal, access revocation, provider switch, broken links.
- `EXT-NOTIF-*`: Booking/reschedule approve/reject actions and resulting state transitions.
- `EXT-SET-*`: Slug uniqueness, publish guards, public packages toggle persistence, integrations connect/disconnect.
- `EXT-PUBLIC-*`: Public page sections rendering by profile completeness, reviews modal, policy modal, certificate preview.
- `EXT-BOOK-*`: Full booking wizard: slot select, reminder channels, OTP verify, student portal login handoff.
- `EXT-PORTAL-*`: Student portal settings save, avatar upload, tab mechanics, tutor switching.
- `EXT-RESP-*`: Mobile navigation/fab/overlay behavior across core modules.
- `EXT-A11Y-*`: Keyboard navigation, focus traps, aria labels for dialogs and critical controls.

## Data & Environment Requirements
- Running frontend on `http://localhost:3300`.
- Running backend API behind `/api` proxy (default dev setup).
- Existing demo tutor account for automation login.
- At least one tutor slug available for public page checks.

## Execution Commands
- Smoke: `npm run test:e2e:smoke`
- Journeys: `npm run test:e2e:journeys`
- Full current suite: `npm run test:e2e`

