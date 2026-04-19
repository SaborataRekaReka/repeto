import Link from "next/link";
import { Card, Text, Label, Loader } from "@gravity-ui/uikit";
import { useRecentPayments } from "@/hooks/useDashboard";
import StudentNameWithBadge from "@/components/StudentNameWithBadge";

const getStatusLabel = (status: string) =>
    status === "received" ? "Получен" : "Ожидается";

const getStatusTheme = (status: string): "success" | "normal" =>
    status === "received" ? "success" : "normal";

const formatAmount = (amount: number) => `+${amount.toLocaleString("ru-RU")}\u00A0₽`;

const RecentPayments = () => {
    const { data: recentPayments = [], loading } = useRecentPayments();

    const renderStatus = (status: string) => (
        <Label theme={getStatusTheme(status)} size="xs">
            {getStatusLabel(status)}
        </Label>
    );

    return (
        <Card className="repeto-recent-payments-card" view="outlined" style={{ overflow: "hidden" }}>
            <div className="repeto-card-header">
                <Text variant="subheader-2">Последние оплаты</Text>
                <Link
                    href="/payments"
                    className="repeto-card-link"
                >
                    Все →
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
                    <div className="repeto-recent-payments-feed">
                        {recentPayments.map((payment) => (
                            <div key={payment.id} className="repeto-recent-payments-feed__item">
                                <div className="repeto-recent-payments-feed__head">
                                    <Text variant="body-2" className="repeto-dashboard-entity-name" ellipsis>
                                        <StudentNameWithBadge
                                            name={payment.studentName}
                                            hasRepetoAccount={Boolean(payment.studentAccountId)}
                                            truncate
                                        />
                                    </Text>
                                    <span className="repeto-dashboard-amount-pill">
                                        {formatAmount(payment.amount)}
                                    </span>
                                </div>
                                <div className="repeto-recent-payments-feed__meta">
                                    <Text variant="caption-1" color="secondary">
                                        {payment.date}
                                    </Text>
                                    <span className="repeto-recent-payments-feed__separator" />
                                    <Text variant="caption-1" color="secondary">
                                        {payment.method}
                                    </Text>
                                    {renderStatus(payment.status)}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </Card>
    );
};

export default RecentPayments;
