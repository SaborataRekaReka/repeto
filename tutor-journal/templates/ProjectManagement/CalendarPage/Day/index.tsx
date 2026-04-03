import Task from "../Task";

type DayProps = {};

import { week } from "@/mocks/calendar";

const Day = ({}: DayProps) => {
    const classTitleTime = `flex items-end justify-center w-12 h-8 py-0.5 border-b border-r border-n-1 text-sm font-medium dark:border-white/40`;
    const classValueTime = `h-8 px-3 py-1 border-b border-r border-n-1 dark:border-white/40`;

    return (
        <div className="card">
            <div className="border-r border-b border-n-1 pt-5 px-3 pb-3 text-center text-xs font-bold -mr-0.25 dark:border-white/40">
                Monday, 3
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
                {week.slice(0, 1).map((item: any, index: number) => (
                    <div className="grow" key={index}>
                        {item.hours.map((hour: any, index: number) => (
                            <div className={classValueTime} key={index}>
                                {hour.task && (
                                    <Task time={hour.time} item={hour.task} />
                                )}
                            </div>
                        ))}
                    </div>
                ))}
            </div>
        </div>
    );
};

export default Day;
