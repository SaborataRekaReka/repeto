import { useState } from "react";
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    Tooltip,
    ResponsiveContainer,
} from "recharts";
import Icon from "@/components/Icon";
import Tabs from "@/components/Tabs";

import { dataChart } from "@/mocks/finance";

const market = [
    {
        title: "Market Cap",
        value: "$686,732,876,804.40",
        progress: true,
    },
    {
        title: "Trading Volume",
        value: "$53,804,046,563.48",
        progress: false,
    },
];

type DetailsProps = {};

const Details = ({}: DetailsProps) => {
    const [type, setType] = useState<string>("price");
    const [duration, setDuration] = useState<string>("1h");

    const typeTasks = [
        {
            title: "Price",
            value: "price",
        },
        {
            title: "Market Cap",
            value: "market-cap",
        },
        {
            title: "Trading",
            value: "trading",
        },
    ];

    const durations = [
        {
            title: "1H",
            value: "1h",
        },
        {
            title: "24H",
            value: "24h",
        },
        {
            title: "1W",
            value: "1w",
        },
        {
            title: "1M",
            value: "1m",
        },
    ];

    const CustomTooltip = ({ active, payload, label }: any) => {
        if (active && payload && payload.length) {
            return (
                <div className="px-3 py-2 border border-n-1 bg-white shadow-primary-4 dark:border-white dark:bg-n-1">
                    <div className="mb-1 text-xs text-n-3 dark:text-white/75">
                        {label}
                    </div>
                    <div className="text-sm font-bold">${payload[0].value}</div>
                </div>
            );
        }

        return null;
    };

    return (
        <div className="card">
            <div className="card-head md:block md:py-4">
                <div className="text-h6 md:mb-3">$36,581.70</div>
                <div className="flex md:block">
                    {market.map((item, index) => (
                        <div
                            className="mr-4 pr-4 border-r border-dashed border-n-1 text-xs last:mr-0 last:pr-0 last:border-none md:mb-3 md:pb-4 md:border-r-0 md:border-b md:mr-0 md:last:mb-0 md:last:pb-0 dark:border-white"
                            key={index}
                        >
                            <div className="flex items-center mb-0.5">
                                <div className="font-bold">{item.value}</div>
                                <Icon
                                    className={`ml-2 ${
                                        item.progress
                                            ? "fill-green-1"
                                            : "fill-pink-1"
                                    }`}
                                    name={
                                        item.progress
                                            ? "progress-up"
                                            : "progress-down"
                                    }
                                />
                            </div>
                            <div className="font-medium text-n-3 dark:text-white/50">
                                {item.title}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
            <div className="">
                <div className="flex justify-between px-5 py-4 md:block">
                    <Tabs
                        className="md:ml-0"
                        classButton="md:ml-0 md:flex-1"
                        items={typeTasks}
                        value={type}
                        setValue={setType}
                    />
                    <Tabs
                        classButton="!px-3 md:hidden"
                        items={durations}
                        value={duration}
                        setValue={setDuration}
                    />
                </div>
                <div className="h-[16.8rem] pb-6">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart
                            width={500}
                            height={400}
                            data={dataChart}
                            margin={{
                                top: 2,
                                right: 0,
                                left: 0,
                                bottom: 0,
                            }}
                        >
                            <defs>
                                <linearGradient
                                    id="price"
                                    x1="0"
                                    y1="0"
                                    x2="0"
                                    y2="1"
                                >
                                    <stop
                                        offset="1%"
                                        stopColor="#98E9AB"
                                        stopOpacity={0.6}
                                    />
                                    <stop
                                        offset="50%"
                                        stopColor="#98E9AB"
                                        stopOpacity={0.2}
                                    />
                                    <stop
                                        offset="95%"
                                        stopColor="#98E9AB"
                                        stopOpacity={0}
                                    />
                                </linearGradient>
                            </defs>
                            <XAxis
                                dataKey="name"
                                tickLine={false}
                                tick={{
                                    fontSize: 12,
                                    fontWeight: "500",
                                    fill: "#000",
                                }}
                                dy={5}
                                strokeDasharray="3 3"
                            />
                            <YAxis hide={true} />
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
                            <Area
                                type="linear"
                                dataKey="price"
                                stroke="#98E9AB"
                                strokeWidth={2}
                                fillOpacity={1}
                                fill={`url(#price)`}
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    );
};

export default Details;
