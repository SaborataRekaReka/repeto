import Link from "next/link";
import { Card, Text, Label, Loader } from "@gravity-ui/uikit";
import { useWeekLessons } from "@/hooks/useDashboard";
import { shortName } from "@/mocks/schedule";
import type { Lesson } from "@/types/schedule";

const dayNames = ["Вс", "Пн", "Вт", "Ср", "Чт", "Пт", "Сб"];

const dotColor = (subject: string) => {
    const s = subject.toLowerCase();
    if (s.includes("математ")) return "#AE7AFF";
    if (s.includes("физик")) return "#98E9AB";
    if (s.includes("русс")) return "#C6A6FF";
    if (s.includes("англ")) return "#73D8A8";
    return "#AE7AFF";
};

const subjectTheme = (subject: string): "info" | "success" | "normal" => {
    const s = subject.toLowerCase();
    if (s.includes("математ")) return "info";
    if (s.includes("физик")) return "success";
    if (s.includes("русс")) return "info";
    if (s.includes("англ")) return "success";
    return "normal";
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
        <Card view="outlined" style={{ overflow: "hidden" }}>
            <div className="repeto-card-header">
                <Text variant="subheader-2">Занятия на неделю</Text>
                <Link
                    href="/schedule"
                    style={{
                        fontSize: 13,
                        color: "var(--g-color-text-brand)",
                        textDecoration: "none",
                    }}
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
                            <div
                                key={date}
                                style={{
                                    borderTop: dayIdx > 0
                                        ? "1px solid var(--g-color-line-generic)"
                                        : undefined,
                                }}
                            >
                                <div
                                    style={{
                                        display: "flex",
                                        alignItems: "center",
                                        gap: 6,
                                        padding: "8px 16px",
                                        background: isToday
                                            ? "rgba(174,122,255,0.05)"
                                            : undefined,
                                    }}
                                >
                                    <Text
                                        variant="caption-2"
                                        color={isToday ? "brand" : "secondary"}
                                        style={{
                                            textTransform: "uppercase",
                                            letterSpacing: "0.05em",
                                            fontWeight: 700,
                                        }}
                                    >
                                        {isToday ? "Сегодня" : dayLabel}
                                    </Text>
                                    {isToday && (
                                        <span
                                            style={{
                                                width: 6,
                                                height: 6,
                                                borderRadius: "50%",
                                                background: "#AE7AFF",
                                            }}
                                        />
                                    )}
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
                                            padding: "8px 16px",
                                            border: "none",
                                            borderTop: "1px solid var(--g-color-line-generic-hover)",
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
                                            <Label
                                                theme={subjectTheme(lesson.subject)}
                                                size="xs"
                                            >
                                                {lesson.subject}
                                            </Label>
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
