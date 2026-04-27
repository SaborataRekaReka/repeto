import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import GravityLayout from "@/components/GravityLayout";
import PageOverlay from "@/components/PageOverlay";
import { Text, Icon } from "@gravity-ui/uikit";
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

const sectionNavItems = [
    { key: "account", label: "Аккаунт", icon: Person as IconData },
    { key: "public-page", label: "Публичная страница", icon: ArrowUpRightFromSquare as IconData },
    { key: "security", label: "Безопасность", icon: Gear as IconData },
    { key: "notifications", label: "Уведомления", icon: Bell as IconData },
    { key: "policies", label: "Политики", icon: FileText as IconData },
    { key: "integrations", label: "Интеграции", icon: Display as IconData },
];

const sidebarNavItems = [
    ...sectionNavItems,
    { key: "logout", label: "Выйти", icon: ArrowRightFromSquare as IconData },
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
                                { mode: "light", label: "Светлая", icon: Sun },
                                { mode: "system", label: "Системная", icon: Display },
                                { mode: "dark", label: "Тёмная", icon: Moon },
                            ] as { mode: ThemeMode; label: string; icon: IconData }[]).map((opt) => (
                                <button
                                    key={opt.mode}
                                    type="button"
                                    onClick={() => setTheme(opt.mode)}
                                    className={`repeto-settings-theme-btn${themeMode === opt.mode ? " repeto-settings-theme-btn--active" : ""}`}
                                    title={opt.label}
                                    aria-label={opt.label}
                                >
                                    <Icon data={opt.icon} size={16} />
                                </button>
                            ))}
                        </div>

                        {user?.role === "admin" && (
                            <Link href="/admin" className="repeto-settings-sidebar-link">
                                <Icon data={ArrowUpRightFromSquare as IconData} size={16} />
                                <span>Админка</span>
                            </Link>
                        )}
                    </div>
                }
            >
                <div className="repeto-settings-content repeto-settings-content--shell">
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