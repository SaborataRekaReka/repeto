import { useEffect, useState } from "react";
import Link from "next/link";
import Modal from "@/components/Modal";
import Icon from "@/components/Icon";
import { updateLessonStatus } from "@/hooks/useLessons";
import type { Lesson } from "@/types/schedule";

type LessonDetailModalProps = {
    visible: boolean;
    onClose: () => void;
    lesson: Lesson | null;
    onEdit?: (lesson: Lesson) => void;
    onDelete?: (lessonId: string) => void;
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
        case "reschedule_pending":
            return "Запрос на перенос";
    }
};

const statusConfig = (status: Lesson["status"]) => {
    switch (status) {
        case "planned":
            return {
                className: "border-green-1 bg-green-2 text-n-1 dark:bg-green-1/20 dark:text-white",
                icon: "clock" as const,
            };
        case "completed":
            return {
                className: "border-purple-1 bg-purple-3 text-n-1 dark:bg-purple-1/20 dark:text-white",
                icon: "check-circle" as const,
            };
        case "cancelled_student":
        case "cancelled_tutor":
            return {
                className: "border-pink-1 bg-pink-2 text-n-1 dark:bg-pink-1/20 dark:text-white",
                icon: "close" as const,
            };
        case "no_show":
            return {
                className: "border-yellow-1 bg-yellow-2 text-n-1 dark:bg-yellow-1/20 dark:text-white",
                icon: "close" as const,
            };
        case "reschedule_pending":
            return {
                className: "border-yellow-1 bg-yellow-2 text-n-1 dark:bg-yellow-1/20 dark:text-white",
                icon: "calendar" as const,
            };
    }
};

const formatLabel = (format: Lesson["format"]) =>
    format === "online" ? "Онлайн" : "Офлайн";

const formatDateLabel = (date: string) => {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return date;
    const parsed = new Date(`${date}T00:00:00`);
    if (Number.isNaN(parsed.getTime())) return date;
    return new Intl.DateTimeFormat("ru-RU", {
        day: "numeric",
        month: "long",
        year: "numeric",
    }).format(parsed);
};

const LessonDetailModal = ({
    visible,
    onClose,
    lesson,
    onEdit,
    onDelete,
}: LessonDetailModalProps) => {
    const [confirmCancel, setConfirmCancel] = useState(false);
    const [confirmDelete, setConfirmDelete] = useState(false);
    const [statusUpdating, setStatusUpdating] = useState<
        Lesson["status"] | null
    >(null);
    const [actionError, setActionError] = useState<string | null>(null);

    useEffect(() => {
        if (!visible) {
            setConfirmCancel(false);
            setConfirmDelete(false);
            setStatusUpdating(null);
            setActionError(null);
        }
    }, [visible]);

    useEffect(() => {
        setConfirmCancel(false);
        setConfirmDelete(false);
        setStatusUpdating(null);
        setActionError(null);
    }, [lesson?.id]);

    if (!lesson) return null;

    const status = statusConfig(lesson.status);

    const detailItems = [
        {
            label: "Дата",
            value: formatDateLabel(lesson.date),
            icon: "calendar" as const,
            accent: "bg-purple-3 dark:bg-purple-1/10",
        },
        {
            label: "Время",
            value: `${lesson.startTime} – ${lesson.endTime}`,
            icon: "clock" as const,
            accent: "bg-green-2 dark:bg-green-1/10",
        },
        {
            label: "Длительность",
            value: `${lesson.duration} мин`,
            icon: "clock-1" as const,
            accent: "bg-yellow-2 dark:bg-yellow-1/10",
        },
        {
            label: "Формат",
            value: formatLabel(lesson.format),
            icon: "earth" as const,
            accent: "bg-pink-2 dark:bg-pink-1/10",
        },
        {
            label: "Ставка",
            value: `${lesson.rate.toLocaleString("ru-RU")} ₽`,
            icon: "wallet" as const,
            accent: "bg-purple-3 dark:bg-purple-1/10",
            wide: true,
        },
    ];

    const handleStatusUpdate = async (
        nextStatus: Extract<Lesson["status"], "completed" | "cancelled_tutor">
    ) => {
        setStatusUpdating(nextStatus);
        setActionError(null);
        try {
            await updateLessonStatus(lesson.id, nextStatus);
            onClose();
        } catch (err) {
            console.error("Failed to update lesson status:", err);
            setActionError("Не удалось обновить статус. Попробуйте еще раз.");
        } finally {
            setStatusUpdating(null);
        }
    };

    return (
        <Modal
            classWrap="max-w-[36rem] shadow-primary-6 rounded-sm overflow-hidden"
            visible={visible}
            onClose={onClose}
            classButtonClose="top-5 right-5 z-10"
        >
            {/* Header with colored accent */}
            <div className={`px-6 pt-6 pb-5 ${status.className} border-b border-n-1 dark:border-white`}>
                <div className="flex items-center gap-2 mb-3 pr-8">
                    <Icon className="icon-16 fill-n-1 dark:fill-white" name={status.icon} />
                    <span className="text-xs font-bold uppercase tracking-wider">
                        {statusLabel(lesson.status)}
                    </span>
                </div>
                <div className="text-h4 md:text-h5 font-extrabold leading-tight">
                    {lesson.subject}
                </div>
                {lesson.studentId ? (
                    <Link
                        href={`/students/${lesson.studentId}`}
                        className="mt-1 inline-flex text-sm font-bold text-n-3 underline-offset-2 hover:underline dark:text-white/60"
                    >
                        {lesson.studentName}
                    </Link>
                ) : (
                    <div className="mt-1 text-sm font-bold text-n-3 dark:text-white/60">
                        {lesson.studentName}
                    </div>
                )}
            </div>

            {/* Detail cards grid */}
            <div className="px-6 pt-5 pb-6 md:px-4">
                <div className="grid grid-cols-2 gap-2.5 md:grid-cols-1">
                    {detailItems.map((item) => (
                        <div
                            key={item.label}
                            className={`flex items-center gap-3 p-3.5 border border-n-1 rounded-sm transition-shadow hover:shadow-primary-4 dark:border-white ${
                                item.wide ? "col-span-2 md:col-span-1" : ""
                            }`}
                        >
                            <div
                                className={`flex-shrink-0 flex items-center justify-center w-9 h-9 rounded-sm border border-n-1 dark:border-white ${item.accent}`}
                            >
                                <Icon
                                    className="icon-18 fill-n-1 dark:fill-white"
                                    name={item.icon}
                                />
                            </div>
                            <div className="min-w-0">
                                <div className="text-[10px] uppercase tracking-widest font-bold text-n-3 dark:text-white/50">
                                    {item.label}
                                </div>
                                <div className="text-sm font-extrabold truncate">
                                    {item.value}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {lesson.notes && (
                    <div className="mt-5 p-4 border border-dashed border-n-1 rounded-sm bg-n-4/20 dark:border-white dark:bg-white/5">
                        <div className="mb-1.5 text-[10px] uppercase tracking-widest font-bold text-n-3 dark:text-white/50">
                            Заметки
                        </div>
                        <div className="text-sm leading-relaxed">
                            {lesson.notes}
                        </div>
                    </div>
                )}

                {/* Actions */}
                <div className="mt-5 pt-5 border-t border-n-1 dark:border-white">
                    {actionError && (
                        <div className="mb-3 p-2.5 text-xs font-bold text-pink-1 border border-pink-1 rounded-sm bg-pink-2 dark:bg-pink-1/10">
                            {actionError}
                        </div>
                    )}
                    {confirmCancel ? (
                        <div className="space-y-3">
                            <div className="text-xs font-bold text-pink-1">
                                Вы уверены, что хотите отменить занятие?
                            </div>
                            <div className="flex gap-2">
                                <button
                                    className="btn-small border border-n-1 bg-pink-1 text-white fill-white hover:shadow-primary-4 transition-shadow dark:border-white"
                                    onClick={() =>
                                        handleStatusUpdate("cancelled_tutor")
                                    }
                                    disabled={statusUpdating === "cancelled_tutor"}
                                >
                                    <Icon name="close" />
                                    <span>
                                        {statusUpdating === "cancelled_tutor"
                                            ? "Отменяем..."
                                            : "Да, отменить"}
                                    </span>
                                </button>
                                <button
                                    className="btn-stroke btn-small"
                                    onClick={() => setConfirmCancel(false)}
                                    disabled={!!statusUpdating}
                                >
                                    <span>Нет</span>
                                </button>
                            </div>
                        </div>
                    ) : onDelete && confirmDelete ? (
                        <div className="space-y-3">
                            <div className="text-xs font-bold text-pink-1">
                                Удалить занятие без возможности восстановления?
                            </div>
                            <div className="flex gap-2">
                                <button
                                    className="btn-small border border-n-1 bg-pink-1 text-white fill-white hover:shadow-primary-4 transition-shadow dark:border-white"
                                    onClick={() => {
                                        onDelete(lesson.id);
                                        setConfirmDelete(false);
                                        onClose();
                                    }}
                                >
                                    <Icon name="remove" />
                                    <span>Да, удалить</span>
                                </button>
                                <button
                                    className="btn-stroke btn-small"
                                    onClick={() => setConfirmDelete(false)}
                                >
                                    <span>Не удалять</span>
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="flex items-center gap-2">
                            {/* Primary actions */}
                            {lesson.status === "planned" && (
                                <button
                                    className="btn-purple btn-small hover:shadow-primary-4 transition-shadow"
                                    onClick={() =>
                                        handleStatusUpdate("completed")
                                    }
                                    disabled={!!statusUpdating}
                                >
                                    <Icon name="check-circle" />
                                    <span>
                                        {statusUpdating === "completed"
                                            ? "Сохраняем..."
                                            : "Проведено"}
                                    </span>
                                </button>
                            )}
                            {onEdit && (
                                <button
                                    className="btn-stroke btn-small hover:shadow-primary-4 transition-shadow"
                                    onClick={() => {
                                        onClose();
                                        onEdit(lesson);
                                    }}
                                    disabled={!!statusUpdating}
                                >
                                    <Icon name="edit" />
                                    <span>Редактировать</span>
                                </button>
                            )}
                            {/* Spacer */}
                            <div className="flex-1" />
                            {/* Destructive actions — right side */}
                            {lesson.status === "planned" && (
                                <button
                                    className="btn-stroke btn-small btn-square w-8 !border-pink-1 !fill-pink-1 hover:!bg-pink-1 hover:!fill-n-1"
                                    onClick={() => {
                                        setConfirmDelete(false);
                                        setConfirmCancel(true);
                                    }}
                                    disabled={!!statusUpdating}
                                    aria-label="Отменить занятие"
                                    title="Отменить занятие"
                                >
                                    <Icon name="close" />
                                </button>
                            )}
                            {onDelete && (
                                <button
                                    className="btn-stroke btn-small btn-square w-8 !border-pink-1 !fill-pink-1 hover:!bg-pink-1 hover:!fill-n-1"
                                    onClick={() => {
                                        setConfirmCancel(false);
                                        setConfirmDelete(true);
                                    }}
                                    disabled={!!statusUpdating}
                                    aria-label="Удалить занятие"
                                    title="Удалить занятие"
                                >
                                    <Icon name="remove" />
                                </button>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </Modal>
    );
};

export default LessonDetailModal;
