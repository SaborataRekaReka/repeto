import { useState, useRef, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import GravityLayout from "@/components/GravityLayout";
import { Card, Text, Button, Icon, Switch, TextInput } from "@gravity-ui/uikit";
import { Person, Gear, Bell, FileText, ArrowUpRightFromSquare, Sun, Display, Moon, ArrowRightFromSquare } from "@gravity-ui/icons";
import type { IconData } from "@gravity-ui/uikit";
import Account from "./Account";
import Security from "./Security";
import Notifications from "./Notifications";
import Policies from "./Policies";
import Integrations from "./Integrations";
import { getInitials } from "@/mocks/students";
import { useAuth } from "@/contexts/AuthContext";
import { useThemeMode } from "@/contexts/ThemeContext";
import type { ThemeMode } from "@/contexts/ThemeContext";
import { useSettings, updateAccount, uploadAvatar } from "@/hooks/useSettings";
import { resolveApiAssetUrl } from "@/lib/api";

function transliterate(text: string): string {
    const map: Record<string, string> = {
        "а": "a", "б": "b", "в": "v", "г": "g", "д": "d", "е": "e", "ё": "yo",
        "ж": "zh", "з": "z", "и": "i", "й": "y", "к": "k", "л": "l", "м": "m",
        "н": "n", "о": "o", "п": "p", "р": "r", "с": "s", "т": "t", "у": "u",
        "ф": "f", "х": "kh", "ц": "ts", "ч": "ch", "ш": "sh", "щ": "shch",
        "ъ": "", "ы": "y", "ь": "", "э": "e", "ю": "yu", "я": "ya", " ": "-",
    };
    return text.toLowerCase().split("").map((c) => map[c] ?? c).join("")
        .replace(/[^a-z0-9-]/g, "").replace(/-+/g, "-").replace(/^-|-$/g, "");
}

function generateSlugFromName(name: string): string {
    const parts = name.trim().split(/\s+/);
    if (parts.length < 2) return transliterate(name);
    return transliterate(`${parts[1]} ${parts[0]}`);
}

const navItems = [
    { id: "account", label: "Аккаунт", icon: Person },
    { id: "security", label: "Безопасность", icon: Gear },
    { id: "notifications", label: "Уведомления", icon: Bell },
    { id: "policies", label: "Политики", icon: FileText },
    { id: "integrations", label: "Интеграции", icon: ArrowUpRightFromSquare },
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
    const defaultSlug = generateSlugFromName(user?.name || "");
    const [slug, setSlug] = useState("");
    const [published, setPublished] = useState(false);
    const [saving, setSaving] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const { themeMode, setTheme } = useThemeMode();

    useEffect(() => {
        setAvatarSrc(resolveApiAssetUrl(settings?.avatarUrl) || user?.avatar || null);
    }, [settings?.avatarUrl, user?.avatar]);

    useEffect(() => {
        if (settings) {
            setSlug(settings.slug || defaultSlug);
            setPublished(!!settings.published);
        }
    }, [settings, defaultSlug]);

    useEffect(() => {
        if (!router.isReady) return;
        const tabFromQuery = resolveSettingsTab(router.query.tab);
        setType((prev) => (prev === tabFromQuery ? prev : tabFromQuery));
    }, [router.isReady, router.query.tab]);

    const savePublicPage = useCallback(async (newSlug: string, newPublished: boolean) => {
        if (!newSlug) return;
        setSaving(true);
        try {
            await updateAccount({ slug: newSlug, published: newPublished });
            mutateSettings();
        } catch {
            if (settings) { setSlug(settings.slug || defaultSlug); setPublished(!!settings.published); }
        } finally { setSaving(false); }
    }, [settings, defaultSlug, mutateSettings]);

    const handlePublishedToggle = (val: boolean) => { setPublished(val); savePublicPage(slug, val); };
    const handleSlugBlur = () => { if (slug && slug !== (settings?.slug || defaultSlug)) savePublicPage(slug, published); };

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
            <div style={{ display: "flex", gap: 32 }}>
                {/* Sidebar */}
                <div style={{ width: 280, flexShrink: 0 }}>
                    {/* Profile card */}
                    <Card view="outlined" style={{ padding: 24, background: "var(--g-color-base-float)", textAlign: "center" }}>
                        <div
                            onClick={() => fileInputRef.current?.click()}
                            style={{
                                width: 88, height: 88, borderRadius: "50%", margin: "0 auto",
                                cursor: "pointer", overflow: "hidden", transition: "box-shadow 0.2s",
                                boxShadow: "0 0 0 3px rgba(174,122,255,0.15)",
                            }}
                            onMouseEnter={(e) => (e.currentTarget.style.boxShadow = "0 0 0 4px rgba(174,122,255,0.3)")}
                            onMouseLeave={(e) => (e.currentTarget.style.boxShadow = "0 0 0 3px rgba(174,122,255,0.15)")}
                        >
                            {avatarSrc ? (
                                <img src={avatarSrc} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                            ) : (
                                <div style={{
                                    width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center",
                                    background: "rgba(174,122,255,0.08)", fontSize: 24, fontWeight: 700, color: "var(--g-color-text-brand)",
                                }}>
                                    {getInitials(user?.name || "")}
                                </div>
                            )}
                        </div>
                        <input ref={fileInputRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handleAvatarChange} />
                        <Text variant="subheader-2" style={{ display: "block", marginTop: 16 }}>{user?.name || ""}</Text>
                        <Text variant="caption-2" color="secondary" style={{ display: "block", marginTop: 4 }}>{user?.email || ""}</Text>
                        <div style={{ marginTop: 16 }}>
                            <Button view="outlined" size="s" onClick={() => fileInputRef.current?.click()}>
                                Изменить фото
                            </Button>
                        </div>
                    </Card>

                    {/* Navigation */}
                    <div style={{ marginTop: 20, display: "flex", flexDirection: "column", gap: 2 }}>
                        {navItems.map((item) => (
                            <button
                                key={item.id}
                                onClick={() => {
                                    setType(item.id);
                                    const query = item.id === "account" ? {} : { tab: item.id };
                                    router.replace({ pathname: "/settings", query }, undefined, { shallow: true });
                                }}
                                style={{
                                    display: "flex", alignItems: "center", gap: 12,
                                    padding: "10px 16px", borderRadius: 10,
                                    border: "none", cursor: "pointer", width: "100%", textAlign: "left",
                                    background: type === item.id ? "rgba(174,122,255,0.08)" : "transparent",
                                    color: type === item.id ? "var(--g-color-text-brand)" : "var(--g-color-text-primary)",
                                    fontWeight: type === item.id ? 600 : 400, fontSize: 14,
                                    transition: "all 0.15s",
                                }}
                                onMouseEnter={(e) => { if (type !== item.id) e.currentTarget.style.background = "var(--g-color-base-simple-hover)"; }}
                                onMouseLeave={(e) => { if (type !== item.id) e.currentTarget.style.background = "transparent"; }}
                            >
                                <Icon data={item.icon as IconData} size={18} />
                                {item.label}
                            </button>
                        ))}
                    </div>

                    {/* Logout */}
                    <div style={{ marginTop: 8, paddingTop: 8, borderTop: "1px solid var(--g-color-line-generic)" }}>
                        <button
                            onClick={() => { logout(); }}
                            style={{
                                display: "flex", alignItems: "center", gap: 12,
                                padding: "10px 16px", borderRadius: 10,
                                border: "none", cursor: "pointer", width: "100%", textAlign: "left",
                                background: "transparent",
                                color: "var(--g-color-text-danger)",
                                fontWeight: 400, fontSize: 14,
                                transition: "all 0.15s",
                            }}
                            onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(209,107,143,0.08)"; }}
                            onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
                        >
                            <Icon data={ArrowRightFromSquare as IconData} size={18} />
                            Выйти из аккаунта
                        </button>
                    </div>

                    {/* Public page */}
                    <Card view="outlined" style={{ padding: 16, marginTop: 20, background: "var(--g-color-base-float)" }}>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                            <Text variant="body-1" style={{ fontWeight: 600 }}>Публичная страница</Text>
                            <Switch checked={published} onUpdate={handlePublishedToggle} size="m" />
                        </div>
                        {!published && (
                            <div style={{ marginTop: 12 }}>
                                <TextInput
                                    size="s"
                                    value={slug}
                                    onUpdate={(v) => setSlug(v.toLowerCase().replace(/[^a-z0-9-]/g, ""))}
                                    onBlur={handleSlugBlur}
                                    placeholder="slug"
                                />
                            </div>
                        )}
                        {published && slug && (
                            <Link
                                href={`/t/${slug}`}
                                target="_blank"
                                style={{
                                    display: "inline-flex", alignItems: "center", gap: 6,
                                    marginTop: 12, fontSize: 13, fontWeight: 600,
                                    color: "var(--g-color-text-brand)", textDecoration: "none", wordBreak: "break-all",
                                }}
                            >
                                <Icon data={ArrowUpRightFromSquare as IconData} size={14} />
                                {`repeto.ru/t/${slug}`}
                            </Link>
                        )}
                    </Card>

                    {/* Theme switcher */}
                    <Card view="outlined" style={{ padding: 16, marginTop: 20, background: "var(--g-color-base-float)" }}>
                        <Text variant="body-1" style={{ fontWeight: 600, display: "block", marginBottom: 12 }}>Тема интерфейса</Text>
                        <div style={{
                            display: "grid",
                            gridTemplateColumns: "1fr 1fr 1fr",
                            gap: 4,
                            padding: 4,
                            borderRadius: 12,
                            background: "var(--g-color-base-generic)",
                        }}>
                            {([
                                { mode: "light", label: "Светлая", icon: Sun },
                                { mode: "system", label: "Системная", icon: Display },
                                { mode: "dark", label: "Тёмная", icon: Moon },
                            ] as { mode: ThemeMode; label: string; icon: any }[]).map((opt) => (
                                <button
                                    key={opt.mode}
                                    onClick={() => setTheme(opt.mode)}
                                    style={{
                                        display: "flex",
                                        flexDirection: "column",
                                        alignItems: "center",
                                        gap: 6,
                                        padding: "10px 8px",
                                        borderRadius: 8,
                                        border: "none",
                                        cursor: "pointer",
                                        background: themeMode === opt.mode ? "var(--g-color-base-float)" : "transparent",
                                        boxShadow: themeMode === opt.mode ? "0 1px 4px rgba(0,0,0,0.12)" : "none",
                                        color: themeMode === opt.mode ? "var(--g-color-text-brand)" : "var(--g-color-text-secondary)",
                                        fontWeight: themeMode === opt.mode ? 600 : 400,
                                        fontSize: 12,
                                        transition: "all 0.15s",
                                    }}
                                >
                                    <Icon data={opt.icon as any} size={18} />
                                    {opt.label}
                                </button>
                            ))}
                        </div>
                    </Card>
                </div>

                {/* Content */}
                <div style={{ flex: 1, minWidth: 0 }}>
                    {type === "account" && <Account />}
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
