import { useState } from "react";
import {
    Card,
    Text,
    Button,
    Label,
    Dialog,
    TextInput,
    Icon,
} from "@gravity-ui/uikit";
import { Calendar as CalendarIcon } from "@gravity-ui/icons";
import type { IconData } from "@gravity-ui/uikit";
import StyledDateInput from "@/components/StyledDateInput";
import StyledTimeInput from "@/components/StyledTimeInput";
import { api } from "@/lib/api";
import type { StudentPortalData, RecentLesson } from "@/types/student-portal";
import type { PortalLesson } from "@/types/student-portal";

type LessonsTabProps = {
    data: StudentPortalData;
    token?: string;
};

const LessonsTab = ({ data, token }: LessonsTabProps) => {
    const [lessons, setLessons] = useState(data.upcomingLessons);
    const [recentLessons, setRecentLessons] = useState<RecentLesson[]>(
        data.recentLessons
    );
    const [cancelConfirm, setCancelConfirm] = useState<string | null>(null);
    const [rescheduleId, setRescheduleId] = useState<string | null>(null);
    const [rescheduleDate, setRescheduleDate] = useState("");
    const [rescheduleTime, setRescheduleTime] = useState("");
    const [feedbackIdx, setFeedbackIdx] = useState<number | null>(null);
    const [feedbackRating, setFeedbackRating] = useState(0);
    const [feedbackText, setFeedbackText] = useState("");
    const [feedbackSubmitting, setFeedbackSubmitting] = useState(false);
    const [recentShown, setRecentShown] = useState(3);
    const [cancelLoadingId, setCancelLoadingId] = useState<string | null>(null);
    const [rescheduleLoading, setRescheduleLoading] = useState(false);

    const formatHoursWord = (hours: number) => {
        const abs = Math.abs(hours) % 100;
        const last = abs % 10;
        if (abs > 10 && abs < 20) return "часов";
        if (last === 1) return "час";
        if (last >= 2 && last <= 4) return "часа";
        return "часов";
    };

    const normalizeRecentStatus = (status?: string) =>
        (status || "").trim().toLowerCase();

    const isRecentCompleted = (status?: string) => {
        const normalized = normalizeRecentStatus(status);
        return normalized === "проведено" || normalized === "completed";
    };

    const getRecentStatusLabel = (status?: string) => {
        if (isRecentCompleted(status)) return "Проведено";

        const normalized = normalizeRecentStatus(status);
        if (normalized === "cancelled" || normalized === "отменено") {
            return "Отменено";
        }

        return status || "-";
    };

    const getRecentStatusClass = (status?: string) =>
        isRecentCompleted(status) ? "label-green" : "label-stroke-pink";

    const normalizePolicyAction = (action?: string) => {
        const normalized = (action || "").trim().toLowerCase();

        if (
            normalized === "full" ||
            normalized === "full_charge" ||
            normalized === "charge"
        ) {
            return "100% стоимости занятия";
        }
        if (normalized === "half" || normalized === "half_charge") {
            return "50% стоимости занятия";
        }
        if (normalized === "none" || normalized === "no_charge") {
            return "без списания";
        }
        if (!normalized) {
            return "100% стоимости занятия";
        }

        return action || "100% стоимости занятия";
    };

    const lateActionValue =
        data.cancelPolicy.lateCancelAction || data.cancelPolicy.lateAction;
    const lateActionLabel = normalizePolicyAction(lateActionValue);
    const noShowActionLabel = normalizePolicyAction(
        data.cancelPolicy.noShowAction
    );
    const lateCancelWarning = data.cancelPolicy.lateCancelCost
        ? `Поздняя отмена! Будет списано ${data.cancelPolicy.lateCancelCost.toLocaleString("ru-RU")} ₽.`
        : lateActionLabel === "без списания"
          ? "Поздняя отмена! Штрафа не будет."
          : `Поздняя отмена! Будет списано ${lateActionLabel}.`;

    const handleCancel = async (lesson: PortalLesson) => {
        if (cancelConfirm === lesson.id) {
            if (!token) return;
            setCancelLoadingId(lesson.id);
            try {
                await api(`/portal/${token}/lessons/${lesson.id}/cancel`, {
                    method: "POST",
                });
                setLessons((prev) =>
                    prev.map((l) =>
                        l.id === lesson.id
                            ? { ...l, status: "cancelled" as const }
                            : l
                    )
                );
                setCancelConfirm(null);
            } catch {
                if (typeof window !== "undefined") {
                    window.alert("Не удалось отменить занятие. Попробуйте снова.");
                }
            } finally {
                setCancelLoadingId(null);
            }
        } else {
            setCancelConfirm(lesson.id);
        }
    };

    const handleRescheduleSubmit = async () => {
        if (!rescheduleDate || !rescheduleTime || !rescheduleId || !token) return;
        const original = lessons.find((l) => l.id === rescheduleId);
        if (!original) return;

        setRescheduleLoading(true);
        try {
            await api(`/portal/${token}/lessons/${rescheduleId}/reschedule`, {
                method: "POST",
                body: { newDate: rescheduleDate, newTime: rescheduleTime },
            });
            setLessons((prev) =>
                prev.map((l) =>
                    l.id === rescheduleId
                        ? {
                              ...l,
                              status: "reschedule_pending" as const,
                              rescheduleFrom: `${l.date}, ${l.time}`,
                              rescheduleTo: `${rescheduleDate}, ${rescheduleTime}`,
                          }
                        : l
                )
            );
            setRescheduleId(null);
            setRescheduleDate("");
            setRescheduleTime("");
        } catch {
            if (typeof window !== "undefined") {
                window.alert("Не удалось отправить запрос на перенос. Попробуйте снова.");
            }
        } finally {
            setRescheduleLoading(false);
        }
    };

    const handleFeedbackSubmit = async () => {
        if (feedbackIdx === null || feedbackRating === 0) return;

        const lesson = recentLessons[feedbackIdx];
        if (!lesson?.id || !token) {
            if (typeof window !== "undefined") {
                window.alert("Не удалось сохранить отзыв. Обновите страницу и попробуйте ещё раз.");
            }
            return;
        }

        setFeedbackSubmitting(true);
        try {
            await api(`/portal/${token}/lessons/${lesson.id}/feedback`, {
                method: "POST",
                body: {
                    rating: feedbackRating,
                    feedback: feedbackText.trim() || undefined,
                },
            });

            setRecentLessons((prev) =>
                prev.map((l, i) =>
                    i === feedbackIdx
                        ? {
                              ...l,
                              rating: feedbackRating,
                              feedback: feedbackText.trim() || undefined,
                          }
                        : l
                )
            );
            setFeedbackIdx(null);
            setFeedbackRating(0);
            setFeedbackText("");
        } catch {
            if (typeof window !== "undefined") {
                window.alert("Не удалось сохранить отзыв. Попробуйте ещё раз.");
            }
        } finally {
            setFeedbackSubmitting(false);
        }
    };

    const activeLessons = lessons.filter(
        (l) => l.status !== "cancelled"
    );

    const statusBadge = (lesson: PortalLesson) => {
        switch (lesson.status) {
            case "reschedule_pending":
                return <Label theme="info" size="xs">Ожидает подтверждения</Label>;
            case "rescheduled":
                return <Label theme="info" size="xs">Перенесено</Label>;
            case "cancelled":
                return <Label theme="danger" size="xs">Отменено</Label>;
            default:
                return null;
        }
    };

    return (
        <>
            {/* Upcoming / active lessons */}
            <Card view="outlined" style={{ marginBottom: 24, overflow: "hidden" }}>
                <div className="repeto-card-header">
                    <Text variant="subheader-2">Ближайшие занятия</Text>
                </div>
                <div style={{ padding: 20, display: "flex", flexDirection: "column", gap: 16 }}>
                    {activeLessons.length === 0 && (
                        <Text variant="body-1" color="secondary">
                            Нет запланированных занятий
                        </Text>
                    )}
                    {activeLessons.map((lesson) => (
                        <Card key={lesson.id} view="outlined" style={{ padding: 16 }}>
                            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                                <div>
                                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                                        <Icon data={CalendarIcon as IconData} size={16} />
                                        <Text variant="body-2" style={{ fontWeight: 600 }}>
                                            {lesson.date} · {lesson.time}
                                        </Text>
                                    </div>
                                    <Text variant="body-1" color="secondary">
                                        {lesson.subject} ·{" "}
                                        {lesson.modality === "online" ? "Онлайн" : "Офлайн"}
                                    </Text>
                                </div>
                                <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4 }}>
                                    <Text variant="body-2" style={{ fontWeight: 600 }}>
                                        {lesson.price.toLocaleString("ru-RU")} ₽
                                    </Text>
                                    {statusBadge(lesson)}
                                </div>
                            </div>

                            {/* Reschedule info */}
                            {lesson.status === "reschedule_pending" && lesson.rescheduleTo && (
                                <Card view="filled" style={{ padding: 12, marginBottom: 12, background: "var(--g-color-base-info-light)" }}>
                                    <Text variant="caption-1" style={{ fontWeight: 600, marginBottom: 2, display: "block" }}>
                                        Запрос на перенос
                                    </Text>
                                    <Text variant="caption-1" color="secondary">
                                        Новое время: {lesson.rescheduleTo}. Ожидаем подтверждение от репетитора.
                                    </Text>
                                </Card>
                            )}

                            {lesson.status === "rescheduled" && lesson.rescheduleFrom && lesson.rescheduleTo && (
                                <Card view="filled" style={{ padding: 12, marginBottom: 12, background: "var(--g-color-base-info-light)" }}>
                                    <Text variant="caption-1" style={{ fontWeight: 600 }}>
                                        Перенесено с {lesson.rescheduleFrom} на {lesson.rescheduleTo}
                                    </Text>
                                </Card>
                            )}

                            {/* Cancel confirmation */}
                            {cancelConfirm === lesson.id && (
                                <Card view="filled" style={{ padding: 12, marginBottom: 12, background: "var(--g-color-base-danger-light)" }}>
                                    <Text variant="caption-1" style={{ fontWeight: 600, color: "var(--g-color-text-danger)", marginBottom: 4, display: "block" }}>
                                        {lesson.canCancelFree
                                            ? `Отмена бесплатная (до занятия > ${data.cancelPolicy.freeHours} ${formatHoursWord(data.cancelPolicy.freeHours)}).`
                                            : lateCancelWarning}
                                    </Text>
                                    <Text variant="caption-1" color="secondary">
                                        Нажмите «Отменить» ещё раз для подтверждения.
                                    </Text>
                                </Card>
                            )}

                            {/* Action buttons */}
                            {lesson.status === "upcoming" && (
                                <div style={{ display: "flex", gap: 8 }}>
                                    <Button
                                        view={cancelConfirm === lesson.id ? "outlined-danger" : "outlined"}
                                        size="s"
                                        onClick={() => handleCancel(lesson)}
                                        loading={cancelLoadingId === lesson.id}
                                    >
                                        Отменить
                                    </Button>
                                    <Button
                                        view="outlined"
                                        size="s"
                                        onClick={() => {
                                            setRescheduleId(lesson.id);
                                            setCancelConfirm(null);
                                        }}
                                    >
                                        Перенести
                                    </Button>
                                </div>
                            )}

                            {lesson.status === "reschedule_pending" && (
                                <Text variant="caption-1" color="secondary">
                                    Дождитесь ответа репетитора
                                </Text>
                            )}
                        </Card>
                    ))}
                </div>
            </Card>

            {/* Recent lessons */}
            <Card view="outlined" style={{ marginBottom: 24, overflow: "hidden" }}>
                <div className="repeto-card-header">
                    <Text variant="subheader-2">Прошедшие занятия</Text>
                </div>
                <div style={{ padding: 20 }}>
                    {recentLessons.length === 0 && (
                        <Text variant="body-1" color="secondary">
                            Пока занятий не было
                        </Text>
                    )}
                    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                        {recentLessons.slice(0, recentShown).map((l, i) => {
                            const statusLabel = getRecentStatusLabel(l.status);

                            return (
                                <Card key={l.id || i} view="outlined" style={{ padding: 12 }}>
                                    <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
                                        <div style={{ display: "flex", gap: 12, minWidth: 0 }}>
                                            <Text variant="body-1" color="secondary" style={{ whiteSpace: "nowrap", flexShrink: 0 }}>
                                                {l.date}
                                            </Text>
                                            <Text variant="body-2" ellipsis>{l.subject}</Text>
                                        </div>
                                        <div style={{ display: "flex", alignItems: "center", gap: 12, flexShrink: 0 }}>
                                            <Label
                                                theme={isRecentCompleted(l.status) ? "success" : "danger"}
                                                size="xs"
                                            >
                                                {statusLabel}
                                            </Label>
                                            {l.price > 0 && (
                                                <Text variant="body-2" style={{ fontWeight: 600, width: 64, textAlign: "right" }}>
                                                    {l.price.toLocaleString("ru-RU")} ₽
                                                </Text>
                                            )}
                                        </div>
                                    </div>
                                    {/* Feedback section */}
                                    {isRecentCompleted(l.status) && (
                                        <div style={{ marginTop: 8, paddingTop: 8, borderTop: "1px dashed var(--g-color-line-generic)", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
                                            <div style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 0 }}>
                                                <Text variant="caption-1" color="secondary">Оценка</Text>
                                                <div style={{ display: "flex", gap: 4 }}>
                                                    {[1, 2, 3, 4, 5].map((star) => (
                                                        <button
                                                            key={star}
                                                            type="button"
                                                            onClick={() => {
                                                                if (!l.rating) {
                                                                    setFeedbackIdx(i);
                                                                    setFeedbackRating(star);
                                                                    setFeedbackText(l.feedback || "");
                                                                }
                                                            }}
                                                            style={{
                                                                width: 20,
                                                                height: 20,
                                                                borderRadius: "50%",
                                                                border: "none",
                                                                cursor: l.rating ? "default" : "pointer",
                                                                transition: "background 0.15s",
                                                                background: star <= (l.rating || 0)
                                                                    ? "var(--g-color-base-brand)"
                                                                    : "var(--g-color-base-generic)",
                                                            }}
                                                        />
                                                    ))}
                                                </div>
                                            </div>
                                            <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
                                                {l.feedback ? (
                                                    <Text variant="caption-1" color="secondary" ellipsis style={{ maxWidth: 160 }}>
                                                        {l.feedback}
                                                    </Text>
                                                ) : (
                                                    <Button
                                                        view="flat"
                                                        size="xs"
                                                        onClick={() => {
                                                            setFeedbackIdx(i);
                                                            setFeedbackRating(l.rating || 0);
                                                            setFeedbackText("");
                                                        }}
                                                    >
                                                        Отзыв
                                                    </Button>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </Card>
                            );
                        })}
                    </div>
                    {recentShown < recentLessons.length && (
                        <Button
                            view="outlined"
                            size="s"
                            width="max"
                            style={{ marginTop: 16 }}
                            onClick={() =>
                                setRecentShown((prev) =>
                                    Math.min(prev + 5, recentLessons.length)
                                )
                            }
                        >
                            Показать ещё ({recentLessons.length - recentShown})
                        </Button>
                    )}
                </div>
            </Card>

            {/* Cancel policy */}
            <Card view="outlined" style={{ overflow: "hidden" }}>
                <div className="repeto-card-header">
                    <Text variant="subheader-2">Политика отмен</Text>
                </div>
                <div style={{ padding: 20 }}>
                    <Text variant="body-1" style={{ lineHeight: 1.6 }}>
                        Бесплатная отмена за{" "}
                        <span style={{ fontWeight: 600 }}>
                            {data.cancelPolicy.freeHours} {formatHoursWord(data.cancelPolicy.freeHours)}
                        </span>{" "}
                        до занятия. При поздней отмене —{" "}
                        <span style={{ fontWeight: 600 }}>{lateActionLabel}</span>.
                        При неявке — <span style={{ fontWeight: 600 }}>{noShowActionLabel}</span>.
                    </Text>
                </div>
            </Card>

            {/* Reschedule Dialog */}
            <Dialog
                open={!!rescheduleId}
                onClose={() => {
                    setRescheduleId(null);
                    setRescheduleDate("");
                    setRescheduleTime("");
                }}
                size="s"
            >
                <Dialog.Header caption="Перенести занятие" />
                <Dialog.Body>
                    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                        <Text variant="body-1" color="secondary">
                            Выберите желаемую дату и время. Репетитор получит
                            уведомление и подтвердит перенос.
                        </Text>
                        <div>
                            <Text variant="caption-1" color="secondary" as="label" style={{ display: "block", marginBottom: 6, fontWeight: 600 }}>
                                Новая дата
                            </Text>
                            <StyledDateInput
                                value={rescheduleDate}
                                onUpdate={setRescheduleDate}
                            />
                        </div>
                        <div>
                            <Text variant="caption-1" color="secondary" as="label" style={{ display: "block", marginBottom: 6, fontWeight: 600 }}>
                                Новое время
                            </Text>
                            <StyledTimeInput
                                value={rescheduleTime}
                                onUpdate={setRescheduleTime}
                                showClockIcon={false}
                            />
                        </div>
                    </div>
                </Dialog.Body>
                <Dialog.Footer
                    onClickButtonApply={handleRescheduleSubmit}
                    onClickButtonCancel={() => {
                        setRescheduleId(null);
                        setRescheduleDate("");
                        setRescheduleTime("");
                    }}
                    textButtonApply={rescheduleLoading ? "Отправляем..." : "Отправить запрос"}
                    textButtonCancel="Отмена"
                    propsButtonApply={{ disabled: rescheduleLoading || !rescheduleDate || !rescheduleTime }}
                    propsButtonCancel={{ disabled: rescheduleLoading }}
                />
            </Dialog>

            {/* Feedback Dialog */}
            <Dialog
                open={feedbackIdx !== null}
                onClose={() => {
                    setFeedbackIdx(null);
                    setFeedbackRating(0);
                    setFeedbackText("");
                }}
                size="s"
            >
                <Dialog.Header caption="Как прошло занятие?" />
                <Dialog.Body>
                    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                        {feedbackIdx !== null && (
                            <Text variant="body-1" color="secondary">
                                {recentLessons[feedbackIdx]?.date} —{" "}
                                {recentLessons[feedbackIdx]?.subject}
                            </Text>
                        )}
                        <div>
                            <Text variant="caption-1" color="secondary" as="label" style={{ display: "block", marginBottom: 8, fontWeight: 600 }}>
                                Оценка
                            </Text>
                            <div style={{ display: "flex", gap: 8 }}>
                                {[1, 2, 3, 4, 5].map((star) => (
                                    <button
                                        key={star}
                                        type="button"
                                        style={{
                                            width: 40,
                                            height: 40,
                                            borderRadius: "50%",
                                            border: `2px solid ${star <= feedbackRating ? "var(--g-color-base-brand)" : "var(--g-color-line-generic)"}`,
                                            background: star <= feedbackRating ? "var(--g-color-base-brand)" : "transparent",
                                            color: star <= feedbackRating ? "var(--g-color-text-brand-contrast)" : "var(--g-color-text-primary)",
                                            cursor: "pointer",
                                            fontWeight: 600,
                                            fontSize: 14,
                                            transition: "all 0.15s",
                                        }}
                                        onClick={() => setFeedbackRating(star)}
                                    >
                                        {star}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div>
                            <Text variant="caption-1" color="secondary" as="label" style={{ display: "block", marginBottom: 6, fontWeight: 600 }}>
                                Комментарий (необязательно)
                            </Text>
                            <TextInput
                                size="l"
                                placeholder="Что понравилось, что можно улучшить..."
                                value={feedbackText}
                                onUpdate={setFeedbackText}
                            />
                        </div>
                    </div>
                </Dialog.Body>
                <Dialog.Footer
                    onClickButtonApply={handleFeedbackSubmit}
                    onClickButtonCancel={() => {
                        setFeedbackIdx(null);
                        setFeedbackRating(0);
                        setFeedbackText("");
                    }}
                    textButtonApply={feedbackSubmitting ? "Сохранение..." : "Отправить"}
                    textButtonCancel="Пропустить"
                    propsButtonApply={{ disabled: feedbackRating === 0 || feedbackSubmitting }}
                />
            </Dialog>
        </>
    );
};

export default LessonsTab;
