import { useState } from "react";
import Tabs from "@/components/Tabs";
import Icon from "@/components/Icon";

import { events } from "@/mocks/dashboard";

type EventsProps = {};

const Events = ({}: EventsProps) => {
    const [type, setType] = useState<string>("upcoming-events");

    const typeTasks = [
        {
            title: "Upcoming Events",
            value: "upcoming-events",
        },
        {
            title: "Saved Events",
            value: "saved-events",
        },
    ];

    return (
        <>
            <Tabs
                className="mb-4.5 md:ml-0"
                classButton="md:ml-0 md:flex-1"
                items={typeTasks}
                value={type}
                setValue={setType}
            />
            <div>
                {events.map((event) => (
                    <div
                        className="mb-5 py-4.5 px-5 card last:mb-0"
                        key={event.id}
                    >
                        <div className="mb-6 text-xs font-bold">
                            {event.category}
                        </div>
                        <div className="flex items-center mb-2 text-xs">
                            <Icon
                                className="-mt-0.5 mr-1 dark:fill-white"
                                name="calendar"
                            />
                            Due to:
                            <strong className="ml-1">{event.date}</strong>
                        </div>
                        <div className="mb-1.5 text-h6">{event.title}</div>
                        <div className="mb-8 text-xs font-medium text-n-3 xl:mb-6 dark:text-white/50">
                            {event.content}
                        </div>
                        <div className="label-purple min-w-[4.75rem]">
                            {event.label}
                        </div>
                    </div>
                ))}
            </div>
        </>
    );
};

export default Events;
