import Link from "next/link";
import { Loader } from "@gravity-ui/uikit";
import { useDashboardStats } from "@/hooks/useDashboard";

const cards = [
    {
        id: "students",
        title: "Активных учеников",
        key: "activeStudents" as const,
        href: "/students",
    },
    {
        id: "lessons",
        title: "Занятий в этом месяце",
        key: "lessonsThisMonth" as const,
        href: "/schedule",
    },
    {
        id: "income",
        title: "Доход за месяц",
        key: "incomeThisMonth" as const,
        href: "/finance",
        formatted: true,
        suffix: " ₽",
    },
    {
        id: "debt",
        title: "К оплате учениками",
        key: "totalDebt" as const,
        href: "/payments",
        formatted: true,
        suffix: " ₽",
    },
];

const formatCardValue = (value: number, suffix?: string) => {
    const formatted = value.toLocaleString("ru-RU");
    if (!suffix) return formatted;
    return `${formatted}\u00A0${suffix.trim()}`;
};

const StatCards = () => {
    const { data: stats, loading } = useDashboardStats();

    return (
        <div className="repeto-stat-cards">
            {cards.map((card) => {
                const value = stats?.[card.key] ?? 0;
                return (
                    <Link key={card.id} href={card.href} className="repeto-stat-card">
                        <div className="repeto-stat-card__head">
                            <div className="repeto-stat-card__title">{card.title}</div>
                        </div>
                        <div className="repeto-stat-card__value">
                            {loading ? (
                                <Loader size="s" />
                            ) : card.formatted ? (
                                formatCardValue(value, card.suffix)
                            ) : (
                                value.toLocaleString("ru-RU")
                            )}
                        </div>
                    </Link>
                );
            })}
        </div>
    );
};

export default StatCards;
