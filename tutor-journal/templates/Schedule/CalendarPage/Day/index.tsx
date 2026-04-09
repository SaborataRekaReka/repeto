import LessonDot from "../LessonDot";
import { toLocalDateKey } from "@/lib/dates";
import type { Lesson } from "@/types/schedule";

type DayProps = {
    currentDate: Date;
    onLessonClick?: (lesson: Lesson) => void;
    lessons?: Lesson[];
};

const DAY_NAMES_FULL = [
    "Воскресенье", "Понедельник", "Вторник", "Среда",
    "Четверг", "Пятница", "Суббота",
];
const MONTH_NAMES_GEN = [
    "января", "февраля", "марта", "апреля", "мая", "июня",
    "июля", "августа", "сентября", "октября", "ноября", "декабря",
];

function normalizeTime(value: string) {
    return value.length === 4 ? `0${value}` : value;
}

function parseTimeToMinutes(value: string) {
    const [hh, mm] = normalizeTime(value).split(":").map(Number);
    return hh * 60 + mm;
}

function getTimeBounds(dayLessons: Lesson[]) {
    const defaultStartHour = 8;
    const defaultEndHour = 21;

    if (dayLessons.length === 0) {
        return { startHour: defaultStartHour, endHour: defaultEndHour };
    }

    const minStart = Math.min(...dayLessons.map((l) => parseTimeToMinutes(l.startTime)));
    const maxEnd = Math.max(...dayLessons.map((l) => parseTimeToMinutes(l.endTime)));

    return {
        startHour: Math.min(defaultStartHour, Math.floor(minStart / 60)),
        endHour: Math.max(defaultEndHour, Math.ceil(maxEnd / 60)),
    };
}

function generateTimeSlots(startHour: number, endHour: number): string[] {
    const pad = (n: number) => String(n).padStart(2, "0");
    const slots: string[] = [];
    for (let h = startHour; h < endHour; h++) {
        slots.push(`${pad(h)}:00`);
        slots.push(`${pad(h)}:30`);
    }
    slots.push(`${pad(endHour)}:00`);
    return slots;
}

const Day = ({ currentDate, onLessonClick, lessons = [] }: DayProps) => {
    const classTitleTime =
        "flex items-end justify-center w-12 h-8 py-0.5 border-b border-r border-n-1 text-sm font-medium dark:border-white/40";
    const classValueTime =
        "h-8 px-3 py-1 border-b border-r border-n-1 dark:border-white/40";

    const iso = toLocalDateKey(currentDate);
    const dayLessons = lessons.filter((l) => l.date === iso);
    const { startHour, endHour } = getTimeBounds(dayLessons);
    const timeSlots = generateTimeSlots(startHour, endHour);

    const timeLabels: string[] = [];
    for (let h = startHour; h < endHour; h++) {
        timeLabels.push(`${String(h).padStart(2, "0")}:00`);
        timeLabels.push("");
    }
    timeLabels.push(`${String(endHour).padStart(2, "0")}:00`);

    const hours = timeSlots.map((time) => ({
        time,
        lesson: dayLessons.find((l) => normalizeTime(l.startTime) === time),
    }));

    const dayName = DAY_NAMES_FULL[currentDate.getDay()];
    const dayNum = currentDate.getDate();
    const monthName = MONTH_NAMES_GEN[currentDate.getMonth()];

    return (
        <div className="card">
            <div className="border-r border-b border-n-1 pt-5 px-3 pb-3 text-center text-xs font-bold -mr-0.25 dark:border-white/40">
                {dayName}, {dayNum} {monthName}
            </div>
            <div className="flex -mr-0.25 -mb-0.25">
                <div className="w-12">
                    {timeLabels.map((label, i) => (
                        <div className={classTitleTime} key={i}>
                            {label}
                        </div>
                    ))}
                </div>
                <div className="grow">
                    {hours.map((hour, i) => (
                        <div className={classValueTime} key={i}>
                            {hour.lesson && (
                                <LessonDot
                                    time={hour.lesson.startTime}
                                    lesson={hour.lesson}
                                    onClick={onLessonClick}
                                />
                            )}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default Day;
