import { useState } from "react";
import Icon from "@/components/Icon";
import Tabs from "@/components/Tabs";
import Task from "./Task";

import { tasks } from "@/mocks/profile";

type TasksProps = {};

const Tasks = ({}: TasksProps) => {
    const [type, setType] = useState<string>("all-tasks");

    const types = [
        {
            title: "All Tasks",
            value: "all-tasks",
        },
        {
            title: "Pending",
            value: "pending",
        },
        {
            title: "Done",
            value: "done",
        },
    ];

    return (
        <>
            <div className="flex justify-between items-center mb-4 md:block">
                <Tabs
                    className="md:ml-0"
                    classButton="md:ml-0 md:flex-1"
                    items={types}
                    value={type}
                    setValue={setType}
                />
                <button className="btn-stroke btn-small min-w-[6rem] md:hidden">
                    <Icon name="filters" />
                    <span>Sort: A-Z</span>
                </button>
            </div>
            <div className="card">
                {tasks.map((task) => (
                    <Task item={task} key={task.id} />
                ))}
            </div>
        </>
    );
};

export default Tasks;
