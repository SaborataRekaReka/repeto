import { useCallback, useEffect, useRef, useState } from "react";
import {
    Alert,
    Card,
    Text,
    Button,
    Label,
    TextInput,
    Icon,
} from "@gravity-ui/uikit";
import {
    Calendar as CalendarIcon,
    ArrowsRotateRight,
    Xmark,
    TriangleExclamation,
} from "@gravity-ui/icons";
import type { IconData } from "@gravity-ui/uikit";
import AppDialog from "@/components/AppDialog";
import StyledDateInput from "@/components/StyledDateInput";
import StyledTimeInput from "@/components/StyledTimeInput";
import { studentApi } from "@/lib/studentAuth";
import type {
    StudentPortalData,
    RecentLesson,
    PendingBooking,
} from "@/types/student-portal";
import type { PortalLesson } from "@/types/student-portal";

type LessonsTabProps = {
    data: StudentPortalData;
    studentId: string;
};

type PendingBookingItem = PendingBooking & {
    rescheduleRequested?: boolean;
};

type PendingRescheduleResponse = {
    booking?: PendingBooking;
};

const LESSONS_BATCH_SIZE = 5;

const LessonsTab = ({ data, studentId }: LessonsTabProps) => {
    const [lessons, setLessons] = useState(data.upcomingLessons);
    const [recentLessons, setRecentLessons] = useState<RecentLesson[]>(
        data.recentLessons
    );
    const [pendingBookings, setPendingBookings] = useState<PendingBookingItem[]>(
        (data.pendingBookings || []).map((booking) => ({ ...booking }))
    );
    const [cancelConfirm, setCancelConfirm] = useState<string | null>(null);
    const [rescheduleId, setRescheduleId] = useState<string | null>(null);
    const [rescheduleDate, setRescheduleDate] = useState("");
    const [rescheduleTime, setRescheduleTime] = useState("");
    const [pendingCancelConfirm, setPendingCancelConfirm] = useState<string | null>(
        null
    );
    const [pendingRescheduleId, setPendingRescheduleId] = useState<string | null>(
        null
    );
    const [pendingRescheduleDate, setPendingRescheduleDate] = useState("");
    const [pendingRescheduleTime, setPendingRescheduleTime] = useState("");
    const [pendingRescheduleLoading, setPendingRescheduleLoading] = useState(false);
    const [pendingCancelLoadingId, setPendingCancelLoadingId] = useState<string | null>(
        null
    );
    const [pendingActionNotice, setPendingActionNotice] = useState<string | null>(
        null
    );
    const [feedbackIdx, setFeedbackIdx] = useState<number | null>(null);
    const [feedbackRating, setFeedbackRating] = useState(0);
    const [feedbackText, setFeedbackText] = useState("");
    const [feedbackSubmitting, setFeedbackSubmitting] = useState(false);
    const [upcomingShown, setUpcomingShown] = useState(LESSONS_BATCH_SIZE);
    const [recentShown, setRecentShown] = useState(LESSONS_BATCH_SIZE);
    const [loadingMoreUpcoming, setLoadingMoreUpcoming] = useState(false);
    const [loadingMoreRecent, setLoadingMoreRecent] = useState(false);
    const [cancelLoadingId, setCancelLoadingId] = useState<string | null>(null);
    const [rescheduleLoading, setRescheduleLoading] = useState(false);
    const [actionError, setActionError] = useState<string | null>(null);
    const encodedStudentId = encodeURIComponent(studentId);
    const loadMoreUpcomingRef = useRef<HTMLDivElement | null>(null);
    const loadMoreRecentRef = useRef<HTMLDivElement | null>(null);
    const loadMoreUpcomingTimerRef = useRef<number | null>(null);
    const loadMoreRecentTimerRef = useRef<number | null>(null);

    useEffect(() => {
        setLessons(data.upcomingLessons);
        setRecentLessons(data.recentLessons);
        setPendingBookings((data.pendingBookings || []).map((booking) => ({ ...booking })));
        setCancelConfirm(null);
        setRescheduleId(null);
        setRescheduleDate("");
        setRescheduleTime("");
        setPendingCancelConfirm(null);
        setPendingRescheduleId(null);
        setPendingRescheduleDate("");
        setPendingRescheduleTime("");
        setPendingActionNotice(null);
        setFeedbackIdx(null);
        setFeedbackRating(0);
        setFeedbackText("");
        setUpcomingShown(LESSONS_BATCH_SIZE);
        setRecentShown(LESSONS_BATCH_SIZE);
        setActionError(null);
    }, [data.pendingBookings, data.recentLessons, data.upcomingLessons, studentId]);

    const cancelPolicy = data.cancelPolicy || {
        freeHours: 24,
        lateCancelAction: "full",
        lateAction: "full",
        noShowAction: "full",
    };

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
        cancelPolicy.lateCancelAction || cancelPolicy.lateAction;
    const lateActionLabel = normalizePolicyAction(lateActionValue);
    const lateCancelWarning = cancelPolicy.lateCancelCost
        ? `Поздняя отмена! Будет списано ${cancelPolicy.lateCancelCost.toLocaleString("ru-RU")} ₽.`
        : lateActionLabel === "без списания"
          ? "Поздняя отмена! Штрафа не будет."
          : `Поздняя отмена! Будет списано ${lateActionLabel}.`;

    const openCancelDialog = (lessonId: string) => {
        setPendingCancelConfirm(null);
        setPendingRescheduleId(null);
        setCancelConfirm(lessonId);
    };

    const handleCancelConfirm = async () => {
        if (!cancelConfirm) return;

        const lesson = lessons.find((l) => l.id === cancelConfirm);
        if (!lesson) {
            setCancelConfirm(null);
            return;
        }

        setActionError(null);
        setCancelLoadingId(lesson.id);
        try {
            await studentApi(
                `/student-portal/students/${encodedStudentId}/lessons/${lesson.id}/cancel`,
                {
                    method: "POST",
                }
            );
            setLessons((prev) =>
                prev.map((l) =>
                    l.id === lesson.id
                        ? { ...l, status: "cancelled" as const }
                        : l
                )
            );
            setCancelConfirm(null);
        } catch {
            setActionError("Не удалось отменить занятие. Попробуйте снова.");
        } finally {
            setCancelLoadingId(null);
        }
    };

    const handleRescheduleSubmit = async () => {
        if (!rescheduleDate || !rescheduleTime || !rescheduleId) return;

        setActionError(null);
        setRescheduleLoading(true);
        try {
            await studentApi(
                `/student-portal/students/${encodedStudentId}/lessons/${rescheduleId}/reschedule`,
                {
                    method: "POST",
                    body: JSON.stringify({
                        newDate: rescheduleDate,
                        newTime: rescheduleTime,
                    }),
                }
            );
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
            setPendingActionNotice(
                "Запрос на перенос отправлен. До ответа репетитора отображается новое время."
            );
        } catch {
            setActionError("Не удалось отправить запрос на перенос. Попробуйте снова.");
        } finally {
            setRescheduleLoading(false);
        }
    };

    const handlePendingCancelConfirm = async () => {
        if (!pendingCancelConfirm) return;

        setActionError(null);
        setPendingActionNotice(null);
        setPendingCancelLoadingId(pendingCancelConfirm);

        try {
            await studentApi(
                `/student-portal/students/${encodedStudentId}/pending-bookings/${pendingCancelConfirm}/cancel`,
                { method: "POST" }
            );

            setPendingBookings((prev) =>
                prev.filter((booking) => booking.id !== pendingCancelConfirm)
            );
            setPendingCancelConfirm(null);
            setPendingActionNotice(
                "Неподтвержденное занятие отменено без дополнительного подтверждения преподавателя."
            );
        } catch {
            setActionError(
                "Не удалось отменить неподтвержденное занятие. Попробуйте снова."
            );
        } finally {
            setPendingCancelLoadingId(null);
        }
    };

    const handlePendingRescheduleSubmit = async () => {
        if (!pendingRescheduleId || !pendingRescheduleDate || !pendingRescheduleTime) {
            return;
        }

        setActionError(null);
        setPendingActionNotice(null);
        setPendingRescheduleLoading(true);

        try {
            const response = await studentApi<PendingRescheduleResponse>(
                `/student-portal/students/${encodedStudentId}/pending-bookings/${pendingRescheduleId}/reschedule`,
                {
                    method: "POST",
                    body: JSON.stringify({
                        newDate: pendingRescheduleDate,
                        newTime: pendingRescheduleTime,
                    }),
                }
            );

            setPendingBookings((prev) =>
                prev.map((booking) =>
                    booking.id === pendingRescheduleId
                        ? {
                              ...booking,
                              ...(response?.booking || {
                                  date: pendingRescheduleDate,
                                  startTime: pendingRescheduleTime,
                              }),
                              rescheduleRequested: true,
                          }
                        : booking
                )
            );

            setPendingRescheduleId(null);
            setPendingRescheduleDate("");
            setPendingRescheduleTime("");
            setPendingActionNotice(
                "Запрос на перенос отправлен. В карточке показано новое время до ответа преподавателя."
            );
        } catch {
            setActionError(
                "Не удалось отправить запрос на перенос неподтвержденного занятия. Попробуйте снова."
            );
        } finally {
            setPendingRescheduleLoading(false);
        }
    };

    const handleFeedbackSubmit = async () => {
        if (feedbackIdx === null || feedbackRating === 0) return;

        const lesson = recentLessons[feedbackIdx];
        if (!lesson?.id) {
            setActionError("Не удалось сохранить отзыв. Обновите страницу и попробуйте еще раз.");
            return;
        }

        setActionError(null);
        setFeedbackSubmitting(true);
        try {
            await studentApi(
                `/student-portal/students/${encodedStudentId}/lessons/${lesson.id}/feedback`,
                {
                    method: "POST",
                    body: JSON.stringify({
                        rating: feedbackRating,
                        feedback: feedbackText.trim() || undefined,
                    }),
                }
            );

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
            setActionError("Не удалось сохранить отзыв. Попробуйте снова.");
        } finally {
            setFeedbackSubmitting(false);
        }
    };

    const activeLessons = lessons.filter((l) => l.status !== "cancelled");
    const visibleUpcomingLessons = activeLessons.slice(0, upcomingShown);
    const visibleRecentLessons = recentLessons.slice(0, recentShown);
    const cancelLesson = cancelConfirm
        ? lessons.find((l) => l.id === cancelConfirm) || null
        : null;
    const rescheduleLesson = rescheduleId
        ? lessons.find((l) => l.id === rescheduleId) || null
        : null;
    const pendingCancelBooking = pendingCancelConfirm
        ? pendingBookings.find((booking) => booking.id === pendingCancelConfirm) || null
        : null;
    const pendingRescheduleBooking = pendingRescheduleId
        ? pendingBookings.find((booking) => booking.id === pendingRescheduleId) || null
        : null;

    const loadMoreUpcomingLessons = useCallback(() => {
        if (loadingMoreUpcoming || upcomingShown >= activeLessons.length) {
            return;
        }

        setLoadingMoreUpcoming(true);

        if (loadMoreUpcomingTimerRef.current) {
            window.clearTimeout(loadMoreUpcomingTimerRef.current);
        }

        loadMoreUpcomingTimerRef.current = window.setTimeout(() => {
            setUpcomingShown((prev) =>
                Math.min(prev + LESSONS_BATCH_SIZE, activeLessons.length)
            );
            setLoadingMoreUpcoming(false);
            loadMoreUpcomingTimerRef.current = null;
        }, 320);
    }, [activeLessons.length, loadingMoreUpcoming, upcomingShown]);

    const loadMoreRecentLessons = useCallback(() => {
        if (loadingMoreRecent || recentShown >= recentLessons.length) {
            return;
        }

        setLoadingMoreRecent(true);

        if (loadMoreRecentTimerRef.current) {
            window.clearTimeout(loadMoreRecentTimerRef.current);
        }

        loadMoreRecentTimerRef.current = window.setTimeout(() => {
            setRecentShown((prev) =>
                Math.min(prev + LESSONS_BATCH_SIZE, recentLessons.length)
            );
            setLoadingMoreRecent(false);
            loadMoreRecentTimerRef.current = null;
        }, 320);
    }, [loadingMoreRecent, recentLessons.length, recentShown]);

    useEffect(() => {
        if (upcomingShown >= activeLessons.length) {
            return;
        }

        const node = loadMoreUpcomingRef.current;
        if (!node || typeof IntersectionObserver === "undefined") {
            return;
        }

        const observer = new IntersectionObserver(
            (entries) => {
                if (entries.some((entry) => entry.isIntersecting)) {
                    loadMoreUpcomingLessons();
                }
            },
            { rootMargin: "160px 0px" }
        );

        observer.observe(node);

        return () => observer.disconnect();
    }, [activeLessons.length, loadMoreUpcomingLessons, upcomingShown]);

    useEffect(() => {
        if (recentShown >= recentLessons.length) {
            return;
        }

        const node = loadMoreRecentRef.current;
        if (!node || typeof IntersectionObserver === "undefined") {
            return;
        }

        const observer = new IntersectionObserver(
            (entries) => {
                if (entries.some((entry) => entry.isIntersecting)) {
                    loadMoreRecentLessons();
                }
            },
            { rootMargin: "160px 0px" }
        );

        observer.observe(node);

        return () => observer.disconnect();
    }, [loadMoreRecentLessons, recentLessons.length, recentShown]);

    useEffect(
        () => () => {
            if (loadMoreUpcomingTimerRef.current) {
                window.clearTimeout(loadMoreUpcomingTimerRef.current);
            }
            if (loadMoreRecentTimerRef.current) {
                window.clearTimeout(loadMoreRecentTimerRef.current);
            }
        },
        []
    );

    const statusBadge = (lesson: PortalLesson) => {
        switch (lesson.status) {
            case "reschedule_pending":
                return null;
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
            {actionError && (
                <Alert
                    theme="danger"
                    view="filled"
                    corners="rounded"
                    title="Не удалось выполнить действие"
                    message={actionError}
                    onClose={() => setActionError(null)}
                    style={{ marginBottom: 12 }}
                />
            )}

            {pendingActionNotice && (
                <Alert
                    theme="info"
                    view="filled"
                    corners="rounded"
                    title="Действие отправлено"
                    message={pendingActionNotice}
                    onClose={() => setPendingActionNotice(null)}
                    style={{ marginBottom: 12 }}
                />
            )}

            <div className="repeto-portal-section--spaced">
                <Text variant="subheader-2" className="repeto-portal-plain-section-title">
                    Ближайшие занятия
                </Text>
                <div className="repeto-portal-stack repeto-portal-stack--md">
                    {pendingBookings.map((booking) => {
                        const showPendingHoverActions =
                            pendingCancelConfirm !== booking.id &&
                            pendingRescheduleId !== booking.id;

                        return (
                            <Card
                                key={booking.id}
                                view="outlined"
                                className={`repeto-portal-item-card repeto-portal-item-card--upcoming${
                                    showPendingHoverActions
                                        ? " repeto-portal-item-card--with-actions"
                                        : ""
                                }`}
                            >
                                <div className="repeto-portal-item-row repeto-portal-item-row--upcoming">
                                    <div className="repeto-portal-item-main repeto-portal-item-main--centered">
                                        <div className="repeto-portal-item-mainline repeto-portal-item-mainline--centered">
                                            <Icon data={CalendarIcon as IconData} size={16} />
                                            <Text variant="body-2" style={{ fontWeight: 600 }}>
                                                {booking.date}
                                            </Text>
                                            <span className="repeto-portal-sep-dot" aria-hidden="true">
                                                •
                                            </span>
                                            <Text variant="body-2" style={{ fontWeight: 600 }}>
                                                {booking.startTime}
                                            </Text>
                                            <span
                                                className="repeto-portal-pending-indicator"
                                                aria-label="Ожидает подтверждения преподавателя"
                                                title="Ожидает подтверждения преподавателя"
                                            >
                                                <Icon
                                                    data={TriangleExclamation as IconData}
                                                    size={14}
                                                />
                                            </span>
                                        </div>
                                        <div className="repeto-portal-item-mainline repeto-portal-item-mainline--centered">
                                            <Text variant="body-1" color="secondary">
                                                {booking.subject}
                                            </Text>
                                        </div>
                                    </div>
                                    <div className="repeto-portal-item-side repeto-portal-item-side--upcoming">
                                        <div className="repeto-portal-upcoming-meta">
                                            <Text variant="caption-1" color="secondary">
                                                Неподтверждено
                                            </Text>
                                        </div>

                                        {showPendingHoverActions && (
                                            <div className="repeto-portal-upcoming-actions">
                                                <button
                                                    type="button"
                                                    className="repeto-portal-icon-action repeto-portal-icon-action--danger"
                                                    onClick={() => {
                                                        setPendingCancelConfirm(booking.id);
                                                        setCancelConfirm(null);
                                                    }}
                                                    disabled={pendingCancelLoadingId === booking.id}
                                                    aria-label="Отменить неподтвержденное занятие"
                                                >
                                                    <Icon data={Xmark as IconData} size={22} />
                                                </button>
                                                <button
                                                    type="button"
                                                    className="repeto-portal-icon-action"
                                                    onClick={() => {
                                                        setPendingRescheduleId(booking.id);
                                                        setPendingCancelConfirm(null);
                                                        setRescheduleId(null);
                                                    }}
                                                    disabled={pendingCancelLoadingId === booking.id}
                                                    aria-label="Попросить перенос неподтвержденного занятия"
                                                >
                                                    <Icon
                                                        data={ArrowsRotateRight as IconData}
                                                        size={22}
                                                    />
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {booking.rescheduleRequested && (
                                    <Card
                                        view="filled"
                                        className="repeto-portal-note repeto-portal-note--info"
                                        style={{ marginTop: 8 }}
                                    >
                                        <Text variant="caption-1" color="secondary">
                                            Запрос на перенос отправлен. Новое время: {booking.date}, {" "}
                                            {booking.startTime}. Ожидаем подтверждение от преподавателя.
                                        </Text>
                                    </Card>
                                )}
                            </Card>
                        );
                    })}

                    {activeLessons.length === 0 && (
                        <Text variant="body-1" color="secondary">
                            {pendingBookings.length > 0
                                ? "Пока нет подтвержденных занятий"
                                : "Нет запланированных занятий"}
                        </Text>
                    )}

                    {visibleUpcomingLessons.map((lesson) => {
                        const showHoverActions =
                            lesson.status === "upcoming" && cancelConfirm !== lesson.id;
                        const lessonBadge = statusBadge(lesson);
                        const hasLessonDetails =
                            lesson.status === "reschedule_pending" ||
                            lesson.status === "rescheduled";

                        return (
                            <Card
                                key={lesson.id}
                                view="outlined"
                                className={`repeto-portal-item-card repeto-portal-item-card--upcoming${
                                    showHoverActions ? " repeto-portal-item-card--with-actions" : ""
                                }`}
                            >
                                <div
                                    className="repeto-portal-item-row repeto-portal-item-row--upcoming"
                                    style={{ marginBottom: hasLessonDetails ? 8 : 0 }}
                                >
                                    <div className="repeto-portal-item-main repeto-portal-item-main--centered">
                                        <div className="repeto-portal-item-mainline repeto-portal-item-mainline--centered">
                                            <Icon data={CalendarIcon as IconData} size={16} />
                                            <Text variant="body-2" style={{ fontWeight: 600 }}>
                                                {lesson.date}
                                            </Text>
                                            <span className="repeto-portal-sep-dot" aria-hidden="true">
                                                •
                                            </span>
                                            <Text variant="body-2" style={{ fontWeight: 600 }}>
                                                {lesson.time}
                                            </Text>
                                            {lesson.status === "reschedule_pending" && (
                                                <span
                                                    className="repeto-portal-pending-indicator"
                                                    aria-label="Ожидает подтверждения преподавателя"
                                                    title="Ожидает подтверждения преподавателя"
                                                >
                                                    <Icon
                                                        data={TriangleExclamation as IconData}
                                                        size={14}
                                                    />
                                                </span>
                                            )}
                                        </div>
                                        <div className="repeto-portal-item-mainline repeto-portal-item-mainline--centered">
                                            <Text variant="body-1" color="secondary">
                                                {lesson.subject}
                                            </Text>
                                            <span className="repeto-portal-sep-dot" aria-hidden="true">
                                                •
                                            </span>
                                            <Text variant="body-1" color="secondary">
                                                {lesson.modality === "online" ? "Онлайн" : "Офлайн"}
                                            </Text>
                                        </div>
                                    </div>
                                    <div className="repeto-portal-item-side repeto-portal-item-side--upcoming">
                                        <div className="repeto-portal-upcoming-meta">{lessonBadge}</div>

                                        {showHoverActions && (
                                            <div className="repeto-portal-upcoming-actions">
                                                <button
                                                    type="button"
                                                    className="repeto-portal-icon-action repeto-portal-icon-action--danger"
                                                    onClick={() => openCancelDialog(lesson.id)}
                                                    aria-label="Отменить занятие"
                                                >
                                                    <Icon data={Xmark as IconData} size={22} />
                                                </button>
                                                <button
                                                    type="button"
                                                    className="repeto-portal-icon-action"
                                                    onClick={() => {
                                                        setRescheduleId(lesson.id);
                                                        setCancelConfirm(null);
                                                        setPendingCancelConfirm(null);
                                                        setPendingRescheduleId(null);
                                                    }}
                                                    aria-label="Перенести занятие"
                                                >
                                                    <Icon
                                                        data={ArrowsRotateRight as IconData}
                                                        size={22}
                                                    />
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {lesson.status === "reschedule_pending" && lesson.rescheduleTo && (
                                    <Card
                                        view="filled"
                                        className="repeto-portal-note repeto-portal-note--info"
                                        style={{ marginBottom: 12 }}
                                    >
                                        <Text
                                            variant="caption-1"
                                            style={{
                                                fontWeight: 600,
                                                marginBottom: 2,
                                                display: "block",
                                            }}
                                        >
                                            Запрос на перенос
                                        </Text>
                                        <Text variant="caption-1" color="secondary">
                                            Новое время: {lesson.rescheduleTo}. Ожидаем подтверждение от
                                            репетитора.
                                        </Text>
                                    </Card>
                                )}

                                {lesson.status === "rescheduled" &&
                                    lesson.rescheduleFrom &&
                                    lesson.rescheduleTo && (
                                        <Card
                                            view="filled"
                                            className="repeto-portal-note repeto-portal-note--info"
                                            style={{ marginBottom: 12 }}
                                        >
                                            <Text variant="caption-1" style={{ fontWeight: 600 }}>
                                                Перенесено с {lesson.rescheduleFrom} на {lesson.rescheduleTo}
                                            </Text>
                                        </Card>
                                    )}

                                {lesson.status === "reschedule_pending" && (
                                    <Text variant="caption-1" color="secondary">
                                        Дождитесь ответа репетитора
                                    </Text>
                                )}
                            </Card>
                        );
                    })}
                </div>

                {upcomingShown < activeLessons.length && (
                    <div
                        ref={loadMoreUpcomingRef}
                        className="repeto-portal-infinite-loader"
                        aria-live="polite"
                        aria-label="Загружаем занятия"
                    >
                        <span className="repeto-portal-infinite-loader__spinner" aria-hidden="true" />
                    </div>
                )}
            </div>

            <div className="repeto-portal-section--spaced">
                <Text variant="subheader-2" className="repeto-portal-plain-section-title">
                    Прошедшие занятия
                </Text>

                {recentLessons.length === 0 && (
                    <Text variant="body-1" color="secondary">
                        Пока занятий не было
                    </Text>
                )}

                <div className="repeto-portal-stack">
                    {visibleRecentLessons.map((l, i) => {
                        const statusLabel = getRecentStatusLabel(l.status);
                        const modalityLabel = l.modality === "offline" ? "Офлайн" : "Онлайн";
                        const lessonTime = l.time && l.time.trim() ? l.time : "—";

                        return (
                            <Card
                                key={l.id || i}
                                view="outlined"
                                className="repeto-portal-item-card repeto-portal-item-card--tight repeto-portal-item-card--recent"
                            >
                                <div className="repeto-portal-item-row repeto-portal-item-row--recent">
                                    <div className="repeto-portal-item-main repeto-portal-item-main--centered">
                                        <div
                                            className="repeto-portal-item-mainline repeto-portal-item-mainline--centered"
                                            style={{ gap: 8 }}
                                        >
                                            <Icon data={CalendarIcon as IconData} size={16} />
                                            <Text
                                                variant="body-1"
                                                style={{ whiteSpace: "nowrap", flexShrink: 0 }}
                                            >
                                                {l.date}
                                            </Text>
                                            <span className="repeto-portal-sep-dot" aria-hidden="true">
                                                •
                                            </span>
                                            <Text variant="body-2" style={{ fontWeight: 600 }}>
                                                {lessonTime}
                                            </Text>
                                        </div>
                                        <div
                                            className="repeto-portal-item-mainline repeto-portal-item-mainline--centered"
                                            style={{ gap: 8 }}
                                        >
                                            <Text variant="body-1" color="secondary" ellipsis>
                                                {l.subject}
                                            </Text>
                                            <span className="repeto-portal-sep-dot" aria-hidden="true">
                                                •
                                            </span>
                                            <Text variant="body-1" color="secondary">
                                                {modalityLabel}
                                            </Text>
                                        </div>
                                    </div>
                                    <div
                                        className="repeto-portal-item-mainline repeto-portal-item-mainline--recent-side"
                                        style={{ flexShrink: 0 }}
                                    >
                                        <Label
                                            theme={isRecentCompleted(l.status) ? "success" : "danger"}
                                            size="xs"
                                        >
                                            {statusLabel}
                                        </Label>
                                        {l.price > 0 && (
                                            <Text
                                                variant="body-2"
                                                style={{
                                                    fontWeight: 600,
                                                    width: 64,
                                                    textAlign: "right",
                                                }}
                                            >
                                                {l.price.toLocaleString("ru-RU")} ₽
                                            </Text>
                                        )}
                                    </div>
                                </div>

                                {isRecentCompleted(l.status) && (
                                    <div
                                        className="repeto-portal-divider-top"
                                        style={{
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "space-between",
                                            gap: 12,
                                        }}
                                    >
                                        <div className="repeto-portal-item-mainline" style={{ gap: 12, minWidth: 0 }}>
                                            <Text variant="caption-1" color="secondary">
                                                Оценка
                                            </Text>
                                            <div className="repeto-portal-rating-dots">
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
                                                        className={`repeto-portal-rating-dot ${
                                                            star <= (l.rating || 0)
                                                                ? "repeto-portal-rating-dot--active"
                                                                : "repeto-portal-rating-dot--inactive"
                                                        }`}
                                                        style={{ cursor: l.rating ? "default" : "pointer" }}
                                                    />
                                                ))}
                                            </div>
                                        </div>
                                        <div className="repeto-portal-item-mainline" style={{ flexShrink: 0 }}>
                                            <Button
                                                view="flat"
                                                size="xs"
                                                onClick={() => {
                                                    setFeedbackIdx(i);
                                                    setFeedbackRating(l.rating || 0);
                                                    setFeedbackText(l.feedback || "");
                                                }}
                                            >
                                                {l.rating || l.feedback ? "Открыть отзыв" : "Оставить отзыв"}
                                            </Button>
                                        </div>
                                    </div>
                                )}
                            </Card>
                        );
                    })}
                </div>

                {recentShown < recentLessons.length && (
                    <div
                        ref={loadMoreRecentRef}
                        className="repeto-portal-infinite-loader"
                        aria-live="polite"
                        aria-label="Загружаем историю занятий"
                    >
                        <span className="repeto-portal-infinite-loader__spinner" aria-hidden="true" />
                    </div>
                )}
            </div>

            <AppDialog
                open={!!cancelLesson}
                onClose={() => setCancelConfirm(null)}
                size="s"
                caption="Подтвердите отмену"
                footer={{
                    onClickButtonApply: handleCancelConfirm,
                    onClickButtonCancel: () => setCancelConfirm(null),
                    textButtonApply:
                        cancelLoadingId === cancelLesson?.id ? "Отменяем..." : "Да, отменить",
                    textButtonCancel: "Нет",
                    propsButtonApply: {
                        view: "outlined-danger",
                        disabled: !cancelLesson || cancelLoadingId === cancelLesson?.id,
                    },
                    propsButtonCancel: {
                        disabled: cancelLoadingId === cancelLesson?.id,
                    },
                }}
            >
                <div className="repeto-portal-stack">
                    {cancelLesson && (
                        <>
                            <Text variant="body-1" style={{ fontWeight: 600 }}>
                                {cancelLesson.date}
                                <span
                                    className="repeto-portal-sep-dot"
                                    aria-hidden="true"
                                    style={{ margin: "0 8px" }}
                                >
                                    •
                                </span>
                                {cancelLesson.time}
                            </Text>
                            <Text variant="body-2" color="secondary">
                                {cancelLesson.subject}
                            </Text>
                            <Text variant="body-2" color="secondary">
                                {cancelLesson.canCancelFree
                                    ? `Отмена бесплатная (до занятия > ${cancelPolicy.freeHours} ${formatHoursWord(cancelPolicy.freeHours)}).`
                                    : lateCancelWarning}
                            </Text>
                        </>
                    )}
                </div>
            </AppDialog>

            <AppDialog
                open={!!pendingCancelBooking}
                onClose={() => setPendingCancelConfirm(null)}
                size="s"
                caption="Отменить неподтвержденное занятие"
                footer={{
                    onClickButtonApply: handlePendingCancelConfirm,
                    onClickButtonCancel: () => setPendingCancelConfirm(null),
                    textButtonApply:
                        pendingCancelLoadingId === pendingCancelBooking?.id
                            ? "Отменяем..."
                            : "Да, отменить",
                    textButtonCancel: "Нет",
                    propsButtonApply: {
                        view: "outlined-danger",
                        disabled:
                            !pendingCancelBooking ||
                            pendingCancelLoadingId === pendingCancelBooking?.id,
                    },
                    propsButtonCancel: {
                        disabled: pendingCancelLoadingId === pendingCancelBooking?.id,
                    },
                }}
            >
                <div className="repeto-portal-stack">
                    {pendingCancelBooking && (
                        <>
                            <Text variant="body-1" style={{ fontWeight: 600 }}>
                                {pendingCancelBooking.date}
                                <span
                                    className="repeto-portal-sep-dot"
                                    aria-hidden="true"
                                    style={{ margin: "0 8px" }}
                                >
                                    •
                                </span>
                                {pendingCancelBooking.startTime}
                            </Text>
                            <Text variant="body-2" color="secondary">
                                {pendingCancelBooking.subject}
                            </Text>
                            <Text variant="body-2" color="secondary">
                                Отмена будет применена сразу, без дополнительного подтверждения
                                преподавателя.
                            </Text>
                        </>
                    )}
                </div>
            </AppDialog>

            <AppDialog
                open={!!pendingRescheduleId}
                onClose={() => {
                    setPendingRescheduleId(null);
                    setPendingRescheduleDate("");
                    setPendingRescheduleTime("");
                }}
                size="s"
                caption="Попросить о переносе"
                footer={{
                    onClickButtonApply: handlePendingRescheduleSubmit,
                    onClickButtonCancel: () => {
                        setPendingRescheduleId(null);
                        setPendingRescheduleDate("");
                        setPendingRescheduleTime("");
                    },
                    textButtonApply: pendingRescheduleLoading
                        ? "Отправляем..."
                        : "Отправить запрос",
                    textButtonCancel: "Отмена",
                    propsButtonApply: {
                        disabled:
                            pendingRescheduleLoading ||
                            !pendingRescheduleDate ||
                            !pendingRescheduleTime,
                    },
                    propsButtonCancel: {
                        disabled: pendingRescheduleLoading,
                    },
                }}
            >
                <div className="repeto-portal-stack">
                    <Text variant="body-1" color="secondary">
                        Выберите новую дату и время. До решения преподавателя в карточке
                        будет показано время переноса.
                    </Text>
                    {pendingRescheduleBooking && (
                        <Text variant="body-2" color="secondary">
                            Текущий слот: {pendingRescheduleBooking.date} • {" "}
                            {pendingRescheduleBooking.startTime}
                        </Text>
                    )}
                    <div>
                        <Text
                            variant="caption-1"
                            color="secondary"
                            as="label"
                            style={{ display: "block", marginBottom: 6, fontWeight: 600 }}
                        >
                            Новая дата
                        </Text>
                        <StyledDateInput
                            value={pendingRescheduleDate}
                            onUpdate={setPendingRescheduleDate}
                        />
                    </div>
                    <div>
                        <Text
                            variant="caption-1"
                            color="secondary"
                            as="label"
                            style={{ display: "block", marginBottom: 6, fontWeight: 600 }}
                        >
                            Новое время
                        </Text>
                        <StyledTimeInput
                            value={pendingRescheduleTime}
                            onUpdate={setPendingRescheduleTime}
                            showClockIcon={false}
                        />
                    </div>
                </div>
            </AppDialog>

            <AppDialog
                open={!!rescheduleId}
                onClose={() => {
                    setRescheduleId(null);
                    setRescheduleDate("");
                    setRescheduleTime("");
                }}
                size="s"
                caption="Перенести занятие"
                footer={{
                    onClickButtonApply: handleRescheduleSubmit,
                    onClickButtonCancel: () => {
                        setRescheduleId(null);
                        setRescheduleDate("");
                        setRescheduleTime("");
                    },
                    textButtonApply: rescheduleLoading ? "Отправляем..." : "Отправить запрос",
                    textButtonCancel: "Отмена",
                    propsButtonApply: {
                        disabled: rescheduleLoading || !rescheduleDate || !rescheduleTime,
                    },
                    propsButtonCancel: { disabled: rescheduleLoading },
                }}
            >
                <div className="repeto-portal-stack">
                    <Text variant="body-1" color="secondary">
                        Выберите желаемую дату и время. Репетитор получит уведомление и
                        подтвердит перенос.
                    </Text>
                    {rescheduleLesson && !rescheduleLesson.canCancelFree && (
                        <Alert
                            theme="warning"
                            message={`Поздний перенос! До занятия менее ${cancelPolicy.freeHours} ${formatHoursWord(cancelPolicy.freeHours)}. Может быть применено списание: ${lateActionLabel}.`}
                        />
                    )}
                    <div>
                        <Text
                            variant="caption-1"
                            color="secondary"
                            as="label"
                            style={{ display: "block", marginBottom: 6, fontWeight: 600 }}
                        >
                            Новая дата
                        </Text>
                        <StyledDateInput value={rescheduleDate} onUpdate={setRescheduleDate} />
                    </div>
                    <div>
                        <Text
                            variant="caption-1"
                            color="secondary"
                            as="label"
                            style={{ display: "block", marginBottom: 6, fontWeight: 600 }}
                        >
                            Новое время
                        </Text>
                        <StyledTimeInput
                            value={rescheduleTime}
                            onUpdate={setRescheduleTime}
                            showClockIcon={false}
                        />
                    </div>
                </div>
            </AppDialog>

            <AppDialog
                open={feedbackIdx !== null}
                onClose={() => {
                    setFeedbackIdx(null);
                    setFeedbackRating(0);
                    setFeedbackText("");
                }}
                size="s"
                caption="Как прошло занятие?"
                footer={{
                    onClickButtonApply: handleFeedbackSubmit,
                    onClickButtonCancel: () => {
                        setFeedbackIdx(null);
                        setFeedbackRating(0);
                        setFeedbackText("");
                    },
                    textButtonApply: feedbackSubmitting ? "Сохранение..." : "Отправить",
                    textButtonCancel: "Пропустить",
                    propsButtonApply: {
                        disabled: feedbackRating === 0 || feedbackSubmitting,
                    },
                }}
            >
                <div className="repeto-portal-stack">
                    {feedbackIdx !== null && (
                        <Text variant="body-1" color="secondary">
                            {recentLessons[feedbackIdx]?.date} - {recentLessons[feedbackIdx]?.subject}
                        </Text>
                    )}
                    <div>
                        <Text
                            variant="caption-1"
                            color="secondary"
                            as="label"
                            style={{ display: "block", marginBottom: 8, fontWeight: 600 }}
                        >
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
                                        border: `2px solid ${
                                            star <= feedbackRating
                                                ? "var(--g-color-base-brand)"
                                                : "var(--g-color-line-generic)"
                                        }`,
                                        background:
                                            star <= feedbackRating
                                                ? "var(--g-color-base-brand)"
                                                : "transparent",
                                        color:
                                            star <= feedbackRating
                                                ? "var(--g-color-text-brand-contrast)"
                                                : "var(--g-color-text-primary)",
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
                        <Text
                            variant="caption-1"
                            color="secondary"
                            as="label"
                            style={{ display: "block", marginBottom: 6, fontWeight: 600 }}
                        >
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
            </AppDialog>
        </>
    );
};

export default LessonsTab;
