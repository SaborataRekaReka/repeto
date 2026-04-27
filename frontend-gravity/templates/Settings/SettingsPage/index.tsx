import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import GravityLayout from "@/components/GravityLayout";
import { Card, Text, Button, Icon } from "@gravity-ui/uikit";
import { Person, Gear, Bell, FileText, ArrowUpRightFromSquare, Sun, Display, Moon, ArrowRightFromSquare } from "@gravity-ui/icons";
import type { IconData } from "@gravity-ui/uikit";
import Account from "./Account";
import PublicPage from "./PublicPage";
import Security from "./Security";
import Notifications from "./Notifications";
import Policies from "./Policies";
import Integrations from "./Integrations";
import { getInitials } from "@/lib/formatters";
import { useAuth } from "@/contexts/AuthContext";
import { useThemeMode } from "@/contexts/ThemeContext";
import type { ThemeMode } from "@/contexts/ThemeContext";
import { useSettings, uploadAvatar } from "@/hooks/useSettings";
import { resolveApiAssetUrl } from "@/lib/api";

const navItems = [
    { id: "account", label: "Аккаунт", icon: Person },
    { id: "public-page", label: "Публичная страница", icon: ArrowUpRightFromSquare },
    { id: "security", label: "Безопасность", icon: Gear },
    { id: "notifications", label: "Уведомления", icon: Bell },
    { id: "policies", label: "Политики", icon: FileText },
    { id: "integrations", label: "Интеграции", icon: Display },
];

function resolveSettingsTab(tab: string | string[] | undefined): string {
    const value = Array.isArray(tab) ? tab[0] : tab;
    if (!value) return "account";
    return navItems.some((item) => item.id === value) ? value : "account";
}

const SettingsPage = () => {
    const router = useRouter();
    const { user, logout } = useAuth();
    const { data: settings, mutate: mutateSettings } = useSettings();
    const [type, setType] = useState<string>("account");
    const [avatarSrc, setAvatarSrc] = useState<string | null>(user?.avatar || null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const { themeMode, setTheme } = useThemeMode();

    useEffect(() => {
        setAvatarSrc(resolveApiAssetUrl(settings?.avatarUrl) || user?.avatar || null);
    }, [settings?.avatarUrl, user?.avatar]);

    useEffect(() => {
        if (!router.isReady) return;
        const tabFromQuery = resolveSettingsTab(router.query.tab);
        setType((prev) => (prev === tabFromQuery ? prev : tabFromQuery));
    }, [router.isReady, router.query.tab]);

    const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !file.type.startsWith("image/") || file.size > 5 * 1024 * 1024) return;
        const reader = new FileReader();
        reader.onload = (ev) => setAvatarSrc(ev.target?.result as string);
        reader.readAsDataURL(file);
        try {
            const result = await uploadAvatar(file);
            setAvatarSrc(resolveApiAssetUrl(result.avatarUrl) || null);
            mutateSettings();
        } catch { /* preview stays */ }
    };

    return (
        <GravityLayout title="Настройки">
            <div className="repeto-settings-layout repeto-settings-layout--v2">
                {/* Sidebar */}
                <div className="repeto-settings-sidebar">
                    {/* Profile card */}
                    <Card className="repeto-settings-side-card repeto-settings-profile" view="outlined">
                        <div
                            onClick={() => fileInputRef.current?.click()}
                            className="repeto-settings-avatar-trigger"
                        >
                            {avatarSrc ? (
                                <img src={avatarSrc} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                            ) : (
                                <div className="repeto-settings-avatar-fallback">
                                    {getInitials(user?.name || "")}
                                </div>
                            )}
                        </div>
                        <input ref={fileInputRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handleAvatarChange} />
                        <Text variant="subheader-2" className="repeto-settings-profile-name">{user?.name || ""}</Text>
                        <Text variant="caption-2" color="secondary" className="repeto-settings-profile-email">{user?.email || ""}</Text>
                        <div className="repeto-settings-profile-action">
                            <Button view="outlined" size="s" onClick={() => fileInputRef.current?.click()}>
                                Изменить фото
                            </Button>
                        </div>
                    </Card>

                    {/* Navigation */}
                    <Card className="repeto-settings-side-card repeto-settings-nav-card" view="outlined">
                        <div className="repeto-settings-sections">
                            {navItems.map((item) => (
                                <button
                                    key={item.id}
                                    onClick={() => {
                                        setType(item.id);
                                        const query = item.id === "account" ? {} : { tab: item.id };
                                        router.replace({ pathname: "/settings", query }, undefined, { shallow: true });
                                    }}
                                    className={`repeto-settings-nav-btn${type === item.id ? " repeto-settings-nav-btn--active" : ""}`}
                                >
                                    <Icon data={item.icon as IconData} size={18} />
                                    {item.label}
                                </button>
                            ))}

                            {user?.role === "admin" && (
                                <Link href="/admin" className="repeto-settings-nav-btn repeto-settings-nav-link">
                                    <Icon data={ArrowUpRightFromSquare as IconData} size={18} />
                                    Открыть админку
                                </Link>
                            )}
                        </div>

                        <div className="repeto-settings-logout">
                            <button
                                onClick={() => { logout(); }}
                                className="repeto-settings-logout-btn"
                            >
                                <Icon data={ArrowRightFromSquare as IconData} size={18} />
                                Выйти из аккаунта
                            </button>
                        </div>
                    </Card>

                    {/* Theme switcher */}
                    <Card className="repeto-settings-side-card repeto-settings-theme" view="outlined">
                        <Text variant="body-1" className="repeto-settings-theme-title">Тема интерфейса</Text>
                        <div className="repeto-settings-theme-grid">
                            {([
                                { mode: "light", label: "Светлая", icon: Sun },
                                { mode: "system", label: "Системная", icon: Display },
                                { mode: "dark", label: "Тёмная", icon: Moon },
                            ] as { mode: ThemeMode; label: string; icon: any }[]).map((opt) => (
                                <button
                                    key={opt.mode}
                                    onClick={() => setTheme(opt.mode)}
                                    className={`repeto-settings-theme-btn${themeMode === opt.mode ? " repeto-settings-theme-btn--active" : ""}`}
                                >
                                    <Icon data={opt.icon as any} size={18} />
                                    {opt.label}
                                </button>
                            ))}
                        </div>
                    </Card>
                </div>

                {/* Content */}
                <div className="repeto-settings-content">
                    {type === "account" && <Account />}
                    {type === "public-page" && <PublicPage />}
                    {type === "security" && <Security />}
                    {type === "notifications" && <Notifications />}
                    {type === "policies" && <Policies />}
                    {type === "integrations" && <Integrations />}
                </div>
            </div>
        </GravityLayout>
    );
};

export default SettingsPage;
