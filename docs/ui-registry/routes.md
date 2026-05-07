# UI routes coverage

Generated: 2026-05-07T16:36:00.288Z

| Route | Elements |
|---|---:|
| /_app | 1 |
| /legal | 2 |
| /student | 6 |
| /student/setup | 8 |
| /students/{id} | 1 |
| /t/{slug}/book | 1 |
| /unknown | 1007 |

## Route runtime status

- Runtime incomplete: true
- Frontend is unreachable at http://localhost:3300. Start frontend on port 3300 and backend on port 3200, then rerun npm run ui-registry:runtime.

## Required groups overview

- global layout: sidebar navigation, bottom/mobile navigation, quick actions, profile menu, theme switcher, search
- dashboard widgets: TaskTiles, StatCards, InsightBanner, TodaySchedule, WeekSchedule, IncomeChart, ConversionRate, ExpiringPackages, ProfitBreakdown, DebtList, WeekLoad, LessonPanelV2
- students: list controls, create student, student card, filters/search
- schedule: create lesson, lesson dialog/panel, export, calendar controls
- finance: payments, packages, filters, create payment, create package
- files/materials: tabs, integration CTA, file links/actions
- notifications: tabs, filters, actions
- settings: section nav, theme buttons, switches/toggles, account/public profile/integrations/policies
- support: search, article links
- public tutor page: booking link, policy popup, reviews, certificates/lightbox
- booking wizard: options, continue buttons, calendar days, time slots, OTP/details steps
- auth: tutor sign-in, student sign-in, view switch controls