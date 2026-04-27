import { useMemo } from "react";
import { Text, Card } from "@gravity-ui/uikit";
import LessonBlock from "../LessonBlock";
import { toLocalDateKey } from "@/lib/dates";
import type { Lesson } from "@/types/schedule";

type MonthProps = {
    currentDate: Date;
    onLessonClick?: (lesson: Lesson) => void;
    onMoreClick?: (date: string) => void;
    lessons?: Lesson[];
};

type MonthCell = MonthDay & {
    isoDate: string;
};

const DAY_NAMES = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];
const MAX_VISIBLE_LESSONS = 3;

function normalizeTime(value: string) {
    return value.length === 4 ? `0${value}` : value;
}

function parseTimeToMinutes(value: string) {
    const [hh, mm] = normalizeTime(value).split(":").map(Number);
    if (!Number.isFinite(hh) || !Number.isFinite(mm)) return 0;
    return hh * 60 + mm;
}

function sortLessonsByTime(items: Lesson[]) {
    return [...items].sort((left, right) => {
        const byStart = parseTimeToMinutes(left.startTime) - parseTimeToMinutes(right.startTime);
        if (byStart !== 0) return byStart;
        const byEnd = parseTimeToMinutes(left.endTime) - parseTimeToMinutes(right.endTime);
        if (byEnd !== 0) return byEnd;
        return left.id.localeCompare(right.id);
    });
}

function generateMonthGrid(currentDate: Date, allLessons: Lesson[]): MonthCell[] {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);

    let startDow = firstDay.getDay();
    if (startDow === 0) startDow = 7;
    const prefixDays = startDow - 1;

    const days: MonthCell[] = [];

    const prevMonthLast = new Date(year, month, 0);
    for (let i = prefixDays - 1; i >= 0; i--) {
        const d = prevMonthLast.getDate() - i;
        const dt = new Date(year, month - 1, d);
        const iso = toLocalDateKey(dt);
        days.push({
            day: d,
            month: "",
            year: dt.getFullYear(),
            isCurrentMonth: false,
            lessons: sortLessonsByTime(allLessons.filter((l) => l.date === iso)),
            isoDate: iso,
        });
    }

    for (let d = 1; d <= lastDay.getDate(); d++) {
        const dt = new Date(year, month, d);
        const iso = toLocalDateKey(dt);
        days.push({
            day: d,
            month: "",
            year: dt.getFullYear(),
            isCurrentMonth: true,
            lessons: sortLessonsByTime(allLessons.filter((l) => l.date === iso)),
            isoDate: iso,
        });
    }

    const remaining = 7 - (days.length % 7);
    if (remaining < 7) {
        for (let d = 1; d <= remaining; d++) {
            const dt = new Date(year, month + 1, d);
            const iso = toLocalDateKey(dt);
            days.push({
                day: d,
                month: "",
                year: dt.getFullYear(),
                isCurrentMonth: false,
                lessons: sortLessonsByTime(allLessons.filter((l) => l.date === iso)),
                isoDate: iso,
            });
        }
    }
    return days;
}

const Month = ({ currentDate, onLessonClick, onMoreClick, lessons = [] }: MonthProps) => {
    const monthDays = useMemo(
        () => generateMonthGrid(currentDate, lessons),
        [currentDate, lessons]
    );

    const now = new Date();
    const todayIso = toLocalDateKey(now);

    const weeks: MonthCell[][] = [];
    for (let i = 0; i < monthDays.length; i += 7) {
        weeks.push(monthDays.slice(i, i + 7));
    }

    return (
        <Card view="outlined" className="repeto-schedule-calendar-card" style={{ overflow: "hidden" }}>
            <div className="repeto-calendar-shell">
                <div className="repeto-calendar-shell__inner">
                    {/* Day-of-week header */}
                    <div
                        className="repeto-calendar-header"
                        style={{
                            display: "grid",
                            gridTemplateColumns: "repeat(7, 1fr)",
                            borderBottom: "1px solid var(--g-color-line-generic)",
                        }}
                    >
                        {DAY_NAMES.map((name) => (
                            <div
                                key={name}
                                className="repeto-month-dow"
                                style={{
                                    padding: "10px 8px",
                                    textAlign: "center",
                                    minWidth: 0,
                                    overflow: "hidden",
                                }}
                            >
                                <Text
                                    variant="caption-2"
                                    style={{
                                        textTransform: "uppercase",
                                        fontWeight: 600,
                                        letterSpacing: 0.5,
                                        color: "var(--g-color-text-primary)",
                                    }}
                                >
                                    {name}
                                </Text>
                            </div>
                        ))}
                    </div>

                    {/* Weeks */}
                    {weeks.map((week, wi) => (
                        <div
                            key={wi}
                            style={{
                                display: "grid",
                                gridTemplateColumns: "repeat(7, 1fr)",
                                borderBottom:
                                    wi < weeks.length - 1
                                        ? "1px solid var(--g-color-line-generic)"
                                        : "none",
                            }}
                        >
                    {week.map((item, di) => {
                        const cellIso = item.isoDate;
                        const isToday = cellIso === todayIso;
                        const extra = item.lessons.length - MAX_VISIBLE_LESSONS;

                        return (
                            <div
                                key={di}
                                className={`repeto-month-cell${!item.isCurrentMonth ? " repeto-month-cell--outside" : ""}${isToday ? " repeto-month-cell--today" : ""}`}
                                style={{
                                    minHeight: 98,
                                    minWidth: 0,
                                    overflow: "hidden",
                                    padding: "6px 6px 6px",
                                    borderLeft:
                                        di > 0
                                            ? "1px solid var(--g-color-line-generic)"
                                            : "none",
                                }}
                            >
                                {/* Day number */}
                                <div
                                    style={{
                                        display: "flex",
                                        justifyContent: "flex-start",
                                        marginBottom: 6,
                                        paddingLeft: 1,
                                    }}
                                >
                                    <div
                                        style={{
                                            minWidth: 22,
                                            height: 22,
                                            padding: "0 6px",
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "center",
                                            borderRadius: 999,
                                            background: "transparent",
                                            border: isToday
                                                ? "1px solid var(--g-color-base-brand)"
                                                : "1px solid transparent",
                                        }}
                                    >
                                        <Text
                                            variant="body-short"
                                            style={{
                                                fontSize: 13,
                                                fontWeight: isToday ? 600 : 400,
                                                color: isToday
                                                    ? "var(--g-color-text-brand)"
                                                    : item.isCurrentMonth
                                                      ? "var(--g-color-text-primary)"
                                                      : "var(--g-color-text-secondary)",
                                            }}
                                        >
                                            {item.day}
                                        </Text>
                                    </div>
                                </div>

                                {/* Lessons */}
                                <div
                                    className="repeto-month-cell__lessons"
                                    style={{
                                        display: "flex",
                                        flexDirection: "column",
                                        gap: 3,
                                        width: "100%",
                                        boxSizing: "border-box",
                                    }}
                                >
                                    {item.lessons
                                        .slice(0, MAX_VISIBLE_LESSONS)
                                        .map((lesson) => (
                                            <LessonBlock
                                                key={lesson.id}
                                                lesson={lesson}
                                                compact
                                                onClick={onLessonClick}
                                            />
                                        ))}
                                    {extra > 0 && (
                                        <button
                                            type="button"
                                            onClick={() => onMoreClick?.(cellIso)}
                                            className="repeto-calendar-more-btn"
                                            style={{
                                                border: "none",
                                                background: "var(--repeto-surface-muted-soft)",
                                                width: "100%",
                                                fontSize: 12,
                                                lineHeight: "18px",
                                                color: "var(--g-color-text-secondary)",
                                                fontWeight: 500,
                                                cursor: "pointer",
                                                padding: "2px 8px",
                                                borderRadius: 6,
                                                transition: "background 0.15s ease, color 0.15s ease",
                                                boxSizing: "border-box",
                                            }}
                                        >
                                            Ещё {extra}
                                        </button>
                                    )}
                                </div>
                            </div>
                        );
                        })}
                        </div>
                    ))}
                </div>
            </div>
        </Card>
    );
};

export default Month;
