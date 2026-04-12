import { Card, Text, Button } from "@gravity-ui/uikit";
import type { StudentPortalData } from "@/types/student-portal";

type PaymentTabProps = {
    data: StudentPortalData;
};

const PaymentTab = ({ data }: PaymentTabProps) => {
    const balanceColor =
        data.balance < 0
            ? "#D16B8F"
            : data.balance > 0
            ? "#22C55E"
            : undefined;

    const packagePercent = data.package
        ? Math.round((data.package.used / data.package.total) * 100)
        : 0;

    return (
        <>
            {/* Balance */}
            <Card view="outlined" style={{ marginBottom: 24, overflow: "hidden" }}>
                <div className="repeto-card-header">
                    <Text variant="subheader-2">Баланс</Text>
                </div>
                <div style={{ padding: 20 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                        <Text variant="body-1" color="secondary">Текущий баланс</Text>
                        <Text variant="header-1" style={{ color: balanceColor, fontWeight: 700 }}>
                            {data.balance.toLocaleString("ru-RU")} ₽
                        </Text>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                        <Text variant="body-1" color="secondary">Ставка</Text>
                        <Text variant="body-2" style={{ fontWeight: 600 }}>
                            {data.ratePerLesson.toLocaleString("ru-RU")} ₽ / занятие
                        </Text>
                    </div>
                    {data.package && (
                        <Card view="outlined" style={{ padding: 12, marginBottom: 16 }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                                <Text variant="caption-1" style={{ fontWeight: 600 }}>Пакет</Text>
                                <Text variant="caption-1" color="secondary">
                                    {data.package.used}/{data.package.total} занятий · до {data.package.validUntil}
                                </Text>
                            </div>
                            <div style={{ width: "100%", height: 8, borderRadius: 99, background: "var(--g-color-base-generic)", overflow: "hidden" }}>
                                <div
                                    style={{
                                        height: "100%",
                                        borderRadius: 99,
                                        width: `${packagePercent}%`,
                                        background: packagePercent > 75
                                            ? "var(--g-color-base-danger)"
                                            : packagePercent > 50
                                            ? "var(--g-color-base-brand)"
                                            : "var(--g-color-base-positive)",
                                        transition: "width 0.3s",
                                    }}
                                />
                            </div>
                        </Card>
                    )}
                    {data.balance < 0 && data.paymentUrl && (
                        <a href={data.paymentUrl} target="_blank" rel="noopener noreferrer" style={{ textDecoration: "none" }}>
                            <Button view="action" size="l" width="max">
                                Оплатить {Math.abs(data.balance).toLocaleString("ru-RU")} ₽
                            </Button>
                        </a>
                    )}
                    {data.balance < 0 && !data.paymentUrl && (
                        <Button view="action" size="l" width="max" disabled>
                            Оплатить {Math.abs(data.balance).toLocaleString("ru-RU")} ₽
                        </Button>
                    )}
                </div>
            </Card>

            {/* Payment history */}
            <Card view="outlined" style={{ overflow: "hidden" }}>
                <div className="repeto-card-header">
                    <Text variant="subheader-2">История оплат</Text>
                </div>
                <div style={{ padding: 20 }}>
                    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                        {data.recentPayments.map((p) => (
                            <div key={p.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "4px 0" }}>
                                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                    <Text variant="body-1" color="secondary" style={{ whiteSpace: "nowrap", flexShrink: 0 }}>{p.date}</Text>
                                    <Text variant="body-1">{p.method}</Text>
                                </div>
                                <Text variant="body-2" style={{ fontWeight: 600, color: "#22C55E" }}>
                                    +{p.amount.toLocaleString("ru-RU")} ₽
                                </Text>
                            </div>
                        ))}
                    </div>
                </div>
            </Card>
        </>
    );
};

export default PaymentTab;
