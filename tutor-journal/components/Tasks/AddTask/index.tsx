import { useState } from "react";
import Icon from "@/components/Icon";
import Checkbox from "@/components/Checkbox";
import Image from "@/components/Image";

type AddTaskProps = {};

const AddTask = ({}: AddTaskProps) => {
    const [value, setValue] = useState<boolean>(false);
    const [name, setName] = useState<string>("");

    return (
        <div className="flex items-center p-4">
            <Icon
                className="shrink-0 mr-4 md:hidden dark:fill-white"
                name="marker"
            />
            <Checkbox
                className="shrink-0 mr-2.5"
                value={value}
                onChange={() => setValue(!value)}
            />
            <input
                className="grow h-6 pr-4 border-none bg-transparent text-sm font-bold text-n-1 outline-none placeholder:text-n-1 dark:text-white dark:placeholder:text-white"
                type="text"
                placeholder="Type to add a new task …"
                value={name}
                onChange={(e: any) => setName(e.target.value)}
            />
            <button className="btn-dark btn-small shrink-0 w-24 h-6 mr-4 md:mr-0">
                Set date
            </button>
            <div className="relative shrink-0 w-8 h-8 md:hidden">
                <Image
                    className="object-cover rounded-full"
                    src="/images/avatars/avatar.jpg"
                    fill
                    alt="Avatar"
                />
            </div>
        </div>
    );
};

export default AddTask;
