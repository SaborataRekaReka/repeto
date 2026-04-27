import Link from "next/link";
import { useEffect, useRef } from "react";
import { Card, Text, Label, Loader, Icon } from "@gravity-ui/uikit";
import type { IconData } from "@gravity-ui/uikit";
import { ChevronRight } from "@gravity-ui/icons";
import { useTodayLessons } from "@/hooks/useDashboard";
import { shortName } from "@/lib/formatters";
import type { Lesson } from "@/types/schedule";
import StudentNameWithBadge from "@/components/StudentNameWithBadge";
import StudentAvatar from "@/components/StudentAvatar";

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

function toMinutes(value: string): number {
    const [hours, minutes] = value.split(":").map((part) => Number(part));
    return (Number.isFinite(hours) ? hours : 0) * 60 + (Number.isFinite(minutes) ? minutes : 0);
}

const TodaySchedule = ({ onLessonClick, refreshKey }: TodayScheduleProps) => {
    const { data: todayLessons = [], loading, refetch } = useTodayLessons();
    const didMountRef = useRef(false);

    const now = new Date();
    const nowMinutes = now.getHours() * 60 + now.getMinutes();

    const nearestLessons = [...todayLessons]
        .sort((left, right) => {
            const leftDelta = toMinutes(left.startTime) - nowMinutes;
            const rightDelta = toMinutes(right.startTime) - nowMinutes;
            const leftScore = leftDelta >= 0 ? leftDelta : 24 * 60 + Math.abs(leftDelta);
            const rightScore = rightDelta >= 0 ? rightDelta : 24 * 60 + Math.abs(rightDelta);
            return leftScore - rightScore;
        })
        .slice(0, 5);

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
                <Text variant="subheader-2">Ближайшие занятия</Text>
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
            ) : nearestLessons.length === 0 ? (
                <div style={{ padding: "32px 20px", textAlign: "center" }}>
                    <Text variant="body-1" color="secondary">
                        Занятий на сегодня нет
                    </Text>
                </div>
            ) : (
                <div>
                    {nearestLessons.map((lesson) => (
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
