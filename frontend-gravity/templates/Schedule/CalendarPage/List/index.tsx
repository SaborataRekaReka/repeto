import { useMemo } from "react";
import { Card, Text } from "@gravity-ui/uikit";
import StudentNameWithBadge from "@/components/StudentNameWithBadge";
import type { Lesson } from "@/types/schedule";

type ListViewProps = {
    lessons?: Lesson[];
    statusLabels: Record<Lesson["status"], string>;
    onLessonClick?: (lesson: Lesson) => void;
};

type LessonGroup = {
    date: string;
    lessons: Lesson[];
};

const WEEKDAY_LONG = [
    "Воскресенье",
    "Понедельник",
    "Вторник",
    "Среда",
    "Четверг",
    "Пятница",
    "Суббота",
];

const MONTH_NAMES_GEN = [
    "января",
    "февраля",
    "марта",
    "апреля",
    "мая",
    "июня",
    "июля",
    "августа",
    "сентября",
    "октября",
    "ноября",
    "декабря",
];

function parseDateKey(dateKey: string) {
    const [year, month, day] = dateKey.split("-").map(Number);
    return new Date(year, month - 1, day);
}

function compareLessonsByDateTime(left: Lesson, right: Lesson) {
    if (left.date !== right.date) return left.date.localeCompare(right.date);
    if (left.startTime !== right.startTime) return left.startTime.localeCompare(right.startTime);
    if (left.endTime !== right.endTime) return left.endTime.localeCompare(right.endTime);
    return left.id.localeCompare(right.id);
}

function formatGroupDate(dateKey: string) {
    const date = parseDateKey(dateKey);
    return `${WEEKDAY_LONG[date.getDay()]}, ${date.getDate()} ${MONTH_NAMES_GEN[date.getMonth()]}`;
}

function formatLessonMode(format: Lesson["format"]) {
    return format === "online" ? "Онлайн" : "Очно";
}

function getScheduleStatusChipClass(status: Lesson["status"]) {
    if (status === "completed") return "repeto-sl-cell-chip--active";
    if (status === "cancelled_student" || status === "cancelled_tutor") {
        return "repeto-sl-cell-chip--archived";
    }
    return "repeto-sl-cell-chip--paused";
}

function pluralizeLessons(count: number) {
    const mod10 = count % 10;
    const mod100 = count % 100;
    if (mod10 === 1 && mod100 !== 11) return `${count} занятие`;
    if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return `${count} занятия`;
    return `${count} занятий`;
}

const ListView = ({ lessons = [], statusLabels, onLessonClick }: ListViewProps) => {
    const groups = useMemo<LessonGroup[]>(() => {
        const sorted = [...lessons].sort(compareLessonsByDateTime);
        const grouped = new Map<string, Lesson[]>();

        for (const lesson of sorted) {
            if (!grouped.has(lesson.date)) {
                grouped.set(lesson.date, []);
            }
            grouped.get(lesson.date)?.push(lesson);
        }

        return Array.from(grouped.entries()).map(([date, dayLessons]) => ({
            date,
            lessons: dayLessons,
        }));
    }, [lessons]);

    if (groups.length === 0) {
        return (
            <Card view="outlined" className="repeto-schedule-calendar-card">
                <div className="repeto-schedule-empty">
                    <Text variant="subheader-2">Занятия за выбранный период не найдены</Text>
                    <Text variant="body-2" color="secondary">
                        Попробуйте сменить диапазон дат или фильтр статусов.
                    </Text>
                </div>
            </Card>
        );
    }

    return (
        <Card view="outlined" className="repeto-schedule-calendar-card">
            <div className="repeto-schedule-list repeto-sl-table">
                <div className="repeto-sl-list-header repeto-sl-list-header--schedule" aria-hidden>
                    <span className="repeto-sl-lh__col repeto-sl-lh__col--schedule-time">Время</span>
                    <span className="repeto-sl-lh__col">Занятие</span>
                    <span className="repeto-sl-lh__col">Ученик</span>
                    <span className="repeto-sl-lh__col">Статус</span>
                    <span className="repeto-sl-lh__col repeto-sl-lh__col--schedule-format">Формат</span>
                </div>

                {groups.map((group) => (
                    <section key={group.date} className="repeto-schedule-list__group">
                        <header className="repeto-schedule-list__group-header">
                            <Text variant="subheader-1" className="repeto-schedule-list__group-title">
                                {formatGroupDate(group.date)}
                            </Text>
                            <Text
                                variant="caption-2"
                                color="secondary"
                                className="repeto-schedule-list__group-count"
                            >
                                {pluralizeLessons(group.lessons.length)}
                            </Text>
                        </header>

                        <div className="repeto-sl-list repeto-schedule-list__rows">
                            {group.lessons.map((lesson) => (
                                <button
                                    key={lesson.id}
                                    type="button"
                                    className="repeto-sl-row repeto-sl-row--schedule repeto-schedule-list__row"
                                    onClick={() => onLessonClick?.(lesson)}
                                >
                                    <span className="repeto-sl-row__cell repeto-sl-row__cell--schedule-time">
                                        <span className="repeto-schedule-list__time">
                                            {lesson.startTime} - {lesson.endTime}
                                        </span>
                                    </span>

                                    <span className="repeto-sl-row__cell repeto-sl-row__cell--schedule-subject">
                                        <span className="repeto-schedule-list__subject">{lesson.subject}</span>
                                    </span>

                                    <span className="repeto-sl-row__cell repeto-sl-row__cell--schedule-student">
                                        <span className="repeto-schedule-list__student">
                                            <StudentNameWithBadge
                                                name={lesson.studentName}
                                                hasRepetoAccount={Boolean(lesson.studentAccountId)}
                                                truncate
                                            />
                                        </span>
                                    </span>

                                    <span className="repeto-sl-row__cell repeto-sl-row__cell--schedule-status">
                                        <span className="repeto-schedule-list__status">
                                            <span
                                                className={`repeto-sl-cell-chip ${getScheduleStatusChipClass(lesson.status)}`}
                                            >
                                                {statusLabels[lesson.status]}
                                            </span>
                                        </span>
                                    </span>

                                    <span className="repeto-sl-row__cell repeto-sl-row__cell--schedule-format">
                                        <span className="repeto-sl-cell-badge">
                                            {formatLessonMode(lesson.format)}
                                        </span>
                                    </span>
                                </button>
                            ))}
                        </div>
                    </section>
                ))}
            </div>
        </Card>
    );
};

export default ListView;
