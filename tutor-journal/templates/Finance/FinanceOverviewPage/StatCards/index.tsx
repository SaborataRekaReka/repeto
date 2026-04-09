import Link from "next/link";
import Icon from "@/components/Icon";
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
        color: string;
        parameters: number[];
    }> = [
        {
            title: "Доход за месяц",
            key: "totalIncome",
            trendKey: "incomeChangePercent",
            href: "/finance/payments",
            color: "#98E9AB",
            parameters: [62, 42, 74, 55, 36, 68],
        },
        {
            title: "Запланировано",
            key: "totalPending",
            trendKey: "pendingChangePercent",
            href: "/schedule",
            color: "#FAE8A4",
            parameters: [56, 30, 64, 48, 33, 60],
        },
        {
            title: "Задолженность",
            key: "totalDebt",
            trendKey: "debtChangePercent",
            href: "/finance/payments",
            color: "#E99898",
            parameters: [54, 38, 70, 58, 34, 64],
        },
    ];

    return (
        <div className="flex -mx-2.5 mb-5 md:block md:mx-0">
            {cards.map((card) => {
                const value = stats?.[card.key] ?? 0;
                const trend = stats?.[card.trendKey] ?? 0;

                return (
                    <Link
                        href={card.href}
                        className="flex w-[calc(33.333%-1.25rem)] mx-2.5 pl-5 pr-7 py-4 card transition-shadow hover:shadow-primary-4 lg:px-4 md:w-full md:px-5 md:mx-0 md:mb-4 md:last:mb-0"
                        key={card.key}
                    >
                        <div className="mr-auto min-w-0">
                            <div className="mb-1.5 text-sm text-n-3 dark:text-white/75">
                                {card.title}
                            </div>
                            <div className="mb-1.5 text-h4 lg:text-h5 md:text-h4">
                                {loading
                                    ? "—"
                                    : value.toLocaleString("ru-RU") + " ₽"}
                            </div>
                            {loading ? (
                                <div className="text-xs font-bold text-n-3 dark:text-white/50">
                                    —
                                </div>
                            ) : (
                                <div
                                    className={`flex items-center text-xs font-bold ${
                                        trend >= 0
                                            ? "text-green-1 fill-green-1"
                                            : "text-pink-1 fill-pink-1"
                                    }`}
                                >
                                    <Icon
                                        className="mr-1 fill-inherit"
                                        name={
                                            trend >= 0
                                                ? "arrow-up-right"
                                                : "arrow-down-right"
                                        }
                                    />
                                    {formatTrendValue(trend)}
                                </div>
                            )}
                        </div>
                        <div className="flex space-x-3 lg:space-x-2 md:space-x-3">
                            {card.parameters.map((parameter, index) => (
                                <div
                                    className="relative w-1 h-[4.82rem] rounded-1"
                                    style={{ backgroundColor: card.color }}
                                    key={index}
                                >
                                    <div
                                        className="absolute left-0 right-0 bottom-0 bg-n-1/30 rounded-1 dark:bg-white/35"
                                        style={{ height: `${parameter}%` }}
                                    ></div>
                                </div>
                            ))}
                        </div>
                    </Link>
                );
            })}
        </div>
    );
};

export default StatCards;
