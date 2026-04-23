import { useState } from "react";
import { Card, Text, Loader } from "@gravity-ui/uikit";
import { useConversion } from "@/hooks/useDashboard";
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

    // Один цвет прогресс-бара вне зависимости от значения — светофор
    // (зелёный/фиолетовый/розовый в зависимости от pct) создавал ощущение
    // «меняющегося статуса» там, где цифра уже сама по себе всё рассказывает.
    const barColor = "var(--g-color-text-primary)";

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
                                        color: balance > 0
                                            ? "var(--g-color-text-positive)"
                                            : "var(--g-color-text-danger)",
                                        background: "transparent",
                                        padding: 0,
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
                                    <span style={{ width: 8, height: 8, borderRadius: 2, background: "var(--g-color-text-primary)", flexShrink: 0 }} />
                                    <Text variant="body-1" color="secondary">Проведено</Text>
                                </div>
                                <Text variant="body-1" className="repeto-conversion-card__stat-value repeto-dashboard-inline-value">
                                    {lessons} зан. · {earned.toLocaleString("ru-RU")} ₽
                                </Text>
                            </div>
                            <div className="repeto-conversion-card__stat-row">
                                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                    <span style={{ width: 8, height: 8, borderRadius: 2, background: "var(--g-color-base-brand-light, #EEE9FF)", border: "1px solid var(--g-color-line-generic)", flexShrink: 0 }} />
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
