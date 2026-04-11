import Link from "next/link";
import { Card, Text, Label, Loader } from "@gravity-ui/uikit";
import { useRecentPayments } from "@/hooks/useDashboard";

const getStatusLabel = (status: string) =>
    status === "received" ? "Получен" : "Ожидается";

const getStatusTheme = (status: string): "success" | "normal" =>
    status === "received" ? "success" : "normal";

const formatAmount = (amount: number) => `+${amount.toLocaleString("ru-RU")}\u00A0₽`;

const RecentPayments = () => {
    const { data: recentPayments = [], loading } = useRecentPayments();

    return (
        <Card view="outlined" style={{ overflow: "hidden" }}>
            <div className="repeto-card-header">
                <Text variant="subheader-2">Последние оплаты</Text>
                <Link
                    href="/payments"
                    style={{
                        fontSize: 13,
                        fontWeight: 600,
                        color: "var(--g-color-text-brand)",
                        textDecoration: "none",
                    }}
                >
                    Все →
                </Link>
            </div>
            {loading ? (
                <div style={{ padding: "32px 0", textAlign: "center" }}>
                    <Loader size="s" />
                </div>
            ) : recentPayments.length === 0 ? (
                <div style={{ padding: "32px 20px", textAlign: "center" }}>
                    <Text variant="body-1" color="secondary">
                        Пока оплат не было
                    </Text>
                </div>
            ) : (
                <div style={{ overflowX: "auto" }}>
                    <table
                        className="repeto-table"
                        style={{ width: "100%", minWidth: 620, borderCollapse: "collapse" }}
                    >
                        <thead>
                            <tr>
                                <th>Дата</th>
                                <th>Ученик</th>
                                <th style={{ textAlign: "right" }}>Сумма</th>
                                <th>Способ</th>
                                <th>Статус</th>
                            </tr>
                        </thead>
                        <tbody>
                            {recentPayments.map((p) => (
                                <tr key={p.id}>
                                    <td>
                                        <Text variant="body-1" color="secondary">{p.date}</Text>
                                    </td>
                                    <td>
                                        <Text variant="body-2">
                                            {p.studentName}
                                        </Text>
                                    </td>
                                    <td style={{ textAlign: "right" }}>
                                        <span
                                            style={{
                                                display: "inline-flex",
                                                alignItems: "center",
                                                gap: 4,
                                                fontWeight: 700,
                                                fontSize: 14,
                                                color: "#22C55E",
                                                background: "rgba(34,197,94,0.08)",
                                                padding: "2px 10px",
                                                borderRadius: 99,
                                                whiteSpace: "nowrap",
                                            }}
                                        >
                                            {formatAmount(p.amount)}
                                        </span>
                                    </td>
                                    <td>
                                        <Text variant="body-1" color="secondary">
                                            {p.method}
                                        </Text>
                                    </td>
                                    <td>
                                        <Label
                                            theme={getStatusTheme(p.status)}
                                            size="xs"
                                        >
                                            {getStatusLabel(p.status)}
                                        </Label>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </Card>
    );
};

export default RecentPayments;
