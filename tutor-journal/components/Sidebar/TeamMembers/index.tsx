import Link from "next/link";
import Image from "@/components/Image";
import Icon from "@/components/Icon";

import { teamMembers } from "@/mocks/teamMembers";

type TeamMembersProps = {
    visible?: boolean;
};

const TeamMembers = ({ visible }: TeamMembersProps) => {
    return (
        <>
            <div
                className={`mb-3 overflow-hidden whitespace-nowrap text-xs font-medium text-n-3 dark:text-white/50 ${
                    visible ? "w-full opacity-100" : "xl:w-0 xl:opacity-0"
                }`}
            >
                Team Members
            </div>
            <div className="-mx-4">
                {teamMembers.map((member) => (
                    <Link
                        className={`flex items-center h-9.5 mb-1.5 px-4 text-sm text-n-1 dark:text-white font-bold last:mb-0 transition-colors hover:bg-n-4 dark:hover:bg-[#161616] ${
                            visible ? "px-4 text-sm" : "xl:px-0 xl:text-0"
                        }`}
                        href={member.url}
                        key={member.id}
                    >
                        <div
                            className={`relative shrink-0 w-5.5 h-5.5 mr-2.5 rounded-full overflow-hidden ${
                                visible ? "mr-2.5 ml-0" : "xl:mx-auto"
                            }`}
                        >
                            <Image
                                className="object-cover scale-105"
                                src={member.avatar}
                                fill
                                alt="Avatar"
                            />
                        </div>
                        {member.title}
                    </Link>
                ))}
            </div>
            <button
                className={`group flex items-center w-full mt-4 pl-0.5 text-xs font-medium text-n-1 dark:text-white transition-colors hover:text-purple-1 ${
                    visible ? "text-xs" : "xl:text-0"
                }`}
            >
                <Icon
                    className={`mr-3 icon-18 fill-n-1 dark:fill-white transition-colors group-hover:fill-purple-1 ${
                        visible ? "mr-3" : "xl:mr-0"
                    }`}
                    name="arrow-bottom"
                />
                See More
            </button>
        </>
    );
};

export default TeamMembers;
