# Accessibility findings

Generated: 2026-05-07T19:27:54.141Z

| severity | route | element | problem | source file | suggested fix | priority |
|---|---|---|---|---|---|---|
| high | /student | Loader | Interactive control without accessible name | frontend-gravity/pages/student/index.tsx | Add visible text or aria-label, and keep role semantics explicit | high (115) |
| high | /student/setup | Loader | Interactive control without accessible name | frontend-gravity/pages/student/setup.tsx | Add visible text or aria-label, and keep role semantics explicit | high (115) |
| medium | /student/setup | TextInput | Input without visible label/aria-label/placeholder | frontend-gravity/pages/student/setup.tsx | Add visible text or aria-label, and keep role semantics explicit | low (35) |
| high | /students/{id} | Loader | Interactive control without accessible name | frontend-gravity/pages/students/[id].tsx | Add visible text or aria-label, and keep role semantics explicit | high (115) |
| high | /t/{slug}/book | BookingPage | Interactive control without accessible name | frontend-gravity/pages/t/[slug]/book.tsx | Add visible text or aria-label, and keep role semantics explicit | high (115) |
| high | /shared | Icon | Interactive control without accessible name | frontend-gravity/components/AnimatedSidebarIcon/index.tsx | Add visible text or aria-label, and keep role semantics explicit | high (123) |
| high | /shared | button | Interactive control without accessible name | frontend-gravity/components/CardChart/index.tsx | Add visible text or aria-label, and keep role semantics explicit | high (123) |
| high | /shared | Switch | Interactive control without accessible name | frontend-gravity/components/CreatePackageModal/index.tsx | Add visible text or aria-label, and keep role semantics explicit | high (115) |
| high | /shared | Text | Interactive control without accessible name | frontend-gravity/components/CreatePaymentModal/index.tsx | Add visible text or aria-label, and keep role semantics explicit | high (123) |
| medium | /shared | Select | Input without visible label/aria-label/placeholder | frontend-gravity/components/CreatePaymentModal/index.tsx | Add visible text or aria-label, and keep role semantics explicit | medium (43) |
| high | /shared | Tooltip | Interactive control without accessible name | frontend-gravity/components/CreateStudentModal/index.tsx | Add visible text or aria-label, and keep role semantics explicit | high (123) |
| high | /shared | Avatar | Interactive control without accessible name | frontend-gravity/components/GravityLayout/index.tsx | Add visible text or aria-label, and keep role semantics explicit | high (123) |
| high | /shared | Link | Link without accessible name | frontend-gravity/components/Layout/Menu/index.tsx | Add visible text or aria-label, and keep role semantics explicit | high (123) |
| high | /shared | Alert | Interactive control without accessible name | frontend-gravity/components/LessonPanelV2/index.tsx | Add visible text or aria-label, and keep role semantics explicit | high (123) |
| medium | /shared | TextInput | Input without visible label/aria-label/placeholder | frontend-gravity/components/LessonPanelV2/index.tsx | Add visible text or aria-label, and keep role semantics explicit | medium (43) |
| high | /shared | Link | Link without accessible name | frontend-gravity/components/Logo/index.tsx | Add visible text or aria-label, and keep role semantics explicit | high (123) |
| high | /shared | Loader | Interactive control without accessible name | frontend-gravity/components/MaterialsPickerDialog/index.tsx | Add visible text or aria-label, and keep role semantics explicit | high (123) |
| medium | /shared | Checkbox | Interactive control without accessible name | frontend-gravity/components/MaterialsPickerDialog/index.tsx | Add visible text or aria-label, and keep role semantics explicit | high (95) |
| high | /shared | StudentAccessTab | Interactive control without accessible name | frontend-gravity/templates/Files/FilesPage/index.tsx | Add visible text or aria-label, and keep role semantics explicit | high (123) |
| high | /shared | PillTabs | Interactive control without accessible name | frontend-gravity/templates/Finance/PackagesPage/index.tsx | Add visible text or aria-label, and keep role semantics explicit | high (123) |
| high | /shared | DropdownMenu | Interactive control without accessible name | frontend-gravity/templates/Finance/PaymentsListPage/Row/index.tsx | Add visible text or aria-label, and keep role semantics explicit | high (123) |
| high | /shared | GDropdownMenu | Interactive control without accessible name | frontend-gravity/templates/Landing/HomePage/index.tsx | Add visible text or aria-label, and keep role semantics explicit | high (123) |
| high | /shared | Link | Link without accessible name | frontend-gravity/templates/Public/BookingPage/index.tsx | Add visible text or aria-label, and keep role semantics explicit | high (123) |
| medium | /shared | input | Input without visible label/aria-label/placeholder | frontend-gravity/templates/Public/StudentPortalPage/HomeworkTab.tsx | Add visible text or aria-label, and keep role semantics explicit | medium (43) |
| high | /shared | LessonsTab | Interactive control without accessible name | frontend-gravity/templates/Public/StudentPortalPage/index.tsx | Add visible text or aria-label, and keep role semantics explicit | high (123) |
| high | /shared | HomeworkTab | Interactive control without accessible name | frontend-gravity/templates/Public/StudentPortalPage/index.tsx | Add visible text or aria-label, and keep role semantics explicit | high (123) |
| high | /shared | MaterialsTab | Interactive control without accessible name | frontend-gravity/templates/Public/StudentPortalPage/index.tsx | Add visible text or aria-label, and keep role semantics explicit | high (123) |
| high | /shared | PaymentTab | Interactive control without accessible name | frontend-gravity/templates/Public/StudentPortalPage/index.tsx | Add visible text or aria-label, and keep role semantics explicit | high (123) |
| medium | /shared | SegmentedRadioGroup | Interactive control without accessible name | frontend-gravity/templates/Schedule/CalendarPage/AvailabilityEditor/index.tsx | Add visible text or aria-label, and keep role semantics explicit | high (95) |
| high | /shared | ProfileTab | Interactive control without accessible name | frontend-gravity/templates/Students/StudentDetailPage/index.tsx | Add visible text or aria-label, and keep role semantics explicit | high (123) |
| high | /shared | NotesTab | Interactive control without accessible name | frontend-gravity/templates/Students/StudentDetailPage/index.tsx | Add visible text or aria-label, and keep role semantics explicit | high (123) |
| high | /shared | ActivityTab | Interactive control without accessible name | frontend-gravity/templates/Students/StudentDetailPage/index.tsx | Add visible text or aria-label, and keep role semantics explicit | high (123) |
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