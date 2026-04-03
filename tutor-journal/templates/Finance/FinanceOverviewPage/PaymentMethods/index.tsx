import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import { paymentMethodsData } from "@/mocks/finance-tutor";

const total = paymentMethodsData.reduce((s, d) => s + d.value, 0);

const PaymentMethods = () => (
    <div className="card">
        <div className="card-head">
            <div className="text-h6">Способы оплаты</div>
        </div>
        <div className="px-5 pb-5">
            <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                    <Pie
                        data={paymentMethodsData}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={80}
                        dataKey="value"
                        stroke="none"
                    >
                        {paymentMethodsData.map((entry, i) => (
                            <Cell key={i} fill={entry.color} />
                        ))}
                    </Pie>
                </PieChart>
            </ResponsiveContainer>
            <div className="flex flex-col gap-2 mt-3">
                {paymentMethodsData.map((item, i) => (
                    <div
                        className="flex items-center justify-between text-sm"
                        key={i}
                    >
                        <div className="flex items-center">
                            <div
                                className="w-2.5 h-2.5 mr-2 rounded-full"
                                style={{ backgroundColor: item.color }}
                            />
                            <span className="font-medium">{item.name}</span>
                        </div>
                        <span className="text-n-3 dark:text-white/50">
                            {total > 0
                                ? Math.round((item.value / total) * 100)
                                : 0}
                            %
                        </span>
                    </div>
                ))}
            </div>
        </div>
    </div>
);

export default PaymentMethods;
