import { useState, useEffect, useMemo, useCallback } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/router";
import GravityLayout from "@/components/GravityLayout";
import { Text, Button, Icon, Select } from "@gravity-ui/uikit";
import PillTabs, { type PillTabOption } from "@/components/PillTabs";
import AppIcon from "@/components/Icon";
import AnimatedSidebarIcon from "@/components/AnimatedSidebarIcon";
import Lp2PlannerShell, { Lp2PlannerLayout, Lp2PlannerSection } from "@/components/Lp2PlannerShell";
import {
    ArrowLeft,
    ArrowRight,
    ArrowUpRight,
    Clock,
} from "@gravity-ui/icons";
import type { IconData } from "@gravity-ui/uikit";
import LessonPanelV2 from "@/components/LessonPanelV2";
import { useShellContextSidebar } from "@/components/GravityLayout/context-sidebar";
import Month from "./Month";
import Week from "./Week";
import Day from "./Day";
import ListView from "./List";
import AvailabilityEditor from "./AvailabilityEditor";
import { useLessons, deleteLesson } from "@/hooks/useLessons";
import { useAvailability } from "@/hooks/useAvailability";
import { useModalEscape } from "@/hooks/useModalEscape";
import { useSettings, syncYandexCalendar, syncGoogleCalendar } from "@/hooks/useSettings";
import { toLocalDateKey } from "@/lib/dates";
import { codedErrorMessage } from "@/lib/errorCodes";
import type { Lesson } from "@/types/schedule";

type CalendarViewType = "month" | "week" | "day";
type DisplayMode = "calendar" | "list";
type LessonStatusFilter = Lesson["status"];
type ExportProvider = "yandex" | "google";

const MONTH_NAMES = [
    "Январь", "Февраль", "Март", "Апрель", "Май", "Июнь",
    "Июль", "Август", "Сентябрь", "Октябрь", "Ноябрь", "Декабрь",
];
const MONTH_NAMES_GEN = [
    "января", "февраля", "марта", "апреля", "мая", "июня",
    "июля", "августа", "сентября", "октября", "ноября", "декабря",
];
const MINI_CALENDAR_WEEKDAY_LABELS = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];

const CALENDAR_VIEW_OPTIONS: { value: CalendarViewType; label: string }[] = [
    { value: "month", label: "Месяц" },
    { value: "week", label: "Неделя" },
    { value: "day", label: "День" },
];

const CALENDAR_VIEW_SELECT_OPTIONS: { value: CalendarViewType; content: string }[] =
    CALENDAR_VIEW_OPTIONS.map((option) => ({
        value: option.value,
        content: option.label,
    }));

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

type ScheduleShellContextSyncProps = {
    sidebarHeader: JSX.Element;
};

type ScheduleWorkHoursPanelProps = {
    open: boolean;
    onClose: () => void;
};

const ScheduleShellContextSync = ({
    sidebarHeader,
}: ScheduleShellContextSyncProps) => {
    const shellContextSidebar = useShellContextSidebar();

    useEffect(() => {
        if (!shellContextSidebar) return;

        shellContextSidebar.setShellContextSidebar({
            title: "Расписание",
            breadcrumb: "Дашборд",
            sidebarHeader,
            backHref: "/dashboard",
        });

        return () => {
            shellContextSidebar.setShellContextSidebar(null);
        };
    }, [shellContextSidebar, sidebarHeader]);

    return null;
};

const WORK_HOURS_PANEL_Z_INDEX = 960;

const ScheduleWorkHoursPanel = ({ open, onClose }: ScheduleWorkHoursPanelProps) => {
    const [mounted, setMounted] = useState(false);
    const [shouldRender, setShouldRender] = useState(false);
    const [isPanelVisible, setIsPanelVisible] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    useEffect(() => {
        if (open) {
            setShouldRender(true);
            const raf = requestAnimationFrame(() => {
                requestAnimationFrame(() => setIsPanelVisible(true));
            });
            return () => cancelAnimationFrame(raf);
        }

        setIsPanelVisible(false);
        return undefined;
    }, [open]);

    const handleTransitionEnd = useCallback(() => {
        if (!isPanelVisible) {
            setShouldRender(false);
        }
    }, [isPanelVisible]);

    const handleClose = useCallback(() => {
        setIsPanelVisible(false);
        setTimeout(() => onClose(), 350);
    }, [onClose]);

    useModalEscape({ enabled: open, onEscape: handleClose });

    if (!mounted || (!shouldRender && !open) || typeof document === "undefined") {
        return null;
    }

    return createPortal(
        <Lp2PlannerShell
            className="repeto-schedule-workhours-panel"
            style={{ zIndex: WORK_HOURS_PANEL_Z_INDEX }}
            isOpen={isPanelVisible}
            onTransitionEnd={handleTransitionEnd}
            ariaLabel="Рабочие часы"
            ariaModal={false}
            onBack={handleClose}
            title="Рабочие часы"
            subtitle="Настройка доступных слотов"
            centerClassName="lp2__center--workhours"
            withPlannerCenter={false}
        >
            <Lp2PlannerLayout>
                <Lp2PlannerSection
                    title="Календарь доступности"
                    description="Отметьте дни недели и часы, когда готовы проводить занятия"
                >
                    <AvailabilityEditor embedded />
                </Lp2PlannerSection>
            </Lp2PlannerLayout>
        </Lp2PlannerShell>,
        document.body,
    );
};

const CalendarPage = () => {
    const router = useRouter();
    const [displayMode, setDisplayMode] = useState<DisplayMode>("calendar");
    const [calendarView, setCalendarView] = useState<CalendarViewType>("week");
    const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null);
    const [createModal, setCreateModal] = useState(false);
    const [createSlot, setCreateSlot] = useState<{ date: string; time: string } | null>(null);
    const [editLesson, setEditLesson] = useState<Lesson | null>(null);
    const [currentDate, setCurrentDate] = useState(new Date());
    const [availabilityModalOpen, setAvailabilityModalOpen] = useState(false);
    const [selectedStatuses, setSelectedStatuses] = useState<LessonStatusFilter[]>(ALL_STATUS_VALUES);
    const [isExporting, setIsExporting] = useState(false);
    const [isToolbarExportIconActive, setIsToolbarExportIconActive] = useState(false);
    const [exportStatus, setExportStatus] = useState<{ type: "ok" | "error"; text: string } | null>(null);
    const [optimisticRemovedLessonIds, setOptimisticRemovedLessonIds] = useState<string[]>([]);

    const { data: availabilitySlots = [] } = useAvailability();
    const { data: settings, loading: settingsLoading } = useSettings();
    const hasYandexCalendar = !!settings?.hasYandexCalendar;
    const hasGoogleCalendar = !!settings?.hasGoogleCalendar;

    const availabilityTotalHours = useMemo(() => {
        const hourCells = new Set<string>();
        for (const slot of availabilitySlots) {
            const hour = parseInt(slot.startTime.split(":")[0], 10);
            hourCells.add(`${slot.dayOfWeek}-${hour}`);
        }
        return hourCells.size;
    }, [availabilitySlots]);

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

    const runProviderExport = useCallback(async (provider: ExportProvider) => {
        const isYandex = provider === "yandex";
        const providerLabel = isYandex ? "Яндекс" : "Google";
        const errorCode = isYandex ? "SCHED-YDEX-EXP" : "SCHED-GCAL-EXP";

        try {
            const result = isYandex
                ? await syncYandexCalendar()
                : await syncGoogleCalendar();
            const synced = Number(result?.synced || 0);
            const countErrors = Number(result?.errors || 0);

            if (countErrors > 0) {
                return {
                    ok: false,
                    text: `${providerLabel}: синхронизировано ${synced}, ошибок ${countErrors}`,
                };
            }

            return {
                ok: true,
                text: `${providerLabel}: синхронизировано ${synced}`,
            };
        } catch (error: any) {
            return {
                ok: false,
                text: `${providerLabel}: ${codedErrorMessage(errorCode, error)}`,
            };
        }
    }, [syncGoogleCalendar, syncYandexCalendar]);

    const handleQuickExport = useCallback(async () => {
        if (isExporting || settingsLoading) return;

        const connectedProviders: ExportProvider[] = [];
        if (hasYandexCalendar) connectedProviders.push("yandex");
        if (hasGoogleCalendar) connectedProviders.push("google");

        if (connectedProviders.length === 0) {
            await router.push("/settings?tab=integrations");
            return;
        }

        setIsExporting(true);
        setExportStatus(null);

        const success: string[] = [];
        const errors: string[] = [];

        for (const provider of connectedProviders) {
            const result = await runProviderExport(provider);
            if (result.ok) {
                success.push(result.text);
            } else {
                errors.push(result.text);
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
        runProviderExport,
        settingsLoading,
    ]);

    const handleSidebarMiniCalendarSelect = useCallback((date: Date) => {
        setDisplayMode("calendar");
        setCalendarView("day");
        setCurrentDate(new Date(date.getFullYear(), date.getMonth(), date.getDate()));
    }, []);

    const handleSidebarMiniCalendarMonthShift = useCallback((direction: -1 | 1) => {
        setCurrentDate((previousDate) => {
            const nextDate = new Date(previousDate);
            nextDate.setMonth(nextDate.getMonth() + direction);
            return nextDate;
        });
    }, []);

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

    const selectedStatusSummary = useMemo(() => {
        const selectedSet = new Set<LessonStatusFilter>(selectedStatuses);
        const orderedSelectedStatuses = LESSON_STATUS_OPTIONS
            .map((option) => option.value)
            .filter((status) => selectedSet.has(status));

        if (orderedSelectedStatuses.length === 0) {
            return "Статусы занятий";
        }

        if (orderedSelectedStatuses.length === ALL_STATUS_VALUES.length) {
            return "Все статусы";
        }

        if (orderedSelectedStatuses.length <= 2) {
            return orderedSelectedStatuses
                .map((status) => LESSON_STATUS_BADGE_LABELS[status])
                .join(", ");
        }

        return `Выбрано: ${orderedSelectedStatuses.length}`;
    }, [selectedStatuses]);

    const handleStatusesUpdate = useCallback((values: string[]) => {
        const valuesSet = new Set(values as LessonStatusFilter[]);
        const normalizedValues = LESSON_STATUS_OPTIONS
            .map((option) => option.value)
            .filter((status) => valuesSet.has(status));
        setSelectedStatuses(normalizedValues);
    }, []);

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

    const scheduleSidebarMonthLabel = `${MONTH_NAMES[currentDate.getMonth()]} ${currentDate.getFullYear()}`;
    const scheduleSidebarMiniCalendarCells = useMemo(() => {
        const monthStart = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
        const monthEnd = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
        const firstWeekdayIndex = (monthStart.getDay() + 6) % 7;
        const lastWeekdayIndex = (monthEnd.getDay() + 6) % 7;
        const gridStart = new Date(monthStart);
        gridStart.setDate(monthStart.getDate() - firstWeekdayIndex);
        const gridEnd = new Date(monthEnd);
        gridEnd.setDate(monthEnd.getDate() + (6 - lastWeekdayIndex));

        const todayKey = toLocalDateKey(new Date());
        const selectedDateKey = toLocalDateKey(currentDate);
        const cells: Array<{
            key: string;
            date: Date;
            dayNumber: number;
            isOutsideMonth: boolean;
            isToday: boolean;
            isSelected: boolean;
        }> = [];

        const cursor = new Date(gridStart);
        let index = 0;
        while (cursor <= gridEnd) {
            const date = new Date(cursor);
            const dateKey = toLocalDateKey(date);

            cells.push({
                key: `${dateKey}-${index}`,
                date,
                dayNumber: date.getDate(),
                isOutsideMonth: date.getMonth() !== currentDate.getMonth(),
                isToday: dateKey === todayKey,
                isSelected: dateKey === selectedDateKey,
            });

            cursor.setDate(cursor.getDate() + 1);
            index += 1;
        }

        return cells;
    }, [currentDate]);

    const scheduleSidebarHeader = useMemo(
        () => (
            <div className="repeto-schedule-sidebar-tools">
                <button
                    type="button"
                    className="repeto-schedule-sidebar-tools__workhours"
                    onClick={() => setAvailabilityModalOpen(true)}
                >
                    <span className="repeto-schedule-sidebar-tools__workhours-icon" aria-hidden="true">
                        <Icon data={Clock as IconData} size={14} />
                    </span>
                    <span className="repeto-schedule-sidebar-tools__workhours-title">Рабочие часы</span>
                    <span className="repeto-schedule-sidebar-tools__workhours-summary">· {availabilityTotalHours} ч/нед.</span>
                </button>

                <div className="repeto-schedule-sidebar-calendar" aria-label="Календарь расписания">
                <div className="repeto-schedule-sidebar-calendar__header">
                    <span className="repeto-schedule-sidebar-calendar__title">{scheduleSidebarMonthLabel}</span>
                    <div className="repeto-schedule-sidebar-calendar__nav">
                        <button
                            type="button"
                            className="repeto-schedule-sidebar-calendar__nav-btn"
                            aria-label="Предыдущий месяц"
                            onClick={() => handleSidebarMiniCalendarMonthShift(-1)}
                        >
                            <Icon data={ArrowLeft as IconData} size={16} />
                        </button>
                        <button
                            type="button"
                            className="repeto-schedule-sidebar-calendar__nav-btn"
                            aria-label="Следующий месяц"
                            onClick={() => handleSidebarMiniCalendarMonthShift(1)}
                        >
                            <Icon data={ArrowRight as IconData} size={16} />
                        </button>
                    </div>
                </div>

                <div className="repeto-schedule-sidebar-calendar__weekdays" aria-hidden="true">
                    {MINI_CALENDAR_WEEKDAY_LABELS.map((weekdayLabel) => (
                        <span key={weekdayLabel} className="repeto-schedule-sidebar-calendar__weekday">{weekdayLabel}</span>
                    ))}
                </div>

                <div className="repeto-schedule-sidebar-calendar__grid">
                    {scheduleSidebarMiniCalendarCells.map((cell) => (
                        <button
                            key={cell.key}
                            type="button"
                            className={`repeto-schedule-sidebar-calendar__day${cell.isOutsideMonth ? " repeto-schedule-sidebar-calendar__day--outside" : ""}${cell.isToday ? " repeto-schedule-sidebar-calendar__day--today" : ""}${cell.isSelected ? " repeto-schedule-sidebar-calendar__day--selected" : ""}`}
                            aria-pressed={cell.isSelected}
                            aria-label={`Открыть ${cell.dayNumber} ${MONTH_NAMES_GEN[cell.date.getMonth()]}`}
                            onClick={() => handleSidebarMiniCalendarSelect(cell.date)}
                        >
                            {cell.dayNumber}
                        </button>
                    ))}
                </div>
                </div>

            </div>
        ),
        [
            availabilityTotalHours,
            handleSidebarMiniCalendarMonthShift,
            handleSidebarMiniCalendarSelect,
            scheduleSidebarMiniCalendarCells,
            scheduleSidebarMonthLabel,
        ],
    );

    return (
        <GravityLayout title="Расписание">
            <ScheduleShellContextSync
                sidebarHeader={scheduleSidebarHeader}
            />

            <div className="repeto-schedule-page">
                {/* ── Toolbar ── */}
                <div className="repeto-schedule-toolbar">
                    <div className="repeto-schedule-toolbar__mode-group">
                        <div className="repeto-schedule-toolbar__display">
                            <PillTabs
                                value={displayMode}
                                onChange={(mode) => setDisplayMode(mode as DisplayMode)}
                                options={DISPLAY_MODE_OPTIONS}
                                size="s"
                                ariaLabel="Режим представления"
                            />
                        </div>
                    </div>

                    <div className="repeto-schedule-toolbar__meta-group">
                        {/* Period navigation */}
                        <div className="repeto-schedule-toolbar__period">
                            <div className="repeto-schedule-toolbar__nav">
                                <Button
                                    view="flat"
                                    size="m"
                                    onClick={() => navigate(-1)}
                                >
                                    <Icon data={ArrowLeft as IconData} size={18} />
                                </Button>
                                <Button
                                    view="flat"
                                    size="m"
                                    onClick={() => navigate(1)}
                                >
                                    <Icon data={ArrowRight as IconData} size={18} />
                                </Button>
                            </div>

                            {displayMode === "calendar" && (
                                <Select
                                    className="repeto-schedule-view-select"
                                    popupClassName="repeto-schedule-view-popup"
                                    size="m"
                                    width={132}
                                    options={CALENDAR_VIEW_SELECT_OPTIONS}
                                    value={[calendarView]}
                                    onUpdate={([nextView]) => {
                                        if (nextView) {
                                            setCalendarView(nextView as CalendarViewType);
                                        }
                                    }}
                                />
                            )}

                            <span className="repeto-schedule-toolbar__period-divider" aria-hidden="true" />

                            <button
                                type="button"
                                className="repeto-schedule-toolbar__export-calendar-btn"
                                onClick={() => {
                                    void handleQuickExport();
                                }}
                                disabled={isExporting || settingsLoading}
                                onMouseEnter={() => setIsToolbarExportIconActive(true)}
                                onMouseLeave={() => setIsToolbarExportIconActive(false)}
                                onFocus={() => setIsToolbarExportIconActive(true)}
                                onBlur={() => setIsToolbarExportIconActive(false)}
                            >
                                <span className="repeto-schedule-toolbar__export-calendar-icon" aria-hidden="true">
                                    <AnimatedSidebarIcon
                                        src="/icons/sidebar-animated/export.json"
                                        fallbackIcon={ArrowUpRight as IconData}
                                        play={isToolbarExportIconActive}
                                        size={18}
                                    />
                                </span>
                                <span>
                                    {isExporting
                                        ? "Экспорт..."
                                        : settingsLoading
                                            ? "Проверяем интеграции..."
                                            : "Экспорт в Календарь"}
                                </span>
                            </button>
                        </div>

                        {/* Lessons visibility filter */}
                        <div
                            className="repeto-schedule-toolbar__filter repeto-schedule-toolbar__filter--summary"
                            data-status-summary={selectedStatusSummary}
                        >
                            <Select
                                className="repeto-schedule-filter-select"
                                popupClassName="repeto-schedule-filter-popup"
                                size="m"
                                width="max"
                                multiple
                                hasClear
                                hasCounter={false}
                                placeholder="Статусы занятий"
                                options={LESSON_STATUS_OPTIONS}
                                value={selectedStatuses}
                                onUpdate={handleStatusesUpdate}
                            />
                        </div>
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

            <ScheduleWorkHoursPanel
                open={availabilityModalOpen}
                onClose={() => setAvailabilityModalOpen(false)}
            />

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
