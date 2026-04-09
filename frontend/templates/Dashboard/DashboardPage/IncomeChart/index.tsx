import { useState, useMemo } from "react";
import CardChart from "@/components/CardChart";
import { useIncomeChart } from "@/hooks/useDashboard";

const legend = [
    { title: "Получено", color: "#98E9AB" },
    { title: "Запланировано", color: "#FAE8A4" },
];

const periodMap: Record<string, "month" | "quarter" | "year"> = {
    "Месяц": "month",
    "Квартал": "quarter",
    "Год": "year",
};

const periodLabels = ["Месяц", "Квартал", "Год"];

const IncomeChart = () => {
    const [selectedPeriod, setSelectedPeriod] = useState("Месяц");
    const { data: incomeChartData = [], loading } = useIncomeChart(
        periodMap[selectedPeriod] || "month"
    );

    const received = useMemo(
        () => incomeChartData.reduce((s, w) => s + (w.received || 0), 0),
        [incomeChartData]
    );
    const expected = useMemo(
        () => incomeChartData.reduce((s, w) => s + (w.expected || 0), 0),
        [incomeChartData]
    );
    const total = received + expected;
    const receivedPct = total > 0 ? (received / total) * 100 : 0;
    const expectedPct = total > 0 ? (expected / total) * 100 : 0;

    return (
        <CardChart
            className="mb-5"
            title="Доход"
            legend={legend}
            months={periodLabels}
            selectedMonth={selectedPeriod}
            onMonthChange={setSelectedPeriod}
        >
        <div className="px-5 pt-6 pb-5">
            {loading ? (
                <div className="py-8 text-center text-n-3">Загрузка...</div>
            ) : (
            <>
            <div className="flex h-3 rounded-sm overflow-hidden">
                {received > 0 && (
                    <div
                        className="h-full bg-green-1"
                        style={{ width: receivedPct + "%" }}
                    />
                )}
                {expected > 0 && (
                    <div
                        className="h-full bg-yellow-1"
                        style={{ width: expectedPct + "%" }}
                    />
                )}
                {total === 0 && (
                    <div className="h-full w-full bg-n-4/50 dark:bg-white/10" />
                )}
            </div>

            <div className="flex items-center justify-between mt-3 text-xs">
                {received > 0 && (
                    <span className="text-n-3 dark:text-white/50">
                        Получено:{" "}
                        <span className="font-bold text-n-1 dark:text-white">
                            {received.toLocaleString("ru-RU")} ₽
                        </span>
                    </span>
                )}
                {expected > 0 && (
                    <span className="text-n-3 dark:text-white/50">
                        Запланировано:{" "}
                        <span className="font-bold text-n-1 dark:text-white">
                            {expected.toLocaleString("ru-RU")} ₽
                        </span>
                    </span>
                )}
            </div>

            <div className="mt-4 pt-4 border-t border-dashed border-n-1 dark:border-white flex items-center justify-between">
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
