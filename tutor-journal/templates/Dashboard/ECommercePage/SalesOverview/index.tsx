import {
    ComposedChart,
    Line,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    ResponsiveContainer,
} from "recharts";
import millify from "millify";
import { useColorMode } from "@chakra-ui/color-mode";
import Icon from "@/components/Icon";

import { salesOverview } from "@/mocks/dashboard";

type SalesOverviewProps = {};

const SalesOverview = ({}: SalesOverviewProps) => {
    const formatterYAxis = (value: number) => {
        if (value === 0) {
            return "";
        }
        return `${millify(value)}`;
    };

    const { colorMode } = useColorMode();
    const isDarkMode = colorMode === "dark";

    return (
        <div className="card">
            <div className="card-head">
                <div className="mr-auto text-h6">Sales Overview</div>
                <div className="flex mr-5 md:flex-col">
                    <div className="flex items-center mr-5 text-xs font-bold md:mr-0">
                        <div className="w-2 h-2 mr-1.5 rounded-full bg-purple-1"></div>
                        Customers
                    </div>
                    <div className="flex items-center text-xs font-bold">
                        <div className="w-2 h-2 mr-1.5 rounded-full bg-green-1"></div>
                        Sales
                    </div>
                </div>
                <button className="transition-colors text-0 hover:fill-purple-1 dark:fill-white dark:hover:fill-purple-1">
                    <Icon className="icon-18 fill-inherit" name="calendar" />
                </button>
            </div>
            <div className="py-4 pr-5">
                <div className="h-[16.4rem]">
                    <ResponsiveContainer width="100%" height="100%">
                        <ComposedChart
                            width={500}
                            height={400}
                            data={salesOverview}
                            margin={{
                                top: 2,
                                right: 0,
                                bottom: 0,
                                left: 0,
                            }}
                            barGap={8}
                        >
                            <CartesianGrid
                                vertical={false}
                                strokeDasharray="3 3"
                                stroke={isDarkMode ? "#FFF" : "#000"}
                            />
                            <XAxis
                                dataKey="name"
                                tickLine={false}
                                tick={{
                                    fontSize: 12,
                                    fontWeight: "700",
                                    fill: isDarkMode ? "#FFF" : "#000",
                                }}
                                dy={5}
                            />
                            <YAxis
                                tickFormatter={formatterYAxis}
                                type="number"
                                tickLine={false}
                                axisLine={false}
                                tick={{
                                    fontSize: 12,
                                    fontWeight: "500",
                                    fill: isDarkMode ? "#FFF" : "#000",
                                }}
                            />
                            <Bar
                                barSize={4}
                                dataKey="customers"
                                fill="#AE7AFF"
                                radius={[2, 2, 0, 0]}
                            />
                            <Bar
                                barSize={4}
                                dataKey="sales"
                                fill="#98E9AB"
                                radius={[2, 2, 0, 0]}
                            />
                            <Line
                                type="linear"
                                dataKey="parameter"
                                stroke="#FAE8A4"
                                strokeWidth={4}
                                dot={{
                                    stroke: "transparent",
                                    fill: "transparent",
                                }}
                            />
                        </ComposedChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    );
};

export default SalesOverview;
