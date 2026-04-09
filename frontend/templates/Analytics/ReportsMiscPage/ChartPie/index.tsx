import { useEffect, useState } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";

const data = [
    { name: "Yellow", color: "#FAE8A4", value: 400 },
    { name: "Blue", color: "#AE7AFF", value: 300 },
    { name: "Green", color: "#98E9AB", value: 300 },
    { name: "Red", color: "#E99898", value: 200 },
    { name: "Dark Blue", color: "#8B62CC", value: 100 },
];

const COLORS = ["#FAE8A4", "#AE7AFF", "#98E9AB", "#E99898", "#8B62CC"];

const RADIAN = Math.PI / 180;
const renderCustomizedLabel = ({
    cx,
    cy,
    midAngle,
    innerRadius,
    outerRadius,
    percent,
    index,
}: any) => {
    const radius = innerRadius + (outerRadius - innerRadius) * 0.25;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    return (
        <text
            x={x}
            y={y}
            fontSize={12}
            fontWeight={700}
            fill="#fff"
            textAnchor={x > cx ? "start" : "end"}
            dominantBaseline="central"
        >
            {`${(percent * 100).toFixed(0)}%`}
        </text>
    );
};

type ChartPieProps = {};

const ChartPie = ({}: ChartPieProps) => {
    const [domLoaded, setDomLoaded] = useState(false);

    useEffect(() => {
        setDomLoaded(true);
    }, []);

    return (
        <div className="pt-4 px-5 pb-8 md:pt-3 md:pb-5 md:px-3">
            <div className="relative w-[18.75rem] h-[18.75rem] mx-auto mb-7 md:mb-3">
                {domLoaded && (
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart width={290} height={290}>
                            <Pie
                                data={data}
                                cx={145}
                                cy={145}
                                innerRadius={105}
                                outerRadius={139}
                                labelLine={false}
                                label={renderCustomizedLabel}
                                fill="#8884d8"
                                dataKey="value"
                            >
                                {data.map((entry, index) => (
                                    <Cell
                                        key={`cell-${index}`}
                                        fill={COLORS[index % COLORS.length]}
                                    />
                                ))}
                            </Pie>
                        </PieChart>
                    </ResponsiveContainer>
                )}
                <div className="absolute inset-0 flex flex-col justify-center items-center">
                    <div className="text-h3">$80,720.50</div>
                    <div className="text-sm font-medium">from all accounts</div>
                </div>
            </div>
            <div className="flex flex-wrap justify-center -mt-2 -mx-5 2xl:-mx-2">
                {data.map((item: any, index: number) => (
                    <div
                        className="flex items-center mt-3 mx-5 text-xs font-bold 2xl:mx-2"
                        key={index}
                    >
                        <div
                            className="w-2 h-2 mr-1.5 rounded-full"
                            style={{ backgroundColor: item.color }}
                        ></div>
                        {item.name}
                    </div>
                ))}
            </div>
        </div>
    );
};

export default ChartPie;
