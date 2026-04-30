import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import GravityLayout from "@/components/GravityLayout";
import PageOverlay from "@/components/PageOverlay";
import AnimatedSidebarIcon from "@/components/AnimatedSidebarIcon";
import { Text } from "@gravity-ui/uikit";
import type { IconData } from "@gravity-ui/uikit";
import { Person, Gear, Bell, FileText, ArrowUpRightFromSquare, Sun, Display, Moon, ArrowRightFromSquare } from "@gravity-ui/icons";
import Account from "./Account";
import PublicPage from "./PublicPage";
import Security from "./Security";
import Notifications from "./Notifications";
import Policies from "./Policies";
import Integrations from "./Integrations";
import { useAuth } from "@/contexts/AuthContext";
import { useThemeMode } from "@/contexts/ThemeContext";
import type { ThemeMode } from "@/contexts/ThemeContext";

const settingsAnimatedIconPaths = {
    account: "/icons/sidebar-animated/profile.json",
    publicPage: "/icons/sidebar-animated/global.json",
    security: "/icons/sidebar-animated/setting.json",
    notifications: "/icons/sidebar-animated/notification-bing.json",
    policies: "/icons/sidebar-animated/note-text.json",
    integrations: "/icons/sidebar-animated/folder-connection.json",
    logout: "/icons/sidebar-animated/logout.json",
    themeLight: "/icons/sidebar-animated/sun.json",
    themeSystem: "/icons/sidebar-animated/setting.json",
    themeDark: "/icons/sidebar-animated/moon.json",
} as const;

const sectionNavItems = [
    { key: "account", label: "Личные данные", description: "Имя, портрет, контакты и данные профиля", icon: Person as IconData, animatedIconPath: settingsAnimatedIconPaths.account },
    {
        key: "public-page",
        label: "Публичная страница",
        description: "Ссылка, публикация и витрина пакетов",
        icon: ArrowUpRightFromSquare as IconData,
        animatedIconPath: settingsAnimatedIconPaths.publicPage,
    },
    {
        key: "integrations",
        label: "Интеграции",
        description: "Календари, облачные диски и выплаты",
        icon: Display as IconData,
        animatedIconPath: settingsAnimatedIconPaths.integrations,
    },
    {
        key: "notifications",
        label: "Уведомления",
        description: "Каналы и напоминания",
        icon: Bell as IconData,
        animatedIconPath: settingsAnimatedIconPaths.notifications,
    },
    { key: "policies", label: "Правила занятий", description: "Отмены, оплаты и чеки", icon: FileText as IconData, animatedIconPath: settingsAnimatedIconPaths.policies },
    {
        key: "security",
        label: "Безопасность",
        description: "Пароль и удаление аккаунта",
        icon: Gear as IconData,
        animatedIconPath: settingsAnimatedIconPaths.security,
    },
];

const sidebarNavItems = [
    ...sectionNavItems,
    {
        key: "logout",
        label: "Выйти",
        icon: ArrowRightFromSquare as IconData,
        animatedIconPath: settingsAnimatedIconPaths.logout,
    },
];

function resolveSettingsTab(tab: string | string[] | undefined, legacyType?: string | string[]): string {
    const value = Array.isArray(tab) ? tab[0] : tab;
    const legacyValue = Array.isArray(legacyType) ? legacyType[0] : legacyType;
    const resolvedValue = value || legacyValue;

    if (!resolvedValue) return "account";
    return sectionNavItems.some((item) => item.key === resolvedValue) ? resolvedValue : "account";
}

const SettingsPage = () => {
    const router = useRouter();
    const { user, logout } = useAuth();
    const [type, setType] = useState<string>("account");
    const { themeMode, setTheme } = useThemeMode();
    const activeSection = sectionNavItems.find((item) => item.key === type) || sectionNavItems[0];

    useEffect(() => {
        if (!router.isReady) return;
        const tabFromQuery = resolveSettingsTab(router.query.tab, router.query.type);
        setType((prev) => (prev === tabFromQuery ? prev : tabFromQuery));
    }, [router.isReady, router.query.tab, router.query.type]);

    const handleSectionChange = (key: string) => {
        if (key === "logout") {
            logout();
            return;
        }

        const nextType = resolveSettingsTab(key);
        setType(nextType);
        const query = nextType === "account" ? {} : { tab: nextType };
        void router.replace({ pathname: "/settings", query }, undefined, { shallow: true });
    };

    return (
        <GravityLayout title="Настройки">
            <PageOverlay
                title="Настройки"
                breadcrumb="Дашборд"
                backHref="/dashboard"
                nav={sidebarNavItems}
                activeNav={type}
                onNavChange={handleSectionChange}
                hidePrimaryAction
                sidebarHeader={
                    <div className="repeto-settings-sidebar-header">
                        <div className="repeto-settings-sidebar-theme" aria-label="Тема интерфейса">
                            {([
                                {
                                    mode: "light",
                                    label: "Светлая",
                                    icon: Sun,
                                    animatedIconPath: settingsAnimatedIconPaths.themeLight,
                                },
                                {
                                    mode: "system",
                                    label: "Системная",
                                    icon: Display,
                                    animatedIconPath: settingsAnimatedIconPaths.themeSystem,
                                },
                                {
                                    mode: "dark",
                                    label: "Тёмная",
                                    icon: Moon,
                                    animatedIconPath: settingsAnimatedIconPaths.themeDark,
                                },
                            ] as {
                                mode: ThemeMode;
                                label: string;
                                icon: IconData;
                                animatedIconPath: string;
                            }[]).map((opt) => (
                                <button
                                    key={opt.mode}
                                    type="button"
                                    onClick={() => setTheme(opt.mode)}
                                    className={`repeto-settings-theme-btn${themeMode === opt.mode ? " repeto-settings-theme-btn--active" : ""}`}
                                    title={opt.label}
                                    aria-label={opt.label}
                                >
                                    <AnimatedSidebarIcon
                                        src={opt.animatedIconPath}
                                        fallbackIcon={opt.icon}
                                        play={themeMode === opt.mode}
                                        size={16}
                                    />
                                </button>
                            ))}
                        </div>

                        {user?.role === "admin" && (
                            <Link href="/admin" className="repeto-settings-sidebar-link">
                                <AnimatedSidebarIcon
                                    src={settingsAnimatedIconPaths.publicPage}
                                    fallbackIcon={ArrowUpRightFromSquare as IconData}
                                    play
                                    size={16}
                                />
                                <span>Админка</span>
                            </Link>
                        )}
                    </div>
                }
            >
                <div className="repeto-settings-content repeto-settings-content--shell">
                    <div className="repeto-settings-page-head">
                        <Text variant="display-1" className="repeto-settings-page-head__title">
                            {activeSection.label}
                        </Text>
                        <Text variant="body-1" color="secondary" className="repeto-settings-page-head__desc">
                            {activeSection.description}
                        </Text>
                    </div>
                    {type === "account" && <Account />}
                    {type === "public-page" && <PublicPage />}
                    {type === "security" && <Security />}
                    {type === "notifications" && <Notifications />}
                    {type === "policies" && <Policies />}
                    {type === "integrations" && <Integrations />}
                </div>
            </PageOverlay>
        </GravityLayout>
    );
};

export default SettingsPage;