# Interaction Coverage 80 Method (INT80)

## Goal
Reach at least 80% of business interaction coverage in real UI execution.

## Unit Of Coverage
Each interaction unit is tracked as:
Role x Route x State x Action x Observable Result

## Weighted Method
- P0 critical interaction: weight 5
- P1 important interaction: weight 3
- P2 supportive interaction: weight 1

Coverage score is calculated as:
Coverage% = (Sum(coveredWeights) / Sum(allWeights)) * 100

Target:
- Gate target: >= 80%

## Interaction Universe v1

| Unit ID | Priority | Weight | Interaction Unit | Covered by Scenario |
|---|---|---:|---|---|
| U01 | P0 | 5 | Auth entry switch tutor/student | INT80-CHAIN-001 |
| U02 | P0 | 5 | Unauthorized student portal redirect to auth | INT80-CHAIN-001 |
| U03 | P0 | 5 | Authenticated app shell navigation (core routes) | INT80-CHAIN-002 |
| U04 | P0 | 5 | Students filter/search/open-card workflow | INT80-CHAIN-002 |
| U05 | P0 | 5 | Schedule views/date navigation/create-lesson modal | INT80-CHAIN-002 |
| U06 | P0 | 5 | Settings section switching and account controls | INT80-CHAIN-004 |
| U07 | P0 | 5 | Public tutor profile to booking route transition | INT80-CHAIN-006 |
| U08 | P0 | 5 | Booking wizard rendering or explicit unavailable-state branch | INT80-CHAIN-006 |
| U09 | P0 | 5 | Persistence after reload/new browser context | BACKLOG (PERS) |
| U10 | P0 | 5 | Tutor-student cross-account sync propagation | BACKLOG (SYNC/RWC) |
| U11 | P1 | 3 | Dashboard widgets visibility contract | INT80-CHAIN-002 |
| U12 | P1 | 3 | Finance overview widgets/charts render | INT80-CHAIN-003 |
| U13 | P1 | 3 | Payments tabs/search/create modal | INT80-CHAIN-003 |
| U14 | P1 | 3 | Packages tabs/create modal | INT80-CHAIN-003 |
| U15 | P1 | 3 | Files section switch and integrations CTA branch | INT80-CHAIN-004 |
| U16 | P1 | 3 | Notifications tabs and mark-all action branch | INT80-CHAIN-004 |
| U17 | P1 | 3 | Support search to results/article path | INT80-CHAIN-005 |
| U18 | P1 | 3 | Route-level auth guard handling in UI | INT80-CHAIN-008 |
| U19 | P2 | 1 | Theme controls interaction | INT80-CHAIN-004 |
| U20 | P2 | 1 | Mobile nav/FAB interaction | BACKLOG (EXT-RESP) |
| U21 | P2 | 1 | Keyboard accessibility focus and dialog semantics | BACKLOG (EXT-A11Y) |

## Score Snapshot (v1)
- Total weight: 77
- Covered weight by INT80 pack: 65
- Coverage score: 84.4%

Result:
- Target >=80% is achieved by INT80 pack.

## Execution
- Headless: npm run test:e2e:interaction80
- Headed real UI: npm run test:e2e:interaction80:headed
- UI mode: npm run test:e2e:interaction80:ui

## Authoring Rules For New INT80 Scenarios
1. Give each scenario a stable ID: INT80-CHAIN-<NNN>.
2. Keep each scenario as a long story (8-20 user actions) that crosses route/module boundaries.
3. Assert UI outcome first (URL, modal, tab state, visible content).
4. Assert API outcome only where stable and business-critical.
5. Include skip branches for valid business states (no data/unavailable profile).
6. Keep scenarios non-destructive or use explicit cleanup.
