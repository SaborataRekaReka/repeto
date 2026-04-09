import { useState } from "react";
import Icon from "@/components/Icon";
import Tabs from "@/components/Tabs";

import { statistics } from "@/mocks/profile";

type StatisticsProps = {};

const Statistics = ({}: StatisticsProps) => {
    const [duration, setDuration] = useState<string>("month");

    const durations = [
        {
            title: "Month",
            value: "month",
        },
        {
            title: "Week",
            value: "week",
        },
        {
            title: "Day",
            value: "day",
        },
    ];

    return (
        <div className="mb-8">
            <div className="flex justify-between items-center mb-4 md:block">
                <Tabs
                    className="md:ml-0"
                    classButton="md:ml-0 md:flex-1"
                    items={durations}
                    value={duration}
                    setValue={setDuration}
                />
                <button className="btn-stroke btn-small min-w-[6rem] md:hidden">
                    <Icon
                        className="icon-18 mr-1.5 fill-inherit"
                        name="report"
                    />
                    <span>Report</span>
                </button>
            </div>
            <div className="flex -mx-2.5 md:block md:mx-0">
                {statistics.map((item) => (
                    <div
                        className="flex items-center w-[calc(50%-1.25rem)] mx-2.5 pl-5 pr-7 py-4 card md:w-full md:mx-0 md:mb-4 md:last:mb-0"
                        key={item.id}
                    >
                        <div className="mr-auto">
                            <div className="mb-2.5 text-sm">{item.title}</div>
                            <div className="mb-1 text-h4">
                                {item.counter} Tasks
                            </div>
                            <div
                                className={`flex items-center text-xs font-bold ${
                                    item.percent > 0
                                        ? "text-green-1 fill-green-1"
                                        : "text-pink-1 fill-pink-1"
                                }`}
                            >
                                <Icon
                                    className="mr-1 fill-inherit"
                                    name={
                                        item.percent > 0
                                            ? "arrow-up-right"
                                            : "arrow-down-right"
                                    }
                                />
                                {item.percent > 0
                                    ? "+" + item.percent
                                    : item.percent}
                            </div>
                        </div>
                        <div className="flex space-x-3">
                            {item.parameters.map((parameter, index) => (
                                <div
                                    className="relative w-1 h-[4.82rem] rounded-1"
                                    style={{ backgroundColor: item.color }}
                                    key={index}
                                >
                                    <div
                                        className="absolute left-0 right-0 bottom-0 bg-n-1/30 rounded-1"
                                        style={{ height: parameter + "%" }}
                                    ></div>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default Statistics;
