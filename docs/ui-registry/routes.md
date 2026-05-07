# UI routes coverage

Generated: 2026-05-07T19:21:04.619Z

| Route | Elements |
|---|---:|
| /_app | 1 |
| /auth?view=signin | 12 |
| /auth?view=student | 8 |
| /dashboard | 12 |
| /files | 12 |
| /finance | 12 |
| /legal | 2 |
| /notifications | 12 |
| /packages | 12 |
| /payments | 12 |
| /schedule | 12 |
| /settings | 12 |
| /student | 14 |
| /student/setup | 8 |
| /students | 37 |
| /students/{id} | 1 |
| /support | 12 |
| /t/{slug}/book | 1 |
| /unknown | 1001 |

## Route runtime status

- Runtime incomplete: true
- Backend health check did not confirm availability at http://127.0.0.1:3200
- Authed runtime crawl could not authenticate with demo credentials/API
- Some routes failed: /t/{slug}, /t/{slug}/book

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