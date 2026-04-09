import Layout from "@/components/Layout";
import Tasks from "@/components/Tasks";

import { tasks } from "@/mocks/dashboard";

const TasksListV1Page = () => {
    return (
        <Layout title="All Tasks">
            <Tasks classHead="mb-6 md:mb-5" items={tasks} />
        </Layout>
    );
};

export default TasksListV1Page;
