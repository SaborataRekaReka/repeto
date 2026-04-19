import { useState } from "react";
import Icon from "@/components/Icon";
import StudentNameWithBadge from "@/components/StudentNameWithBadge";
import type { Student } from "@/types/student";
import {
    formatBalance,
    getBalanceColor,
    getStatusLabel,
    getStatusColor,
    getInitials,
    getSubjectBgColor,
} from "@/mocks/students";

type ProfileProps = {
    student: Student;
    onMessage?: () => void;
    onEdit?: () => void;
};

const Profile = ({ student, onMessage, onEdit }: ProfileProps) => {

    const contactItems = [
        student.phone && { title: "Телефон", content: student.phone },
        student.telegram && { title: "Telegram (устар.)", content: student.telegram },
        student.parentName && {
            title: "Родитель",
            content: student.parentName,
        },
        student.parentPhone && {
            title: "Тел. родителя",
            content: student.parentPhone,
        },
        student.parentTelegram && {
            title: "Telegram родителя (устар.)",
            content: student.parentTelegram,
        },
        student.parentEmail && {
            title: "Email родителя",
            content: student.parentEmail,
        },
    ].filter(Boolean) as { title: string; content: string }[];

    return (
        <div className="lg:card">
            <div className="lg:hidden">
                <div
                    className={`flex items-center justify-center w-[5.25rem] h-[5.25rem] mb-2.5 rounded-full text-xl font-bold text-n-1 ${getSubjectBgColor(
                        student.subject
                    )}`}
                >
                    {getInitials(student.name)}
                </div>
                <div className="text-h4">
                    <StudentNameWithBadge
                        name={student.name}
                        hasRepetoAccount={Boolean(student.accountId)}
                    />
                </div>
                <div className="text-sm">
                    {student.subject}
                    {student.grade
                        ? ` · ${student.grade}${student.grade !== "Взрослый" ? " класс" : ""}`
                        : ""}
                    {student.age ? ` · ${student.age} лет` : ""}
                </div>
                <div className="flex items-center mt-2 gap-2">
                    <div
                        className={`flex items-center text-xs font-bold`}
                    >
                        <div
                            className={`w-2 h-2 mr-1.5 rounded-full ${getStatusColor(
                                student.status
                            )}`}
                        ></div>
                        {getStatusLabel(student.status)}
                    </div>
                    <span
                        className={`text-sm font-bold ${getBalanceColor(
                            student.balance
                        )}`}
                    >
                        {formatBalance(student.balance)}
                    </span>
                </div>
            </div>
            <div className="card-title hidden lg:flex">Контактные данные</div>
            <div className="lg:px-5 lg:py-6">
                <div className="mt-5 pt-5 border-t border-dashed border-n-1 lg:mt-0 lg:pt-0 lg:border-none dark:border-white">
                    <div className="mb-5 text-sm">
                        <div className="mb-0.5">Ставка</div>
                        <div className="font-bold">
                            {student.rate.toLocaleString("ru-RU")} ₽/занятие
                        </div>
                    </div>
                    {contactItems.map((item, index) => (
                        <div className="mb-5 text-sm last:mb-0" key={index}>
                            <div className="mb-0.5">{item.title}</div>
                            <div className="font-bold">{item.content}</div>
                        </div>
                    ))}
                    {student.notes && (
                        <div className="mb-5 text-sm last:mb-0">
                            <div className="mb-0.5">Заметки</div>
                            <div className="font-bold">{student.notes}</div>
                        </div>
                    )}
                </div>
                <div className="flex mt-5 pt-5 border-t border-dashed border-n-1 lg:mt-6 lg:pt-0 lg:border-none dark:border-white">
                    <button
                        className="btn-stroke btn-medium btn-square shrink-0"
                        onClick={onMessage}
                    >
                        <Icon name="email" />
                    </button>
                    <button
                        className="btn-stroke btn-medium btn-square shrink-0 ml-1.5"
                        onClick={onEdit}
                        title="Редактировать"
                    >
                        <Icon name="edit" />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Profile;
