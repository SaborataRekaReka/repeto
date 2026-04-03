import Link from "next/link";
import Image from "@/components/Image";
import Users from "@/components/Users";
import Icon from "@/components/Icon";

type ItemProps = {
    item: any;
};

const Item = ({ item }: ItemProps) => (
    <Link
        className="block p-4 border-b border-n-1 last:border-none dark:border-white"
        href="/projects/projects-details"
    >
        <div className="flex justify-between items-center mb-4 pb-4 border-b border-n-1 border-dashed dark:border-white">
            <div className="flex items-center grow text-sm font-bold">
                <div className="relative w-8 h-8 p-2 mr-2.5 bg-background rounded-full">
                    <Image
                        className="w-full"
                        src={item.logo}
                        width={16}
                        height={16}
                        alt="Logo"
                    />
                </div>
                <div>
                    <div className="mb-1 font-bold">{item.title}</div>
                    <div
                        className="relative w-18 h-1"
                        style={{
                            backgroundColor: item.tasksColor || "#98E9AB",
                        }}
                    >
                        <div
                            className="absolute top-0 left-0 bottom-0 bg-n-1/30"
                            style={{
                                width:
                                    (item.tasksDone / item.tasksAll) * 100 +
                                    "%",
                            }}
                        ></div>
                    </div>
                </div>
            </div>
            <Users className="shrink-0 ml-2" items={item.users} large border />
        </div>
        <div className="flex justify-between items-center text-xs font-bold">
            <div className="flex items-center">
                <Icon className="mr-1 dark:fill-white" name="tasks" />
                <div>
                    {item.tasksDone}/{item.tasksAll}
                </div>
            </div>
            <div>{item.date}</div>
        </div>
    </Link>
);

export default Item;
