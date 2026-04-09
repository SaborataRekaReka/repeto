import {
    Radar,
    RadarChart,
    PolarGrid,
    PolarAngleAxis,
    PolarRadiusAxis,
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
        <div className="pt-6 px-5 pb-4.5 lg:pt-3">
            <div className="h-[25.9rem] md:h-[19rem]">
                <ResponsiveContainer width="100%" height="100%">
                    <RadarChart
                        cx="50%"
                        cy="50%"
                        outerRadius="90%"
                        data={items}
                    >
                        <PolarGrid
                            stroke={
                                isDarkMode
                                    ? "rgba(255,255,255,.4)"
                                    : "rgba(0,0,0,0.4)"
                            }
                            gridType="circle"
                        />
                        <PolarAngleAxis
                            tick={{
                                fontSize: 12,
                                fontWeight: "400",
                                fill: isDarkMode ? "#FFF" : "#000",
                            }}
                            dataKey="subject"
                            dy={5}
                        />
                        <PolarRadiusAxis angle={30} domain={[0, 150]} />
                        <Radar
                            name="Mike"
                            dataKey="A"
                            stroke="#AE7AFF"
                            fill="#AE7AFF"
                            fillOpacity={0.3}
                        />
                        <Radar
                            name="Lily"
                            dataKey="B"
                            stroke="#98E9AB"
                            fill="#98E9AB"
                            fillOpacity={0.3}
                        />
                    </RadarChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};

export default Chart;
