import { useState, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import Head from "next/head";
import {
    House,
    Persons,
    Calendar,
    CirclePlus,
    CreditCard,
    Receipt,
    ObjectAlignJustifyVertical,
    FolderOpen,
    Bell,
    Gear,
    CircleInfo,
    Magnifier,
    ArrowLeft,
} from "@gravity-ui/icons";
import { Icon, Text, TextInput, Button, Tooltip, DropdownMenu, Avatar } from "@gravity-ui/uikit";
import type { IconData } from "@gravity-ui/uikit";
import { useStudents } from "@/hooks/useStudents";
import { onNotificationsChanged, useUnreadCount } from "@/hooks/useNotifications";
import { useAuth } from "@/contexts/AuthContext";
import { getInitials } from "@/lib/formatters";

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
    children: React.ReactNode;
};

type MenuItem = { title: string; icon: IconData; url: string };

const menuItems: MenuItem[] = [
    { title: "Дашборд", icon: House as IconData, url: "/dashboard" },
    { title: "Ученики", icon: Persons as IconData, url: "/students" },
    { title: "Расписание", icon: Calendar as IconData, url: "/schedule" },
    { title: "Финансы", icon: CreditCard as IconData, url: "/finance" },
    { title: "Оплаты", icon: Receipt as IconData, url: "/payments" },
    {
        title: "Пакеты",
        icon: ObjectAlignJustifyVertical as IconData,
        url: "/packages",
    },
    { title: "Материалы", icon: FolderOpen as IconData, url: "/files" },
];

const bottomMenuItems: MenuItem[] = [
    { title: "Уведомления", icon: Bell as IconData, url: "/notifications" },
    { title: "Настройки", icon: Gear as IconData, url: "/settings" },
    { title: "Поддержка", icon: CircleInfo as IconData, url: "/support" },
];

const GravityLayout = ({ title, back, children }: GravityLayoutProps) => {
    const router = useRouter();
    const pathname = router.asPath.split("?")[0];
    const { user } = useAuth();
    const tutorName = user?.name?.trim() || "Репетитор";
    const { data: unreadData, refetch: refetchUnread } = useUnreadCount();
    const unreadCount = unreadData?.count || 0;

    useEffect(() => {
        return onNotificationsChanged(() => {
            refetchUnread();
        });
    }, [refetchUnread]);

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
    const searchRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
                setSearchOpen(false);
                setSearchQuery("");
            }
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, []);

    const { data: studentsData } = useStudents({
        search: searchQuery.trim() || undefined,
        limit: 5,
    });
    const searchResults = searchQuery.trim()
        ? (studentsData?.data || []).slice(0, 5)
        : [];

    const sidebarCls = `repeto-sidebar ${collapsed ? "repeto-sidebar--collapsed" : ""}`;

    return (
        <>
            <Head>
                <title>{title ? `${title} — Repeto` : "Repeto"}</title>
            </Head>

            {/* Sidebar */}
            <aside className={sidebarCls}>
                <Link href="/dashboard" className="repeto-sidebar__logo">
                    <span className="repeto-sidebar__logo-icon" aria-hidden="true">
                        <img
                            className="repeto-logo repeto-logo--icon repeto-logo--light"
                            src="/brand/icon.svg"
                            alt=""
                        />
                        <img
                            className="repeto-logo repeto-logo--icon repeto-logo--dark"
                            src="/brand/icon_white.svg"
                            alt=""
                        />
                    </span>
                    <span className="repeto-sidebar__logo-text" aria-hidden="true">
                        <img
                            className="repeto-logo repeto-logo--full repeto-logo--light"
                            src="/brand/logo.svg"
                            alt=""
                        />
                        <img
                            className="repeto-logo repeto-logo--full repeto-logo--dark"
                            src="/brand/logo_text_white.svg"
                            alt=""
                        />
                    </span>
                    <span className="repeto-sr-only">Repeto</span>
                </Link>

                <nav className="repeto-sidebar__nav">
                    {menuItems.map((item) => {
                        const isActive =
                            pathname === item.url ||
                            (item.url !== "/dashboard" &&
                                pathname.startsWith(item.url + "/"));

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
                                </span>
                                <span className="repeto-sidebar__item-text">{item.title}</span>
                            </Link>
                        );

                        if (collapsed) {
                            return (
                                <GTooltip key={item.url} content={item.title} placement="right" openDelay={200} closeDelay={0}>
                                    {linkContent}
                                </GTooltip>
                            );
                        }
                        return linkContent;
                    })}
                </nav>

                {/* Collapse toggle */}
                <div className="repeto-sidebar__footer">
                    {bottomMenuItems.map((item) => {
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

                        if (collapsed) {
                            return (
                                <GTooltip key={item.url} content={item.title} placement="right" openDelay={200} closeDelay={0}>
                                    {linkContent}
                                </GTooltip>
                            );
                        }
                        return linkContent;
                    })}
                    {collapsed ? (
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

                <svg
                    className="repeto-sidebar__edge-toggle"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="-2 12 20 94"
                    onClick={toggleCollapsed}
                    aria-label={collapsed ? "Развернуть меню" : "Свернуть меню"}
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
            </aside>

            {/* Content */}
            <main className={`repeto-content ${collapsed ? "repeto-content--sidebar-collapsed" : ""}`}>
                {/* Header */}
                <header className="repeto-header">
                    <div className="repeto-header__left">
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
                        {title && (
                            <GText variant="header-1">{title}</GText>
                        )}
                    </div>
                    <div className="repeto-header__right">
                        {/* Search */}
                        <div ref={searchRef} style={{ position: "relative" }}>
                            {searchOpen ? (
                                <GTextInput
                                    size="m"
                                    placeholder="Поиск учеников..."
                                    value={searchQuery}
                                    onUpdate={setSearchQuery}
                                    autoFocus
                                    style={{ width: 260 }}
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
                                <div className="repeto-search-dropdown">
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
                                                    <Avatar text={getInitials(s.name)} size="xs" theme="brand" />
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

                        {/* Notifications */}
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

                        <GDropdownMenu
                            switcher={
                                <GButton view="action" size="m">
                                    <GIcon data={CirclePlus as IconData} size={16} />
                                    Добавить
                                </GButton>
                            }
                            items={[
                                {
                                    text: "Новый ученик",
                                    action: () => router.push("/students?create=1"),
                                },
                                {
                                    text: "Новое занятие",
                                    action: () => router.push("/schedule?create=1"),
                                },
                                {
                                    text: "Записать оплату",
                                    action: () => router.push("/payments?create=1"),
                                },
                            ]}
                        />
                    </div>
                </header>

                {children}
            </main>
        </>
    );
};

export default GravityLayout;
