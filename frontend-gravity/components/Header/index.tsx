import { useState, useRef, useEffect } from "react";
import { useScrollPosition } from "@n8tb1t/use-scroll-position";
import { useRouter } from "next/router";
import Icon from "@/components/Icon";
import Image from "@/components/Image";
import Create from "./Create";
import { useStudents } from "@/hooks/useStudents";
import { getInitials, getSubjectBgColor } from "@/mocks/students";
import { onNotificationsChanged, useUnreadCount } from "@/hooks/useNotifications";
import { useAuth } from "@/contexts/AuthContext";

type HeaderProps = {
    back?: boolean;
    title?: string;
};

const Header = ({ back, title }: HeaderProps) => {
    const [headerStyle, setHeaderStyle] = useState<boolean>(false);
    const [searchOpen, setSearchOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const searchRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const router = useRouter();
    const { user } = useAuth();
    const { data: unreadData, refetch: refetchUnread } = useUnreadCount();
    const unreadCount = unreadData?.count || 0;

    useEffect(() => {
        return onNotificationsChanged(() => {
            refetchUnread();
        });
    }, [refetchUnread]);

    useScrollPosition(({ currPos }) => {
        setHeaderStyle(currPos.y <= -1);
    });

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
                setSearchOpen(false);
                setSearchQuery("");
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    useEffect(() => {
        if (searchOpen && inputRef.current) inputRef.current.focus();
    }, [searchOpen]);

    const { data: studentsData } = useStudents({ search: searchQuery.trim() || undefined, limit: 5 });
    const filteredStudents = searchQuery.trim()
        ? (studentsData?.data || []).slice(0, 5)
        : [];

    return (
        <header
            className={`fixed top-0 right-0 left-[18.75rem] z-20 border-b border-n-1 xl:left-20 md:left-0 md:relative dark:border-white ${
                headerStyle
                    ? "bg-background dark:bg-n-2 md:!bg-transparent"
                    : ""
            }`}
        >
            <div className="flex items-center max-w-[90rem] m-auto w-full h-18 px-16 2xl:px-8 lg:px-6 md:px-5">
                {back && (
                    <button
                        className="btn-stroke btn-square btn-medium shrink-0 mr-6 2xl:mr-4 md:!w-6 md:h-6 md:mr-3"
                        onClick={() => router.back()}
                    >
                        <Icon name="arrow-prev" />
                    </button>
                )}
                {title && (
                    <div className="mr-4 text-h3 truncate md:mr-2 md:text-h4">
                        {title}
                    </div>
                )}
                <div className="flex items-center shrink-0 ml-auto">
                    <div ref={searchRef} className="relative mr-2">
                        <div
                            className={`flex items-center transition-all duration-200 ${
                                searchOpen
                                    ? "w-64 md:w-48 bg-white dark:bg-n-1 border border-n-1 dark:border-white rounded-sm"
                                    : "w-auto"
                            }`}
                        >
                            <button
                                className="btn-transparent-dark btn-square btn-medium shrink-0 md:!w-6 md:h-6"
                                onClick={() => {
                                    if (!searchOpen) setSearchOpen(true);
                                    else if (!searchQuery.trim()) {
                                        setSearchOpen(false);
                                        setSearchQuery("");
                                    }
                                }}
                            >
                                <Icon name="search" />
                            </button>
                            {searchOpen && (
                                <input
                                    ref={inputRef}
                                    className="flex-1 h-10 pr-3 bg-transparent text-sm font-bold text-n-1 dark:text-white outline-none placeholder:text-n-3 dark:placeholder:text-white/50"
                                    placeholder="Поиск учеников..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                            )}
                        </div>
                        {/* Search results dropdown */}
                        {searchOpen && searchQuery.trim() && (
                            <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-n-1 border border-n-1 dark:border-white rounded-sm shadow-lg z-50 overflow-hidden">
                                {filteredStudents.length > 0 ? (
                                    <>
                                        <div className="px-4 py-2 text-xs font-bold text-n-3 dark:text-white/50">
                                            Ученики
                                        </div>
                                        {filteredStudents.map((s) => (
                                            <button
                                                key={s.id}
                                                className="flex items-center w-full px-4 py-2.5 text-left hover:bg-n-3/10 dark:hover:bg-white/5 transition-colors"
                                                onClick={() => {
                                                    router.push(`/students/${s.id}`);
                                                    setSearchOpen(false);
                                                    setSearchQuery("");
                                                }}
                                            >
                                                <div
                                                    className={`flex items-center justify-center w-8 h-8 mr-3 rounded-full text-xs font-bold text-n-1 ${getSubjectBgColor(s.subject)}`}
                                                >
                                                    {getInitials(s.name)}
                                                </div>
                                                <div>
                                                    <div className="text-sm font-bold text-n-1 dark:text-white">
                                                        {s.name}
                                                    </div>
                                                    <div className="text-xs text-n-3 dark:text-white/50">
                                                        {s.subject} · {s.grade} класс
                                                    </div>
                                                </div>
                                            </button>
                                        ))}
                                        {/* Placeholder for future file search */}
                                    </>
                                ) : (
                                    <div className="px-4 py-4 text-sm text-n-3 dark:text-white/50 text-center">
                                        Ничего не найдено
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                    <button
                        className="btn-transparent-dark btn-square btn-medium relative mr-2 md:w-6 md:h-6"
                        onClick={() => router.push("/notifications")}
                    >
                        <Icon name="notification" />
                        {unreadCount > 0 && (
                            <div className="absolute top-1.5 right-[0.5625rem] w-2 h-2 border border-white rounded-full bg-green-1 md:top-0.5 md:right-[0.5rem] dark:border-n-2"></div>
                        )}
                    </button>
                    <Create />
                    <button className="relative hidden w-8 h-8 ml-1 md:block" onClick={() => router.push("/settings")}>
                        <div className="flex items-center justify-center w-full h-full rounded-full overflow-hidden bg-purple-3 text-[0.5rem] font-bold text-n-1 dark:bg-purple-1/20">
                            {user?.avatar ? (
                                <Image
                                    className="rounded-full object-cover"
                                    src={user.avatar}
                                    fill
                                    alt="Avatar"
                                />
                            ) : (
                                getInitials(user?.name || "")
                            )}
                        </div>
                    </button>
                </div>
            </div>
        </header>
    );
};

export default Header;
