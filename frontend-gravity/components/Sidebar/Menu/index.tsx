import Link from "next/link";
import { useRouter } from "next/router";
import { useEffect } from "react";
import Icon from "@/components/Icon";

import { navigation } from "@/constants/navigation";
import { onNotificationsChanged, useUnreadCount } from "@/hooks/useNotifications";
import { twMerge } from "tailwind-merge";

type MenuProps = {
    visible?: boolean;
};

const Menu = ({ visible }: MenuProps) => {
    const router = useRouter();
    const { data: unreadData, refetch } = useUnreadCount();
    const unreadCount = unreadData?.count || 0;

    useEffect(() => {
        return onNotificationsChanged(() => {
            refetch();
        });
    }, [refetch]);

    return (
        <>
            <div
                className={`mb-3 overflow-hidden whitespace-nowrap text-xs font-medium text-n-3 dark:text-white/50 ${
                    visible ? "w-full opacity-100" : "xl:w-0 xl:opacity-0"
                }`}
            >
                Навигация
            </div>
            <div className="-mx-4 mb-10">
                {navigation.map((link: any, index: number) => {
                    const counter =
                        link.url === "/notifications"
                            ? unreadCount
                            : link.counter;

                    return (
                    <Link
                        className={twMerge(
                            `flex items-center h-9.5 mb-2 px-4 text-sm text-n-1 fill-n-1 dark:text-white dark:fill-white font-bold last:mb-0 transition-colors hover:bg-n-4 dark:hover:bg-n-2 ${
                                router.pathname === link.url &&
                                "bg-n-4 dark:bg-n-2 text-purple-1 fill-purple-1"
                            } ${visible ? "text-sm" : "xl:text-0"}`
                        )}
                        href={link.url}
                        key={index}
                    >
                        <Icon
                            className={`mr-3 fill-inherit ${
                                visible ? "mr-3" : "xl:mr-0"
                            }`}
                            name={link.icon}
                        />
                        {link.title}
                        {counter > 0 && (
                            <div
                                className={`min-w-[1.625rem] ml-auto px-1 py-0.25 text-center text-xs font-bold text-n-1 ${
                                    visible ? "block" : "xl:hidden"
                                }`}
                                style={{
                                    backgroundColor:
                                        link.counterColor || "var(--accent)",
                                }}
                            >
                                {counter}
                            </div>
                        )}
                    </Link>
                    );
                })}
            </div>
        </>
    );
};

export default Menu;
