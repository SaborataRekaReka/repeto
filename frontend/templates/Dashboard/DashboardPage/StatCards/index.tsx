import Link from "next/link";
import Icon from "@/components/Icon";
import { useDashboardStats } from "@/hooks/useDashboard";

const cards = [
    {
        id: "students",
        title: "Активных учеников",
        key: "activeStudents" as const,
        icon: "profile",
        color: "bg-purple-3 dark:bg-purple-1/20",
        href: "/students",
    },
    {
        id: "lessons",
        title: "Занятий в этом месяце",
        key: "lessonsThisMonth" as const,
        icon: "calendar",
        color: "bg-green-2 dark:bg-green-1/20",
        href: "/schedule",
    },
    {
        id: "income",
        title: "Доход за месяц",
        key: "incomeThisMonth" as const,
        icon: "wallet",
        color: "bg-yellow-2 dark:bg-yellow-1/20",
        href: "/finance",
        formatted: true,
        suffix: " ₽",
    },
    {
        id: "debt",
        title: "К оплате учениками",
        key: "totalDebt" as const,
        icon: "card",
        color: "bg-pink-2 dark:bg-pink-1/20",
        href: "/finance/payments",
        formatted: true,
        suffix: " ₽",
    },
];

const StatCards = () => {
    const { data: stats, loading } = useDashboardStats();

    return (
        <div className="grid grid-cols-4 gap-3 mb-5 xl:grid-cols-2 md:grid-cols-1">
            {cards.map((card) => {
                const value = stats?.[card.key] ?? 0;
                return (
                    <Link
                        href={card.href}
                        className="px-5 py-4.5 card transition-shadow hover:shadow-primary-4"
                        key={card.id}
                    >
                        <div className="flex justify-between items-center mb-2">
                            <div className="text-xs font-medium text-n-3 dark:text-white/50">
                                {card.title}
                            </div>
                            <div
                                className={`flex items-center justify-center w-8 h-8 rounded-full ${card.color}`}
                            >
                                <Icon
                                    className="icon-18 dark:fill-white"
                                    name={card.icon}
                                />
                            </div>
                        </div>
                        <div className="text-h4">
                            {loading
                                ? "—"
                                : card.formatted
                                ? value.toLocaleString("ru-RU") +
                                  (card.suffix || "")
                                : value}
                        </div>
                    </Link>
                );
            })}
        </div>
    );
};

export default StatCards;
