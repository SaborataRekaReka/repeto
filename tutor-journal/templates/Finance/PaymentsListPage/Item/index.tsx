import type { Payment } from "@/types/finance";
import {
    getMethodLabel,
    getStatusLabel,
    getStatusColor,
} from "@/mocks/finance-tutor";

type ItemProps = {
    item: Payment;
    onClick: () => void;
};

const Item = ({ item, onClick }: ItemProps) => (
    <button
        className="flex items-center w-full px-4 py-3.5 border-b border-n-1 last:border-none text-left transition-colors hover:bg-background dark:border-white dark:hover:bg-white/5"
        onClick={onClick}
    >
        <div className="w-[calc(100%-5rem)] mr-auto">
            <div className="truncate text-sm font-bold">
                {item.studentName}
            </div>
            <div className="truncate text-xs text-n-3 dark:text-white/50">
                {item.date} · {getMethodLabel(item.method)}
            </div>
        </div>
        <div className="flex flex-col items-end shrink-0">
            <span className="text-sm font-bold">
                {item.amount.toLocaleString("ru-RU")} ₽
            </span>
            <span
                className={`mt-0.5 inline-flex items-center px-2 py-0.5 text-xs font-bold rounded-sm ${getStatusColor(
                    item.status
                )}`}
            >
                {getStatusLabel(item.status)}
            </span>
        </div>
    </button>
);

export default Item;
