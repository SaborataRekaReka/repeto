import { useState } from "react";
import Icon from "@/components/Icon";
import Comment from "@/components/Comment";

type ActionsProps = {
    comments: number;
    likes: number;
};

const Actions = ({ comments, likes }: ActionsProps) => {
    const [visible, setVisible] = useState<boolean>(false);
    const [value, setValue] = useState<string>("");

    return (
        <>
            <div className="flex mt-3">
                <button className="btn-transparent-dark btn-small mr-5 px-0">
                    <Icon name="comments" />
                    <span>{comments}</span>
                </button>
                <button className="btn-transparent-dark btn-small px-0">
                    <Icon name="like" />
                    <span>{likes}</span>
                </button>
                <button
                    className={`btn-transparent-dark btn-square btn-small ml-auto -mr-2 ${
                        visible ? "!fill-purple-1" : ""
                    }`}
                    onClick={() => setVisible(!visible)}
                >
                    <Icon name="reply" />
                </button>
            </div>
            {visible && (
                <Comment
                    className="mt-4 mb-2 !pr-4 !py-0 !pl-0 border-dashed shadow-none md:-ml-12 md:!pr-3"
                    placeholder="Type to add your comment"
                    value={value}
                    setValue={(e: any) => setValue(e.target.value)}
                />
            )}
        </>
    );
};

export default Actions;
