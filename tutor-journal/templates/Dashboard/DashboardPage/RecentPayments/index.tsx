import Link from "next/link";
import { useMediaQuery } from "react-responsive";
import { useHydrated } from "@/hooks/useHydrated";
import { useRecentPayments } from "@/hooks/useDashboard";

const getStatusLabel = (status: string) =>
    status === "received" ? "Получен" : "Ожидается";

const getStatusClass = (status: string) =>
    status === "received"
        ? "label-green min-w-[5.5rem]"
        : "label-stroke-yellow min-w-[5.5rem]";

const RecentPayments = () => {
    const { mounted } = useHydrated();
    const isMobile = useMediaQuery({ query: "(max-width: 767px)" });
    const { data: recentPayments = [], loading } = useRecentPayments();

    return (
        <div className="card">
            <div className="card-head">
                <div className="mr-auto text-h6">Последние оплаты</div>
                <Link
                    href="/finance/payments"
                    className="text-xs font-bold transition-colors hover:text-purple-1"
                >
                    Все →
                </Link>
            </div>
            {loading ? (
                <div className="px-5 py-8 text-center text-n-3">Загрузка...</div>
            ) : recentPayments.length === 0 ? (
                <div className="px-5 py-8 text-center text-xs font-medium text-n-3 dark:text-white/50">
                    Пока оплат не было
                </div>
            ) : mounted && isMobile ? (
                <div className="p-4 space-y-2.5">
                    {recentPayments.map((p) => (
                        <div
                            className="border border-n-1 dark:border-white px-3.5 py-3 bg-white dark:bg-n-1"
                            key={p.id}
                        >
                            <div className="flex items-start justify-between gap-3 mb-1.5">
                                <div className="text-sm font-bold">
                                    {p.studentName}
                                </div>
                                <div className="text-sm font-bold text-green-1 shrink-0">
                                    +{p.amount.toLocaleString("ru-RU")} ₽
                                </div>
                            </div>
                            <div className="flex items-center justify-between">
                                <div className="text-xs text-n-3 dark:text-white/50">
                                    {p.date} · {p.method}
                                </div>
                                <span className={getStatusClass(p.status)}>
                                    {getStatusLabel(p.status)}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <table className="table-custom -mt-0.25 border-none">
                    <thead>
                        <tr>
                            <th className="th-custom">Дата</th>
                            <th className="th-custom">Ученик</th>
                            <th className="th-custom text-right">Сумма</th>
                            <th className="th-custom lg:hidden">Способ</th>
                            <th className="th-custom">Статус</th>
                        </tr>
                    </thead>
                    <tbody>
                        {recentPayments.map((p) => (
                            <tr key={p.id}>
                                <td className="td-custom text-sm">
                                    {p.date}
                                </td>
                                <td className="td-custom text-sm font-bold">
                                    {p.studentName}
                                </td>
                                <td className="td-custom text-sm font-bold text-right">
                                    +{p.amount.toLocaleString("ru-RU")} ₽
                                </td>
                                <td className="td-custom text-sm lg:hidden">
                                    {p.method}
                                </td>
                                <td className="td-custom">
                                    <span className={getStatusClass(p.status)}>
                                        {getStatusLabel(p.status)}
                                    </span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}
        </div>
    );
};

export default RecentPayments;
