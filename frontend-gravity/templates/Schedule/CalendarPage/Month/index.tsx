import { useMemo } from "react";
import { Text, Card } from "@gravity-ui/uikit";
import LessonBlock from "../LessonBlock";
import { toLocalDateKey } from "@/lib/dates";
import type { Lesson, MonthDay } from "@/types/schedule";

type MonthProps = {
    currentDate: Date;
    onLessonClick?: (lesson: Lesson) => void;
    lessons?: Lesson[];
};

const DAY_NAMES = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];
const MAX_VISIBLE_LESSONS = 3;

function generateMonthGrid(currentDate: Date, allLessons: Lesson[]): MonthDay[] {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);

    let startDow = firstDay.getDay();
    if (startDow === 0) startDow = 7;
    const prefixDays = startDow - 1;

    const days: MonthDay[] = [];

    const prevMonthLast = new Date(year, month, 0);
    for (let i = prefixDays - 1; i >= 0; i--) {
        const d = prevMonthLast.getDate() - i;
        const dt = new Date(year, month - 1, d);
        const iso = toLocalDateKey(dt);
        days.push({
            day: d,
            month: "",
            year,
            isCurrentMonth: false,
            lessons: allLessons.filter((l) => l.date === iso),
        });
    }

    for (let d = 1; d <= lastDay.getDate(); d++) {
        const dt = new Date(year, month, d);
        const iso = toLocalDateKey(dt);
        days.push({
            day: d,
            month: "",
            year,
            isCurrentMonth: true,
            lessons: allLessons.filter((l) => l.date === iso),
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
                year,
                isCurrentMonth: false,
                lessons: allLessons.filter((l) => l.date === iso),
            });
        }
    }
    return days;
}

const Month = ({ currentDate, onLessonClick, lessons = [] }: MonthProps) => {
    const monthDays = useMemo(
        () => generateMonthGrid(currentDate, lessons),
        [currentDate, lessons]
    );

    const now = new Date();
    const todayIso = toLocalDateKey(now);
    const currentMonth = currentDate.getMonth();
    const currentYear = currentDate.getFullYear();

    const weeks: MonthDay[][] = [];
    for (let i = 0; i < monthDays.length; i += 7) {
        weeks.push(monthDays.slice(i, i + 7));
    }

    return (
        <Card view="outlined" style={{ overflow: "hidden" }}>
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
                                style={{
                                    padding: "10px 8px",
                                    textAlign: "center",
                                    minWidth: 0,
                                    overflow: "hidden",
                                }}
                            >
                                <Text
                                    variant="caption-2"
                                    color="secondary"
                                    style={{
                                        textTransform: "uppercase",
                                        fontWeight: 500,
                                        letterSpacing: 0.5,
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
                        const cellDate = new Date(
                            currentYear,
                            item.isCurrentMonth
                                ? currentMonth
                                : di < 3 ? currentMonth - 1 : currentMonth + 1,
                            item.day
                        );
                        const cellIso = toLocalDateKey(cellDate);
                        const isToday = cellIso === todayIso;
                        const extra = item.lessons.length - MAX_VISIBLE_LESSONS;

                        return (
                            <div
                                key={di}
                                style={{
                                    minHeight: 110,
                                    minWidth: 0,
                                    overflow: "hidden",
                                    padding: "6px 4px 4px",
                                    borderLeft:
                                        di > 0
                                            ? "1px solid var(--g-color-line-generic)"
                                            : "none",
                                    background: isToday
                                        ? "var(--g-color-base-brand-hover-alt)"
                                        : "transparent",
                                }}
                            >
                                {/* Day number */}
                                <div
                                    style={{
                                        display: "flex",
                                        justifyContent: "center",
                                        marginBottom: 4,
                                    }}
                                >
                                    <div
                                        style={{
                                            width: 26,
                                            height: 26,
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "center",
                                            borderRadius: "50%",
                                            background: "transparent",
                                            border: isToday
                                                ? "1.5px solid var(--g-color-base-brand)"
                                                : "1.5px solid transparent",
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
                                                      : "var(--g-color-text-hint)",
                                            }}
                                        >
                                            {item.day}
                                        </Text>
                                    </div>
                                </div>

                                {/* Lessons */}
                                <div
                                    style={{
                                        display: "flex",
                                        flexDirection: "column",
                                        gap: 2,
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
                                        <Text
                                            variant="caption-2"
                                            color="secondary"
                                            style={{
                                                textAlign: "center",
                                                cursor: "pointer",
                                                padding: "1px 0",
                                            }}
                                        >
                                            +{extra} ещё
                                        </Text>
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
