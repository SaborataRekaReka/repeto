import { useState } from "react";
import Checkbox from "@/components/Checkbox";

type TaskProps = {
    item: any;
};

const Task = ({ item }: TaskProps) => {
    const [value, setValue] = useState<boolean>(item.isChecked);

    return (
        <div className="flex items-center py-3 border-b border-n-1/40 dark:border-white/40">
            <Checkbox
                className="shrink-0 mr-2.5"
                value={value}
                onChange={() => setValue(!value)}
            />
            <div className="grow mr-4 text-sm font-bold md:mr-0">
                {item.title}
            </div>
            <div className="label-stroke shrink-0 min-w-[6rem] md:hidden">
                {item.date}
            </div>
        </div>
    );
};

export default Task;
