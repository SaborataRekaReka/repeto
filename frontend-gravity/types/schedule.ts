export type LessonStatus =
    | "planned"
    | "completed"
    | "cancelled_student"
    | "cancelled_tutor"
    | "no_show"
    | "reschedule_pending";

export type LessonFormat = "online" | "offline";

export type SubjectColor = "purple" | "green" | "yellow";

export type Lesson = {
    id: string;
    studentId?: string;
    studentName: string;
    studentAccountId?: string | null;
    subject: string;
    date: string; // ISO date string YYYY-MM-DD
    startTime: string; // "15:00"
    endTime: string; // "16:00"
    duration: number; // minutes
    format: LessonFormat;
    status: LessonStatus;
    rate: number; // rubles
    color?: SubjectColor;
    notes?: string;
    reviewRating?: number;
    reviewFeedback?: string;
    hasReview?: boolean;
};

export type MonthDay = {
    day: number;
    month: string;
    year: number;
    isCurrentMonth: boolean;
    lessons: Lesson[];
};

export type WeekHourSlot = {
    time: string;
    lesson?: Lesson;
};

export type WeekDay = {
    day: string; // "Пн, 30 мар"
    date: string; // ISO date
    hours: WeekHourSlot[];
};
