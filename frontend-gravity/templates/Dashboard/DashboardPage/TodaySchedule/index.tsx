import Link from "next/link";
import { useEffect, useRef } from "react";
import { Card, Text, Label, Loader, Avatar } from "@gravity-ui/uikit";
import { useTodayLessons } from "@/hooks/useDashboard";
import { shortName } from "@/lib/formatters";
import { getInitials } from "@/lib/formatters";
import { accent, brand } from "@/constants/brand";
import type { Lesson } from "@/types/schedule";

type TodayScheduleProps = {
    onLessonClick: (lesson: Lesson) => void;
    refreshKey?: number;
};

const statusTheme = (status: Lesson["status"]): "success" | "danger" | "normal" => {
    switch (status) {
        case "completed":
            return "success";
        case "cancelled_student":
        case "cancelled_tutor":
            return "danger";
        case "no_show":
            return "normal";
        default:
            return "normal";
    }
};

const statusLabel = (status: Lesson["status"]) => {
    switch (status) {
        case "planned":
            return "Запланировано";
        case "completed":
            return "Проведено";
        case "cancelled_student":
        case "cancelled_tutor":
            return "Отменено";
        case "no_show":
            return "Не явился";
    }
};

const avatarColor = (subject: string) => {
    const s = subject.toLowerCase();
    if (s.includes("математ") || s.includes("русс")) return brand[400];
    if (s.includes("физик") || s.includes("англ")) return accent[600];
    return brand[400];
};

const TodaySchedule = ({ onLessonClick, refreshKey }: TodayScheduleProps) => {
    const { data: todayLessons = [], loading, refetch } = useTodayLessons();
    const didMountRef = useRef(false);
    const today = new Date();
    const dayLabel = today.toLocaleDateString("ru-RU", {
        day: "numeric",
        month: "long",
    });

    useEffect(() => {
        if (refreshKey === undefined) return;
        if (!didMountRef.current) {
            didMountRef.current = true;
            return;
        }
        refetch();
    }, [refreshKey, refetch]);

    return (
        <Card view="outlined" style={{ overflow: "hidden", background: "var(--g-color-base-float)" }}>
            <div className="repeto-card-header">
                <Text variant="subheader-2">Сегодня, {dayLabel}</Text>
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
            ) : todayLessons.length === 0 ? (
                <div style={{ padding: "32px 20px", textAlign: "center" }}>
                    <Text variant="body-1" color="secondary">
                        Занятий на сегодня нет
                    </Text>
                </div>
            ) : (
                <div>
                    {todayLessons.map((lesson) => (
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
                                borderTop: "1px solid var(--g-color-line-generic)",
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
                                    <Text variant="body-1" color="secondary" style={{ flexShrink: 0, marginLeft: 8, fontVariantNumeric: "tabular-nums" }}>
                                        {lesson.startTime} – {lesson.endTime}
                                    </Text>
                                </div>
                                <div
                                    style={{
                                        display: "flex",
                                        justifyContent: "space-between",
                                        alignItems: "center",
                                    }}
                                >
                                    <Text variant="body-1" color="secondary">
                                        {lesson.subject}
                                    </Text>
                                    <Label
                                        theme={statusTheme(lesson.status)}
                                        size="xs"
                                    >
                                        {statusLabel(lesson.status)}
                                    </Label>
                                </div>
                            </div>
                        </button>
                    ))}
                </div>
            )}
        </Card>
    );
};

export default TodaySchedule;
