import Link from "next/link";
import { useWeekLessons } from "@/hooks/useDashboard";
import { shortName } from "@/mocks/schedule";
import type { Lesson } from "@/types/schedule";

const dayNames = ["Вс", "Пн", "Вт", "Ср", "Чт", "Пт", "Сб"];

const subjectColor = (subject: string) => {
    const s = subject.toLowerCase();
    if (s.includes("математ")) return "border-purple-1 bg-purple-3 text-n-1";
    if (s.includes("физик")) return "border-green-1 bg-green-2 text-n-1";
    if (s.includes("русс")) return "border-yellow-1 bg-yellow-2 text-n-1";
    if (s.includes("англ")) return "border-pink-1 bg-pink-2 text-n-1";
    return "border-n-4 bg-n-4/30 text-n-1 dark:border-white/20 dark:bg-white/10 dark:text-white";
};

const dotColor = (subject: string) => {
    const s = subject.toLowerCase();
    if (s.includes("математ")) return "bg-purple-1";
    if (s.includes("физик")) return "bg-green-1";
    if (s.includes("русс")) return "bg-yellow-1";
    if (s.includes("англ")) return "bg-pink-1";
    return "bg-n-3";
};

type Props = {
    onLessonClick: (lesson: Lesson) => void;
};

const WeekSchedule = ({ onLessonClick }: Props) => {
    const { data: lessons = [], loading } = useWeekLessons();

    const grouped = lessons.reduce<Record<string, Lesson[]>>((acc, l) => {
        (acc[l.date] ??= []).push(l);
        return acc;
    }, {});

    const days = Object.keys(grouped).sort();

    return (
        <div className="card">
            <div className="card-head">
                <div className="mr-auto text-h6">Занятия на неделю</div>
                <Link
                    href="/schedule"
                    className="text-xs font-bold transition-colors hover:text-purple-1"
                >
                    Расписание →
                </Link>
            </div>
            {loading ? (
                <div className="px-5 py-10 text-center text-n-3">
                    Загрузка...
                </div>
            ) : days.length === 0 ? (
                <div className="px-5 py-10 text-center text-xs font-medium text-n-3 dark:text-white/50">
                    На ближайшую неделю занятий нет
                </div>
            ) : (
                <div>
                    {days.map((date, dayIdx) => {
                        const d = new Date(date + "T00:00:00");
                        const dayLabel = `${dayNames[d.getDay()]}, ${d.getDate()} ${d.toLocaleDateString("ru-RU", { month: "short" })}`;
                        const isToday =
                            date === new Date().toISOString().slice(0, 10);

                        return (
                            <div
                                key={date}
                                className={
                                    dayIdx > 0
                                        ? "border-t border-n-1 dark:border-white"
                                        : ""
                                }
                            >
                                <div
                                    className={`flex items-center gap-2 px-4 py-2 ${
                                        isToday
                                            ? "bg-purple-3 dark:bg-purple-1/15"
                                            : ""
                                    }`}
                                >
                                    <span
                                        className={`text-xs font-bold uppercase tracking-wider ${
                                            isToday
                                                ? "text-purple-1"
                                                : "text-n-3 dark:text-white/50"
                                        }`}
                                    >
                                        {isToday ? "Сегодня" : dayLabel}
                                    </span>
                                    {isToday && (
                                        <span className="w-1.5 h-1.5 rounded-full bg-purple-1 animate-pulse" />
                                    )}
                                </div>

                                {grouped[date].map((lesson) => (
                                    <button
                                        key={lesson.id}
                                        className="flex items-center w-full px-4 py-2.5 border-t border-n-4/50 transition-colors hover:bg-background text-left dark:border-white/10 dark:hover:bg-white/5"
                                        onClick={() =>
                                            onLessonClick(lesson)
                                        }
                                    >
                                        <div
                                            className={`shrink-0 w-1.5 h-1.5 rounded-full mr-3 ${dotColor(
                                                lesson.subject
                                            )}`}
                                        />
                                        <div className="grow min-w-0">
                                            <div className="flex justify-between items-center mb-0.5">
                                                <span className="text-sm font-bold truncate">
                                                    {shortName(
                                                        lesson.studentName
                                                    )}
                                                </span>
                                                <span className="shrink-0 ml-2 text-xs tabular-nums text-n-3 dark:text-white/50">
                                                    {lesson.startTime} –{" "}
                                                    {lesson.endTime}
                                                </span>
                                            </div>
                                            <span
                                                className={`inline-block px-2 py-px border rounded-sm text-[0.6875rem] font-bold leading-relaxed ${subjectColor(
                                                    lesson.subject
                                                )}`}
                                            >
                                                {lesson.subject}
                                            </span>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default WeekSchedule;
