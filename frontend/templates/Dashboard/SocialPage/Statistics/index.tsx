import Icon from "@/components/Icon";

import { statisticsSocial } from "@/mocks/dashboard";

type StatisticsProps = {};

const Statistics = ({}: StatisticsProps) => (
    <>
        <div className="flex justify-between items-center mb-3.5">
            <div className="text-h6">Statistics</div>
            <button className="inline-flex items-center font-bold transition-colors hover:text-purple-1 hover:fill-purple-1 dark:fill-white dark:hover:fill-purple-1">
                <Icon className="icon-18 mr-1.5 fill-inherit" name="filters" />
                All projects
            </button>
        </div>
        <div className="flex -mx-2.5 md:block md:mx-0">
            {statisticsSocial.map((item) => (
                <div
                    className="flex w-[calc(33.333%-1.25rem)] mx-2.5 pl-5 pr-7 py-4 card lg:px-4 md:w-full md:px-5 md:mx-0 md:mb-4 md:last:mb-0"
                    key={item.id}
                >
                    <div className="mr-auto">
                        <div className="mb-1.5 text-sm">{item.title}</div>
                        <div className="mb-1.5 text-h4 lg:text-h5 md:text-h4">
                            {item.value}
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
                    <div className="flex space-x-3 lg:space-x-2 md:space-x-3">
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
    </>
);

export default Statistics;
