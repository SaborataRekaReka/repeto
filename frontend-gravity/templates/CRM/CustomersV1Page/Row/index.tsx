import { useState } from "react";
import Link from "next/link";
import Checkbox from "@/components/Checkbox";
import Image from "@/components/Image";
import Icon from "@/components/Icon";

type RowProps = {
    item: any;
};

const Row = ({ item }: RowProps) => {
    const [value, setValue] = useState<boolean>(false);

    return (
        <tr className="">
            <td className="td-custom">
                <Checkbox value={value} onChange={() => setValue(!value)} />
            </td>
            <td className="td-custom">
                <Link
                    className="flex items-center text-sm font-bold transition-colors hover:text-purple-1"
                    href="/crm/customers-details"
                >
                    <div className="relative w-7 h-7 mr-3">
                        <Image
                            className="object-cover rounded-full"
                            src={item.avatar}
                            fill
                            alt="Avatar"
                        />
                    </div>
                    {item.name}
                </Link>
            </td>
            <td className="td-custom font-medium">
                <div className="flex items-center">
                    <Icon
                        className="relative -top-0.25 mr-1.5 dark:fill-white"
                        name="calendar"
                    />
                    {item.date}
                </div>
            </td>
            <td className="td-custom font-medium">
                <div className="flex items-center">
                    <Icon
                        className="relative -top-0.25 mr-1.5 dark:fill-white"
                        name="email-1"
                    />
                    <div className="2xl:max-w-[9rem] 2xl:truncate">
                        {item.email}
                    </div>
                </div>
            </td>
            <td className="td-custom font-medium">
                <div className="flex items-center">
                    <Icon
                        className="relative -top-0.25 mr-1.5 dark:fill-white"
                        name="cart"
                    />
                    {item.product}
                </div>
            </td>
            <td className="td-custom text-right font-bold">${item.price}</td>
            <td className="td-custom text-right">
                <button className="btn-transparent-dark btn-small btn-square">
                    <Icon name="dots" />
                </button>
            </td>
        </tr>
    );
};

export default Row;
