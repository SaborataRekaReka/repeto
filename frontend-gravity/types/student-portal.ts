export type PortalLesson = {
    id: string;
    date: string;
    dayOfWeek: string;
    time: string;
    subject: string;
    modality: "online" | "offline";
    price: number;
    status:
        | "upcoming"
        | "completed"
        | "cancelled"
        | "reschedule_pending"
        | "rescheduled";
    canCancelFree: boolean;
    rescheduleFrom?: string;
    rescheduleTo?: string;
};

export type StudentUpload = {
    id: string;
    name: string;
    size: string;
    uploadedAt: string;
    expiresAt: string;
    url: string;
};

export type PortalHomework = {
    id: string;
    task: string;
    due: string;
    done: boolean;
    attachments?: string[];
    linkedFiles?: PortalFile[];
    studentUploads?: StudentUpload[];
};

export type PortalPayment = {
    id: string;
    date: string;
    amount: number;
    method: string;
    status: "paid" | "pending";
};

export type PortalFile = {
    id: string;
    name: string;
    type: "file" | "folder";
    extension?: string;
    size?: string;
    cloudUrl: string;
    parentId: string | null;
    subject?: string;
    homeworkId?: string;
};

export type PortalPackage = {
    subject?: string;
    used: number;
    total: number;
    validUntil: string;
};

export type PortalBalanceOperation = {
    id: string;
    kind: "payment" | "lesson";
    direction: "credit" | "debit";
    amount: number;
    title: string;
    subtitle: string;
    occurredAt: string;
};

export type PortalCancelPolicy = {
    freeHours: number;
    lateCancelAction?: string;
    lateAction?: string;
    noShowAction?: string;
    lateCancelCost?: number;
};

export type RecentLesson = {
    id: string;
    date: string;
    time?: string;
    subject: string;
    modality?: "online" | "offline";
    status: string;
    price: number;
    rating?: number;
    feedback?: string;
};

export type PortalNotificationChannel = {
    connected: boolean;
    deepLink?: string;
};

export type PortalNotifications = {
    telegram?: PortalNotificationChannel;
    max?: PortalNotificationChannel;
};

export type PendingBooking = {
    id: string;
    subject: string;
    date: string;
    startTime: string;
    duration: number;
};

export type StudentPortalData = {
    studentName: string;
    studentPhone?: string;
    studentEmail?: string;
    studentAvatarUrl?: string | null;
    tutorName: string;
    tutorSlug: string;
    tutorPhone: string;
    tutorWhatsapp?: string;
    tutorAvatarUrl?: string;
    tutorRating?: number | string | null;
    tutorReviewsCount?: number;

    balance: number;
    ratePerLesson: number;
    package: PortalPackage | null;
    cancelPolicy: PortalCancelPolicy | null;
    preferredPaymentMethod?: string;
    paymentRequisites?: string | null;
    paymentRequisitesPreview?: string | null;
    paymentCardNumber?: string | null;
    paymentSbpPhone?: string | null;

    upcomingLessons: PortalLesson[];
    recentLessons: RecentLesson[];
    recentPayments: PortalPayment[];
    balanceOperations?: PortalBalanceOperation[];
    homework: PortalHomework[];
    files: PortalFile[];
    pendingBookings?: PendingBooking[];

    paymentUrl?: string;
    notifications?: PortalNotifications | null;
};
