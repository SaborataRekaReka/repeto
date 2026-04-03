import Icon from "@/components/Icon";
import { financeStats } from "@/mocks/finance-tutor";

const cards = [
    {
        title: "Доход за месяц",
        value: financeStats.incomeMonth,
        subtitle: "+12% к прошлому",
        icon: "wallet",
        color: "bg-green-2 dark:bg-green-1/20",
    },
    {
        title: "Ожидается",
        value: financeStats.expected,
        subtitle: `${financeStats.expectedCount} ${financeStats.expectedCount === 1 ? "ученик" : "учеников"}`,
        icon: "calendar",
        color: "bg-yellow-2 dark:bg-yellow-1/20",
    },
    {
        title: "Задолженность",
        value: financeStats.overdue,
        subtitle: `${financeStats.overdueCount} ${financeStats.overdueCount === 1 ? "ученик" : "ученика"}`,
        icon: "email",
        color: "bg-pink-2 dark:bg-pink-1/20",
    },
];

const StatCards = () => (
    <div className="flex -mx-1.5 mb-5 md:block md:mx-0">
        {cards.map((card, i) => (
            <div
                className="w-[calc(33.333%-0.75rem)] mx-1.5 px-5 py-4.5 card md:w-full md:mx-0 md:mb-3 md:last:mb-0"
                key={i}
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
                    {card.value.toLocaleString("ru-RU")} ₽
                </div>
                <div className="mt-1 text-xs text-n-3 dark:text-white/50">
                    {card.subtitle}
                </div>
            </div>
        ))}
    </div>
);

export default StatCards;
