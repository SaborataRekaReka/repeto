import { useState } from "react";
import Layout from "@/components/Layout";
import Tabs from "@/components/Tabs";
import Icon from "@/components/Icon";
import AddTask from "./AddTask";
import Task from "./Task";

import { tasks } from "@/mocks/projects";

const TasksListV2Page = () => {
    const [type, setType] = useState<string>("all-tasks");

    const typeTasks = [
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
        <Layout title="All Tasks">
            <div className="">
                <div className="flex justify-between mb-6 md:block md:mb-5">
                    <Tabs
                        className="md:ml-0"
                        classButton="md:ml-0 md:flex-1"
                        items={typeTasks}
                        value={type}
                        setValue={setType}
                    />
                    <button className="btn-stroke btn-small md:hidden">
                        <Icon name="filters" />
                        <span>Sort: A-Z</span>
                    </button>
                </div>
                <div className="card">
                    <AddTask />
                    {tasks.map((task: any) => (
                        <Task item={task} key={task.id} />
                    ))}
                </div>
            </div>
        </Layout>
    );
};

export default TasksListV2Page;
