import { useState, useEffect, useMemo, useCallback } from "react";
import { useRouter } from "next/router";
import GravityLayout from "@/components/GravityLayout";
import { Text, Button, Icon, Select } from "@gravity-ui/uikit";
import PillTabs, { type PillTabOption } from "@/components/PillTabs";
import AppIcon from "@/components/Icon";
import {
    ArrowChevronLeft,
    ArrowChevronRight,
} from "@gravity-ui/icons";
import type { IconData } from "@gravity-ui/uikit";
import LessonPanelV2 from "@/components/LessonPanelV2";
import Month from "./Month";
import Week from "./Week";
import Day from "./Day";
import ListView from "./List";
import AvailabilityEditor from "./AvailabilityEditor";
import { useLessons, deleteLesson } from "@/hooks/useLessons";
import { useSettings, syncYandexCalendar, syncGoogleCalendar } from "@/hooks/useSettings";
import { toLocalDateKey } from "@/lib/dates";
import { codedErrorMessage } from "@/lib/errorCodes";
import type { Lesson } from "@/types/schedule";

type CalendarViewType = "month" | "week" | "day";
type DisplayMode = "calendar" | "list";
type LessonStatusFilter = Lesson["status"];

const MONTH_NAMES = [
    "Январь", "Февраль", "Март", "Апрель", "Май", "Июнь",
    "Июль", "Август", "Сентябрь", "Октябрь", "Ноябрь", "Декабрь",
];
const MONTH_NAMES_SHORT = [
    "янв", "фев", "мар", "апр", "май", "июн",
    "июл", "авг", "сен", "окт", "ноя", "дек",
];
const MONTH_NAMES_GEN = [
    "января", "февраля", "марта", "апреля", "мая", "июня",
    "июля", "августа", "сентября", "октября", "ноября", "декабря",
];

const CALENDAR_VIEW_OPTIONS: { value: CalendarViewType; label: string }[] = [
    { value: "month", label: "Месяц" },
    { value: "week", label: "Неделя" },
    { value: "day", label: "День" },
];

const DISPLAY_MODE_OPTIONS: PillTabOption<DisplayMode>[] = [
    {
        value: "calendar",
        label: "Календарь",
        icon: <AppIcon name="calendar" fill="currentColor" />,
    },
    {
        value: "list",
        label: "Список",
        icon: <AppIcon name="table" fill="currentColor" />,
    },
];

const LESSON_STATUS_OPTIONS: { value: LessonStatusFilter; content: string }[] = [
    { value: "planned", content: "Запланированные" },
    { value: "completed", content: "Проведённые" },
    { value: "cancelled_student", content: "Отменённые учеником" },
    { value: "cancelled_tutor", content: "Отменённые мной" },
    { value: "no_show", content: "Неявки" },
    { value: "reschedule_pending", content: "Переносы" },
];

const ALL_STATUS_VALUES = LESSON_STATUS_OPTIONS.map((option) => option.value);

const LESSON_STATUS_BADGE_LABELS: Record<LessonStatusFilter, string> = {
    planned: "Запланировано",
    completed: "Проведено",
    cancelled_student: "Отменено учеником",
    cancelled_tutor: "Отменено мной",
    no_show: "Неявка",
    reschedule_pending: "Перенос",
};

function fromIsoDate(iso: string): Date {
    const [year, month, day] = iso.split("-").map(Number);
    return new Date(year, (month || 1) - 1, day || 1);
}

const CalendarPage = () => {
    const router = useRouter();
    const [displayMode, setDisplayMode] = useState<DisplayMode>("calendar");
    const [calendarView, setCalendarView] = useState<CalendarViewType>("week");
    const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null);
    const [createModal, setCreateModal] = useState(false);
    const [createSlot, setCreateSlot] = useState<{ date: string; time: string } | null>(null);
    const [editLesson, setEditLesson] = useState<Lesson | null>(null);
    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectedStatuses, setSelectedStatuses] = useState<LessonStatusFilter[]>(ALL_STATUS_VALUES);
    const [isExporting, setIsExporting] = useState(false);
    const [exportStatus, setExportStatus] = useState<{ type: "ok" | "error"; text: string } | null>(null);
    const [optimisticRemovedLessonIds, setOptimisticRemovedLessonIds] = useState<string[]>([]);

    const { data: settings, loading: settingsLoading } = useSettings();
    const hasYandexCalendar = !!settings?.hasYandexCalendar;
    const hasGoogleCalendar = !!settings?.hasGoogleCalendar;

    const handleEdit = useCallback((lesson: Lesson) => {
        setCreateSlot(null);
        setEditLesson(lesson);
        setCreateModal(true);
    }, []);

    const handleCreateFromSlot = useCallback((slot: { date: string; time: string }) => {
        setEditLesson(null);
        setCreateSlot(slot);
        setCreateModal(true);
    }, []);

    const handleQuickExport = useCallback(async () => {
        if (isExporting || settingsLoading) return;

        if (!hasYandexCalendar && !hasGoogleCalendar) {
            await router.push("/settings?tab=integrations");
            return;
        }

        setIsExporting(true);
        setExportStatus(null);

        const success: string[] = [];
        const errors: string[] = [];

        if (hasYandexCalendar) {
            try {
                const result = await syncYandexCalendar();
                const countErrors = result?.errors || 0;
                success.push(
                    countErrors > 0
                        ? `Яндекс: ${result.synced}, ошибок ${countErrors}`
                        : `Яндекс: ${result.synced}`
                );
            } catch (error: any) {
                errors.push(`Яндекс: ${codedErrorMessage("SCHED-YDEX-EXP", error)}`);
            }
        }

        if (hasGoogleCalendar) {
            try {
                const result = await syncGoogleCalendar();
                const countErrors = result?.errors || 0;
                success.push(
                    countErrors > 0
                        ? `Google: ${result.synced}, ошибок ${countErrors}`
                        : `Google: ${result.synced}`
                );
            } catch (error: any) {
                errors.push(`Google: ${codedErrorMessage("SCHED-GCAL-EXP", error)}`);
            }
        }

        if (errors.length === 0) {
            setExportStatus({
                type: "ok",
                text: `Экспорт завершен. ${success.join(" · ")}`,
            });
        } else if (success.length === 0) {
            setExportStatus({
                type: "error",
                text: errors.join(" · "),
            });
        } else {
            setExportStatus({
                type: "error",
                text: `Экспорт частично завершен. ${success.join(" · ")}. ${errors.join(" · ")}`,
            });
        }

        setIsExporting(false);
    }, [
        hasGoogleCalendar,
        hasYandexCalendar,
        isExporting,
        router,
        settingsLoading,
    ]);

    useEffect(() => {
        if (router.query.create === "1") {
            setEditLesson(null);
            setCreateSlot(null);
            setCreateModal(true);
            router.replace("/schedule", undefined, { shallow: true });
        }
    }, [router, router.query.create]);

    useEffect(() => {
        const viewParam = router.query.view;
        const raw = Array.isArray(viewParam) ? viewParam[0] : viewParam;
        if (raw === "list") {
            setDisplayMode("list");
            setCurrentDate(new Date());
            return;
        }
        if (raw === "kanban") {
            setDisplayMode("list");
            setCurrentDate(new Date());
            return;
        }
        if (raw === "day" || raw === "week" || raw === "month") {
            setDisplayMode("calendar");
            setCalendarView(raw);
            setCurrentDate(new Date());
        }
    }, [router.query.view]);

    useEffect(() => {
        const quickActionParam = router.query.quickAction;
        const raw = Array.isArray(quickActionParam) ? quickActionParam[0] : quickActionParam;
        if (raw !== "export" || settingsLoading) return;

        const nextQuery = { ...router.query };
        delete nextQuery.quickAction;
        void router.replace({ pathname: "/schedule", query: nextQuery }, undefined, { shallow: true });
        void handleQuickExport();
    }, [handleQuickExport, router, router.query, settingsLoading]);

    const dateRange = useMemo(() => {
        const d = currentDate;
        if (displayMode === "calendar" && calendarView === "month") {
            const from = new Date(d.getFullYear(), d.getMonth() - 1, 20);
            const to = new Date(d.getFullYear(), d.getMonth() + 1, 10);
            return { from: toLocalDateKey(from), to: toLocalDateKey(to) };
        }
        if (displayMode === "calendar" && calendarView === "day") {
            return { from: toLocalDateKey(d), to: toLocalDateKey(d) };
        }
        if (
            displayMode === "list"
            || (displayMode === "calendar" && calendarView === "week")
        ) {
            const start = new Date(d);
            const dow = start.getDay();
            start.setDate(start.getDate() - (dow === 0 ? 6 : dow - 1));
            const end = new Date(start);
            end.setDate(end.getDate() + 6);
            return { from: toLocalDateKey(start), to: toLocalDateKey(end) };
        }
        return { from: toLocalDateKey(d), to: toLocalDateKey(d) };
    }, [calendarView, currentDate, displayMode]);

    const { data: lessons = [], refetch: refetchLessons } = useLessons(dateRange);

    const handleDelete = useCallback(async (lessonId: string) => {
        setOptimisticRemovedLessonIds((prev) => (
            prev.includes(lessonId) ? prev : [...prev, lessonId]
        ));

        try {
            await deleteLesson(lessonId);
            await refetchLessons();
        } catch (error: any) {
            setOptimisticRemovedLessonIds((prev) => prev.filter((id) => id !== lessonId));
            setExportStatus({
                type: "error",
                text: codedErrorMessage("LESSON-DELETE", error),
            });
        }
    }, [refetchLessons]);

    useEffect(() => {
        if (optimisticRemovedLessonIds.length === 0) return;

        const existingIds = new Set(lessons.map((lesson) => lesson.id));
        setOptimisticRemovedLessonIds((prev) => prev.filter((id) => existingIds.has(id)));
    }, [lessons, optimisticRemovedLessonIds.length]);

    const visibleLessons = useMemo(() => {
        if (selectedStatuses.length === 0) return [];
        const selected = new Set<LessonStatusFilter>(selectedStatuses);
        return lessons.filter(
            (lesson) => selected.has(lesson.status) && !optimisticRemovedLessonIds.includes(lesson.id)
        );
    }, [lessons, selectedStatuses, optimisticRemovedLessonIds]);

    const navigate = useCallback((direction: -1 | 1) => {
        setCurrentDate((prev) => {
            const d = new Date(prev);
            if (displayMode === "calendar" && calendarView === "month") {
                d.setMonth(d.getMonth() + direction);
            } else if (displayMode === "calendar" && calendarView === "day") {
                d.setDate(d.getDate() + direction);
            } else {
                d.setDate(d.getDate() + direction * 7);
            }
            return d;
        });
    }, [calendarView, displayMode]);

    const handleOpenDayFromMonth = useCallback((isoDate: string) => {
        setDisplayMode("calendar");
        setCalendarView("day");
        setCurrentDate(fromIsoDate(isoDate));
    }, []);

    const handleOpenMonthView = useCallback(() => {
        setDisplayMode("calendar");
        setCalendarView("month");
    }, []);

    const handleGoToday = useCallback(() => {
        setCurrentDate(new Date());
    }, []);

    const formatDateLabel = () => {
        if (displayMode === "calendar" && calendarView === "month") {
            return `${MONTH_NAMES[currentDate.getMonth()]} ${currentDate.getFullYear()}`;
        }
        if (displayMode === "calendar" && calendarView === "week") {
            const weekStart = new Date(currentDate);
            const dow = weekStart.getDay();
            const diff = dow === 0 ? -6 : 1 - dow;
            weekStart.setDate(weekStart.getDate() + diff);
            const weekEnd = new Date(weekStart);
            weekEnd.setDate(weekEnd.getDate() + 6);
            const startDay = weekStart.getDate();
            const endDay = weekEnd.getDate();
            const startMonth = MONTH_NAMES_SHORT[weekStart.getMonth()];
            const endMonth = MONTH_NAMES_SHORT[weekEnd.getMonth()];
            if (weekStart.getMonth() === weekEnd.getMonth()) {
                return `${startDay} – ${endDay} ${endMonth} ${weekEnd.getFullYear()}`;
            }
            return `${startDay} ${startMonth} – ${endDay} ${endMonth} ${weekEnd.getFullYear()}`;
        }
        if (displayMode === "list") {
            const weekStart = new Date(currentDate);
            const dow = weekStart.getDay();
            const diff = dow === 0 ? -6 : 1 - dow;
            weekStart.setDate(weekStart.getDate() + diff);
            const weekEnd = new Date(weekStart);
            weekEnd.setDate(weekEnd.getDate() + 6);
            const startDay = weekStart.getDate();
            const endDay = weekEnd.getDate();
            const startMonth = MONTH_NAMES_SHORT[weekStart.getMonth()];
            const endMonth = MONTH_NAMES_SHORT[weekEnd.getMonth()];
            if (weekStart.getMonth() === weekEnd.getMonth()) {
                return `${startDay} – ${endDay} ${endMonth} ${weekEnd.getFullYear()}`;
            }
            return `${startDay} ${startMonth} – ${endDay} ${endMonth} ${weekEnd.getFullYear()}`;
        }
        return `${currentDate.getDate()} ${MONTH_NAMES_GEN[currentDate.getMonth()]} ${currentDate.getFullYear()}`;
    };

    return (
        <GravityLayout title="Расписание">
            <div className="repeto-schedule-page">
                <AvailabilityEditor />

                {/* ── Toolbar ── */}
                <div className="repeto-schedule-toolbar">
                    <div className="repeto-schedule-toolbar__display">
                        <PillTabs
                            value={displayMode}
                            onChange={(mode) => setDisplayMode(mode as DisplayMode)}
                            options={DISPLAY_MODE_OPTIONS}
                            size="s"
                            ariaLabel="Режим представления"
                        />
                    </div>

                    {/* Lessons visibility filter */}
                    <div className="repeto-schedule-toolbar__filter">
                        <Select
                            className="repeto-schedule-filter-select"
                            popupClassName="repeto-schedule-filter-popup"
                            size="m"
                            width="max"
                            multiple
                            hasClear
                            hasCounter={selectedStatuses.length > 0}
                            placeholder="Статусы занятий"
                            options={LESSON_STATUS_OPTIONS}
                            value={selectedStatuses}
                            onUpdate={(values) => {
                                setSelectedStatuses(values as LessonStatusFilter[]);
                            }}
                        />
                    </div>

                    {/* Period navigation */}
                    <div className="repeto-schedule-toolbar__period">
                        <div className="repeto-schedule-toolbar__nav">
                            <Button
                                view="flat"
                                size="m"
                                onClick={() => navigate(-1)}
                            >
                                <Icon data={ArrowChevronLeft as IconData} size={16} />
                            </Button>
                            <Button
                                view="flat"
                                size="m"
                                onClick={() => navigate(1)}
                            >
                                <Icon data={ArrowChevronRight as IconData} size={16} />
                            </Button>
                        </div>

                        <Button
                            view="flat"
                            size="m"
                            className="repeto-schedule-toolbar__today-btn"
                            onClick={handleGoToday}
                        >
                            Сегодня
                        </Button>

                        <button
                            type="button"
                            className="repeto-schedule-toolbar__date-btn"
                            onClick={handleOpenMonthView}
                        >
                            <Text variant="body-2" className="repeto-schedule-toolbar__date">
                                {formatDateLabel()}
                            </Text>
                        </button>
                    </div>

                    {/* Spacer */}
                    <div className="repeto-schedule-toolbar__spacer" />

                    {/* View toggle */}
                    <div className="repeto-schedule-toolbar__view">
                        {displayMode === "calendar" && (
                            <PillTabs
                                value={calendarView}
                                onChange={(v) => setCalendarView(v as CalendarViewType)}
                                options={CALENDAR_VIEW_OPTIONS}
                                ariaLabel="Режим календаря"
                            />
                        )}
                    </div>
                </div>

                {exportStatus && (
                    <div style={{ marginBottom: 12 }}>
                        <Text
                            variant="body-1"
                            style={{ color: exportStatus.type === "ok" ? "#15803D" : "#B42318" }}
                        >
                            {exportStatus.text}
                        </Text>
                    </div>
                )}

                {/* ── Calendar Views ── */}
                {displayMode === "calendar" && calendarView === "month" && (
                    <Month
                        currentDate={currentDate}
                        onLessonClick={setSelectedLesson}
                        onMoreClick={handleOpenDayFromMonth}
                        lessons={visibleLessons}
                    />
                )}
                {displayMode === "calendar" && calendarView === "week" && (
                    <Week
                        currentDate={currentDate}
                        onLessonClick={setSelectedLesson}
                        onSlotClick={handleCreateFromSlot}
                        onMoreClick={handleOpenDayFromMonth}
                        lessons={visibleLessons}
                    />
                )}
                {displayMode === "calendar" && calendarView === "day" && (
                    <Day
                        currentDate={currentDate}
                        onLessonClick={setSelectedLesson}
                        onSlotClick={handleCreateFromSlot}
                        lessons={visibleLessons}
                    />
                )}
                {displayMode === "list" && (
                    <ListView
                        lessons={visibleLessons}
                        statusLabels={LESSON_STATUS_BADGE_LABELS}
                        onLessonClick={setSelectedLesson}
                    />
                )}
            </div>

            {/* ── Modals ── */}
            <LessonPanelV2
                open={!!selectedLesson || createModal}
                onClose={() => {
                    setSelectedLesson(null);
                    setCreateModal(false);
                    setCreateSlot(null);
                    setEditLesson(null);
                }}
                lesson={selectedLesson || editLesson}
                onSaved={refetchLessons}
                onDeleted={handleDelete}
                defaultDate={createSlot?.date}
                defaultTime={createSlot?.time}
            />
        </GravityLayout>
    );
};

export default CalendarPage;
