import Link from "next/link";
import Image from "@/components/Image";
import Icon from "@/components/Icon";
import Users from "@/components/Users";

type RowProps = {
    item: any;
};

const Row = ({ item }: RowProps) => {
    return (
        <div className="flex items-center p-4 border-b border-n-1 last:border-none dark:border-white">
            <Link
                className="flex items-center grow text-sm font-bold transition-colors hover:text-purple-1"
                href="/projects/projects-details"
            >
                <div className="relative w-8 h-8 p-2 mr-3 bg-background rounded-full">
                    <Image
                        className="w-full"
                        src={item.logo}
                        width={16}
                        height={16}
                        alt="Logo"
                    />
                </div>
                {item.title}
                <div
                    className={`ml-2.5 md:hidden ${
                        item.category === "UI Design"
                            ? "label-stroke-yellow"
                            : item.category === "Marketing"
                            ? "label-stroke-green"
                            : item.category === "Advertising"
                            ? "label-stroke-pink"
                            : "label-stroke-purple"
                    }`}
                >
                    {item.category}
                </div>
            </Link>
            <div className="shrink-0 flex items-center min-w-[5rem] mr-5 text-xs font-bold md:min-w-min md:mr-0 md:ml-2">
                <Icon className="mr-1 dark:fill-white" name="tasks" />
                <span className="md:hidden">Tasks</span> {item.tasksDone}/
                {item.tasksAll}
            </div>
            <div className="label-stroke shrink-0 min-w-[9rem] mr-4.5 lg:hidden">
                <Icon className="mr-1 dark:fill-white" name="calendar" />
                {item.date}
            </div>
            <Users
                className="shrink-0 mr-3 lg:hidden"
                items={item.users}
                large
                border
            />
            <button className="btn-transparent-dark btn-small btn-square shrink-0 md:hidden">
                <Icon name="dots" />
            </button>
        </div>
    );
};

export default Row;
