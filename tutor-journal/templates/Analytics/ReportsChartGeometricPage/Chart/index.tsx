import {
    ComposedChart,
    Area,
    XAxis,
    YAxis,
    Tooltip,
    CartesianGrid,
    ResponsiveContainer,
} from "recharts";
import { useColorMode } from "@chakra-ui/color-mode";

type ChartProps = {
    items: any;
};

const Chart = ({ items }: ChartProps) => {
    const { colorMode } = useColorMode();
    const isDarkMode = colorMode === "dark";

    const CustomTooltip = ({ active, payload, label }: any) => {
        if (active && payload && payload.length) {
            return (
                <div className="px-3 py-2 border border-n-1 bg-white shadow-primary-4 dark:bg-n-1 dark:border-white">
                    <div className="mb-1 text-xs text-n-3 dark:text-white/75">
                        {label}
                    </div>
                    <div className="text-sm">
                        Purple{" "}
                        <span className="font-bold">${payload[0].value}</span>
                    </div>
                    <div className="text-sm">
                        Green{" "}
                        <span className="font-bold">${payload[1].value}</span>
                    </div>
                </div>
            );
        }

        return null;
    };

    return (
        <div className="pt-6 pl-0 pr-5 pb-4.5">
            <div className="-ml-2 h-[19.13rem]">
                <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart
                        width={500}
                        height={400}
                        data={items}
                        margin={{
                            top: 2,
                            right: 0,
                            bottom: 0,
                            left: 0,
                        }}
                    >
                        <CartesianGrid
                            vertical={false}
                            strokeDasharray="3 3"
                            stroke={isDarkMode ? "#FFF" : "#000"}
                        />
                        <XAxis
                            dataKey="name"
                            tickLine={false}
                            axisLine={false}
                            tick={{
                                fontSize: 14,
                                fontWeight: "700",
                                fill: isDarkMode ? "#FFF" : "#000",
                            }}
                            dy={10}
                        />
                        <YAxis
                            type="number"
                            tickLine={false}
                            axisLine={false}
                            tick={{
                                fontSize: 12,
                                fontWeight: "500",
                                fill: isDarkMode ? "#FFF" : "#000",
                            }}
                        />
                        <Tooltip
                            content={<CustomTooltip />}
                            cursor={{
                                stroke: "#828282",
                                strokeWidth: 1,
                                strokeDasharray: "3 3",
                                fill: "transparent",
                            }}
                            wrapperStyle={{ outline: "none" }}
                        />
                        <Area
                            type="linear"
                            dataKey="pricePurple"
                            fill="#8884d8"
                            fillOpacity="0.1"
                            stroke="#8884d8"
                            strokeWidth={2}
                        />
                        <Area
                            type="linear"
                            dataKey="priceGreen"
                            fill="#98E9AB"
                            fillOpacity="0.1"
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
