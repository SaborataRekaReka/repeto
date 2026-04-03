import Link from "next/link";
import Image from "@/components/Image";
import Icon from "@/components/Icon";
import Users from "@/components/Users";

type ItemProps = {
    item: any;
};

const Item = ({ item }: ItemProps) => {
    return (
        <div className="relative w-[calc(33.333%-1.25rem)] mt-5 mx-2.5 pt-22 px-5 pb-8 card text-center lg:w-[calc(50%-1.25rem)] md:w-[calc(100%-1.25rem)] md:py-8 md:mt-2.5">
            <Users
                className="absolute top-5 left-5 md:hidden"
                items={item.users}
                border
            />
            <button className="absolute top-4 right-3 btn-transparent-dark btn-small btn-square md:hidden">
                <Icon name="dots" />
            </button>
            <div className="relative w-[4.25rem] h-[4.25rem] mx-auto mb-4 p-5 bg-background rounded-full">
                <Image
                    className="w-full"
                    src={item.logo}
                    width={30}
                    height={30}
                    alt="Logo"
                />
            </div>
            <Link
                className="block mb-12 text-h6 md:mb-6 transition-colors hover:text-purple-1"
                href="/projects/projects-details"
            >
                {item.title}
            </Link>
            <div className="label-stroke min-w-[8.75rem] mb-4.5">
                <Icon className="mr-1 dark:fill-white" name="calendar" />
                {item.date}
            </div>
            <div className="flex justify-center items-center text-xs font-bold">
                <Icon className="dark:fill-white" name="tasks" />
                <span className="mx-1">Tasks</span>
                {item.tasksDone}/{item.tasksAll}
            </div>
        </div>
    );
};

export default Item;
