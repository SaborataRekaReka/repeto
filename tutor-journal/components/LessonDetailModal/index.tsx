import Modal from "@/components/Modal";
import Icon from "@/components/Icon";
import type { Lesson } from "@/types/schedule";

type LessonDetailModalProps = {
    visible: boolean;
    onClose: () => void;
    lesson: Lesson | null;
};

const statusLabel = (status: Lesson["status"]) => {
    switch (status) {
        case "planned":
            return "Запланировано";
        case "completed":
            return "Проведено";
        case "cancelled_student":
            return "Отменено (ученик)";
        case "cancelled_tutor":
            return "Отменено (репетитор)";
        case "no_show":
            return "Не явился";
    }
};

const statusColor = (status: Lesson["status"]) => {
    switch (status) {
        case "planned":
            return "label-stroke";
        case "completed":
            return "bg-green-1 text-n-1 px-2 py-0.5 text-xs font-bold";
        case "cancelled_student":
        case "cancelled_tutor":
            return "bg-pink-1 text-n-1 px-2 py-0.5 text-xs font-bold";
        case "no_show":
            return "bg-yellow-1 text-n-1 px-2 py-0.5 text-xs font-bold";
    }
};

const formatLabel = (format: Lesson["format"]) =>
    format === "online" ? "Онлайн" : "Офлайн";

const LessonDetailModal = ({
    visible,
    onClose,
    lesson,
}: LessonDetailModalProps) => {
    if (!lesson) return null;

    return (
        <Modal
            classWrap="pt-6 px-5 pb-8"
            visible={visible}
            onClose={onClose}
        >
            <div className="pr-8">
                <div className="flex items-center justify-between mb-4">
                    <div className={statusColor(lesson.status)}>
                        {statusLabel(lesson.status)}
                    </div>
                </div>
                <div className="mb-1 text-h4">{lesson.subject}</div>
                <div className="text-sm text-n-3 dark:text-white/50">
                    {lesson.studentName}
                </div>
            </div>

            <div className="flex flex-wrap gap-x-8 gap-y-4 mt-6">
                <div>
                    <div className="mb-1 text-xs font-medium text-n-3 dark:text-white/50">
                        Дата
                    </div>
                    <div className="text-sm font-bold">{lesson.date}</div>
                </div>
                <div>
                    <div className="mb-1 text-xs font-medium text-n-3 dark:text-white/50">
                        Время
                    </div>
                    <div className="text-sm font-bold">
                        {lesson.startTime} – {lesson.endTime}
                    </div>
                </div>
                <div>
                    <div className="mb-1 text-xs font-medium text-n-3 dark:text-white/50">
                        Длительность
                    </div>
                    <div className="text-sm font-bold">
                        {lesson.duration} мин
                    </div>
                </div>
                <div>
                    <div className="mb-1 text-xs font-medium text-n-3 dark:text-white/50">
                        Формат
                    </div>
                    <div className="text-sm font-bold">
                        {formatLabel(lesson.format)}
                    </div>
                </div>
                <div>
                    <div className="mb-1 text-xs font-medium text-n-3 dark:text-white/50">
                        Ставка
                    </div>
                    <div className="text-sm font-bold">
                        {lesson.rate.toLocaleString("ru-RU")} ₽
                    </div>
                </div>
            </div>

            {lesson.notes && (
                <div className="mt-5 pt-4 border-t border-dashed border-n-1 dark:border-white">
                    <div className="mb-1 font-bold">Заметки</div>
                    <div className="text-sm">{lesson.notes}</div>
                </div>
            )}

            <div className="flex gap-2 mt-6 pt-4 border-t border-dashed border-n-1 dark:border-white">
                {lesson.status === "planned" && (
                    <>
                        <button
                            className="btn-purple btn-small"
                            onClick={() => {
                                console.log("TODO: mark completed", lesson.id);
                                onClose();
                            }}
                        >
                            <Icon name="check-circle" />
                            <span>Проведено</span>
                        </button>
                        <button
                            className="btn-stroke btn-small"
                            onClick={() => {
                                console.log("TODO: cancel lesson", lesson.id);
                                onClose();
                            }}
                        >
                            <span>Отменить</span>
                        </button>
                    </>
                )}
                <button
                    className="btn-stroke btn-small ml-auto"
                    onClick={onClose}
                >
                    <span>Закрыть</span>
                </button>
            </div>
        </Modal>
    );
};

export default LessonDetailModal;
