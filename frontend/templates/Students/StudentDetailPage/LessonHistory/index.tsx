import Icon from "@/components/Icon";
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

const statusClass = (status: Lesson["status"]) => {
    switch (status) {
        case "planned":
            return "label-stroke";
        case "completed":
            return "label-green";
        case "cancelled_student":
        case "cancelled_tutor":
            return "label-stroke-pink";
        case "no_show":
            return "label-yellow";
    }
};

const formatLessonDate = (value: string) => {
    if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
        const [year, month, day] = value.split("-");
        return `${day}.${month}.${year}`;
    }

    return value;
};

const LessonHistory = ({ lessons, onLessonClick, onAdd }: LessonHistoryProps) => (
    <>
        <div className="flex items-center justify-between mb-6">
            <div className="text-h6">Занятия</div>
            {onAdd && (
                <button className="btn-purple btn-small" onClick={onAdd}>
                    <Icon name="add-circle" />
                    <span>Назначить занятие</span>
                </button>
            )}
        </div>
        {lessons.length === 0 ? (
            <div className="py-12 text-center text-sm text-n-3 dark:text-white/50">
                Занятий пока нет
            </div>
        ) : (
            <div className="space-y-3">
                {lessons.map((lesson) => (
                    <button
                        key={lesson.id}
                        className="flex items-center w-full gap-4 px-5 py-4 border border-n-1 bg-white text-left transition-shadow hover:shadow-primary-4 dark:bg-n-1 dark:border-white md:flex-wrap md:gap-2"
                        onClick={() => onLessonClick?.(lesson)}
                    >
                        <div className="shrink-0 w-24 md:w-auto">
                            <div className="text-xs text-n-3 dark:text-white/50">
                                Дата
                            </div>
                            <div className="text-sm font-bold">
                                {formatLessonDate(lesson.date)}
                            </div>
                        </div>
                        <div className="shrink-0 w-28 md:w-auto">
                            <div className="text-xs text-n-3 dark:text-white/50">
                                Время
                            </div>
                            <div className="text-sm font-bold text-purple-1">
                                {lesson.startTime} – {lesson.endTime}
                            </div>
                        </div>
                        <div className="shrink-0 w-28 lg:hidden">
                            <div className="text-xs text-n-3 dark:text-white/50">
                                Предмет
                            </div>
                            <div className="text-sm">{lesson.subject}</div>
                        </div>
                        <div className="shrink-0 w-20 text-right lg:hidden">
                            <div className="text-xs text-n-3 dark:text-white/50">
                                Ставка
                            </div>
                            <div className="text-sm font-bold">
                                {lesson.rate.toLocaleString("ru-RU")} ₽
                            </div>
                        </div>
                        <div className="ml-auto flex items-center gap-3 md:ml-0 md:mt-1 md:w-full md:justify-between">
                            <div className={statusClass(lesson.status)}>
                                {statusLabel(lesson.status)}
                            </div>
                            <Icon
                                className="shrink-0 icon-18 dark:fill-white"
                                name="arrow-next"
                            />
                        </div>
                    </button>
                ))}
            </div>
        )}
    </>
);

export default LessonHistory;
