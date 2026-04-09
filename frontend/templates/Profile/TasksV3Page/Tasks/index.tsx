import { useState } from "react";
import Comment from "@/components/Comment";
import Review from "@/components/Review";

import { tasks3 } from "@/mocks/profile";

type TasksProps = {};

const Tasks = ({}: TasksProps) => {
    const [value, setValue] = useState<string>("");

    return (
        <>
            <Comment
                className="mb-3"
                avatar="/images/avatars/avatar.jpg"
                placeholder="Type to add something"
                value={value}
                setValue={(e: any) => setValue(e.target.value)}
            />
            <div>
                {tasks3.map((task) => (
                    <Review item={task} key={task.id} />
                ))}
            </div>
        </>
    );
};

export default Tasks;
