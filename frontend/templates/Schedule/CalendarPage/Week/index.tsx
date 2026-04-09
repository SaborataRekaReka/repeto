import LessonDot from "../LessonDot";
import { toLocalDateKey } from "@/lib/dates";
import type { Lesson, WeekDay, WeekHourSlot } from "@/types/schedule";

type WeekProps = {
    currentDate: Date;
    onLessonClick?: (lesson: Lesson) => void;
    lessons?: Lesson[];
};

function normalizeTime(value: string) {
    return value.length === 4 ? `0${value}` : value;
}

function parseTimeToMinutes(value: string) {
    const [hh, mm] = normalizeTime(value).split(":").map(Number);
    return hh * 60 + mm;
}

function getTimeBounds(allLessons: Lesson[]) {
    const defaultStartHour = 8;
    const defaultEndHour = 21;

    if (allLessons.length === 0) {
        return { startHour: defaultStartHour, endHour: defaultEndHour };
    }

    const minStart = Math.min(...allLessons.map((l) => parseTimeToMinutes(l.startTime)));
    const maxEnd = Math.max(...allLessons.map((l) => parseTimeToMinutes(l.endTime)));

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

const SHORT_DAY_NAMES = ["Вс", "Пн", "Вт", "Ср", "Чт", "Пт", "Сб"];
const SHORT_MONTH_NAMES = [
    "янв", "фев", "мар", "апр", "май", "июн",
    "июл", "авг", "сен", "окт", "ноя", "дек",
];

function generateWeek(currentDate: Date, allLessons: Lesson[], timeSlots: string[]): WeekDay[] {
    const d = new Date(currentDate);
    const dow = d.getDay();
    const diff = dow === 0 ? -6 : 1 - dow;
    const monday = new Date(d);
    monday.setDate(d.getDate() + diff);

    const days: WeekDay[] = [];
    for (let i = 0; i < 7; i++) {
        const dt = new Date(monday);
        dt.setDate(monday.getDate() + i);
        const iso = toLocalDateKey(dt);
        const dayLessons = allLessons.filter((l) => l.date === iso);
        const label = `${SHORT_DAY_NAMES[dt.getDay()]}, ${dt.getDate()} ${SHORT_MONTH_NAMES[dt.getMonth()]}`;
        const hours: WeekHourSlot[] = timeSlots.map((time) => ({
            time,
            lesson: dayLessons.find((l) => normalizeTime(l.startTime) === time),
        }));
        days.push({ day: label, date: iso, hours });
    }
    return days;
}

const Week = ({ currentDate, onLessonClick, lessons = [] }: WeekProps) => {
    const classTitleTime =
        "flex items-end justify-center w-12 h-8 py-0.5 border-b border-r border-n-1 text-sm font-medium dark:border-white/40";
    const classValueTime =
        "h-8 px-3 py-1 border-b border-r border-n-1 lg:px-1 dark:border-white/40";

    const { startHour, endHour } = getTimeBounds(lessons);
    const timeSlots = generateTimeSlots(startHour, endHour);

    const timeLabels: string[] = [];
    for (let h = startHour; h < endHour; h++) {
        timeLabels.push(`${String(h).padStart(2, "0")}:00`);
        timeLabels.push(""); // half-hour — no label
    }
    timeLabels.push(`${String(endHour).padStart(2, "0")}:00`);

    const weekDays = generateWeek(currentDate, lessons, timeSlots);

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
