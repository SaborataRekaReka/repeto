export type LessonStatus =
    | "planned"
    | "completed"
    | "cancelled_student"
    | "cancelled_tutor"
    | "no_show";

export type LessonFormat = "online" | "offline";

export type SubjectColor = "purple" | "green" | "yellow";

export type Lesson = {
    id: string;
    studentName: string;
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
