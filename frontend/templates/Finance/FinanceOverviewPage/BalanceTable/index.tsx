import Link from "next/link";
import { useRouter } from "next/router";
import { useStudentBalances } from "@/hooks/usePayments";

const BalanceTable = () => {
    const router = useRouter();
    const { data: balancesData, loading } = useStudentBalances();
    const studentBalances = balancesData?.data || [];
    return (
    <div className="card mt-5">
        <div className="card-head">
            <div className="text-h6">Баланс учеников</div>
            <Link
                href="/finance/payments"
                className="text-xs font-bold transition-colors hover:text-purple-1"
            >
                Все →
            </Link>
        </div>
        {/* desktop */}
        <div className="md:hidden">
            <table className="table-custom">
                <thead>
                    <tr>
                        <th className="th-custom">Имя</th>
                        <th className="th-custom text-right">Занятий</th>
                        <th className="th-custom text-right">Сумма</th>
                        <th className="th-custom text-right">Оплачено</th>
                        <th className="th-custom text-right">Долг</th>
                    </tr>
                </thead>
                <tbody>
                    {studentBalances.map((s) => (
                        <tr
                            key={s.studentId}
                            className="cursor-pointer hover:bg-n-3/10 transition-colors dark:hover:bg-white/5"
                            onClick={() => router.push(`/students/${s.studentId}`)}
                        >
                            <td className="td-custom">
                                <div className="font-semibold">
                                    {s.studentName}
                                </div>
                                <div className="text-xs text-n-3 dark:text-white/50">
                                    {s.subject}
                                </div>
                            </td>
                            <td className="td-custom text-right">
                                {s.lessonsCount}
                            </td>
                            <td className="td-custom text-right">
                                {s.totalAmount.toLocaleString("ru-RU")} ₽
                            </td>
                            <td className="td-custom text-right">
                                {s.paidAmount.toLocaleString("ru-RU")} ₽
                            </td>
                            <td
                                className={`td-custom text-right font-semibold ${
                                    s.debt > 0
                                        ? "text-pink-1"
                                        : s.debt < 0
                                        ? "text-green-1"
                                        : ""
                                }`}
                            >
                                {s.debt > 0
                                    ? `${s.debt.toLocaleString("ru-RU")} ₽`
                                    : s.debt < 0
                                    ? `−${Math.abs(s.debt).toLocaleString(
                                          "ru-RU"
                                      )} ₽`
                                    : "—"}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
        {/* mobile */}
        <div className="hidden md:block">
            {studentBalances.map((s) => (
                <div
                    key={s.studentId}
                    className="px-5 py-3 border-t border-n-1 first:border-none dark:border-white cursor-pointer hover:bg-n-3/10 transition-colors dark:hover:bg-white/5"
                    onClick={() => router.push(`/students/${s.studentId}`)}
                >
                    <div className="flex items-center justify-between mb-1">
                        <span className="font-semibold">{s.studentName}</span>
                        <span
                            className={`text-sm font-semibold ${
                                s.debt > 0
                                    ? "text-pink-1"
                                    : s.debt < 0
                                    ? "text-green-1"
                                    : ""
                            }`}
                        >
                            {s.debt > 0
                                ? `${s.debt.toLocaleString("ru-RU")} ₽`
                                : s.debt < 0
                                ? `−${Math.abs(s.debt).toLocaleString(
                                      "ru-RU"
                                  )} ₽`
                                : "—"}
                        </span>
                    </div>
                    <div className="text-xs text-n-3 dark:text-white/50">
                        {s.subject} · {s.lessonsCount} зан. ·{" "}
                        {s.paidAmount.toLocaleString("ru-RU")} /{" "}
                        {s.totalAmount.toLocaleString("ru-RU")} ₽
                    </div>
                </div>
            ))}
        </div>
    </div>
    );
};

export default BalanceTable;
