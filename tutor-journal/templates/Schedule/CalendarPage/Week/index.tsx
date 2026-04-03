import LessonDot from "../LessonDot";
import { lessons } from "@/mocks/schedule";
import type { Lesson, WeekDay, WeekHourSlot } from "@/types/schedule";

type WeekProps = {
    currentDate: Date;
    onLessonClick?: (lesson: Lesson) => void;
};

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
const SHORT_DAY_NAMES = ["Вс", "Пн", "Вт", "Ср", "Чт", "Пт", "Сб"];
const SHORT_MONTH_NAMES = [
    "янв", "фев", "мар", "апр", "май", "июн",
    "июл", "авг", "сен", "окт", "ноя", "дек",
];

function generateWeek(currentDate: Date): WeekDay[] {
    const d = new Date(currentDate);
    const dow = d.getDay();
    const diff = dow === 0 ? -6 : 1 - dow;
    const monday = new Date(d);
    monday.setDate(d.getDate() + diff);

    const days: WeekDay[] = [];
    for (let i = 0; i < 7; i++) {
        const dt = new Date(monday);
        dt.setDate(monday.getDate() + i);
        const iso = dt.toISOString().slice(0, 10);
        const dayLessons = lessons.filter((l) => l.date === iso);
        const label = `${SHORT_DAY_NAMES[dt.getDay()]}, ${dt.getDate()} ${SHORT_MONTH_NAMES[dt.getMonth()]}`;
        const hours: WeekHourSlot[] = TIME_SLOTS.map((time) => ({
            time,
            lesson: dayLessons.find((l) => l.startTime === time),
        }));
        days.push({ day: label, date: iso, hours });
    }
    return days;
}

const Week = ({ currentDate, onLessonClick }: WeekProps) => {
    const classTitleTime =
        "flex items-end justify-center w-12 h-8 py-0.5 border-b border-r border-n-1 text-sm font-medium dark:border-white/40";
    const classValueTime =
        "h-8 px-3 py-1 border-b border-r border-n-1 lg:px-1 dark:border-white/40";

    // Time labels for left column: 8:00–21:00 (27 slots, labels on full hours)
    const timeLabels: string[] = [];
    for (let h = 8; h <= 20; h++) {
        timeLabels.push(`${h}:00`);
        timeLabels.push(""); // half-hour — no label
    }
    timeLabels.push("21:00");

    const weekDays = generateWeek(currentDate);

    return (
        <div className="card">
            <div className="flex pl-12 border-b border-n-1 dark:border-white/40">
                {weekDays.map((item) => (
                    <div
                        className="w-[calc(100%/7)] pt-5 px-3 pb-3 text-right text-xs font-bold md:px-2 md:text-center"
                        key={item.date}
                    >
                        {item.day}
                    </div>
                ))}
            </div>
            <div className="flex -mr-0.25 -mb-0.25">
                <div className="w-12">
                    {timeLabels.map((label, i) => (
                        <div className={classTitleTime} key={i}>
                            {label}
                        </div>
                    ))}
                </div>
                <div className="flex w-[calc(100%-3rem)]">
                    {weekDays.map((item) => (
                        <div className="w-[calc(100%/7)]" key={item.date}>
                            {item.hours.map((hour, i) => (
                                <div className={classValueTime} key={i}>
                                    {hour.lesson && (
                                        <LessonDot
                                            className="md:justify-center md:h-6 md:px-0"
                                            classTitle="md:hidden"
                                            lesson={hour.lesson}
                                            onClick={onLessonClick}
                                        />
                                    )}
                                </div>
                            ))}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default Week;
