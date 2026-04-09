import {
    ComposedChart,
    Area,
    Tooltip,
    ResponsiveContainer,
    XAxis,
    YAxis,
} from "recharts";

type ChartType = {
    name: string;
    price: number;
};

type ChartProps = {
    items: ChartType[];
};

const Chart = ({ items }: ChartProps) => {
    const CustomTooltip = ({ active, payload, label }: any) => {
        if (active && payload && payload.length) {
            return (
                <div className="px-3 py-2 border border-n-1 bg-white shadow-primary-4 focus-visible:outline-transparent dark:border-white dark:bg-n-1">
                    <div className="mb-1 text-xs text-n-3 dark:text-white/75">
                        {label}
                    </div>
                    <div className="font-bold">${payload[0].value}</div>
                </div>
            );
        }

        return null;
    };

    return (
        <div className="">
            <div className="h-[13.75rem] mb-4">
                <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart
                        width={500}
                        height={400}
                        data={items}
                        margin={{
                            top: 0,
                            right: 0,
                            bottom: 0,
                            left: 0,
                        }}
                    >
                        <Tooltip
                            content={<CustomTooltip />}
                            cursor={{
                                stroke: "#828282",
                                strokeWidth: 1,
                                strokeDasharray: "6 6",
                                fill: "transparent",
                            }}
                            wrapperStyle={{ outline: "none" }}
                        />
                        <XAxis dataKey="name" hide={true} />
                        <YAxis dataKey="price" hide={true} />
                        <Area
                            type="linear"
                            dataKey="price"
                            fill="#98E9AB"
                            fillOpacity="0.2"
                            stroke="#98E9AB"
                            strokeWidth={2}
                        />
                    </ComposedChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};

export default Chart;
