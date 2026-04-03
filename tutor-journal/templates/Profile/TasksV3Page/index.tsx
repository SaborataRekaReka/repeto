import Layout from "@/components/Layout";
import Icon from "@/components/Icon";
import Image from "@/components/Image";
import Profile from "./Profile";
import Tasks from "./Tasks";

const TasksV3Page = () => {
    return (
        <Layout background title="All Tasks" back>
            <div className="flex items-end mb-6 lg:block">
                <div className="w-[calc(100%-20rem)] pr-[6.55rem] 4xl:w-[calc(100%-14.75rem)] 2xl:pr-20 xl:pr-12 lg:w-full lg:mb-4 lg:pr-0">
                    <div className="relative w-[6.875rem] h-[6.875rem] mb-3 rounded-full overflow-hidden shadow-primary-4">
                        <Image
                            className="object-cover"
                            src="/images/avatar-2.jpg"
                            fill
                            alt="Avatar"
                        />
                    </div>
                    <div className="flex items-center">
                        <div className="text-h3">Francisco Maia</div>
                        <div className="label-stroke ml-2">Designer</div>
                    </div>
                    <div className="text-sm">franco.maia@gmail.com</div>
                </div>
                <div className="flex shrink-0 w-[20rem] 4xl:w-[14.75rem]">
                    <button className="btn-purple btn-medium grow">
                        <Icon name="add-circle" />
                        <span>Add new task</span>
                    </button>
                    <button className="btn-purple btn-medium btn-square shrink-0 ml-1.5">
                        <Icon name="email" />
                    </button>
                    <button className="btn-purple btn-medium btn-square shrink-0 ml-1.5">
                        <Icon name="arrow-up-right" />
                    </button>
                </div>
            </div>
            <div className="flex lg:flex-col-reverse">
                <div className="w-[calc(100%-20rem)] pr-[6.55rem] 4xl:w-[calc(100%-14.75rem)] 2xl:pr-20 xl:pr-12 lg:w-full lg:pr-0">
                    <Tasks />
                </div>
                <div className="shrink-0 w-[20rem] 4xl:w-[14.75rem] lg:w-full lg:mb-10 md:mb-8">
                    <Profile />
                </div>
            </div>
        </Layout>
    );
};

export default TasksV3Page;
