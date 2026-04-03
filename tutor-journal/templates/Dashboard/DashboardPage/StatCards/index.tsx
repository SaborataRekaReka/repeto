import Link from "next/link";
import Icon from "@/components/Icon";
import { statCards } from "@/mocks/tutorDashboard";

const StatCards = () => (
    <div className="flex flex-wrap -mx-1.5 mb-5 md:block md:mx-0">
        {statCards.map((card) => (
            <Link
                href={card.href}
                className="w-[calc(25%-0.75rem)] mx-1.5 px-5 py-4.5 card transition-shadow hover:shadow-lg md:w-full md:mx-0 md:mb-3 md:last:mb-0"
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
                    {card.formatted
                        ? card.value.toLocaleString("ru-RU") + card.suffix
                        : card.value}
                </div>
            </Link>
        ))}
    </div>
);

export default StatCards;
