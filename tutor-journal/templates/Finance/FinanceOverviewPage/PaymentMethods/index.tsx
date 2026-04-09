import { useEffect, useState } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import { usePaymentMethods } from "@/hooks/usePayments";

const RADIAN = Math.PI / 180;
const renderCustomizedLabel = ({
    cx,
    cy,
    midAngle,
    innerRadius,
    outerRadius,
    percent,
}: any) => {
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    return percent > 0.05 ? (
        <text
            x={x}
            y={y}
            fontSize={12}
            fontWeight={700}
            fill="#fff"
            textAnchor="middle"
            dominantBaseline="central"
        >
            {`${(percent * 100).toFixed(0)}%`}
        </text>
    ) : null;
};

const PaymentMethods = () => {
    const [domLoaded, setDomLoaded] = useState(false);
    useEffect(() => setDomLoaded(true), []);
    const { data: paymentMethodsData = [] } = usePaymentMethods();
    const total = paymentMethodsData.reduce((s: number, d: any) => s + (d.value || 0), 0);

    return (
        <div className="card h-full">
            <div className="card-head">
                <div className="text-h6">Способы оплаты</div>
            </div>
            <div className="pt-4 px-5 pb-5">
                <div className="relative w-[14rem] h-[14rem] mx-auto mb-5">
                    {domLoaded && (
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={paymentMethodsData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={65}
                                    outerRadius={95}
                                    labelLine={false}
                                    label={renderCustomizedLabel}
                                    dataKey="value"
                                    stroke="none"
                                >
                                    {paymentMethodsData.map((entry, i) => (
                                        <Cell key={i} fill={entry.color} />
                                    ))}
                                </Pie>
                            </PieChart>
                        </ResponsiveContainer>
                    )}
                    <div className="absolute inset-0 flex flex-col justify-center items-center pointer-events-none">
                        <div className="text-h4">
                            {total.toLocaleString("ru-RU")} ₽
                        </div>
                        <div className="text-xs font-medium text-n-3 dark:text-white/50">
                            всего получено
                        </div>
                    </div>
                </div>
                <div className="flex flex-wrap justify-center gap-x-5 gap-y-2">
                    {paymentMethodsData.map((item, i) => (
                        <div
                            className="flex items-center text-xs font-bold"
                            key={i}
                        >
                            <div
                                className="w-2 h-2 mr-1.5 rounded-full"
                                style={{ backgroundColor: item.color }}
                            />
                            {item.name}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default PaymentMethods;
