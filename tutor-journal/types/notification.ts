export type NotificationType =
    | "payment_received"
    | "payment_overdue"
    | "lesson_reminder"
    | "lesson_cancelled"
    | "homework_submitted"
    | "system";

export type Notification = {
    id: string;
    type: NotificationType;
    title: string;
    description: string;
    time: string;
    read: boolean;
    actionLabel?: string;
    actionUrl?: string;
};
