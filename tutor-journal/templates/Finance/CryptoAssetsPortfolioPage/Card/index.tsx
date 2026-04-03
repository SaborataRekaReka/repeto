import { AreaChart, Area, XAxis, YAxis, ResponsiveContainer } from "recharts";
import Icon from "@/components/Icon";
import Image from "@/components/Image";

type CardProps = {
    item: any;
};

const Card = ({ item }: CardProps) => (
    <div className="flex justify-between items-end -ml-0.25 px-5 py-4 card">
        <div className="mr-4">
            <div className="flex items-center mb-6 text-sm">
                <div className="flex items-center">
                    <div className="w-4.5 mr-1.5 text-0 rounded-full dark:bg-white">
                        <Image
                            className="w-full"
                            src={item.currencyLogo}
                            width={18}
                            height={18}
                            alt={item.currencyTitle}
                        />
                    </div>
                    <div className="mr-1 font-bold">{item.currencyTitle}</div>
                    <div className="font-medium text-n-3 dark:text-white/75">
                        {item.currencyInfo}
                    </div>
                </div>
            </div>
            <div className="text-h4">${item.price}</div>
            <div
                className={`flex items-center text-sm font-bold ${
                    item.progress > 0 ? "text-green-1" : "text-pink-1"
                }`}
            >
                <Icon
                    className={`mr-1 ${
                        item.progress > 0 ? "fill-green-1" : "fill-pink-1"
                    }`}
                    name={
                        item.progress > 0
                            ? "arrow-up-right"
                            : "arrow-down-right"
                    }
                />
                {item.progress > 0 ? "+" + item.progress : item.progress}%
            </div>
        </div>
        <div className="grow max-w-[8.25rem] h-16 my-1 ml-auto">
            <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                    width={500}
                    height={400}
                    data={item.data}
                    margin={{
                        top: 2,
                        right: 0,
                        left: 0,
                        bottom: 0,
                    }}
                >
                    <defs>
                        <linearGradient
                            id={item.id}
                            x1="0"
                            y1="0"
                            x2="0"
                            y2="1"
                        >
                            <stop
                                offset="1%"
                                stopColor={item.colorChart}
                                stopOpacity={0.6}
                            />
                            <stop
                                offset="50%"
                                stopColor={item.colorChart}
                                stopOpacity={0.2}
                            />
                            <stop
                                offset="95%"
                                stopColor={item.colorChart}
                                stopOpacity={0}
                            />
                        </linearGradient>
                    </defs>
                    <XAxis dataKey="name" hide={true} />
                    <YAxis hide={true} />
                    <Area
                        type="monotone"
                        dataKey="price"
                        stroke={item.colorChart}
                        strokeWidth={2}
                        fillOpacity={1}
                        fill={`url(#${item.id})`}
                    />
                </AreaChart>
            </ResponsiveContainer>
        </div>
    </div>
);

export default Card;
