import Image from "@/components/Image";

import { experience } from "@/mocks/profile";

type ExperienceProps = {};

const Experience = ({}: ExperienceProps) => (
    <div>
        {experience.map((item) => (
            <div
                className="flex items-start mb-4 pb-4 border-b border-dashed border-n-1 last:mb-0 last:pb-0 last:border-none dark:border-white"
                key={item.id}
            >
                <div className="shrink-0 w-8 mt-1 mr-5 p-0.5 dark:bg-white">
                    <Image
                        className="w-full"
                        src={item.image}
                        width={32}
                        height={32}
                        alt=""
                    />
                </div>
                <div className="grow">
                    <div className="text-sm font-bold">{item.title}</div>
                    <div className="flex justify-between items-center md:block md:mb-1">
                        <div className="mb-1 text-sm">
                            {item.city}
                            <span className="relative -top-0.75 inline-block w-1 h-1 mx-2 bg-n-1 dark:bg-white"></span>
                            {item.company}
                        </div>
                        <div className="shrink-0 ml-4 text-xs font-bold md:ml-0">
                            {item.duration}
                        </div>
                    </div>
                    <div className="text-xs font-medium text-n-3 dark:text-white/50">
                        {item.content}
                    </div>
                </div>
            </div>
        ))}
    </div>
);

export default Experience;
