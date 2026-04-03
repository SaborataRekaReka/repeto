import Users from "@/components/Users";

import { statisticsProjects } from "@/mocks/dashboard";

type StatisticsProps = {};

const Statistics = ({}: StatisticsProps) => (
    <div className="flex -mx-2.5 lg:block lg:mx-0">
        {statisticsProjects.map((item) => (
            <div
                className="w-[calc(33.333%-1.25rem)] mx-2.5 p-5 card lg:w-full lg:mx-0 lg:mb-4 lg:last:mb-0"
                key={item.id}
            >
                <div className="mb-5 text-h6 lg:mb-3">{item.title}</div>
                <div className="flex justify-between mb-1.5 text-sm">
                    <div>Progress</div>
                    <div className="font-bold">{item.progress}%</div>
                </div>
                <div
                    className="relative w-full h-1 mb-8 lg:mb-5"
                    style={{ backgroundColor: item.colorProgress }}
                >
                    <div
                        className="absolute left-0 top-0 bottom-0 bg-n-1/30"
                        style={{ width: item.progress + "%" }}
                    ></div>
                </div>
                <div className="flex justify-between items-center">
                    <div className="label-stroke min-w-[6rem]">{item.date}</div>
                    <Users items={item.users} />
                </div>
            </div>
        ))}
    </div>
);

export default Statistics;
