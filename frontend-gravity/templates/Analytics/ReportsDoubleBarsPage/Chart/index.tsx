import {
    BarChart,
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
                    <BarChart
                        width={500}
                        height={300}
                        data={items}
                        margin={{
                            top: 2,
                            right: 0,
                            left: 0,
                            bottom: 0,
                        }}
                        barGap={6}
                        barSize={6}
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
                        <Bar dataKey="pricePurple" fill="#AE7AFF" />
                        <Bar dataKey="priceGreen" fill="#98E9AB" />
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};

export default Chart;
