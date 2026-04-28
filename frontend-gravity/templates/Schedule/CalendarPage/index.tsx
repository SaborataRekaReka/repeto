import { useState, useEffect, useMemo, useCallback } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/router";
import GravityLayout from "@/components/GravityLayout";
import { Text, Button, Icon, Select, DropdownMenu } from "@gravity-ui/uikit";
import PillTabs, { type PillTabOption } from "@/components/PillTabs";
import AppIcon from "@/components/Icon";
import AnimatedSidebarIcon from "@/components/AnimatedSidebarIcon";
import {
    ArrowChevronLeft,
    ArrowChevronRight,
    ArrowLeft,
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
import { useSettings, syncYandexCalendar, syncGoogleCalendar } from "@/hooks/useSettings";
import { toLocalDateKey } from "@/lib/dates";
import { codedErrorMessage } from "@/lib/errorCodes";
import type { Lesson } from "@/types/schedule";

type CalendarViewType = "month" | "week" | "day";
type DisplayMode = "calendar" | "list";
type LessonStatusFilter = Lesson["status"];
type ExportProvider = "yandex" | "google";

const GDropdownMenu = DropdownMenu as any;

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
const MINI_CALENDAR_WEEKDAY_LABELS = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];

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

    useEffect(() => {
        if (!open) return;

        const handler = (event: KeyboardEvent) => {
            if (event.key === "Escape") {
                handleClose();
            }
        };

        document.addEventListener("keydown", handler);
        return () => document.removeEventListener("keydown", handler);
    }, [handleClose, open]);

    if (!mounted || (!shouldRender && !open) || typeof document === "undefined") {
        return null;
    }

    return createPortal(
        <div
            className={`lp2 repeto-schedule-workhours-panel${isPanelVisible ? " lp2--open" : ""}`}
            style={{ zIndex: WORK_HOURS_PANEL_Z_INDEX }}
            onTransitionEnd={handleTransitionEnd}
            role="dialog"
            aria-modal="false"
            aria-label="Рабочие часы"
        >
            <div className="lp2__topbar">
                <button type="button" className="lp2__back" onClick={handleClose} aria-label="Назад">
                    <Icon data={ArrowLeft as IconData} size={18} />
                </button>
                <div className="lp2__topbar-actions" />
            </div>

            <div className="lp2__scroll">
                <div className="lp2__center lp2__center--workhours">
                    <h1 className="lp2__page-title">Рабочие часы</h1>
                    <AvailabilityEditor embedded />
                </div>
            </div>
        </div>,
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
    const [exportMenuOpen, setExportMenuOpen] = useState(false);
    const [isExportIconActive, setIsExportIconActive] = useState(false);
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

    const handleProviderExport = useCallback(async (provider: ExportProvider) => {
        if (isExporting || settingsLoading) return;

        const isProviderConnected = provider === "yandex"
            ? hasYandexCalendar
            : hasGoogleCalendar;

        if (!isProviderConnected) {
            await router.push("/settings?tab=integrations");
            return;
        }

        setIsExporting(true);
        setExportStatus(null);

        const result = await runProviderExport(provider);
        setExportStatus({
            type: result.ok ? "ok" : "error",
            text: result.ok ? `Экспорт завершен. ${result.text}` : result.text,
        });

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

    const scheduleSidebarMonthLabel = `${MONTH_NAMES[currentDate.getMonth()]} ${currentDate.getFullYear()}`;
    const scheduleSidebarMiniCalendarCells = useMemo(() => {
        const monthStart = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
        const firstWeekdayIndex = (monthStart.getDay() + 6) % 7;
        const gridStart = new Date(monthStart);
        gridStart.setDate(monthStart.getDate() - firstWeekdayIndex);

        const todayKey = toLocalDateKey(new Date());
        const selectedDateKey = toLocalDateKey(currentDate);

        return Array.from({ length: 42 }, (_, index) => {
            const date = new Date(gridStart);
            date.setDate(gridStart.getDate() + index);

            const dateKey = toLocalDateKey(date);
            return {
                key: `${dateKey}-${index}`,
                date,
                dayNumber: date.getDate(),
                isOutsideMonth: date.getMonth() !== currentDate.getMonth(),
                isToday: dateKey === todayKey,
                isSelected: dateKey === selectedDateKey,
            };
        });
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
                            <Icon data={ArrowChevronLeft as IconData} size={14} />
                        </button>
                        <button
                            type="button"
                            className="repeto-schedule-sidebar-calendar__nav-btn"
                            aria-label="Следующий месяц"
                            onClick={() => handleSidebarMiniCalendarMonthShift(1)}
                        >
                            <Icon data={ArrowChevronRight as IconData} size={14} />
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

                <div className="repeto-schedule-export">
                    <GDropdownMenu
                        open={exportMenuOpen}
                        onOpenToggle={setExportMenuOpen}
                        popupProps={{
                            placement: "bottom-start",
                            className: "repeto-schedule-export-menu__popup",
                        }}
                        renderSwitcher={(props: any) => (
                            <button
                                type="button"
                                className="repeto-schedule-sidebar-tools__export"
                                disabled={isExporting || settingsLoading}
                                onMouseEnter={() => setIsExportIconActive(true)}
                                onMouseLeave={() => setIsExportIconActive(false)}
                                onFocus={() => setIsExportIconActive(true)}
                                onBlur={() => setIsExportIconActive(false)}
                                {...props}
                            >
                                <span className="repeto-schedule-sidebar-tools__export-main">
                                    <span className="repeto-schedule-sidebar-tools__export-icon" aria-hidden="true">
                                        <AnimatedSidebarIcon
                                            src="/icons/sidebar-animated/export.json"
                                            fallbackIcon={ArrowUpRight as IconData}
                                            play={isExportIconActive || exportMenuOpen}
                                            size={18}
                                        />
                                    </span>
                                    <span>
                                        {isExporting
                                            ? "Экспорт..."
                                            : settingsLoading
                                                ? "Проверяем интеграции..."
                                                : "Экспорт расписания"}
                                    </span>
                                </span>
                            </button>
                        )}
                    >
                        <div className="repeto-quick-actions-menu repeto-context-create-menu repeto-schedule-export-menu">
                            <div className="repeto-quick-actions-menu__list">
                                <button
                                    type="button"
                                    className="repeto-quick-actions-menu__item"
                                    onClick={() => {
                                        setExportMenuOpen(false);
                                        void handleProviderExport("yandex");
                                    }}
                                    disabled={isExporting}
                                >
                                    <span className="repeto-quick-actions-menu__item-icon repeto-schedule-export-menu__provider-icon" aria-hidden="true">
                                        <img src="/images/yandex.svg" alt="" />
                                    </span>
                                    <span className="repeto-quick-actions-menu__item-text">Яндекс Календарь</span>
                                </button>

                                <button
                                    type="button"
                                    className="repeto-quick-actions-menu__item"
                                    onClick={() => {
                                        setExportMenuOpen(false);
                                        void handleProviderExport("google");
                                    }}
                                    disabled={isExporting}
                                >
                                    <span className="repeto-quick-actions-menu__item-icon repeto-schedule-export-menu__provider-icon" aria-hidden="true">
                                        <img src="/images/google.svg" alt="" />
                                    </span>
                                    <span className="repeto-quick-actions-menu__item-text">Гугл календарь</span>
                                </button>
                            </div>
                        </div>
                    </GDropdownMenu>
                </div>
            </div>
        ),
        [
            availabilityTotalHours,
            exportMenuOpen,
            handleProviderExport,
            handleSidebarMiniCalendarMonthShift,
            handleSidebarMiniCalendarSelect,
            isExportIconActive,
            isExporting,
            scheduleSidebarMiniCalendarCells,
            scheduleSidebarMonthLabel,
            settingsLoading,
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
                            popupClassName="app-select-popup"
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
