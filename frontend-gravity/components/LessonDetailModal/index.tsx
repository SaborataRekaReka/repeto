import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { Alert, Text, Button, Label, Icon, DropdownMenu } from "@gravity-ui/uikit";

import { ChevronDown, Pencil, TrashBin } from "@gravity-ui/icons";
import type { IconData } from "@gravity-ui/uikit";
import { updateLessonStatus } from "@/hooks/useLessons";
import type { Lesson } from "@/types/schedule";
import CreateLessonModal from "@/components/CreateLessonModal";
import AppDialog from "@/components/AppDialog";
const GText = Text as any;
const GButton = Button as any;
const GLabel = Label as any;
const GIcon = Icon as any;
const GDropdownMenu = DropdownMenu as any;

type LessonDetailModalProps = {
    visible: boolean;
    onClose: () => void;
    lesson: Lesson | null;
    onEdit?: (lesson: Lesson) => void;
    onDelete?: (lessonId: string) => void;
    onUpdated?: () => void;
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
    onUpdated,
}: LessonDetailModalProps) => {
    const router = useRouter();
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

    const handleStudentOpen = () => {
        if (!lesson.studentId) return;
        onClose();
        void router.push(`/students/${lesson.studentId}`);
    };

    const handleStatusUpdate = async (
        nextStatus: Extract<Lesson["status"], "completed" | "cancelled_tutor">
    ) => {
        setStatusUpdating(nextStatus);
        setActionError(null);
        try {
            await updateLessonStatus(lesson.id, nextStatus);
            onUpdated?.();
            onClose();
        } catch (err) {
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

    const handleStatusMenuComplete = () => {
        void handleStatusUpdate("completed");
    };

    const handleCancelConfirm = () => {
        setConfirmCancel(false);
        void handleStatusUpdate("cancelled_tutor");
    };

    const handleDeleteConfirm = () => {
        if (!onDelete) return;
        onDelete(lesson.id);
        setConfirmDelete(false);
        onClose();
    };

    const formatValueOrDash = (value?: string | number | null) => {
        if (value === null || value === undefined || value === "") return "—";
        return String(value);
    };

    const reviewRating = lesson.reviewRating || 0;
    const reviewStars = [1, 2, 3, 4, 5].map((star) =>
        star <= reviewRating ? "★" : "☆"
    );

    return (
        <>
            <AppDialog
                open={visible}
                onClose={onClose}
                size="s"
                caption={lesson.subject}
                bodyClassName="repeto-lesson-modal-body"
                footer={{
                    entityActions:
                        onDelete && !confirmCancel && !confirmDelete ? (
                            <GButton
                                view="flat"
                                size="s"
                                className="repeto-icon-action-btn"
                                title="Удалить занятие"
                                aria-label="Удалить занятие"
                                onClick={() => {
                                    setConfirmCancel(false);
                                    setConfirmDelete(true);
                                }}
                            >
                                <GIcon data={TrashBin as IconData} size={14} />
                            </GButton>
                        ) : undefined,
                    renderButtons: () => (
                        <div className="repeto-modal-actions-right repeto-lesson-modal-actions-right">
                            {lesson.status === "planned" && !confirmDelete && !confirmCancel && (
                                <GDropdownMenu
                                    switcher={
                                        <GButton
                                            view="outlined"
                                            size="m"
                                            loading={
                                                statusUpdating === "completed" ||
                                                statusUpdating === "cancelled_tutor"
                                            }
                                        >
                                            Изменить статус
                                            <GButton.Icon side="end">
                                                <GIcon data={ChevronDown as IconData} size={14} />
                                            </GButton.Icon>
                                        </GButton>
                                    }
                                    items={[
                                        {
                                            text: "Отметить как проведенное",
                                            action: handleStatusMenuComplete,
                                        },
                                        {
                                            text: "Отменить занятие",
                                            action: () => {
                                                setConfirmDelete(false);
                                                setConfirmCancel(true);
                                            },
                                        },
                                    ]}
                                />
                            )}
                            <GButton
                                view="action"
                                size="m"
                                onClick={() => {
                                    if (onEdit) {
                                        onClose();
                                        onEdit(lesson);
                                    }
                                    else setEditOpen(true);
                                }}
                            >
                                <GIcon data={Pencil as IconData} size={14} />
                                Редактировать
                            </GButton>
                        </div>
                    ),
                }}
            >
                <div className="repeto-lesson-crm">
                    <div className="repeto-lesson-crm__hero">
                        <div className="repeto-lesson-crm__hero-top">
                            {lesson.studentId ? (
                                <button
                                    type="button"
                                    onClick={handleStudentOpen}
                                    className="repeto-lesson-modal-student-link"
                                >
                                    <GText as="span" variant="subheader-2">
                                        {lesson.studentName}
                                    </GText>
                                </button>
                            ) : (
                                <GText variant="subheader-2">{lesson.studentName}</GText>
                            )}
                            <GLabel theme={statusTheme(lesson.status)} size="s">
                                {statusLabel(lesson.status)}
                            </GLabel>
                        </div>
                        <GText variant="body-2" color="secondary">
                            {lesson.subject}
                        </GText>
                        <GText variant="body-2" color="secondary">
                            {formatDate(lesson.date)} · {lesson.startTime} – {lesson.endTime}
                        </GText>
                    </div>

                    <div className="repeto-lesson-crm__section">
                        <GText variant="body-2" color="secondary" as="div" className="repeto-lesson-crm__section-title">
                            Детали занятия
                        </GText>
                        <div className="repeto-lesson-crm__details-grid">
                            <div className="repeto-lesson-crm__detail-item">
                                <GText variant="caption-2" color="secondary" as="div">
                                    Дата
                                </GText>
                                <GText variant="body-2">{formatDate(lesson.date)}</GText>
                            </div>
                            <div className="repeto-lesson-crm__detail-item">
                                <GText variant="caption-2" color="secondary" as="div">
                                    Время
                                </GText>
                                <GText variant="body-2">
                                    {lesson.startTime} – {lesson.endTime}
                                </GText>
                            </div>
                            <div className="repeto-lesson-crm__detail-item">
                                <GText variant="caption-2" color="secondary" as="div">
                                    Длительность
                                </GText>
                                <GText variant="body-2">{lesson.duration} мин</GText>
                            </div>
                            <div className="repeto-lesson-crm__detail-item">
                                <GText variant="caption-2" color="secondary" as="div">
                                    Формат
                                </GText>
                                <GText variant="body-2">
                                    {lesson.format === "online" ? "Онлайн" : "Очно"}
                                </GText>
                            </div>
                            <div className="repeto-lesson-crm__detail-item">
                                <GText variant="caption-2" color="secondary" as="div">
                                    Ставка
                                </GText>
                                <GText variant="body-2" style={{ fontWeight: 600 }}>
                                    {lesson.rate.toLocaleString("ru-RU")} ₽
                                </GText>
                            </div>
                            <div className="repeto-lesson-crm__detail-item">
                                <GText variant="caption-2" color="secondary" as="div">
                                    Статус
                                </GText>
                                <GText variant="body-2">{statusLabel(lesson.status)}</GText>
                            </div>
                        </div>
                    </div>

                    <div className="repeto-lesson-crm__section">
                        <GText variant="body-2" color="secondary" as="div" className="repeto-lesson-crm__section-title">
                            Заметки репетитора
                        </GText>
                        <GText variant="body-2" style={{ whiteSpace: "pre-wrap" }}>
                            {formatValueOrDash(lesson.notes)}
                        </GText>
                    </div>

                    <div className="repeto-lesson-crm__section">
                        <GText variant="body-2" color="secondary" as="div" className="repeto-lesson-crm__section-title">
                            Отзыв ученика
                        </GText>
                        {lesson.hasReview ? (
                            <div className="repeto-lesson-crm__review-wrap">
                                <GText variant="subheader-1" className="repeto-lesson-crm__review-stars">
                                    {reviewStars.join(" ")}
                                </GText>
                                <GText variant="body-2" color="secondary">
                                    Оценка: {reviewRating}/5
                                </GText>
                                <GText variant="body-2" style={{ whiteSpace: "pre-wrap" }}>
                                    {formatValueOrDash(lesson.reviewFeedback)}
                                </GText>
                            </div>
                        ) : (
                            <GText variant="body-2" color="secondary">
                                Отзыв пока не оставлен
                            </GText>
                        )}
                    </div>
                </div>

                {actionError && (
                    <Alert
                        theme="danger"
                        view="filled"
                        corners="rounded"
                        title="Не удалось обновить статус"
                        message={actionError}
                    />
                )}
            </AppDialog>

            <AppDialog
                open={confirmCancel}
                onClose={() => {
                    if (statusUpdating !== "cancelled_tutor") {
                        setConfirmCancel(false);
                    }
                }}
                size="s"
                caption="Подтвердите отмену"
                footer={{
                    onClickButtonApply: handleCancelConfirm,
                    textButtonApply: "Да, отменить",
                    propsButtonApply: {
                        view: "outlined-danger",
                        loading: statusUpdating === "cancelled_tutor",
                    },
                    onClickButtonCancel: () => setConfirmCancel(false),
                    textButtonCancel: "Нет",
                    propsButtonCancel: {
                        disabled: statusUpdating === "cancelled_tutor",
                    },
                }}
            >
                <Text variant="body-2" color="secondary" className="repeto-lesson-modal-confirm-copy">
                    Занятие будет помечено как отменённое репетитором. Это действие повлияет на расписание и финансы.
                </Text>
            </AppDialog>

            <AppDialog
                open={Boolean(onDelete && confirmDelete)}
                onClose={() => setConfirmDelete(false)}
                size="s"
                caption="Подтвердите удаление"
                footer={{
                    onClickButtonApply: handleDeleteConfirm,
                    textButtonApply: "Да, удалить",
                    propsButtonApply: {
                        view: "outlined-danger",
                    },
                    onClickButtonCancel: () => setConfirmDelete(false),
                    textButtonCancel: "Нет",
                }}
            >
                <Text variant="body-2" color="secondary" className="repeto-lesson-modal-confirm-copy">
                    Занятие будет удалено без возможности восстановления.
                </Text>
            </AppDialog>

            <CreateLessonModal
                visible={editOpen}
                onClose={() => {
                    setEditOpen(false);
                    onClose();
                }}
                onCreated={onUpdated}
                lesson={lesson}
            />
        </>
    );
};

export default LessonDetailModal;
