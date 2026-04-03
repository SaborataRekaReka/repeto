import LessonDot from "../LessonDot";
import { lessons } from "@/mocks/schedule";
import type { Lesson } from "@/types/schedule";

type DayProps = {
    currentDate: Date;
    onLessonClick?: (lesson: Lesson) => void;
};

const DAY_NAMES_FULL = [
    "Воскресенье", "Понедельник", "Вторник", "Среда",
    "Четверг", "Пятница", "Суббота",
];
const MONTH_NAMES_GEN = [
    "января", "февраля", "марта", "апреля", "мая", "июня",
    "июля", "августа", "сентября", "октября", "ноября", "декабря",
];

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

const Day = ({ currentDate, onLessonClick }: DayProps) => {
    const classTitleTime =
        "flex items-end justify-center w-12 h-8 py-0.5 border-b border-r border-n-1 text-sm font-medium dark:border-white/40";
    const classValueTime =
        "h-8 px-3 py-1 border-b border-r border-n-1 dark:border-white/40";

    // Time labels: 8:00–21:00
    const timeLabels: string[] = [];
    for (let h = 8; h <= 20; h++) {
        timeLabels.push(`${h}:00`);
        timeLabels.push("");
    }
    timeLabels.push("21:00");

    const iso = currentDate.toISOString().slice(0, 10);
    const dayLessons = lessons.filter((l) => l.date === iso);
    const hours = TIME_SLOTS.map((time) => ({
        time,
        lesson: dayLessons.find((l) => l.startTime === time),
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
