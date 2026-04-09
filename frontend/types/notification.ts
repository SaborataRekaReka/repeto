export type NotificationType =
    | "payment_received"
    | "payment_overdue"
    | "lesson_reminder"
    | "lesson_cancelled"
    | "reschedule_requested"
    | "homework_submitted"
    | "booking_new"
    | "booking_confirmed"
    | "booking_rejected"
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
    bookingRequestId?: string;
    studentId?: string;
    lessonId?: string;
};
