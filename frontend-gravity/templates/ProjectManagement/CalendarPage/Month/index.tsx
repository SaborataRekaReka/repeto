import Icon from "@/components/Icon";
import Task from "../Task";

type MonthProps = {};

import { month } from "@/mocks/calendar";

const Month = ({}: MonthProps) => (
    <div className="card">
        <div className="flex -mr-0.25 border-r border-n-1 dark:border-white/40">
            <div className="w-[calc(100%/7)] pt-5 px-3 pb-3 text-right text-xs font-bold md:text-center">
                Mon
            </div>
            <div className="w-[calc(100%/7)] pt-5 px-3 pb-3 text-right text-xs font-bold md:text-center">
                Tue
            </div>
            <div className="w-[calc(100%/7)] pt-5 px-3 pb-3 text-right text-xs font-bold md:text-center">
                Wed
            </div>
            <div className="w-[calc(100%/7)] pt-5 px-3 pb-3 text-right text-xs font-bold md:text-center">
                Thu
            </div>
            <div className="w-[calc(100%/7)] pt-5 px-3 pb-3 text-right text-xs font-bold md:text-center">
                Fri
            </div>
            <div className="w-[calc(100%/7)] pt-5 px-3 pb-3 text-right text-xs font-bold md:text-center">
                Sat
            </div>
            <div className="w-[calc(100%/7)] pt-5 px-3 pb-3 text-right text-xs font-bold md:text-center">
                Sun
            </div>
        </div>
        <div className="flex flex-wrap -mr-0.25">
            {month.map((item: any, index: number) => (
                <div
                    className="w-[calc(100%/7)] h-[8.125rem] pt-2 px-3 pb-4 border-r border-t border-n-1 lg:h-[7.6rem] md:h-[7.6rem] md:px-0 md:text-center dark:border-white/40"
                    key={index}
                >
                    <div
                        className={`mb-1 text-right text-sm font-medium text-n-3 md:text-center dark:text-white/50 ${
                            item.month === "September" &&
                            "!text-n-1 dark:!text-white"
                        }`}
                    >
                        {item.day}
                    </div>
                    {item.tasks &&
                        item.tasks
                            .slice(0, 2)
                            .map((task: any) => (
                                <Task
                                    className="mb-1 lg:h-5 lg:bg-transparent lg:p-0 md:w-full md:h-6 md:mb-1 md:justify-center dark:lg:bg-transparent"
                                    classTitle="md:hidden"
                                    item={task}
                                    key={task.id}
                                />
                            ))}
                    {item.tasks?.length > 2 && (
                        <button className="group inline-flex items-center mt-1 px-1 text-xs font-bold transition-colors hover:text-purple-1 lg:-ml-1 lg:px-0 md:text-0 md:mt-0.5 md:ml-0">
                            <Icon
                                className="mr-1 transition-colors dark:fill-white group-hover:fill-purple-1 md:mr-0"
                                name="dots-vertical"
                            />
                            More<span className="ml-1 lg:hidden"> events</span>
                        </button>
                    )}
                </div>
            ))}
        </div>
    </div>
);

export default Month;
