import Link from "next/link";
import { Text, Card } from "@gravity-ui/uikit";
import { useFinanceStats } from "@/hooks/usePayments";

type FinanceCardKey = "totalIncome" | "totalPending" | "totalDebt";
type FinanceTrendKey =
    | "incomeChangePercent"
    | "pendingChangePercent"
    | "debtChangePercent";

const formatTrendValue = (trend: number) => {
    const formatted = trend.toLocaleString("ru-RU", {
        maximumFractionDigits: 2,
    });
    return `${trend > 0 ? "+" : ""}${formatted}%`;
};

const StatCards = () => {
    const { data: stats, loading } = useFinanceStats();

    const cards: Array<{
        title: string;
        key: FinanceCardKey;
        trendKey: FinanceTrendKey;
        href: string;
        accent: string;
    }> = [
        {
            title: "Доход за месяц",
            key: "totalIncome",
            trendKey: "incomeChangePercent",
            href: "/payments",
            accent: "#2ca84a",
        },
        {
            title: "Запланировано",
            key: "totalPending",
            trendKey: "pendingChangePercent",
            href: "/schedule",
            accent: "#c9a225",
        },
        {
            title: "Задолженность",
            key: "totalDebt",
            trendKey: "debtChangePercent",
            href: "/payments",
            accent: "#d14343",
        },
    ];

    return (
        <div style={{ display: "flex", gap: 16 }}>
            {cards.map((card) => {
                const value = stats?.[card.key] ?? 0;
                const trend = stats?.[card.trendKey] ?? 0;

                return (
                    <Link
                        href={card.href}
                        key={card.key}
                        style={{ flex: 1, minWidth: 0, textDecoration: "none", color: "inherit" }}
                    >
                        <Card
                            view="outlined"
                            style={{
                                padding: "20px 24px",
                                background: "var(--g-color-base-float)",
                                cursor: "pointer",
                                height: "100%",
                            }}
                        >
                            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                                <Text variant="body-1" color="secondary">
                                    {card.title}
                                </Text>
                                <div
                                    style={{
                                        width: 8,
                                        height: 8,
                                        borderRadius: "50%",
                                        background: card.accent,
                                    }}
                                />
                            </div>
                            <Text variant="header-1" style={{ display: "block", marginBottom: 8 }}>
                                {loading ? "—" : value.toLocaleString("ru-RU") + " ₽"}
                            </Text>
                            {!loading && (
                                <div
                                    style={{
                                        display: "inline-flex",
                                        alignItems: "center",
                                        gap: 4,
                                        padding: "2px 8px",
                                        borderRadius: 6,
                                        background: trend >= 0 ? "rgba(44,168,74,0.10)" : "rgba(209,67,67,0.10)",
                                        color: trend >= 0 ? "#2ca84a" : "#d14343",
                                        fontSize: 13,
                                        fontWeight: 600,
                                    }}
                                >
                                    <span style={{ fontSize: 11 }}>
                                        {trend >= 0 ? "↑" : "↓"}
                                    </span>
                                    {formatTrendValue(trend)}
                                </div>
                            )}
                        </Card>
                    </Link>
                );
            })}
        </div>
    );
};

export default StatCards;
