import { Text, Button, Icon, Label } from "@gravity-ui/uikit";
import { CirclePlus, ChevronRight } from "@gravity-ui/icons";

import type { IconData } from "@gravity-ui/uikit";
import type { Lesson } from "@/types/schedule";

const GText = Text as any;
const GIcon = Icon as any;

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
    <div className="tab-section">
        {onAdd && (
            <div className="tab-section__actions">
                <button type="button" className="tab-action-btn" onClick={onAdd}>
                    <span className="tab-action-btn__icon">
                        <Icon data={CirclePlus as IconData} size={20} />
                    </span>
                    Назначить занятие
                </button>
            </div>
        )}

        {lessons.length === 0 ? (
            <div className="lp2-empty">Занятий пока нет</div>
        ) : (
            <div className="tab-list">
                {lessons.map((lesson) => (
                    <div
                        key={lesson.id}
                        className="tab-list__item tab-list__item--clickable"
                        onClick={() => onLessonClick?.(lesson)}
                    >
                        <div className="tab-list__row">
                            <div className="tab-list__field" style={{ minWidth: 80 }}>
                                <span className="tab-list__label">Дата</span>
                                <span className="tab-list__value">{formatDate(lesson.date)}</span>
                            </div>
                            <div className="tab-list__field" style={{ minWidth: 96 }}>
                                <span className="tab-list__label">Время</span>
                                <span className="tab-list__value tab-list__value--brand">
                                    {lesson.startTime} – {lesson.endTime}
                                </span>
                            </div>
                            <div className="tab-list__field" style={{ minWidth: 90 }}>
                                <span className="tab-list__label">Предмет</span>
                                <span className="tab-list__value">{lesson.subject}</span>
                            </div>
                            <div className="tab-list__field" style={{ minWidth: 70 }}>
                                <span className="tab-list__label">Ставка</span>
                                <span className="tab-list__value">
                                    {lesson.rate.toLocaleString("ru-RU")} ₽
                                </span>
                            </div>
                            <div className="tab-list__trail">
                                <Label theme={statusTheme(lesson.status)} size="xs">
                                    {statusLabel(lesson.status)}
                                </Label>
                                <GIcon
                                    data={ChevronRight as IconData}
                                    size={16}
                                    className="tab-list__chevron"
                                />
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        )}
    </div>
);

export default LessonHistory;
