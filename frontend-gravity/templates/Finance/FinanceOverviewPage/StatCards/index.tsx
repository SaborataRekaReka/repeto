import Link from "next/link";
import { useFinanceStats, useFinanceSummary } from "@/hooks/usePayments";

const formatTrendValue = (trend: number) => {
    const formatted = trend.toLocaleString("ru-RU", { maximumFractionDigits: 2 });
    return `${trend > 0 ? "+" : ""}${formatted}%`;
};

const formatCurrencyValue = (value: number) => `${value.toLocaleString("ru-RU")} ₽`;
const formatPercentValue = (value: number) =>
    `${value.toLocaleString("ru-RU", { maximumFractionDigits: 1 })}%`;

const trendColors = (positive: boolean) =>
    positive
        ? { bg: "rgba(44,168,74,0.10)", color: "#2ca84a" }
        : { bg: "rgba(209,67,67,0.10)", color: "#d14343" };

const getCancellationAccent = (rate: number) => {
    if (rate <= 12) return { dot: "#2ca84a", bg: "rgba(44,168,74,0.10)", color: "#2ca84a" };
    if (rate <= 22) return { dot: "#AE7AFF", bg: "rgba(174,122,255,0.12)", color: "#AE7AFF" };
    return { dot: "#d16b8f", bg: "rgba(209,107,143,0.12)", color: "#d16b8f" };
};

const StatCards = () => {
    const { data: stats, loading } = useFinanceStats();
    const { data: monthSummary, loading: summaryLoading } = useFinanceSummary("month");

    const cancellation = getCancellationAccent(monthSummary?.cancellationRate ?? 0);

    const cards = [
        {
            id: "income",
            title: "Доход за месяц",
            href: "/payments",
            dot: "#2ca84a",
            value: loading ? "—" : formatCurrencyValue(stats?.totalIncome ?? 0),
            metaText: !loading ? formatTrendValue(stats?.incomeChangePercent ?? 0) : null,
            metaPositive: (stats?.incomeChangePercent ?? 0) >= 0,
            metaArrow: true,
        },
        {
            id: "pending",
            title: "Запланировано",
            href: "/schedule",
            dot: "#c9a225",
            value: loading ? "—" : formatCurrencyValue(stats?.totalPending ?? 0),
            metaText: !loading ? formatTrendValue(stats?.pendingChangePercent ?? 0) : null,
            metaPositive: (stats?.pendingChangePercent ?? 0) >= 0,
            metaArrow: true,
        },
        {
            id: "debt",
            title: "Задолженность",
            href: "/payments",
            dot: "#d14343",
            value: loading ? "—" : formatCurrencyValue(stats?.totalDebt ?? 0),
            metaText: !loading ? formatTrendValue(stats?.debtChangePercent ?? 0) : null,
            metaPositive: (stats?.debtChangePercent ?? 0) >= 0,
            metaArrow: true,
        },
        {
            id: "cancellations",
            title: "Доля отмен",
            href: "/schedule",
            dot: cancellation.dot,
            value: summaryLoading
                ? "—"
                : formatPercentValue(monthSummary?.cancellationRate ?? 0),
            metaText: !summaryLoading
                ? `${(monthSummary?.cancelledLessons ?? 0).toLocaleString("ru-RU")} отмен`
                : null,
            metaCustom: { bg: cancellation.bg, color: cancellation.color },
        },
    ];

    return (
        <div className="repeto-stat-cards" style={{ marginBottom: 20 }}>
            {cards.map((card) => {
                const meta = (card as any).metaCustom
                    ? (card as any).metaCustom
                    : trendColors(!!card.metaPositive);
                return (
                    <Link key={card.id} href={card.href} className="repeto-stat-card">
                        <div className="repeto-stat-card__head">
                            <div className="repeto-stat-card__title">{card.title}</div>
                            <div className="repeto-stat-card__dot" style={{ background: card.dot }} />
                        </div>
                        <div className="repeto-stat-card__value">{card.value}</div>
                        {card.metaText && (
                            <div
                                className="repeto-stat-card__meta"
                                style={{ background: meta.bg, color: meta.color }}
                            >
                                {card.metaArrow && (
                                    <span style={{ fontSize: 11 }}>
                                        {card.metaPositive ? "↑" : "↓"}
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
