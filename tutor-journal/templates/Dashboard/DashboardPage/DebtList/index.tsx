import { useState } from "react";
import Link from "next/link";
import Icon from "@/components/Icon";
import Modal from "@/components/Modal";
import { useDebts } from "@/hooks/useDashboard";
import {
    formatBalance,
    getInitials,
    getSubjectBgColor,
} from "@/mocks/students";

type DebtStudent = {
    id: string;
    name: string;
    subject: string;
    balance: number;
};

const DebtList = () => {
    const { data: debtStudents = [], loading } = useDebts();
    const [reminderTarget, setReminderTarget] = useState<DebtStudent | null>(
        null
    );
    const [sent, setSent] = useState(false);

    const handleSend = () => {
        setSent(true);
        setTimeout(() => {
            setReminderTarget(null);
            setSent(false);
        }, 1500);
    };

    return (
        <>
            <div className="card">
                <div className="card-head">
                    <div className="mr-auto text-h6">Задолженности</div>
                    <Link
                        href="/finance/payments"
                        className="text-xs font-bold transition-colors hover:text-purple-1"
                    >
                        Все →
                    </Link>
                </div>
                {debtStudents.length === 0 ? (
                    <div className="px-5 py-8 text-center text-xs font-medium text-n-3 dark:text-white/50">
                        Задолженностей нет
                    </div>
                ) : (
                    <div>
                        {debtStudents.map((student) => (
                            <Link
                                href={`/students/${student.id}`}
                                className="flex items-center px-4 py-3 border-t border-n-1 first:border-none transition-colors hover:bg-background dark:border-white dark:hover:bg-white/5"
                                key={student.id}
                            >
                                <div
                                    className={`flex items-center justify-center shrink-0 w-9 h-9 rounded-full text-xs font-bold text-n-1 ${getSubjectBgColor(
                                        student.subject
                                    )}`}
                                >
                                    {getInitials(student.name)}
                                </div>
                                <div className="grow px-3 min-w-0">
                                    <div className="text-sm font-bold truncate">
                                        {student.name}
                                    </div>
                                    <div className="text-xs text-n-3 dark:text-white/50">
                                        {student.subject}
                                    </div>
                                </div>
                                <div className="shrink-0 flex items-center gap-2">
                                    <span className="text-sm font-bold text-pink-1">
                                        {formatBalance(student.balance)}
                                    </span>
                                    <button
                                        className="btn-stroke btn-small btn-square"
                                        onClick={(e) => {
                                            e.preventDefault();
                                            e.stopPropagation();
                                            setReminderTarget(student);
                                        }}
                                    >
                                        <Icon name="email" />
                                    </button>
                                </div>
                            </Link>
                        ))}
                    </div>
                )}
            </div>

            <Modal
                visible={!!reminderTarget}
                onClose={() => {
                    setReminderTarget(null);
                    setSent(false);
                }}
            >
                {reminderTarget && !sent && (
                    <div className="p-8 text-center">
                        <div className="flex items-center justify-center w-14 h-14 mx-auto mb-5 rounded-sm bg-pink-1/10">
                            <Icon
                                className="icon-24 fill-pink-1"
                                name="email"
                            />
                        </div>
                        <h3 className="text-h5 mb-2">
                            Напомнить об оплате
                        </h3>
                        <p className="text-sm text-n-3 dark:text-white/50 mb-1">
                            {reminderTarget.name} · {reminderTarget.subject}
                        </p>
                        <p className="text-sm font-bold text-pink-1 mb-6">
                            Задолженность:{" "}
                            {formatBalance(reminderTarget.balance)}
                        </p>
                        <p className="text-sm text-n-3 dark:text-white/50 mb-6">
                            Ученику будет отправлено уведомление с просьбой
                            погасить задолженность.
                        </p>
                        <div className="flex gap-3">
                            <button
                                className="btn-stroke flex-1"
                                onClick={() => setReminderTarget(null)}
                            >
                                Отмена
                            </button>
                            <button
                                className="btn-purple flex-1"
                                onClick={handleSend}
                            >
                                <Icon name="send" />
                                <span>Отправить</span>
                            </button>
                        </div>
                    </div>
                )}
                {reminderTarget && sent && (
                    <div className="p-8 text-center">
                        <div className="flex items-center justify-center w-14 h-14 mx-auto mb-5 rounded-sm bg-green-2 dark:bg-green-1/20">
                            <Icon
                                className="icon-24 fill-green-1"
                                name="check-circle"
                            />
                        </div>
                        <h3 className="text-h5 mb-2">Напоминание отправлено</h3>
                        <p className="text-sm text-n-3 dark:text-white/50">
                            {reminderTarget.name} получит уведомление.
                        </p>
                    </div>
                )}
            </Modal>
        </>
    );
};

export default DebtList;
