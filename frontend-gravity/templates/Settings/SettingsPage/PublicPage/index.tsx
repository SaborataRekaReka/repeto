import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Card, Text, Button, Switch, TextInput, Checkbox, Icon } from "@gravity-ui/uikit";
import { ArrowUpRightFromSquare, CircleCheck, Lock } from "@gravity-ui/icons";
import type { IconData } from "@gravity-ui/uikit";
import { useAuth } from "@/contexts/AuthContext";
import AppField from "@/components/AppField";
import PublicTutorWidget, { type PublicTutorWidgetContactItem } from "@/components/PublicTutorWidget";
import { codedErrorMessage } from "@/lib/errorCodes";
import { resolveApiAssetUrl } from "@/lib/api";
import {
    formatCancelPolicyActionLabel,
    formatCancelPolicyHoursWord,
} from "@/lib/cancelPolicy";
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
};

function sanitizeSlug(value: string): string {
    return value
        .toLowerCase()
        .replace(/[^a-z0-9-]/g, "-")
        .replace(/-+/g, "-")
        .replace(/^-|-$/g, "");
}

function getSubjectName(entry: unknown): string {
    if (typeof entry === "string") return entry.trim();
    if (entry && typeof entry === "object" && "name" in entry) {
        return String((entry as { name?: unknown }).name || "").trim();
    }
    return "";
}

function resolveVkLink(value: string): string {
    const trimmed = value.trim();
    if (!trimmed) return "";
    if (/^https?:\/\//i.test(trimmed)) return trimmed;
    const normalized = trimmed
        .replace(/^@/, "")
        .replace(/^https?:\/\/vk\.com\//i, "")
        .replace(/^vk\.com\//i, "");
    return `https://vk.com/${normalized}`;
}

function resolveTelegramLink(value: string): string {
    const trimmed = value.trim();
    if (!trimmed) return "";
    if (/^https?:\/\//i.test(trimmed)) return trimmed;
    const normalized = trimmed
        .replace(/^@/, "")
        .replace(/^https?:\/\/t\.me\//i, "")
        .replace(/^t\.me\//i, "");
    return `https://t.me/${normalized}`;
}

function resolveMaxLink(value: string): string {
    const trimmed = value.trim();
    if (!trimmed) return "";
    if (/^https?:\/\//i.test(trimmed)) return trimmed;
    const normalized = trimmed
        .replace(/^@/, "")
        .replace(/^https?:\/\/max\.ru\//i, "")
        .replace(/^max\.ru\//i, "");
    return `https://max.ru/${normalized}`;
}

function resolveWebsiteLink(value: string): string {
    const trimmed = value.trim();
    if (!trimmed) return "";
    return /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
}

const PublicPage = () => {
    const { user } = useAuth();
    const { data: settings, mutate } = useSettings();

    const [slug, setSlug] = useState("");
    const [published, setPublished] = useState(false);
    const [showPublicPackages, setShowPublicPackages] = useState(true);

    const [slugStatus, setSlugStatus] = useState<SlugStatus>("idle");
    const [slugSuggestion, setSlugSuggestion] = useState("");
    const [slugTyping, setSlugTyping] = useState(false);

    const [saving, setSaving] = useState(false);
    const [saveMsg, setSaveMsg] = useState<string | null>(null);
    const [dirty, setDirty] = useState(false);
    const [publicationConsentAccepted, setPublicationConsentAccepted] = useState(false);
    const [publicationConsentAttention, setPublicationConsentAttention] = useState(false);

    const hydratedRef = useRef(false);
    const slugRequestIdRef = useRef(0);
    const snapshotRef = useRef<PublicPageSnapshot>({
        slug: "",
        published: false,
        showPublicPackages: true,
    });

    useEffect(() => {
        if (!settings) return;

        const nextSnapshot: PublicPageSnapshot = {
            slug: settings.slug || "",
            published: Boolean(settings.published),
            showPublicPackages: settings.showPublicPackages !== false,
        };

        snapshotRef.current = nextSnapshot;
        setSlug(nextSnapshot.slug);
        setPublished(nextSnapshot.published);
        setShowPublicPackages(nextSnapshot.showPublicPackages);
        setSlugStatus("idle");
        setSlugSuggestion("");
        setSaveMsg(null);
        setDirty(false);
        setPublicationConsentAccepted(false);
        setPublicationConsentAttention(false);
        hydratedRef.current = true;
    }, [settings?.slug, settings?.published, settings?.showPublicPackages]);

    useEffect(() => {
        if (!hydratedRef.current) return;
        const snapshot = snapshotRef.current;
        const isDirty =
            snapshot.slug !== slug
            || snapshot.published !== published
            || snapshot.showPublicPackages !== showPublicPackages;
        setDirty(isDirty);
    }, [slug, published, showPublicPackages]);

    const requestSlugStatus = useCallback(async (rawSlug: string) => {
        const normalized = sanitizeSlug(rawSlug);
        if (!normalized) {
            setSlugStatus("idle");
            setSlugSuggestion("");
            setSlugTyping(false);
            return null;
        }

        if (normalized === snapshotRef.current.slug) {
            setSlugStatus("available");
            setSlugSuggestion("");
            setSlugTyping(false);
            return { requested: normalized, isAvailable: true, suggested: "" };
        }

        const requestId = slugRequestIdRef.current + 1;
        slugRequestIdRef.current = requestId;
        setSlugStatus("checking");
        setSlugSuggestion("");

        try {
            const result = await checkAccountSlug({
                value: normalized,
                name: settings?.name || user?.name || "",
            });

            if (requestId !== slugRequestIdRef.current) {
                return null;
            }

            if (result.isAvailable) {
                setSlugStatus("available");
                setSlugSuggestion("");
                return result;
            }

            setSlugStatus("taken");
            setSlugSuggestion(result.suggested || "");
            return result;
        } catch {
            if (requestId !== slugRequestIdRef.current) {
                return null;
            }
            setSlugStatus("error");
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

        if (!normalized) {
            setSlugStatus("idle");
            setSlugSuggestion("");
            setSlugTyping(false);
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

    const handlePublicationConsentUpdate = (checked: boolean) => {
        setPublicationConsentAccepted(checked);
        if (checked) {
            setPublicationConsentAttention(false);
            setSaveMsg(null);
        }
    };

    const handlePublishedToggle = (nextPublished: boolean) => {
        const isTryingToPublish = nextPublished && !published;
        const requiresConsentBeforePublish = !snapshotRef.current.published;

        if (
            isTryingToPublish
            && requiresConsentBeforePublish
            && !publicationConsentAccepted
        ) {
            setPublicationConsentAttention(true);
            setSaveMsg("Сначала подтвердите согласие на публикацию анкеты.");
            return;
        }

        setPublicationConsentAttention(false);
        setPublished(nextPublished);
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

    const normalizedSlug = sanitizeSlug(slug);
    const slugIsCurrent = Boolean(normalizedSlug && normalizedSlug === snapshotRef.current.slug);
    const publicPagePath = normalizedSlug ? `/t/${normalizedSlug}` : "";
    const publicPageLabel = normalizedSlug ? `repeto.ru/t/${normalizedSlug}` : "repeto.ru/t/ваш-адрес";
    const slugIsChecking = slugTyping || slugStatus === "checking";
    const slugFieldError = slugStatus === "taken"
        ? "Этот адрес уже занят. Выберите другой или примените предложенный вариант."
        : slugStatus === "error"
            ? "Не удалось проверить адрес. Попробуйте еще раз."
            : published && !normalizedSlug
                ? "Для публикации нужен свободный адрес страницы."
                : undefined;
    const slugIndicatorTone = slugIsChecking
        ? "checking"
        : !normalizedSlug
            ? "empty"
            : slugStatus === "available" || slugIsCurrent
                ? "available"
                : slugStatus === "taken" || slugStatus === "error"
                    ? "taken"
                    : "neutral";

    const previewName = settings?.name || user?.name || "Репетитор";
    const previewAvatarUrl = resolveApiAssetUrl(settings?.avatarUrl) || user?.avatar || null;
    const previewReviewsCount = Number.isFinite(Number(settings?.reviewsCount))
        ? Math.max(0, Number(settings?.reviewsCount))
        : 0;
    const previewRatingRaw = Number(settings?.rating);
    const previewRating = Number.isFinite(previewRatingRaw)
        ? previewRatingRaw
        : null;
    const subjectSource = Array.isArray(settings?.subjectDetails) && settings.subjectDetails.length > 0
        ? settings.subjectDetails
        : Array.isArray(settings?.subjects) && settings.subjects.length > 0
            ? settings.subjects
            : Array.isArray(user?.subjects)
                ? user?.subjects ?? []
                : [];
    const previewSubjectsText = subjectSource
        .map(getSubjectName)
        .filter(Boolean)
        .join(", ");
    const previewContacts: PublicTutorWidgetContactItem[] = [];
    const previewPhone = String(settings?.phone || user?.phone || "").trim();
    const previewPhoneHref = previewPhone.replace(/[^+\d]/g, "");
    const previewWhatsapp = String(settings?.whatsapp || user?.whatsapp || "").trim();
    const previewWhatsappDigits = previewWhatsapp.replace(/[^\d]/g, "");
    const previewEmail = String(settings?.email || user?.email || "").trim();
    const previewVk = String(settings?.vk || "").trim();
    const previewTelegram = String(settings?.telegram || "").trim();
    const previewMax = String(settings?.max || "").trim();
    const previewWebsite = String(settings?.website || "").trim();

    if (previewPhone && previewPhoneHref) {
        previewContacts.push({ key: "phone", title: "Телефон", value: previewPhone, href: `tel:${previewPhoneHref}` });
    }
    if (previewWhatsapp && previewWhatsappDigits) {
        previewContacts.push({ key: "whatsapp", title: "WhatsApp", value: previewWhatsapp, href: `https://wa.me/${previewWhatsappDigits}`, external: true });
    }
    if (previewEmail) {
        previewContacts.push({ key: "email", title: "Почта", value: previewEmail, href: `mailto:${previewEmail}` });
    }
    if (previewVk) {
        previewContacts.push({ key: "vk", title: "VK", value: previewVk, href: resolveVkLink(previewVk), external: true });
    }
    if (previewTelegram) {
        previewContacts.push({ key: "telegram", title: "Telegram", value: previewTelegram, href: resolveTelegramLink(previewTelegram), external: true });
    }
    if (previewMax) {
        previewContacts.push({ key: "max", title: "Max", value: previewMax, href: resolveMaxLink(previewMax), external: true });
    }
    if (previewWebsite) {
        previewContacts.push({ key: "website", title: "Сайт", value: previewWebsite, href: resolveWebsiteLink(previewWebsite), external: true });
    }

    const policySettings = settings?.cancelPolicySettings || {};
    const freeHours = Number(policySettings.freeHours || 24);
    const lateActionLabel = formatCancelPolicyActionLabel(policySettings.lateCancelAction || policySettings.lateAction).replace(
        "стоимости занятия",
        "стоимости",
    );
    const noShowActionLabel = formatCancelPolicyActionLabel(policySettings.noShowAction).replace(
        "стоимости занятия",
        "стоимости",
    );

    const requiresPublicationConsent =
        !snapshotRef.current.published && published;
    const showPublicationConsent = !snapshotRef.current.published;

    return (
        <div className="repeto-settings-stack">
            <Card className="repeto-settings-section-card" view="outlined">
                <div className="repeto-settings-card__header" style={{ padding: "20px 24px", borderBottom: "1px solid var(--g-color-line-generic)" }}>
                    <Text variant="subheader-2">Публичная страница</Text>
                </div>

                <div className="repeto-settings-card__body" style={{ padding: 24 }}>
                    <div className="repeto-settings-public-layout">
                        <div className="repeto-settings-public-main">
                            <div className="repeto-settings-public-page-grid">
                                <div className="repeto-settings-public-slug-block">
                                    <AppField
                                        label="Персональная ссылка"
                                        className="repeto-settings-public-slug-field"
                                        error={slugFieldError}
                                    >
                                        {published && publicPagePath ? (
                                            <Link
                                                href={publicPagePath}
                                                target="_blank"
                                                className="repeto-settings-public-slug-link-field"
                                            >
                                                <span className="repeto-settings-public-slug-link-field__value">
                                                    <span className="repeto-settings-public-slug-link-field__text">{publicPageLabel}</span>
                                                    <Icon data={ArrowUpRightFromSquare as IconData} size={13} className="repeto-settings-public-slug-link-field__open" />
                                                </span>
                                                <Icon data={Lock as IconData} size={14} className="repeto-settings-public-slug-link-field__lock" />
                                            </Link>
                                        ) : (
                                            <div className="repeto-settings-public-slug-input-wrap">
                                                <TextInput
                                                    className="repeto-settings-public-slug-input repeto-settings-public-slug-input--with-indicator"
                                                    size="l"
                                                    value={slug}
                                                    onUpdate={(value) => {
                                                        const nextSlug = sanitizeSlug(value);
                                                        setSlug(nextSlug);
                                                        setSlugTyping(Boolean(nextSlug));
                                                        setSlugStatus(nextSlug ? "checking" : "idle");
                                                        setSlugSuggestion("");
                                                        setSaveMsg(null);
                                                    }}
                                                    onBlur={() => {
                                                        setSlugTyping(false);
                                                        if (sanitizeSlug(slug)) {
                                                            void requestSlugStatus(slug);
                                                        }
                                                    }}
                                                    placeholder="demo-tutor"
                                                />

                                                {slugIndicatorTone !== "empty" && slugIndicatorTone !== "neutral" && (
                                                    <span
                                                        className={`repeto-settings-public-slug-indicator repeto-settings-public-slug-indicator--${slugIndicatorTone}`}
                                                        aria-hidden="true"
                                                    >
                                                        {slugIndicatorTone === "available" ? (
                                                            <Icon data={CircleCheck as IconData} size={14} />
                                                        ) : slugIndicatorTone === "taken" ? (
                                                            <span className="repeto-settings-public-slug-indicator__ban" />
                                                        ) : (
                                                            <span className="repeto-settings-public-slug-indicator__dot" />
                                                        )}
                                                    </span>
                                                )}
                                            </div>
                                        )}
                                    </AppField>

                                    {!published && (
                                        <div className="repeto-settings-public-slug-meta">
                                            <span className="repeto-settings-public-slug-link repeto-settings-public-slug-link--muted">
                                                {publicPageLabel}
                                            </span>

                                            {slugStatus === "taken" && slugSuggestion && (
                                                <button
                                                    type="button"
                                                    className="repeto-settings-public-page-suggestion"
                                                    onClick={applySuggestedSlug}
                                                >
                                                    Использовать {slugSuggestion}
                                                </button>
                                            )}
                                        </div>
                                    )}
                                </div>

                            </div>

                            <div className="repeto-settings-switch-row repeto-settings-public-page-switch">
                                <div>
                                    <Text variant="body-1" style={{ fontWeight: 600, display: "block" }}>Опубликовать страницу</Text>
                                    <Text variant="caption-2" color="secondary" style={{ display: "block", marginTop: 2 }}>
                                        Страница станет доступна по персональной ссылке.
                                    </Text>
                                </div>
                                <Switch checked={published} onUpdate={handlePublishedToggle} size="m" />
                            </div>

                            {showPublicationConsent && (
                                <div className={`repeto-settings-public-consent${publicationConsentAttention ? " repeto-settings-public-consent--attention" : ""}`}>
                                    <Checkbox
                                        checked={publicationConsentAccepted}
                                        onUpdate={handlePublicationConsentUpdate}
                                        size="l"
                                    >
                                        <span className="repeto-settings-public-consent__text">
                                            Даю согласие на <Link href="/legal#tutor-publication-consent" target="_blank">публикацию анкеты и распространение указанных данных</Link>.
                                        </span>
                                    </Checkbox>
                                    <Text variant="caption-2" color="secondary" className="repeto-settings-public-consent__note">
                                        Подтверждение требуется один раз перед первой публикацией.
                                    </Text>
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

                        <aside className="repeto-settings-public-preview" aria-label="Превью публичной страницы">
                            <div className="repeto-settings-public-preview__head">
                                <div>
                                    <Text variant="subheader-1" as="div">Превью страницы</Text>
                                    <Text variant="caption-2" color="secondary">Так ученики увидят верхний блок профиля.</Text>
                                </div>
                                <span className={`repeto-settings-public-publish-badge${published ? " repeto-settings-public-publish-badge--on" : ""}`}>
                                    {published ? "Опубликована" : "Черновик"}
                                </span>
                            </div>

                            <PublicTutorWidget
                                className="repeto-settings-public-widget-preview"
                                name={previewName}
                                avatarUrl={previewAvatarUrl || undefined}
                                subjectsText={previewSubjectsText || undefined}
                                rating={previewReviewsCount > 0 ? previewRating : null}
                                reviewsCount={previewReviewsCount}
                                contacts={previewContacts}
                                policy={{
                                    freeHours,
                                    freeHoursWord: formatCancelPolicyHoursWord(freeHours),
                                    lateActionLabel,
                                    noShowActionLabel,
                                }}
                            />
                        </aside>
                    </div>
                </div>
            </Card>
        </div>
    );
};

export default PublicPage;
