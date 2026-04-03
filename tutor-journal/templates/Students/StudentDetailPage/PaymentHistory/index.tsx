import Icon from "@/components/Icon";
import type { Payment } from "@/types/finance";
import { getMethodLabel, getStatusLabel, getStatusColor } from "@/mocks/finance-tutor";

type PaymentHistoryProps = {
    payments: Payment[];
};

const PaymentHistory = ({ payments }: PaymentHistoryProps) => {
    const totalPaid = payments
        .filter((p) => p.status === "paid")
        .reduce((sum, p) => sum + p.amount, 0);
    const totalDebt = payments
        .filter((p) => p.status === "overdue" || p.status === "pending")
        .reduce((sum, p) => sum + p.amount, 0);

    return (
        <div className="card">
            <div className="card-title">Оплаты</div>
            {payments.length === 0 ? (
                <div className="px-5 py-8 text-center text-sm text-n-3 dark:text-white/50">
                    Оплат пока нет
                </div>
            ) : (
                <>
                    <table className="table-custom -mt-0.25 border-none">
                        <thead>
                            <tr>
                                <th className="th-custom">Дата</th>
                                <th className="th-custom">Сумма</th>
                                <th className="th-custom lg:hidden">Способ</th>
                                <th className="th-custom">Статус</th>
                            </tr>
                        </thead>
                        <tbody>
                            {payments.map((payment) => (
                                <tr key={payment.id}>
                                    <td className="td-custom text-sm font-bold">
                                        {payment.date}
                                    </td>
                                    <td className="td-custom text-sm font-bold">
                                        {payment.amount.toLocaleString("ru-RU")} ₽
                                    </td>
                                    <td className="td-custom text-sm lg:hidden">
                                        {getMethodLabel(payment.method)}
                                    </td>
                                    <td className="td-custom">
                                        <span
                                            className={`px-2 py-0.5 text-xs font-bold ${getStatusColor(
                                                payment.status
                                            )}`}
                                        >
                                            {getStatusLabel(payment.status)}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    <div className="flex items-center justify-between px-5 py-4 border-t border-n-1 text-sm dark:border-white">
                        <span>
                            Оплачено:{" "}
                            <span className="font-bold text-green-1">
                                {totalPaid.toLocaleString("ru-RU")} ₽
                            </span>
                        </span>
                        {totalDebt > 0 && (
                            <span>
                                Задолженность:{" "}
                                <span className="font-bold text-pink-1">
                                    {totalDebt.toLocaleString("ru-RU")} ₽
                                </span>
                            </span>
                        )}
                    </div>
                </>
            )}
        </div>
    );
};

export default PaymentHistory;
