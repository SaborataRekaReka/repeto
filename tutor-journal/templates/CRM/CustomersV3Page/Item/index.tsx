import { useState } from "react";
import Link from "next/link";
import Checkbox from "@/components/Checkbox";
import Image from "@/components/Image";
import Icon from "@/components/Icon";

type ItemProps = {
    item: any;
};

const Item = ({ item }: ItemProps) => {
    const [value, setValue] = useState<boolean>(false);

    return (
        <Link
            className="flex flex-col w-[calc(25%-1.25rem)] mt-5 mx-2.5 card text-center lg:w-[calc(50%-1.25rem)] md:w-[calc(100%-1.25rem)] md:mt-3"
            href="/crm/customers-details"
        >
            <div className="relative grow pt-12 px-5 pb-7 md:pt-4 md:pb-4">
                <Checkbox
                    className="!absolute top-5 left-5 md:hidden"
                    value={value}
                    onChange={() => setValue(!value)}
                />
                <button className="absolute top-4 right-3 btn-transparent-dark btn-small btn-square md:hidden">
                    <Icon name="dots" />
                </button>
                <div className="relative w-[4.25rem] h-[4.25rem] mx-auto mb-3.5">
                    <Image
                        className="object-cover rounded-full"
                        src={item.avatar}
                        fill
                        alt="Avatar"
                    />
                </div>
                <div className="text-sm font-bold">{item.name}</div>
                <div className="mb-4 text-xs font-medium">{item.email}</div>
                <div
                    className={`min-w-[5.25rem] label-green ${
                        item.status === "Pending" ? "label-yellow" : ""
                    }`}
                >
                    {item.status}
                </div>
            </div>
            <div className="flex border-t border-n-1 dark:border-white">
                <div className="flex-1 p-3 border-r border-n-1 dark:border-white">
                    <div className="text-sm font-bold">${item.sales}</div>
                    <div className="text-xs font-medium text-n-3 dark:text-white/75">
                        Sales
                    </div>
                </div>
                <div className="flex-1 p-3">
                    <div className="text-sm font-bold">{item.count}</div>
                    <div className="text-xs font-medium text-n-3 dark:text-white/75">
                        Count
                    </div>
                </div>
            </div>
        </Link>
    );
};

export default Item;
