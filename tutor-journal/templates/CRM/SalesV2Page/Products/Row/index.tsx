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
                <div className="inline-flex items-center">
                    <div className="w-15 mr-3 border border-n-1">
                        <Image
                            className="w-full"
                            src={item.image}
                            width={60}
                            height={48}
                            alt=""
                        />
                    </div>
                    <div>
                        <div className="font-bold">{item.title}</div>
                        <div className="font-medium text-n-3 dark:text-white/75">
                            Order #: {item.order}
                        </div>
                    </div>
                </div>
            </td>
            <td className="td-custom font-medium">
                <div className="">{item.customer}</div>
                <div className="text-n-3 dark:text-white/75">{item.email}</div>
            </td>
            <td className="td-custom text-right">
                <div className="font-bold">${item.amount}</div>
                <div className="font-medium text-n-3 dark:text-white/75">
                    Tax: ${item.tax}
                </div>
            </td>
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
