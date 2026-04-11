import { Card, Text, Button, Icon, Label } from "@gravity-ui/uikit";
import { CirclePlus, ChevronRight } from "@gravity-ui/icons";

import type { IconData } from "@gravity-ui/uikit";
import type { Lesson } from "@/types/schedule";

type LessonHistoryProps = {
    lessons: Lesson[];
    onLessonClick?: (lesson: Lesson) => void;
    onAdd?: () => void;
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

const statusTheme = (
    status: Lesson["status"]
): "success" | "warning" | "danger" | "normal" => {
    switch (status) {
        case "planned":
            return "normal";
        case "completed":
            return "success";
        case "cancelled_student":
        case "cancelled_tutor":
            return "danger";
        case "no_show":
            return "warning";
        default:
            return "normal";
    }
};

const formatDate = (value: string) => {
    if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
        const [year, month, day] = value.split("-");
        return `${day}.${month}.${year}`;
    }
    return value;
};

const LessonHistory = ({
    lessons,
    onLessonClick,
    onAdd,
}: LessonHistoryProps) => (
    <div>
        <div
            style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: 16,
            }}
        >
            <Text variant="subheader-2">Занятия</Text>
            {onAdd && (
                <Button view="action" size="s" onClick={onAdd}>
                    <Icon data={CirclePlus as IconData} size={14} />
                    Назначить
                </Button>
            )}
        </div>

        {lessons.length === 0 ? (
            <Card
                view="outlined"
                style={{ padding: "48px 24px", textAlign: "center" }}
            >
                <Text variant="body-1" color="secondary">
                    Занятий пока нет
                </Text>
            </Card>
        ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {lessons.map((lesson) => (
                    <Card
                        key={lesson.id}
                        type="action"
                        view="outlined"
                        style={{ cursor: "pointer" }}
                        onClick={() => onLessonClick?.(lesson)}
                    >
                        <div
                            style={{
                                display: "flex",
                                alignItems: "center",
                                padding: "12px 16px",
                                gap: 20,
                                flexWrap: "wrap",
                            }}
                        >
                            <div style={{ minWidth: 80 }}>
                                <Text
                                    variant="caption-2"
                                    color="secondary"
                                    as="div"
                                >
                                    Дата
                                </Text>
                                <Text variant="body-2">
                                    {formatDate(lesson.date)}
                                </Text>
                            </div>
                            <div style={{ minWidth: 96 }}>
                                <Text
                                    variant="caption-2"
                                    color="secondary"
                                    as="div"
                                >
                                    Время
                                </Text>
                                <Text
                                    variant="body-2"
                                    style={{
                                        color: "var(--g-color-text-brand)",
                                    }}
                                >
                                    {lesson.startTime} – {lesson.endTime}
                                </Text>
                            </div>
                            <div style={{ minWidth: 90 }}>
                                <Text
                                    variant="caption-2"
                                    color="secondary"
                                    as="div"
                                >
                                    Предмет
                                </Text>
                                <Text variant="body-1">{lesson.subject}</Text>
                            </div>
                            <div style={{ minWidth: 70 }}>
                                <Text
                                    variant="caption-2"
                                    color="secondary"
                                    as="div"
                                >
                                    Ставка
                                </Text>
                                <Text variant="body-2">
                                    {lesson.rate.toLocaleString("ru-RU")} ₽
                                </Text>
                            </div>
                            <div
                                style={{
                                    marginLeft: "auto",
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 8,
                                }}
                            >
                                <Label
                                    theme={statusTheme(lesson.status)}
                                    size="xs"
                                >
                                    {statusLabel(lesson.status)}
                                </Label>
                                <Icon
                                    data={ChevronRight as IconData}
                                    size={16}
                                    style={{
                                        color: "var(--g-color-text-secondary)",
                                    }}
                                />
                            </div>
                        </div>
                    </Card>
                ))}
            </div>
        )}
    </div>
);

export default LessonHistory;
