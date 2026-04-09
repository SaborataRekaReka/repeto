import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { useMediaQuery } from "react-responsive";
import Layout from "@/components/Layout";
import Tabs from "@/components/Tabs";
import Icon from "@/components/Icon";
import Sorting from "@/components/Sorting";
import Search from "@/components/Search";
import Checkbox from "@/components/Checkbox";
import TablePagination from "@/components/TablePagination";
import Empty from "@/components/Empty";
import Row from "./Row";
import Item from "./Item";

import CreateStudentModal from "@/components/CreateStudentModal";
import CreateLessonModal from "@/components/CreateLessonModal";
import { useHydrated } from "@/hooks/useHydrated";
import { useStudents } from "@/hooks/useStudents";
import type { Student } from "@/types/student";

const StudentsListPage = () => {
    const router = useRouter();
    const [type, setType] = useState<string>("all");
    const [valueAll, setValueAll] = useState<boolean>(false);
    const [search, setSearch] = useState<string>("");
    const [createModal, setCreateModal] = useState<boolean>(false);
    const [lessonModal, setLessonModal] = useState(false);
    const [lessonStudent, setLessonStudent] = useState<Student | null>(null);
    const { mounted } = useHydrated();

    useEffect(() => {
        if (router.query.create === "1") {
            setCreateModal(true);
            router.replace("/students", undefined, { shallow: true });
        }
    }, [router.query.create]);

    const types = [
        { title: "Все", value: "all" },
        { title: "Активные", value: "active" },
        { title: "На паузе", value: "paused" },
        { title: "Архив", value: "archived" },
    ];

    const isMobile = useMediaQuery({
        query: "(max-width: 767px)",
    });

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
        <Layout title="Ученики">
            <div className="flex mb-6 md:mb-5 md:block">
                <Tabs
                    className="mr-auto md:ml-0"
                    classButton="md:ml-0 md:flex-1"
                    items={types}
                    value={type}
                    setValue={setType}
                />
                <div className="flex gap-1.5 md:mt-4">
                    <button
                        className="btn-purple btn-small"
                        onClick={() => setCreateModal(true)}
                    >
                        <Icon name="add-circle" />
                        <span>Новый ученик</span>
                    </button>
                    <Search
                        className="md:flex-1"
                        placeholder="Поиск..."
                        value={search}
                        onChange={(e: any) => setSearch(e.target.value)}
                        onSubmit={(e: any) => e.preventDefault()}
                    />
                </div>
            </div>
            {filtered.length === 0 ? (
                <Empty
                    title="Пока нет учеников"
                    content="Добавьте первого ученика, чтобы начать вести журнал занятий и оплат."
                    buttonText="Добавить ученика"
                    onClick={() => setCreateModal(true)}
                />
            ) : mounted && isMobile ? (
                <div className="card">
                    {filtered.map((student) => (
                        <Item item={student} key={student.id} />
                    ))}
                </div>
            ) : (
                <table className="table-custom table-select">
                    <thead>
                        <tr>
                            <th className="th-custom">
                                <Checkbox
                                    value={valueAll}
                                    onChange={() => setValueAll(!valueAll)}
                                />
                            </th>
                            <th className="th-custom">
                                <Sorting title="Имя" />
                            </th>
                            <th className="th-custom">
                                <Sorting title="Предмет" />
                            </th>
                            <th className="th-custom lg:hidden">
                                <Sorting title="Класс" />
                            </th>
                            <th className="th-custom lg:hidden">
                                <Sorting title="Ставка" />
                            </th>
                            <th className="th-custom">
                                <Sorting title="Баланс" />
                            </th>
                            <th className="th-custom">
                                <Sorting title="Статус" />
                            </th>
                            <th className="th-custom text-right"></th>
                        </tr>
                    </thead>
                    <tbody>
                        {filtered.map((student) => (
                            <Row
                                item={student}
                                key={student.id}
                                onScheduleLesson={() => handleScheduleLesson(student)}
                                onMessage={() => handleMessage(student)}
                            />
                        ))}
                    </tbody>
                </table>
            )}
            {filtered.length > 0 && <TablePagination />}
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
        </Layout>
    );
};

export default StudentsListPage;
