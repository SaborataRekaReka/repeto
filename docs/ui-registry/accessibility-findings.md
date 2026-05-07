# Accessibility findings

Generated: 2026-05-07T18:53:13.758Z

| severity | route | element | problem | source file | suggested fix | priority |
|---|---|---|---|---|---|---|
| high | /student | Loader | Interactive control without accessible name | frontend-gravity/pages/student/index.tsx | Add visible text or aria-label, and keep role semantics explicit | high (115) |
| high | /student/setup | Loader | Interactive control without accessible name | frontend-gravity/pages/student/setup.tsx | Add visible text or aria-label, and keep role semantics explicit | high (115) |
| medium | /student/setup | TextInput | Input without visible label/aria-label/placeholder | frontend-gravity/pages/student/setup.tsx | Add visible text or aria-label, and keep role semantics explicit | low (35) |
| high | /students/{id} | Loader | Interactive control without accessible name | frontend-gravity/pages/students/[id].tsx | Add visible text or aria-label, and keep role semantics explicit | high (115) |
| high | /t/{slug}/book | BookingPage | Interactive control without accessible name | frontend-gravity/pages/t/[slug]/book.tsx | Add visible text or aria-label, and keep role semantics explicit | high (115) |
| high | /unknown | Icon | Interactive control without accessible name | frontend-gravity/components/AnimatedSidebarIcon/index.tsx | Add visible text or aria-label, and keep role semantics explicit | high (138) |
| high | /unknown | button | Interactive control without accessible name | frontend-gravity/components/CardChart/index.tsx | Add visible text or aria-label, and keep role semantics explicit | high (138) |
| high | /unknown | Switch | Interactive control without accessible name | frontend-gravity/components/CreatePackageModal/index.tsx | Add visible text or aria-label, and keep role semantics explicit | high (130) |
| high | /unknown | Text | Interactive control without accessible name | frontend-gravity/components/CreatePaymentModal/index.tsx | Add visible text or aria-label, and keep role semantics explicit | high (138) |
| medium | /unknown | Select | Input without visible label/aria-label/placeholder | frontend-gravity/components/CreatePaymentModal/index.tsx | Add visible text or aria-label, and keep role semantics explicit | medium (58) |
| high | /unknown | Tooltip | Interactive control without accessible name | frontend-gravity/components/CreateStudentModal/index.tsx | Add visible text or aria-label, and keep role semantics explicit | high (138) |
| high | /unknown | Avatar | Interactive control without accessible name | frontend-gravity/components/GravityLayout/index.tsx | Add visible text or aria-label, and keep role semantics explicit | high (138) |
| high | /unknown | Link | Link without accessible name | frontend-gravity/components/Layout/Menu/index.tsx | Add visible text or aria-label, and keep role semantics explicit | high (138) |
| high | /unknown | Alert | Interactive control without accessible name | frontend-gravity/components/LessonPanelV2/index.tsx | Add visible text or aria-label, and keep role semantics explicit | high (138) |
| medium | /unknown | TextInput | Input without visible label/aria-label/placeholder | frontend-gravity/components/LessonPanelV2/index.tsx | Add visible text or aria-label, and keep role semantics explicit | medium (58) |
| high | /unknown | Link | Link without accessible name | frontend-gravity/components/Logo/index.tsx | Add visible text or aria-label, and keep role semantics explicit | high (138) |
| high | /unknown | Loader | Interactive control without accessible name | frontend-gravity/components/MaterialsPickerDialog/index.tsx | Add visible text or aria-label, and keep role semantics explicit | high (138) |
| medium | /unknown | Checkbox | Interactive control without accessible name | frontend-gravity/components/MaterialsPickerDialog/index.tsx | Add visible text or aria-label, and keep role semantics explicit | high (110) |
| high | /unknown | StudentAccessTab | Interactive control without accessible name | frontend-gravity/templates/Files/FilesPage/index.tsx | Add visible text or aria-label, and keep role semantics explicit | high (138) |
| high | /unknown | PillTabs | Interactive control without accessible name | frontend-gravity/templates/Finance/PackagesPage/index.tsx | Add visible text or aria-label, and keep role semantics explicit | high (138) |
| high | /unknown | DropdownMenu | Interactive control without accessible name | frontend-gravity/templates/Finance/PaymentsListPage/Row/index.tsx | Add visible text or aria-label, and keep role semantics explicit | high (138) |
| high | /unknown | GDropdownMenu | Interactive control without accessible name | frontend-gravity/templates/Landing/HomePage/index.tsx | Add visible text or aria-label, and keep role semantics explicit | high (138) |
| high | /unknown | Link | Link without accessible name | frontend-gravity/templates/Public/BookingPage/index.tsx | Add visible text or aria-label, and keep role semantics explicit | high (138) |
| medium | /unknown | input | Input without visible label/aria-label/placeholder | frontend-gravity/templates/Public/StudentPortalPage/HomeworkTab.tsx | Add visible text or aria-label, and keep role semantics explicit | medium (58) |
| high | /unknown | LessonsTab | Interactive control without accessible name | frontend-gravity/templates/Public/StudentPortalPage/index.tsx | Add visible text or aria-label, and keep role semantics explicit | high (138) |
| high | /unknown | HomeworkTab | Interactive control without accessible name | frontend-gravity/templates/Public/StudentPortalPage/index.tsx | Add visible text or aria-label, and keep role semantics explicit | high (138) |
| high | /unknown | MaterialsTab | Interactive control without accessible name | frontend-gravity/templates/Public/StudentPortalPage/index.tsx | Add visible text or aria-label, and keep role semantics explicit | high (138) |
| high | /unknown | PaymentTab | Interactive control without accessible name | frontend-gravity/templates/Public/StudentPortalPage/index.tsx | Add visible text or aria-label, and keep role semantics explicit | high (138) |
| medium | /unknown | SegmentedRadioGroup | Interactive control without accessible name | frontend-gravity/templates/Schedule/CalendarPage/AvailabilityEditor/index.tsx | Add visible text or aria-label, and keep role semantics explicit | high (110) |
| high | /unknown | ProfileTab | Interactive control without accessible name | frontend-gravity/templates/Students/StudentDetailPage/index.tsx | Add visible text or aria-label, and keep role semantics explicit | high (138) |
| high | /unknown | NotesTab | Interactive control without accessible name | frontend-gravity/templates/Students/StudentDetailPage/index.tsx | Add visible text or aria-label, and keep role semantics explicit | high (138) |
| high | /unknown | ActivityTab | Interactive control without accessible name | frontend-gravity/templates/Students/StudentDetailPage/index.tsx | Add visible text or aria-label, and keep role semantics explicit | high (138) |
| high | /auth?view=signin | a | Link without accessible name | runtime-dom | Add visible text or aria-label, and keep role semantics explicit | high (110) |
| high | /auth?view=student | a | Link without accessible name | runtime-dom | Add visible text or aria-label, and keep role semantics explicit | high (110) |
| high | /dashboard | a | Link without accessible name | runtime-dom | Add visible text or aria-label, and keep role semantics explicit | high (110) |
| high | /schedule | a | Link without accessible name | runtime-dom | Add visible text or aria-label, and keep role semantics explicit | high (110) |
| high | /finance | a | Link without accessible name | runtime-dom | Add visible text or aria-label, and keep role semantics explicit | high (110) |
| high | /payments | a | Link without accessible name | runtime-dom | Add visible text or aria-label, and keep role semantics explicit | high (110) |
| high | /packages | a | Link without accessible name | runtime-dom | Add visible text or aria-label, and keep role semantics explicit | high (110) |
| high | /files | a | Link without accessible name | runtime-dom | Add visible text or aria-label, and keep role semantics explicit | high (110) |
| high | /notifications | a | Link without accessible name | runtime-dom | Add visible text or aria-label, and keep role semantics explicit | high (110) |
| high | /settings | a | Link without accessible name | runtime-dom | Add visible text or aria-label, and keep role semantics explicit | high (110) |
| high | /support | a | Link without accessible name | runtime-dom | Add visible text or aria-label, and keep role semantics explicit | high (110) |
| high | /student | a | Link without accessible name | runtime-dom | Add visible text or aria-label, and keep role semantics explicit | high (110) |