import { useState } from "react";
import Icon from "@/components/Icon";
import Modal from "@/components/Modal";
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

    const normalizeLateAction = (action?: string) => {
        const normalized = (action || "").trim().toLowerCase();

        if (!normalized || normalized === "charge") {
            return "списание по правилам репетитора";
        }
        if (normalized === "no_charge") {
            return "без списания";
        }
        if (normalized === "full_charge") {
            return "100% стоимости занятия";
        }
        if (normalized === "half_charge") {
            return "50% стоимости занятия";
        }

        return action || "списание по правилам репетитора";
    };

    const lateActionLabel = normalizeLateAction(data.cancelPolicy.lateAction);

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
                return (
                    <span className="label-stroke-purple">
                        Ожидает подтверждения
                    </span>
                );
            case "rescheduled":
                return (
                    <span className="label-stroke-purple">
                        Перенесено
                    </span>
                );
            case "cancelled":
                return (
                    <span className="label-stroke-pink">
                        Отменено
                    </span>
                );
            default:
                return null;
        }
    };

    return (
        <>
            {/* Upcoming / active lessons */}
            <div className="card mb-6">
                <div className="card-head"><div className="text-h6">Ближайшие занятия</div></div>
                <div className="p-5 space-y-4">
                    {activeLessons.length === 0 && (
                        <p className="text-sm text-n-3 dark:text-white/50">
                            Нет запланированных занятий
                        </p>
                    )}
                    {activeLessons.map((lesson) => (
                        <div
                            key={lesson.id}
                            className="p-4 rounded-sm border border-n-1 dark:border-white"
                        >
                            <div className="flex items-start justify-between mb-2">
                                <div>
                                    <div className="flex items-center gap-2 text-sm font-bold">
                                        <Icon
                                            className="icon-16 dark:fill-white"
                                            name="calendar"
                                        />
                                        {lesson.date} · {lesson.time}
                                    </div>
                                    <div className="mt-1 text-sm text-n-3 dark:text-white/50">
                                        {lesson.subject} ·{" "}
                                        {lesson.modality === "online"
                                            ? "Онлайн"
                                            : "Офлайн"}
                                    </div>
                                </div>
                                <div className="flex flex-col items-end gap-1">
                                    <span className="text-sm font-bold">
                                        {lesson.price.toLocaleString("ru-RU")} ₽
                                    </span>
                                    {statusBadge(lesson)}
                                </div>
                            </div>

                            {/* Reschedule info */}
                            {lesson.status === "reschedule_pending" &&
                                lesson.rescheduleTo && (
                                    <div className="mb-3 p-3 rounded-sm bg-purple-3 dark:bg-purple-1/10">
                                        <p className="text-xs font-bold mb-0.5">
                                            Запрос на перенос
                                        </p>
                                        <p className="text-xs text-n-3 dark:text-white/50">
                                            Новое время: {lesson.rescheduleTo}.
                                            Ожидаем подтверждение от репетитора.
                                        </p>
                                    </div>
                                )}

                            {lesson.status === "rescheduled" &&
                                lesson.rescheduleFrom &&
                                lesson.rescheduleTo && (
                                    <div className="mb-3 p-3 rounded-sm bg-purple-3 dark:bg-purple-1/10">
                                        <p className="text-xs font-bold">
                                            Перенесено с {lesson.rescheduleFrom}{" "}
                                            на {lesson.rescheduleTo}
                                        </p>
                                    </div>
                                )}

                            {/* Cancel confirmation */}
                            {cancelConfirm === lesson.id && (
                                <div className="mb-3 p-3 rounded-sm bg-pink-2 dark:bg-pink-1/10">
                                    <p className="text-xs text-pink-1 font-bold mb-1">
                                        {lesson.canCancelFree
                                            ? `Отмена бесплатная (до занятия > ${data.cancelPolicy.freeHours} ${formatHoursWord(data.cancelPolicy.freeHours)}).`
                                            : `Поздняя отмена! Будет списано ${data.cancelPolicy.lateCancelCost ? data.cancelPolicy.lateCancelCost.toLocaleString("ru-RU") + " ₽" : lateActionLabel}.`}
                                    </p>
                                    <p className="text-xs text-n-3 dark:text-white/50">
                                        Нажмите «Отменить» ещё раз для
                                        подтверждения.
                                    </p>
                                </div>
                            )}

                            {/* Action buttons — only for upcoming */}
                            {lesson.status === "upcoming" && (
                                <div className="flex gap-2">
                                    <button
                                        className={`btn-small ${
                                            cancelConfirm === lesson.id
                                                ? "btn-stroke !border-pink-1 !text-pink-1"
                                                : "btn-stroke"
                                        }`}
                                        onClick={() => handleCancel(lesson)}
                                        disabled={cancelLoadingId === lesson.id}
                                    >
                                        {cancelLoadingId === lesson.id
                                            ? "Отменяем..."
                                            : "Отменить"}
                                    </button>
                                    <button
                                        className="btn-small btn-stroke"
                                        onClick={() => {
                                            setRescheduleId(lesson.id);
                                            setCancelConfirm(null);
                                        }}
                                    >
                                        Перенести
                                    </button>
                                </div>
                            )}

                            {lesson.status === "reschedule_pending" && (
                                <p className="text-xs text-n-3 dark:text-white/50">
                                    Дождитесь ответа репетитора
                                </p>
                            )}
                        </div>
                    ))}
                </div>
            </div>

            {/* Recent lessons */}
            <div className="card mb-6">
                <div className="card-head"><div className="text-h6">Прошедшие занятия</div></div>
                <div className="p-5">
                    {recentLessons.length === 0 && (
                        <p className="text-sm text-n-3 dark:text-white/50">
                            Пока занятий не было
                        </p>
                    )}
                    <div className="space-y-3">
                        {recentLessons.slice(0, recentShown).map((l, i) => {
                            const statusLabel = getRecentStatusLabel(l.status);
                            const statusClass = getRecentStatusClass(l.status);

                            return (
                                <div
                                    key={l.id || i}
                                    className="p-3 rounded-sm border border-n-1 dark:border-white"
                                >
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="flex items-start gap-3 text-sm min-w-0">
                                            <span className="text-n-3 dark:text-white/50 whitespace-nowrap shrink-0">
                                                {l.date}
                                            </span>
                                            <span className="font-bold truncate">{l.subject}</span>
                                        </div>
                                        <div className="flex items-center gap-3 shrink-0">
                                            <span className={statusClass}>{statusLabel}</span>
                                            {l.price > 0 && (
                                                <span className="text-sm font-bold w-16 text-right">
                                                    {l.price.toLocaleString("ru-RU")} ₽
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    {/* Feedback section */}
                                    {isRecentCompleted(l.status) && (
                                        <div className="mt-2 pt-2 border-t border-dashed border-n-1 dark:border-white/20 flex items-center justify-between gap-3">
                                            <div className="flex items-center gap-3 min-w-0">
                                                <span className="text-xs text-n-3 dark:text-white/50">
                                                    Оценка
                                                </span>
                                                <div className="flex gap-1">
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
                                                            className={`w-5 h-5 rounded-full transition-colors ${
                                                                star <= (l.rating || 0)
                                                                    ? "bg-purple-1"
                                                                    : "bg-n-4 dark:bg-white/10 hover:bg-purple-1/50"
                                                            } ${l.rating ? "cursor-default" : "cursor-pointer"}`}
                                                        />
                                                    ))}
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2 shrink-0">
                                                {l.feedback ? (
                                                    <span className="text-xs text-n-3 dark:text-white/50 truncate max-w-[160px]">
                                                        {l.feedback}
                                                    </span>
                                                ) : (
                                                    <button
                                                        className="btn-stroke btn-small btn-square"
                                                        aria-label="Оставить отзыв"
                                                        title="Оставить отзыв"
                                                        onClick={() => {
                                                            setFeedbackIdx(i);
                                                            setFeedbackRating(l.rating || 0);
                                                            setFeedbackText("");
                                                        }}
                                                    >
                                                        <Icon
                                                            className="icon-16 fill-n-1 dark:fill-white"
                                                            name="comments"
                                                        />
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                    {recentShown < recentLessons.length && (
                        <button
                            className="btn-stroke btn-small w-full mt-4"
                            onClick={() =>
                                setRecentShown((prev) =>
                                    Math.min(prev + 5, recentLessons.length)
                                )
                            }
                        >
                            Показать ещё ({recentLessons.length - recentShown})
                        </button>
                    )}
                </div>
            </div>

            {/* Cancel policy */}
            <div className="card">
                <div className="card-head"><div className="text-h6">Политика отмен</div></div>
                <div className="p-5">
                    <p className="text-sm leading-relaxed">
                        Бесплатная отмена за{" "}
                        <span className="font-bold">
                            {data.cancelPolicy.freeHours} {formatHoursWord(data.cancelPolicy.freeHours)}
                        </span>{" "}
                        до занятия. При поздней отмене —{" "}
                        <span className="font-bold">
                            {lateActionLabel}
                        </span>
                        .
                    </p>
                </div>
            </div>

            {/* Reschedule Modal */}
            <Modal
                classWrap="max-w-[28rem]"
                title="Перенести занятие"
                visible={!!rescheduleId}
                onClose={() => {
                    setRescheduleId(null);
                    setRescheduleDate("");
                    setRescheduleTime("");
                }}
            >
                <div className="p-6 space-y-4">
                    <p className="text-sm text-n-3 dark:text-white/50">
                        Выберите желаемую дату и время. Репетитор получит
                        уведомление и подтвердит перенос.
                    </p>
                    <div>
                        <label className="mb-1.5 block text-xs font-bold text-n-3 dark:text-white/50">
                            Новая дата
                        </label>
                        <input
                            type="date"
                            className="w-full text-sm bg-transparent border border-n-1 rounded-sm px-3 py-2.5 outline-none dark:border-white dark:text-white"
                            value={rescheduleDate}
                            onChange={(e) => setRescheduleDate(e.target.value)}
                        />
                    </div>
                    <div>
                        <label className="mb-1.5 block text-xs font-bold text-n-3 dark:text-white/50">
                            Новое время
                        </label>
                        <input
                            type="time"
                            className="w-full text-sm bg-transparent border border-n-1 rounded-sm px-3 py-2.5 outline-none dark:border-white dark:text-white"
                            value={rescheduleTime}
                            onChange={(e) => setRescheduleTime(e.target.value)}
                        />
                    </div>
                    <div className="flex gap-3 pt-2">
                        <button
                            className="btn-purple btn-medium grow"
                            onClick={handleRescheduleSubmit}
                            disabled={rescheduleLoading || !rescheduleDate || !rescheduleTime}
                        >
                            {rescheduleLoading ? "Отправляем..." : "Отправить запрос"}
                        </button>
                        <button
                            className="btn-stroke btn-medium grow"
                            disabled={rescheduleLoading}
                            onClick={() => {
                                setRescheduleId(null);
                                setRescheduleDate("");
                                setRescheduleTime("");
                            }}
                        >
                            Отмена
                        </button>
                    </div>
                </div>
            </Modal>

            {/* Feedback Modal */}
            <Modal
                classWrap="max-w-[28rem]"
                title="Как прошло занятие?"
                visible={feedbackIdx !== null}
                onClose={() => {
                    setFeedbackIdx(null);
                    setFeedbackRating(0);
                    setFeedbackText("");
                }}
            >
                <div className="p-6 space-y-4">
                    {feedbackIdx !== null && (
                        <div className="text-sm text-n-3 dark:text-white/50">
                            {recentLessons[feedbackIdx]?.date} —{" "}
                            {recentLessons[feedbackIdx]?.subject}
                        </div>
                    )}
                    <div>
                        <label className="mb-2 block text-xs font-bold text-n-3 dark:text-white/50">
                            Оценка
                        </label>
                        <div className="flex gap-2">
                            {[1, 2, 3, 4, 5].map((star) => (
                                <button
                                    key={star}
                                    type="button"
                                    className={`w-10 h-10 rounded-full border-2 text-sm font-bold transition-colors ${
                                        star <= feedbackRating
                                            ? "bg-purple-1 border-purple-1 text-n-1"
                                            : "border-n-1 dark:border-white hover:border-purple-1"
                                    }`}
                                    onClick={() => setFeedbackRating(star)}
                                >
                                    {star}
                                </button>
                            ))}
                        </div>
                    </div>
                    <div>
                        <label className="mb-1.5 block text-xs font-bold text-n-3 dark:text-white/50">
                            Комментарий (необязательно)
                        </label>
                        <textarea
                            className="w-full h-20 text-sm bg-transparent border border-n-1 rounded-sm px-3 py-2.5 outline-none resize-none placeholder:text-n-3 dark:border-white dark:text-white dark:placeholder:text-white/50"
                            placeholder="Что понравилось, что можно улучшить..."
                            value={feedbackText}
                            onChange={(e) => setFeedbackText(e.target.value)}
                        />
                    </div>
                    <div className="flex gap-3 pt-2">
                        <button
                            className="btn-purple btn-medium grow"
                            onClick={handleFeedbackSubmit}
                            disabled={feedbackRating === 0 || feedbackSubmitting}
                        >
                            {feedbackSubmitting ? "Сохранение..." : "Отправить"}
                        </button>
                        <button
                            className="btn-stroke btn-medium grow"
                            onClick={() => {
                                setFeedbackIdx(null);
                                setFeedbackRating(0);
                                setFeedbackText("");
                            }}
                        >
                            Пропустить
                        </button>
                    </div>
                </div>
            </Modal>
        </>
    );
};

export default LessonsTab;
