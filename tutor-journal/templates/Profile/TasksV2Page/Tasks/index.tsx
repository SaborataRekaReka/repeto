import { useState } from "react";
import Icon from "@/components/Icon";
import Tabs from "@/components/Tabs";
import Comment from "@/components/Comment";
import Review from "@/components/Review";

import { tasks2 } from "@/mocks/profile";

type TasksProps = {};

const Tasks = ({}: TasksProps) => {
    const [type, setType] = useState<string>("updates");
    const [value, setValue] = useState<string>("");

    const types = [
        {
            title: "Updates",
            value: "updates",
        },
        {
            title: "Tasks",
            value: "tasks",
        },
        {
            title: "Statistics",
            value: "statistics",
        },
    ];

    return (
        <>
            <div className="flex justify-between items-center mb-6 lg:mb-4 md:block">
                <Tabs
                    className="md:ml-0"
                    classButton="md:ml-0 md:flex-1"
                    items={types}
                    value={type}
                    setValue={setType}
                />
                <button className="btn-stroke btn-small min-w-[6rem] md:hidden">
                    <Icon name="report" />
                    <span>Report</span>
                </button>
            </div>
            <Comment
                className="mb-6"
                avatar="/images/avatars/avatar.jpg"
                placeholder="Type to add something"
                value={value}
                setValue={(e: any) => setValue(e.target.value)}
            />
            <div>
                {tasks2.map((task) => (
                    <Review item={task} key={task.id} />
                ))}
            </div>
        </>
    );
};

export default Tasks;
