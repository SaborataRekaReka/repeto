import Link from "next/link";
import Icon from "@/components/Icon";
import { debtStudents } from "@/mocks/tutorDashboard";
import {
    formatBalance,
    getInitials,
    getSubjectBgColor,
} from "@/mocks/students";

const DebtList = () => (
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
            <div className="px-5 py-8 text-center text-green-1 font-bold">
                Все оплаты получены ✓
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
                                    console.log(
                                        "TODO: send reminder to",
                                        student.name
                                    );
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
);

export default DebtList;
