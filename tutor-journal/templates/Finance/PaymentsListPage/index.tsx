import { useState } from "react";
import { useMediaQuery } from "react-responsive";
import Layout from "@/components/Layout";
import Tabs from "@/components/Tabs";
import Icon from "@/components/Icon";
import Search from "@/components/Search";
import Sorting from "@/components/Sorting";
import TablePagination from "@/components/TablePagination";
import Empty from "@/components/Empty";
import Modal from "@/components/Modal";
import Row from "./Row";
import Item from "./Item";

import { useHydrated } from "@/hooks/useHydrated";
import {
    payments,
    getMethodLabel,
    getStatusLabel,
    getStatusColor,
} from "@/mocks/finance-tutor";
import type { Payment, PaymentStatus } from "@/types/finance";

const tabs = [
    { title: "Все", value: "all" },
    { title: "Оплачено", value: "paid" },
    { title: "Ожидает", value: "pending" },
    { title: "Просрочено", value: "overdue" },
];

const PaymentsListPage = () => {
    const [tab, setTab] = useState<string>("all");
    const [search, setSearch] = useState<string>("");
    const [selected, setSelected] = useState<Payment | null>(null);
    const { mounted } = useHydrated();

    const isMobile = useMediaQuery({ query: "(max-width: 767px)" });

    const filtered = payments.filter((p) => {
        const matchesTab =
            tab === "all" || p.status === (tab as PaymentStatus);
        const matchesSearch =
            !search ||
            p.studentName.toLowerCase().includes(search.toLowerCase());
        return matchesTab && matchesSearch;
    });

    return (
        <Layout title="Оплаты">
            <div className="flex mb-6 md:mb-5 md:block">
                <Tabs
                    className="mr-auto md:ml-0"
                    classButton="md:ml-0 md:flex-1"
                    items={tabs}
                    value={tab}
                    setValue={setTab}
                />
                <div className="flex gap-1.5 md:mt-4">
                    <button
                        className="btn-purple btn-small"
                        onClick={() =>
                            console.log("TODO: open record payment modal")
                        }
                    >
                        <Icon name="add-circle" />
                        <span>Записать оплату</span>
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
                    title="Нет оплат"
                    content="Здесь будут отображаться записи об оплатах."
                    buttonText="Записать оплату"
                    onClick={() =>
                        console.log("TODO: open record payment modal")
                    }
                />
            ) : mounted && isMobile ? (
                <div className="card">
                    {filtered.map((p) => (
                        <Item
                            item={p}
                            key={p.id}
                            onClick={() => setSelected(p)}
                        />
                    ))}
                </div>
            ) : (
                <table className="table-custom">
                    <thead>
                        <tr>
                            <th className="th-custom">
                                <Sorting title="Дата" />
                            </th>
                            <th className="th-custom">
                                <Sorting title="Ученик" />
                            </th>
                            <th className="th-custom">
                                <Sorting title="Сумма" />
                            </th>
                            <th className="th-custom">Способ</th>
                            <th className="th-custom">Статус</th>
                            <th className="th-custom text-right"></th>
                        </tr>
                    </thead>
                    <tbody>
                        {filtered.map((p) => (
                            <Row
                                item={p}
                                key={p.id}
                                onClick={() => setSelected(p)}
                            />
                        ))}
                    </tbody>
                </table>
            )}
            {filtered.length > 0 && <TablePagination />}

            {/* Payment detail modal */}
            <Modal
                visible={!!selected}
                onClose={() => setSelected(null)}
                title="Детали оплаты"
            >
                {selected && (
                    <div className="px-6 pb-6">
                        <div className="flex flex-col gap-3">
                            <div className="flex justify-between">
                                <span className="text-sm text-n-3 dark:text-white/50">
                                    Ученик
                                </span>
                                <span className="text-sm font-bold">
                                    {selected.studentName}
                                </span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-sm text-n-3 dark:text-white/50">
                                    Сумма
                                </span>
                                <span className="text-sm font-bold">
                                    {selected.amount.toLocaleString("ru-RU")} ₽
                                </span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-sm text-n-3 dark:text-white/50">
                                    Дата
                                </span>
                                <span className="text-sm">
                                    {selected.date}
                                </span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-sm text-n-3 dark:text-white/50">
                                    Способ
                                </span>
                                <span className="text-sm">
                                    {getMethodLabel(selected.method)}
                                </span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-sm text-n-3 dark:text-white/50">
                                    Статус
                                </span>
                                <span
                                    className={`inline-flex items-center px-2 py-0.5 text-xs font-bold rounded-sm ${getStatusColor(
                                        selected.status
                                    )}`}
                                >
                                    {getStatusLabel(selected.status)}
                                </span>
                            </div>
                            {selected.comment && (
                                <div className="flex justify-between">
                                    <span className="text-sm text-n-3 dark:text-white/50">
                                        Комментарий
                                    </span>
                                    <span className="text-sm text-right max-w-[60%]">
                                        {selected.comment}
                                    </span>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </Modal>
        </Layout>
    );
};

export default PaymentsListPage;
