import { useState } from "react";
import { useRouter } from "next/router";
import { useIncomeByStudents } from "@/hooks/usePayments";

const periodMap: Record<string, "month" | "quarter" | "year"> = {
    Месяц: "month",
    Квартал: "quarter",
    Год: "year",
};

const periodLabels = ["Месяц", "Квартал", "Год"];

const barColor = (i: number) => {
    const palette = [
        "bg-purple-1",
        "bg-green-1",
        "bg-yellow-1",
        "bg-pink-1",
        "bg-n-3 dark:bg-white/30",
    ];
    return palette[i] ?? palette[4];
};

const IncomeByStudents = () => {
    const [period, setPeriod] = useState("Месяц");
    const { data: students = [], loading } = useIncomeByStudents(
        periodMap[period] || "month"
    );
    const router = useRouter();

    const maxTotal = students.length > 0 ? students[0].total : 1;
    const grandTotal = students.reduce((s, st) => s + st.total, 0);

    return (
        <div className="card h-full flex flex-col">
            <div className="card-head">
                <div className="mr-auto text-h6">Доход по ученикам</div>
                <div className="flex border border-n-1 dark:border-white overflow-hidden">
                    {periodLabels.map((label) => (
                        <button
                            key={label}
                            className={`px-3 py-1.5 text-xs font-bold transition-colors ${
                                label === period
                                    ? "bg-n-1 text-white dark:bg-white dark:text-n-1"
                                    : "hover:bg-n-4/50 dark:hover:bg-white/10"
                            }`}
                            onClick={() => setPeriod(label)}
                        >
                            {label}
                        </button>
                    ))}
                </div>
            </div>
            <div className="flex-1 flex flex-col">
                {loading ? (
                    <div className="flex-1 flex items-center justify-center text-n-3">
                        Загрузка...
                    </div>
                ) : students.length === 0 ? (
                    <div className="flex-1 flex items-center justify-center text-xs font-medium text-n-3 dark:text-white/50">
                        Нет данных за период
                    </div>
                ) : (
                    <>
                        <div className="flex-1">
                            {students.map((s, i) => {
                                const pct =
                                    grandTotal > 0
                                        ? Math.round(
                                              (s.total / grandTotal) * 100
                                          )
                                        : 0;
                                return (
                                    <div
                                        key={s.studentId}
                                        className="flex items-center gap-3 px-5 py-3.5 border-b border-dashed border-n-1 last:border-none cursor-pointer group transition-colors hover:bg-background dark:border-white dark:hover:bg-white/5"
                                        onClick={() =>
                                            router.push(
                                                `/students/${s.studentId}`
                                            )
                                        }
                                    >
                                        <span className="shrink-0 w-5 text-xs font-bold text-n-3 dark:text-white/40 tabular-nums">
                                            {i + 1}
                                        </span>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-baseline justify-between">
                                                <span className="text-sm font-bold truncate group-hover:text-purple-1 transition-colors">
                                                    {s.studentName}
                                                </span>
                                                <span className="shrink-0 ml-3 text-sm font-bold tabular-nums">
                                                    {s.total.toLocaleString(
                                                        "ru-RU"
                                                    )}{" "}
                                                    ₽
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-2 mt-1.5">
                                                <div className="flex-1 h-1 bg-n-4/30 dark:bg-white/10 rounded-full overflow-hidden">
                                                    <div
                                                        className={`h-full rounded-full transition-all ${barColor(i)}`}
                                                        style={{
                                                            width: `${(s.total / maxTotal) * 100}%`,
                                                        }}
                                                    />
                                                </div>
                                                <span className="shrink-0 text-[0.6875rem] text-n-3 dark:text-white/40 tabular-nums w-8 text-right">
                                                    {pct}%
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                        <div className="px-5 py-3 border-t border-n-1 dark:border-white flex items-center justify-between mt-auto">
                            <span className="text-xs font-bold text-n-3 dark:text-white/50">
                                Всего за период
                            </span>
                            <span className="text-h6 tabular-nums">
                                {grandTotal.toLocaleString("ru-RU")} ₽
                            </span>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default IncomeByStudents;
