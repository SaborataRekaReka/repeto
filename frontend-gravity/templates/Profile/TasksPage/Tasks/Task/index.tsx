import { useState } from "react";
import Checkbox from "@/components/Checkbox";
import Icon from "@/components/Icon";
import Image from "@/components/Image";

type TaskProps = {
    item: any;
};

const Task = ({ item }: TaskProps) => {
    const [value, setValue] = useState<boolean>(item.isChecked);

    return (
        <div className="flex items-center px-5 py-4.5 border-b border-n-1 last:border-none md:px-4 dark:border-white">
            <Checkbox
                className="shrink-0 mr-2.5"
                value={value}
                onChange={() => setValue(!value)}
            />
            <div className="grow mr-4 text-sm font-bold md:mr-2">
                {item.title}
            </div>
            <div className="flex items-center justify-center shrink-0 min-w-[3.125rem] mr-2.5 text-xs font-bold md:hidden">
                <Icon className="mr-1 dark:fill-white" name="comments" />
                {item.comments}
            </div>
            <div className="label-stroke shrink-0 min-w-[6rem] mr-4 md:hidden">
                {item.date}
            </div>
            <div className="relative shrink-0 w-8 h-8">
                <Image
                    className="object-cover rounded-full"
                    src={item.avatar}
                    fill
                    alt="Avatar"
                />
            </div>
        </div>
    );
};

export default Task;
