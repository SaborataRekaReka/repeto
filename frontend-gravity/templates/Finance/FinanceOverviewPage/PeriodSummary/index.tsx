import { useFinanceStats, useFinanceSummary } from "@/hooks/usePayments";

type MetricItem = { label: string; value: string };
type SegmentTone = "cancelled" | "received" | "planned" | "debt";
type SegmentItem = {
    key: string;
    label: string;
    amount: number;
    tone: SegmentTone;
};

type SummaryData = {
    completedLessons: number;
    cancelledLessons: number;
    cancellationRate: number;
    avgRate: number;
    paymentsCount: number;
    avgPayment: number;
};

const formatCurrencyMetric = (value: number) => `${value.toLocaleString("ru-RU")} ₽`;

const buildMetrics = (data: SummaryData): MetricItem[] => [
    { label: "Уроков за месяц", value: String(data.completedLessons) },
    { label: "Средняя ставка", value: formatCurrencyMetric(data.avgRate) },
    { label: "Платежей за месяц", value: String(data.paymentsCount) },
    { label: "Средний платёж", value: formatCurrencyMetric(data.avgPayment) },
];

const emptyData: SummaryData = {
    completedLessons: 0,
    cancelledLessons: 0,
    cancellationRate: 0,
    avgRate: 0,
    paymentsCount: 0,
    avgPayment: 0,
};

const PeriodSummary = () => {
    const { data } = useFinanceSummary("month");
    const { data: monthStats } = useFinanceStats("month");
    const summaryData = data || emptyData;
    const items = buildMetrics(summaryData);

    const cancelledAmount = Math.max(
        0,
        Math.round((summaryData.cancelledLessons || 0) * (summaryData.avgRate || 0))
    );

    const segmentItems: SegmentItem[] = [
        {
            key: "cancelled",
            label: "Отмененные",
            amount: cancelledAmount,
            tone: "cancelled",
        },
        {
            key: "received",
            label: "Полученные",
            amount: Math.max(0, Math.round(monthStats?.totalIncome ?? 0)),
            tone: "received",
        },
        {
            key: "planned",
            label: "Запланированные",
            amount: Math.max(0, Math.round(monthStats?.totalPending ?? 0)),
            tone: "planned",
        },
        {
            key: "debt",
            label: "Долги",
            amount: Math.max(0, Math.round(monthStats?.totalDebt ?? 0)),
            tone: "debt",
        },
    ];

    const maxSegmentAmount = Math.max(
        1,
        ...segmentItems.map((segment) => segment.amount)
    );

    const getSegmentWeight = (amount: number) => {
        if (amount <= 0) return 0.45;
        return Math.max(amount / maxSegmentAmount, 0.45);
    };

    return (
        <section
            className="repeto-finance-summary-card repeto-finance-summary-card--discrete"
            aria-label="Сводка за последний месяц"
        >
            <div className="repeto-finance-summary-card__grid repeto-finance-summary-card__grid--discrete">
                {items.map((item) => (
                    <article
                        key={item.label}
                        className="repeto-finance-summary-card__metric repeto-finance-summary-card__metric--discrete"
                    >
                        <div className="repeto-finance-summary-card__metric-label">
                            {item.label}
                        </div>
                        <div className="repeto-finance-summary-card__metric-value">
                            {item.value}
                        </div>
                    </article>
                ))}
            </div>

            <div className="repeto-finance-segments" aria-label="Сегменты сумм за месяц">
                {segmentItems.map((segment) => (
                    <article
                        key={segment.key}
                        className={`repeto-finance-segments__item repeto-finance-segments__item--${segment.tone}`}
                        style={{ flex: `${getSegmentWeight(segment.amount)} 1 0` }}
                    >
                        <div className="repeto-finance-segments__meta">
                            <span className="repeto-finance-segments__marker" aria-hidden="true" />
                            <div className="repeto-finance-segments__meta-text">
                                <div className="repeto-finance-segments__name">{segment.label}</div>
                                <div className="repeto-finance-segments__sum">
                                    {formatCurrencyMetric(segment.amount)}
                                </div>
                            </div>
                        </div>
                        <div className="repeto-finance-segments__bar" aria-hidden="true" />
                    </article>
                ))}
            </div>
        </section>
    );
};

export default PeriodSummary;
