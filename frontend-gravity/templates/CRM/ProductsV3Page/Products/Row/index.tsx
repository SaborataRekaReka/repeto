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
                    href="/crm/product-details"
                >
                    {item.name}
                </Link>
            </td>
            <td className="td-custom text-right font-medium">${item.amount}</td>
            <td className="td-custom">
                <div className="label-black min-w-[5.25rem]">{item.status}</div>
            </td>
            <td className="td-custom font-bold">${item.rate}</td>
            <td className="td-custom">
                <div className="label-stroke min-w-[7.25rem]">
                    {item.service}
                </div>
            </td>
            <td className="td-custom font-medium">{item.date}</td>
            <td className="td-custom font-medium">{item.source}</td>
            <td className="td-custom text-right">
                <button className="btn-transparent-dark btn-small btn-square">
                    <Icon name="dots" />
                </button>
            </td>
        </tr>
    );
};

export default Row;
