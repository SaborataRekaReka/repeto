import { useState, useEffect, useMemo } from "react";
import {
    Dialog,
    Text,
    TextArea,
    Checkbox,
    Switch,
    SegmentedRadioGroup,
    Loader,
    Button,
} from "@gravity-ui/uikit";
import { useLessons } from "@/hooks/useLessons";
import { useStudentHomework } from "@/hooks/useStudents";
import { sendReminder } from "@/hooks/useNotifications";
import { codedErrorMessage } from "@/lib/errorCodes";
import type { Lesson } from "@/types/schedule";

const GDialog = Dialog as any;

type ReminderType = "payment" | "lesson" | "homework";

type RemindModalProps = {
    visible: boolean;
    onClose: () => void;
    onSent?: () => void;
    studentId: string;
    studentName: string;
    hasDebt: boolean;
    hasParent: boolean;
};

type HomeworkItem = {
    id: string;
    task: string;
    dueAt?: string;
    status: string;
};

const typeOptions = [
    { value: "payment" as ReminderType, content: "Об оплате" },
    { value: "lesson" as ReminderType, content: "О занятии" },
    { value: "homework" as ReminderType, content: "О домашке" },
];

const RemindModal = ({
    visible,
    onClose,
    onSent,
    studentId,
    studentName,
    hasDebt,
    hasParent,
}: RemindModalProps) => {
    const [reminderType, setReminderType] = useState<ReminderType>("payment");
    const [selectedLessonIds, setSelectedLessonIds] = useState<string[]>([]);
    const [selectedHomeworkIds, setSelectedHomeworkIds] = useState<string[]>([]);
    const [showComment, setShowComment] = useState(false);
    const [comment, setComment] = useState("");
    const [notifyParent, setNotifyParent] = useState(false);
    const [saving, setSaving] = useState(false);
    const [errorText, setErrorText] = useState<string | null>(null);
    const [successText, setSuccessText] = useState<string | null>(null);

    // Fetch lessons for this student
    const { data: allLessons = [], loading: lessonsLoading } = useLessons({
        studentId,
    });

    // Planned lessons (nearest first)
    const plannedLessons = useMemo(() => {
        return [...allLessons]
            .filter((l) => l.status === "planned")
            .sort((a, b) => {
                const da = new Date(`${a.date}T${a.startTime}`);
                const db = new Date(`${b.date}T${b.startTime}`);
                return da.getTime() - db.getTime();
            });
    }, [allLessons]);

    // Completed lessons (for payment context — shows what's unpaid)
    const completedLessons = useMemo(() => {
        return [...allLessons]
            .filter((l) => l.status === "completed")
            .sort((a, b) => (a.date > b.date ? -1 : 1));
    }, [allLessons]);

    // Fetch homework for this student
    const { data: hwData, loading: hwLoading } = useStudentHomework(studentId) as {
        data: any;
        loading: boolean;
    };
    const homeworks: HomeworkItem[] = useMemo(() => {
        const items = hwData?.data || [];
        return items
            .filter((h: any) => (h.status || "").toUpperCase() !== "COMPLETED")
            .map((h: any) => ({
                id: h.id,
                task: h.task,
                dueAt: h.dueAt,
                status: h.status,
            }));
    }, [hwData]);

    // Reset on open
    useEffect(() => {
        if (!visible) return;
        setReminderType(hasDebt ? "payment" : "lesson");
        setSelectedLessonIds([]);
        setSelectedHomeworkIds([]);
        setShowComment(false);
        setComment("");
        setNotifyParent(false);
        setSaving(false);
        setErrorText(null);
        setSuccessText(null);
    }, [visible, hasDebt]);

    // Auto-select nearest planned lesson when switching to "lesson" type
    useEffect(() => {
        if (reminderType === "lesson" && plannedLessons.length > 0 && selectedLessonIds.length === 0) {
            setSelectedLessonIds([plannedLessons[0].id]);
        }
    }, [reminderType, plannedLessons, selectedLessonIds.length]);

    // Auto-select first pending homework
    useEffect(() => {
        if (reminderType === "homework" && homeworks.length > 0 && selectedHomeworkIds.length === 0) {
            setSelectedHomeworkIds([homeworks[0].id]);
        }
    }, [reminderType, homeworks, selectedHomeworkIds.length]);

    const toggleLesson = (id: string) => {
        setSelectedLessonIds((prev) =>
            prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
        );
    };

    const toggleHomework = (id: string) => {
        setSelectedHomeworkIds((prev) =>
            prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
        );
    };

    const formatLessonLabel = (lesson: Lesson) => {
        const d = new Date(`${lesson.date}T${lesson.startTime}`);
        const dateStr = d.toLocaleDateString("ru-RU", {
            day: "numeric",
            month: "short",
        });
        return `${lesson.subject} · ${dateStr} в ${lesson.startTime}`;
    };

    const formatCompletedLessonLabel = (lesson: Lesson) => {
        const d = new Date(`${lesson.date}T${lesson.startTime}`);
        const dateStr = d.toLocaleDateString("ru-RU", {
            day: "numeric",
            month: "short",
        });
        return `${lesson.subject} · ${dateStr} · ${lesson.rate?.toLocaleString("ru-RU")} ₽`;
    };

    const formatHomeworkLabel = (hw: HomeworkItem) => {
        const taskPreview =
            hw.task.length > 60 ? hw.task.slice(0, 60) + "…" : hw.task;
        if (hw.dueAt) {
            const d = new Date(hw.dueAt);
            const dateStr = d.toLocaleDateString("ru-RU", {
                day: "numeric",
                month: "short",
            });
            return `${taskPreview} · до ${dateStr}`;
        }
        return taskPreview;
    };

    const canSubmit = () => {
        if (saving) return false;
        if (reminderType === "lesson" && selectedLessonIds.length === 0) return false;
        if (reminderType === "homework" && selectedHomeworkIds.length === 0) return false;
        return true;
    };

    const handleSubmit = async () => {
        if (!canSubmit()) return;
        setSaving(true);
        setErrorText(null);
        setSuccessText(null);

        try {
            const result = await sendReminder(studentId, {
                type: reminderType,
                lessonIds: reminderType === "lesson" ? selectedLessonIds : undefined,
                homeworkIds: reminderType === "homework" ? selectedHomeworkIds : undefined,
                comment: comment.trim() || undefined,
                notifyParent: reminderType === "payment" ? notifyParent : undefined,
            });

            if (result.sent) {
                setSuccessText("Напоминание отправлено");
                setTimeout(() => {
                    onSent?.();
                    onClose();
                }, 1200);
            } else {
                setErrorText(
                    "Не удалось отправить — у ученика нет подключённых каналов (Telegram / Max). Подключите через портал."
                );
                setSaving(false);
            }
        } catch (error: any) {
            setErrorText(codedErrorMessage("REMINDER-SEND", error));
            setSaving(false);
        }
    };

    const renderTypeSelection = () => (
        <div>
            <Text variant="body-2" color="secondary" style={{ marginBottom: 8, display: "block" }}>
                Тип напоминания
            </Text>
            <SegmentedRadioGroup
                value={reminderType}
                onUpdate={(val) => {
                    setReminderType(val as ReminderType);
                    setSelectedLessonIds([]);
                    setSelectedHomeworkIds([]);
                    setErrorText(null);
                }}
                size="m"
                options={typeOptions}
            />
        </div>
    );

    const renderPaymentSection = () => (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div
                style={{
                    background: "var(--g-color-base-generic)",
                    borderRadius: 12,
                    padding: 16,
                }}
            >
                <Text variant="body-2" color="secondary">
                    Ученику будет отправлено напоминание об оплате с указанием текущей задолженности.
                </Text>
            </div>

            {/* Completed (unpaid) lessons list */}
            {lessonsLoading ? (
                <div style={{ display: "flex", justifyContent: "center", padding: 12 }}>
                    <Loader size="s" />
                </div>
            ) : completedLessons.length > 0 ? (
                <div>
                    <Text variant="body-2" color="secondary" style={{ marginBottom: 8, display: "block" }}>
                        Проведённые занятия без оплаты
                    </Text>
                    <div
                        style={{
                            display: "flex",
                            flexDirection: "column",
                            gap: 4,
                            maxHeight: 160,
                            overflowY: "auto",
                        }}
                    >
                        {completedLessons.map((lesson) => (
                            <div
                                key={lesson.id}
                                style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 10,
                                    padding: "8px 14px",
                                    borderRadius: 10,
                                    background: "var(--g-color-base-generic)",
                                }}
                            >
                                <Text variant="body-2">{formatCompletedLessonLabel(lesson)}</Text>
                            </div>
                        ))}
                    </div>
                </div>
            ) : (
                <div
                    style={{
                        background: "var(--g-color-base-generic)",
                        borderRadius: 12,
                        padding: 16,
                    }}
                >
                    <Text variant="body-2" color="secondary">
                        Нет проведённых занятий без оплаты.
                    </Text>
                </div>
            )}

            {/* Notify parent toggle — outside the container */}
            {hasParent && (
                <div
                    style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        padding: "10px 0",
                    }}
                >
                    <Text variant="body-2">Уведомить родителя</Text>
                    <Switch
                        checked={notifyParent}
                        onUpdate={setNotifyParent}
                        size="l"
                    />
                </div>
            )}
        </div>
    );

    const renderLessonSection = () => {
        if (lessonsLoading) {
            return (
                <div style={{ display: "flex", justifyContent: "center", padding: 20 }}>
                    <Loader size="m" />
                </div>
            );
        }

        if (plannedLessons.length === 0) {
            return (
                <div
                    style={{
                        background: "var(--g-color-base-generic)",
                        borderRadius: 12,
                        padding: 16,
                    }}
                >
                    <Text variant="body-2" color="secondary">
                        Нет запланированных занятий для напоминания.
                    </Text>
                </div>
            );
        }

        return (
            <div
                style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: 8,
                }}
            >
                <Text variant="body-2" color="secondary">
                    Выберите занятия для напоминания
                </Text>
                <div
                    style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: 4,
                        maxHeight: 200,
                        overflowY: "auto",
                    }}
                >
                    {plannedLessons.map((lesson) => (
                        <label
                            key={lesson.id}
                            style={{
                                display: "flex",
                                alignItems: "center",
                                gap: 10,
                                padding: "10px 14px",
                                borderRadius: 10,
                                cursor: "pointer",
                                background: selectedLessonIds.includes(lesson.id)
                                    ? "rgba(174,122,255,0.08)"
                                    : "var(--g-color-base-generic)",
                                border: selectedLessonIds.includes(lesson.id)
                                    ? "1px solid var(--g-color-line-brand)"
                                    : "1px solid transparent",
                                transition: "all 0.15s",
                            }}
                        >
                            <Checkbox
                                checked={selectedLessonIds.includes(lesson.id)}
                                onUpdate={() => toggleLesson(lesson.id)}
                                size="m"
                            />
                            <Text variant="body-2">{formatLessonLabel(lesson)}</Text>
                        </label>
                    ))}
                </div>
            </div>
        );
    };

    const renderHomeworkSection = () => {
        if (hwLoading) {
            return (
                <div style={{ display: "flex", justifyContent: "center", padding: 20 }}>
                    <Loader size="m" />
                </div>
            );
        }

        if (homeworks.length === 0) {
            return (
                <div
                    style={{
                        background: "var(--g-color-base-generic)",
                        borderRadius: 12,
                        padding: 16,
                    }}
                >
                    <Text variant="body-2" color="secondary">
                        Нет невыполненных домашних заданий.
                    </Text>
                </div>
            );
        }

        return (
            <div
                style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: 8,
                }}
            >
                <Text variant="body-2" color="secondary">
                    Выберите домашние задания
                </Text>
                <div
                    style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: 4,
                        maxHeight: 200,
                        overflowY: "auto",
                    }}
                >
                    {homeworks.map((hw) => (
                        <label
                            key={hw.id}
                            style={{
                                display: "flex",
                                alignItems: "center",
                                gap: 10,
                                padding: "10px 14px",
                                borderRadius: 10,
                                cursor: "pointer",
                                background: selectedHomeworkIds.includes(hw.id)
                                    ? "rgba(174,122,255,0.08)"
                                    : "var(--g-color-base-generic)",
                                border: selectedHomeworkIds.includes(hw.id)
                                    ? "1px solid var(--g-color-line-brand)"
                                    : "1px solid transparent",
                                transition: "all 0.15s",
                            }}
                        >
                            <Checkbox
                                checked={selectedHomeworkIds.includes(hw.id)}
                                onUpdate={() => toggleHomework(hw.id)}
                                size="m"
                            />
                            <Text variant="body-2" ellipsis>
                                {formatHomeworkLabel(hw)}
                            </Text>
                        </label>
                    ))}
                </div>
            </div>
        );
    };

    return (
        <GDialog
            open={visible}
            onClose={onClose}
            size="s"
            hasCloseButton
        >
            <GDialog.Header caption={`Напомнить · ${studentName}`} />
            <GDialog.Body>
                <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                    {renderTypeSelection()}

                    {reminderType === "payment" && renderPaymentSection()}
                    {reminderType === "lesson" && renderLessonSection()}
                    {reminderType === "homework" && renderHomeworkSection()}

                    {/* Expandable comment field */}
                    {!showComment ? (
                        <Button
                            view="flat"
                            size="m"
                            onClick={() => setShowComment(true)}
                            style={{ alignSelf: "flex-start" }}
                        >
                            + Добавить сообщение
                        </Button>
                    ) : (
                        <div>
                            <Text
                                variant="body-2"
                                color="secondary"
                                style={{ marginBottom: 8, display: "block" }}
                            >
                                Сообщение
                            </Text>
                            <TextArea
                                value={comment}
                                onUpdate={setComment}
                                placeholder="Добавить сообщение к напоминанию…"
                                rows={2}
                                size="m"
                                autoFocus
                            />
                        </div>
                    )}

                    {errorText && (
                        <Text
                            variant="body-2"
                            style={{ color: "var(--g-color-text-danger)" }}
                        >
                            {errorText}
                        </Text>
                    )}
                    {successText && (
                        <Text
                            variant="body-2"
                            style={{ color: "var(--g-color-text-positive)" }}
                        >
                            ✓ {successText}
                        </Text>
                    )}
                </div>
            </GDialog.Body>
            <GDialog.Footer
                textButtonApply="Отправить"
                textButtonCancel="Отмена"
                propsButtonApply={{
                    disabled: !canSubmit(),
                    loading: saving,
                }}
                onClickButtonApply={handleSubmit}
                onClickButtonCancel={onClose}
            />
        </GDialog>
    );
};

export default RemindModal;
