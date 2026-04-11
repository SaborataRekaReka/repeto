import { useState, useMemo } from "react";
import { Card, Text, Loader } from "@gravity-ui/uikit";
import { useIncomeChart } from "@/hooks/useDashboard";

const periodLabels = ["Месяц", "Квартал", "Год"] as const;
const periodMap: Record<string, "month" | "quarter" | "year"> = {
    Месяц: "month",
    Квартал: "quarter",
    Год: "year",
};

const IncomeChart = () => {
    const [selectedPeriod, setSelectedPeriod] = useState<string>("Месяц");
    const { data: incomeChartData = [], loading } = useIncomeChart(
        periodMap[selectedPeriod] || "month"
    );

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
                <div className="repeto-income-card__periods">
                    {periodLabels.map((label) => (
                        <button
                            type="button"
                            key={label}
                            className={`repeto-income-card__period-tab ${selectedPeriod === label ? "repeto-income-card__period-tab--active" : ""}`}
                            onClick={() => setSelectedPeriod(label)}
                        >
                            {label}
                        </button>
                    ))}
                </div>
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
                                        background: "#98E9AB",
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
                                        background: "#AE7AFF",
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
                                    <span className="repeto-income-card__amount-value">{received.toLocaleString("ru-RU")} ₽</span>
                                </div>
                            )}
                            {expected > 0 && (
                                <div className="repeto-income-card__amount-line">
                                    <span className="repeto-income-card__amount-label">Запланировано:</span>{" "}
                                    <span className="repeto-income-card__amount-value">{expected.toLocaleString("ru-RU")} ₽</span>
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
                            <div className="repeto-income-card__total-value">{total.toLocaleString("ru-RU")} ₽</div>
                        </div>
                    </>
                )}
            </div>
        </Card>
    );
};

export default IncomeChart;
