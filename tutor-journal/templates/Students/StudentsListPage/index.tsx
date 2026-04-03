import { useState } from "react";
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

import { useHydrated } from "@/hooks/useHydrated";
import { students } from "@/mocks/students";
import type { Student } from "@/types/student";

const StudentsListPage = () => {
    const [type, setType] = useState<string>("all");
    const [valueAll, setValueAll] = useState<boolean>(false);
    const [search, setSearch] = useState<string>("");
    const { mounted } = useHydrated();

    const types = [
        { title: "Все", value: "all" },
        { title: "Активные", value: "active" },
        { title: "На паузе", value: "paused" },
        { title: "Архив", value: "archived" },
    ];

    const isMobile = useMediaQuery({
        query: "(max-width: 767px)",
    });

    const filtered = students.filter((s: Student) => {
        const matchesTab =
            type === "all" || s.status === type;
        const matchesSearch =
            !search ||
            s.name.toLowerCase().includes(search.toLowerCase()) ||
            s.subject.toLowerCase().includes(search.toLowerCase());
        return matchesTab && matchesSearch;
    });

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
                        onClick={() =>
                            console.log("TODO: open create student modal")
                        }
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
                    onClick={() =>
                        console.log("TODO: open create student modal")
                    }
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
                            <Row item={student} key={student.id} />
                        ))}
                    </tbody>
                </table>
            )}
            {filtered.length > 0 && <TablePagination />}
        </Layout>
    );
};

export default StudentsListPage;
