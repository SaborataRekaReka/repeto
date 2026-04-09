import { useState } from "react";
import Icon from "@/components/Icon";
import Image from "@/components/Image";
import Comment from "@/components/Comment";
import Answer from "./Answer";
import Question from "./Question";

type MessagesProps = {
    visible?: boolean;
    onClose?: () => void;
};

const Messages = ({ visible, onClose }: MessagesProps) => {
    const [value, setValue] = useState<string>("");

    return (
        <div
            className={`flex flex-col grow lg:fixed lg:inset-0 lg:z-[100] lg:bg-white lg:transition-opacity dark:bg-n-1 ${
                visible
                    ? "lg:visible lg:opacity-100"
                    : "lg:invisible lg:opacity-0"
            }`}
        >
            <div className="flex mb-5 p-5 border-b border-n-1 dark:border-white">
                <button
                    className="btn-stroke btn-square btn-small hidden mr-2 lg:block"
                    onClick={onClose}
                >
                    <Icon name="close" />
                </button>
                <button className="btn-stroke btn-square btn-small">
                    <Icon name="arrow-prev" />
                </button>
                <div className="flex items-center mx-auto pl-12 pr-2 text-sm font-bold lg:px-3">
                    <div className="relative w-6 h-6 mr-2">
                        <Image
                            className="object-cover rounded-full"
                            src="/images/avatars/avatar-2.jpg"
                            fill
                            alt="Avatar"
                        />
                    </div>
                    Sallie Wade
                </div>
                <button className="btn-stroke btn-square btn-small mr-2">
                    <Icon name="forward" />
                </button>
                <button className="btn-stroke btn-square btn-small">
                    <Icon name="dots" />
                </button>
            </div>
            <div className="grow px-5 space-y-4 overflow-auto scroll-smooth">
                <div className="flex justify-center">
                    <div className="label-black">48 Messages</div>
                </div>
                <Answer time="8:20 PM" content="Freelance Design Tricks" />
                <Question
                    time="8:35 PM"
                    content="Some graphic designers always manage to produce"
                    images={[
                        "/images/screenshot-9.jpg",
                        "/images/screenshot-10.jpg",
                    ]}
                />
                <Answer
                    time="8:40 PM"
                    content="Attending a trade show can be a very effective method"
                />
                <Question
                    time="8:50 PM"
                    content="Advertising on a budget part"
                />
                <Question loading />
            </div>
            <Comment
                className="m-5"
                avatar="/images/avatars/avatar.jpg"
                placeholder="Type to add something"
                value={value}
                setValue={(e: any) => setValue(e.target.value)}
            />
        </div>
    );
};

export default Messages;
