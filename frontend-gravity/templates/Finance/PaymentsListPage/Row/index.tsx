import Icon from "@/components/Icon";
import DropdownMenu from "@/components/DropdownMenu";
import StudentNameWithBadge from "@/components/StudentNameWithBadge";
import type { Payment } from "@/types/finance";
import {
    getMethodLabel,
    getStatusLabel,
    getStatusColor,
} from "@/mocks/finance-tutor";

type RowProps = {
    item: Payment;
    onClick: () => void;
};

const Row = ({ item, onClick }: RowProps) => (
    <tr
        className="cursor-pointer transition-colors hover:bg-background dark:hover:bg-white/5"
        onClick={onClick}
    >
        <td className="td-custom text-sm">{item.date}</td>
        <td className="td-custom">
            <div className="text-sm font-bold">
                <StudentNameWithBadge
                    name={item.studentName}
                    hasRepetoAccount={Boolean(item.studentAccountId)}
                    truncate
                />
            </div>
        </td>
        <td className="td-custom text-sm font-bold">
            {item.amount.toLocaleString("ru-RU")} ₽
        </td>
        <td className="td-custom text-sm">{getMethodLabel(item.method)}</td>
        <td className="td-custom">
            <span
                className={`${getStatusColor(
                    item.status
                )}`}
            >
                {getStatusLabel(item.status)}
            </span>
        </td>
        <td
            className="td-custom text-right"
            onClick={(e) => e.stopPropagation()}
        >
            <DropdownMenu
                items={[
                    {
                        label: "Подробнее",
                        icon: "arrow-next",
                        onClick,
                    },
                ]}
            />
        </td>
    </tr>
);

export default Row;
