# Real-World 100% Scenarios Map

## Purpose
This document maps real user lifecycle scenarios to current E2E coverage and defines the practical path to full automation.

## Current Coverage Snapshot

1. Student creates booking request -> tutor sees notification -> tutor confirms.
- Status: Covered.
- Current tests: SYNC-BOOK-001, EXT-NOTIF-001, RWC-BOOK-001.

2. Student sees confirmed lesson in student portal after tutor confirmation.
- Status: Covered (non-production harness mode).
- Current tests: RWC-BOOK-001.

3. Student receives messenger notifications (Telegram/Max) for important events.
- Status: Covered for deterministic delivery intent.
- Current tests: RWC-BOOK-001 via `notifications/testing/messenger-outbox`.

4. Student requests reschedule -> tutor receives reschedule notification.
- Status: Covered (non-production harness mode).
- Current tests: RWC-BOOK-001.

5. Student cancels lesson -> tutor receives notification.
- Status: Covered (non-production harness mode).
- Current tests: RWC-BOOK-004.

6. Late cancellation creates debt/penalty according to policy.
- Status: Covered (non-production harness mode).
- Current tests: RWC-BOOK-004.

7. Tutor creates lesson with homework and materials -> student sees updates in portal.
- Status: Covered.
- Current tests: RWC-HW-001/002.

8. Student marks homework done and uploads homework materials.
- Status: Covered.
- Current tests: RWC-HW-001/002.

9. Same student has two tutors -> student can switch tutor context.
- Status: Covered with environment precondition.
- Current tests: RWC-MULTI-001 (requires `E2E_SECOND_TUTOR_EMAIL` and `E2E_SECOND_TUTOR_PASSWORD`).

## Harnesses Implemented
- Student OTP non-production harness:
  - `POST /api/student-auth/testing/issue-and-read-otp`
  - `GET /api/student-auth/testing/latest-otp`
  - guarded by `E2E_TEST_HARNESS_KEY` (header `x-test-harness-key`) when configured.
- Messenger deterministic outbox (non-production):
  - `GET /api/notifications/testing/messenger-outbox`
  - `DELETE /api/notifications/testing/messenger-outbox`
  - enable deterministic mode with `MESSENGER_TEST_MODE=record`.

## Recommended Automation Pattern

### Layer A: Business Chain E2E (primary)
Implemented in `e2e/real-world-chains.spec.ts`.

Implemented scenario IDs:
- RWC-BOOK-001: booking -> tutor notification -> confirm -> student portal lesson visible.
- RWC-BOOK-004: booking/lesson -> student cancels late -> lateCancelCharge/debt evidence.
- RWC-HW-001: tutor creates lesson/homework/materials -> student sees all in portal.
- RWC-HW-002: student completes homework + uploads file -> tutor receives HOMEWORK_SUBMITTED + file visible.
- RWC-MULTI-001: same student account linked to two tutors -> tutors list has two entries -> context switch works.

## Data Setup Practice (for reliable full flows)
- Use scenario seed factory per test:
  - create tutor A, optional tutor B,
  - create student with unique marker,
  - create required availability slots,
  - set cancel policy explicitly.
- Keep strict cleanup in finally blocks.
- Do not rely on shared demo state where scenario correctness matters.

## Definition of Done for Real-World 100%
All scenarios below are green:
- Booking/confirmation chain.
- Reschedule chain.
- Cancel/late-cancel debt chain.
- Homework/materials publish and submit chain.
- Multi-tutor student switching chain.
- Messenger intent verification chain.

## Execution Model
- Keep existing suites for fast feedback: smoke/journeys/ext/controls/sync/persistence/visual.
- Add nightly full chains job for real-world suite using `npm run test:e2e:realworld` or `npm run test:e2e:100:full`.
