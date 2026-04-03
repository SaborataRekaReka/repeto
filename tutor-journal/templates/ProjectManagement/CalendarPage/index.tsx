import { useState } from "react";
import Layout from "@/components/Layout";
import Icon from "@/components/Icon";
import Tabs from "@/components/Tabs";
import Month from "./Month";
import Week from "./Week";
import Day from "./Day";

const CalendarPage = () => {
    const [type, setType] = useState<string>("month");

    const types = [
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
        <Layout title="Calendar">
            <div className="relative flex mb-6 lg:flex-wrap md:mb-5">
                <Tabs
                    className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 lg:static lg:w-full lg:translate-x-0 lg:translate-y-0 lg:ml-0 lg:mb-4"
                    classButton="lg:ml-0 lg:flex-1"
                    items={types}
                    value={type}
                    setValue={setType}
                />
                <div className="flex items-center md:w-full md:justify-between">
                    <button className="btn-stroke btn-square btn-small mr-1 md:mr-0">
                        <Icon name="arrow-prev" />
                    </button>
                    <button className="btn-stroke btn-square btn-small md:order-3">
                        <Icon name="arrow-next" />
                    </button>
                    <div className="ml-4.5 text-h6 md:ml-0">
                        {type === "month"
                            ? "September 2022"
                            : type === "week"
                            ? "September 3 - 9, 2022"
                            : "September 3, 2022"}
                    </div>
                </div>
                <button className="btn-stroke btn-small ml-auto md:hidden">
                    <Icon name="filters" />
                    <span>Sort: A-Z</span>
                </button>
            </div>
            {type === "month" && <Month />}
            {type === "week" && <Week />}
            {type === "day" && <Day />}
        </Layout>
    );
};

export default CalendarPage;
