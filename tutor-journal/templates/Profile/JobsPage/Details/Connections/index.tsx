import Image from "@/components/Image";

import { connections } from "@/mocks/profile";

type ConnectionsProps = {};

const Connections = ({}: ConnectionsProps) => (
    <div className="flex flex-wrap -mt-10 -mx-3 md:block md:m-0">
        {connections.map((item) => (
            <div
                className="flex w-[calc(50%-1.5rem)] mt-10 mx-3 md:w-full md:mb-6 md:mt-0 md:mx-0 md:last:mb-0"
                key={item.id}
            >
                <div className="relative shrink-0 w-15 h-15 mr-3">
                    <Image
                        className="object-cover rounded-full"
                        src={item.avatar}
                        fill
                        alt=""
                    />
                </div>
                <div className="grow">
                    <div className="-mt-1 font-bold">{item.man}</div>
                    <div className="mb-0.5 text-sm">{item.position}</div>
                    <div className="flex items-center">
                        <div className="shrink-0 w-4 mr-1.5 p-0.25 text-0 dark:bg-white">
                            <Image
                                className="w-full"
                                src={item.logo}
                                width={16}
                                height={16}
                                alt=""
                            />
                        </div>
                        <div className="text-sm font-medium">
                            {item.company}
                        </div>
                    </div>
                </div>
            </div>
        ))}
    </div>
);

export default Connections;
