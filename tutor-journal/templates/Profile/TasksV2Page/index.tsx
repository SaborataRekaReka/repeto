import Layout from "@/components/Layout";
import Profile from "./Profile";
import Tasks from "./Tasks";

const TasksV2Page = () => {
    return (
        <Layout title="All Tasks" background back>
            <div className="flex pt-4 lg:block lg:pt-0">
                <div className="shrink-0 w-[20rem] 4xl:w-[16.3rem] lg:w-full lg:mb-8">
                    <Profile />
                </div>
                <div className="w-[calc(100%-20rem)] pl-[5.125rem] 4xl:w-[calc(100%-16.3rem)] 2xl:pl-16 lg:w-full lg:pl-0">
                    <Tasks />
                </div>
            </div>
        </Layout>
    );
};

export default TasksV2Page;
