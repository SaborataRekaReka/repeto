import Link from "next/link";
import { Card, Text, Label, Loader } from "@gravity-ui/uikit";
import { useTodayLessons } from "@/hooks/useDashboard";
import { shortName } from "@/mocks/schedule";
import type { Lesson } from "@/types/schedule";

type TodayScheduleProps = {
    onLessonClick: (lesson: Lesson) => void;
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

const dotColor = (subject: string) => {
    const s = subject.toLowerCase();
    if (s.includes("математ")) return "#AE7AFF";
    if (s.includes("физик")) return "#98E9AB";
    if (s.includes("русс")) return "#C6A6FF";
    if (s.includes("англ")) return "#73D8A8";
    return "#AE7AFF";
};

const TodaySchedule = ({ onLessonClick }: TodayScheduleProps) => {
    const { data: todayLessons = [], loading } = useTodayLessons();
    const today = new Date();
    const dayLabel = today.toLocaleDateString("ru-RU", {
        day: "numeric",
        month: "long",
    });

    return (
        <Card view="outlined" style={{ overflow: "hidden", background: "var(--g-color-base-float)" }}>
            <div className="repeto-card-header">
                <Text variant="subheader-2">Сегодня, {dayLabel}</Text>
                <Link
                    href="/schedule"
                    style={{
                        fontSize: 13,
                        color: "var(--g-color-text-brand)",
                        textDecoration: "none",
                    }}
                >
                    Всё расписание →
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
                            onClick={() => onLessonClick(lesson)}
                            style={{
                                display: "flex",
                                alignItems: "center",
                                width: "100%",
                                padding: "10px 16px",
                                background: "none",
                                border: "none",
                                borderTop: "1px solid var(--g-color-line-generic)",
                                cursor: "pointer",
                                textAlign: "left",
                                transition: "background 0.15s",
                            }}
                        >
                            <span
                                style={{
                                    width: 6,
                                    height: 6,
                                    borderRadius: "50%",
                                    background: dotColor(lesson.subject),
                                    flexShrink: 0,
                                    marginRight: 12,
                                }}
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
                                    <Text variant="body-2" ellipsis>
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
