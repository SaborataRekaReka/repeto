import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import {
    Card,
    Text,
    Button,
    TextInput,
    Icon,
    Label,
    Loader,
} from "@gravity-ui/uikit";
import { CirclePlus, Magnifier } from "@gravity-ui/icons";
import type { IconData } from "@gravity-ui/uikit";
import GravityLayout from "@/components/GravityLayout";
import Row from "./Row";
import Item from "./Item";
import CreateStudentModal from "@/components/CreateStudentModal";
import CreateLessonModal from "@/components/CreateLessonModal";
import { useStudents } from "@/hooks/useStudents";
import type { Student } from "@/types/student";

const types = [
    { title: "Все", value: "all" },
    { title: "Активные", value: "active" },
    { title: "На паузе", value: "paused" },
    { title: "Архив", value: "archived" },
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

    const { data: studentsData, loading } = useStudents({
        status: type === "all" ? undefined : type,
        search: search || undefined,
        limit: 50,
    });
    const filtered = studentsData?.data || [];

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

    return (
        <GravityLayout title="Ученики">
            {/* Toolbar */}
            <div className="repeto-students-toolbar">
                <div className="repeto-students-toolbar__tabs">
                    {types.map((t) => (
                        <button
                            key={t.value}
                            className={`repeto-students-toolbar__tab${
                                type === t.value
                                    ? " repeto-students-toolbar__tab--active"
                                    : ""
                            }`}
                            onClick={() => setType(t.value)}
                        >
                            {t.title}
                        </button>
                    ))}
                </div>
                <div className="repeto-students-toolbar__actions">
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
                        style={{ width: 200 }}
                        startContent={
                            <Icon
                                data={Magnifier as IconData}
                                size={14}
                                style={{
                                    color: "var(--g-color-text-secondary)",
                                    marginLeft: 4,
                                }}
                            />
                        }
                    />
                </div>
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
                        Пока нет учеников
                    </Text>
                    <Text
                        variant="body-1"
                        color="secondary"
                        style={{ marginBottom: 20, display: "block" }}
                    >
                        Добавьте первого ученика, чтобы начать вести журнал
                        занятий и оплат.
                    </Text>
                    <Button
                        view="action"
                        size="l"
                        onClick={() => setCreateModal(true)}
                    >
                        <Icon data={CirclePlus as IconData} size={16} />
                        Добавить ученика
                    </Button>
                </Card>
            ) : (
                <Card view="outlined" style={{ background: "var(--g-color-base-float)", overflow: "hidden" }}>
                    <table className="repeto-students-table">
                        <thead>
                            <tr>
                                <th>Имя</th>
                                <th>Предмет</th>
                                <th>Класс</th>
                                <th>Ставка</th>
                                <th>Баланс</th>
                                <th>Статус</th>
                                <th style={{ width: 48 }}></th>
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.map((student) => (
                                <Row
                                    key={student.id}
                                    item={student}
                                    onScheduleLesson={() =>
                                        handleScheduleLesson(student)
                                    }
                                    onMessage={() => handleMessage(student)}
                                />
                            ))}
                        </tbody>
                    </table>
                </Card>
            )}

            <CreateStudentModal
                visible={createModal}
                onClose={() => setCreateModal(false)}
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
