import Link from "next/link";
import { useEffect, useRef } from "react";
import { Card, Text, Loader, Icon } from "@gravity-ui/uikit";
import type { IconData } from "@gravity-ui/uikit";
import { ChevronRight } from "@gravity-ui/icons";
import { useWeekLessons } from "@/hooks/useDashboard";
import { shortName } from "@/lib/formatters";
import type { Lesson } from "@/types/schedule";
import StudentNameWithBadge from "@/components/StudentNameWithBadge";
import StudentAvatar from "@/components/StudentAvatar";

const dayNames = ["Вс", "Пн", "Вт", "Ср", "Чт", "Пт", "Сб"];

type Props = {
    onLessonClick: (lesson: Lesson) => void;
    refreshKey?: number;
};

const WeekSchedule = ({ onLessonClick, refreshKey }: Props) => {
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
                    className="repeto-card-chevron"
                    aria-label="Открыть расписание"
                >
                    <Icon data={ChevronRight as IconData} size={18} />
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
                    {days.map((date) => {
                        const d = new Date(date + "T00:00:00");
                        const dayLabel = `${dayNames[d.getDay()]}, ${d.getDate()} ${d.toLocaleDateString("ru-RU", { month: "short" })}`;
                        const isToday =
                            date === new Date().toISOString().slice(0, 10);

                        return (
                            <div key={date}>
                                <div
                                    className={isToday ? "repeto-week-day-header repeto-week-day-header--today" : "repeto-week-day-header"}
                                >
                                    <Text
                                        variant="caption-2"
                                        className="repeto-week-day-header__label"
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
                                            width: "100%",
                                            border: "none",
                                            background: "transparent",
                                            cursor: "pointer",
                                            textAlign: "left",
                                        }}
                                    >
                                        <StudentAvatar
                                            student={{ name: lesson.studentName, avatarUrl: undefined }}
                                            size="s"
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
                                                    <StudentNameWithBadge
                                                        name={shortName(lesson.studentName)}
                                                        hasRepetoAccount={Boolean(lesson.studentAccountId)}
                                                        truncate
                                                    />
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
