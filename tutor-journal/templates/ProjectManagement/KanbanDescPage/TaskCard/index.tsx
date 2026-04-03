import { useState } from "react";
import { Draggable } from "@hello-pangea/dnd";
import Icon from "@/components/Icon";
import Image from "@/components/Image";
import Details from "@/components/Details";

type TaskCardProps = {
    item: any;
    index: number;
};

const TaskCard = ({ item, index }: TaskCardProps) => {
    const [visible, setVisible] = useState<boolean>(false);

    return (
        <>
            <Draggable key={item.id} draggableId={item.id} index={index}>
                {(provided) => (
                    <div
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        {...provided.dragHandleProps}
                    >
                        <div
                            className="flex flex-col mt-2 px-4 py-5 border border-n-1/40 bg-white transition-colors tap-highlight-color hover:!border-purple-1 dark:bg-n-1 dark:border-white/40"
                            onClick={() => setVisible(true)}
                        >
                            <div className="mb-2 font-bold">{item.title}</div>
                            <div
                                className="relative h-1 mb-4"
                                style={{ backgroundColor: item.color }}
                            >
                                <div
                                    className="absolute top-0 left-0 bottom-0 bg-n-1/30"
                                    style={{
                                        width:
                                            (item.taskDone / item.taskAll) *
                                                100 +
                                            "%",
                                    }}
                                ></div>
                            </div>
                            <div className="flex items-center">
                                <div className="label-stroke min-w-[5.875rem] mr-auto text-center">
                                    {item.date}
                                </div>
                                <div className="flex items-center mr-2.5 text-xs font-bold">
                                    <Icon
                                        className="mr-1 dark:fill-white"
                                        name="tasks"
                                    />
                                    {item.taskDone}/{item.taskAll}
                                </div>
                                <div className="relative shrink-0 w-6 h-6">
                                    <Image
                                        className="object-cover rounded-full"
                                        src={item.avatar}
                                        fill
                                        alt="Avatar"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </Draggable>
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
                attachments={["/images/img-1.jpg", "/images/img-2.jpg"]}
                visible={visible}
                onClose={() => setVisible(false)}
                markComplete
            />
        </>
    );
};

export default TaskCard;
