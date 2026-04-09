import { useState } from "react";
import Icon from "@/components/Icon";
import Checkbox from "@/components/Checkbox";
import Image from "@/components/Image";
import Details from "@/components/Details";

type TaskProps = {
    item: any;
};

const Task = ({ item }: TaskProps) => {
    const [value, setValue] = useState<boolean>(item.isChecked);
    const [visible, setVisible] = useState<boolean>(false);

    return (
        <>
            <div className="flex items-center border-t border-n-1 px-4 py-4.5 dark:border-white">
                <Checkbox
                    className="shrink-0 mr-2.5"
                    value={value}
                    onChange={() => setValue(!value)}
                />
                <div
                    className="grow text-sm font-bold cursor-pointer transition-colors hover:text-purple-1"
                    onClick={() => setVisible(true)}
                >
                    {item.title}
                </div>
                <div className="shrink-0 flex items-center min-w-[3.5rem] mr-1.5 text-xs font-bold md:min-w-min md:ml-2 md:mr-0">
                    <Icon className="mr-1 dark:fill-white" name="comments" />
                    {item.comments}
                </div>
                <div className="label-stroke shrink-0 w-24 mr-4 md:hidden">
                    {item.date}
                </div>
                <div className="relative shrink-0 w-8 h-8 md:hidden">
                    <Image
                        className="object-cover rounded-full"
                        src={item.avatar}
                        fill
                        alt="Avatar"
                    />
                </div>
            </div>
            <Details
                title="Design a new dashboard for client"
                info="Task created on 7 Jun 2022"
                users={[
                    "/images/avatars/avatar-5.jpg",
                    "/images/avatars/avatar-6.jpg",
                    "/images/avatars/avatar-7.jpg",
                    "/images/avatars/avatar-8.jpg",
                ]}
                date="15 Aug 2023"
                category="Business"
                description="When I first got into the online advertising business, I was looking for the magical combination that would put my website"
                checklist={[
                    {
                        id: "0",
                        title: "Design new home page",
                        isChecked: true,
                    },
                    {
                        id: "1",
                        title: "Type to add more ...",
                        isChecked: false,
                    },
                ]}
                attachments={["/images/img-1.jpg", "/images/img-2.jpg"]}
                visible={visible}
                onClose={() => setVisible(false)}
                markComplete
            />
        </>
    );
};

export default Task;
