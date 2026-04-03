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
                    className="inline-flex items-center text-sm font-bold transition-colors hover:text-purple-1"
                    href="/crm/product-details"
                >
                    <div className="w-15 mr-3 border border-n-1">
                        <Image
                            className="w-full"
                            src={item.image}
                            width={60}
                            height={42}
                            alt=""
                        />
                    </div>
                    {item.title}
                </Link>
            </td>
            <td className="td-custom">
                <div className="label-stroke min-w-[7.25rem]">
                    {item.category}
                </div>
            </td>
            <td className="td-custom">{item.id}</td>
            <td className="td-custom">
                <div
                    className={`min-w-[4rem] ${
                        item.avl === "Paid"
                            ? "label-stroke-green"
                            : item.avl === "Med"
                            ? "label-stroke-yellow"
                            : item.avl === "Low"
                            ? "label-stroke-pink"
                            : "label-stroke"
                    }`}
                >
                    {item.avl}
                </div>
            </td>
            <td className="td-custom">{item.color}</td>
            <td className="td-custom text-right">{item.sales}</td>
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
