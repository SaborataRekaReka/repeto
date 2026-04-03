import Link from "next/link";
import Icon from "@/components/Icon";
import { useMediaQuery } from "react-responsive";
import { useHydrated } from "@/hooks/useHydrated";
import { recentPayments } from "@/mocks/tutorDashboard";

const RecentPayments = () => {
    const { mounted } = useHydrated();
    const isMobile = useMediaQuery({ query: "(max-width: 767px)" });

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
            {mounted && isMobile ? (
                <div>
                    {recentPayments.map((p) => (
                        <div
                            className="flex items-center justify-between px-4 py-3 border-t border-n-1 first:border-none dark:border-white"
                            key={p.id}
                        >
                            <div>
                                <div className="text-sm font-bold">
                                    {p.studentName}
                                </div>
                                <div className="text-xs text-n-3 dark:text-white/50">
                                    {p.date} · {p.method}
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="text-sm font-bold text-green-1">
                                    +{p.amount.toLocaleString("ru-RU")} ₽
                                </span>
                                <div
                                    className={`px-2 py-0.5 text-xs font-bold ${
                                        p.status === "received"
                                            ? "bg-green-1 text-n-1"
                                            : "bg-yellow-1 text-n-1"
                                    }`}
                                >
                                    {p.status === "received"
                                        ? "Получен"
                                        : "Ожидается"}
                                </div>
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
                                <td className="td-custom text-sm font-bold text-right text-green-1">
                                    +{p.amount.toLocaleString("ru-RU")} ₽
                                </td>
                                <td className="td-custom text-sm lg:hidden">
                                    {p.method}
                                </td>
                                <td className="td-custom">
                                    <div
                                        className={`inline-block px-2 py-0.5 text-xs font-bold ${
                                            p.status === "received"
                                                ? "bg-green-1 text-n-1"
                                                : "bg-yellow-1 text-n-1"
                                        }`}
                                    >
                                        {p.status === "received"
                                            ? "Получен"
                                            : "Ожидается"}
                                    </div>
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
