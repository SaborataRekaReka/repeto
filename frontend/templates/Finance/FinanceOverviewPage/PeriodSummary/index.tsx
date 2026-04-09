import { useState } from "react";
import { useFinanceSummary } from "@/hooks/usePayments";

const periodMap: Record<string, "month" | "quarter" | "year"> = {
    "Месяц": "month",
    "Квартал": "quarter",
    "Год": "year",
};

const periodLabels = ["Месяц", "Квартал", "Год"];

type MetricItem = {
    label: string;
    value: string;
};

function buildMetrics(data: {
    completedLessons: number;
    cancelledLessons: number;
    cancellationRate: number;
    avgRate: number;
    paymentsCount: number;
    avgPayment: number;
}): MetricItem[] {
    return [
        { label: "Уроков проведено", value: String(data.completedLessons) },
        { label: "Средняя ставка", value: `${data.avgRate.toLocaleString("ru-RU")} ₽` },
        { label: "Платежей", value: String(data.paymentsCount) },
        { label: "Средний платёж", value: `${data.avgPayment.toLocaleString("ru-RU")} ₽` },
        { label: "Отмены / неявки", value: String(data.cancelledLessons) },
        { label: "Процент отмен", value: `${data.cancellationRate}%` },
    ];
}

const emptyData = {
    completedLessons: 0,
    cancelledLessons: 0,
    cancellationRate: 0,
    avgRate: 0,
    paymentsCount: 0,
    avgPayment: 0,
};

const PeriodSummary = () => {
    const [period, setPeriod] = useState("Месяц");
    const { data, loading } = useFinanceSummary(periodMap[period] || "month");

    const items = buildMetrics(data || emptyData);

    return (
        <div className="card h-full flex flex-col">
            <div className="card-head">
                <div className="mr-auto text-h6">Сводка за период</div>
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
            <div className="flex-1">
                {loading ? (
                    <div className="flex items-center justify-center h-full text-n-3">
                        Загрузка...
                    </div>
                ) : (
                    <div className="grid grid-cols-2 h-full">
                        {items.map((item, index) => {
                            const isLastRow = index >= items.length - 2;
                            const isRight = index % 2 === 1;
                            return (
                                <div
                                    key={item.label}
                                    className={[
                                        "px-5 py-4 flex flex-col justify-center",
                                        !isLastRow
                                            ? "border-b border-dashed border-n-1 dark:border-white"
                                            : "",
                                        !isRight
                                            ? "border-r border-dashed border-n-1 dark:border-white"
                                            : "",
                                    ]
                                        .filter(Boolean)
                                        .join(" ")}
                                >
                                    <div className="text-[0.6875rem] font-bold uppercase tracking-[0.08em] text-n-3 dark:text-white/50 mb-1">
                                        {item.label}
                                    </div>
                                    <div className="text-h5">{item.value}</div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
};

export default PeriodSummary;
