import LessonDot from "../LessonDot";
import Icon from "@/components/Icon";
import { lessons, DAY_NAMES_SHORT } from "@/mocks/schedule";
import type { Lesson, MonthDay } from "@/types/schedule";

type MonthProps = {
    currentDate: Date;
    onLessonClick?: (lesson: Lesson) => void;
};

function getLessonsByDate(date: string): Lesson[] {
    return lessons.filter((l) => l.date === date);
}

function generateMonthGrid(currentDate: Date): MonthDay[] {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);

    // Monday-based offset
    let startDow = firstDay.getDay();
    if (startDow === 0) startDow = 7;
    const prefixDays = startDow - 1;

    const days: MonthDay[] = [];

    // Previous month days
    const prevMonthLast = new Date(year, month, 0);
    for (let i = prefixDays - 1; i >= 0; i--) {
        const d = prevMonthLast.getDate() - i;
        const dt = new Date(year, month - 1, d);
        const iso = dt.toISOString().slice(0, 10);
        days.push({
            day: d,
            month: "",
            year,
            isCurrentMonth: false,
            lessons: getLessonsByDate(iso),
        });
    }

    // Current month days
    for (let d = 1; d <= lastDay.getDate(); d++) {
        const dt = new Date(year, month, d);
        const iso = dt.toISOString().slice(0, 10);
        days.push({
            day: d,
            month: "",
            year,
            isCurrentMonth: true,
            lessons: getLessonsByDate(iso),
        });
    }

    // Fill remaining to complete grid (multiple of 7)
    const remaining = 7 - (days.length % 7);
    if (remaining < 7) {
        for (let d = 1; d <= remaining; d++) {
            const dt = new Date(year, month + 1, d);
            const iso = dt.toISOString().slice(0, 10);
            days.push({
                day: d,
                month: "",
                year,
                isCurrentMonth: false,
                lessons: getLessonsByDate(iso),
            });
        }
    }

    return days;
}

const Month = ({ currentDate, onLessonClick }: MonthProps) => {
    const monthDays = generateMonthGrid(currentDate);
    const today = currentDate.getDate();
    const currentMonth = currentDate.getMonth();
    const currentYear = currentDate.getFullYear();

    return (
    <div className="card">
        <div className="flex -mr-0.25 border-r border-n-1 dark:border-white/40">
            {DAY_NAMES_SHORT.map((name) => (
                <div
                    className="w-[calc(100%/7)] pt-5 px-3 pb-3 text-right text-xs font-bold md:text-center"
                    key={name}
                >
                    {name}
                </div>
            ))}
        </div>
        <div className="flex flex-wrap -mr-0.25">
            {monthDays.map((item, index) => (
                <div
                    className={`w-[calc(100%/7)] h-[8.125rem] pt-2 px-3 pb-4 border-r border-t border-n-1 lg:h-[7.6rem] md:h-[7.6rem] md:px-0 md:text-center dark:border-white/40 ${
                        item.isCurrentMonth &&
                        item.day === today
                            ? "bg-purple-3 dark:bg-purple-1/10"
                            : ""
                    }`}
                    key={index}
                >
                    <div
                        className={`mb-1 text-right text-sm font-medium md:text-center ${
                            item.isCurrentMonth
                                ? "text-n-1 dark:text-white"
                                : "text-n-3 dark:text-white/50"
                        }`}
                    >
                        {item.day}
                    </div>
                    {item.lessons &&
                        item.lessons
                            .slice(0, 2)
                            .map((lesson) => (
                                <LessonDot
                                    className="mb-1 lg:h-5 lg:bg-transparent lg:p-0 md:w-full md:h-6 md:mb-1 md:justify-center dark:lg:bg-transparent"
                                    classTitle="md:hidden"
                                    lesson={lesson}
                                    onClick={onLessonClick}
                                    key={lesson.id}
                                />
                            ))}
                    {item.lessons?.length > 2 && (
                        <button className="group inline-flex items-center mt-1 px-1 text-xs font-bold transition-colors hover:text-purple-1 lg:-ml-1 lg:px-0 md:text-0 md:mt-0.5 md:ml-0">
                            <Icon
                                className="mr-1 transition-colors dark:fill-white group-hover:fill-purple-1 md:mr-0"
                                name="dots-vertical"
                            />
                            <span className="lg:hidden">Ещё</span>
                        </button>
                    )}
                </div>
            ))}
        </div>
    </div>
    );
};

export default Month;
