import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { createPortal } from "react-dom";
import {
    Text,
    TextArea,
    Checkbox,
    Switch,
    Button,
    Icon,
    Loader,
    Select,
} from "@gravity-ui/uikit";
import { ArrowLeft } from "@gravity-ui/icons";
import type { IconData } from "@gravity-ui/uikit";
import { useLessons } from "@/hooks/useLessons";
import { usePayments } from "@/hooks/usePayments";
import { useStudentHomework } from "@/hooks/useStudents";
import { sendReminder } from "@/hooks/useNotifications";
import { codedErrorMessage } from "@/lib/errorCodes";
import { Lp2Field } from "@/components/Lp2Field";
import type { Lesson } from "@/types/schedule";

type ReminderType = "payment" | "lesson" | "homework";

type RemindModalProps = {
    visible: boolean;
    onClose: () => void;
    onSent?: () => void;
    studentId: string;
    studentName: string;
    hasDebt: boolean;
    hasParentEmail: boolean;
    initialType?: ReminderType;
};

type HomeworkItem = {
    id: string;
    task: string;
    dueAt?: string;
    status: string;
};

const typeOptions = [
    { value: "payment", content: "Об оплате" },
    { value: "lesson", content: "О занятии" },
    { value: "homework", content: "О домашке" },
];

const PANEL_Z = 135;

const RemindModal = ({
    visible,
    onClose,
    onSent,
    studentId,
    studentName,
    hasDebt,
    hasParentEmail,
    initialType,
}: RemindModalProps) => {
    const panelRef = useRef<HTMLDivElement>(null);
    const [mounted, setMounted] = useState(false);
    const [shouldRender, setShouldRender] = useState(false);
    const [isPanelVisible, setIsPanelVisible] = useState(false);

    const [reminderType, setReminderType] = useState<ReminderType>("payment");
    const [selectedLessonIds, setSelectedLessonIds] = useState<string[]>([]);
    const [selectedHomeworkIds, setSelectedHomeworkIds] = useState<string[]>([]);
    const [showComment, setShowComment] = useState(false);
    const [comment, setComment] = useState("");
    const [notifyParent, setNotifyParent] = useState(false);
    const [saving, setSaving] = useState(false);
    const [errorText, setErrorText] = useState<string | null>(null);
    const [successText, setSuccessText] = useState<string | null>(null);

    // LP2 panel lifecycle
    useEffect(() => { setMounted(true); }, []);

    useEffect(() => {
        if (visible) {
            setShouldRender(true);
            const raf1 = requestAnimationFrame(() => {
                requestAnimationFrame(() => setIsPanelVisible(true));
            });
            return () => cancelAnimationFrame(raf1);
        } else {
            setIsPanelVisible(false);
        }
    }, [visible]);

    const handleTransitionEnd = useCallback(() => {
        if (!isPanelVisible) setShouldRender(false);
    }, [isPanelVisible]);

    const handleClose = useCallback(() => {
        setIsPanelVisible(false);
        setTimeout(() => onClose(), 350);
    }, [onClose]);

    useEffect(() => {
        if (!visible) return;
        const handler = (e: KeyboardEvent) => { if (e.key === "Escape") handleClose(); };
        document.addEventListener("keydown", handler);
        return () => document.removeEventListener("keydown", handler);
    }, [visible, handleClose]);

    // Fetch lessons for this student
    const { data: allLessons = [], loading: lessonsLoading } = useLessons({
        studentId,
    });

    const { data: studentPaymentsData } = usePayments({
        studentId,
        limit: 300,
    });

    const linkedLessonIdSet = useMemo(() => {
        const ids = new Set<string>();
        (studentPaymentsData?.data || []).forEach((payment) => {
            if (payment.lessonId) {
                ids.add(payment.lessonId);
            }
        });
        return ids;
    }, [studentPaymentsData?.data]);

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
            .filter(
                (l) => l.status === "completed" && !linkedLessonIdSet.has(l.id)
            )
            .sort((a, b) => (a.date > b.date ? -1 : 1));
    }, [allLessons, linkedLessonIdSet]);

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
        setReminderType(initialType || (hasDebt ? "payment" : "lesson"));
        setSelectedLessonIds([]);
        setSelectedHomeworkIds([]);
        setShowComment(false);
        setComment("");
        setNotifyParent(false);
        setSaving(false);
        setErrorText(null);
        setSuccessText(null);
    }, [visible, hasDebt, initialType]);

    useEffect(() => {
        if (!hasParentEmail && notifyParent) {
            setNotifyParent(false);
        }
    }, [hasParentEmail, notifyParent]);

    // Auto-select nearest planned lesson when switching to "lesson" type
    useEffect(() => {
        if (reminderType === "lesson" && plannedLessons.length > 0 && selectedLessonIds.length === 0) {
            setSelectedLessonIds([plannedLessons[0].id]);
        }
    }, [reminderType, plannedLessons, selectedLessonIds.length]);

    useEffect(() => {
        if (reminderType !== "payment") return;
        if (selectedLessonIds.length === 0) return;

        const allowedIds = new Set(completedLessons.map((lesson) => lesson.id));
        setSelectedLessonIds((prev) => prev.filter((id) => allowedIds.has(id)));
    }, [reminderType, completedLessons, selectedLessonIds.length]);

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
        if (
            reminderType === "payment" &&
            completedLessons.length > 0 &&
            selectedLessonIds.length === 0
        ) {
            return false;
        }
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
                lessonIds:
                    reminderType === "lesson" || reminderType === "payment"
                        ? selectedLessonIds
                        : undefined,
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
        <Lp2Field label="Тип напоминания">
            <Select
                size="l"
                width="max"
                options={typeOptions}
                value={[reminderType]}
                onUpdate={([val]) => {
                    setReminderType(val as ReminderType);
                    setSelectedLessonIds([]);
                    setSelectedHomeworkIds([]);
                    setErrorText(null);
                }}
                popupClassName="lp2-popup"
            />
        </Lp2Field>
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
                        Выберите проведенные занятия для напоминания о долге
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
                                <Text variant="body-2">{formatCompletedLessonLabel(lesson)}</Text>
                            </label>
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

            <div
                title={!hasParentEmail ? "Сначала добавьте почту родителя" : undefined}
                style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "10px 0",
                    opacity: hasParentEmail ? 1 : 0.65,
                }}
            >
                <div>
                    <Text variant="body-2">Напомнить родителям</Text>
                    {!hasParentEmail && (
                        <Text as="div" variant="caption-2" color="secondary" style={{ marginTop: 2 }}>
                            Сначала добавьте почту родителя
                        </Text>
                    )}
                </div>
                <Switch
                    checked={notifyParent}
                    onUpdate={(value) => {
                        if (!hasParentEmail) return;
                        setNotifyParent(value);
                    }}
                    size="l"
                    disabled={!hasParentEmail}
                />
            </div>
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

    if (!mounted || (!shouldRender && !visible)) return null;

    const panelContent = (
        <div
            ref={panelRef}
            className={`lp2 ${isPanelVisible ? "lp2--open" : ""}`}
            style={{ zIndex: PANEL_Z }}
            onTransitionEnd={handleTransitionEnd}
            role="dialog"
            aria-modal="false"
            aria-label={`Напомнить · ${studentName}`}
        >
            <div className="lp2__topbar">
                <button type="button" className="lp2__back" onClick={handleClose} aria-label="Назад">
                    <Icon data={ArrowLeft as IconData} size={18} />
                </button>
                <div className="lp2__topbar-actions" />
            </div>

            <div className="lp2__scroll">
                <div className="lp2__center">
                    <h1 className="lp2__page-title">Напомнить · {studentName}</h1>

                    {renderTypeSelection()}

                    {reminderType === "payment" && renderPaymentSection()}
                    {reminderType === "lesson" && renderLessonSection()}
                    {reminderType === "homework" && renderHomeworkSection()}

                    <Lp2Field label="Сообщение">
                        <TextArea
                            value={comment}
                            onUpdate={setComment}
                            placeholder="Добавить сообщение к напоминанию…"
                            rows={2}
                            size="l"
                        />
                    </Lp2Field>

                    {errorText && (
                        <Text variant="body-1" style={{ color: "var(--g-color-text-danger)" }}>
                            {errorText}
                        </Text>
                    )}
                    {successText && (
                        <Text variant="body-1" style={{ color: "var(--g-color-text-positive)" }}>
                            ✓ {successText}
                        </Text>
                    )}
                </div>
            </div>

            <div className="lp2__bottombar">
                <Button
                    className="lp2__submit"
                    view="action"
                    size="xl"
                    width="max"
                    onClick={handleSubmit}
                    loading={saving}
                    disabled={!canSubmit()}
                >
                    Отправить
                </Button>
            </div>
        </div>
    );

    return createPortal(panelContent, document.body);
};

export default RemindModal;
