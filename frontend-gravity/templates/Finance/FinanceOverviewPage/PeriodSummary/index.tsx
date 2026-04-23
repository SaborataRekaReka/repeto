import { useState } from "react";
import { Text, Card } from "@gravity-ui/uikit";
import PillTabs from "@/components/PillTabs";
import { useFinanceSummary } from "@/hooks/usePayments";

const periodOptions = [
    { value: "month", label: "Месяц" },
    { value: "quarter", label: "Квартал" },
    { value: "year", label: "Год" },
];

type MetricItem = { label: string; value: string };
type SummaryData = {
    completedLessons: number;
    cancelledLessons: number;
    cancellationRate: number;
    avgRate: number;
    paymentsCount: number;
    avgPayment: number;
};

function formatCurrencyMetric(value: number): string {
    return `${value.toLocaleString("ru-RU")} ₽`;
}

function buildMetrics(data: SummaryData): MetricItem[] {
    return [
        { label: "Уроков", value: String(data.completedLessons) },
        { label: "Ср. ставка", value: formatCurrencyMetric(data.avgRate) },
        { label: "Платежей", value: String(data.paymentsCount) },
        { label: "Ср. платёж", value: formatCurrencyMetric(data.avgPayment) },
    ];
}

const emptyData = {
    completedLessons: 0,
    cancelledLessons: 0,
    cancellationRate: 0,
    avgRate: 0,
    paymentsCount: 0,
    avgPayment: 0,
};

const PeriodSummary = () => {
    const [period, setPeriod] = useState("month");
    const { data, loading } = useFinanceSummary(period as "month" | "quarter" | "year");
    const summaryData = data || emptyData;
    const items = buildMetrics(summaryData);

    return (
        <div className="repeto-finance-summary" style={{ height: "100%", display: "flex", flexDirection: "column" }}>
            <div
                className="repeto-finance-summary-header"
                style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    marginBottom: 8,
                    flexShrink: 0,
                }}
            >
                <Text variant="subheader-2">Сводка</Text>
                <div className="repeto-finance-summary-period">
                    <PillTabs size="s" value={period} onChange={setPeriod} options={periodOptions} ariaLabel="Период" />
                </div>
            </div>

            {loading ? (
                <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <Text color="secondary">Загрузка...</Text>
                </div>
            ) : (
                <div className="repeto-finance-summary-metrics" style={{ flex: 1 }}>
                    {items.map((item, index) => (
                        <Card
                            key={item.label}
                            view="outlined"
                            className="repeto-finance-summary-metric"
                            style={{
                                padding: "10px 12px",
                                minHeight: 92,
                                display: "flex",
                                flexDirection: "column",
                                justifyContent: "space-between",
                                background: "var(--g-color-base-float)",
                                borderTop: `3px solid ${
                                    index === 0
                                        ? "#8E7BFF"
                                        : index === 1
                                        ? "#73D8A8"
                                        : index === 2
                                        ? "#C6A6FF"
                                        : "#AE7AFF"
                                }`,
                            }}
                        >
                            <Text
                                variant="body-2"
                                className="repeto-finance-summary-metric-label"
                                color="secondary"
                                style={{ display: "block", marginBottom: 2, lineHeight: 1.25 }}
                            >
                                {item.label}
                            </Text>
                            <Text
                                variant="header-1"
                                className="repeto-finance-summary-metric-value"
                                style={{
                                    display: "block",
                                    fontVariantNumeric: "tabular-nums",
                                    whiteSpace: "nowrap",
                                    lineHeight: 1,
                                }}
                            >
                                {item.value}
                            </Text>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
};

export default PeriodSummary;