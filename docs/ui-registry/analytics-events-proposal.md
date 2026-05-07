# Analytics events proposal

| Event name | Trigger |
|---|---|
| ui_click_sidebar_dashboard | Клик по сайдбару: Главное (/dashboard) |
| ui_click_sidebar_students | Клик по сайдбару: Ученики (/students) |
| ui_click_sidebar_schedule | Клик по сайдбару: Расписание (/schedule) |
| ui_click_sidebar_finance | Клик по сайдбару: Финансы (/finance) |
| ui_click_quick_create_student | Quick action: Добавить ученика |
| ui_click_quick_create_lesson | Quick action: Добавить занятие |
| ui_click_quick_create_payment | Quick action: Записать оплату |
| ui_click_quick_create_package | Quick action: Создать пакет |
| ui_submit_create_student | Submit создания ученика |
| ui_submit_create_lesson | Submit создания занятия |
| ui_submit_create_payment | Submit создания оплаты |
| ui_click_public_booking | Переход к публичному бронированию |
| ui_booking_select_option | Выбор предмета/пакета в booking wizard |
| ui_booking_select_time_slot | Выбор слота времени |
| ui_booking_continue | Нажатие Continue в booking wizard |
| ui_auth_switch_to_student | Переключение auth -> student view |
| ui_auth_switch_to_tutor | Переключение auth -> tutor view |
| ui_settings_toggle_changed | Изменение switch/toggle в settings |

Рекомендуемые common properties: route, area, widget, component, elementType, label, testId, isMobile.