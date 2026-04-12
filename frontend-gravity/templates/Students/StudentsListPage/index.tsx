import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/router";
import {
    Card,
    Text,
    Button,
    TextInput,
    Icon,
    Label,
    Loader,
    Avatar,
    Table,
    withTableActions,
    SegmentedRadioGroup,
} from "@gravity-ui/uikit";
import type { IconData, TableColumnConfig, TableActionConfig } from "@gravity-ui/uikit";
import { CirclePlus, Magnifier } from "@gravity-ui/icons";
import GravityLayout from "@/components/GravityLayout";
import CreateStudentModal from "@/components/CreateStudentModal";
import CreateLessonModal from "@/components/CreateLessonModal";
import { useStudents } from "@/hooks/useStudents";
import {
    getInitials,
    formatBalance,
    getStatusLabel,
} from "@/mocks/students";
import type { Student } from "@/types/student";

const StudentsTable = withTableActions<Student>(Table);

const statusTheme = (status: Student["status"]): "success" | "normal" =>
    status === "active" ? "success" : "normal";

const filterOptions = [
    { value: "all", content: "Все" },
    { value: "active", content: "Активные" },
    { value: "paused", content: "На паузе" },
    { value: "archived", content: "Архив" },
];

const StudentsListPage = () => {
    const router = useRouter();
    const [type, setType] = useState<string>("all");
    const [search, setSearch] = useState<string>("");
    const [createModal, setCreateModal] = useState<boolean>(false);
    const [lessonModal, setLessonModal] = useState(false);
    const [lessonStudent, setLessonStudent] = useState<Student | null>(null);

    useEffect(() => {
        if (router.query.create === "1") {
            setCreateModal(true);
            router.replace("/students", undefined, { shallow: true });
        }
    }, [router.query.create]);

    const { data: studentsData, loading, refetch: refetchStudents } = useStudents({
        status: type === "all" ? undefined : type,
        search: search || undefined,
        limit: 50,
    });
    const filtered = studentsData?.data || [];
    const hasSearch = search.trim().length > 0;
    const shownCount = filtered.length;
    const totalCount = studentsData?.total ?? shownCount;

    const handleScheduleLesson = (student: Student) => {
        setLessonStudent(student);
        setLessonModal(true);
    };

    const handleMessage = (student: Student) => {
        if (student.whatsapp) {
            const num = student.whatsapp.replace(/[^+\d]/g, "");
            window.open(`https://wa.me/${num}`, "_blank");
        } else if (student.phone) {
            window.open(`tel:${student.phone.replace(/[^+\d]/g, "")}`, "_self");
        }
    };

    const columns: TableColumnConfig<Student>[] = useMemo(
        () => [
            {
                id: "name",
                name: "Имя",
                primary: true,
                width: "34%",
                template: (item: Student) => (
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <Avatar text={getInitials(item.name)} size="m" theme="brand" />
                        <Text variant="body-2">{item.name}</Text>
                    </div>
                ),
            },
            {
                id: "subject",
                name: "Предмет",
                width: "18%",
                template: (item: Student) => (
                    <Text variant="body-1" color="secondary">{item.subject}</Text>
                ),
            },
            {
                id: "grade",
                name: "Класс",
                width: "10%",
                template: (item: Student) => (
                    <Text variant="body-1" color="secondary">{item.grade}</Text>
                ),
            },
            {
                id: "rate",
                name: "Ставка",
                align: "end",
                width: "12%",
                template: (item: Student) => (
                    <Text variant="body-1">{item.rate.toLocaleString("ru-RU")} ₽</Text>
                ),
            },
            {
                id: "balance",
                name: "Баланс",
                align: "end",
                width: "12%",
                template: (item: Student) => (
                    <Text
                        variant="body-2"
                        style={{
                            color: item.balance < 0 ? "#D16B8F" : item.balance > 0 ? "#22C55E" : undefined,
                        }}
                    >
                        {formatBalance(item.balance)}
                    </Text>
                ),
            },
            {
                id: "status",
                name: "Статус",
                width: "14%",
                template: (item: Student) => (
                    <Label theme={statusTheme(item.status)} size="xs">
                        {getStatusLabel(item.status)}
                    </Label>
                ),
            },
        ],
        []
    );

    const getRowActions = (item: Student): TableActionConfig<Student>[] => [
        {
            text: "Открыть",
            handler: () => router.push(`/students/${item.id}`),
        },
        {
            text: "Назначить занятие",
            handler: () => handleScheduleLesson(item),
        },
        {
            text: "Написать",
            handler: () => handleMessage(item),
        },
        {
            text: "Архивировать",
            handler: () => console.log("TODO: archive", item.id),
            theme: "danger" as const,
        },
    ];

    return (
        <GravityLayout title="Ученики">
            {/* Toolbar */}
            <div className="repeto-students-toolbar repeto-students-page-toolbar">
                <SegmentedRadioGroup
                    size="m"
                    value={type}
                    onUpdate={setType}
                    options={filterOptions}
                />
                <div className="repeto-students-toolbar__actions repeto-students-page-toolbar__actions">
                    <Button
                        view="action"
                        size="m"
                        onClick={() => setCreateModal(true)}
                    >
                        <Icon data={CirclePlus as IconData} size={16} />
                        Новый ученик
                    </Button>
                    <TextInput
                        size="m"
                        placeholder="Поиск..."
                        value={search}
                        onUpdate={setSearch}
                        className="repeto-students-page-search"
                        startContent={
                            <Icon
                                data={Magnifier as IconData}
                                size={14}
                                style={{
                                    color: "var(--g-color-text-secondary)",
                                    marginLeft: 4,
                                    marginRight: 2,
                                }}
                            />
                        }
                    />
                </div>
            </div>

            <div className="repeto-students-page-meta">
                <Text variant="caption-2" color="secondary">
                    {hasSearch
                        ? `Найдено: ${totalCount}`
                        : `Показано: ${shownCount} из ${totalCount}`}
                </Text>
            </div>

            {/* Content */}
            {loading ? (
                <div style={{ padding: "48px 0", textAlign: "center" }}>
                    <Loader size="m" />
                </div>
            ) : filtered.length === 0 ? (
                <Card
                    view="outlined"
                    style={{
                        padding: "48px 24px",
                        textAlign: "center",
                    }}
                >
                    <Text
                        variant="subheader-2"
                        style={{ marginBottom: 8, display: "block" }}
                    >
                        {hasSearch ? "Ничего не найдено" : "Пока нет учеников"}
                    </Text>
                    <Text
                        variant="body-1"
                        color="secondary"
                        style={{ marginBottom: 20, display: "block" }}
                    >
                        {hasSearch
                            ? "Попробуйте изменить запрос или очистить поиск."
                            : "Добавьте первого ученика, чтобы начать вести журнал занятий и оплат."}
                    </Text>
                    {hasSearch ? (
                        <Button
                            view="outlined"
                            size="l"
                            onClick={() => setSearch("")}
                        >
                            Очистить поиск
                        </Button>
                    ) : (
                        <Button
                            view="action"
                            size="l"
                            onClick={() => setCreateModal(true)}
                        >
                            <Icon data={CirclePlus as IconData} size={16} />
                            Добавить ученика
                        </Button>
                    )}
                </Card>
            ) : (
                <Card view="outlined" className="repeto-students-table-card repeto-students-page-table">
                    <StudentsTable
                        data={filtered}
                        columns={columns}
                        getRowActions={getRowActions}
                        onRowClick={(item) => router.push(`/students/${item.id}`)}
                        getRowDescriptor={() => ({ interactive: true })}
                        edgePadding
                        width="max"
                    />
                </Card>
            )}

            <CreateStudentModal
                visible={createModal}
                onClose={() => setCreateModal(false)}
                onCreated={refetchStudents}
            />
            <CreateLessonModal
                visible={lessonModal}
                onClose={() => {
                    setLessonModal(false);
                    setLessonStudent(null);
                }}
                defaultStudent={
                    lessonStudent
                        ? { id: lessonStudent.id, name: lessonStudent.name }
                        : null
                }
            />
        </GravityLayout>
    );
};

export default StudentsListPage;
