import { useEffect, useRef, useState, useCallback } from "react";
import type { ReactNode } from "react";
import { useRouter } from "next/router";
import { Icon, DropdownMenu } from "@gravity-ui/uikit";
import {
    ArrowLeft,
    Thunderbolt,
    CirclePlus,
    Calendar,
    Receipt,
    FolderOpen,
    Persons,
    CircleInfo,
    Xmark,
} from "@gravity-ui/icons";
import type { IconData } from "@gravity-ui/uikit";
import AnimatedSidebarIcon from "@/components/AnimatedSidebarIcon";
import { useShellContextSidebar } from "@/components/GravityLayout/context-sidebar";

const GDropdownMenu = DropdownMenu as any;

const overlayAnimatedIconPaths = {
    people: "/icons/sidebar-animated/people.json",
    receipt: "/icons/sidebar-animated/receipt.json",
    archive: "/icons/sidebar-animated/archive.json",
    packageBox: "/icons/sidebar-animated/box.json",
    home: "/icons/sidebar-animated/home.json",
    overview: "/icons/sidebar-animated/chart-square.json",
    global: "/icons/sidebar-animated/global.json",
    folderConnection: "/icons/sidebar-animated/folder-connection.json",
    folderOpen: "/icons/sidebar-animated/folder-open.json",
    bookOpen: "/icons/sidebar-animated/book-open.json",
    userAdd: "/icons/sidebar-animated/user-add.json",
    receiptAdd: "/icons/sidebar-animated/receipt-add.json",
    userTick: "/icons/sidebar-animated/user-tick.json",
    profile: "/icons/sidebar-animated/profile.json",
    noteText: "/icons/sidebar-animated/note-text.json",
    taskSquare: "/icons/sidebar-animated/task-square.json",
    export: "/icons/sidebar-animated/export.json",
    logout: "/icons/sidebar-animated/logout.json",
    notifications: "/icons/sidebar-animated/notification-bing.json",
    settings: "/icons/sidebar-animated/setting.json",
    support: "/icons/sidebar-animated/info-circle.json",
} as const;

type PageOverlayNavItem = {
    key: string;
    label: string;
    icon?: IconData;
    animatedIconPath?: string;
};

type PageOverlayProps = {
    /** Title shown below the breadcrumb */
    title: ReactNode;
    /** Optional breadcrumb above the title */
    breadcrumb?: string;
    /** Sidebar nav items */
    nav?: PageOverlayNavItem[];
    /** Currently active nav key */
    activeNav?: string;
    /** Called when nav item is clicked */
    onNavChange?: (key: string) => void;
    /** Sidebar header (above nav, below title) — e.g. avatar + info */
    sidebarHeader?: ReactNode;
    /** Hide global primary action button ("Создать") in shell context sidebar */
    hidePrimaryAction?: boolean;
    /** Main content area */
    children: ReactNode;
    /** Where to go when back is clicked. Defaults to router.back() */
    backHref?: string;
};

const PageOverlay = ({
    title,
    breadcrumb,
    nav,
    activeNav,
    onNavChange,
    sidebarHeader,
    hidePrimaryAction,
    children,
    backHref,
}: PageOverlayProps) => {
    const router = useRouter();
    const shellContextSidebar = useShellContextSidebar();
    const [isLeaving, setIsLeaving] = useState(false);
    const [isMobileViewport, setIsMobileViewport] = useState(false);
    const [quickActionsOpen, setQuickActionsOpen] = useState(false);
    const [hoveredQuickActionKey, setHoveredQuickActionKey] = useState<string | null>(null);
    const [hoveredSidebarNavKey, setHoveredSidebarNavKey] = useState<string | null>(null);
    const overlayRef = useRef<HTMLDivElement>(null);
    const useShellContextMode = Boolean(shellContextSidebar) && !isMobileViewport;

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

    useEffect(() => {
        if (useShellContextMode) {
            document.body.classList.add("repeto-shell-page-context-active");
            return () => {
                document.body.classList.remove("repeto-shell-page-context-active");
            };
        }

        // Keep legacy full-overlay behavior on mobile.
        const prev = document.body.style.overflow;
        document.body.style.overflow = "hidden";
        document.body.classList.add("repeto-page-overlay-open");
        return () => {
            document.body.style.overflow = prev;
            document.body.classList.remove("repeto-page-overlay-open");
        };
    }, [useShellContextMode]);

    useEffect(() => {
        if (!shellContextSidebar) return;

        if (!useShellContextMode) {
            shellContextSidebar.setShellContextSidebar(null);
            return;
        }

        shellContextSidebar.setShellContextSidebar({
            title,
            breadcrumb,
            nav,
            activeNav,
            onNavChange,
            sidebarHeader,
            hidePrimaryAction,
            backHref,
        });

        return () => {
            shellContextSidebar.setShellContextSidebar(null);
        };
    }, [
        activeNav,
        backHref,
        breadcrumb,
        nav,
        onNavChange,
        shellContextSidebar,
        sidebarHeader,
        hidePrimaryAction,
        title,
        useShellContextMode,
    ]);

    const resolveNavIcon = (item: PageOverlayNavItem): IconData => {
        if (item.icon) return item.icon;
        if (item.key === "create") return CirclePlus as IconData;
        if (item.key === "lesson" || item.key === "lessons") return Calendar as IconData;
        if (item.key === "payment" || item.key === "payments") return Receipt as IconData;
        if (item.key === "files" || item.key === "homework") return FolderOpen as IconData;
        if (item.key === "access" || item.key === "debtors" || item.key === "profile") return Persons as IconData;
        if (item.key === "notes") return CircleInfo as IconData;
        return Thunderbolt as IconData;
    };

    const resolveNavAnimatedIconPath = (item: PageOverlayNavItem): string | undefined => {
        if (item.animatedIconPath) {
            return item.animatedIconPath;
        }

        const key = item.key.toLowerCase();
        const label = item.label.toLowerCase();

        if (key === "create") {
            if (label.includes("оплат")) return overlayAnimatedIconPaths.receiptAdd;
            if (label.includes("пакет")) return overlayAnimatedIconPaths.packageBox;
            return overlayAnimatedIconPaths.userAdd;
        }
        if (key === "lesson" || key === "lessons") return overlayAnimatedIconPaths.bookOpen;
        if (key === "payment" || key === "payments") return overlayAnimatedIconPaths.receipt;
        if (key === "dashboard") return overlayAnimatedIconPaths.home;
        if (key === "overview" || label.includes("обзор")) return overlayAnimatedIconPaths.overview;
        if (key === "private" || key === "packages" || key === "package" || label.includes("пакет") || label.includes("обычн")) {
            return overlayAnimatedIconPaths.packageBox;
        }
        if (key === "public" || key === "public-page" || label.includes("публич")) return overlayAnimatedIconPaths.global;
        if (key === "debtors") return overlayAnimatedIconPaths.people;
        if (key === "files") return overlayAnimatedIconPaths.folderOpen;
        if (key === "access") return overlayAnimatedIconPaths.userTick;
        if (key === "account" || key === "profile") return overlayAnimatedIconPaths.profile;
        if (key === "integrations" || key === "integration" || label.includes("интеграц") || label.includes("integration")) {
            return overlayAnimatedIconPaths.folderConnection;
        }
        if (key === "policies" || key === "policy" || label.includes("полит") || label.includes("policy")) {
            return overlayAnimatedIconPaths.noteText;
        }
        if (key === "notes") return overlayAnimatedIconPaths.noteText;
        if (key === "homework") return overlayAnimatedIconPaths.taskSquare;
        if (key === "export") return overlayAnimatedIconPaths.export;
        if (key === "logout" || key === "exit" || label.includes("выйти") || label.includes("logout")) {
            return overlayAnimatedIconPaths.logout;
        }
        if (key === "notifications" || key === "notification" || label.includes("уведом") || label.includes("notification")) {
            return overlayAnimatedIconPaths.notifications;
        }
        if (
            key === "settings" ||
            key === "setup" ||
            key === "security" ||
            label.includes("настро") ||
            label.includes("безопас") ||
            label.includes("setting") ||
            label.includes("security")
        ) {
            return overlayAnimatedIconPaths.settings;
        }
        if (key === "support" || key === "help" || key === "info" || label.includes("поддерж") || label.includes("support")) {
            return overlayAnimatedIconPaths.support;
        }

        return undefined;
    };

    const mobileNavMenuItems = (nav || []).map((item) => ({
        key: item.key,
        text: item.label,
        icon: resolveNavIcon(item),
        animatedIconPath: resolveNavAnimatedIconPath(item),
        disabled: activeNav === item.key,
        action: () => onNavChange?.(item.key),
    }));

    const handleBack = useCallback(() => {
        if (backHref) {
            // Navigate immediately to avoid showing the underlying layout for a split second.
            router.push(backHref);
            return;
        }

        setIsLeaving(true);
        setTimeout(() => {
            router.back();
        }, 300);
    }, [backHref, router]);

    return (
        <div
            ref={overlayRef}
            className={`page-overlay${isLeaving ? " page-overlay--leaving" : ""}${useShellContextMode ? " page-overlay--shell" : ""}`}
        >
            {/* Back button */}
            {!useShellContextMode && (
                <button
                    type="button"
                    className="page-overlay__back"
                    onClick={handleBack}
                    aria-label="Назад"
                >
                    <Icon data={ArrowLeft as IconData} size={20} />
                </button>
            )}

            <div className="page-overlay__layout">
                {/* Sidebar */}
                {!useShellContextMode && (
                <aside className="page-overlay__sidebar">
                    <h2 className="page-overlay__title">{title}</h2>

                    {sidebarHeader}

                    {nav && nav.length > 0 && (
                        <nav className="page-overlay__nav page-overlay__nav--section">
                            {nav.map((item) => {
                                const resolvedIcon = resolveNavIcon(item);
                                const resolvedAnimatedIconPath = resolveNavAnimatedIconPath(item);
                                const shouldShowIcon = Boolean(item.icon || resolvedAnimatedIconPath);

                                return (
                                    <button
                                        key={item.key}
                                        type="button"
                                        className={`page-overlay__nav-item page-overlay__nav-item--section${
                                            activeNav === item.key
                                                ? " page-overlay__nav-item--active"
                                                : ""
                                        }`}
                                        onMouseEnter={() => setHoveredSidebarNavKey(item.key)}
                                        onMouseLeave={() => setHoveredSidebarNavKey((prev) => (prev === item.key ? null : prev))}
                                        onFocus={() => setHoveredSidebarNavKey(item.key)}
                                        onBlur={() => setHoveredSidebarNavKey((prev) => (prev === item.key ? null : prev))}
                                        onClick={() => {
                                            setHoveredSidebarNavKey(null);
                                            onNavChange?.(item.key);
                                        }}
                                    >
                                        {shouldShowIcon && (
                                            <span className="page-overlay__nav-item-icon" aria-hidden="true">
                                                {resolvedAnimatedIconPath ? (
                                                    <AnimatedSidebarIcon
                                                        src={resolvedAnimatedIconPath}
                                                        fallbackIcon={resolvedIcon}
                                                        play={hoveredSidebarNavKey === item.key}
                                                        size={26}
                                                    />
                                                ) : (
                                                    <Icon data={resolvedIcon} size={24} />
                                                )}
                                            </span>
                                        )}
                                        {item.label}
                                    </button>
                                );
                            })}
                        </nav>
                    )}
                </aside>
                )}

                {/* Content */}
                <main className={`page-overlay__content${useShellContextMode ? " page-overlay__content--shell" : ""}`}>
                    {children}
                </main>
            </div>

            {!useShellContextMode && mobileNavMenuItems.length > 0 && (
                <>
                    {quickActionsOpen && (
                        <button
                            type="button"
                            className="repeto-quick-actions-backdrop"
                            aria-label="Закрыть быстрые действия"
                            onClick={() => {
                                setHoveredQuickActionKey(null);
                                setQuickActionsOpen(false);
                            }}
                        />
                    )}

                    <div
                        className={`page-overlay__fab-wrap${quickActionsOpen ? " page-overlay__fab-wrap--open" : ""}`}
                        aria-label="Быстрые действия"
                    >
                    <GDropdownMenu
                        open={quickActionsOpen}
                        onOpenToggle={(open: boolean) => {
                            setQuickActionsOpen(open);
                            if (!open) {
                                setHoveredQuickActionKey(null);
                            }
                        }}
                        popupProps={{
                            placement: "top",
                            className: "page-overlay__fab-popup",
                        }}
                        renderSwitcher={(props: any) => (
                            <button
                                type="button"
                                className="page-overlay__fab"
                                aria-label={quickActionsOpen ? "Закрыть быстрые действия" : "Открыть быстрые действия"}
                                {...props}
                            >
                                <Icon data={quickActionsOpen ? Xmark : Thunderbolt as IconData} size={20} />
                            </button>
                        )}
                    >
                        <div className="repeto-quick-actions-menu">
                            <div className="repeto-quick-actions-menu__list">
                                {mobileNavMenuItems.map((item) => (
                                    <button
                                        key={item.key}
                                        type="button"
                                        className={`repeto-quick-actions-menu__item${item.disabled ? " repeto-quick-actions-menu__item--disabled" : ""}`}
                                        disabled={item.disabled}
                                        onMouseEnter={() => {
                                            if (!item.disabled) {
                                                setHoveredQuickActionKey(item.key);
                                            }
                                        }}
                                        onMouseLeave={() => {
                                            setHoveredQuickActionKey((prev) => (prev === item.key ? null : prev));
                                        }}
                                        onFocus={() => {
                                            if (!item.disabled) {
                                                setHoveredQuickActionKey(item.key);
                                            }
                                        }}
                                        onBlur={() => {
                                            setHoveredQuickActionKey((prev) => (prev === item.key ? null : prev));
                                        }}
                                        onClick={() => {
                                            if (item.disabled) return;
                                            setHoveredQuickActionKey(null);
                                            setQuickActionsOpen(false);
                                            item.action();
                                        }}
                                    >
                                        <span className="repeto-quick-actions-menu__item-icon" aria-hidden="true">
                                            {item.animatedIconPath ? (
                                                <AnimatedSidebarIcon
                                                    src={item.animatedIconPath}
                                                    fallbackIcon={item.icon}
                                                    play={hoveredQuickActionKey === item.key && !item.disabled}
                                                    size={24}
                                                />
                                            ) : (
                                                <Icon data={item.icon} size={24} />
                                            )}
                                        </span>
                                        <span className="repeto-quick-actions-menu__item-text">{item.text}</span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    </GDropdownMenu>
                    </div>
                </>
            )}
        </div>
    );
};

export default PageOverlay;
