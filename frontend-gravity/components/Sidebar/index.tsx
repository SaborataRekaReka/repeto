import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import Logo from "@/components/Logo";
import Image from "@/components/Image";
import Icon from "@/components/Icon";
import Menu from "./Menu";
import { useAuth } from "@/contexts/AuthContext";
import { getInitials } from "@/lib/formatters";

type SidebarProps = {};

const Sidebar = ({}: SidebarProps) => {
    const { user, logout } = useAuth();
    const [visible, setVisible] = useState<boolean>(false);
    const [menuOpen, setMenuOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);
    const router = useRouter();

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(e.target as Node))
                setMenuOpen(false);
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () =>
            document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const publicPageUrl = user?.slug ? `/t/${user.slug}` : null;

    const profileMenuItems = [
        { title: "Настройки", icon: "setup", url: "/settings" },
        {
            title: "Публичная страница",
            icon: "earth",
            url: publicPageUrl,
            openInNewTab: true,
        },
    ];

    return (
        <div
            className={`fixed top-0 left-0 bottom-0 flex flex-col w-[18.75rem] pt-6 px-8 pb-4.5 bg-white dark:bg-n-1 overflow-auto scroll-smooth xl:z-30 md:hidden ${
                visible ? "w-[18.75rem]" : "xl:w-20"
            }`}
        >
            <div className="flex justify-between items-center mb-11">
                <Logo className={visible ? "flex" : "xl:hidden"} />
                <button
                    className="hidden xl:flex"
                    onClick={() => setVisible(!visible)}
                >
                    <Icon
                        className="fill-n-1 dark:fill-white"
                        name={visible ? "close" : "burger"}
                    />
                </button>
            </div>
            <Menu visible={visible} />
            <div
                className={`relative flex items-center h-18 mt-auto mx-0 pt-10 ${
                    visible ? "mx-0" : "xl:-mx-4"
                }`}
            >
                <Link
                    className={`inline-flex items-center font-bold text-n-1 dark:text-white text-sm transition-colors hover:text-purple-1 ${
                        visible ? "mx-0 text-sm" : "xl:mx-auto xl:text-0"
                    }`}
                    href="/settings"
                >
                    <div
                        className={`relative flex items-center justify-center w-5.5 h-5.5 mr-2.5 rounded-full overflow-hidden bg-purple-3 text-[0.5rem] font-bold text-n-1 dark:bg-purple-1/20 ${
                            visible ? "mr-2.5" : "xl:mr-0"
                        }`}
                    >
                        {user?.avatar ? (
                            <Image
                                className="object-cover scale-105"
                                src={user.avatar}
                                fill
                                alt="Avatar"
                            />
                        ) : (
                            getInitials(user?.name || "")
                        )}
                    </div>
                    {user?.name ? user.name.split(" ").slice(0, 2).reverse().join(" ") : ""}
                </Link>
                <div className="relative ml-auto">
                    <button
                        className={`btn-transparent-dark btn-square btn-small ${
                            visible ? "flex" : "xl:hidden"
                        }`}
                        onClick={() => setMenuOpen(!menuOpen)}
                    >
                        <Icon name="dots" />
                    </button>
                    {menuOpen && (
                        <div
                            ref={menuRef}
                            className="absolute bottom-full right-0 mb-2 w-56 p-2 bg-white border border-n-1 rounded-sm shadow-lg overflow-hidden dark:bg-n-1 dark:border-white z-50"
                        >
                            {profileMenuItems.map((item, index) => (
                                <button
                                    key={index}
                                    className="flex items-center w-full px-3 py-2 text-sm font-bold text-n-1 dark:text-white rounded-sm transition-colors hover:bg-n-3/20"
                                    onClick={() => {
                                        setMenuOpen(false);
                                        if (item.openInNewTab) {
                                            if (item.url) {
                                                window.open(
                                                    item.url,
                                                    "_blank",
                                                    "noopener,noreferrer"
                                                );
                                            } else {
                                                router.push("/settings");
                                            }
                                            return;
                                        }

                                        if (item.url) {
                                            router.push(item.url);
                                        }
                                    }}
                                >
                                    <Icon
                                        className="shrink-0 mr-2 fill-n-1 dark:fill-white"
                                        name={item.icon}
                                    />
                                    <span className="truncate">{item.title}</span>
                                </button>
                            ))}
                            <div className="my-1 border-t border-dashed border-n-1 dark:border-white" />
                            <button
                                className="flex items-center w-full px-3 py-2 text-sm font-bold text-pink-1 rounded-sm transition-colors hover:bg-pink-1/10"
                                onClick={() => {
                                    setMenuOpen(false);
                                    logout();
                                }}
                            >
                                <Icon
                                    className="shrink-0 mr-2 fill-pink-1"
                                    name="arrow-next"
                                />
                                Выйти
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Sidebar;
