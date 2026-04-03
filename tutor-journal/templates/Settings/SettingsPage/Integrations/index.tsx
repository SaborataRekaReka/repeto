import Icon from "@/components/Icon";

type IntegrationStatus = "connected" | "disconnected" | "disabled";

type Integration = {
    id: string;
    name: string;
    description: string;
    status: IntegrationStatus;
    icon: string;
};

const integrations: Integration[] = [
    {
        id: "google-calendar",
        name: "Google Calendar",
        description: "Двусторонняя синхронизация расписания",
        status: "disconnected",
        icon: "calendar",
    },
    {
        id: "telegram-bot",
        name: "Telegram-бот",
        description:
            "Уведомления ученикам и родителям через Telegram-бот",
        status: "disconnected",
        icon: "email",
    },
    {
        id: "yukassa",
        name: "ЮKassa",
        description: "Приём оплаты по ссылке (скоро)",
        status: "disabled",
        icon: "card",
    },
];

const statusLabel = (status: string) => {
    switch (status) {
        case "connected":
            return "Подключено";
        case "disconnected":
            return "Не подключено";
        case "disabled":
            return "Скоро";
        default:
            return "";
    }
};

const statusColor = (status: string) => {
    switch (status) {
        case "connected":
            return "text-green-1";
        case "disconnected":
            return "text-n-3 dark:text-white/50";
        case "disabled":
            return "text-yellow-1";
        default:
            return "";
    }
};

const Integrations = () => {
    return (
        <div className="space-y-4">
            {integrations.map((item) => (
                <div key={item.id} className="card">
                    <div className="p-5">
                        <div className="flex items-center">
                            <div className="flex items-center justify-center w-12 h-12 mr-4 rounded-xl bg-n-4/50 dark:bg-white/10">
                                <Icon
                                    className="icon-20 dark:fill-white"
                                    name={item.icon}
                                />
                            </div>
                            <div className="mr-auto">
                                <div className="text-sm font-bold">
                                    {item.name}
                                </div>
                                <div className="mt-1 text-xs text-n-3 dark:text-white/50">
                                    {item.description}
                                </div>
                                <div
                                    className={`mt-1 text-xs font-bold ${statusColor(
                                        item.status
                                    )}`}
                                >
                                    {statusLabel(item.status)}
                                </div>
                            </div>
                            <button
                                className={`btn-small min-w-[8rem] ${
                                    item.status === "disabled"
                                        ? "btn-stroke opacity-50 pointer-events-none"
                                        : item.status === "connected"
                                        ? "btn-stroke"
                                        : "btn-purple"
                                }`}
                                disabled={item.status === "disabled"}
                            >
                                {item.status === "connected"
                                    ? "Отключить"
                                    : item.status === "disabled"
                                    ? "Скоро"
                                    : "Подключить"}
                            </button>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
};

export default Integrations;
