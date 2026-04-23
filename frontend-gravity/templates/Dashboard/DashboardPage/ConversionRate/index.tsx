import { useState } from "react";
import { Card, Text, Loader } from "@gravity-ui/uikit";
import { useConversion } from "@/hooks/useDashboard";
import { accent, brand, semantic } from "@/constants/brand";
import PillTabs from "@/components/PillTabs";

type ConversionPeriod = "month" | "quarter" | "year";

const periodOptions = [
    { value: "month" as const, label: "Месяц" },
    { value: "quarter" as const, label: "Квартал" },
    { value: "year" as const, label: "Год" },
];

const ConversionRate = () => {
    const [period, setPeriod] = useState<ConversionPeriod>("month");
    const { data, loading } = useConversion(period);

    const pct = Math.min(100, Math.max(0, Math.round(data?.conversionPct ?? 0)));
    const earned = data?.earned ?? 0;
    const paid = data?.paid ?? 0;
    const balance = paid - earned;
    const lessons = data?.completedLessons ?? 0;
    const payments = data?.paymentsCount ?? 0;

    const barColor = pct >= 80 ? accent[500] : pct >= 50 ? brand[400] : semantic.danger;

    return (
        <Card view="outlined" style={{ overflow: "hidden", background: "var(--g-color-base-float)" }}>
            <div className="repeto-card-header repeto-conversion-card__header">
                <Text variant="subheader-2">Конверсия в оплату</Text>
                <PillTabs
                    size="s"
                    value={period}
                    onChange={(value) => setPeriod(value)}
                    options={periodOptions}
                />
            </div>
            <div className="repeto-card-body">
                {loading ? (
                    <div style={{ padding: "16px 0", textAlign: "center" }}>
                        <Loader size="s" />
                    </div>
                ) : (
                    <div className="repeto-conversion-card__content">
                        {/* Hero percentage */}
                        <div className="repeto-conversion-card__hero">
                            <span className="repeto-conversion-card__pct repeto-dashboard-primary-value repeto-dashboard-primary-value--hero">
                                {pct}%
                            </span>
                            {balance !== 0 && (
                                <span
                                    className="repeto-conversion-card__delta"
                                    style={{
                                        color: balance > 0 ? accent[600] : semantic.danger,
                                        background: balance > 0 ? accent[100] : "rgba(209,107,143,0.12)",
                                    }}
                                >
                                    {balance > 0 ? "+" : "−"}{Math.abs(balance).toLocaleString("ru-RU")} ₽
                                </span>
                            )}
                        </div>

                        {/* Progress bar */}
                        <div>
                            <div
                                style={{
                                    height: 6,
                                    borderRadius: 3,
                                    background: "var(--g-color-base-generic)",
                                    overflow: "hidden",
                                }}
                            >
                                <div
                                    style={{
                                        width: `${pct}%`,
                                        height: "100%",
                                        borderRadius: 3,
                                        background: barColor,
                                        transition: "width 0.4s ease",
                                    }}
                                />
                            </div>
                            <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6 }}>
                                <Text variant="caption-2" color="hint">0%</Text>
                                <Text variant="caption-2" color="hint">100%</Text>
                            </div>
                        </div>

                        {/* Stats rows */}
                        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                            <div className="repeto-conversion-card__stat-row">
                                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                    <span style={{ width: 8, height: 8, borderRadius: "50%", background: brand[400], flexShrink: 0 }} />
                                    <Text variant="body-1" color="secondary">Проведено</Text>
                                </div>
                                <Text variant="body-1" className="repeto-conversion-card__stat-value repeto-dashboard-inline-value">
                                    {lessons} зан. · {earned.toLocaleString("ru-RU")} ₽
                                </Text>
                            </div>
                            <div className="repeto-conversion-card__stat-row">
                                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                    <span style={{ width: 8, height: 8, borderRadius: "50%", background: barColor, flexShrink: 0 }} />
                                    <Text variant="body-1" color="secondary">Оплачено</Text>
                                </div>
                                <Text variant="body-1" className="repeto-conversion-card__stat-value repeto-dashboard-inline-value">
                                    {payments} плат. · {paid.toLocaleString("ru-RU")} ₽
                                </Text>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </Card>
    );
};

export default ConversionRate;
