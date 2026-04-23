import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import Icon from "@/components/Icon";

import { navigationMobile } from "@/constants/navigation";
import { twMerge } from "tailwind-merge";

const moreLinks = [
    { title: "Материалы", icon: "folder", url: "/files" },
    { title: "Уведомления", icon: "notification-bell", url: "/notifications" },
    { title: "Настройки", icon: "setup", url: "/settings" },
    { title: "Поддержка", icon: "info-circle", url: "/support" },
];

type MenuProps = {};

const Menu = ({}: MenuProps) => {
    const router = useRouter();
    const [moreOpen, setMoreOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
                setMoreOpen(false);
            }
        };
        if (moreOpen) {
            document.addEventListener("mousedown", handleClickOutside);
        }
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [moreOpen]);

    // Close menu on navigation
    useEffect(() => {
        setMoreOpen(false);
    }, [router.pathname]);

    return (
        <div className="fixed left-0 bottom-0 right-0 z-10 hidden justify-between items-center px-3 bg-surface-page border-t border-n-1 md:flex dark:border-white">
            {navigationMobile.map((link: any, index: number) =>
                link.url ? (
                    <Link
                        className="flex justify-center items-center w-12 h-18 tap-highlight-color"
                        href={link.url}
                        key={index}
                    >
                        <Icon
                            className={`icon-22 transition-colors dark:fill-white ${
                                router.pathname === link.url && "!fill-purple-1"
                            }`}
                            name={link.icon}
                        />
                    </Link>
                ) : (
                    <div className="relative" key={index} ref={menuRef}>
                        <button
                            className="flex justify-center items-center w-12 h-18"
                            onClick={() => setMoreOpen((v) => !v)}
                        >
                            <Icon
                                className={`icon-22 transition-colors dark:fill-white ${
                                    moreOpen ? "!fill-purple-1" : ""
                                }`}
                                name={link.icon}
                            />
                        </button>
                        {moreOpen && (
                            <div className="absolute bottom-full right-0 mb-2 w-48 py-2 bg-white rounded-xl shadow-primary-4 border border-n-1 dark:bg-n-2 dark:border-white/10">
                                {moreLinks.map((item) => (
                                    <Link
                                        key={item.url}
                                        href={item.url}
                                        className={twMerge(
                                            "flex items-center gap-3 px-4 py-2.5 text-sm font-bold transition-colors hover:bg-n-3/10 dark:hover:bg-white/10 dark:text-white",
                                            router.pathname.startsWith(item.url) && "text-purple-1"
                                        )}
                                    >
                                        <Icon
                                            className={twMerge(
                                                "icon-18 dark:fill-white",
                                                router.pathname.startsWith(item.url) && "!fill-purple-1"
                                            )}
                                            name={item.icon}
                                        />
                                        {item.title}
                                    </Link>
                                ))}
                            </div>
                        )}
                    </div>
                )
            )}
        </div>
    );
};

export default Menu;
