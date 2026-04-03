import { useState } from "react";
import Link from "next/link";
import Checkbox from "@/components/Checkbox";
import Image from "@/components/Image";
import Icon from "@/components/Icon";
import Users from "@/components/Users";

type RowProps = {
    item: any;
};

const Row = ({ item }: RowProps) => {
    const [value, setValue] = useState<boolean>(false);

    return (
        <div className="flex items-center p-4 border-b border-n-1 last:border-none dark:border-white">
            <Checkbox
                className="shrink-0 mr-4.5"
                value={value}
                onChange={() => setValue(!value)}
            />
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
            </Link>
            <div className="shrink-0 flex items-center mr-6">
                <Icon className="mr-1 dark:fill-white" name="tasks" />
                <div className="w-12 mr-1 text-xs font-bold">
                    {item.tasksDone}/{item.tasksAll}
                </div>
                <div
                    className="relative w-14 h-1"
                    style={{
                        backgroundColor: item.tasksColor || "#98E9AB",
                    }}
                >
                    <div
                        className="absolute top-0 left-0 bottom-0 bg-n-1/30"
                        style={{
                            width: (item.tasksDone / item.tasksAll) * 100 + "%",
                        }}
                    ></div>
                </div>
            </div>
            <div className="flex items-center w-10 mr-2 shrink-0 text-xs font-bold">
                <Icon className="mr-1 dark:fill-white" name="comments" />
                {item.comments}
            </div>
            <div className="flex items-center w-10 mr-2 shrink-0 text-xs font-bold">
                <Icon className="mr-1 dark:fill-white" name="attached" />
                {item.files}
            </div>
            <div className="label-stroke shrink-0 min-w-[6rem] mr-4.5">
                {item.date}
            </div>
            <Users className="shrink-0 mr-3" items={item.users} large border />
            <button className="btn-transparent-dark btn-small btn-square shrink-0">
                <Icon name="dots" />
            </button>
        </div>
    );
};

export default Row;
