import Link from "next/link";
import Icon from "@/components/Icon";
import Image from "@/components/Image";

import { topStories } from "@/mocks/finance";

type TopStoriesProps = {};

const TopStories = ({}: TopStoriesProps) => (
    <div className="card">
        <div className="card-head">
            <div className="text-h6">Top Stories</div>
            <button className="group text-xs font-bold transition-colors hover:text-purple-1">
                <Icon
                    className="mr-1.5 transition-colors dark:fill-white group-hover:fill-purple-1"
                    name="dots"
                />
                See more stories
            </button>
        </div>
        <div className="p-5">
            {topStories.map((item) => (
                <Link
                    className="group flex items-center mb-5 pb-5 border-b border-dashed border-n-1 last:mb-0 last:pb-0 last:border-none dark:border-white"
                    key={item.id}
                    href="/"
                >
                    <div className="relative w-[5.25rem] h-[5.25rem] border border-n-1 dark:border-white">
                        <Image
                            className="object-cover"
                            src={item.image}
                            fill
                            alt=""
                        />
                    </div>
                    <div className="w-[calc(100%-5.25rem)] pl-5 md:pl-3.5">
                        <div className="mb-3 text-xs text-n-3 dark:text-white/75">
                            {item.date}
                        </div>
                        <div className="mb-0.5 truncate font-bold transition-colors group-hover:text-purple-1">
                            {item.title}
                        </div>
                        <div className="truncate text-sm">
                            Bitcoin (BTC) wobbled a bit early Thursday as
                            crypto-friendly bank Silvergate
                        </div>
                    </div>
                </Link>
            ))}
        </div>
    </div>
);

export default TopStories;
