import { Icon } from "@gravity-ui/uikit";
import { ChevronRight } from "@gravity-ui/icons";

import type { IconData } from "@gravity-ui/uikit";
import type { Lesson } from "@/types/schedule";
import TabAddSlot from "../TabAddSlot";

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
        case "reschedule_pending":
            return "Перенос";
        default:
            return "Статус не указан";
    }
};

const statusClassName = (status: Lesson["status"]) => {
    if (status === "planned") return "repeto-schedule-status-chip--planned";
    if (status === "completed") return "repeto-schedule-status-chip--completed";
    if (status === "cancelled_student") return "repeto-schedule-status-chip--cancelled_student";
    if (status === "cancelled_tutor") return "repeto-schedule-status-chip--cancelled_tutor";
    if (status === "reschedule_pending") return "repeto-schedule-status-chip--reschedule_pending";
    return "repeto-schedule-status-chip--no_show";
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
        {lessons.length === 0 ? (
            <div className="lp2-empty lp2-empty--with-action">
                <span>Занятий пока нет</span>
                {onAdd && <TabAddSlot title="Добавить занятие" onClick={onAdd} />}
            </div>
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
                                <span className={`repeto-schedule-status-chip ${statusClassName(lesson.status)}`}>
                                    {statusLabel(lesson.status)}
                                </span>
                                <GIcon
                                    data={ChevronRight as IconData}
                                    size={16}
                                    className="tab-list__chevron"
                                />
                            </div>
                        </div>
                    </div>
                ))}
                {onAdd && <TabAddSlot title="Добавить занятие" onClick={onAdd} />}
            </div>
        )}
    </div>
);

export default LessonHistory;
