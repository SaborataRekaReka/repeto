import { useState, useRef, useEffect, useCallback } from "react";
import Link from "next/link";
import Layout from "@/components/Layout";
import Tabs from "@/components/Tabs";
import Icon from "@/components/Icon";
import Field from "@/components/Field";
import Switch from "@/components/Switch";
import Account from "./Account";
import Security from "./Security";
import Notifications from "./Notifications";
import Policies from "./Policies";
import Integrations from "./Integrations";
import { getInitials } from "@/mocks/students";
import { useAuth } from "@/contexts/AuthContext";
import { useSettings, updateAccount, uploadAvatar } from "@/hooks/useSettings";
import { resolveApiAssetUrl } from "@/lib/api";

function transliterate(text: string): string {
    const map: Record<string, string> = {
        'а': 'a', 'б': 'b', 'в': 'v', 'г': 'g', 'д': 'd', 'е': 'e', 'ё': 'yo',
        'ж': 'zh', 'з': 'z', 'и': 'i', 'й': 'y', 'к': 'k', 'л': 'l', 'м': 'm',
        'н': 'n', 'о': 'o', 'п': 'p', 'р': 'r', 'с': 's', 'т': 't', 'у': 'u',
        'ф': 'f', 'х': 'kh', 'ц': 'ts', 'ч': 'ch', 'ш': 'sh', 'щ': 'shch',
        'ъ': '', 'ы': 'y', 'ь': '', 'э': 'e', 'ю': 'yu', 'я': 'ya', ' ': '-',
    };
    return text
        .toLowerCase()
        .split('')
        .map((c) => map[c] ?? c)
        .join('')
        .replace(/[^a-z0-9-]/g, '')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '');
}

function generateSlugFromName(name: string): string {
    const parts = name.trim().split(/\s+/);
    if (parts.length < 2) return transliterate(name);
    // "Фамилия Имя Отчество" → "imya-familiya"
    return transliterate(`${parts[1]} ${parts[0]}`);
}

const SettingsPage = () => {
    const { user } = useAuth();
    const { data: settings, mutate: mutateSettings } = useSettings();
    const [type, setType] = useState<string>("account");
    const [avatarSrc, setAvatarSrc] = useState<string | null>(
        user?.avatar || null
    );

    useEffect(() => {
        setAvatarSrc(
            resolveApiAssetUrl(settings?.avatarUrl) || user?.avatar || null
        );
    }, [settings?.avatarUrl, user?.avatar]);
    const defaultSlug = generateSlugFromName(user?.name || "");
    const [slug, setSlug] = useState("");
    const [published, setPublished] = useState(false);
    const [saving, setSaving] = useState(false);

    // Initialize from server settings
    useEffect(() => {
        if (settings) {
            setSlug(settings.slug || defaultSlug);
            setPublished(!!settings.published);
        }
    }, [settings, defaultSlug]);

    const savePublicPage = useCallback(
        async (newSlug: string, newPublished: boolean) => {
            if (!newSlug) return;
            setSaving(true);
            try {
                await updateAccount({ slug: newSlug, published: newPublished });
                mutateSettings();
            } catch (e: any) {
                // revert on error
                if (settings) {
                    setSlug(settings.slug || defaultSlug);
                    setPublished(!!settings.published);
                }
            } finally {
                setSaving(false);
            }
        },
        [settings, defaultSlug, mutateSettings]
    );

    const handlePublishedToggle = (val: boolean) => {
        setPublished(val);
        savePublicPage(slug, val);
    };

    const handleSlugBlur = () => {
        if (slug && slug !== (settings?.slug || defaultSlug)) {
            savePublicPage(slug, published);
        }
    };

    const publicUrl = `repeto.ru/t/${slug}`;
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        if (!file.type.startsWith("image/")) return;
        if (file.size > 5 * 1024 * 1024) return; // 5 MB max
        // Instant preview
        const reader = new FileReader();
        reader.onload = (ev) => {
            setAvatarSrc(ev.target?.result as string);
        };
        reader.readAsDataURL(file);
        // Upload to server
        try {
            const result = await uploadAvatar(file);
            setAvatarSrc(resolveApiAssetUrl(result.avatarUrl) || null);
            mutateSettings();
        } catch {
            // preview stays, but upload failed silently
        }
    };

    const types = [
        { title: "Аккаунт", value: "account" },
        { title: "Безопасность", value: "security" },
        { title: "Уведомления", value: "notifications" },
        { title: "Политики", value: "policies" },
        { title: "Интеграции", value: "integrations" },
    ];

    return (
        <Layout title="Настройки">
            <div className="flex pt-4 lg:block">
                <div className="shrink-0 w-[20rem] 4xl:w-[14.7rem] lg:w-full lg:mb-8">
                    <div className="card lg:flex lg:items-center lg:gap-4">
                        <div className="p-5 lg:p-4">
                            <div
                                className="relative group w-[5.25rem] h-[5.25rem] mx-auto mb-3 rounded-full overflow-hidden cursor-pointer lg:w-12 lg:h-12 lg:mx-0 lg:mb-0"
                                onClick={() => fileInputRef.current?.click()}
                            >
                                {avatarSrc ? (
                                    <img
                                        className="w-full h-full object-cover"
                                        src={avatarSrc}
                                        alt="Avatar"
                                    />
                                ) : (
                                    <div className="flex items-center justify-center w-full h-full bg-purple-3 text-xl font-bold text-n-1 lg:text-sm dark:bg-purple-1/20">
                                        {getInitials(user?.name || "")}
                                    </div>
                                )}
                                <div className="absolute inset-0 flex items-center justify-center bg-n-1/50 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Icon
                                        className="fill-white"
                                        name="camera"
                                    />
                                </div>
                            </div>
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={handleAvatarChange}
                            />
                            <div className="text-center lg:text-left">
                                <div className="text-h6 lg:text-sm">
                                    {user?.name || ""}
                                </div>
                                <div className="mt-1 text-xs text-n-3 dark:text-white/50">
                                    {user?.email || ""}
                                </div>
                            </div>
                            <button
                                className="btn-stroke btn-small w-full mt-4"
                                onClick={() => fileInputRef.current?.click()}
                            >
                                Изменить фото
                            </button>
                        </div>
                    </div>
                    <div className="card mt-4">
                        <div className="p-4">
                            <div className="flex items-center justify-between mb-3">
                                <span className="text-sm font-bold">
                                    Публичная страница
                                </span>
                                <Switch
                                    value={published}
                                    setValue={handlePublishedToggle}
                                />
                            </div>
                            {!published && (
                                <div className="flex items-center gap-2 mb-2">
                                    <input
                                        className="flex-1 text-xs bg-transparent border border-n-1 rounded-sm px-2 py-1.5 outline-none font-bold dark:border-white dark:text-white"
                                        value={slug}
                                        onChange={(e) =>
                                            setSlug(
                                                e.target.value
                                                    .toLowerCase()
                                                    .replace(/[^a-z0-9-]/g, "")
                                            )
                                        }
                                        onBlur={handleSlugBlur}
                                        placeholder="slug"
                                    />
                                </div>
                            )}
                            {published && slug && (
                                <Link
                                    className="flex items-center gap-1.5 text-xs font-bold text-purple-1 hover:underline break-all"
                                    href={`/t/${slug}`}
                                    target="_blank"
                                >
                                    <Icon
                                        className="shrink-0 fill-purple-1"
                                        name="earth"
                                    />
                                    {publicUrl}
                                </Link>
                            )}
                        </div>
                    </div>
                </div>
                <div className="w-[calc(100%-20rem)] pl-[6.625rem] 4xl:w-[calc(100%-14.7rem)] 2xl:pl-10 lg:w-full lg:pl-0">
                    <div className="flex justify-between mb-6 md:overflow-auto md:-mx-5 md:scrollbar-none md:before:w-5 md:before:shrink-0 md:after:w-5 md:after:shrink-0">
                        <Tabs
                            className="2xl:ml-0 md:flex-nowrap"
                            classButton="2xl:ml-0 md:whitespace-nowrap"
                            items={types}
                            value={type}
                            setValue={setType}
                        />
                    </div>
                    {type === "account" && <Account />}
                    {type === "security" && <Security />}
                    {type === "notifications" && <Notifications />}
                    {type === "policies" && <Policies />}
                    {type === "integrations" && <Integrations />}
                </div>
            </div>
        </Layout>
    );
};

export default SettingsPage;
