import Link from "next/link";
import { useEffect, useRef } from "react";
import { Card, Text, Loader, Avatar } from "@gravity-ui/uikit";
import { useWeekLessons } from "@/hooks/useDashboard";
import { shortName } from "@/lib/formatters";
import { getInitials } from "@/lib/formatters";
import { accent, brand } from "@/constants/brand";
import { useThemeMode } from "@/contexts/ThemeContext";
import type { Lesson } from "@/types/schedule";

const dayNames = ["Вс", "Пн", "Вт", "Ср", "Чт", "Пт", "Сб"];

const avatarColor = (subject: string) => {
    const s = subject.toLowerCase();
    if (s.includes("математ") || s.includes("русс")) return brand[400];
    if (s.includes("физик") || s.includes("англ")) return accent[600];
    return brand[400];
};

type Props = {
    onLessonClick: (lesson: Lesson) => void;
    refreshKey?: number;
};

const WeekSchedule = ({ onLessonClick, refreshKey }: Props) => {
    const { theme } = useThemeMode();
    const isDarkTheme = theme === "dark";
    const didMountRef = useRef(false);

    const { data: lessons = [], loading, refetch } = useWeekLessons();

    useEffect(() => {
        if (refreshKey === undefined) return;
        if (!didMountRef.current) {
            didMountRef.current = true;
            return;
        }
        refetch();
    }, [refreshKey, refetch]);

    const grouped = lessons.reduce<Record<string, Lesson[]>>((acc, l) => {
        (acc[l.date] ??= []).push(l);
        return acc;
    }, {});

    const days = Object.keys(grouped).sort();

    return (
        <Card view="outlined" style={{ overflow: "hidden" }}>
            <div className="repeto-card-header">
                <Text variant="subheader-2">Занятия на неделю</Text>
                <Link
                    href="/schedule"
                    className="repeto-card-link"
                >
                    Расписание →
                </Link>
            </div>
            {loading ? (
                <div style={{ padding: "32px 0", textAlign: "center" }}>
                    <Loader size="s" />
                </div>
            ) : days.length === 0 ? (
                <div style={{ padding: "32px 20px", textAlign: "center" }}>
                    <Text variant="body-1" color="secondary">
                        На ближайшую неделю занятий нет
                    </Text>
                </div>
            ) : (
                <div>
                    {days.map((date, dayIdx) => {
                        const d = new Date(date + "T00:00:00");
                        const dayLabel = `${dayNames[d.getDay()]}, ${d.getDate()} ${d.toLocaleDateString("ru-RU", { month: "short" })}`;
                        const isToday =
                            date === new Date().toISOString().slice(0, 10);

                        return (
                            <div key={date}>
                                {dayIdx > 0 && (
                                    <div style={{ height: 1, background: "var(--g-color-line-generic)" }} />
                                )}
                                <div
                                    style={{
                                        padding: isToday ? "0 16px" : "10px 16px 4px",
                                        minHeight: isToday ? 40 : undefined,
                                        display: isToday ? "flex" : undefined,
                                        alignItems: isToday ? "center" : undefined,
                                        background: isToday
                                            ? isDarkTheme
                                                ? "var(--g-color-base-brand-hover)"
                                                : accent[300]
                                            : undefined,
                                    }}
                                >
                                    <Text
                                        variant="caption-2"
                                        style={{
                                            textTransform: "uppercase",
                                            letterSpacing: "0.05em",
                                            fontWeight: 600,
                                            color: isToday
                                                ? isDarkTheme
                                                    ? "var(--g-color-text-light-primary)"
                                                    : "var(--g-color-text-primary)"
                                                : "var(--g-color-text-secondary)",
                                        }}
                                    >
                                        {isToday ? "Сегодня" : dayLabel}
                                    </Text>
                                </div>

                                {grouped[date].map((lesson) => (
                                    <button
                                        key={lesson.id}
                                        className="repeto-week-lesson-row"
                                        onClick={() => onLessonClick(lesson)}
                                        style={{
                                            display: "flex",
                                            alignItems: "center",
                                            gap: 12,
                                            width: "100%",
                                            padding: "10px 16px",
                                            border: "none",
                                            cursor: "pointer",
                                            textAlign: "left",
                                            transition: "background 0.15s",
                                        }}
                                    >
                                        <Avatar
                                            text={getInitials(lesson.studentName)}
                                            size="s"
                                            theme="brand"
                                            backgroundColor={avatarColor(lesson.subject)}
                                        />
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <div
                                                style={{
                                                    display: "flex",
                                                    justifyContent: "space-between",
                                                    alignItems: "center",
                                                    marginBottom: 2,
                                                }}
                                            >
                                                <Text variant="body-2" ellipsis className="repeto-dashboard-entity-name">
                                                    {shortName(lesson.studentName)}
                                                </Text>
                                                <Text
                                                    variant="body-1"
                                                    color="secondary"
                                                    style={{
                                                        flexShrink: 0,
                                                        marginLeft: 8,
                                                        fontVariantNumeric: "tabular-nums",
                                                    }}
                                                >
                                                    {lesson.startTime} – {lesson.endTime}
                                                </Text>
                                            </div>
                                            <Text as="div" variant="body-1" color="secondary">
                                                {lesson.subject}
                                            </Text>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        );
                    })}
                </div>
            )}
        </Card>
    );
};

export default WeekSchedule;
