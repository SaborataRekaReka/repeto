import { useState } from "react";
import Checkbox from "@/components/Checkbox";
import Image from "@/components/Image";
import Icon from "@/components/Icon";
import Select from "@/components/Select";
import Switch from "@/components/Switch";

const accessOptions = [
    {
        id: "0",
        title: "View and edit",
    },
    {
        id: "1",
        title: "Only view",
    },
    {
        id: "2",
        title: "Full access",
    },
];

type RowProps = {
    item: any;
};

const Row = ({ item }: RowProps) => {
    const [value, setValue] = useState<boolean>(false);
    const [check, setCheck] = useState<boolean>(item.isChecked);
    const [access, setAccess] = useState<any>(accessOptions[0]);

    return (
        <tr className="">
            <td className="td-custom md:hidden">
                <Checkbox value={value} onChange={() => setValue(!value)} />
            </td>
            <td className="td-custom md:!pl-4">
                <div className="flex items-center">
                    <div className="relative w-7 h-7 mr-3">
                        <Image
                            className="object-cover rounded-full"
                            src={item.avatar}
                            fill
                            alt="Avatar"
                        />
                    </div>
                    <div className="text-sm">
                        <div className="font-bold text-sm">{item.name}</div>
                        <div className="hidden text-xs md:block">
                            {item.email}
                        </div>
                    </div>
                </div>
            </td>
            <td className="td-custom lg:hidden">{item.email}</td>
            <td className="td-custom md:hidden">
                <Select
                    className="w-[8.25rem]"
                    items={accessOptions}
                    value={access}
                    onChange={setAccess}
                    small
                />
            </td>
            <td className="td-custom text-right md:!pr-4">
                <div className="flex items-center justify-end">
                    <Switch value={check} setValue={() => setCheck(!check)} />
                    <button className="btn-transparent-dark btn-small btn-square ml-6 md:hidden">
                        <Icon name="dots" />
                    </button>
                </div>
            </td>
        </tr>
    );
};

export default Row;
