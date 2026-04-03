import type { Notification, NotificationType } from "@/types/notification";

export const notifications: Notification[] = [
    {
        id: "n1",
        type: "payment_received",
        title: "Оплата получена",
        description: "Иванов Пётр оплатил 4 200 ₽ (СБП)",
        time: "5 мин назад",
        read: false,
    },
    {
        id: "n2",
        type: "lesson_reminder",
        title: "Занятие через 1 час",
        description: "Петрова Анна · Английский · 16:00",
        time: "1 час назад",
        read: false,
    },
    {
        id: "n3",
        type: "payment_overdue",
        title: "Просроченная оплата",
        description: "Кузнецова Мария · Долг 3 200 ₽",
        time: "2 часа назад",
        read: false,
        actionLabel: "Напомнить",
    },
    {
        id: "n4",
        type: "lesson_cancelled",
        title: "Занятие отменено",
        description: "Новиков Дмитрий отменил занятие 5 апреля",
        time: "Вчера",
        read: true,
    },
    {
        id: "n5",
        type: "payment_received",
        title: "Оплата получена",
        description: "Петрова Анна оплатила 3 600 ₽ (Наличные)",
        time: "Вчера",
        read: true,
    },
    {
        id: "n6",
        type: "homework_submitted",
        title: "ДЗ сдано",
        description: "Иванов Пётр сдал ДЗ по Математике",
        time: "Вчера",
        read: true,
    },
    {
        id: "n7",
        type: "lesson_reminder",
        title: "Занятие завтра",
        description: "Сидоров Максим · Физика · 10:00",
        time: "2 дня назад",
        read: true,
    },
    {
        id: "n8",
        type: "payment_overdue",
        title: "Просроченная оплата",
        description: "Козлова Дарья · Долг 2 200 ₽",
        time: "2 дня назад",
        read: true,
        actionLabel: "Напомнить",
    },
    {
        id: "n9",
        type: "system",
        title: "Обновление системы",
        description: "Добавлен экспорт данных в CSV",
        time: "3 дня назад",
        read: true,
    },
    {
        id: "n10",
        type: "payment_received",
        title: "Оплата получена",
        description: "Сидоров Максим оплатил 4 800 ₽ (СБП)",
        time: "4 дня назад",
        read: true,
    },
    {
        id: "n11",
        type: "lesson_cancelled",
        title: "Занятие отменено",
        description: "Козлова Дарья отменила занятие 1 апреля",
        time: "5 дней назад",
        read: true,
    },
    {
        id: "n12",
        type: "payment_received",
        title: "Оплата получена",
        description: "Новиков Дмитрий оплатил 2 100 ₽ (Перевод)",
        time: "5 дней назад",
        read: true,
    },
];

export function getNotificationIcon(type: NotificationType): string {
    switch (type) {
        case "payment_received":
            return "money-in";
        case "payment_overdue":
            return "info-circle";
        case "lesson_reminder":
            return "calendar";
        case "lesson_cancelled":
            return "close";
        case "homework_submitted":
            return "document";
        case "system":
            return "info-circle";
    }
}

export function getNotificationColor(type: NotificationType): string {
    switch (type) {
        case "payment_received":
            return "bg-green-2 dark:bg-green-1/20";
        case "payment_overdue":
            return "bg-pink-2 dark:bg-pink-1/20";
        case "lesson_reminder":
            return "bg-yellow-2 dark:bg-yellow-1/20";
        case "lesson_cancelled":
            return "bg-pink-2 dark:bg-pink-1/20";
        case "homework_submitted":
            return "bg-purple-2 dark:bg-purple-1/20";
        case "system":
            return "bg-n-4 dark:bg-white/10";
    }
}

export function getNotificationCategory(
    type: NotificationType
): "payments" | "schedule" | "other" {
    switch (type) {
        case "payment_received":
        case "payment_overdue":
            return "payments";
        case "lesson_reminder":
        case "lesson_cancelled":
            return "schedule";
        default:
            return "other";
    }
}
