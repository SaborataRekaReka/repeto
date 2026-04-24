import { useState, useRef, useEffect, useCallback, type MouseEventHandler, type KeyboardEventHandler } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import Head from "next/head";
import {
    House,
    Persons,
    Calendar,
    CirclePlus,
    Thunderbolt,
    Xmark,
    CreditCard,
    Receipt,
    ObjectAlignJustifyVertical,
    FolderOpen,
    Bell,
    Gear,
    CircleInfo,
    Magnifier,
    ArrowLeft,
    ChevronDown,
    ChevronRight,
    ArrowUpRightFromSquare,
    ArrowRightFromSquare,
    Sun,
    Display,
    Moon,
} from "@gravity-ui/icons";
import { Icon, Text, TextInput, Button, Tooltip, DropdownMenu, Avatar } from "@gravity-ui/uikit";
import type { IconData } from "@gravity-ui/uikit";
import StudentAvatar from "@/components/StudentAvatar";
import CreateStudentModal from "@/components/CreateStudentModal";
import CreatePaymentModal from "@/components/CreatePaymentModal";
import LessonPanelV2 from "@/components/LessonPanelV2";
import { useStudents } from "@/hooks/useStudents";
import { onNotificationsChanged, useUnreadCount } from "@/hooks/useNotifications";
import { useAuth } from "@/contexts/AuthContext";
import { useThemeMode, type ThemeMode } from "@/contexts/ThemeContext";
import { getInitials } from "@/lib/formatters";
import AnimatedSidebarIcon from "@/components/AnimatedSidebarIcon";

const GTooltip = Tooltip as any;
const GIcon = Icon as any;
const GText = Text as any;
const GTextInput = TextInput as any;
const GButton = Button as any;
const GDropdownMenu = DropdownMenu as any;

const SIDEBAR_KEY = "repeto-sidebar-collapsed";

function readSidebarCollapsed(): boolean {
    if (typeof window === "undefined") {
        return false;
    }
    try {
        return window.localStorage.getItem(SIDEBAR_KEY) === "1";
    } catch {
        return false;
    }
}

type GravityLayoutProps = {
    title?: string;
    back?: boolean;
    hideSidebar?: boolean;
    hideHeaderTitle?: boolean;
    children: React.ReactNode;
};

type DropdownSwitcherHandlers = {
    onClick: MouseEventHandler<HTMLElement>;
    onKeyDown: KeyboardEventHandler<HTMLElement>;
};

type MenuItem = {
    title: string;
    icon: IconData;
    url: string;
    animatedIconPath?: string;
};

type SidebarQuickAction = {
    id: string;
    title: string;
    icon: IconData;
    action: () => void;
    animatedIconPath?: string;
};

const sidebarAnimatedIconPaths = {
    students: "/icons/sidebar-animated/people.json",
    payments: "/icons/sidebar-animated/receipt.json",
    packages: "/icons/sidebar-animated/archive.json",
    files: "/icons/sidebar-animated/folder-open.json",
    quickLesson: "/icons/sidebar-animated/book-open.json",
    quickStudent: "/icons/sidebar-animated/user-add.json",
    quickPayment: "/icons/sidebar-animated/receipt-add.json",
    quickScheduleToday: "/icons/sidebar-animated/clock.json",
    quickPublic: "/icons/sidebar-animated/global.json",
    quickIntegrations: "/icons/sidebar-animated/folder-connection.json",
} as const;

const menuItems: MenuItem[] = [
    { title: "Главное", icon: House as IconData, url: "/dashboard" },
    {
        title: "Ученики",
        icon: Persons as IconData,
        url: "/students",
        animatedIconPath: sidebarAnimatedIconPaths.students,
    },
    { title: "Расписание", icon: Calendar as IconData, url: "/schedule" },
    { title: "Финансы", icon: CreditCard as IconData, url: "/finance" },
    {
        title: "Оплаты",
        icon: Receipt as IconData,
        url: "/payments",
        animatedIconPath: sidebarAnimatedIconPaths.payments,
    },
    {
        title: "Пакеты",
        icon: ObjectAlignJustifyVertical as IconData,
        url: "/packages",
        animatedIconPath: sidebarAnimatedIconPaths.packages,
    },
    {
        title: "Материалы",
        icon: FolderOpen as IconData,
        url: "/files",
        animatedIconPath: sidebarAnimatedIconPaths.files,
    },
];

const topHeaderUrls = new Set(["/dashboard", "/schedule", "/finance"]);
const topHeaderItems = menuItems.filter((item) => topHeaderUrls.has(item.url));
const sidebarMenuItems = menuItems.filter((item) => !topHeaderUrls.has(item.url));
const topHeaderThemeOptions: Array<{ mode: ThemeMode; label: string; icon: IconData }> = [
    { mode: "light", label: "Светлая", icon: Sun as IconData },
    { mode: "system", label: "Системная", icon: Display as IconData },
    { mode: "dark", label: "Темная", icon: Moon as IconData },
];

const bottomMenuItems: MenuItem[] = [
    { title: "Уведомления", icon: Bell as IconData, url: "/notifications" },
    { title: "Настройки", icon: Gear as IconData, url: "/settings" },
    { title: "Поддержка", icon: CircleInfo as IconData, url: "/support" },
];

const mobileNavItems: MenuItem[] = [
    { title: "Главное", icon: House as IconData, url: "/dashboard" },
    { title: "Ученики", icon: Persons as IconData, url: "/students" },
    { title: "Расписание", icon: Calendar as IconData, url: "/schedule" },
    { title: "Финансы", icon: CreditCard as IconData, url: "/finance" },
    { title: "Материалы", icon: FolderOpen as IconData, url: "/files" },
    { title: "Пакеты", icon: ObjectAlignJustifyVertical as IconData, url: "/packages" },
    { title: "Оплаты", icon: Receipt as IconData, url: "/payments" },
];

const GravityLayout = ({ title, back, hideSidebar = false, hideHeaderTitle = false, children }: GravityLayoutProps) => {
    const useFlatLayout = true;
    const router = useRouter();
    const pathname = router.asPath.split("?")[0];
    const { user, logout } = useAuth();
    const { themeMode, setTheme } = useThemeMode();
    const isPlatformAccessExpired = user?.platformAccessState === "expired";
    const [isMobileViewport, setIsMobileViewport] = useState(false);
    const tutorName = user?.name?.trim() || "Репетитор";
    const tutorSlug = user?.slug?.trim() || "";
    const { data: unreadData, refetch: refetchUnread } = useUnreadCount({
        skip: isPlatformAccessExpired,
    });
    const unreadCount = unreadData?.count || 0;

    useEffect(() => {
        return onNotificationsChanged(() => {
            refetchUnread();
        });
    }, [refetchUnread]);

    useEffect(() => {
        if (typeof window === "undefined") {
            return;
        }

        const mediaQuery = window.matchMedia("(max-width: 768px)");
        const syncViewport = () => {
            setIsMobileViewport(mediaQuery.matches);
        };

        syncViewport();

        if (typeof mediaQuery.addEventListener === "function") {
            mediaQuery.addEventListener("change", syncViewport);
            return () => {
                mediaQuery.removeEventListener("change", syncViewport);
            };
        }

        mediaQuery.addListener(syncViewport);
        return () => {
            mediaQuery.removeListener(syncViewport);
        };
    }, []);

    // Sidebar collapsed state
    const [collapsed, setCollapsed] = useState<boolean>(() => readSidebarCollapsed());
    const toggleCollapsed = useCallback(() => {
        setCollapsed((prev) => {
            const next = !prev;
            try {
                window.localStorage.setItem(SIDEBAR_KEY, next ? "1" : "0");
            } catch {}
            return next;
        });
    }, []);

    // Search
    const [searchOpen, setSearchOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [profileMenuOpen, setProfileMenuOpen] = useState(false);
    const [mobileProfileMenuOpen, setMobileProfileMenuOpen] = useState(false);
    const [createStudentModalOpen, setCreateStudentModalOpen] = useState(false);
    const [createPaymentModalOpen, setCreatePaymentModalOpen] = useState(false);
    const [createLessonModalOpen, setCreateLessonModalOpen] = useState(false);
    const [mobileQuickActionsOpen, setMobileQuickActionsOpen] = useState(false);
    const [hoveredSidebarIconKey, setHoveredSidebarIconKey] = useState<string | null>(null);
    const searchRef = useRef<HTMLDivElement>(null);
    const useTopHeaderSearch = useFlatLayout && !isMobileViewport;

    const closeSearch = useCallback(() => {
        setSearchOpen(false);
        setSearchQuery("");
    }, []);

    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
                closeSearch();
            }
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, [closeSearch]);

    useEffect(() => {
        if (!searchOpen) return;
        const frame = window.requestAnimationFrame(() => {
            const input = searchRef.current?.querySelector("input");
            input?.focus();
        });
        return () => window.cancelAnimationFrame(frame);
    }, [searchOpen]);

    const trimmedSearch = searchQuery.trim();
    const { data: studentsData } = useStudents({
        search: trimmedSearch || undefined,
        limit: 5,
    }, {
        skip: !trimmedSearch,
    });
    const searchResults = trimmedSearch
        ? (studentsData?.data || []).slice(0, 5)
        : [];
    const mobileSearchActive = isMobileViewport && searchOpen;
    const notificationsActive = pathname === "/notifications" || pathname.startsWith("/notifications/");

    const openPublicPage = useCallback(() => {
        setProfileMenuOpen(false);
        setMobileProfileMenuOpen(false);
        if (tutorSlug) {
            if (typeof window !== "undefined") {
                window.open(`/t/${tutorSlug}`, "_blank", "noopener,noreferrer");
                return;
            }
            router.push(`/t/${tutorSlug}`);
            return;
        }
        router.push("/settings?type=account");
    }, [router, tutorSlug]);

    const openIntegrations = useCallback(() => {
        router.push("/settings?tab=integrations");
    }, [router]);

    const openCreateStudentModal = useCallback(() => {
        setCreateStudentModalOpen(true);
    }, []);

    const handleCreateStudent = useCallback(async () => {
        await router.push("/students");
    }, [router]);

    const openCreateLessonModal = useCallback(() => {
        setCreateLessonModalOpen(true);
    }, []);

    const handleCreateLesson = useCallback(async () => {
        await router.push("/schedule");
    }, [router]);

    const openCreatePaymentModal = useCallback(() => {
        setCreatePaymentModalOpen(true);
    }, []);

    const handleCreatePayment = useCallback(async () => {
        await router.push("/payments");
    }, [router]);

    const quickActionItems: SidebarQuickAction[] = [
        {
            id: "quick-create-lesson",
            title: "Добавить занятие",
            icon: CirclePlus as IconData,
            animatedIconPath: sidebarAnimatedIconPaths.quickLesson,
            action: () => {
                openCreateLessonModal();
            },
        },
        {
            id: "quick-create-student",
            title: "Добавить ученика",
            icon: Persons as IconData,
            animatedIconPath: sidebarAnimatedIconPaths.quickStudent,
            action: () => {
                openCreateStudentModal();
            },
        },
        {
            id: "quick-create-payment",
            title: "Записать оплату",
            icon: Receipt as IconData,
            animatedIconPath: sidebarAnimatedIconPaths.quickPayment,
            action: () => {
                openCreatePaymentModal();
            },
        },
        {
            id: "quick-schedule-today",
            title: "Расписание сегодня",
            icon: Calendar as IconData,
            animatedIconPath: sidebarAnimatedIconPaths.quickScheduleToday,
            action: () => {
                void router.push("/schedule?view=day");
            },
        },
    ];

    const isCollapsed = collapsed;
    const footerMenuItems = useFlatLayout ? [] : bottomMenuItems;

    const sidebarCls = `repeto-sidebar ${isCollapsed ? "repeto-sidebar--collapsed" : ""} ${
        useFlatLayout ? "repeto-sidebar--flat" : ""
    }`;
    const shouldShowSidebar = !hideSidebar;
    const contentCls = `repeto-content ${shouldShowSidebar && isCollapsed ? "repeto-content--sidebar-collapsed" : ""} ${
        useFlatLayout ? "repeto-content--flat" : ""
    } ${shouldShowSidebar ? "repeto-content--with-sidebar" : "repeto-content--no-sidebar"}`;

    return (
        <>
            <Head>
                <title>{title ? `${title} — Repeto` : "Repeto"}</title>
            </Head>

            {useFlatLayout && (
                <header className="repeto-top-header" role="banner">
                    <div className="repeto-top-header__inner">
                        <div className="repeto-top-header__left">
                            <Link href="/dashboard" className="repeto-top-header__logo" aria-label="Repeto">
                                <img
                                    className="repeto-logo repeto-logo--full"
                                    src="/brand/logo.svg"
                                    alt="Repeto"
                                />
                            </Link>

                            <nav className="repeto-top-header__nav" aria-label="Основная навигация">
                                {topHeaderItems.map((item) => {
                                    const isActive =
                                        pathname === item.url ||
                                        (item.url !== "/dashboard" && pathname.startsWith(item.url + "/"));

                                    return (
                                        <Link
                                            key={item.url}
                                            href={item.url}
                                            className={`repeto-top-header__nav-item ${
                                                isActive ? "repeto-top-header__nav-item--active" : ""
                                            }`}
                                        >
                                            {item.title}
                                        </Link>
                                    );
                                })}
                            </nav>
                        </div>

                        <div className="repeto-top-header__right">
                            {useTopHeaderSearch && (
                                <div
                                    ref={searchRef}
                                    className={`repeto-top-header__search ${
                                        searchOpen ? "repeto-top-header__search--open" : ""
                                    }`}
                                >
                                    <div className="repeto-top-header__search-field">
                                        <GTextInput
                                            className="repeto-top-header__search-input"
                                            size="l"
                                            placeholder="Поиск учеников..."
                                            value={searchQuery}
                                            onUpdate={setSearchQuery}
                                            endContent={
                                                <GIcon
                                                    data={Magnifier as IconData}
                                                    size={18}
                                                    style={{
                                                        color: "var(--g-color-text-secondary)",
                                                        marginRight: 4,
                                                    }}
                                                />
                                            }
                                        />
                                    </div>

                                    {!searchOpen && (
                                        <button
                                            type="button"
                                            className="repeto-top-header__icon-btn repeto-top-header__search-btn"
                                            onClick={() => setSearchOpen(true)}
                                            aria-label="Поиск учеников"
                                        >
                                            <GIcon data={Magnifier as IconData} size={24} />
                                        </button>
                                    )}

                                    {searchOpen && trimmedSearch && (
                                        <div className="repeto-search-dropdown">
                                            {searchResults.length > 0 ? (
                                                <>
                                                    <div className="repeto-search-dropdown__label">Ученики</div>
                                                    {searchResults.map((s) => (
                                                        <button
                                                            key={s.id}
                                                            className="repeto-search-dropdown__item"
                                                            onClick={() => {
                                                                router.push(`/students/${s.id}`);
                                                                closeSearch();
                                                            }}
                                                        >
                                                            <StudentAvatar student={s} size="xs" />
                                                            <div style={{ display: "flex", flexDirection: "column", gap: 2, minWidth: 0 }}>
                                                                <GText variant="body-2" style={{ display: "block", lineHeight: 1.25 }}>
                                                                    {s.name}
                                                                </GText>
                                                                <GText variant="body-1" color="secondary" style={{ display: "block", lineHeight: 1.25 }}>
                                                                    {s.subject}
                                                                </GText>
                                                            </div>
                                                        </button>
                                                    ))}
                                                </>
                                            ) : (
                                                <div style={{ padding: "16px", textAlign: "center" }}>
                                                    <GText variant="body-1" color="secondary">
                                                        Ничего не найдено
                                                    </GText>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            )}

                            <Link
                                href="/notifications"
                                aria-label="Уведомления"
                                className={`repeto-top-header__icon-btn ${
                                    pathname === "/notifications" || pathname.startsWith("/notifications/")
                                        ? "repeto-top-header__icon-btn--active"
                                        : ""
                                }`}
                                style={{ position: "relative" }}
                            >
                                <GIcon data={Bell as IconData} size={24} />
                                {unreadCount > 0 && (
                                    <span
                                        style={{
                                            position: "absolute",
                                            top: 2,
                                            right: 2,
                                            width: 8,
                                            height: 8,
                                            borderRadius: "50%",
                                            background: "var(--g-color-text-danger)",
                                        }}
                                    />
                                )}
                            </Link>

                            <Link
                                href="/settings"
                                aria-label="Настройки"
                                className={`repeto-top-header__icon-btn ${
                                    pathname === "/settings" || pathname.startsWith("/settings/")
                                        ? "repeto-top-header__icon-btn--active"
                                        : ""
                                }`}
                            >
                                <GIcon data={Gear as IconData} size={24} />
                            </Link>

                            <Link
                                href="/support"
                                aria-label="Поддержка"
                                className={`repeto-top-header__icon-btn ${
                                    pathname === "/support" || pathname.startsWith("/support/")
                                        ? "repeto-top-header__icon-btn--active"
                                        : ""
                                }`}
                            >
                                <GIcon data={CircleInfo as IconData} size={24} />
                            </Link>

                            <GDropdownMenu
                                open={profileMenuOpen}
                                onOpenToggle={setProfileMenuOpen}
                                switcherWrapperClassName="repeto-top-header__profile-dropdown"
                                popupProps={{
                                    placement: "bottom-end",
                                    className: "repeto-top-header__profile-popup",
                                }}
                                renderSwitcher={({ onClick, onKeyDown }: DropdownSwitcherHandlers) => (
                                    <button
                                        type="button"
                                        className={`repeto-top-header__profile-trigger ${
                                            profileMenuOpen ? "repeto-top-header__profile-trigger--open" : ""
                                        }`}
                                        onClick={onClick}
                                        onKeyDown={onKeyDown}
                                        aria-label="Профиль"
                                    >
                                        <Avatar text={getInitials(user?.name || "U")} size="xs" theme="brand" />
                                        <span className="repeto-top-header__profile-name">{tutorName}</span>
                                        <span className="repeto-top-header__profile-chevron" aria-hidden="true">
                                            <GIcon data={ChevronDown as IconData} size={14} />
                                        </span>
                                    </button>
                                )}
                            >
                                <div className="repeto-top-header__profile-menu">
                                    <div className="repeto-top-header__profile-theme-label">Сменить тему</div>
                                    <div className="repeto-top-header__theme-switcher">
                                        {topHeaderThemeOptions.map((option) => (
                                            <button
                                                key={option.mode}
                                                type="button"
                                                title={`Тема: ${option.label}`}
                                                aria-label={`Тема: ${option.label}`}
                                                className={`repeto-top-header__theme-btn ${
                                                    themeMode === option.mode
                                                        ? "repeto-top-header__theme-btn--active"
                                                        : ""
                                                }`}
                                                onClick={() => {
                                                    setTheme(option.mode);
                                                    setProfileMenuOpen(false);
                                                }}
                                            >
                                                <GIcon data={option.icon} size={18} />
                                            </button>
                                        ))}
                                    </div>

                                    <button
                                        type="button"
                                        className="repeto-top-header__menu-item"
                                        onClick={openPublicPage}
                                    >
                                        <span>Публичная страница</span>
                                        <GIcon data={ArrowUpRightFromSquare as IconData} size={14} />
                                    </button>

                                    <div className="repeto-top-header__profile-divider" />

                                    <button
                                        type="button"
                                        className="repeto-top-header__menu-item repeto-top-header__menu-item--danger"
                                        onClick={() => {
                                            setProfileMenuOpen(false);
                                            void logout();
                                        }}
                                    >
                                        <GIcon data={ArrowRightFromSquare as IconData} size={16} />
                                        <span>Выйти из аккаунта</span>
                                    </button>
                                </div>
                            </GDropdownMenu>
                        </div>
                    </div>
                </header>
            )}

            {/* Sidebar */}
            {shouldShowSidebar && (
            <aside className={sidebarCls}>
                <Link href="/dashboard" className="repeto-sidebar__logo">
                    <img
                        className="repeto-logo repeto-logo--full"
                        src="/brand/logo.svg"
                        alt="Repeto"
                    />
                    <span className="repeto-sr-only">Repeto</span>
                </Link>

                <nav className="repeto-sidebar__nav repeto-sidebar__nav--sections">
                    <section className="repeto-sidebar__section repeto-sidebar__section--quick">
                        <div className="repeto-sidebar__section-head">
                            <span className="repeto-sidebar__section-title">Быстрые действия</span>
                            <button
                                type="button"
                                className="repeto-sidebar__collapse-btn"
                                onClick={toggleCollapsed}
                                aria-label={isCollapsed ? "Развернуть сайдбар" : "Свернуть сайдбар"}
                            >
                                <span
                                    className={`repeto-sidebar__collapse-glyph ${
                                        isCollapsed ? "repeto-sidebar__collapse-glyph--collapsed" : ""
                                    }`}
                                    aria-hidden="true"
                                >
                                    <GIcon data={ChevronRight as IconData} size={24} />
                                </span>
                            </button>
                        </div>

                        <div className="repeto-sidebar__section-list">
                            {quickActionItems.map((item) => {
                                const iconKey = `quick:${item.id}`;
                                const actionButton = (
                                    <button
                                        key={item.id}
                                        type="button"
                                        className="repeto-sidebar__item repeto-sidebar__item--main repeto-sidebar__item--quick"
                                        onClick={item.action}
                                        onMouseEnter={() => setHoveredSidebarIconKey(iconKey)}
                                        onMouseLeave={() =>
                                            setHoveredSidebarIconKey((prev) => (prev === iconKey ? null : prev))
                                        }
                                        onFocus={() => setHoveredSidebarIconKey(iconKey)}
                                        onBlur={() =>
                                            setHoveredSidebarIconKey((prev) => (prev === iconKey ? null : prev))
                                        }
                                    >
                                        <span className="repeto-sidebar__item-icon">
                                            {item.animatedIconPath ? (
                                                <AnimatedSidebarIcon
                                                    src={item.animatedIconPath}
                                                    fallbackIcon={item.icon}
                                                    play={hoveredSidebarIconKey === iconKey}
                                                    size={30}
                                                />
                                            ) : (
                                                <GIcon data={item.icon} size={30} />
                                            )}
                                        </span>
                                        <span className="repeto-sidebar__item-text">{item.title}</span>
                                    </button>
                                );

                                if (isCollapsed) {
                                    return (
                                        <GTooltip key={item.id} content={item.title} placement="right" openDelay={200} closeDelay={0}>
                                            {actionButton}
                                        </GTooltip>
                                    );
                                }

                                return actionButton;
                            })}
                        </div>
                    </section>

                    <section className="repeto-sidebar__section repeto-sidebar__section--navigation">
                        <div className="repeto-sidebar__section-head">
                            <span className="repeto-sidebar__section-title">Навигация</span>
                        </div>

                        <div className="repeto-sidebar__section-list">
                            {sidebarMenuItems.map((item) => {
                                const isActive =
                                    pathname === item.url ||
                                    (item.url !== "/dashboard" &&
                                        pathname.startsWith(item.url + "/"));
                                const iconKey = `nav:${item.url}`;

                                const linkContent = (
                                    <Link
                                        key={item.url}
                                        href={item.url}
                                        onMouseEnter={() => setHoveredSidebarIconKey(iconKey)}
                                        onMouseLeave={() =>
                                            setHoveredSidebarIconKey((prev) => (prev === iconKey ? null : prev))
                                        }
                                        onFocus={() => setHoveredSidebarIconKey(iconKey)}
                                        onBlur={() =>
                                            setHoveredSidebarIconKey((prev) => (prev === iconKey ? null : prev))
                                        }
                                        className={`repeto-sidebar__item repeto-sidebar__item--main ${
                                            isActive
                                                ? "repeto-sidebar__item--active"
                                                : ""
                                        }`}
                                    >
                                        <span className="repeto-sidebar__item-icon">
                                            {item.animatedIconPath ? (
                                                <AnimatedSidebarIcon
                                                    src={item.animatedIconPath}
                                                    fallbackIcon={item.icon}
                                                    play={hoveredSidebarIconKey === iconKey}
                                                    size={30}
                                                />
                                            ) : (
                                                <GIcon data={item.icon} size={30} />
                                            )}
                                        </span>
                                        <span className="repeto-sidebar__item-text">{item.title}</span>
                                    </Link>
                                );

                                if (isCollapsed) {
                                    return (
                                        <GTooltip key={item.url} content={item.title} placement="right" openDelay={200} closeDelay={0}>
                                            {linkContent}
                                        </GTooltip>
                                    );
                                }

                                return linkContent;
                            })}
                        </div>
                    </section>
                </nav>

                {!useFlatLayout && (
                    <div className="repeto-sidebar__footer">
                        {footerMenuItems.map((item) => {
                            const isActive =
                                pathname === item.url ||
                                pathname.startsWith(item.url + "/");

                            const linkContent = (
                                <Link
                                    key={item.url}
                                    href={item.url}
                                    className={`repeto-sidebar__item ${
                                        isActive
                                            ? "repeto-sidebar__item--active"
                                            : ""
                                    }`}
                                >
                                    <span className="repeto-sidebar__item-icon">
                                        <GIcon data={item.icon} size={18} />
                                        {item.url === "/notifications" && unreadCount > 0 && (
                                            <span className="repeto-sidebar__badge" />
                                        )}
                                    </span>
                                    <span className="repeto-sidebar__item-text">{item.title}</span>
                                </Link>
                            );

                            if (isCollapsed) {
                                return (
                                    <GTooltip key={item.url} content={item.title} placement="right" openDelay={200} closeDelay={0}>
                                        {linkContent}
                                    </GTooltip>
                                );
                            }
                            return linkContent;
                        })}
                        {isCollapsed ? (
                            <GTooltip content={tutorName} placement="right" openDelay={200} closeDelay={0}>
                                <button
                                    className="repeto-sidebar__profile-btn"
                                    onClick={() => router.push("/settings")}
                                >
                                    <Avatar text={getInitials(user?.name || "U")} size="xs" theme="brand" />
                                    <span className="repeto-sidebar__item-text">{tutorName}</span>
                                </button>
                            </GTooltip>
                        ) : (
                            <button
                                className="repeto-sidebar__profile-btn"
                                onClick={() => router.push("/settings")}
                            >
                                <Avatar text={getInitials(user?.name || "U")} size="xs" theme="brand" />
                                <span className="repeto-sidebar__item-text">{tutorName}</span>
                            </button>
                        )}
                    </div>
                )}

                {!useFlatLayout && (
                    <svg
                        className="repeto-sidebar__edge-toggle"
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="-2 12 20 94"
                        onClick={toggleCollapsed}
                        aria-label={isCollapsed ? "Развернуть меню" : "Свернуть меню"}
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => e.key === "Enter" && toggleCollapsed()}
                    >
                        <path
                            d="M0 106V12C0 36.2173 18 38 18 59.0624C18 80.1248 0 83.2963 0 106Z"
                            fill="var(--g-color-base-float)"
                        />
                        <circle cx="5.5" cy="54" r="1.5" fill="var(--g-color-text-secondary)" />
                        <circle cx="10.5" cy="54" r="1.5" fill="var(--g-color-text-secondary)" />
                        <circle cx="5.5" cy="59" r="1.5" fill="var(--g-color-text-secondary)" />
                        <circle cx="10.5" cy="59" r="1.5" fill="var(--g-color-text-secondary)" />
                        <circle cx="5.5" cy="64" r="1.5" fill="var(--g-color-text-secondary)" />
                        <circle cx="10.5" cy="64" r="1.5" fill="var(--g-color-text-secondary)" />
                    </svg>
                )}
            </aside>
            )}

            {/* Content */}
            <main className={contentCls}>
                {/* Header */}
                <header className={`repeto-header ${useFlatLayout ? "repeto-header--flat" : ""}`}>
                    <div className={`repeto-header__left ${mobileSearchActive ? "repeto-header__left--hidden" : ""}`}>
                        {isMobileViewport ? (
                            <>
                                {back && (
                                    <GButton
                                        view="flat"
                                        size="m"
                                        onClick={() => router.back()}
                                        className="repeto-header__mobile-back"
                                    >
                                        <GIcon data={ArrowLeft as IconData} size={18} />
                                    </GButton>
                                )}

                                <GDropdownMenu
                                    open={mobileProfileMenuOpen}
                                    onOpenToggle={setMobileProfileMenuOpen}
                                    switcherWrapperClassName="repeto-header__mobile-profile-dropdown"
                                    popupProps={{
                                        placement: "bottom-start",
                                        className: "repeto-header__mobile-profile-popup",
                                    }}
                                    renderSwitcher={({ onClick, onKeyDown }: DropdownSwitcherHandlers) => (
                                        <button
                                            type="button"
                                            className={`repeto-top-header__profile-trigger repeto-header__profile-trigger ${
                                                mobileProfileMenuOpen ? "repeto-top-header__profile-trigger--open" : ""
                                            }`}
                                            onClick={onClick}
                                            onKeyDown={onKeyDown}
                                            aria-label="Профиль"
                                        >
                                            <Avatar text={getInitials(user?.name || "U")} size="xs" theme="brand" />
                                            <span className="repeto-top-header__profile-name">{tutorName}</span>
                                            <span className="repeto-top-header__profile-chevron" aria-hidden="true">
                                                <GIcon data={ChevronDown as IconData} size={14} />
                                            </span>
                                        </button>
                                    )}
                                >
                                    <div className="repeto-top-header__profile-menu repeto-header__mobile-profile-menu">
                                        <button
                                            type="button"
                                            className="repeto-top-header__menu-item"
                                            onClick={() => {
                                                setMobileProfileMenuOpen(false);
                                                void router.push("/settings");
                                            }}
                                        >
                                            <span>Настройки</span>
                                            <GIcon data={Gear as IconData} size={14} />
                                        </button>

                                        <button
                                            type="button"
                                            className="repeto-top-header__menu-item"
                                            onClick={openPublicPage}
                                        >
                                            <span>Публичная страница</span>
                                            <GIcon data={ArrowUpRightFromSquare as IconData} size={14} />
                                        </button>

                                        <div className="repeto-top-header__profile-divider" />

                                        <button
                                            type="button"
                                            className="repeto-top-header__menu-item repeto-top-header__menu-item--danger"
                                            onClick={() => {
                                                setMobileProfileMenuOpen(false);
                                                void logout();
                                            }}
                                        >
                                            <GIcon data={ArrowRightFromSquare as IconData} size={16} />
                                            <span>Выйти из аккаунта</span>
                                        </button>
                                    </div>
                                </GDropdownMenu>
                            </>
                        ) : (
                            <>
                                {back && (
                                    <GButton
                                        view="flat"
                                        size="m"
                                        onClick={() => router.back()}
                                        style={{ marginRight: 8 }}
                                    >
                                        <GIcon data={ArrowLeft as IconData} size={18} />
                                    </GButton>
                                )}
                                {title && !hideHeaderTitle && (
                                    <h1 className="repeto-page-title">{title}</h1>
                                )}
                            </>
                        )}
                    </div>
                    <div className={`repeto-header__right ${mobileSearchActive ? "repeto-header__right--search-open" : ""}`}>
                        {!useTopHeaderSearch && (
                            <div
                                ref={searchRef}
                                className={`repeto-header__search ${mobileSearchActive ? "repeto-header__search--mobile" : ""}`}
                            >
                                {searchOpen ? (
                                    <>
                                        <GTextInput
                                            className={`repeto-header__search-input ${mobileSearchActive ? "repeto-header__search-input--mobile" : ""}`}
                                            size="m"
                                            placeholder="Поиск учеников..."
                                            value={searchQuery}
                                            onUpdate={setSearchQuery}
                                            autoFocus
                                            style={mobileSearchActive ? undefined : { width: 260 }}
                                            startContent={
                                                <GIcon
                                                    data={Magnifier as IconData}
                                                    size={16}
                                                    style={{
                                                        color: "var(--g-color-text-secondary)",
                                                        marginLeft: 4,
                                                        marginRight: 2,
                                                    }}
                                                />
                                            }
                                        />
                                        {mobileSearchActive && (
                                            <GButton
                                                view="flat"
                                                size="m"
                                                onClick={() => {
                                                    setSearchOpen(false);
                                                    setSearchQuery("");
                                                }}
                                            >
                                                Закрыть
                                            </GButton>
                                        )}
                                    </>
                                ) : (
                                    <GButton
                                        view="flat"
                                        size="m"
                                        onClick={() => setSearchOpen(true)}
                                    >
                                        <GIcon data={Magnifier as IconData} size={18} />
                                    </GButton>
                                )}

                                {/* Search results dropdown */}
                                {searchOpen && searchQuery.trim() && (
                                    <div className={`repeto-search-dropdown ${mobileSearchActive ? "repeto-search-dropdown--mobile" : ""}`}>
                                        {searchResults.length > 0 ? (
                                            <>
                                                <div className="repeto-search-dropdown__label">
                                                    Ученики
                                                </div>
                                                {searchResults.map((s) => (
                                                    <button
                                                        key={s.id}
                                                        className="repeto-search-dropdown__item"
                                                        onClick={() => {
                                                            router.push(`/students/${s.id}`);
                                                            setSearchOpen(false);
                                                            setSearchQuery("");
                                                        }}
                                                    >
                                                        <StudentAvatar student={s} size="xs" />
                                                        <div style={{ display: "flex", flexDirection: "column", gap: 2, minWidth: 0 }}>
                                                            <GText variant="body-2" style={{ display: "block", lineHeight: 1.25 }}>
                                                                {s.name}
                                                            </GText>
                                                            <GText variant="body-1" color="secondary" style={{ display: "block", lineHeight: 1.25 }}>
                                                                {s.subject}
                                                            </GText>
                                                        </div>
                                                    </button>
                                                ))}
                                            </>
                                        ) : (
                                            <div style={{ padding: "16px", textAlign: "center" }}>
                                                <GText variant="body-1" color="secondary">
                                                    Ничего не найдено
                                                </GText>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        )}

                        {!mobileSearchActive && (
                            <>
                                {isMobileViewport && (
                                    <button
                                        type="button"
                                        aria-label="Уведомления"
                                        className={`repeto-top-header__icon-btn repeto-header__icon-btn ${
                                            notificationsActive ? "repeto-top-header__icon-btn--active" : ""
                                        }`}
                                        onClick={() => {
                                            void router.push("/notifications");
                                        }}
                                    >
                                        <span className="repeto-mobile-nav__icon">
                                            <GIcon data={Bell as IconData} size={18} />
                                            {unreadCount > 0 && (
                                                <span className="repeto-mobile-nav__badge" />
                                            )}
                                        </span>
                                    </button>
                                )}

                                {!isMobileViewport && !useFlatLayout && (
                                    <GButton
                                        view="flat"
                                        size="m"
                                        onClick={() => router.push("/notifications")}
                                        style={{ position: "relative" }}
                                    >
                                        <GIcon data={Bell as IconData} size={18} />
                                        {unreadCount > 0 && (
                                            <span className="repeto-notification-dot" />
                                        )}
                                    </GButton>
                                )}
                            </>
                        )}
                    </div>
                </header>

                {children}
            </main>

            {isMobileViewport && (
                <>
                    {mobileQuickActionsOpen && (
                        <button
                            type="button"
                            className="repeto-quick-actions-backdrop"
                            aria-label="Закрыть быстрые действия"
                            onClick={() => setMobileQuickActionsOpen(false)}
                        />
                    )}

                    <div
                        className={`repeto-mobile-fab-wrap${mobileQuickActionsOpen ? " repeto-mobile-fab-wrap--open" : ""}`}
                        aria-label="Быстрые действия"
                    >
                    <GDropdownMenu
                        open={mobileQuickActionsOpen}
                        onOpenToggle={setMobileQuickActionsOpen}
                        popupProps={{
                            placement: "top",
                            className: "repeto-mobile-fab__popup",
                        }}
                        renderSwitcher={(props: any) => (
                            <button
                                type="button"
                                className="repeto-mobile-fab"
                                aria-label={mobileQuickActionsOpen ? "Закрыть быстрые действия" : "Открыть быстрые действия"}
                                {...props}
                            >
                                <GIcon data={(mobileQuickActionsOpen ? Xmark : Thunderbolt) as IconData} size={22} />
                            </button>
                        )}
                    >
                        <div className="repeto-quick-actions-menu">
                            <div className="repeto-quick-actions-menu__list">
                                {quickActionItems.map((item) => (
                                    <button
                                        key={item.id}
                                        type="button"
                                        className="repeto-quick-actions-menu__item"
                                        onClick={() => {
                                            setMobileQuickActionsOpen(false);
                                            item.action();
                                        }}
                                    >
                                        <span className="repeto-quick-actions-menu__item-icon" aria-hidden="true">
                                            <GIcon data={item.icon} size={24} />
                                        </span>
                                        <span className="repeto-quick-actions-menu__item-text">{item.title}</span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    </GDropdownMenu>
                    </div>
                </>
            )}

            <nav className="repeto-mobile-nav" aria-label="Мобильная навигация">
                {mobileNavItems.map((item) => {
                    const isActive =
                        pathname === item.url ||
                        (item.url !== "/dashboard" && pathname.startsWith(item.url + "/"));

                    return (
                        <Link
                            key={item.url}
                            href={item.url}
                            className={`repeto-mobile-nav__item ${isActive ? "repeto-mobile-nav__item--active" : ""}`}
                        >
                            <span className="repeto-mobile-nav__icon">
                                <GIcon data={item.icon} size={18} />
                                {item.url === "/notifications" && unreadCount > 0 && (
                                    <span className="repeto-mobile-nav__badge" />
                                )}
                            </span>
                            <span className="repeto-mobile-nav__label">{item.title}</span>
                        </Link>
                    );
                })}
            </nav>

            <CreateStudentModal
                visible={createStudentModalOpen}
                onClose={() => setCreateStudentModalOpen(false)}
                onCreated={handleCreateStudent}
            />

            <CreatePaymentModal
                visible={createPaymentModalOpen}
                onClose={() => setCreatePaymentModalOpen(false)}
                onCreated={handleCreatePayment}
            />

            <LessonPanelV2
                open={createLessonModalOpen}
                onClose={() => setCreateLessonModalOpen(false)}
                onSaved={handleCreateLesson}
            />
        </>
    );
};

export default GravityLayout;
