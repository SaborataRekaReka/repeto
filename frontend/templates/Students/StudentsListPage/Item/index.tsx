import Link from "next/link";
import type { Student } from "@/types/student";
import {
    formatBalance,
    getBalanceColor,
    getStatusLabel,
    getStatusColor,
    getInitials,
    getSubjectBgColor,
} from "@/mocks/students";

type ItemProps = {
    item: Student;
};

const Item = ({ item }: ItemProps) => (
    <Link
        href={`/students/${item.id}`}
        className="flex items-center px-4 py-3.5 border-b border-n-1 last:border-none transition-colors hover:bg-background dark:border-white dark:hover:bg-white/5"
    >
        <div
            className={`flex items-center justify-center shrink-0 w-9 h-9 rounded-full text-xs font-bold text-n-1 ${getSubjectBgColor(
                item.subject
            )}`}
        >
            {getInitials(item.name)}
        </div>
        <div className="w-[calc(100%-6rem)] mr-auto px-3">
            <div className="truncate text-sm font-bold">{item.name}</div>
            <div className="truncate text-xs text-n-3 dark:text-white/50">
                {item.subject} · {item.grade}{" "}
                {item.grade !== "Взрослый" ? "класс" : ""}
            </div>
        </div>
        <div className="flex flex-col items-end shrink-0">
            <span
                className={`text-sm font-bold ${getBalanceColor(item.balance)}`}
            >
                {formatBalance(item.balance)}
            </span>
            <div className="flex items-center mt-0.5 text-xs font-bold">
                <div
                    className={`w-2 h-2 mr-1 rounded-full ${getStatusColor(
                        item.status
                    )}`}
                ></div>
                {getStatusLabel(item.status)}
            </div>
        </div>
    </Link>
);

export default Item;
