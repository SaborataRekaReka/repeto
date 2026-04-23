import { useState, useMemo } from "react";
import { Card, Text, Loader } from "@gravity-ui/uikit";
import PillTabs from "@/components/PillTabs";
import { useIncomeChart } from "@/hooks/useDashboard";
import { accent, brand } from "@/constants/brand";

const periodOptions = [
    { value: "month", label: "Месяц" },
    { value: "quarter", label: "Квартал" },
    { value: "year", label: "Год" },
] as const;

type PeriodValue = (typeof periodOptions)[number]["value"];

const IncomeChart = () => {
    const [selectedPeriod, setSelectedPeriod] = useState<PeriodValue>("month");
    const { data: incomeChartData = [], loading } = useIncomeChart(selectedPeriod);

    const received = useMemo(
        () => incomeChartData.reduce((s, w) => s + (w.received || 0), 0),
        [incomeChartData]
    );
    const expected = useMemo(
        () => incomeChartData.reduce((s, w) => s + (w.expected || 0), 0),
        [incomeChartData]
    );
    const total = received + expected;
    const receivedPct = total > 0 ? (received / total) * 100 : 0;
    const expectedPct = total > 0 ? (expected / total) * 100 : 0;

    return (
        <Card className="repeto-income-card" view="outlined" style={{ background: "var(--g-color-base-float)" }}>
            <div className="repeto-card-header repeto-income-card__header">
                <Text variant="subheader-2">Доход</Text>
                <PillTabs
                    size="s"
                    value={selectedPeriod}
                    onChange={(value) => setSelectedPeriod(value as PeriodValue)}
                    options={periodOptions as unknown as Array<{ value: string; label: string }>}
                    ariaLabel="Период"
                />
            </div>
            <div className="repeto-card-body">
                {loading ? (
                    <div style={{ padding: "32px 0", textAlign: "center" }}>
                        <Loader size="s" />
                    </div>
                ) : (
                    <>
                        {/* Legend */}
                        <div className="repeto-income-card__legend">
                            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                                <span
                                    style={{
                                        width: 8,
                                        height: 8,
                                        borderRadius: "50%",
                                        background: accent[300],
                                    }}
                                />
                                <Text variant="body-1" color="secondary">Получено</Text>
                            </div>
                            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                                <span
                                    style={{
                                        width: 8,
                                        height: 8,
                                        borderRadius: "50%",
                                        background: brand[400],
                                    }}
                                />
                                <Text variant="body-1" color="secondary">Запланировано</Text>
                            </div>
                        </div>

                        {/* Single stacked bar */}
                        <div className="repeto-income-card__bar">
                            {received > 0 && (
                                <div
                                    className="repeto-income-card__bar-part repeto-income-card__bar-part--received"
                                    style={{
                                        flexBasis: `${receivedPct}%`,
                                    }}
                                />
                            )}
                            {expected > 0 && (
                                <div
                                    className="repeto-income-card__bar-part repeto-income-card__bar-part--expected"
                                    style={{
                                        flexBasis: `${expectedPct}%`,
                                    }}
                                />
                            )}
                        </div>

                        {/* Amounts */}
                        <div className="repeto-income-card__amounts">
                            {received > 0 && (
                                <div className="repeto-income-card__amount-line">
                                    <span className="repeto-income-card__amount-label">Получено:</span>{" "}
                                    <span className="repeto-income-card__amount-value repeto-dashboard-inline-value">{received.toLocaleString("ru-RU")} ₽</span>
                                </div>
                            )}
                            {expected > 0 && (
                                <div className="repeto-income-card__amount-line">
                                    <span className="repeto-income-card__amount-label">Запланировано:</span>{" "}
                                    <span className="repeto-income-card__amount-value repeto-dashboard-inline-value">{expected.toLocaleString("ru-RU")} ₽</span>
                                </div>
                            )}
                        </div>

                        {/* Total */}
                        <div
                            className="repeto-income-card__total"
                        >
                            <Text variant="body-1" color="secondary">
                                Итого за период
                            </Text>
                            <div className="repeto-income-card__total-value repeto-dashboard-primary-value repeto-dashboard-primary-value--section">{total.toLocaleString("ru-RU")} ₽</div>
                        </div>
                    </>
                )}
            </div>
        </Card>
    );
};

export default IncomeChart;
