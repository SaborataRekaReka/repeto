import { useState } from "react";
import Link from "next/link";
import Checkbox from "@/components/Checkbox";
import Image from "@/components/Image";
import Icon from "@/components/Icon";
import Users from "@/components/Users";

type ItemProps = {
    item: any;
};

const Item = ({ item }: ItemProps) => {
    const [value, setValue] = useState<boolean>(false);

    return (
        <div className="relative w-[calc(33.333%-1.25rem)] mt-5 mx-2.5 py-8 px-5 card text-center lg:w-[calc(50%-1.25rem)] md:w-[calc(100%-1.25rem)] md:py-6 md:mt-2.5">
            <Checkbox
                className="!absolute top-5 left-5 md:hidden"
                value={value}
                onChange={() => setValue(!value)}
            />
            <button className="absolute top-4 right-3 btn-transparent-dark btn-small btn-square md:hidden">
                <Icon name="dots" />
            </button>
            <div className="w-[4.25rem] h-[4.25rem] mx-auto mb-4 p-5 bg-background rounded-full">
                <Image
                    className="w-full"
                    src={item.logo}
                    width={30}
                    height={30}
                    alt="Logo"
                />
            </div>
            <Link
                className="block mb-3 text-h6 md:mb-2 transition-colors hover:text-purple-1"
                href="/projects/projects-details"
            >
                {item.title}
            </Link>
            <div className="label-stroke-green min-w-[6rem] mb-6 md:mb-4">
                {item.date}
            </div>
            <div className="flex justify-center items-center mb-9 space-x-2 md:mb-0">
                <div className="flex items-center text-xs font-bold">
                    <Icon className="mr-1 dark:fill-white" name="email-2" />
                    {item.emails}
                </div>
                <div className="flex items-center text-xs font-bold">
                    <Icon className="mr-1 dark:fill-white" name="clock" />
                    {item.percent}%
                </div>
                <div className="flex items-center text-xs font-bold">
                    <Icon className="mr-1 dark:fill-white" name="save" />
                    {item.counters}
                </div>
            </div>
            <Users
                className="shrink-0 justify-center md:hidden"
                items={item.users}
                large
                border
            />
        </div>
    );
};

export default Item;
