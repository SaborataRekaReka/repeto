import Link from "next/link";
import { Text, Icon, Loader } from "@gravity-ui/uikit";
import {
    Persons,
    Calendar,
    CreditCard,
    Receipt,
} from "@gravity-ui/icons";
import { useDashboardStats } from "@/hooks/useDashboard";
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
        color: "#22C55E",
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
                    <Link
                        key={card.id}
                        href={card.href}
                        style={{ textDecoration: "none", display: "block", height: "100%" }}
                    >
                        <div
                            style={{
                                background: "var(--g-color-base-float)",
                                borderRadius: "var(--repeto-card-radius, 16px)",
                                padding: "20px",
                                cursor: "pointer",
                                border: "none",
                                boxShadow: "0 6px 18px rgba(18, 22, 30, 0.08)",
                                transition: "box-shadow 0.2s, transform 0.2s",
                                height: "100%",
                                display: "flex",
                                flexDirection: "column",
                                justifyContent: "space-between",
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.boxShadow = "0 10px 24px rgba(18, 22, 30, 0.14)";
                                e.currentTarget.style.transform = "translateY(-1px)";
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.boxShadow = "0 6px 18px rgba(18, 22, 30, 0.08)";
                                e.currentTarget.style.transform = "translateY(0)";
                            }}
                        >
                            <div
                                style={{
                                    display: "flex",
                                    justifyContent: "space-between",
                                    alignItems: "flex-start",
                                    marginBottom: 16,
                                }}
                            >
                                <Text
                                    variant="body-1"
                                    color="secondary"
                                    style={{ lineHeight: 1.3, maxWidth: "70%" }}
                                >
                                    {card.title}
                                </Text>
                                <div
                                    style={{
                                        width: 40,
                                        height: 40,
                                        borderRadius: 10,
                                        background: card.color + "12",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        flexShrink: 0,
                                    }}
                                >
                                    <Icon
                                        data={card.icon}
                                        size={20}
                                        style={{ color: card.color }}
                                    />
                                </div>
                            </div>
                            <div
                                style={{
                                    display: "flex",
                                    alignItems: "baseline",
                                    columnGap: 10,
                                    rowGap: 6,
                                    flexWrap: "wrap",
                                }}
                            >
                                {loading ? (
                                    <Loader size="s" />
                                ) : (
                                    <>
                                        <Text variant="header-1" style={{ fontSize: 28, lineHeight: 1, whiteSpace: "nowrap" }}>
                                            {card.formatted
                                                ? formatCardValue(value, card.suffix)
                                                : value}
                                        </Text>
                                    </>
                                )}
                            </div>
                        </div>
                    </Link>
                );
            })}
        </div>
    );
};

export default StatCards;
