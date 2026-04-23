import { useState, useEffect, useMemo, useCallback } from "react";
import { useRouter } from "next/router";
import GravityLayout from "@/components/GravityLayout";
import { Text, Button, Icon, Select, DropdownMenu } from "@gravity-ui/uikit";
import PillTabs from "@/components/PillTabs";
import {
    ArrowChevronLeft,
    ArrowChevronRight,
    ArrowUpFromLine,
    CirclePlus,
} from "@gravity-ui/icons";
import type { IconData } from "@gravity-ui/uikit";
import LessonPanelV2 from "@/components/LessonPanelV2";
import Month from "./Month";
import Week from "./Week";
import Day from "./Day";
import AvailabilityEditor from "./AvailabilityEditor";
import { useLessons, deleteLesson } from "@/hooks/useLessons";
import { useSettings, syncYandexCalendar, syncGoogleCalendar } from "@/hooks/useSettings";
import { toLocalDateKey } from "@/lib/dates";
import { codedErrorMessage } from "@/lib/errorCodes";
import type { Lesson } from "@/types/schedule";

type ViewType = "month" | "week" | "day";
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

const VIEW_OPTIONS: { value: ViewType; label: string }[] = [
    { value: "month", label: "Месяц" },
    { value: "week", label: "Неделя" },
    { value: "day", label: "День" },
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

const CalendarPage = () => {
    const router = useRouter();
    const [view, setView] = useState<ViewType>("week");
    const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null);
    const [createModal, setCreateModal] = useState(false);
    const [createSlot, setCreateSlot] = useState<{ date: string; time: string } | null>(null);
    const [editLesson, setEditLesson] = useState<Lesson | null>(null);
    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectedStatuses, setSelectedStatuses] = useState<LessonStatusFilter[]>(ALL_STATUS_VALUES);
    const [exportingProvider, setExportingProvider] = useState<"yandex" | "google" | null>(null);
    const [exportStatus, setExportStatus] = useState<{ type: "ok" | "error"; text: string } | null>(null);
    const [optimisticRemovedLessonIds, setOptimisticRemovedLessonIds] = useState<string[]>([]);

    const { data: settings } = useSettings();
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

    const handleOpenCreate = useCallback(() => {
        setEditLesson(null);
        setCreateSlot(null);
        setCreateModal(true);
    }, []);

    const handleExportToYandexCalendar = useCallback(async () => {
        if (!hasYandexCalendar) {
            router.push("/settings?tab=integrations&integration=yandex-calendar");
            return;
        }

        setExportingProvider("yandex");
        setExportStatus(null);
        try {
            const result = await syncYandexCalendar();
            const errors = result?.errors || 0;
            setExportStatus({
                type: "ok",
                text: errors > 0
                    ? `Экспорт завершен: ${result.synced} уроков, ошибок: ${errors}`
                    : `Экспорт завершен: ${result.synced} уроков отправлено в Яндекс.Календарь`,
            });
        } catch (error: any) {
            setExportStatus({
                type: "error",
                text: codedErrorMessage("SCHED-YDEX-EXP", error),
            });
        } finally {
            setExportingProvider(null);
        }
    }, [hasYandexCalendar, router]);

    const handleExportToGoogleCalendar = useCallback(async () => {
        if (!hasGoogleCalendar) {
            router.push("/settings?tab=integrations&integration=google-calendar");
            return;
        }

        setExportingProvider("google");
        setExportStatus(null);
        try {
            const result = await syncGoogleCalendar();
            const errors = result?.errors || 0;
            setExportStatus({
                type: "ok",
                text: errors > 0
                    ? `Экспорт завершен: ${result.synced} уроков, ошибок: ${errors}`
                    : `Экспорт завершен: ${result.synced} уроков отправлено в Google Calendar`,
            });
        } catch (error: any) {
            setExportStatus({
                type: "error",
                text: codedErrorMessage("SCHED-GCAL-EXP", error),
            });
        } finally {
            setExportingProvider(null);
        }
    }, [hasGoogleCalendar, router]);

    useEffect(() => {
        if (router.query.create === "1") {
            setEditLesson(null);
            setCreateSlot(null);
            setCreateModal(true);
            router.replace("/schedule", undefined, { shallow: true });
        }
    }, [router.query.create]);

    const dateRange = useMemo(() => {
        const d = currentDate;
        if (view === "month") {
            const from = new Date(d.getFullYear(), d.getMonth() - 1, 20);
            const to = new Date(d.getFullYear(), d.getMonth() + 1, 10);
            return { from: toLocalDateKey(from), to: toLocalDateKey(to) };
        }
        if (view === "week") {
            const start = new Date(d);
            const dow = start.getDay();
            start.setDate(start.getDate() - (dow === 0 ? 6 : dow - 1));
            const end = new Date(start);
            end.setDate(end.getDate() + 6);
            return { from: toLocalDateKey(start), to: toLocalDateKey(end) };
        }
        return { from: toLocalDateKey(d), to: toLocalDateKey(d) };
    }, [currentDate, view]);

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
            if (view === "month") d.setMonth(d.getMonth() + direction);
            else if (view === "week") d.setDate(d.getDate() + direction * 7);
            else d.setDate(d.getDate() + direction);
            return d;
        });
    }, [view]);

    const formatDateLabel = () => {
        if (view === "month") {
            return `${MONTH_NAMES[currentDate.getMonth()]} ${currentDate.getFullYear()}`;
        }
        if (view === "week") {
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
            <AvailabilityEditor />

            {/* ── Toolbar ── */}
            <div className="repeto-schedule-toolbar">
                {/* Lessons visibility filter */}
                <div className="repeto-schedule-toolbar__filter">
                    <Select
                        size="m"
                        width="max"
                        multiple
                        hasClear
                        hasCounter
                        placeholder="Типы занятий"
                        options={LESSON_STATUS_OPTIONS}
                        value={selectedStatuses}
                        onUpdate={(values) => {
                            setSelectedStatuses(values as LessonStatusFilter[]);
                        }}
                    />
                </div>

                {/* Navigation */}
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

                {/* Date label */}
                <Text variant="subheader-3" className="repeto-schedule-toolbar__date">
                    {formatDateLabel()}
                </Text>

                {/* Spacer */}
                <div className="repeto-schedule-toolbar__spacer" />

                {/* View toggle */}
                <div className="repeto-schedule-toolbar__view">
                    <PillTabs
                        value={view}
                        onChange={(v) => setView(v as ViewType)}
                        options={VIEW_OPTIONS}
                        ariaLabel="Режим календаря"
                    />
                </div>

                <div className="repeto-schedule-toolbar__export">
                    <DropdownMenu
                        switcher={
                            <Button
                                view="outlined"
                                size="m"
                                loading={exportingProvider !== null}
                            >
                                <Icon data={ArrowUpFromLine as IconData} size={16} />
                                Экспорт
                            </Button>
                        }
                        items={[
                            {
                                text: hasYandexCalendar
                                    ? "Экспорт в Яндекс.Календарь"
                                    : "Подключить Яндекс.Календарь",
                                action: () => {
                                    void handleExportToYandexCalendar();
                                },
                            },
                            {
                                text: hasGoogleCalendar
                                    ? "Экспорт в Google Calendar"
                                    : "Подключить Google Calendar",
                                action: () => {
                                    void handleExportToGoogleCalendar();
                                },
                            },
                        ]}
                    />
                </div>

                {/* Create button */}
                <div className="repeto-schedule-toolbar__create">
                    <Button view="action" size="m" onClick={handleOpenCreate}>
                        <Icon data={CirclePlus as IconData} size={16} />
                        Новое занятие
                    </Button>
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
            {view === "month" && (
                <Month
                    currentDate={currentDate}
                    onLessonClick={setSelectedLesson}
                    lessons={visibleLessons}
                />
            )}
            {view === "week" && (
                <Week
                    currentDate={currentDate}
                    onLessonClick={setSelectedLesson}
                    onSlotClick={handleCreateFromSlot}
                    lessons={visibleLessons}
                />
            )}
            {view === "day" && (
                <Day
                    currentDate={currentDate}
                    onLessonClick={setSelectedLesson}
                    onSlotClick={handleCreateFromSlot}
                    lessons={visibleLessons}
                />
            )}

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
