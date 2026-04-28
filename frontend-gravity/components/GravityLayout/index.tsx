import { useState, useRef, useEffect, useCallback, useMemo, type MouseEventHandler, type KeyboardEventHandler } from "react";
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
    ChevronsLeft,
    ChevronsRight,
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
import LessonPanelV2 from "@/components/LessonPanelV2";
import UpgradePlanModal from "@/components/UpgradePlanModal";
import { useStudents } from "@/hooks/useStudents";
import { onNotificationsChanged, useUnreadCount } from "@/hooks/useNotifications";
import { useAuth } from "@/contexts/AuthContext";
import { useThemeMode, type ThemeMode } from "@/contexts/ThemeContext";
import { getInitials } from "@/lib/formatters";
import AnimatedSidebarIcon from "@/components/AnimatedSidebarIcon";
import {
    ShellContextSidebarProviderContext,
    type ShellContextSidebarConfig,
    type ShellContextNavItem,
} from "@/components/GravityLayout/context-sidebar";

const GTooltip = Tooltip as any;
const GIcon = Icon as any;
const GText = Text as any;
const GTextInput = TextInput as any;
const GButton = Button as any;
const GDropdownMenu = DropdownMenu as any;

const SIDEBAR_KEY = "repeto-sidebar-collapsed";
const CONTEXT_SIDEBAR_KEY = "repeto-context-sidebar-collapsed";

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

function readContextSidebarCollapsed(): boolean {
    if (typeof window === "undefined") {
        return false;
    }
    try {
        return window.localStorage.getItem(CONTEXT_SIDEBAR_KEY) === "1";
    } catch {
        return false;
    }
}

function readContextSidebarOffset(open: boolean): number {
    return open ? 312 : 52;
}

function shallowNavItemsEqual(a?: ShellContextNavItem[], b?: ShellContextNavItem[]): boolean {
    if (a === b) return true;
    if (!a && !b) return true;
    if (!a || !b) return false;
    if (a.length !== b.length) return false;

    for (let i = 0; i < a.length; i += 1) {
        const left = a[i];
        const right = b[i];
        if (
            left.key !== right.key ||
            left.label !== right.label ||
            left.icon !== right.icon ||
            left.animatedIconPath !== right.animatedIconPath
        ) {
            return false;
        }
    }

    return true;
}

function shallowContextSidebarEqual(
    prev: ShellContextSidebarConfig,
    next: ShellContextSidebarConfig,
): boolean {
    return (
        prev.activeNav === next.activeNav &&
        prev.breadcrumb === next.breadcrumb &&
        prev.backHref === next.backHref &&
        prev.hidePrimaryAction === next.hidePrimaryAction &&
        shallowNavItemsEqual(prev.nav, next.nav)
    );
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

type PlatformPlanId = "start" | "profi" | "center";
type PlatformBillingCycle = "month" | "year";

type PendingPlatformPayment = {
    paymentId: string;
    planId: PlatformPlanId;
    billingCycle: PlatformBillingCycle;
    createdAt: string;
};

const PENDING_RENEWAL_PAYMENT_KEY = "repeto:platform-access:pending-renewal";

function writePendingPlatformPayment(payload: PendingPlatformPayment) {
    if (typeof window === "undefined") return;
    try {
        window.localStorage.setItem(PENDING_RENEWAL_PAYMENT_KEY, JSON.stringify(payload));
    } catch {}
}

function isPlatformPlanId(value: unknown): value is PlatformPlanId {
    return value === "start" || value === "profi" || value === "center";
}

function isPlatformBillingCycle(value: unknown): value is PlatformBillingCycle {
    return value === "month" || value === "year";
}

function isCreateMenuDuplicateKey(key: string): boolean {
    return ["create", "payment", "lesson"].includes(key);
}

const sidebarAnimatedIconPaths = {
    home: "/icons/sidebar-animated/home.json",
    students: "/icons/sidebar-animated/people.json",
    schedule: "/icons/sidebar-animated/calendar.json",
    finance: "/icons/sidebar-animated/wallet.json",
    packages: "/icons/sidebar-animated/box.json",
    files: "/icons/sidebar-animated/folder-open.json",
    notifications: "/icons/sidebar-animated/notification-bing.json",
    settings: "/icons/sidebar-animated/setting.json",
    support: "/icons/sidebar-animated/info-circle.json",
    quickLesson: "/icons/sidebar-animated/book-open.json",
    quickStudent: "/icons/sidebar-animated/user-add.json",
    quickPayment: "/icons/sidebar-animated/receipt-add.json",
    quickPackage: "/icons/sidebar-animated/box.json",
    quickExport: "/icons/sidebar-animated/export.json",
    quickPublic: "/icons/sidebar-animated/global.json",
    quickIntegrations: "/icons/sidebar-animated/folder-connection.json",
} as const;

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

function resolveContextNavIcon(item: ShellContextNavItem): IconData {
    if (item.icon) return item.icon;
    if (item.key === "create") return CirclePlus as IconData;
    if (item.key === "lesson" || item.key === "lessons") return Calendar as IconData;
    if (item.key === "payment" || item.key === "payments") return Receipt as IconData;
    if (item.key === "files" || item.key === "homework") return FolderOpen as IconData;
    if (item.key === "access" || item.key === "debtors" || item.key === "profile") return Persons as IconData;
    if (item.key === "notes") return CircleInfo as IconData;
    return Thunderbolt as IconData;
}

function resolveContextNavAnimatedIconPath(item: ShellContextNavItem): string | undefined {
    if (item.animatedIconPath) {
        return item.animatedIconPath;
    }

    const key = item.key.toLowerCase();
    const label = item.label.toLowerCase();
    if (key === "create") return overlayAnimatedIconPaths.userAdd;
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
}

const menuItems: MenuItem[] = [
    {
        title: "Главное",
        icon: House as IconData,
        url: "/dashboard",
        animatedIconPath: sidebarAnimatedIconPaths.home,
    },
    {
        title: "Ученики",
        icon: Persons as IconData,
        url: "/students",
        animatedIconPath: sidebarAnimatedIconPaths.students,
    },
    {
        title: "Расписание",
        icon: Calendar as IconData,
        url: "/schedule",
        animatedIconPath: sidebarAnimatedIconPaths.schedule,
    },
    {
        title: "Финансы",
        icon: CreditCard as IconData,
        url: "/finance",
        animatedIconPath: sidebarAnimatedIconPaths.finance,
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

const sidebarMenuItems = menuItems;
const topHeaderThemeOptions: Array<{ mode: ThemeMode; label: string; icon: IconData }> = [
    { mode: "light", label: "Светлая", icon: Sun as IconData },
    { mode: "system", label: "Системная", icon: Display as IconData },
    { mode: "dark", label: "Темная", icon: Moon as IconData },
];

const bottomMenuItems: MenuItem[] = [
    {
        title: "Уведомления",
        icon: Bell as IconData,
        url: "/notifications",
        animatedIconPath: sidebarAnimatedIconPaths.notifications,
    },
    {
        title: "Настройки",
        icon: Gear as IconData,
        url: "/settings",
        animatedIconPath: sidebarAnimatedIconPaths.settings,
    },
    {
        title: "Поддержка",
        icon: CircleInfo as IconData,
        url: "/support",
        animatedIconPath: sidebarAnimatedIconPaths.support,
    },
];

const mobileNavItems: MenuItem[] = [
    { title: "Главное", icon: House as IconData, url: "/dashboard", animatedIconPath: sidebarAnimatedIconPaths.home },
    { title: "Ученики", icon: Persons as IconData, url: "/students", animatedIconPath: sidebarAnimatedIconPaths.students },
    { title: "Расписание", icon: Calendar as IconData, url: "/schedule", animatedIconPath: sidebarAnimatedIconPaths.schedule },
    { title: "Финансы", icon: CreditCard as IconData, url: "/finance", animatedIconPath: sidebarAnimatedIconPaths.finance },
    { title: "Материалы", icon: FolderOpen as IconData, url: "/files", animatedIconPath: sidebarAnimatedIconPaths.files },
    {
        title: "Пакеты",
        icon: ObjectAlignJustifyVertical as IconData,
        url: "/packages",
        animatedIconPath: sidebarAnimatedIconPaths.packages,
    },
];

const GravityLayout = ({ title, back, hideSidebar = false, hideHeaderTitle = false, children }: GravityLayoutProps) => {
    const useFlatLayout = true;
    const router = useRouter();
    const pathname = router.asPath.split("?")[0];
    const { user, logout, startPlatformAccessPayment } = useAuth();
    const { theme, themeMode, setTheme } = useThemeMode();
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

        const mediaQuery = window.matchMedia("(max-width: 768px), (max-height: 520px) and (pointer: coarse)");
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
    const [contextSidebarCollapsed, setContextSidebarCollapsed] = useState<boolean>(() => readContextSidebarCollapsed());
    const [shellContextSidebar, setShellContextSidebar] = useState<ShellContextSidebarConfig | null>(null);
    const setShellContextSidebarSafe = useCallback((next: ShellContextSidebarConfig | null) => {
        setShellContextSidebar((prev) => {
            if (!prev && !next) return prev;
            if (!prev || !next) return next;
            return shallowContextSidebarEqual(prev, next) ? prev : next;
        });
    }, []);
    const shellContextSidebarApi = useMemo(
        () => ({ setShellContextSidebar: setShellContextSidebarSafe }),
        [setShellContextSidebarSafe],
    );

    const toggleContextSidebar = useCallback(() => {
        setContextSidebarCollapsed((prev) => {
            const next = !prev;
            try {
                window.localStorage.setItem(CONTEXT_SIDEBAR_KEY, next ? "1" : "0");
            } catch {}
            return next;
        });
    }, []);

    // Search
    const [searchOpen, setSearchOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [topHeaderSearchFocused, setTopHeaderSearchFocused] = useState(false);
    const [profileMenuOpen, setProfileMenuOpen] = useState(false);
    const [mobileProfileMenuOpen, setMobileProfileMenuOpen] = useState(false);
    const [createStudentModalOpen, setCreateStudentModalOpen] = useState(false);
    const [createLessonModalOpen, setCreateLessonModalOpen] = useState(false);
    const [contextCreateMenuOpen, setContextCreateMenuOpen] = useState(false);
    const [mobileQuickActionsOpen, setMobileQuickActionsOpen] = useState(false);
    const [hoveredSidebarIconKey, setHoveredSidebarIconKey] = useState<string | null>(null);
    const [hoveredHeaderIconKey, setHoveredHeaderIconKey] = useState<string | null>(null);
    const [upgradeModalOpen, setUpgradeModalOpen] = useState(false);
    const [upgradeError, setUpgradeError] = useState<string | null>(null);
    const [sidebarUtilityMessage, setSidebarUtilityMessage] = useState<string | null>(null);
    const [upgradeBusy, setUpgradeBusy] = useState(false);
    const topHeaderSearchRef = useRef<HTMLDivElement>(null);
    const mobileSearchRef = useRef<HTMLDivElement>(null);
    const mobileNavRef = useRef<HTMLElement>(null);
    const mobileNavItemRefs = useRef<Record<string, HTMLAnchorElement | null>>({});
    const previousMobileNavIndexRef = useRef<number | null>(null);
    const useTopHeaderSearch = useFlatLayout && !isMobileViewport;
    const useRailSidebar = useFlatLayout && !isMobileViewport;
    const rawPlatformPlanId = user?.platformAccess?.planId;
    const rawPlatformBillingCycle = user?.platformAccess?.billingCycle;
    const platformPlanId = isPlatformPlanId(rawPlatformPlanId) ? rawPlatformPlanId : "profi";
    const platformBillingCycle = isPlatformBillingCycle(rawPlatformBillingCycle) ? rawPlatformBillingCycle : "month";
    const nextPlatformPlanId: PlatformPlanId = platformPlanId === "start" ? "profi" : "center";
    const canUpgradePlan = platformPlanId !== "center";
    const studentPlanLimit = platformPlanId === "start" ? 10 : platformPlanId === "center" ? 150 : 40;

    const closeMobileSearch = useCallback(() => {
        setSearchOpen(false);
        setSearchQuery("");
    }, []);

    useEffect(() => {
        const handler = (e: MouseEvent) => {
            const target = e.target as Node;

            if (topHeaderSearchRef.current && !topHeaderSearchRef.current.contains(target)) {
                setTopHeaderSearchFocused(false);
            }

            if (mobileSearchRef.current && !mobileSearchRef.current.contains(target)) {
                closeMobileSearch();
            }
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, [closeMobileSearch]);

    useEffect(() => {
        if (!searchOpen || useTopHeaderSearch) return;
        const frame = window.requestAnimationFrame(() => {
            const input = mobileSearchRef.current?.querySelector("input");
            input?.focus();
        });
        return () => window.cancelAnimationFrame(frame);
    }, [searchOpen, useTopHeaderSearch]);

    const trimmedSearch = searchQuery.trim();
    const { data: studentsData } = useStudents({
        search: trimmedSearch || undefined,
        limit: 5,
    }, {
        skip: !trimmedSearch,
    });
    const { data: quotaStudentsData } = useStudents({ limit: 1 }, { skip: isPlatformAccessExpired });
    const searchResults = trimmedSearch
        ? (studentsData?.data || []).slice(0, 5)
        : [];
    const studentsUsed = quotaStudentsData?.total || 0;
    const studentsLeft = Math.max(studentPlanLimit - studentsUsed, 0);
    const studentQuotaPercent = Math.max(0, Math.min(100, (studentsUsed / studentPlanLimit) * 100));
    const mobileSearchActive = isMobileViewport && searchOpen;
    const notificationsActive = pathname === "/notifications" || pathname.startsWith("/notifications/");
    const activeMobileNavUrl = useMemo(() => {
        const active = mobileNavItems.find(
            (item) =>
                pathname === item.url ||
                (item.url !== "/dashboard" && pathname.startsWith(item.url + "/")),
        );
        return active?.url || null;
    }, [pathname]);

    useEffect(() => {
        if (!isMobileViewport || !activeMobileNavUrl) {
            previousMobileNavIndexRef.current = null;
            return;
        }

        const nav = mobileNavRef.current;
        if (!nav) return;

        const activeIndex = mobileNavItems.findIndex((item) => item.url === activeMobileNavUrl);
        if (activeIndex < 0) return;

        const previousIndex = previousMobileNavIndexRef.current;
        previousMobileNavIndexRef.current = activeIndex;

        const maxScrollLeft = nav.scrollWidth - nav.clientWidth;
        if (maxScrollLeft <= 0) return;

        const scrollPadding = 8;
        const navRect = nav.getBoundingClientRect();
        const moveDirection = previousIndex === null ? 0 : Math.sign(activeIndex - previousIndex);
        let targetLeft = nav.scrollLeft;

        if (activeIndex === 0) {
            // Active is the last item — scroll all the way to the right end.
            targetLeft = 0;
        } else if (activeIndex === mobileNavItems.length - 1) {
            targetLeft = maxScrollLeft;
        } else if (moveDirection < 0) {
            const previousItem = mobileNavItemRefs.current[mobileNavItems[activeIndex - 1].url];
            if (previousItem) {
                const previousItemRect = previousItem.getBoundingClientRect();
                const previousItemLeft = previousItemRect.left - navRect.left + nav.scrollLeft;
                targetLeft = previousItemLeft - scrollPadding;
            }
        } else {
            const nextItem = mobileNavItemRefs.current[mobileNavItems[activeIndex + 1].url];
            if (nextItem) {
                const nextItemRect = nextItem.getBoundingClientRect();
                const nextItemRight = nextItemRect.right - navRect.left + nav.scrollLeft;
                targetLeft = nextItemRight - nav.clientWidth + scrollPadding;
            }
        }

        // Use getBoundingClientRect because nav is position:fixed — offsetLeft is relative to body, not nav.
        const clampedLeft = Math.max(0, Math.min(maxScrollLeft, targetLeft));
        if (Math.abs(clampedLeft - nav.scrollLeft) > 1) {
            nav.scrollTo({
                left: clampedLeft,
                behavior: "smooth",
            });
        }
    }, [activeMobileNavUrl, isMobileViewport]);

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

    const openCreatePaymentFlow = useCallback(() => {
        void router.push("/finance/payments?create=1");
    }, [router]);

    const openCreatePackageFlow = useCallback(() => {
        void router.push("/packages?create=1");
    }, [router]);

    const openScheduleExportFlow = useCallback(() => {
        void router.push("/schedule?quickAction=export");
    }, [router]);

    const shouldShowScheduleExportQuickAction = pathname === "/schedule" || pathname.startsWith("/schedule/");

    const openUpgradeModal = useCallback(() => {
        if (!canUpgradePlan || upgradeBusy) return;
        setSidebarUtilityMessage(null);
        setUpgradeError(null);
        setUpgradeModalOpen(true);
    }, [canUpgradePlan, upgradeBusy]);

    const handleUpgradePlan = useCallback(async (selectedBillingCycle: PlatformBillingCycle) => {
        if (upgradeBusy) return;

        setUpgradeBusy(true);
        setUpgradeError(null);
        setSidebarUtilityMessage(null);
        try {
            const result = await startPlatformAccessPayment({
                planId: nextPlatformPlanId,
                billingCycle: selectedBillingCycle,
            });

            if (result.requiresPayment && result.paymentId && result.confirmationUrl) {
                setUpgradeModalOpen(false);
                writePendingPlatformPayment({
                    paymentId: result.paymentId,
                    planId: result.planId,
                    billingCycle: result.billingCycle,
                    createdAt: new Date().toISOString(),
                });
                window.location.assign(result.confirmationUrl);
                return;
            }

            setUpgradeModalOpen(false);
            setSidebarUtilityMessage("Тариф обновлен.");
        } catch {
            setUpgradeError("Не удалось открыть оплату тарифа.");
        } finally {
            setUpgradeBusy(false);
        }
    }, [nextPlatformPlanId, startPlatformAccessPayment, upgradeBusy]);

    const quickActionItems: SidebarQuickAction[] = [
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
                openCreatePaymentFlow();
            },
        },
        {
            id: "quick-create-lesson",
            title: "Добавить занятие",
            icon: Calendar as IconData,
            animatedIconPath: sidebarAnimatedIconPaths.quickLesson,
            action: () => {
                openCreateLessonModal();
            },
        },
        {
            id: "quick-create-package",
            title: "Создать пакет",
            icon: ObjectAlignJustifyVertical as IconData,
            animatedIconPath: sidebarAnimatedIconPaths.quickPackage,
            action: () => {
                openCreatePackageFlow();
            },
        },
        ...(shouldShowScheduleExportQuickAction
            ? [{
                id: "quick-export-schedule",
                title: "Экспорт расписания",
                icon: ArrowUpRightFromSquare as IconData,
                animatedIconPath: sidebarAnimatedIconPaths.quickExport,
                action: () => {
                    openScheduleExportFlow();
                },
            }]
            : []),
    ];

    const isCollapsed = useRailSidebar ? true : collapsed;
    const sidebarIconSize = useRailSidebar ? 24 : 30;
    const footerMenuItems = useFlatLayout ? [] : bottomMenuItems;
    const shouldShowQuickActions = !useFlatLayout && !useRailSidebar;
    const shouldShowSidebar = !hideSidebar;
    const contextSidebarVisible = useRailSidebar && shouldShowSidebar;
    const contextSidebarExpanded = contextSidebarVisible && !contextSidebarCollapsed;
    const hasContextSidebarConfig = Boolean(shellContextSidebar);
    const contextSidebarNavItems = shellContextSidebar?.nav || [];
    const visibleContextSidebarNavItems = contextSidebarNavItems.filter((item) => !isCreateMenuDuplicateKey(item.key));
    const hasVisibleContextSidebarNavItems = visibleContextSidebarNavItems.length > 0;
    const contextSidebarTitle = shellContextSidebar?.title || title || "";
    const showContextPrimaryAction = !shellContextSidebar?.hidePrimaryAction;
    const showInlineContextQuickActions = pathname === "/dashboard" || pathname.startsWith("/dashboard/");
    const brandLogoFullSrc = theme === "dark" ? "/brand/logo_text_white.svg" : "/brand/logo.svg";
    const brandLogoIconSrc = theme === "dark" ? "/brand/icon_white.svg" : "/brand/icon.svg";
    const shellOffset = useFlatLayout && !isMobileViewport && shouldShowSidebar
        ? readContextSidebarOffset(contextSidebarExpanded)
        : undefined;
    const contentInlineStyle = shellOffset === undefined ? undefined : { marginLeft: `${shellOffset}px` };

    const sidebarCls = `repeto-sidebar ${isCollapsed ? "repeto-sidebar--collapsed" : ""} ${
        useFlatLayout ? "repeto-sidebar--flat" : ""
    } ${useRailSidebar ? "repeto-sidebar--rail" : ""}`;
    const contentCls = `repeto-content ${shouldShowSidebar && isCollapsed ? "repeto-content--sidebar-collapsed" : ""} ${
        useFlatLayout ? "repeto-content--flat" : ""
    } ${shouldShowSidebar ? "repeto-content--with-sidebar" : "repeto-content--no-sidebar"} ${
        contextSidebarExpanded ? "repeto-content--with-context-sidebar" : "repeto-content--with-context-sidebar-collapsed"
    }`;
    const topHeaderSearchOpen = useTopHeaderSearch && topHeaderSearchFocused && Boolean(trimmedSearch);
    const topHeaderCls = `repeto-top-header ${
        shouldShowSidebar
            ? isCollapsed
                ? "repeto-top-header--with-sidebar-collapsed"
                : "repeto-top-header--with-sidebar"
            : "repeto-top-header--no-sidebar"
    } ${topHeaderSearchOpen ? "repeto-top-header--search-open" : ""}`;

    useEffect(() => {
        const { body } = document;
        const railClass = "repeto-shell-rail-open";
        const contextClass = "repeto-shell-context-sidebar-open";

        if (contextSidebarVisible) {
            body.classList.add(railClass);
        } else {
            body.classList.remove(railClass);
        }

        if (contextSidebarExpanded) {
            body.classList.add(contextClass);
        } else {
            body.classList.remove(contextClass);
        }

        return () => {
            body.classList.remove(railClass);
            body.classList.remove(contextClass);
        };
    }, [contextSidebarExpanded, contextSidebarVisible]);

    return (
        <ShellContextSidebarProviderContext.Provider value={shellContextSidebarApi}>
        <>
            <Head>
                <title>{title ? `${title} — Repeto` : "Repeto"}</title>
            </Head>

            {useFlatLayout && (
                <header className={topHeaderCls} role="banner">
                    <div className="repeto-top-header__inner">
                        <div className="repeto-top-header__left">
                            <Link href="/dashboard" className="repeto-top-header__brand" aria-label="Repeto">
                                <img
                                    className="repeto-logo repeto-logo--full"
                                    src={brandLogoFullSrc}
                                    alt="Repeto"
                                />
                            </Link>
                            {useTopHeaderSearch && (
                                <div
                                    ref={topHeaderSearchRef}
                                    className="repeto-top-header__search repeto-top-header__search--expanded"
                                >
                                    <div className="repeto-top-header__search-field repeto-top-header__search-field--expanded">
                                        <GTextInput
                                            className="repeto-top-header__search-input repeto-top-header__search-input--modal"
                                            size="l"
                                            placeholder="Поиск учеников..."
                                            value={searchQuery}
                                            onFocus={() => setTopHeaderSearchFocused(true)}
                                            onUpdate={(value: string) => {
                                                setSearchQuery(value);
                                                if (!topHeaderSearchFocused) {
                                                    setTopHeaderSearchFocused(true);
                                                }
                                            }}
                                            startContent={
                                                <GIcon
                                                    data={Magnifier as IconData}
                                                    size={18}
                                                    style={{
                                                        color: "var(--repeto-control-icon)",
                                                        marginLeft: 4,
                                                        marginRight: 6,
                                                    }}
                                                />
                                            }
                                        />
                                    </div>

                                    {topHeaderSearchFocused && trimmedSearch && (
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
                                                                setSearchQuery("");
                                                                setTopHeaderSearchFocused(false);
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
                        </div>

                        <div className="repeto-top-header__right">
                            <Link
                                href="/notifications"
                                aria-label="Уведомления"
                                className={`repeto-top-header__icon-btn ${
                                    pathname === "/notifications" || pathname.startsWith("/notifications/")
                                        ? "repeto-top-header__icon-btn--active"
                                        : ""
                                }`}
                                style={{ position: "relative" }}
                                onMouseEnter={() => setHoveredHeaderIconKey("top:notifications")}
                                onMouseLeave={() =>
                                    setHoveredHeaderIconKey((prev) => (prev === "top:notifications" ? null : prev))
                                }
                                onFocus={() => setHoveredHeaderIconKey("top:notifications")}
                                onBlur={() =>
                                    setHoveredHeaderIconKey((prev) => (prev === "top:notifications" ? null : prev))
                                }
                            >
                                <AnimatedSidebarIcon
                                    src={sidebarAnimatedIconPaths.notifications}
                                    fallbackIcon={Bell as IconData}
                                    play={hoveredHeaderIconKey === "top:notifications" || notificationsActive}
                                    size={24}
                                />
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
                                onMouseEnter={() => setHoveredHeaderIconKey("top:settings")}
                                onMouseLeave={() =>
                                    setHoveredHeaderIconKey((prev) => (prev === "top:settings" ? null : prev))
                                }
                                onFocus={() => setHoveredHeaderIconKey("top:settings")}
                                onBlur={() =>
                                    setHoveredHeaderIconKey((prev) => (prev === "top:settings" ? null : prev))
                                }
                            >
                                <AnimatedSidebarIcon
                                    src={sidebarAnimatedIconPaths.settings}
                                    fallbackIcon={Gear as IconData}
                                    play={hoveredHeaderIconKey === "top:settings" || pathname === "/settings" || pathname.startsWith("/settings/")}
                                    size={24}
                                />
                            </Link>

                            <Link
                                href="/support"
                                aria-label="Поддержка"
                                className={`repeto-top-header__icon-btn ${
                                    pathname === "/support" || pathname.startsWith("/support/")
                                        ? "repeto-top-header__icon-btn--active"
                                        : ""
                                }`}
                                onMouseEnter={() => setHoveredHeaderIconKey("top:support")}
                                onMouseLeave={() =>
                                    setHoveredHeaderIconKey((prev) => (prev === "top:support" ? null : prev))
                                }
                                onFocus={() => setHoveredHeaderIconKey("top:support")}
                                onBlur={() =>
                                    setHoveredHeaderIconKey((prev) => (prev === "top:support" ? null : prev))
                                }
                            >
                                <AnimatedSidebarIcon
                                    src={sidebarAnimatedIconPaths.support}
                                    fallbackIcon={CircleInfo as IconData}
                                    play={hoveredHeaderIconKey === "top:support" || pathname === "/support" || pathname.startsWith("/support/")}
                                    size={24}
                                />
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
                {useRailSidebar ? (
                    !contextSidebarExpanded ? (
                        <div className="repeto-sidebar__logo repeto-sidebar__logo--rail-slot">
                            <button
                                type="button"
                                className="repeto-sidebar__context-expand-btn"
                                onClick={toggleContextSidebar}
                                aria-label="Развернуть меню раздела"
                            >
                                <GIcon data={ChevronsRight as IconData} size={14} />
                            </button>
                        </div>
                    ) : null
                ) : (
                    <Link href="/dashboard" className="repeto-sidebar__logo">
                        <span className="repeto-sidebar__logo-icon" aria-hidden="true">
                            <img
                                className="repeto-logo repeto-logo--icon"
                                src={brandLogoIconSrc}
                                alt=""
                            />
                        </span>
                        <img
                            className="repeto-logo repeto-logo--full"
                            src={brandLogoFullSrc}
                            alt="Repeto"
                        />
                        <span className="repeto-sr-only">Repeto</span>
                    </Link>
                )}

                <nav className="repeto-sidebar__nav repeto-sidebar__nav--sections">
                    {shouldShowQuickActions && (
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
                                                    size={sidebarIconSize}
                                                />
                                            ) : (
                                                <GIcon data={item.icon} size={sidebarIconSize} />
                                            )}
                                        </span>
                                        <span className="repeto-sidebar__item-text">{item.title}</span>
                                    </button>
                                );

                                if (isCollapsed && !useRailSidebar) {
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
                    )}

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
                                            useRailSidebar ? "repeto-sidebar__item--rail" : ""
                                        } ${
                                            isActive
                                                ? "repeto-sidebar__item--active"
                                                : ""
                                        }`}
                                        aria-current={isActive ? "page" : undefined}
                                    >
                                        <span className="repeto-sidebar__item-icon">
                                            {item.animatedIconPath ? (
                                                <AnimatedSidebarIcon
                                                    src={item.animatedIconPath}
                                                    fallbackIcon={item.icon}
                                                    play={hoveredSidebarIconKey === iconKey}
                                                    size={sidebarIconSize}
                                                />
                                            ) : (
                                                <GIcon data={item.icon} size={sidebarIconSize} />
                                            )}
                                        </span>
                                        <span className="repeto-sidebar__item-text">{item.title}</span>
                                        {useRailSidebar && (
                                            <span className="repeto-sidebar__item-rail-label">{item.title}</span>
                                        )}
                                    </Link>
                                );

                                if (isCollapsed && !useRailSidebar) {
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
                            const iconKey = `footer:${item.url}`;

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
                                    className={`repeto-sidebar__item ${
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
                                                size={18}
                                            />
                                        ) : (
                                            <GIcon data={item.icon} size={18} />
                                        )}
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

            {contextSidebarVisible && (
                <aside className={`repeto-context-sidebar ${contextSidebarExpanded ? "" : "repeto-context-sidebar--collapsed"}`}>
                    <div className="repeto-context-sidebar__inner">
                        <Link href="/dashboard" className="repeto-context-sidebar__brand" aria-label="Repeto">
                            <img
                                className="repeto-logo repeto-logo--full"
                                src={brandLogoFullSrc}
                                alt="Repeto"
                            />
                        </Link>

                        <div className="repeto-context-sidebar__body">
                        <div className="repeto-context-sidebar__header-row">
                            {contextSidebarTitle ? (
                                <div className="repeto-context-sidebar__header-title">{contextSidebarTitle}</div>
                            ) : (
                                <div className="repeto-context-sidebar__header-title" />
                            )}
                            <button
                                type="button"
                                className="repeto-context-sidebar__collapse-btn"
                                aria-label="Свернуть меню раздела"
                                onClick={toggleContextSidebar}
                            >
                                <GIcon data={ChevronsLeft as IconData} size={16} />
                            </button>
                        </div>

                        {showContextPrimaryAction && (
                            showInlineContextQuickActions ? (
                                <div className="repeto-context-sidebar__section">
                                    <div className="repeto-context-sidebar__list">
                                        {quickActionItems.map((item) => {
                                            const iconKey = `context-quick:${item.id}`;

                                            return (
                                                <button
                                                    key={item.id}
                                                    type="button"
                                                    className="repeto-context-sidebar__item"
                                                    onMouseEnter={() => setHoveredSidebarIconKey(iconKey)}
                                                    onMouseLeave={() =>
                                                        setHoveredSidebarIconKey((prev) => (prev === iconKey ? null : prev))
                                                    }
                                                    onFocus={() => setHoveredSidebarIconKey(iconKey)}
                                                    onBlur={() =>
                                                        setHoveredSidebarIconKey((prev) => (prev === iconKey ? null : prev))
                                                    }
                                                    onClick={() => {
                                                        setHoveredSidebarIconKey(null);
                                                        item.action();
                                                    }}
                                                >
                                                    <span className="repeto-context-sidebar__item-icon" aria-hidden="true">
                                                        {item.animatedIconPath ? (
                                                            <AnimatedSidebarIcon
                                                                src={item.animatedIconPath}
                                                                fallbackIcon={item.icon}
                                                                play={hoveredSidebarIconKey === iconKey}
                                                                size={24}
                                                            />
                                                        ) : (
                                                            <GIcon data={item.icon} size={24} />
                                                        )}
                                                    </span>
                                                    <span className="repeto-context-sidebar__item-text">{item.title}</span>
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            ) : (
                                <GDropdownMenu
                                    open={contextCreateMenuOpen}
                                    onOpenToggle={setContextCreateMenuOpen}
                                    popupProps={{
                                        placement: "bottom-start",
                                        className: "repeto-context-create-menu__popup",
                                    }}
                                    renderSwitcher={(props: any) => (
                                        <button
                                            type="button"
                                            className="repeto-context-sidebar__item repeto-context-sidebar__item--quick repeto-context-sidebar__item--create repeto-context-sidebar__primary-action"
                                            onMouseEnter={() => setHoveredSidebarIconKey("context:primary:create")}
                                            onMouseLeave={() =>
                                                setHoveredSidebarIconKey((prev) => (prev === "context:primary:create" ? null : prev))
                                            }
                                            onFocus={() => setHoveredSidebarIconKey("context:primary:create")}
                                            onBlur={() =>
                                                setHoveredSidebarIconKey((prev) => (prev === "context:primary:create" ? null : prev))
                                            }
                                            {...props}
                                        >
                                            <span className="repeto-context-sidebar__item-icon">
                                                <AnimatedSidebarIcon
                                                    src={sidebarAnimatedIconPaths.quickLesson}
                                                    fallbackIcon={CirclePlus as IconData}
                                                    play={hoveredSidebarIconKey === "context:primary:create"}
                                                    size={24}
                                                />
                                            </span>
                                            <span className="repeto-context-sidebar__item-text">Создать</span>
                                            <GIcon data={ChevronDown as IconData} size={16} />
                                        </button>
                                    )}
                                >
                                    <div className="repeto-quick-actions-menu repeto-context-create-menu">
                                        <div className="repeto-quick-actions-menu__list">
                                            {quickActionItems.map((item) => {
                                                const iconKey = `context-menu:${item.id}`;

                                                return (
                                                    <button
                                                        key={item.id}
                                                        type="button"
                                                        className="repeto-quick-actions-menu__item"
                                                        onMouseEnter={() => setHoveredSidebarIconKey(iconKey)}
                                                        onMouseLeave={() =>
                                                            setHoveredSidebarIconKey((prev) => (prev === iconKey ? null : prev))
                                                        }
                                                        onFocus={() => setHoveredSidebarIconKey(iconKey)}
                                                        onBlur={() =>
                                                            setHoveredSidebarIconKey((prev) => (prev === iconKey ? null : prev))
                                                        }
                                                        onClick={() => {
                                                            setHoveredSidebarIconKey(null);
                                                            setContextCreateMenuOpen(false);
                                                            item.action();
                                                        }}
                                                    >
                                                        <span className="repeto-quick-actions-menu__item-icon" aria-hidden="true">
                                                            {item.animatedIconPath ? (
                                                                <AnimatedSidebarIcon
                                                                    src={item.animatedIconPath}
                                                                    fallbackIcon={item.icon}
                                                                    play={hoveredSidebarIconKey === iconKey}
                                                                    size={24}
                                                                />
                                                            ) : (
                                                                <GIcon data={item.icon} size={24} />
                                                            )}
                                                        </span>
                                                        <span className="repeto-quick-actions-menu__item-text">{item.title}</span>
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>
                                </GDropdownMenu>
                            )
                        )}

                        {hasContextSidebarConfig && shellContextSidebar?.sidebarHeader && (
                            <div className="repeto-context-sidebar__meta">{shellContextSidebar.sidebarHeader}</div>
                        )}

                        {hasVisibleContextSidebarNavItems ? (
                                <div className="repeto-context-sidebar__section">
                                    <div className="repeto-context-sidebar__list">
                                        {visibleContextSidebarNavItems.map((item) => {
                                            const iconKey = `context:${item.key}`;
                                            const resolvedIcon = resolveContextNavIcon(item);
                                            const resolvedAnimatedIconPath = resolveContextNavAnimatedIconPath(item);
                                            const isActive = shellContextSidebar?.activeNav === item.key;

                                            return (
                                                <button
                                                    key={item.key}
                                                    type="button"
                                                    className={`repeto-context-sidebar__item ${
                                                        isActive ? "repeto-context-sidebar__item--active" : ""
                                                    }`}
                                                    onMouseEnter={() => setHoveredSidebarIconKey(iconKey)}
                                                    onMouseLeave={() =>
                                                        setHoveredSidebarIconKey((prev) => (prev === iconKey ? null : prev))
                                                    }
                                                    onFocus={() => setHoveredSidebarIconKey(iconKey)}
                                                    onBlur={() =>
                                                        setHoveredSidebarIconKey((prev) => (prev === iconKey ? null : prev))
                                                    }
                                                    onClick={() => shellContextSidebar?.onNavChange?.(item.key)}
                                                >
                                                    <span className="repeto-context-sidebar__item-icon">
                                                        {resolvedAnimatedIconPath ? (
                                                            <AnimatedSidebarIcon
                                                                src={resolvedAnimatedIconPath}
                                                                fallbackIcon={resolvedIcon}
                                                                play={hoveredSidebarIconKey === iconKey}
                                                                size={24}
                                                            />
                                                        ) : (
                                                            <GIcon data={resolvedIcon} size={22} />
                                                        )}
                                                    </span>
                                                    <span className="repeto-context-sidebar__item-text">{item.label}</span>
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                        ) : (
                            <div className="repeto-context-sidebar__empty-space" aria-hidden="true" />
                        )}
                        </div>

                        <div className="repeto-context-sidebar__footer">
                            <div className="repeto-context-sidebar__quota-card" aria-label="Лимит учеников по тарифу">
                                <div className="repeto-context-sidebar__quota-track" aria-hidden="true">
                                    <span
                                        className="repeto-context-sidebar__quota-fill"
                                        style={{ width: `${studentQuotaPercent}%` }}
                                    />
                                </div>
                                <div className="repeto-context-sidebar__quota-text">
                                    Осталось {studentsLeft} из {studentPlanLimit} учеников
                                </div>
                            </div>

                            <button
                                type="button"
                                className="repeto-context-sidebar__utility-btn"
                                onClick={openUpgradeModal}
                                disabled={upgradeBusy || !canUpgradePlan}
                            >
                                {canUpgradePlan
                                    ? (upgradeBusy ? "Открываем..." : "Повысить тариф")
                                    : "Максимальный тариф"}
                            </button>

                            {sidebarUtilityMessage && (
                                <div className="repeto-context-sidebar__install-hint">{sidebarUtilityMessage}</div>
                            )}
                        </div>
                    </div>
                </aside>
            )}

            {/* Content */}
            <main className={contentCls} style={contentInlineStyle}>
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
                                {title && !hideHeaderTitle && !contextSidebarVisible && (
                                    <h1 className="repeto-page-title">{title}</h1>
                                )}
                            </>
                        )}
                    </div>
                    <div className={`repeto-header__right ${mobileSearchActive ? "repeto-header__right--search-open" : ""}`}>
                        {!useTopHeaderSearch && (
                            <div
                                ref={mobileSearchRef}
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
                                                onClick={closeMobileSearch}
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
                                                            closeMobileSearch();
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
                                        onMouseEnter={() => setHoveredHeaderIconKey("mobile:notifications")}
                                        onMouseLeave={() =>
                                            setHoveredHeaderIconKey((prev) => (prev === "mobile:notifications" ? null : prev))
                                        }
                                        onFocus={() => setHoveredHeaderIconKey("mobile:notifications")}
                                        onBlur={() =>
                                            setHoveredHeaderIconKey((prev) => (prev === "mobile:notifications" ? null : prev))
                                        }
                                        onClick={() => {
                                            void router.push("/notifications");
                                        }}
                                    >
                                        <span className="repeto-mobile-nav__icon">
                                            <AnimatedSidebarIcon
                                                src={sidebarAnimatedIconPaths.notifications}
                                                fallbackIcon={Bell as IconData}
                                                play={hoveredHeaderIconKey === "mobile:notifications" || notificationsActive}
                                                size={18}
                                            />
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
                            onClick={() => {
                                setHoveredSidebarIconKey(null);
                                setMobileQuickActionsOpen(false);
                            }}
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
                                {quickActionItems.map((item) => {
                                    const iconKey = `mobile-quick:${item.id}`;

                                    return (
                                        <button
                                            key={item.id}
                                            type="button"
                                            className="repeto-quick-actions-menu__item"
                                            onMouseEnter={() => setHoveredSidebarIconKey(iconKey)}
                                            onMouseLeave={() =>
                                                setHoveredSidebarIconKey((prev) => (prev === iconKey ? null : prev))
                                            }
                                            onFocus={() => setHoveredSidebarIconKey(iconKey)}
                                            onBlur={() =>
                                                setHoveredSidebarIconKey((prev) => (prev === iconKey ? null : prev))
                                            }
                                            onClick={() => {
                                                setHoveredSidebarIconKey(null);
                                                setMobileQuickActionsOpen(false);
                                                item.action();
                                            }}
                                        >
                                            <span className="repeto-quick-actions-menu__item-icon" aria-hidden="true">
                                                {item.animatedIconPath ? (
                                                    <AnimatedSidebarIcon
                                                        src={item.animatedIconPath}
                                                        fallbackIcon={item.icon}
                                                        play={hoveredSidebarIconKey === iconKey}
                                                        size={24}
                                                    />
                                                ) : (
                                                    <GIcon data={item.icon} size={24} />
                                                )}
                                            </span>
                                            <span className="repeto-quick-actions-menu__item-text">{item.title}</span>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    </GDropdownMenu>
                    </div>
                </>
            )}

            <nav ref={mobileNavRef} className="repeto-mobile-nav" aria-label="Мобильная навигация">
                {mobileNavItems.map((item) => {
                    const isActive = activeMobileNavUrl === item.url;
                    const iconKey = `mobile-nav:${item.url}`;

                    return (
                        <Link
                            key={item.url}
                            href={item.url}
                            ref={(node) => {
                                mobileNavItemRefs.current[item.url] = node;
                            }}
                            onMouseEnter={() => setHoveredSidebarIconKey(iconKey)}
                            onMouseLeave={() =>
                                setHoveredSidebarIconKey((prev) => (prev === iconKey ? null : prev))
                            }
                            onFocus={() => setHoveredSidebarIconKey(iconKey)}
                            onBlur={() =>
                                setHoveredSidebarIconKey((prev) => (prev === iconKey ? null : prev))
                            }
                            className={`repeto-mobile-nav__item ${isActive ? "repeto-mobile-nav__item--active" : ""}`}
                        >
                            <span className="repeto-mobile-nav__icon">
                                {item.animatedIconPath ? (
                                    <AnimatedSidebarIcon
                                        src={item.animatedIconPath}
                                        fallbackIcon={item.icon}
                                        play={hoveredSidebarIconKey === iconKey || isActive}
                                        size={18}
                                    />
                                ) : (
                                    <GIcon data={item.icon} size={18} />
                                )}
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

            <LessonPanelV2
                open={createLessonModalOpen}
                onClose={() => setCreateLessonModalOpen(false)}
                onSaved={handleCreateLesson}
            />

            <UpgradePlanModal
                visible={upgradeModalOpen}
                loading={upgradeBusy}
                error={upgradeError}
                currentPlanId={platformPlanId}
                currentBillingCycle={platformBillingCycle}
                targetPlanId={nextPlatformPlanId}
                activatedAt={user?.platformAccess?.activatedAt || null}
                expiresAt={user?.platformAccess?.expiresAt || null}
                onClose={() => {
                    if (upgradeBusy) return;
                    setUpgradeModalOpen(false);
                    setUpgradeError(null);
                }}
                onSubmit={handleUpgradePlan}
            />
        </>
        </ShellContextSidebarProviderContext.Provider>
    );
};

export default GravityLayout;
