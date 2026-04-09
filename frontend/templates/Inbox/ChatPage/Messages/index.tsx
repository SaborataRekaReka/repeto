import { useState } from "react";
import Icon from "@/components/Icon";
import Image from "next/image";

import { messages } from "@/mocks/inbox";

type MessagesProps = {
    setVisible?: any;
};

const Messages = ({ setVisible }: MessagesProps) => {
    const [activeId, setActiveId] = useState<string>("1");

    const handleClick = (id: string) => {
        setActiveId(id);
        setVisible(true);
    };

    return (
        <div className="flex flex-col w-[28rem] border-r border-n-1 4xl:w-[23.125rem] lg:w-full lg:border-none dark:border-white">
            <div className="flex p-5 border-b border-n-1 dark:border-white">
                <button className="btn-purple btn-small mr-auto px-4">
                    <Icon name="edit" />
                    <span>Compose</span>
                </button>
                <button className="btn-stroke btn-square btn-small mr-1.5">
                    <Icon name="filters" />
                </button>
                <button className="btn-stroke btn-square btn-small">
                    <Icon name="search" />
                </button>
            </div>
            <div className="grow overflow-auto scroll-smooth">
                {messages.map((message) => (
                    <button
                        className={`flex w-full px-5 py-3 border-b border-n-1 text-left last:border-none transition-colors hover:bg-n-3/5 dark:border-white dark:hover:bg-white/10 ${
                            message.id === activeId
                                ? "!bg-n-3/20 dark:!bg-white/20"
                                : ""
                        }`}
                        key={message.id}
                        onClick={() => handleClick(message.id)}
                    >
                        <div className="relative w-8 h-8">
                            <Image
                                className="object-cover rounded-full"
                                src={message.avatar}
                                fill
                                alt="Avatar"
                            />
                        </div>
                        <div className="w-[calc(100%-2rem)] pl-3">
                            <div className="flex justify-between mb-1 text-xs font-medium text-n-3 dark:text-white/75">
                                <div>{message.name}</div>
                                <div>{message.time}</div>
                            </div>
                            <div className="truncate text-sm font-bold">
                                {message.title}
                            </div>
                            <div className="truncate text-sm">
                                {message.content}
                            </div>
                        </div>
                    </button>
                ))}
            </div>
        </div>
    );
};

export default Messages;
