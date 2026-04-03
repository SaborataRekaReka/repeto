import {
    ComposedChart,
    Bar,
    XAxis,
    YAxis,
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

    return (
        <div className="pt-6 pl-0 pr-5 pb-4.5">
            <div className="-ml-2 h-[19.4rem]">
                <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart
                        layout="vertical"
                        width={500}
                        height={300}
                        data={items}
                        margin={{
                            top: 0,
                            right: 2,
                            left: 0,
                            bottom: 0,
                        }}
                        barSize={6}
                    >
                        <CartesianGrid
                            horizontal={false}
                            strokeDasharray="3 3"
                            stroke={isDarkMode ? "#FFF" : "#000"}
                        />
                        <XAxis
                            type="number"
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
                            dataKey="name"
                            type="category"
                            tickLine={false}
                            axisLine={false}
                            tick={{
                                fontSize: 12,
                                fontWeight: "500",
                                fill: isDarkMode ? "#FFF" : "#000",
                            }}
                            // dy={10}
                        />
                        <Bar
                            dataKey="price"
                            fill="#AE7AFF"
                            background={{ fill: "#EFE4FF" }}
                        />
                    </ComposedChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};

export default Chart;
