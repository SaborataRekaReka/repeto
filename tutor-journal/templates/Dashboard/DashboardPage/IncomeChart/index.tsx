import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Legend,
} from "recharts";
import CardChart from "@/components/CardChart";
import { incomeChartData } from "@/mocks/tutorDashboard";

const legend = [
    { title: "Получено", color: "#98E9AB" },
    { title: "Ожидается", color: "#FAE8A4" },
];

const total = incomeChartData.reduce(
    (sum, w) => sum + w.received + w.expected,
    0
);

const IncomeChart = () => (
    <CardChart className="mb-5" title="Доход" legend={legend}>
        <div className="px-5 pt-5 pb-2">
            <ResponsiveContainer width="100%" height={220}>
                <BarChart data={incomeChartData}>
                    <CartesianGrid
                        strokeDasharray="3 3"
                        vertical={false}
                        stroke="#E4E4E4"
                    />
                    <XAxis
                        dataKey="name"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fontSize: 12, fontWeight: 600 }}
                    />
                    <YAxis
                        axisLine={false}
                        tickLine={false}
                        tick={{ fontSize: 12 }}
                        tickFormatter={(v: number) =>
                            v >= 1000 ? `${v / 1000}k` : String(v)
                        }
                    />
                    <Tooltip
                        formatter={(value: number) =>
                            value.toLocaleString("ru-RU") + " ₽"
                        }
                    />
                    <Bar
                        dataKey="received"
                        name="Получено"
                        fill="#98E9AB"
                        radius={[2, 2, 0, 0]}
                    />
                    <Bar
                        dataKey="expected"
                        name="Ожидается"
                        fill="#FAE8A4"
                        radius={[2, 2, 0, 0]}
                    />
                </BarChart>
            </ResponsiveContainer>
        </div>
        <div className="px-5 pb-4 text-sm text-n-3 dark:text-white/50">
            Итого за период:{" "}
            <span className="font-bold text-n-1 dark:text-white">
                {total.toLocaleString("ru-RU")} ₽
            </span>
        </div>
    </CardChart>
);

export default IncomeChart;
