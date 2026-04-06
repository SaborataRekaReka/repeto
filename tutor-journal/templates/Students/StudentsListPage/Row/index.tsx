import { useState } from "react";
import { useRouter } from "next/router";
import Checkbox from "@/components/Checkbox";
import Icon from "@/components/Icon";
import DropdownMenu from "@/components/DropdownMenu";
import type { Student } from "@/types/student";
import {
    formatBalance,
    getBalanceColor,
    getStatusLabel,
    getStatusColor,
    getInitials,
    getSubjectBgColor,
} from "@/mocks/students";

type RowProps = {
    item: Student;
};

const Row = ({ item }: RowProps) => {
    const [value, setValue] = useState<boolean>(false);
    const router = useRouter();

    return (
        <tr
            className="cursor-pointer transition-colors hover:bg-background dark:hover:bg-white/5"
            onClick={() => router.push(`/students/${item.id}`)}
        >
            <td className="td-custom" onClick={(e) => e.stopPropagation()}>
                <Checkbox value={value} onChange={() => setValue(!value)} />
            </td>
            <td className="td-custom">
                <div className="flex items-center text-sm font-bold">
                    <div
                        className={`flex items-center justify-center w-7 h-7 mr-3 rounded-full text-xs font-bold text-n-1 ${getSubjectBgColor(
                            item.subject
                        )}`}
                    >
                        {getInitials(item.name)}
                    </div>
                    {item.name}
                </div>
            </td>
            <td className="td-custom">{item.subject}</td>
            <td className="td-custom lg:hidden">{item.grade}</td>
            <td className="td-custom lg:hidden">
                {item.rate.toLocaleString("ru-RU")} ₽
            </td>
            <td className="td-custom">
                <span className={`text-sm font-bold ${getBalanceColor(item.balance)}`}>
                    {formatBalance(item.balance)}
                </span>
            </td>
            <td className="td-custom">
                <div className="inline-flex items-center text-xs font-bold">
                    <div
                        className={`w-2 h-2 mr-1.5 rounded-full ${getStatusColor(
                            item.status
                        )}`}
                    ></div>
                    {getStatusLabel(item.status)}
                </div>
            </td>
            <td className="td-custom text-right" onClick={(e) => e.stopPropagation()}>
                <DropdownMenu
                    items={[
                        {
                            label: "Открыть",
                            icon: "arrow-next",
                            onClick: () => router.push(`/students/${item.id}`),
                        },
                        {
                            label: "Назначить занятие",
                            icon: "calendar",
                            onClick: () => {
                                // TODO: open CreateLessonModal pre-filled with student
                            },
                        },
                        {
                            label: "Написать",
                            icon: "email",
                            onClick: () => {
                                // TODO: open messaging with student
                            },
                        },
                        {
                            label: "Архивировать",
                            icon: "close",
                            onClick: () => {
                                // TODO: update student status to "archived" via API
                            },
                            danger: true,
                        },
                    ]}
                />
            </td>
        </tr>
    );
};

export default Row;
