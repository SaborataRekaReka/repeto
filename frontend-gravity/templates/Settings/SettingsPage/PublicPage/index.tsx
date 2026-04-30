import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import AnimatedSidebarIcon from "@/components/AnimatedSidebarIcon";
import { Card, Text, Button, Switch, TextInput, Checkbox } from "@gravity-ui/uikit";
import { ArrowUpRightFromSquare, CircleCheck, Xmark } from "@gravity-ui/icons";
import type { IconData } from "@gravity-ui/uikit";
import { useAuth } from "@/contexts/AuthContext";
import AppField from "@/components/AppField";
import { codedErrorMessage } from "@/lib/errorCodes";
import { useSettings, updateAccount, checkAccountSlug } from "@/hooks/useSettings";
import {
    LEGAL_DOCUMENT_HASH,
    LEGAL_VERSION,
    TUTOR_PUBLICATION_TEXT,
} from "@/lib/legal";

type SlugStatus = "idle" | "checking" | "available" | "taken" | "error";

type PublicPageSnapshot = {
    slug: string;
    published: boolean;
    showPublicPackages: boolean;
    tagline: string;
};

function sanitizeSlug(value: string): string {
    return value
        .toLowerCase()
        .replace(/[^a-z0-9-]/g, "-")
        .replace(/-+/g, "-")
        .replace(/^-|-$/g, "");
}

const PublicPage = () => {
    const { user } = useAuth();
    const { data: settings, mutate } = useSettings();

    const [slug, setSlug] = useState("");
    const [tagline, setTagline] = useState("");
    const [published, setPublished] = useState(false);
    const [showPublicPackages, setShowPublicPackages] = useState(true);

    const [slugStatus, setSlugStatus] = useState<SlugStatus>("idle");
    const [slugHint, setSlugHint] = useState("");
    const [slugSuggestion, setSlugSuggestion] = useState("");
    const [slugFocused, setSlugFocused] = useState(false);
    const [slugTyping, setSlugTyping] = useState(false);

    const [saving, setSaving] = useState(false);
    const [saveMsg, setSaveMsg] = useState<string | null>(null);
    const [dirty, setDirty] = useState(false);
    const [publicationConsentAccepted, setPublicationConsentAccepted] = useState(false);

    const hydratedRef = useRef(false);
    const slugRequestIdRef = useRef(0);
    const snapshotRef = useRef<PublicPageSnapshot>({
        slug: "",
        published: false,
        showPublicPackages: true,
        tagline: "",
    });

    useEffect(() => {
        if (!settings) return;

        const nextSnapshot: PublicPageSnapshot = {
            slug: settings.slug || "",
            published: Boolean(settings.published),
            showPublicPackages: settings.showPublicPackages !== false,
            tagline: settings.tagline || "",
        };

        snapshotRef.current = nextSnapshot;
        setSlug(nextSnapshot.slug);
        setPublished(nextSnapshot.published);
        setShowPublicPackages(nextSnapshot.showPublicPackages);
        setTagline(nextSnapshot.tagline);
        setSlugStatus("idle");
        setSlugHint("");
        setSlugSuggestion("");
        setSaveMsg(null);
        setDirty(false);
        setPublicationConsentAccepted(false);
        hydratedRef.current = true;
    }, [settings?.slug, settings?.published, settings?.showPublicPackages, settings?.tagline]);

    useEffect(() => {
        if (!hydratedRef.current) return;
        const snapshot = snapshotRef.current;
        const isDirty =
            snapshot.slug !== slug
            || snapshot.published !== published
            || snapshot.showPublicPackages !== showPublicPackages
            || snapshot.tagline !== tagline;
        setDirty(isDirty);
    }, [slug, published, showPublicPackages, tagline]);

    const requestSlugStatus = useCallback(async (rawSlug: string) => {
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
        if (!hydratedRef.current) return;

        const normalized = sanitizeSlug(slug);
        if (normalized !== slug) {
            setSlug(normalized);
            return;
        }

        const timer = window.setTimeout(() => {
            void requestSlugStatus(normalized).finally(() => {
                setSlugTyping(false);
            });
        }, normalized ? 250 : 0);

        return () => {
            window.clearTimeout(timer);
        };
    }, [slug, requestSlugStatus]);

    const applySuggestedSlug = () => {
        if (!slugSuggestion) return;
        setSlug(slugSuggestion);
        setSlugTyping(false);
        setSaveMsg(null);
    };

    const handleSave = async () => {
        if (saving) return;

        setSaving(true);
        setSaveMsg(null);

        try {
            let normalizedSlug = sanitizeSlug(slug);
            if (normalizedSlug !== slug) {
                setSlug(normalizedSlug);
            }

            if (normalizedSlug || published) {
                const checked = await requestSlugStatus(normalizedSlug);
                if (!checked && published) {
                    setSaveMsg("Не удалось проверить адрес перед публикацией.");
                    return;
                }

                if (published && checked && !checked.isAvailable) {
                    if (checked.suggested) {
                        setSlug(checked.suggested);
                        setSlugSuggestion(checked.suggested);
                    }
                    setSaveMsg("Адрес занят. Выберите свободный адрес и сохраните снова.");
                    return;
                }

                if (!normalizedSlug && checked?.suggested) {
                    normalizedSlug = checked.suggested;
                    setSlug(normalizedSlug);
                }
            }

            if (published && !normalizedSlug) {
                setSaveMsg("Для публикации укажите свободную персональную ссылку.");
                return;
            }

            const needsPublicationConsent =
                !snapshotRef.current.published && published;

            if (needsPublicationConsent && !publicationConsentAccepted) {
                setSaveMsg("Для публикации анкеты подтвердите юридическое согласие.");
                return;
            }

            await updateAccount({
                slug: normalizedSlug,
                published,
                showPublicPackages,
                tagline: tagline.trim(),
                legalVersion: LEGAL_VERSION,
                legalDocumentHash: LEGAL_DOCUMENT_HASH,
                publicationConsentAccepted: needsPublicationConsent ? publicationConsentAccepted : undefined,
                publicationConsentText: needsPublicationConsent
                    ? TUTOR_PUBLICATION_TEXT
                    : undefined,
            });
            await mutate();

            snapshotRef.current = {
                slug: normalizedSlug,
                published,
                showPublicPackages,
                tagline: tagline.trim(),
            };

            setDirty(false);
            setPublicationConsentAccepted(false);
            setSaveMsg("Сохранено");
        } catch (error: any) {
            setSaveMsg(codedErrorMessage("SETT-PUB-SAVE", error));
        } finally {
            setSaving(false);
        }
    };

    const slugHintColor =
        slugStatus === "available"
            ? "var(--g-color-text-positive)"
            : slugStatus === "taken" || slugStatus === "error"
                ? "var(--g-color-text-danger)"
                : "var(--g-color-text-secondary)";

    const slugStatusIcon = slug && !slugTyping && slugStatus !== "checking"
        ? (slugStatus === "available"
            ? CircleCheck
            : slugStatus === "taken" || slugStatus === "error"
                ? Xmark
                : null)
        : null;

    const slugStatusAnimatedIconPath = slug && !slugTyping && slugStatus !== "checking"
        ? (slugStatus === "available"
            ? "/icons/sidebar-animated/user-tick.json"
            : slugStatus === "taken" || slugStatus === "error"
                ? "/icons/sidebar-animated/folder-cross.json"
                : null)
        : null;

    const slugStatusIconColor =
        slugStatus === "available"
            ? "var(--g-color-text-positive)"
            : "var(--g-color-text-danger)";

    const requiresPublicationConsent =
        !snapshotRef.current.published && published;

    return (
        <div className="repeto-settings-stack">
            <Card className="repeto-settings-section-card" view="outlined">
                <div className="repeto-settings-card__header" style={{ padding: "20px 24px", borderBottom: "1px solid var(--g-color-line-generic)" }}>
                    <Text variant="subheader-2">Публичная страница</Text>
                </div>

                <div className="repeto-settings-card__body" style={{ padding: 24 }}>
                    <div className="repeto-settings-public-page-grid">
                        <AppField
                            label="Персональная ссылка"
                            className="repeto-settings-public-slug-field"
                            style={{ gridColumn: "1 / -1" }}
                        >
                            <TextInput
                                size="l"
                                value={slug}
                                onUpdate={(value) => {
                                    setSlug(sanitizeSlug(value));
                                    setSlugTyping(true);
                                    setSlugStatus("checking");
                                    setSlugHint("Проверяем адрес...");
                                    setSlugSuggestion("");
                                    setSaveMsg(null);
                                }}
                                onFocus={() => setSlugFocused(true)}
                                onBlur={() => {
                                    setSlugFocused(false);
                                    setSlugTyping(false);
                                    void requestSlugStatus(slug);
                                }}
                                placeholder="slug"
                                endContent={
                                    slugStatusIcon && slugStatusAnimatedIconPath ? (
                                        <span
                                            style={{
                                                color: slugStatusIconColor,
                                                marginRight: 4,
                                                display: "inline-flex",
                                            }}
                                        >
                                            <AnimatedSidebarIcon
                                                src={slugStatusAnimatedIconPath}
                                                fallbackIcon={slugStatusIcon as IconData}
                                                play
                                                size={14}
                                            />
                                        </span>
                                    ) : null
                                }
                            />
                        </AppField>

                        <AppField
                            label="Подзаголовок"
                            style={{ gridColumn: "1 / -1" }}
                        >
                            <TextInput
                                value={tagline}
                                onUpdate={(value) => {
                                    setTagline(value);
                                    setSaveMsg(null);
                                }}
                                placeholder="Репетитор по математике и физике"
                                size="l"
                            />
                        </AppField>
                    </div>

                    {slugFocused && !!slugHint && (
                        <Text variant="caption-2" className="repeto-settings-public-page-hint" style={{ color: slugHintColor }}>
                            {slugHint}
                        </Text>
                    )}

                    {slugStatus === "taken" && slugSuggestion && (
                        <button
                            className="repeto-settings-public-page-suggestion"
                            onClick={applySuggestedSlug}
                        >
                            Использовать: {slugSuggestion}
                        </button>
                    )}

                    <div className="repeto-settings-switch-row repeto-settings-public-page-switch">
                        <div>
                            <Text variant="body-1" style={{ fontWeight: 600, display: "block" }}>Опубликовать страницу</Text>
                            <Text variant="caption-2" color="secondary" style={{ display: "block", marginTop: 2 }}>
                                Страница станет доступна по персональной ссылке.
                            </Text>
                        </div>
                        <Switch checked={published} onUpdate={setPublished} size="m" />
                    </div>

                    {requiresPublicationConsent && (
                        <div style={{ marginBottom: 14 }}>
                            <Checkbox
                                checked={publicationConsentAccepted}
                                onUpdate={setPublicationConsentAccepted}
                                size="l"
                            >
                                <span style={{ fontSize: 13, color: "var(--g-color-text-secondary)", lineHeight: 1.4 }}>
                                    Даю согласие на <Link href="/legal#tutor-publication-consent" target="_blank">публикацию анкеты и распространение указанных данных</Link>.
                                </span>
                            </Checkbox>
                        </div>
                    )}

                    <div className="repeto-settings-switch-row repeto-settings-public-page-switch">
                        <div>
                            <Text variant="body-1" style={{ fontWeight: 600, display: "block" }}>Пакеты на странице</Text>
                            <Text variant="caption-2" color="secondary" style={{ display: "block", marginTop: 2 }}>
                                Раздел с пакетами будет виден на странице и в записи.
                            </Text>
                        </div>
                        <Switch checked={showPublicPackages} onUpdate={setShowPublicPackages} size="m" />
                    </div>

                    {published && slug && (
                        <Link
                            href={`/t/${slug}`}
                            target="_blank"
                            className="repeto-settings-public-link"
                        >
                            <AnimatedSidebarIcon
                                src="/icons/sidebar-animated/global.json"
                                fallbackIcon={ArrowUpRightFromSquare as IconData}
                                play
                                size={14}
                            />
                            {`repeto.ru/t/${slug}`}
                        </Link>
                    )}

                    <div className="repeto-settings-savebar">
                        {saveMsg && (
                            <Text
                                variant="body-1"
                                className={`repeto-settings-savebar__message${saveMsg === "Сохранено" ? " repeto-settings-savebar__message--ok" : " repeto-settings-savebar__message--error"}`}
                            >
                                {saveMsg}
                            </Text>
                        )}
                        <Button view="action" size="l" onClick={handleSave} disabled={saving || !dirty}>
                            {saving ? "Сохраняем..." : "Сохранить"}
                        </Button>
                    </div>
                </div>
            </Card>
        </div>
    );
};

export default PublicPage;
