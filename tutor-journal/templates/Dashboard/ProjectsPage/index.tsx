import Layout from "@/components/Layout";
import Tasks from "@/components/Tasks";
import Statistics from "./Statistics";
import Events from "./Events";

import { tasks } from "@/mocks/dashboard";

const ProjectsPage = () => {
    return (
        <Layout title="Dashboard">
            <Statistics />
            <div className="flex mt-6 -mx-2.5 lg:block lg:mx-0">
                <div className="w-[calc(66.666%-1.25rem)] mx-2.5 lg:w-full lg:mx-0 lg:mb-6">
                    <Tasks items={tasks.slice(0, 6)} />
                </div>
                <div className="w-[calc(33.333%-1.25rem)] mx-2.5 lg:w-full lg:mx-0">
                    <Events />
                </div>
            </div>
        </Layout>
    );
};

export default ProjectsPage;
