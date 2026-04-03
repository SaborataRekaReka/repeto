import { useState } from "react";
import Layout from "@/components/Layout";
import Tabs from "@/components/Tabs";
import Icon from "@/components/Icon";
import Item from "./Item";

import { projects4 } from "@/mocks/projects";

const ProjectsGridV2Page = () => {
    const [type, setType] = useState<string>("all-projects");

    const types = [
        {
            title: "All Projects",
            value: "all-projects",
        },
        {
            title: "Pending",
            value: "pending",
        },
        {
            title: "Done",
            value: "done",
        },
        {
            title: "Archieved",
            value: "archieved",
        },
    ];

    return (
        <Layout title="All Projects">
            <div className="flex mb-6 md:block md:mb-5">
                <Tabs
                    className="mr-auto md:ml-0"
                    classButton="md:ml-0 md:grow md:px-2"
                    items={types}
                    value={type}
                    setValue={setType}
                />
                <button className="btn-stroke btn-small mr-1.5 md:hidden">
                    <Icon name="filters" />
                    <span>Sort: A-Z</span>
                </button>
                <button className="btn-stroke btn-small md:hidden">
                    <Icon name="dots" />
                    <span>Bulk Actions</span>
                </button>
            </div>
            <div className="flex flex-wrap -mt-5 -mx-2.5 md:-mt-2.5">
                {projects4.map((project) => (
                    <Item item={project} key={project.id} />
                ))}
            </div>
        </Layout>
    );
};

export default ProjectsGridV2Page;
