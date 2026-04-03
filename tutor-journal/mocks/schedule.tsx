import type {
    Lesson,
    MonthDay,
    WeekDay,
    WeekHourSlot,
    SubjectColor,
} from "@/types/schedule";

// --- Subject colors ---
const subjectColors: Record<string, SubjectColor | undefined> = {
    Математика: "purple",
    Английский: "green",
    Физика: "yellow",
    "Русский язык": undefined,
};

// --- Lessons for April 2026 ---
export const lessons: Lesson[] = [
    // Week 1: March 30 – April 5
    {
        id: "1",
        studentName: "Иванов Пётр",
        subject: "Математика",
        date: "2026-03-31",
        startTime: "10:00",
        endTime: "11:00",
        duration: 60,
        format: "online",
        status: "completed",
        rate: 2100,
        color: "purple",
    },
    {
        id: "2",
        studentName: "Петрова Анна",
        subject: "Английский",
        date: "2026-03-31",
        startTime: "14:00",
        endTime: "15:00",
        duration: 60,
        format: "offline",
        status: "completed",
        rate: 1800,
        color: "green",
    },
    {
        id: "3",
        studentName: "Сидоров Максим",
        subject: "Физика",
        date: "2026-04-01",
        startTime: "09:00",
        endTime: "10:30",
        duration: 90,
        format: "online",
        status: "completed",
        rate: 2400,
        color: "yellow",
    },
    {
        id: "4",
        studentName: "Кузнецова Мария",
        subject: "Русский язык",
        date: "2026-04-01",
        startTime: "15:00",
        endTime: "16:00",
        duration: 60,
        format: "offline",
        status: "completed",
        rate: 1600,
    },
    {
        id: "5",
        studentName: "Иванов Пётр",
        subject: "Математика",
        date: "2026-04-02",
        startTime: "10:00",
        endTime: "11:00",
        duration: 60,
        format: "online",
        status: "completed",
        rate: 2100,
        color: "purple",
    },
    {
        id: "6",
        studentName: "Новиков Дмитрий",
        subject: "Математика",
        date: "2026-04-02",
        startTime: "16:00",
        endTime: "17:00",
        duration: 60,
        format: "online",
        status: "completed",
        rate: 2100,
        color: "purple",
    },
    {
        id: "7",
        studentName: "Петрова Анна",
        subject: "Английский",
        date: "2026-04-03",
        startTime: "14:00",
        endTime: "15:00",
        duration: 60,
        format: "offline",
        status: "planned",
        rate: 1800,
        color: "green",
    },
    {
        id: "8",
        studentName: "Иванов Пётр",
        subject: "Математика",
        date: "2026-04-03",
        startTime: "10:00",
        endTime: "11:00",
        duration: 60,
        format: "online",
        status: "planned",
        rate: 2100,
        color: "purple",
    },
    {
        id: "9",
        studentName: "Сидоров Максим",
        subject: "Физика",
        date: "2026-04-03",
        startTime: "16:00",
        endTime: "17:30",
        duration: 90,
        format: "online",
        status: "planned",
        rate: 2400,
        color: "yellow",
    },
    {
        id: "10",
        studentName: "Кузнецова Мария",
        subject: "Русский язык",
        date: "2026-04-04",
        startTime: "11:00",
        endTime: "12:00",
        duration: 60,
        format: "offline",
        status: "planned",
        rate: 1600,
    },
    // Week 2: April 6–12
    {
        id: "11",
        studentName: "Иванов Пётр",
        subject: "Математика",
        date: "2026-04-07",
        startTime: "10:00",
        endTime: "11:00",
        duration: 60,
        format: "online",
        status: "planned",
        rate: 2100,
        color: "purple",
    },
    {
        id: "12",
        studentName: "Петрова Анна",
        subject: "Английский",
        date: "2026-04-07",
        startTime: "14:00",
        endTime: "15:00",
        duration: 60,
        format: "offline",
        status: "planned",
        rate: 1800,
        color: "green",
    },
    {
        id: "13",
        studentName: "Новиков Дмитрий",
        subject: "Математика",
        date: "2026-04-09",
        startTime: "16:00",
        endTime: "17:00",
        duration: 60,
        format: "online",
        status: "planned",
        rate: 2100,
        color: "purple",
    },
    {
        id: "14",
        studentName: "Сидоров Максим",
        subject: "Физика",
        date: "2026-04-10",
        startTime: "09:00",
        endTime: "10:30",
        duration: 90,
        format: "online",
        status: "planned",
        rate: 2400,
        color: "yellow",
    },
    // Week 3: April 13–19
    {
        id: "15",
        studentName: "Кузнецова Мария",
        subject: "Русский язык",
        date: "2026-04-14",
        startTime: "15:00",
        endTime: "16:00",
        duration: 60,
        format: "offline",
        status: "planned",
        rate: 1600,
    },
    {
        id: "16",
        studentName: "Иванов Пётр",
        subject: "Математика",
        date: "2026-04-16",
        startTime: "10:00",
        endTime: "11:00",
        duration: 60,
        format: "online",
        status: "planned",
        rate: 2100,
        color: "purple",
    },
    {
        id: "17",
        studentName: "Петрова Анна",
        subject: "Английский",
        date: "2026-04-17",
        startTime: "14:00",
        endTime: "15:00",
        duration: 60,
        format: "offline",
        status: "planned",
        rate: 1800,
        color: "green",
    },
    // Week 4: April 20–26
    {
        id: "18",
        studentName: "Новиков Дмитрий",
        subject: "Математика",
        date: "2026-04-23",
        startTime: "16:00",
        endTime: "17:00",
        duration: 60,
        format: "online",
        status: "planned",
        rate: 2100,
        color: "purple",
    },
    {
        id: "19",
        studentName: "Сидоров Максим",
        subject: "Физика",
        date: "2026-04-24",
        startTime: "09:00",
        endTime: "10:30",
        duration: 90,
        format: "online",
        status: "planned",
        rate: 2400,
        color: "yellow",
    },
    {
        id: "20",
        studentName: "Кузнецова Мария",
        subject: "Русский язык",
        date: "2026-04-25",
        startTime: "11:00",
        endTime: "12:00",
        duration: 60,
        format: "offline",
        status: "planned",
        rate: 1600,
    },
];

// --- Helper: get lessons by date ---
function getLessonsByDate(date: string): Lesson[] {
    return lessons.filter((l) => l.date === date);
}

// --- Helper: short student name (Иванов Пётр → Иванов П.) ---
export function shortName(name: string): string {
    const parts = name.split(" ");
    if (parts.length >= 2) {
        return `${parts[0]} ${parts[1][0]}.`;
    }
    return name;
}

// --- Month data: March 30 – May 3 (5 weeks for April 2026) ---
// April 2026: 1st = Wednesday, 30 days
// Grid starts from Monday March 30, ends Sunday May 3
function generateMonthDays(): MonthDay[] {
    const days: MonthDay[] = [];

    // March 30-31 (Mon-Tue)
    for (let d = 30; d <= 31; d++) {
        days.push({
            day: d,
            month: "Март",
            year: 2026,
            isCurrentMonth: false,
            lessons: getLessonsByDate(`2026-03-${String(d).padStart(2, "0")}`),
        });
    }

    // April 1-30
    for (let d = 1; d <= 30; d++) {
        days.push({
            day: d,
            month: "Апрель",
            year: 2026,
            isCurrentMonth: true,
            lessons: getLessonsByDate(`2026-04-${String(d).padStart(2, "0")}`),
        });
    }

    // May 1-3 (Fri-Sun)
    for (let d = 1; d <= 3; d++) {
        days.push({
            day: d,
            month: "Май",
            year: 2026,
            isCurrentMonth: false,
            lessons: getLessonsByDate(`2026-05-${String(d).padStart(2, "0")}`),
        });
    }

    return days;
}

export const monthDays: MonthDay[] = generateMonthDays();

// --- Week data: March 30 – April 5 (current week) ---
// Time slots from 8:00 to 21:00 (26 half-hour slots)
function generateTimeSlots(): string[] {
    const slots: string[] = [];
    for (let h = 8; h <= 20; h++) {
        slots.push(`${h}:00`);
        slots.push(`${h}:30`);
    }
    slots.push("21:00");
    return slots;
}

const TIME_SLOTS = generateTimeSlots();

const weekDates = [
    { label: "Пн, 30 мар", date: "2026-03-30" },
    { label: "Вт, 31 мар", date: "2026-03-31" },
    { label: "Ср, 1 апр", date: "2026-04-01" },
    { label: "Чт, 2 апр", date: "2026-04-02" },
    { label: "Пт, 3 апр", date: "2026-04-03" },
    { label: "Сб, 4 апр", date: "2026-04-04" },
    { label: "Вс, 5 апр", date: "2026-04-05" },
];

function generateWeekDays(): WeekDay[] {
    return weekDates.map(({ label, date }) => {
        const dayLessons = getLessonsByDate(date);
        const hours: WeekHourSlot[] = TIME_SLOTS.map((time) => {
            const lesson = dayLessons.find((l) => l.startTime === time);
            return { time, lesson };
        });
        return { day: label, date, hours };
    });
}

export const weekDays: WeekDay[] = generateWeekDays();

// --- Day names ---
export const DAY_NAMES_SHORT = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];

// --- Month names ---
export const MONTH_NAMES = [
    "Январь",
    "Февраль",
    "Март",
    "Апрель",
    "Май",
    "Июнь",
    "Июль",
    "Август",
    "Сентябрь",
    "Октябрь",
    "Ноябрь",
    "Декабрь",
];
