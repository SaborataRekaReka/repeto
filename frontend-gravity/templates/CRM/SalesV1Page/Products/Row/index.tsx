import { useState } from "react";
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
            <td className="td-custom font-medium">{item.date}</td>
            <td className="td-custom">
                <div className="inline-flex items-center text-sm font-bold">
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
                </div>
            </td>
            <td className="td-custom font-medium">{item.color}</td>
            <td className="td-custom text-right font-medium">{item.qty}</td>
            <td className="td-custom text-right font-bold">${item.amount}</td>
            <td className="td-custom text-right">
                <div className="label-green min-w-[5.25rem]">{item.status}</div>
            </td>
            <td className="td-custom w-15 px-0 text-right">
                <button className="btn-transparent-dark btn-small btn-square">
                    <Icon name="dots" />
                </button>
            </td>
        </tr>
    );
};

export default Row;
