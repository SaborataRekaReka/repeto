import Task from "../Task";

type WeekProps = {};

import { week } from "@/mocks/calendar";

const Week = ({}: WeekProps) => {
    const classTitleTime = `flex items-end justify-center w-12 h-8 py-0.5 border-b border-r border-n-1 text-sm font-medium dark:border-white/40`;
    const classValueTime = `h-8 px-3 py-1 border-b border-r border-n-1 lg:px-1 dark:border-white/40`;

    return (
        <div className="card">
            <div className="flex pl-12 border-b border-n-1 dark:border-white/40">
                <div className="w-[calc(100%/7)] pt-5 px-3 pb-3 text-right text-xs font-bold md:px-2 md:text-center">
                    Mon, 3
                </div>
                <div className="w-[calc(100%/7)] pt-5 px-3 pb-3 text-right text-xs font-bold md:px-2 md:text-center">
                    Tue, 4
                </div>
                <div className="w-[calc(100%/7)] pt-5 px-3 pb-3 text-right text-xs font-bold md:px-2 md:text-center">
                    Wed, 5
                </div>
                <div className="w-[calc(100%/7)] pt-5 px-3 pb-3 text-right text-xs font-bold md:px-2 md:text-center">
                    Thu, 6
                </div>
                <div className="w-[calc(100%/7)] pt-5 px-3 pb-3 text-right text-xs font-bold md:px-2 md:text-center">
                    Fri, 7
                </div>
                <div className="w-[calc(100%/7)] pt-5 px-3 pb-3 text-right text-xs font-bold md:px-2 md:text-center">
                    Sat, 8
                </div>
                <div className="w-[calc(100%/7)] pt-5 px-3 pb-3 text-right text-xs font-bold md:px-2 md:text-center">
                    Sun, 9
                </div>
            </div>
            <div className="flex -mr-0.25 -mb-0.25">
                <div className="w-12">
                    <div className={classTitleTime}>7am</div>
                    <div className={classTitleTime}></div>
                    <div className={classTitleTime}>8am</div>
                    <div className={classTitleTime}></div>
                    <div className={classTitleTime}>9am</div>
                    <div className={classTitleTime}></div>
                    <div className={classTitleTime}>10am</div>
                    <div className={classTitleTime}></div>
                    <div className={classTitleTime}>11am</div>
                    <div className={classTitleTime}></div>
                    <div className={classTitleTime}>12am</div>
                    <div className={classTitleTime}></div>
                    <div className={classTitleTime}>13am</div>
                    <div className={classTitleTime}></div>
                    <div className={classTitleTime}>1pm</div>
                    <div className={classTitleTime}></div>
                    <div className={classTitleTime}>2pm</div>
                    <div className={classTitleTime}></div>
                </div>
                <div className="flex w-[calc(100%-3rem)]">
                    {week.map((item: any, index: number) => (
                        <div className="w-[calc(100%/7)]" key={index}>
                            {item.hours.map((hour: any, index: number) => (
                                <div className={classValueTime} key={index}>
                                    {hour.task && (
                                        <Task
                                            className="md:justify-center md:h-6 md:px-0"
                                            classTitle="md:hidden"
                                            item={hour.task}
                                        />
                                    )}
                                </div>
                            ))}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default Week;
