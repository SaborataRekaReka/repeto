import Link from "next/link";
import { useRouter } from "next/router";
import { Text, Card, Icon } from "@gravity-ui/uikit";
import { ChevronRight } from "@gravity-ui/icons";
import type { IconData } from "@gravity-ui/uikit";
import { useStudentBalances } from "@/hooks/usePayments";
import StudentNameWithBadge from "@/components/StudentNameWithBadge";

const formatRub = (value: number) => `${value.toLocaleString("ru-RU")}\u00A0₽`;

const BalanceTable = () => {
    const router = useRouter();
    const { data: balancesData, loading } = useStudentBalances();
    const studentBalances = balancesData?.data || [];

    return (
        <Card view="outlined" className="repeto-balance-table-card">
            <div className="repeto-card-header">
                <Text variant="subheader-2">Баланс учеников</Text>
                <Link
                    href="/finance/payments"
                    className="repeto-card-chevron"
                    aria-label="Все оплаты"
                >
                    <Icon data={ChevronRight as IconData} size={18} />
                </Link>
            </div>

            <div className="repeto-card-body repeto-balance-table-card__body">
                {loading ? (
                    <div className="repeto-balance-table-card__state">
                        <Text variant="body-1" color="secondary">Загрузка…</Text>
                    </div>
                ) : studentBalances.length === 0 ? (
                    <div className="repeto-balance-table-card__state">
                        <Text variant="body-1" color="secondary">Нет данных</Text>
                    </div>
                ) : (
                    <div className="repeto-balance-table-scroll">
                        <table className="repeto-balance-table">
                            <thead>
                                <tr>
                                    <th className="repeto-balance-table__th repeto-balance-table__th--left">Имя</th>
                                    <th className="repeto-balance-table__th">Занятий</th>
                                    <th className="repeto-balance-table__th">Сумма</th>
                                    <th className="repeto-balance-table__th">Оплачено</th>
                                    <th className="repeto-balance-table__th">Долг</th>
                                </tr>
                            </thead>
                            <tbody>
                                {studentBalances.map((s) => {
                                    const debtClass = s.debt > 0
                                        ? "repeto-balance-table__debt repeto-balance-table__debt--owed"
                                        : s.debt < 0
                                            ? "repeto-balance-table__debt repeto-balance-table__debt--credit"
                                            : "repeto-balance-table__debt repeto-balance-table__debt--none";
                                    const debtText = s.debt > 0
                                        ? formatRub(s.debt)
                                        : s.debt < 0
                                            ? `−${formatRub(Math.abs(s.debt))}`
                                            : "—";
                                    return (
                                        <tr
                                            key={s.studentId}
                                            className="repeto-balance-table__row"
                                            onClick={() => router.push(`/students/${s.studentId}`)}
                                        >
                                            <td className="repeto-balance-table__td repeto-balance-table__td--name">
                                                <div className="repeto-balance-table__name">
                                                    <StudentNameWithBadge
                                                        name={s.studentName}
                                                        hasRepetoAccount={Boolean(s.studentAccountId)}
                                                    />
                                                </div>
                                                <div className="repeto-balance-table__subject">{s.subject}</div>
                                            </td>
                                            <td className="repeto-balance-table__td repeto-balance-table__td--num">
                                                {s.lessonsCount}
                                            </td>
                                            <td className="repeto-balance-table__td repeto-balance-table__td--num">
                                                {formatRub(s.totalAmount)}
                                            </td>
                                            <td className="repeto-balance-table__td repeto-balance-table__td--num">
                                                {formatRub(s.paidAmount)}
                                            </td>
                                            <td className="repeto-balance-table__td repeto-balance-table__td--num">
                                                <span className={debtClass}>{debtText}</span>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </Card>
    );
};

export default BalanceTable;
