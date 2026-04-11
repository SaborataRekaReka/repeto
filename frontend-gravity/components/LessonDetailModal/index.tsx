import { useEffect, useState } from "react";
import { Dialog, Text, Button, Label, Icon } from "@gravity-ui/uikit";

import { Pencil, CircleCheck, Xmark, TrashBin } from "@gravity-ui/icons";
import type { IconData } from "@gravity-ui/uikit";
import { updateLessonStatus } from "@/hooks/useLessons";
import type { Lesson } from "@/types/schedule";
import CreateLessonModal from "@/components/CreateLessonModal";

const GDialog = Dialog as any;
const GText = Text as any;
const GButton = Button as any;
const GLabel = Label as any;
const GIcon = Icon as any;

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

const statusTheme = (status: Lesson["status"]): "success" | "warning" | "danger" | "normal" | "info" => {
    switch (status) {
        case "planned": return "info";
        case "completed": return "success";
        case "cancelled_student":
        case "cancelled_tutor": return "danger";
        case "no_show": return "warning";
        case "reschedule_pending": return "warning";
        default: return "normal";
    }
};

const LessonDetailModal = ({
    visible,
    onClose,
    lesson,
    onEdit,
    onDelete,
}: LessonDetailModalProps) => {
    const [editOpen, setEditOpen] = useState(false);
    const [confirmCancel, setConfirmCancel] = useState(false);
    const [confirmDelete, setConfirmDelete] = useState(false);
    const [statusUpdating, setStatusUpdating] = useState<
        Lesson["status"] | null
    >(null);
    const [actionError, setActionError] = useState<string | null>(null);

    useEffect(() => {
        if (!visible) {
            setEditOpen(false);
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

    const formatDate = (value: string) => {
        if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
        const parsed = new Date(`${value}T00:00:00`);
        if (Number.isNaN(parsed.getTime())) return value;
        return new Intl.DateTimeFormat("ru-RU", {
            day: "numeric",
            month: "long",
            year: "numeric",
        }).format(parsed);
    };

    return (
        <>
            <GDialog open={visible} onClose={onClose} size="s">
                <GDialog.Header caption={lesson.subject} />
                <GDialog.Body>
                    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                        {/* Статус и ученик */}
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                            <GText variant="body-1" color="secondary">{lesson.studentName}</GText>
                            <GLabel theme={statusTheme(lesson.status)} size="s">
                                {statusLabel(lesson.status)}
                            </GLabel>
                        </div>

                        {/* Детали */}
                        <div style={{
                            display: "grid",
                            gridTemplateColumns: "1fr 1fr",
                            gap: 12,
                            padding: "12px 16px",
                            background: "var(--g-color-base-generic)",
                            borderRadius: 8,
                        }}>
                            <div>
                                <GText variant="caption-2" color="secondary" as="div">Дата</GText>
                                <GText variant="body-2">{formatDate(lesson.date)}</GText>
                            </div>
                            <div>
                                <GText variant="caption-2" color="secondary" as="div">Время</GText>
                                <GText variant="body-2" style={{ color: "var(--g-color-text-brand)" }}>
                                    {lesson.startTime} – {lesson.endTime}
                                </GText>
                            </div>
                            <div>
                                <GText variant="caption-2" color="secondary" as="div">Длительность</GText>
                                <GText variant="body-2">{lesson.duration} мин</GText>
                            </div>
                            <div>
                                <GText variant="caption-2" color="secondary" as="div">Формат</GText>
                                <GText variant="body-2">{lesson.format === "online" ? "Онлайн" : "Очно"}</GText>
                            </div>
                            <div style={{ gridColumn: "1 / -1" }}>
                                <GText variant="caption-2" color="secondary" as="div">Ставка</GText>
                                <GText variant="body-2">{lesson.rate.toLocaleString("ru-RU")} ₽</GText>
                            </div>
                        </div>

                        {lesson.notes && (
                            <div style={{
                                padding: "10px 14px",
                                borderRadius: 8,
                                border: "1px solid var(--g-color-line-generic)",
                            }}>
                                <GText variant="caption-2" color="secondary" as="div" style={{ marginBottom: 4 }}>
                                    Заметки
                                </GText>
                                <GText variant="body-2">{lesson.notes}</GText>
                            </div>
                        )}

                        {actionError && (
                            <GText color="danger" variant="body-2">{actionError}</GText>
                        )}

                        {/* Подтверждение отмены */}
                        {confirmCancel && (
                            <div style={{
                                padding: "12px 14px",
                                borderRadius: 8,
                                background: "var(--g-color-base-danger-light)",
                                display: "flex",
                                flexDirection: "column",
                                gap: 8,
                            }}>
                                <GText variant="body-2" color="danger">Вы уверены, что хотите отменить занятие?</GText>
                                <div style={{ display: "flex", gap: 8 }}>
                                    <GButton
                                        view="outlined-danger"
                                        size="s"
                                        loading={statusUpdating === "cancelled_tutor"}
                                        onClick={() => handleStatusUpdate("cancelled_tutor")}
                                    >
                                        <GIcon data={Xmark as IconData} size={14} />
                                        Да, отменить
                                    </GButton>
                                    <GButton view="outlined" size="s" onClick={() => setConfirmCancel(false)}>
                                        Нет
                                    </GButton>
                                </div>
                            </div>
                        )}

                        {/* Подтверждение удаления */}
                        {confirmDelete && onDelete && (
                            <div style={{
                                padding: "12px 14px",
                                borderRadius: 8,
                                background: "var(--g-color-base-danger-light)",
                                display: "flex",
                                flexDirection: "column",
                                gap: 8,
                            }}>
                                <GText variant="body-2" color="danger">Удалить занятие без возможности восстановления?</GText>
                                <div style={{ display: "flex", gap: 8 }}>
                                    <GButton
                                        view="outlined-danger"
                                        size="s"
                                        onClick={() => {
                                            onDelete(lesson.id);
                                            setConfirmDelete(false);
                                            onClose();
                                        }}
                                    >
                                        <GIcon data={TrashBin as IconData} size={14} />
                                        Да, удалить
                                    </GButton>
                                    <GButton view="outlined" size="s" onClick={() => setConfirmDelete(false)}>
                                        Нет
                                    </GButton>
                                </div>
                            </div>
                        )}
                    </div>
                </GDialog.Body>
                <GDialog.Footer
                    onClickButtonCancel={onClose}
                    textButtonCancel="Закрыть"
                    renderButtons={() => (
                        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                            {lesson.status === "planned" && !confirmCancel && !confirmDelete && (
                                <GButton
                                    view="outlined-success"
                                    size="m"
                                    loading={statusUpdating === "completed"}
                                    onClick={() => handleStatusUpdate("completed")}
                                >
                                    <GIcon data={CircleCheck as IconData} size={14} />
                                    Проведено
                                </GButton>
                            )}
                            <GButton
                                view="action"
                                size="m"
                                onClick={() => {
                                    if (onEdit) { onClose(); onEdit(lesson); }
                                    else setEditOpen(true);
                                }}
                            >
                                <GIcon data={Pencil as IconData} size={14} />
                                Редактировать
                            </GButton>
                            {lesson.status === "planned" && !confirmDelete && !confirmCancel && (
                                <GButton
                                    view="outlined-danger"
                                    size="m"
                                    onClick={() => { setConfirmDelete(false); setConfirmCancel(true); }}
                                >
                                    <GIcon data={Xmark as IconData} size={14} />
                                    Отменить
                                </GButton>
                            )}
                            {onDelete && !confirmCancel && !confirmDelete && (
                                <GButton
                                    view="outlined-danger"
                                    size="m"
                                    onClick={() => { setConfirmCancel(false); setConfirmDelete(true); }}
                                >
                                    <GIcon data={TrashBin as IconData} size={14} />
                                </GButton>
                            )}
                        </div>
                    )}
                />
            </GDialog>

            <CreateLessonModal
                visible={editOpen}
                onClose={() => { setEditOpen(false); onClose(); }}
                lesson={lesson}
            />
        </>
    );
};

export default LessonDetailModal;
