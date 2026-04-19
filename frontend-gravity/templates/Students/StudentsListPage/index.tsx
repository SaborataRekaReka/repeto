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
import { Magnifier, Ellipsis, ArrowDown, Persons, Receipt, Calendar } from "@gravity-ui/icons";

const GDropdownMenu = DropdownMenu as any;
import GravityLayout from "@/components/GravityLayout";
import PageOverlay from "@/components/PageOverlay";
import AppDialog from "@/components/AppDialog";
import StudentAvatar from "@/components/StudentAvatar";
import StudentNameWithBadge from "@/components/StudentNameWithBadge";
import CreateStudentModal from "@/components/CreateStudentModal";
import CreatePaymentModal from "@/components/CreatePaymentModal";
import LessonPanelV2 from "@/components/LessonPanelV2";
import { useStudents, updateStudent } from "@/hooks/useStudents";
import {
    formatBalance,
    getStatusLabel,
} from "@/mocks/students";
import type { Student } from "@/types/student";

const filterTabs: { value: string; label: string }[] = [
    { value: "all", label: "Все" },
    { value: "active", label: "Активные" },
    { value: "paused", label: "На паузе" },
    { value: "archived", label: "Архив" },
    { value: "debt", label: "Долги по оплате" },
];

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
    const [createModal, setCreateModal] = useState<boolean>(false);
    const [paymentModal, setPaymentModal] = useState(false);
    const [lessonModal, setLessonModal] = useState(false);
    const [lessonStudent, setLessonStudent] = useState<Student | null>(null);
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
    const filtered =
        type === "debt"
            ? filteredRaw.filter((s) => s.balance < 0)
            : filteredRaw;
    const hasSearch = search.trim().length > 0;
    const shownCount = filtered.length;
    const totalCount = studentsData?.total ?? shownCount;

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
        await router.push("/payments");
    };

    const handleLessonModalSaved = async () => {
        lessonSubmittedRef.current = true;
        await router.push("/schedule");
    };

    const handleMessage = (student: Student) => {
        if (student.phone) {
            window.open(`tel:${student.phone.replace(/[^+\d]/g, "")}`, "_self");
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

    const overlayNav = [
        { key: "create", label: "Добавить ученика", icon: Persons as IconData },
        { key: "payment", label: "Записать оплату", icon: Receipt as IconData },
        { key: "lesson", label: "Добавить занятие", icon: Calendar as IconData },
        { key: "export", label: "Экспорт в .csv", icon: ArrowDown as IconData },
    ];

    const handleOverlayNav = (key: string) => {
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
        if (key === "export") {
            handleExportAll();
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
            text: "Написать",
            action: () => handleMessage(item),
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
        <GravityLayout title="Ученики" hideSidebar>
            <PageOverlay
                title="Ученики"
                breadcrumb="Дашборд"
                backHref="/dashboard"
                nav={overlayNav}
                onNavChange={handleOverlayNav}
            >
                <div className="repeto-sl-search-row">
                    <TextInput
                        size="l"
                        placeholder="Имя, предмет или класс"
                        value={search}
                        onUpdate={setSearch}
                        className="repeto-sl-search"
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
                </div>

                <div className="repeto-sl-tabs-row">
                    <div className="repeto-sl-pills">
                        {filterTabs.map((tab) => {
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
                            return (
                                <button
                                    key={tab.value}
                                    className={`repeto-sl-pill${type === tab.value ? " repeto-sl-pill--active" : ""}`}
                                    onClick={() => setType(tab.value)}
                                >
                                    {tab.label}
                                    {count > 0 && (
                                        <span className="repeto-sl-pill__count">{count}</span>
                                    )}
                                </button>
                            );
                        })}
                    </div>
                </div>

                {loading ? (
                    <div style={{ padding: "64px 0", textAlign: "center" }}>
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
                    <div className="repeto-sl-table">
                        <div className="repeto-sl-list-header">
                            <span className="repeto-sl-lh__col repeto-sl-lh__col--name">Ученик</span>
                            <span className="repeto-sl-lh__col repeto-sl-lh__col--grade">Класс</span>
                            <span className="repeto-sl-lh__col repeto-sl-lh__col--status">Статус</span>
                            <span className="repeto-sl-lh__col repeto-sl-lh__col--rate">Ставка</span>
                            <span className="repeto-sl-lh__col repeto-sl-lh__col--balance">Баланс</span>
                            <span className="repeto-sl-lh__col repeto-sl-lh__col--actions">&nbsp;</span>
                        </div>

                        <div className="repeto-sl-list">
                            {filtered.map((student) => (
                                <div
                                    key={student.id}
                                    className="repeto-sl-row"
                                    onClick={() => router.push(`/students/${student.id}`)}
                                >
                                    <div className="repeto-sl-row__cell repeto-sl-row__cell--name">
                                        <StudentAvatar student={student} size="m" />
                                        <div className="repeto-sl-row__name-text">
                                            <span className="repeto-sl-row__primary">
                                                <StudentNameWithBadge
                                                    name={student.name}
                                                    hasRepetoAccount={Boolean(student.accountId)}
                                                    truncate
                                                />
                                            </span>
                                            <span className="repeto-sl-row__secondary">{student.subject}</span>
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
                                    <div
                                        className="repeto-sl-row__cell repeto-sl-row__cell--actions"
                                        onClick={(e) => e.stopPropagation()}
                                    >
                                        <GDropdownMenu
                                            items={getMenuItems(student)}
                                            renderSwitcher={(props: any) => (
                                                <button
                                                    className="repeto-sl-row__menu-btn"
                                                    {...props}
                                                    title="Действия"
                                                >
                                                    <Icon data={Ellipsis as IconData} size={16} />
                                                </button>
                                            )}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

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
