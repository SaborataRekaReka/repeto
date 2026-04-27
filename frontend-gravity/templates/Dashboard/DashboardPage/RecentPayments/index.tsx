import Link from "next/link";
import { useMemo } from "react";
import { Card, Text, Loader, Icon } from "@gravity-ui/uikit";
import type { IconData } from "@gravity-ui/uikit";
import { ChevronRight, CreditCard } from "@gravity-ui/icons";
import { useRecentPayments } from "@/hooks/useDashboard";
import { useStudentBalances } from "@/hooks/usePayments";
import StudentNameWithBadge from "@/components/StudentNameWithBadge";

const METHOD_LABEL: Record<string, string> = {
    cash: "Наличные",
    card: "Карта",
    transfer: "Перевод",
    sbp: "СБП",
    online: "Онлайн",
};

const formatMethod = (method: string) =>
    METHOD_LABEL[method?.toLowerCase?.() ?? ""] || method || "Оплата";

const formatAmount = (amount: number) =>
    `${amount.toLocaleString("ru-RU")}\u00A0₽`;

const normalizeKey = (value?: string) =>
    value?.trim().toLocaleLowerCase("ru-RU") || "";

const RecentPayments = () => {
    const { data: recentPayments = [], loading } = useRecentPayments();
    const { data: balancesData } = useStudentBalances({ limit: 500 });

    const balanceByStudentId = useMemo(() => {
        const map = new Map<string, number>();
        for (const row of balancesData?.data || []) {
            if (row.studentId) {
                map.set(row.studentId, row.debt);
            }
        }
        return map;
    }, [balancesData?.data]);

    const balanceByStudentName = useMemo(() => {
        const map = new Map<string, number>();
        for (const row of balancesData?.data || []) {
            const key = normalizeKey(row.studentName);
            if (key && !map.has(key)) {
                map.set(key, row.debt);
            }
        }
        return map;
    }, [balancesData?.data]);

    return (
        <Card className="repeto-recent-payments-card" view="outlined" style={{ overflow: "hidden" }}>
            <div className="repeto-card-header">
                <Text variant="subheader-2">Последние оплаты</Text>
                <Link
                    href="/finance/payments"
                    className="repeto-card-chevron"
                    aria-label="Все оплаты"
                >
                    <Icon data={ChevronRight as IconData} size={18} />
                </Link>
            </div>
            {loading ? (
                <div className="repeto-card-body repeto-recent-payments__state">
                    <Loader size="s" />
                </div>
            ) : recentPayments.length === 0 ? (
                <div className="repeto-card-body repeto-recent-payments__state">
                    <Text variant="body-1" color="secondary">
                        Пока оплат не было
                    </Text>
                </div>
            ) : (
                <div className="repeto-card-body repeto-recent-payments__body">
                    <div className="repeto-portal-balance-operations__list repeto-recent-payments-ops">
                        {recentPayments.map((payment) => {
                            const isPending = payment.status !== "received";
                            const debt = payment.studentId
                                ? balanceByStudentId.get(payment.studentId)
                                : balanceByStudentName.get(normalizeKey(payment.studentName));
                            const hasDebt = typeof debt === "number" && debt !== 0;
                            const debtTone = debt && debt > 0 ? "owed" : "credit";
                            const debtLabel = debt && debt > 0
                                ? `Долг ${formatAmount(debt)}`
                                : `Переплата ${formatAmount(Math.abs(debt || 0))}`;

                            return (
                                <div
                                    key={payment.id}
                                    className="repeto-portal-balance-operation-row"
                                >
                                    <span className="repeto-portal-balance-operation-row__icon repeto-portal-balance-operation-row__icon--payment">
                                        <Icon data={CreditCard as IconData} size={18} />
                                    </span>

                                    <div className="repeto-portal-balance-operation-row__copy">
                                        <div className="repeto-portal-balance-operation-row__title">
                                            <StudentNameWithBadge
                                                name={payment.studentName}
                                                hasRepetoAccount={Boolean(payment.studentAccountId)}
                                                truncate
                                            />
                                        </div>
                                        <div className="repeto-portal-balance-operation-row__subtitle">
                                            {payment.date}
                                            {" · "}
                                            {formatMethod(payment.method)}
                                            {isPending && (
                                                <>
                                                    {" · "}
                                                    <span className="repeto-recent-payments-ops__pending">
                                                        Ожидает
                                                    </span>
                                                </>
                                            )}
                                        </div>
                                        {hasDebt && (
                                            <div className="repeto-recent-payments-ops__balance">
                                                <span>Текущий баланс:</span>
                                                <span
                                                    className={`repeto-recent-payments-ops__balance-value repeto-recent-payments-ops__balance-value--${debtTone}`}
                                                >
                                                    {debtLabel}
                                                </span>
                                            </div>
                                        )}
                                    </div>

                                    <div
                                        className={`repeto-portal-balance-operation-row__amount repeto-portal-balance-operation-row__amount--${
                                            isPending ? "debit" : "credit"
                                        }`}
                                    >
                                        {isPending ? "" : "+"}
                                        {formatAmount(payment.amount)}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}
        </Card>
    );
};

export default RecentPayments;
