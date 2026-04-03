export const navigation = [
    {
        title: "Дашборд",
        icon: "dashboard",
        url: "/dashboard",
    },
    {
        title: "Ученики",
        icon: "profile",
        url: "/students",
    },
    {
        title: "Расписание",
        icon: "calendar",
        url: "/schedule",
    },
    {
        title: "Финансы",
        icon: "wallet",
        url: "/finance",
    },
    {
        title: "Оплаты",
        icon: "card",
        url: "/finance/payments",
    },
    {
        title: "Пакеты",
        icon: "card",
        url: "/finance/packages",
    },
    {
        title: "Уведомления",
        icon: "email",
        counter: 3,
        url: "/notifications",
    },
    {
        title: "Настройки",
        icon: "setup",
        url: "/settings",
    },
];

export const navigationMobile = [
    {
        icon: "dashboard",
        url: "/dashboard",
    },
    {
        icon: "profile",
        url: "/students",
    },
    {
        icon: "calendar",
        url: "/schedule",
    },
    {
        icon: "wallet",
        url: "/finance",
    },
    {
        icon: "dots",
        onClick: () => console.log("Click on dots"),
    },
];
