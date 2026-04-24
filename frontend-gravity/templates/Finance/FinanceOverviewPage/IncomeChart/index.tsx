import { useState, useMemo } from "react";
import CardChart from "@/components/CardChart";
import { useFinanceChart } from "@/hooks/usePayments";

const legend = [
    { title: "Получено", color: "var(--chart-success)" },
    { title: "Запланировано", color: "var(--chart-brand)" },
];

const periodMap: Record<string, "month" | "quarter" | "year"> = {
    "Месяц": "month",
    "Квартал": "quarter",
    "Год": "year",
};

const periodLabels = ["Месяц", "Квартал", "Год"];

const IncomeChart = () => {
    const [selectedPeriod, setSelectedPeriod] = useState("Месяц");
    const { data: chartData = [], loading } = useFinanceChart(
        periodMap[selectedPeriod] || "month"
    );

    const received = useMemo(
        () => chartData.reduce((s, r) => s + (r.received || 0), 0),
        [chartData]
    );
    const expected = useMemo(
        () => chartData.reduce((s, r) => s + (r.expected || 0), 0),
        [chartData]
    );
    const total = received + expected;

    return (
        <CardChart
            className="h-full flex flex-col"
            title="Доход"
            legend={legend}
            months={periodLabels}
            selectedMonth={selectedPeriod}
            onMonthChange={setSelectedPeriod}
        >
            <div className="px-5 pt-5 pb-2 flex-1 flex flex-col">
                {loading ? (
                    <div className="py-8 text-center text-n-3">
                        Загрузка...
                    </div>
                ) : (
                    <>
                        <div className="flex flex-col gap-5">
                            {/* Получено */}
                            <div>
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-xs font-bold text-n-3 dark:text-white/50">
                                        Получено
                                    </span>
                                    <span className="text-sm font-bold">
                                        {received.toLocaleString("ru-RU")} ₽
                                    </span>
                                </div>
                                <div className="h-2 bg-n-4/30 dark:bg-white/10 rounded-sm overflow-hidden">
                                    <div
                                        className="h-full rounded-sm transition-all"
                                        style={{
                                            background: "var(--finance-income)",
                                            width:
                                                total > 0
                                                    ? `${(received / total) * 100}%`
                                                    : "0%",
                                        }}
                                    />
                                </div>
                            </div>
                            {/* Запланировано */}
                            <div>
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-xs font-bold text-n-3 dark:text-white/50">
                                        Запланировано
                                    </span>
                                    <span className="text-sm font-bold">
                                        {expected.toLocaleString("ru-RU")} ₽
                                    </span>
                                </div>
                                <div className="h-2 bg-n-4/30 dark:bg-white/10 rounded-sm overflow-hidden">
                                    <div
                                        className="h-full rounded-sm transition-all"
                                        style={{
                                            background: "var(--finance-planned)",
                                            width:
                                                total > 0
                                                    ? `${(expected / total) * 100}%`
                                                    : "0%",
                                        }}
                                    />
                                </div>
                            </div>
                        </div>
                        <div className="mt-5 pt-4 border-t border-dashed border-n-1 dark:border-white flex items-center justify-between">
                            <span className="text-sm text-n-3 dark:text-white/50">
                                Итого за период
                            </span>
                            <span className="text-h5">
                                {total.toLocaleString("ru-RU")} ₽
                            </span>
                        </div>
                    </>
                )}
            </div>
        </CardChart>
    );
};

export default IncomeChart;
