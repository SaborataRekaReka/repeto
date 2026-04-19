import { useState, useRef, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import GravityLayout from "@/components/GravityLayout";
import { Card, Text, Button, Icon, Switch, TextInput } from "@gravity-ui/uikit";
import { Person, Gear, Bell, FileText, ArrowUpRightFromSquare, Sun, Display, Moon, ArrowRightFromSquare, CircleCheck, Xmark } from "@gravity-ui/icons";
import type { IconData } from "@gravity-ui/uikit";
import Account from "./Account";
import Security from "./Security";
import Notifications from "./Notifications";
import Policies from "./Policies";
import Integrations from "./Integrations";
import { getInitials } from "@/lib/formatters";
import { useAuth } from "@/contexts/AuthContext";
import { useThemeMode } from "@/contexts/ThemeContext";
import type { ThemeMode } from "@/contexts/ThemeContext";
import { useSettings, updateAccount, uploadAvatar, checkAccountSlug } from "@/hooks/useSettings";
import { resolveApiAssetUrl } from "@/lib/api";

type SlugStatus = "idle" | "checking" | "available" | "taken" | "error";

function sanitizeSlug(value: string): string {
    return value
        .toLowerCase()
        .replace(/[^a-z0-9-]/g, "-")
        .replace(/-+/g, "-")
        .replace(/^-|-$/g, "");
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
    const [slug, setSlug] = useState("");
    const [published, setPublished] = useState(false);
    const [showPublicPackages, setShowPublicPackages] = useState(true);
    const [slugStatus, setSlugStatus] = useState<SlugStatus>("idle");
    const [slugHint, setSlugHint] = useState("");
    const [slugSuggestion, setSlugSuggestion] = useState("");
    const [slugFocused, setSlugFocused] = useState(false);
    const [slugTyping, setSlugTyping] = useState(false);
    const [publicPageError, setPublicPageError] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const slugRequestIdRef = useRef(0);
    const publicSettingsHydratedRef = useRef(false);
    const { themeMode, setTheme } = useThemeMode();

    useEffect(() => {
        setAvatarSrc(resolveApiAssetUrl(settings?.avatarUrl) || user?.avatar || null);
    }, [settings?.avatarUrl, user?.avatar]);

    useEffect(() => {
        if (settings) {
            setSlug(settings.slug || "");
            setPublished(!!settings.published);
            setShowPublicPackages(settings.showPublicPackages !== false);
            setPublicPageError(null);
            publicSettingsHydratedRef.current = true;
        }
    }, [settings?.slug, settings?.published, settings?.showPublicPackages]);

    useEffect(() => {
        if (!router.isReady) return;
        const tabFromQuery = resolveSettingsTab(router.query.tab);
        setType((prev) => (prev === tabFromQuery ? prev : tabFromQuery));
    }, [router.isReady, router.query.tab]);

    const requestSlugStatus = useCallback(async (rawSlug: string, mode: "init" | "typing" | "blur") => {
        const normalized = sanitizeSlug(rawSlug);
        const requestId = slugRequestIdRef.current + 1;
        slugRequestIdRef.current = requestId;
        setSlugStatus("checking");
        setSlugHint("Проверяем адрес...");
        setSlugSuggestion("");

        try {
            const result = await checkAccountSlug({
                value: normalized,
                name: settings?.name || user?.name || "",
            });

            if (requestId !== slugRequestIdRef.current) {
                return null;
            }

            if (!normalized && result.suggested) {
                setSlug(result.suggested);
            }

            if (result.isAvailable) {
                setSlugStatus("available");
                setSlugHint("Адрес свободен");
                setSlugSuggestion("");
                return result;
            }

            setSlugStatus("taken");
            setSlugHint("Такой адрес уже занят.");
            setSlugSuggestion(result.suggested || "");

            if (mode === "blur" && result.suggested) {
                setSlug(result.suggested);
                setSlugStatus("available");
                setSlugHint("Адрес свободен");
                setSlugSuggestion("");
            }

            return result;
        } catch {
            if (requestId !== slugRequestIdRef.current) {
                return null;
            }
            setSlugStatus("error");
            setSlugHint("Не удалось проверить адрес");
            setSlugSuggestion("");
            return null;
        }
    }, [settings?.name, user?.name]);

    useEffect(() => {
        if (!publicSettingsHydratedRef.current) {
            return;
        }

        const normalized = sanitizeSlug(slug);
        if (normalized !== slug) {
            setSlug(normalized);
            return;
        }

        const timer = window.setTimeout(() => {
            void requestSlugStatus(normalized, normalized ? "typing" : "init").finally(() => {
                setSlugTyping(false);
            });
        }, normalized ? 250 : 0);

        return () => {
            window.clearTimeout(timer);
        };
    }, [slug, requestSlugStatus]);

    const savePublicPage = useCallback(async (newSlug: string, newPublished: boolean) => {
        const normalizedSlug = sanitizeSlug(newSlug);
        setSaving(true);
        setPublicPageError(null);
        try {
            await updateAccount({ slug: normalizedSlug, published: newPublished });
            await mutateSettings();
            return true;
        } catch (error: any) {
            const message =
                typeof error?.message === "string" && error.message.trim().length > 0
                    ? error.message
                    : "Не удалось сохранить настройки публичной страницы";
            setPublicPageError(message);
            if (/занят/i.test(message)) {
                setSlugStatus("taken");
                setSlugHint("Такой адрес уже занят.");
            }
            return false;
        } finally {
            setSaving(false);
        }
    }, [mutateSettings]);

    const savePublicPackagesVisibility = useCallback(async (value: boolean) => {
        setSaving(true);
        setPublicPageError(null);
        try {
            await updateAccount({ showPublicPackages: value });
            await mutateSettings();
            return true;
        } catch (error: any) {
            const message =
                typeof error?.message === "string" && error.message.trim().length > 0
                    ? error.message
                    : "Не удалось сохранить настройки публичных пакетов";
            setPublicPageError(message);
            return false;
        } finally {
            setSaving(false);
        }
    }, [mutateSettings]);

    const canEnablePublishing = slugStatus === "available" && !!slug;

    const handlePublishedToggle = async (val: boolean) => {
        if (saving) {
            return;
        }

        if (!val) {
            const prev = published;
            setPublished(false);
            const ok = await savePublicPage(slug, false);
            if (!ok) {
                setPublished(prev);
            }
            return;
        }

        const checked = await requestSlugStatus(slug, "blur");
        if (!checked) {
            return;
        }

        const nextSlug = sanitizeSlug(checked.suggested || checked.requested || slug);
        if (!nextSlug) {
            return;
        }

        if (nextSlug !== slug) {
            setSlug(nextSlug);
        }

        const prev = published;
        setPublished(true);
        const ok = await savePublicPage(nextSlug, true);
        if (!ok) {
            setPublished(prev);
        }
    };

    const handleSlugBlur = async () => {
        if (!publicSettingsHydratedRef.current) {
            return;
        }

        const checked = await requestSlugStatus(slug, "blur");
        if (!checked) {
            return;
        }

        const nextSlug = sanitizeSlug(checked.suggested || checked.requested || slug);
        if (!nextSlug) {
            return;
        }

        if (nextSlug !== slug) {
            setSlug(nextSlug);
        }

        if (nextSlug !== (settings?.slug || "")) {
            await savePublicPage(nextSlug, published);
        }
    };

    const handleShowPublicPackagesToggle = async (value: boolean) => {
        if (saving) {
            return;
        }

        const prev = showPublicPackages;
        setShowPublicPackages(value);

        const ok = await savePublicPackagesVisibility(value);
        if (!ok) {
            setShowPublicPackages(prev);
        }
    };

    const applySuggestedSlug = () => {
        if (!slugSuggestion) {
            return;
        }
        setSlug(slugSuggestion);
    };

    const publishToggleDisabled = saving || (!published && !canEnablePublishing);
    const slugHintColor =
        slugStatus === "available"
            ? "var(--g-color-text-positive)"
            : slugStatus === "taken" || slugStatus === "error"
                ? "var(--g-color-text-danger)"
                : "var(--g-color-text-secondary)";

    const slugStatusIcon = !published && slug && !slugTyping && slugStatus !== "checking"
        ? (slugStatus === "available"
            ? CircleCheck
            : slugStatus === "taken" || slugStatus === "error"
                ? Xmark
                : null)
        : null;

    const slugStatusIconColor =
        slugStatus === "available"
            ? "var(--g-color-text-positive)"
            : "var(--g-color-text-danger)";

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
            <div className="repeto-settings-layout">
                {/* Sidebar */}
                <div className="repeto-settings-sidebar">
                    {/* Profile card */}
                    <Card className="repeto-settings-profile" view="outlined" style={{ padding: 24, background: "var(--g-color-base-float)", textAlign: "center" }}>
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
                    <div className="repeto-settings-sections" style={{ marginTop: 20, display: "flex", flexDirection: "column", gap: 2 }}>
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
                    <div className="repeto-settings-logout" style={{ marginTop: 8, paddingTop: 8, borderTop: "1px solid var(--g-color-line-generic)" }}>
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
                    <Card className="repeto-settings-public" view="outlined" style={{ padding: 16, marginTop: 20, background: "var(--g-color-base-float)" }}>
                        {!published && (
                            <>
                                <div style={{ marginTop: 12 }}>
                                    <Text variant="caption-2" color="secondary" style={{ display: "block", marginBottom: 6 }}>
                                        Персональная ссылка
                                    </Text>
                                    <TextInput
                                        size="s"
                                        value={slug}
                                        onUpdate={(value) => {
                                            setSlug(sanitizeSlug(value));
                                            setSlugTyping(true);
                                            setSlugStatus("checking");
                                            setSlugHint("Проверяем адрес...");
                                            setSlugSuggestion("");
                                            setPublicPageError(null);
                                        }}
                                        onFocus={() => {
                                            setSlugFocused(true);
                                        }}
                                        onBlur={() => {
                                            setSlugFocused(false);
                                            setSlugTyping(false);
                                            void handleSlugBlur();
                                        }}
                                        placeholder="slug"
                                        endContent={
                                            slugStatusIcon ? (
                                                <Icon
                                                    data={slugStatusIcon as IconData}
                                                    size={14}
                                                    style={{
                                                        color: slugStatusIconColor,
                                                        marginRight: 4,
                                                    }}
                                                />
                                            ) : null
                                        }
                                    />
                                </div>

                                {slugFocused && slugTyping && !!slugHint && (
                                    <Text variant="caption-2" style={{ display: "block", marginTop: 8, color: slugHintColor }}>
                                        {slugHint}
                                    </Text>
                                )}

                                {slugFocused && slugStatus === "taken" && slugSuggestion && (
                                    <button
                                        onClick={applySuggestedSlug}
                                        style={{
                                            marginTop: 8,
                                            padding: 0,
                                            border: "none",
                                            background: "transparent",
                                            color: "var(--g-color-text-brand)",
                                            fontSize: 12,
                                            fontWeight: 600,
                                            cursor: "pointer",
                                        }}
                                    >
                                        Использовать: {slugSuggestion}
                                    </button>
                                )}
                            </>
                        )}

                        <div style={{ marginTop: 14, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                            <Text variant="body-1" style={{ fontWeight: 600 }}>Опубликовать страницу</Text>
                            <Switch
                                checked={published}
                                onUpdate={(value) => {
                                    void handlePublishedToggle(value);
                                }}
                                size="m"
                                disabled={publishToggleDisabled}
                            />
                        </div>
                        <div style={{ marginTop: 12, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                            <Text variant="body-1" style={{ fontWeight: 600 }}>Показывать публичные пакеты</Text>
                            <Switch
                                checked={showPublicPackages}
                                onUpdate={(value) => {
                                    void handleShowPublicPackagesToggle(value);
                                }}
                                size="m"
                                disabled={saving}
                            />
                        </div>
                        <Text variant="caption-2" color="secondary" style={{ display: "block", marginTop: 8 }}>
                            Если выключено, раздел с пакетами не отображается на публичной странице и в записи.
                        </Text>
                        {!published && !canEnablePublishing && (
                            <Text variant="caption-2" color="secondary" style={{ display: "block", marginTop: 8 }}>
                                Публикация доступна только после выбора свободного адреса.
                            </Text>
                        )}
                        {publicPageError && (
                            <Text variant="caption-2" style={{ display: "block", marginTop: 8, color: "var(--g-color-text-danger)" }}>
                                {publicPageError}
                            </Text>
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
                    <Card className="repeto-settings-theme" view="outlined" style={{ padding: 16, marginTop: 20, background: "var(--g-color-base-float)" }}>
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
                <div className="repeto-settings-content">
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
