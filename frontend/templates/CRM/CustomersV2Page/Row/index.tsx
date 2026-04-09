import { useState } from "react";
import Link from "next/link";
import Checkbox from "@/components/Checkbox";
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
                    className="font-bold transition-colors hover:text-purple-1"
                    href="/crm/customers-details"
                >
                    {item.name}
                </Link>
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
            <td className="td-custom font-medium">{item.date}</td>
            <td className="td-custom text-right font-bold">${item.rate}</td>
            <td className="td-custom text-right">
                <div
                    className={`min-w-[5.25rem] label-green ${
                        item.status === "Pending" ? "label-yellow" : ""
                    }`}
                >
                    {item.status}
                </div>
            </td>
            <td className="td-custom text-right">
                <button className="btn-transparent-dark btn-small btn-square">
                    <Icon name="dots" />
                </button>
            </td>
        </tr>
    );
};

export default Row;
