import Link from "next/link";
import { useState } from "react";
import { Text, Card, SegmentedRadioGroup } from "@gravity-ui/uikit";
import { useFinanceSummary } from "@/hooks/usePayments";

const periodOptions = [
    { value: "month", content: "Месяц" },
    { value: "quarter", content: "Квартал" },
    { value: "year", content: "Год" },
];

type MetricItem = { label: string; value: string; muted?: boolean };
type SummaryData = {
    completedLessons: number;
    cancelledLessons: number;
    cancellationRate: number;
    avgRate: number;
    paymentsCount: number;
    avgPayment: number;
};

function buildMetrics(data: SummaryData): MetricItem[] {
    return [
        { label: "Уроков", value: String(data.completedLessons) },
        { label: "Ср. ставка", value: `${data.avgRate.toLocaleString("ru-RU")} ₽` },
        { label: "Платежей", value: String(data.paymentsCount) },
        { label: "Ср. платёж", value: `${data.avgPayment.toLocaleString("ru-RU")} ₽` },
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

const CancellationWidget = ({
    cancellationRate,
    cancelledLessons,
}: Pick<SummaryData, "cancellationRate" | "cancelledLessons">) => {
    const clampedRate = Math.max(0, Math.min(100, cancellationRate));
    const zoneColor =
        clampedRate <= 12 ? "#73D8A8" : clampedRate <= 22 ? "#AE7AFF" : "#D16B8F";

    // viewBox 240x140: arc r=80 cx=120 cy=90, text at y≈82 and y≈108 — всё внутри
    const r = 80;
    const cx = 120;
    const cy = 90;
    const circumference = Math.PI * r;
    const dashOffset = circumference * (1 - clampedRate / 100);

    return (
        <Card
            view="outlined"
            className="repeto-finance-cancel-card"
            style={{
                padding: "10px 14px 10px",
                height: "100%",
                display: "flex",
                flexDirection: "column",
                background: "var(--g-color-base-float)",
                boxSizing: "border-box",
            }}
        >
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 6, flexShrink: 0 }}>
                <div>
                    <Text variant="body-2" color="secondary" style={{ display: "block", marginBottom: 2 }}>
                        Отмены
                    </Text>
                    <Text variant="subheader-2" style={{ display: "block" }}>
                        {cancelledLessons.toLocaleString("ru-RU")}
                    </Text>
                </div>
                <Link
                    href="/schedule"
                    style={{ fontSize: 13, color: "var(--g-color-text-brand)", textDecoration: "none" }}
                >
                    Перейти →
                </Link>
            </div>

            <div style={{ flex: 1, minHeight: 80, overflow: "hidden", display: "flex", alignItems: "center" }}>
                <svg
                    viewBox="0 0 240 140"
                    width="100%"
                    height="100%"
                    preserveAspectRatio="xMidYMid meet"
                    role="img"
                    aria-label={`Процент отмен ${clampedRate}%`}
                >
                    {/* Трек */}
                    <path
                        d={`M ${cx - r},${cy} A ${r},${r} 0 0,1 ${cx + r},${cy}`}
                        fill="none"
                        stroke="var(--g-color-line-generic)"
                        strokeWidth="12"
                        strokeLinecap="round"
                        opacity="0.4"
                    />
                    {/* Прогресс */}
                    <path
                        d={`M ${cx - r},${cy} A ${r},${r} 0 0,1 ${cx + r},${cy}`}
                        fill="none"
                        stroke={zoneColor}
                        strokeWidth="12"
                        strokeLinecap="round"
                        strokeDasharray={circumference}
                        strokeDashoffset={dashOffset}
                        style={{ transition: "stroke-dashoffset 0.5s ease" }}
                    />
                    <text
                        x={cx}
                        y={cy - 4}
                        textAnchor="middle"
                        dominantBaseline="auto"
                        style={{ fontSize: 32, fontWeight: 700, fill: "var(--g-color-text-primary)", fontFamily: "inherit" }}
                    >
                        {clampedRate}%
                    </text>
                    <text
                        x={cx}
                        y={cy + 20}
                        textAnchor="middle"
                        dominantBaseline="auto"
                        style={{ fontSize: 12, fill: "var(--g-color-text-secondary)", fontFamily: "inherit" }}
                    >
                        Процент отмен
                    </text>
                </svg>
            </div>
        </Card>
    );
};

const PeriodSummary = () => {
    const [period, setPeriod] = useState("month");
    const { data, loading } = useFinanceSummary(period as "month" | "quarter" | "year");
    const summaryData = data || emptyData;
    const items = buildMetrics(summaryData);

    return (
        <div style={{ height: "100%", display: "flex", flexDirection: "column" }}>
            <div style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: 8,
                flexShrink: 0,
            }}>
                <Text variant="subheader-2">Сводка</Text>
                <SegmentedRadioGroup size="s" value={period} onUpdate={setPeriod} options={periodOptions} />
            </div>

            {loading ? (
                <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <Text color="secondary">Загрузка…</Text>
                </div>
            ) : (
                <div className="repeto-finance-summary-grid" style={{ flex: 1 }}>
                    <div className="repeto-finance-summary-metrics">
                        {items.map((item, index) => (
                            <Card
                                key={item.label}
                                view="outlined"
                                className="repeto-finance-summary-metric"
                                style={{
                                    padding: "8px 10px",
                                    minHeight: 76,
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
                                    color="secondary"
                                    style={{ display: "block", marginBottom: 2 }}
                                >
                                    {item.label}
                                </Text>
                                <Text
                                    variant="header-2"
                                    style={{ color: item.muted ? "var(--g-color-text-secondary)" : undefined }}
                                >
                                    {item.value}
                                </Text>
                            </Card>
                        ))}
                    </div>
                    <CancellationWidget
                        cancellationRate={summaryData.cancellationRate}
                        cancelledLessons={summaryData.cancelledLessons}
                    />
                </div>
            )}
        </div>
    );
};

export default PeriodSummary;
