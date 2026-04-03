import Link from "next/link";
import { studentBalances } from "@/mocks/finance-tutor";

const BalanceTable = () => (
    <div className="card mt-5">
        <div className="card-head">
            <div className="text-h6">Баланс учеников</div>
            <Link
                href="/finance/payments"
                className="btn-stroke btn-small ml-auto"
            >
                Все оплаты
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
                        <tr key={s.studentId}>
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
                    className="px-5 py-3 border-t border-n-1 first:border-none dark:border-white"
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

export default BalanceTable;
