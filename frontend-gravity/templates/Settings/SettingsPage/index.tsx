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
import AppField from "@/components/AppField";

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

                    {/* Public page */}
                    <Card className="repeto-settings-side-card repeto-settings-public" view="outlined">
                        {!published && (
                            <>
                                <div style={{ marginTop: 12 }}>
                                    <AppField label="Персональная ссылка" className="repeto-settings-public-slug-field">
                                    <TextInput
                                        size="l"
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
                                    </AppField>
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
