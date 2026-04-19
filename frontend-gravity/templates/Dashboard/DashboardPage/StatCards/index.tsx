import Link from "next/link";
import { Icon, Loader } from "@gravity-ui/uikit";
import {
    Persons,
    Calendar,
    CreditCard,
    Receipt,
} from "@gravity-ui/icons";
import { useDashboardStats } from "@/hooks/useDashboard";
import { accent } from "@/constants/brand";
import type { IconData } from "@gravity-ui/uikit";

const cards = [
    {
        id: "students",
        title: "Активных учеников",
        key: "activeStudents" as const,
        icon: Persons as IconData,
        color: "#AE7AFF",
        href: "/students",
    },
    {
        id: "lessons",
        title: "Занятий в этом месяце",
        key: "lessonsThisMonth" as const,
        icon: Calendar as IconData,
        color: accent[500],
        href: "/schedule",
    },
    {
        id: "income",
        title: "Доход за месяц",
        key: "incomeThisMonth" as const,
        icon: CreditCard as IconData,
        color: "#8E7BFF",
        href: "/finance",
        formatted: true,
        suffix: " ₽",
    },
    {
        id: "debt",
        title: "К оплате учениками",
        key: "totalDebt" as const,
        icon: Receipt as IconData,
        color: "#D16B8F",
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
        <div className="repeto-stat-cards" style={{ marginBottom: 20 }}>
            {cards.map((card) => {
                const value = stats?.[card.key] ?? 0;
                return (
                    <Link key={card.id} href={card.href} className="repeto-stat-card">
                        <div className="repeto-stat-card__head">
                            <div className="repeto-stat-card__title">{card.title}</div>
                            <div
                                className="repeto-stat-card__icon"
                                style={{ background: card.color + "12" }}
                            >
                                <Icon data={card.icon} size={18} style={{ color: card.color }} />
                            </div>
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
