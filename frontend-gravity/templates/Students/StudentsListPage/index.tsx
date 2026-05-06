import { useState, useEffect, useMemo, useRef } from "react";
import { useRouter } from "next/router";
import {
    Alert,
    Text,
    Button,
    TextInput,
    Icon,
    Loader,
    DropdownMenu,
} from "@gravity-ui/uikit";
import type { IconData } from "@gravity-ui/uikit";
import { Magnifier, Ellipsis, ArrowDown, Persons, Person, Plus, Receipt, Calendar, ChevronDown, Clock } from "@gravity-ui/icons";

const GDropdownMenu = DropdownMenu as any;
import GravityLayout from "@/components/GravityLayout";
import PageOverlay from "@/components/PageOverlay";
import AppDialog from "@/components/AppDialog";
import StudentAvatar from "@/components/StudentAvatar";
import StudentNameWithBadge from "@/components/StudentNameWithBadge";
import AnimatedSidebarIcon from "@/components/AnimatedSidebarIcon";
import CreateStudentModal from "@/components/CreateStudentModal";
import CreatePaymentModal from "@/components/CreatePaymentModal";
import LessonPanelV2 from "@/components/LessonPanelV2";
import RemindModal from "@/components/RemindModal";
import LessonBlock from "@/templates/Schedule/CalendarPage/LessonBlock";
import { useStudents, updateStudent } from "@/hooks/useStudents";
import { useLessons } from "@/hooks/useLessons";
import {
    formatBalance,
    getStatusLabel,
} from "@/mocks/students";
import type { Student } from "@/types/student";
import type { Lesson } from "@/types/schedule";

const filterTabs: { value: string; label: string }[] = [
    { value: "all", label: "Все" },
    { value: "active", label: "Активные" },
    { value: "paused", label: "На паузе" },
    { value: "archived", label: "Архив" },
    { value: "debt", label: "Долги по оплате" },
];

const ALL_FILTER_VALUE = "all";

type StudentSortValue = "next_action" | "name_asc" | "debt_desc" | "lesson_asc" | "rate_desc";
type AccountFilterValue = "all" | "linked" | "unlinked";
type StudentNextActionKind = "debt" | "lesson" | "schedule" | "activate" | "none";
type FilterPillOption<T extends string = string> = { value: T; content: string };

type StudentNextAction = {
    kind: StudentNextActionKind;
    label: string;
    detail: string;
    tone: "danger" | "warning" | "success" | "neutral";
    priority: number;
    dateValue?: number;
};

const studentFilterAnimatedIconPaths: Record<string, string> = {
    all: "/icons/sidebar-animated/people.json",
    active: "/icons/sidebar-animated/user-tick.json",
    paused: "/icons/sidebar-animated/clock.json",
    archived: "/icons/sidebar-animated/archive.json",
    debt: "/icons/sidebar-animated/receipt.json",
};

const studentFilterFallbackIcons: Record<string, IconData> = {
    all: Persons as IconData,
    active: Persons as IconData,
    paused: Clock as IconData,
    archived: Persons as IconData,
    debt: Receipt as IconData,
};

const getSingleSelectValue = <T extends string>(value: string[], fallback: T): T => {
    return ((value[0] || fallback) as T);
};

const normalizePhoneDigits = (value?: string) => (value || "").replace(/\D/g, "");

const formatDebtAmount = (value: number) => `${Math.abs(value).toLocaleString("ru-RU")}&nbsp;₽`;

const getLessonTimeValue = (lesson: Lesson) => {
    const timestamp = new Date(`${lesson.date}T${lesson.startTime || "00:00"}`).getTime();
    return Number.isFinite(timestamp) ? timestamp : 0;
};

const formatLessonActionDate = (lesson: Lesson) => {
    const timestamp = getLessonTimeValue(lesson);
    if (!timestamp) {
        return lesson.startTime || "—";
    }

    const date = new Date(timestamp);
    const dateLabel = date.toLocaleDateString("ru-RU", {
        day: "numeric",
        month: "short",
    });

    return `${dateLabel} · ${lesson.startTime}`;
};

const getGradeRank = (grade: string) => {
    if (grade === "Взрослый") return 99;
    const numeric = Number.parseInt(grade, 10);
    return Number.isFinite(numeric) ? numeric : 100;
};

type FilterPillProps<T extends string> = {
    value: T;
    options: FilterPillOption<T>[];
    onChange: (value: T) => void;
    isActive?: boolean;
    className?: string;
};

const FilterPill = <T extends string>({
    value,
    options,
    onChange,
    isActive,
    className,
}: FilterPillProps<T>) => {
    const [open, setOpen] = useState(false);
    const activeOption = options.find((option) => option.value === value) || options[0];

    return (
        <GDropdownMenu
            open={open}
            onOpenToggle={setOpen}
            popupProps={{
                placement: "bottom-start",
                className: "repeto-sl-filter-menu__popup",
            }}
            renderSwitcher={(props: any) => (
                <button
                    type="button"
                    className={`repeto-sl-filter-pill${isActive ? " repeto-sl-filter-pill--active" : ""}${className ? ` ${className}` : ""}`}
                    {...props}
                >
                    <span className="repeto-sl-filter-pill__text">{activeOption?.content || "Фильтр"}</span>
                    <Icon data={ChevronDown as IconData} size={14} />
                </button>
            )}
        >
            <div className="repeto-sl-filter-menu">
                {options.map((option) => (
                    <button
                        key={option.value}
                        type="button"
                        className={`repeto-sl-filter-menu__item${option.value === value ? " repeto-sl-filter-menu__item--active" : ""}`}
                        onClick={() => {
                            onChange(option.value);
                            setOpen(false);
                        }}
                    >
                        {option.content}
                    </button>
                ))}
            </div>
        </GDropdownMenu>
    );
};

function normalizeReturnToQuery(value: unknown): string | null {
    if (typeof value !== "string") return null;

    let normalized = value.trim();
    if (!normalized) return null;

    try {
        normalized = decodeURIComponent(normalized);
    } catch {
        // keep original string if it's not URI-encoded
    }

    if (!normalized.startsWith("/") || normalized.startsWith("//")) {
        return null;
    }

    return normalized;
}

const StudentsListPage = () => {
    const router = useRouter();
    const [type, setType] = useState<string>("all");
    const [search, setSearch] = useState<string>("");
    const [subjectFilter, setSubjectFilter] = useState<string[]>([ALL_FILTER_VALUE]);
    const [gradeFilter, setGradeFilter] = useState<string[]>([ALL_FILTER_VALUE]);
    const [accountFilter, setAccountFilter] = useState<AccountFilterValue[]>(["all"]);
    const [sortBy, setSortBy] = useState<StudentSortValue[]>(["next_action"]);
    const [createModal, setCreateModal] = useState<boolean>(false);
    const [paymentModal, setPaymentModal] = useState(false);
    const [lessonModal, setLessonModal] = useState(false);
    const [lessonStudent, setLessonStudent] = useState<Student | null>(null);
    const [reminderStudent, setReminderStudent] = useState<Student | null>(null);
    const [reminderInitialType, setReminderInitialType] = useState<"payment" | "lesson" | "homework">("payment");
    const [isExportIconActive, setIsExportIconActive] = useState(false);
    const [archiveConfirmStudent, setArchiveConfirmStudent] = useState<Student | null>(null);
    const [statusUpdatingId, setStatusUpdatingId] = useState<string | null>(null);
    const createReturnToRef = useRef<string | null>(null);
    const createSubmittedRef = useRef(false);
    const paymentSubmittedRef = useRef(false);
    const lessonSubmittedRef = useRef(false);

    const openCreateModal = () => {
        createReturnToRef.current = null;
        createSubmittedRef.current = false;
        setCreateModal(true);
    };

    useEffect(() => {
        if (router.query.create === "1") {
            createReturnToRef.current = normalizeReturnToQuery(router.query.returnTo);
            createSubmittedRef.current = false;
            setCreateModal(true);
            router.replace("/students", undefined, { shallow: true });
        }
    }, [router.query.create, router.query.returnTo]);

    useEffect(() => {
        const debtFilterFromQuery =
            router.query.filter === "debt" ||
            router.query.debt === "1";

        if (debtFilterFromQuery) {
            setType("debt");
        }
    }, [router.query.filter, router.query.debt]);

    const { data: studentsData, loading, refetch: refetchStudents } = useStudents({
        status: type === "all" || type === "debt" ? undefined : type,
        search: search || undefined,
        limit: 50,
    });

    // Fetch all students for stats (counts per status)
    const { data: allStudentsData } = useStudents({ limit: 1000 });
    const { data: allLessons = [] } = useLessons();
    const stats = useMemo(() => {
        const all = allStudentsData?.data || [];
        return {
            total: all.length,
            active: all.filter((s) => s.status === "active").length,
            paused: all.filter((s) => s.status === "paused").length,
            archived: all.filter((s) => s.status === "archived").length,
            debt: all.filter((s) => s.balance < 0).length,
        };
    }, [allStudentsData]);

    const filteredRaw = studentsData?.data || [];
    const allStudents = allStudentsData?.data || [];

    const subjectOptions = useMemo(() => {
        const subjects = Array.from(new Set(
            allStudents
                .map((student) => student.subject.trim())
                .filter(Boolean)
        )).sort((first, second) => first.localeCompare(second, "ru"));

        return [
            { value: ALL_FILTER_VALUE, content: "Все предметы" },
            ...subjects.map((subject) => ({ value: subject, content: subject })),
        ];
    }, [allStudents]);

    const gradeOptions = useMemo(() => {
        const grades = Array.from(new Set(
            allStudents
                .map((student) => student.grade.trim())
                .filter(Boolean)
        )).sort((first, second) => getGradeRank(first) - getGradeRank(second));

        return [
            { value: ALL_FILTER_VALUE, content: "Все классы" },
            ...grades.map((grade) => ({
                value: grade,
                content: grade === "Взрослый" ? "18+" : `${grade} класс`,
            })),
        ];
    }, [allStudents]);

    const nextActionByStudent = useMemo(() => {
        const lessonsByStudent = new Map<string, Lesson[]>();
        allLessons.forEach((lesson) => {
            if (!lesson.studentId) return;
            const list = lessonsByStudent.get(lesson.studentId) || [];
            list.push(lesson);
            lessonsByStudent.set(lesson.studentId, list);
        });

        const now = Date.now();
        const actionMap = new Map<string, StudentNextAction>();

        allStudents.forEach((student) => {
            const lessons = lessonsByStudent.get(student.id) || [];
            const nextLesson = lessons
                .filter((lesson) => lesson.status === "planned" && getLessonTimeValue(lesson) >= now - 60 * 60 * 1000)
                .sort((first, second) => getLessonTimeValue(first) - getLessonTimeValue(second))[0];

            if (student.balance < 0) {
                actionMap.set(student.id, {
                    kind: "debt",
                    label: "Напомнить о долге",
                    detail: `долг ${formatDebtAmount(student.balance).replace("&nbsp;", " ")}`,
                    tone: "danger",
                    priority: 0,
                    dateValue: nextLesson ? getLessonTimeValue(nextLesson) : undefined,
                });
                return;
            }

            if (nextLesson) {
                actionMap.set(student.id, {
                    kind: "lesson",
                    label: "Ближайшее занятие",
                    detail: formatLessonActionDate(nextLesson),
                    tone: "success",
                    priority: 1,
                    dateValue: getLessonTimeValue(nextLesson),
                });
                return;
            }

            if (student.status === "active") {
                actionMap.set(student.id, {
                    kind: "schedule",
                    label: "Назначить занятие",
                    detail: "нет будущих",
                    tone: "warning",
                    priority: 2,
                });
                return;
            }

            if (student.status === "paused") {
                actionMap.set(student.id, {
                    kind: "activate",
                    label: "Вернуть в работу",
                    detail: "на паузе",
                    tone: "neutral",
                    priority: 3,
                });
                return;
            }

            actionMap.set(student.id, {
                kind: "none",
                label: "В архиве",
                detail: "без действий",
                tone: "neutral",
                priority: 4,
            });
        });

        return actionMap;
    }, [allLessons, allStudents]);

    const nearestLessonByStudent = useMemo(() => {
        const lessonsByStudent = new Map<string, Lesson[]>();
        allLessons.forEach((lesson) => {
            if (!lesson.studentId) return;
            const list = lessonsByStudent.get(lesson.studentId) || [];
            list.push(lesson);
            lessonsByStudent.set(lesson.studentId, list);
        });

        const now = Date.now();
        const lessonMap = new Map<string, Lesson>();

        allStudents.forEach((student) => {
            const nextLesson = (lessonsByStudent.get(student.id) || [])
                .filter((lesson) => lesson.status === "planned" && getLessonTimeValue(lesson) >= now - 60 * 60 * 1000)
                .sort((first, second) => getLessonTimeValue(first) - getLessonTimeValue(second))[0];

            if (nextLesson) {
                lessonMap.set(student.id, nextLesson);
            }
        });

        return lessonMap;
    }, [allLessons, allStudents]);

    const filtered = useMemo(() => {
        const selectedSubject = getSingleSelectValue(subjectFilter, ALL_FILTER_VALUE);
        const selectedGrade = getSingleSelectValue(gradeFilter, ALL_FILTER_VALUE);
        const selectedAccount = getSingleSelectValue<AccountFilterValue>(accountFilter, "all");
        const selectedSort = getSingleSelectValue<StudentSortValue>(sortBy, "next_action");

        const list = (type === "debt"
            ? filteredRaw.filter((student) => student.balance < 0)
            : filteredRaw
        ).filter((student) => {
            if (selectedSubject !== ALL_FILTER_VALUE && student.subject !== selectedSubject) {
                return false;
            }
            if (selectedGrade !== ALL_FILTER_VALUE && student.grade !== selectedGrade) {
                return false;
            }
            if (selectedAccount === "linked" && !student.accountId) {
                return false;
            }
            if (selectedAccount === "unlinked" && student.accountId) {
                return false;
            }
            return true;
        });

        return [...list].sort((first, second) => {
            if (selectedSort === "debt_desc") {
                return first.balance - second.balance || first.name.localeCompare(second.name, "ru");
            }
            if (selectedSort === "lesson_asc") {
                const firstAction = nextActionByStudent.get(first.id);
                const secondAction = nextActionByStudent.get(second.id);
                return (firstAction?.dateValue || Number.MAX_SAFE_INTEGER)
                    - (secondAction?.dateValue || Number.MAX_SAFE_INTEGER)
                    || first.name.localeCompare(second.name, "ru");
            }
            if (selectedSort === "rate_desc") {
                return second.rate - first.rate || first.name.localeCompare(second.name, "ru");
            }
            if (selectedSort === "name_asc") {
                return first.name.localeCompare(second.name, "ru");
            }

            const firstAction = nextActionByStudent.get(first.id);
            const secondAction = nextActionByStudent.get(second.id);
            return (firstAction?.priority ?? 9) - (secondAction?.priority ?? 9)
                || (firstAction?.dateValue || Number.MAX_SAFE_INTEGER)
                    - (secondAction?.dateValue || Number.MAX_SAFE_INTEGER)
                || first.name.localeCompare(second.name, "ru");
        });
    }, [accountFilter, filteredRaw, gradeFilter, nextActionByStudent, sortBy, subjectFilter, type]);

    const hasSearch = search.trim().length > 0;
    const hasActiveFilters =
        hasSearch ||
        type !== "all" ||
        getSingleSelectValue(subjectFilter, ALL_FILTER_VALUE) !== ALL_FILTER_VALUE ||
        getSingleSelectValue(gradeFilter, ALL_FILTER_VALUE) !== ALL_FILTER_VALUE ||
        getSingleSelectValue<AccountFilterValue>(accountFilter, "all") !== "all" ||
        getSingleSelectValue<StudentSortValue>(sortBy, "next_action") !== "next_action";
    const selectedSubject = getSingleSelectValue(subjectFilter, ALL_FILTER_VALUE);
    const selectedGrade = getSingleSelectValue(gradeFilter, ALL_FILTER_VALUE);

    const resetFilters = () => {
        setType("all");
        setSearch("");
        setSubjectFilter([ALL_FILTER_VALUE]);
        setGradeFilter([ALL_FILTER_VALUE]);
        setAccountFilter(["all"]);
        setSortBy(["next_action"]);
    };

    const handleCreateModalClose = () => {
        setCreateModal(false);

        const returnTo = createReturnToRef.current;
        const shouldReturnToOrigin =
            !createSubmittedRef.current &&
            !!returnTo &&
            returnTo !== "/students";

        createReturnToRef.current = null;
        createSubmittedRef.current = false;

        if (shouldReturnToOrigin && returnTo) {
            router.push(returnTo);
        }
    };

    const handleCreateModalCreated = async (createdStudent?: Student) => {
        createSubmittedRef.current = true;
        await refetchStudents();

        if (createdStudent?.id) {
            await router.push(`/students/${createdStudent.id}`);
        }
    };

    const handleScheduleLesson = (student: Student) => {
        lessonSubmittedRef.current = false;
        setLessonStudent(student);
        setLessonModal(true);
    };

    const openPaymentModal = () => {
        paymentSubmittedRef.current = false;
        setPaymentModal(true);
    };

    const openLessonModal = () => {
        lessonSubmittedRef.current = false;
        setLessonStudent(null);
        setLessonModal(true);
    };

    const handlePaymentModalClose = () => {
        setPaymentModal(false);
        paymentSubmittedRef.current = false;
    };

    const handleLessonModalClose = () => {
        setLessonModal(false);
        lessonSubmittedRef.current = false;
    };

    const handlePaymentModalCreated = async () => {
        paymentSubmittedRef.current = true;
        await router.push("/finance/payments");
    };

    const handleLessonModalSaved = async () => {
        lessonSubmittedRef.current = true;
        await router.push("/schedule");
    };

    const handleCall = (student: Student) => {
        if (student.phone) {
            window.open(`tel:${student.phone.replace(/[^+\d]/g, "")}`, "_self");
        }
    };

    const handleWhatsapp = (student: Student) => {
        const digits = normalizePhoneDigits(student.whatsapp || student.phone);
        if (digits) {
            window.open(`https://wa.me/${digits}`, "_blank", "noopener,noreferrer");
        }
    };

    const handleEmail = (email?: string) => {
        if (email) {
            window.open(`mailto:${email}`, "_self");
        }
    };

    const openReminder = (student: Student, reminderType: "payment" | "lesson" | "homework") => {
        setReminderStudent(student);
        setReminderInitialType(reminderType);
    };

    const handleNextAction = (event: React.MouseEvent, student: Student, action: StudentNextAction) => {
        event.stopPropagation();

        if (action.kind === "debt") {
            openReminder(student, "payment");
            return;
        }
        if (action.kind === "schedule") {
            handleScheduleLesson(student);
            return;
        }
        if (action.kind === "lesson") {
            router.push(`/students/${student.id}?tab=lessons`);
            return;
        }
        if (action.kind === "activate") {
            void handleStatusChange(student, "active");
        }
    };

    const handleStatusChange = async (student: Student, nextStatus: Student["status"]) => {
        if (student.status === nextStatus) return;
        setStatusUpdatingId(student.id);
        try {
            await updateStudent(student.id, { status: nextStatus } as Partial<Student>);
            await refetchStudents();
        } catch {
            // silent: keep current behavior without intrusive alerts in row actions
        } finally {
            setStatusUpdatingId((prev) => (prev === student.id ? null : prev));
        }
    };

    const requestArchive = (student: Student) => {
        if (student.status === "archived") return;
        setArchiveConfirmStudent(student);
    };

    const confirmArchive = async () => {
        if (!archiveConfirmStudent) return;
        await handleStatusChange(archiveConfirmStudent, "archived");
        setArchiveConfirmStudent(null);
    };

    const handleExportAll = () => {
        const all = allStudentsData?.data || [];
        if (all.length === 0) return;

        const headers = ["Имя", "Предмет", "Класс", "Статус", "Ставка", "Баланс"];
        const rows = all.map((student) => [
            student.name,
            student.subject,
            student.grade,
            getStatusLabel(student.status),
            String(student.rate),
            formatBalance(student.balance),
        ]);

        const toCsvCell = (value: string) => `"${value.replace(/"/g, '""')}"`;
        const csv = [headers, ...rows]
            .map((row) => row.map((cell) => toCsvCell(String(cell))).join(","))
            .join("\n");

        const blob = new Blob(["\ufeff", csv], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `students-${new Date().toISOString().slice(0, 10)}.csv`;
        link.click();
        URL.revokeObjectURL(url);
    };

    const studentFilterNav = filterTabs.map((tab) => {
        const count =
            tab.value === "all"
                ? stats.total
                : tab.value === "active"
                  ? stats.active
                  : tab.value === "paused"
                    ? stats.paused
                    : tab.value === "archived"
                      ? stats.archived
                      : stats.debt;

        return {
            key: tab.value,
            label: `${tab.label} · ${count}`,
            icon: studentFilterFallbackIcons[tab.value] || Persons as IconData,
            animatedIconPath: studentFilterAnimatedIconPaths[tab.value],
        };
    });

    const overlayNav = [
        ...studentFilterNav,
        { key: "create", label: "Добавить ученика", icon: Persons as IconData },
        { key: "payment", label: "Записать оплату", icon: Receipt as IconData },
        { key: "lesson", label: "Добавить занятие", icon: Calendar as IconData },
    ];

    const handleOverlayNav = (key: string) => {
        if (filterTabs.some((tab) => tab.value === key)) {
            setType(key);
            return;
        }
        if (key === "create") {
            openCreateModal();
            return;
        }
        if (key === "payment") {
            openPaymentModal();
            return;
        }
        if (key === "lesson") {
            openLessonModal();
            return;
        }
    };

    const getMenuItems = (item: Student) => [
        {
            text: "Открыть",
            action: () => router.push(`/students/${item.id}`),
        },
        {
            text: "Назначить занятие",
            action: () => handleScheduleLesson(item),
        },
        {
            text: item.balance < 0 ? "Напомнить об оплате" : "Напомнить",
            action: () => openReminder(item, item.balance < 0 ? "payment" : "lesson"),
        },
        {
            text: "Напомнить о домашке",
            action: () => openReminder(item, "homework"),
        },
        {
            text: "WhatsApp",
            disabled: !normalizePhoneDigits(item.whatsapp || item.phone),
            action: () => handleWhatsapp(item),
        },
        {
            text: "Позвонить",
            disabled: !item.phone,
            action: () => handleCall(item),
        },
        {
            text: "Email родителю",
            disabled: !item.parentEmail,
            action: () => handleEmail(item.parentEmail),
        },
        {
            text: item.status === "archived" ? "Вытащить из архива" : "Сделать активным",
            disabled: item.status === "active" || statusUpdatingId === item.id,
            action: () => {
                void handleStatusChange(item, "active");
            },
        },
        {
            text: "Поставить на паузу",
            disabled: item.status === "paused" || statusUpdatingId === item.id,
            action: () => {
                void handleStatusChange(item, "paused");
            },
        },
        {
            text:
                statusUpdatingId === item.id
                    ? "Переносим..."
                    : item.status === "archived"
                    ? "Уже в архиве"
                    : "Перенести в архив",
            theme: "danger" as const,
            disabled: item.status === "archived" || statusUpdatingId === item.id,
            action: () => {
                requestArchive(item);
            },
        },
    ];

    return (
        <GravityLayout title="Ученики">
            <PageOverlay
                className="page-overlay--finance-dashboard-bg"
                title="Ученики"
                breadcrumb="Дашборд"
                backHref="/dashboard"
                nav={overlayNav}
                activeNav={type}
                onNavChange={handleOverlayNav}
            >
                <div className="repeto-sl-table repeto-sl-table--students">
                    <div className="repeto-sl-table-toolbar">
                        <div className="repeto-sl-filter-row">
                            <FilterPill
                                value={selectedSubject}
                                options={subjectOptions}
                                onChange={(value) => setSubjectFilter([value])}
                                isActive={selectedSubject !== ALL_FILTER_VALUE}
                            />
                            <FilterPill
                                value={selectedGrade}
                                options={gradeOptions}
                                onChange={(value) => setGradeFilter([value])}
                                isActive={selectedGrade !== ALL_FILTER_VALUE}
                                className="repeto-sl-filter-pill--short"
                            />
                            <div className="repeto-sl-filter-row__meta">
                                <TextInput
                                    size="l"
                                    placeholder="Имя, предмет или класс"
                                    value={search}
                                    onUpdate={setSearch}
                                    className="repeto-sl-search repeto-sl-search--toolbar"
                                    startContent={
                                        <Icon
                                            data={Magnifier as IconData}
                                            size={16}
                                            style={{
                                                color: "var(--g-color-text-hint)",
                                                marginLeft: 6,
                                                marginRight: 4,
                                            }}
                                        />
                                    }
                                />
                                <button
                                    type="button"
                                    className="repeto-sl-export-button"
                                    onClick={handleExportAll}
                                    onMouseEnter={() => setIsExportIconActive(true)}
                                    onMouseLeave={() => setIsExportIconActive(false)}
                                    onFocus={() => setIsExportIconActive(true)}
                                    onBlur={() => setIsExportIconActive(false)}
                                    disabled={!allStudents.length}
                                >
                                    <span className="repeto-sl-export-button__icon" aria-hidden="true">
                                        <AnimatedSidebarIcon
                                            src="/icons/sidebar-animated/export.json"
                                            fallbackIcon={ArrowDown as IconData}
                                            play={isExportIconActive}
                                            size={18}
                                        />
                                    </span>
                                    <span>Экспорт .csv</span>
                                </button>
                                {hasActiveFilters && (
                                    <Button view="flat" size="s" onClick={resetFilters}>
                                        Сбросить
                                    </Button>
                                )}
                            </div>
                        </div>
                    </div>

                    {loading ? (
                        <div className="repeto-sl-table-state">
                            <Loader size="m" />
                        </div>
                    ) : filtered.length === 0 ? (
                        <div className="repeto-sl-empty">
                            <Text
                                variant="subheader-2"
                                style={{ marginBottom: 8, display: "block" }}
                            >
                                {hasSearch ? "Ничего не найдено" : "Пока нет учеников"}
                            </Text>
                            <Text
                                variant="body-1"
                                color="secondary"
                                style={{ marginBottom: 24, display: "block" }}
                            >
                                {hasSearch
                                    ? "Попробуйте изменить запрос или очистить поиск."
                                    : "Добавьте первого ученика, чтобы начать вести журнал занятий и оплат."}
                            </Text>
                            {hasSearch && (
                                <Button
                                    view="outlined"
                                    size="l"
                                    onClick={() => setSearch("")}
                                >
                                    Очистить поиск
                                </Button>
                            )}
                        </div>
                    ) : (
                        <>
                            <div className="repeto-sl-table-scroll">
                                <div className="repeto-sl-list-header repeto-sl-list-header--students">
                                    <span className="repeto-sl-lh__col repeto-sl-lh__col--name">Ученик</span>
                                    <span className="repeto-sl-lh__col repeto-sl-lh__col--grade">Класс</span>
                                    <span className="repeto-sl-lh__col repeto-sl-lh__col--status">Статус</span>
                                    <span className="repeto-sl-lh__col repeto-sl-lh__col--upcoming">Ближайшее занятие</span>
                                    <span className="repeto-sl-lh__col repeto-sl-lh__col--rate">Ставка</span>
                                    <span className="repeto-sl-lh__col repeto-sl-lh__col--balance">Баланс</span>
                                </div>

                                <div className="repeto-sl-list">
                                    {filtered.map((student) => {
                                        const nextAction = nextActionByStudent.get(student.id) || {
                                            kind: "none",
                                            label: "Нет данных",
                                            detail: "—",
                                            tone: "neutral",
                                            priority: 9,
                                        } as StudentNextAction;
                                        const nextActionIcon: IconData | null =
                                            nextAction.kind === "debt"
                                                ? Receipt as IconData
                                                : nextAction.kind === "lesson" || nextAction.kind === "schedule"
                                                    ? Calendar as IconData
                                                    : nextAction.kind === "activate"
                                                        ? Persons as IconData
                                                    : null;
                                        const quickActionClassName = [
                                            "repeto-sl-row__menu-btn",
                                            "repeto-sl-row__menu-btn--quick",
                                            nextAction.kind === "debt" ? "repeto-sl-row__menu-btn--quick-debt" : "",
                                        ].filter(Boolean).join(" ");
                                        const nearestLesson = nearestLessonByStudent.get(student.id);
                                        const openActionTitle = `Открыть: ${student.name}`;
                                        const addActionTitle = `Добавить занятие: ${student.name}`;
                                        const quickActionTitle = nextAction.detail && nextAction.kind !== "none"
                                            ? `${nextAction.label}: ${nextAction.detail}`
                                            : nextAction.label;

                                        return (
                                        <div
                                            key={student.id}
                                            className="repeto-sl-row repeto-sl-row--students"
                                            onClick={() => router.push(`/students/${student.id}`)}
                                        >
                                            <div className="repeto-sl-row__cell repeto-sl-row__cell--name">
                                                <StudentAvatar student={student} size="m" />
                                                <div className="repeto-sl-row__name-text">
                                                    <span className="repeto-sl-row__primary">
                                                        <span
                                                            className={`repeto-sl-status-dot repeto-sl-status-dot--${student.status}`}
                                                            aria-hidden="true"
                                                        />
                                                        <span className="repeto-sl-row__primary-name">
                                                            <StudentNameWithBadge
                                                                name={student.name}
                                                                hasRepetoAccount={Boolean(student.accountId)}
                                                                truncate
                                                            />
                                                        </span>
                                                    </span>
                                                    <span className="repeto-sl-row__secondary">{student.subject}</span>
                                                </div>
                                                <div
                                                    className="repeto-sl-row__hover-actions"
                                                    onClick={(e) => e.stopPropagation()}
                                                >
                                                    <button
                                                        type="button"
                                                        className="repeto-sl-row__menu-btn repeto-sl-row__menu-btn--add"
                                                        onClick={() => handleScheduleLesson(student)}
                                                        title={addActionTitle}
                                                        aria-label={addActionTitle}
                                                    >
                                                        <Icon data={Plus as IconData} size={12} />
                                                    </button>
                                                    <button
                                                        type="button"
                                                        className="repeto-sl-row__menu-btn repeto-sl-row__menu-btn--open"
                                                        onClick={() => router.push(`/students/${student.id}`)}
                                                        title={openActionTitle}
                                                        aria-label={openActionTitle}
                                                    >
                                                        <Icon data={Person as IconData} size={12} />
                                                    </button>
                                                    {nextActionIcon && (
                                                        <button
                                                            type="button"
                                                            className={quickActionClassName}
                                                            onClick={(event) => handleNextAction(event, student, nextAction)}
                                                            disabled={nextAction.kind === "none" || statusUpdatingId === student.id}
                                                            title={quickActionTitle}
                                                            aria-label={quickActionTitle}
                                                        >
                                                            <Icon data={nextActionIcon} size={12} />
                                                        </button>
                                                    )}
                                                    <GDropdownMenu
                                                        items={getMenuItems(student)}
                                                        renderSwitcher={(props: any) => (
                                                            <button
                                                                className="repeto-sl-row__menu-btn repeto-sl-row__menu-btn--menu"
                                                                {...props}
                                                                title="Действия"
                                                            >
                                                                <Icon data={Ellipsis as IconData} size={14} />
                                                            </button>
                                                        )}
                                                    />
                                                </div>
                                            </div>
                                            <div className="repeto-sl-row__cell repeto-sl-row__cell--grade">
                                                <span className="repeto-sl-cell-badge">
                                                    {student.grade === "Взрослый" ? "18+" : `${student.grade} кл`}
                                                </span>
                                            </div>
                                            <div className="repeto-sl-row__cell repeto-sl-row__cell--status">
                                                <span className={`repeto-sl-cell-chip repeto-sl-cell-chip--${student.status}`}>
                                                    {getStatusLabel(student.status)}
                                                </span>
                                            </div>
                                            <div className="repeto-sl-row__cell repeto-sl-row__cell--upcoming">
                                                {nearestLesson ? (
                                                    <span
                                                        className="repeto-sl-upcoming-lesson-wrap"
                                                        onClick={(event) => event.stopPropagation()}
                                                    >
                                                        <LessonBlock
                                                            lesson={nearestLesson}
                                                            titleOverride={nearestLesson.subject}
                                                            metaOverride={nearestLesson.startTime || ""}
                                                            onClick={(lesson) => {
                                                                router.push(`/students/${student.id}?tab=lessons&lessonId=${lesson.id}`);
                                                            }}
                                                        />
                                                    </span>
                                                ) : (
                                                    <span className="repeto-sl-upcoming-empty">—</span>
                                                )}
                                            </div>
                                            <div className="repeto-sl-row__cell repeto-sl-row__cell--rate">
                                                <span className="repeto-sl-cell-money">
                                                    {student.rate.toLocaleString("ru-RU")}&nbsp;₽
                                                </span>
                                            </div>
                                            <div className="repeto-sl-row__cell repeto-sl-row__cell--balance">
                                                <span
                                                    className={`repeto-sl-cell-money${
                                                        student.balance < 0
                                                            ? " repeto-sl-cell-money--negative"
                                                            : student.balance > 0
                                                            ? " repeto-sl-cell-money--positive"
                                                            : ""
                                                    }`}
                                                >
                                                    {formatBalance(student.balance)}
                                                </span>
                                            </div>
                                        </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </>
                    )}
                </div>

                <CreateStudentModal
                    visible={createModal}
                    onClose={handleCreateModalClose}
                    onCreated={handleCreateModalCreated}
                />

                <CreatePaymentModal
                    visible={paymentModal}
                    onClose={handlePaymentModalClose}
                    onCreated={handlePaymentModalCreated}
                />

                <LessonPanelV2
                    open={lessonModal}
                    onClose={handleLessonModalClose}
                    onSaved={handleLessonModalSaved}
                    defaultStudent={lessonStudent || undefined}
                />
                {reminderStudent && (
                    <RemindModal
                        visible={!!reminderStudent}
                        onClose={() => setReminderStudent(null)}
                        onSent={() => { void refetchStudents(); }}
                        studentId={reminderStudent.id}
                        studentName={reminderStudent.name}
                        hasRepetoAccount={Boolean(reminderStudent.accountId)}
                        hasDebt={reminderStudent.balance < 0}
                        hasParentEmail={!!reminderStudent.parentEmail}
                        hasTelegramChannel={Boolean(reminderStudent.telegramChatId || reminderStudent.telegram)}
                        hasMaxChannel={Boolean(reminderStudent.maxChatId)}
                        estimatedDebtAmount={Math.max(0, -reminderStudent.balance)}
                        initialType={reminderInitialType}
                    />
                )}
                <AppDialog
                    size="s"
                    open={!!archiveConfirmStudent}
                    onClose={() => setArchiveConfirmStudent(null)}
                    caption="Перенести в архив"
                >
                    <Alert
                        theme="warning"
                        view="filled"
                        corners="rounded"
                        title="Подтвердите перенос в архив"
                        message={
                            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                                <div>
                                    {archiveConfirmStudent
                                        ? `Ученик «${archiveConfirmStudent.name}» будет перенесен в архив.`
                                        : ""}
                                </div>
                                <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, flexWrap: "wrap" }}>
                                    <Button
                                        view="outlined"
                                        size="m"
                                        onClick={() => setArchiveConfirmStudent(null)}
                                    >
                                        Отмена
                                    </Button>
                                    <Button
                                        view="action"
                                        size="m"
                                        onClick={confirmArchive}
                                        loading={!!statusUpdatingId}
                                        disabled={!!statusUpdatingId}
                                    >
                                        Перенести
                                    </Button>
                                </div>
                            </div>
                        }
                    />
                </AppDialog>
            </PageOverlay>
        </GravityLayout>
    );
};

export default StudentsListPage;
