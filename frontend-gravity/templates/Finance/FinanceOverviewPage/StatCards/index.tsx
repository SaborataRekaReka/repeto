import Link from "next/link";
import { useFinanceStats, useFinanceSummary } from "@/hooks/usePayments";

const formatTrendValue = (trend: number) => {
    const formatted = trend.toLocaleString("ru-RU", { maximumFractionDigits: 2 });
    return `${trend > 0 ? "+" : ""}${formatted}%`;
};

const formatCurrencyValue = (value: number) => `${value.toLocaleString("ru-RU")} ₽`;
const formatPercentValue = (value: number) =>
    `${value.toLocaleString("ru-RU", { maximumFractionDigits: 1 })}%`;

// Text-only delta: цвет несёт смысл, фона/плашки нет.
const trendColor = (positive: boolean) =>
    positive ? "var(--g-color-text-positive)" : "var(--g-color-text-danger)";

const getCancellationColor = (rate: number) => {
    if (rate <= 12) return "var(--g-color-text-positive)";
    if (rate <= 22) return "var(--g-color-text-warning)";
    return "var(--g-color-text-danger)";
};

const StatCards = () => {
    const { data: stats, loading } = useFinanceStats();
    const { data: monthSummary, loading: summaryLoading } = useFinanceSummary("month");

    const cancellationColor = getCancellationColor(monthSummary?.cancellationRate ?? 0);

    const cards = [
        {
            id: "income",
            title: "Доход за месяц",
            href: "/payments",
            value: loading ? "—" : formatCurrencyValue(stats?.totalIncome ?? 0),
            metaText: !loading ? formatTrendValue(stats?.incomeChangePercent ?? 0) : null,
            metaPositive: (stats?.incomeChangePercent ?? 0) >= 0,
            metaArrow: true,
        },
        {
            id: "pending",
            title: "Запланировано",
            href: "/schedule",
            value: loading ? "—" : formatCurrencyValue(stats?.totalPending ?? 0),
            metaText: !loading ? formatTrendValue(stats?.pendingChangePercent ?? 0) : null,
            metaPositive: (stats?.pendingChangePercent ?? 0) >= 0,
            metaArrow: true,
        },
        {
            id: "debt",
            title: "К оплате учениками",
            href: "/payments",
            value: loading ? "—" : formatCurrencyValue(stats?.totalDebt ?? 0),
            metaText: !loading ? formatTrendValue(stats?.debtChangePercent ?? 0) : null,
            // Для долга рост — это плохо.
            metaPositive: (stats?.debtChangePercent ?? 0) <= 0,
            metaArrow: true,
            metaArrowUp: (stats?.debtChangePercent ?? 0) >= 0,
        },
        {
            id: "cancellations",
            title: "Доля отмен",
            href: "/schedule",
            value: summaryLoading
                ? "—"
                : formatPercentValue(monthSummary?.cancellationRate ?? 0),
            metaText: !summaryLoading
                ? `${(monthSummary?.cancelledLessons ?? 0).toLocaleString("ru-RU")} отмен`
                : null,
            metaCustomColor: cancellationColor,
        },
    ];

    return (
        <div className="repeto-stat-cards">
            {cards.map((card) => {
                const color = (card as any).metaCustomColor
                    ? (card as any).metaCustomColor
                    : trendColor(!!card.metaPositive);
                const arrowUp = (card as any).metaArrowUp !== undefined
                    ? (card as any).metaArrowUp
                    : card.metaPositive;
                return (
                    <Link key={card.id} href={card.href} className="repeto-stat-card">
                        <div className="repeto-stat-card__head">
                            <div className="repeto-stat-card__title">{card.title}</div>
                        </div>
                        <div className="repeto-stat-card__value">{card.value}</div>
                        {card.metaText && (
                            <div
                                className="repeto-stat-card__meta repeto-stat-card__meta--text"
                                style={{ color }}
                            >
                                {card.metaArrow && (
                                    <span style={{ fontSize: 11 }}>
                                        {arrowUp ? "↑" : "↓"}
                                    </span>
                                )}
                                {card.metaText}
                            </div>
                        )}
                    </Link>
                );
            })}
        </div>
    );
};

export default StatCards;
