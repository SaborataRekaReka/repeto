import * as React from "react";
import { useState } from "react";
import { Avatar, Icon, Text } from "@gravity-ui/uikit";import type { IconData } from "@gravity-ui/uikit";
import {
    ChevronDown,
    CircleInfo,
    Comment,
    Envelope,
    Link as LinkIcon,
    Smartphone,
} from "@gravity-ui/icons";
import type { IconType } from "react-icons";
import { SiMax, SiTelegram, SiVk, SiWhatsapp } from "react-icons/si";

export type PublicTutorWidgetContactKey =
    | "phone"
    | "whatsapp"
    | "email"
    | "vk"
    | "telegram"
    | "max"
    | "website";

export type PublicTutorWidgetContactItem = {
    key: PublicTutorWidgetContactKey;
    title: string;
    value: string;
    href: string;
    external?: boolean;
};

export type PublicTutorWidgetPolicy = {
    freeHours: number;
    freeHoursWord?: string;
    lateActionLabel: string;
    noShowActionLabel?: string;
};

type PublicTutorWidgetProps = {
    name: string;
    avatarUrl?: string | null;
    subjectsText?: string;
    rating?: number | string | null;
    reviewsCount?: number;
    noReviewsLabel?: string;
    contacts?: PublicTutorWidgetContactItem[];
    policy?: PublicTutorWidgetPolicy;
    onOpenReviews?: () => void;
    onOpenPolicy?: () => void;
    className?: string;
    /** When provided, renders a Google-style chevron switcher inside the widget head. */
    switcher?: {
        expanded: boolean;
        onToggle: () => void;
        label?: string;
        panel?: React.ReactNode;
    };
};

const CONTACT_META: Record<PublicTutorWidgetContactKey, { icon?: IconData }> = {
    phone: { icon: Smartphone as IconData },
    email: { icon: Envelope as IconData },
    website: { icon: LinkIcon as IconData },
    whatsapp: {},
    telegram: {},
    vk: {},
    max: {},
};

function renderContactGlyph(key: PublicTutorWidgetContactKey): React.ReactNode {
    const renderBrandIcon = (BrandIcon: IconType) => {
        const CompatibleBrandIcon = BrandIcon as unknown as React.ComponentType<{
            "aria-hidden"?: boolean;
            focusable?: boolean;
            className?: string;
        }>;

        return (
            <CompatibleBrandIcon
                aria-hidden={true}
                focusable={false}
                className="repeto-tp-contact-chip__icon"
            />
        );
    };

    if (key === "whatsapp") {
        return renderBrandIcon(SiWhatsapp);
    }

    if (key === "vk") {
        return renderBrandIcon(SiVk);
    }

    if (key === "telegram") {
        return renderBrandIcon(SiTelegram);
    }

    if (key === "max") {
        return renderBrandIcon(SiMax);
    }

    return null;
}

function getInitials(name: string): string {
    return name
        .split(" ")
        .map((word) => word[0])
        .filter(Boolean)
        .slice(0, 2)
        .join("")
        .toUpperCase();
}

const PublicTutorWidget = ({
    name,
    avatarUrl,
    subjectsText,
    rating,
    reviewsCount = 0,
    noReviewsLabel = "Пока без отзывов",
    contacts = [],
    policy,
    onOpenReviews,
    onOpenPolicy,
    className,
    switcher,
}: PublicTutorWidgetProps) => {
    const normalizedReviewsCount = Number.isFinite(Number(reviewsCount))
        ? Math.max(0, Number(reviewsCount))
        : 0;
    const normalizedRating = Number.isFinite(Number(rating))
        ? Number(rating)
        : null;
    const hasReviews = normalizedReviewsCount > 0;

    const rootClassName = className
        ? `repeto-tp-widget ${className}`
        : "repeto-tp-widget";

    const [avatarLoadError, setAvatarLoadError] = useState(false);
    const showAvatarImg = Boolean(avatarUrl) && !avatarLoadError;

    return (
        <div className={rootClassName}>
            <div className="repeto-tp-widget__head">
                <div className="repeto-tp-widget__avatar">
                    {showAvatarImg ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                            src={avatarUrl as string}
                            alt={name}
                            className="repeto-tp-widget__avatar-img"
                            onError={() => setAvatarLoadError(true)}
                        />
                    ) : (
                        <Avatar
                            text={getInitials(name)}
                            size="xl"
                            theme="brand"
                            style={{ "--g-avatar-size": "80px" } as React.CSSProperties}
                        />
                    )}
                </div>

                <div className="repeto-tp-widget__main">
                    <div className="repeto-tp-widget__name-row">
                        <Text variant="header-2" as="div" className="repeto-tp-widget__name">
                            {name}
                        </Text>
                    </div>

                    {subjectsText ? (
                        <Text variant="body-2" color="secondary" className="repeto-tp-widget__subjects">
                            {subjectsText}
                        </Text>
                    ) : (
                        <Text variant="body-2" color="hint">
                            Предметы пока не указаны
                        </Text>
                    )}

                    <div className="repeto-tp-widget__stats">
                        {hasReviews ? (
                            <button
                                type="button"
                                className="repeto-tp-rating-btn"
                                onClick={onOpenReviews}
                                disabled={!onOpenReviews}
                            >
                                <svg
                                    width="1em"
                                    height="1em"
                                    viewBox="0 0 24 23"
                                    fill="none"
                                    xmlns="http://www.w3.org/2000/svg"
                                    className="repeto-tp-star-single ProfileIndicators_icon__E_7_q"
                                    aria-hidden="true"
                                >
                                    <path
                                        d="M13.039 2.63884C12.8853 2.1965 12.4683 1.9 12 1.9C11.5317 1.9 11.1147 2.1965 10.961 2.63884L8.97872 8.34156L2.94255 8.46457C2.47435 8.47411 2.06351 8.77904 1.9188 9.22442C1.77409 9.6698 1.92722 10.158 2.3004 10.4409L7.11146 14.0884L5.36317 19.8671C5.22756 20.3154 5.39061 20.8003 5.76948 21.0756C6.14834 21.3508 6.65994 21.3561 7.04434 21.0886L12 17.6401L16.9557 21.0886C17.3401 21.3561 17.8517 21.3508 18.2305 21.0756C18.6094 20.8003 18.7724 20.3154 18.6368 19.8671L16.8885 14.0884L21.6996 10.4409C22.0728 10.158 22.2259 9.6698 22.0812 9.22442C21.9365 8.77904 21.5257 8.47411 21.0574 8.46457L15.0213 8.34156L13.039 2.63884Z"
                                        stroke="currentColor"
                                        strokeWidth="2.2"
                                        strokeLinejoin="round"
                                    />
                                </svg>
                                <span className="repeto-tp-rating-number">
                                    {normalizedRating !== null ? normalizedRating.toFixed(1) : "—"}
                                </span>
                                <Icon data={Comment as IconData} size={20} className="repeto-tp-rating-count-icon" />
                                <span className="repeto-tp-rating-count">{normalizedReviewsCount}</span>
                            </button>
                        ) : (
                            <Text variant="body-1" color="secondary">
                                {noReviewsLabel}
                            </Text>
                        )}
                    </div>

                    <div className="repeto-tp-widget__meta-row">
                        <div className="repeto-tp-widget__contacts" aria-label="Контакты">
                            {contacts.map((item) => {
                                const meta = CONTACT_META[item.key];
                                return (
                                    <a
                                        key={item.key}
                                        href={item.href}
                                        target={item.external ? "_blank" : undefined}
                                        rel={item.external ? "noopener noreferrer" : undefined}
                                        className={`repeto-tp-contact-chip repeto-tp-contact-chip--${item.key}`}
                                        title={`${item.title}: ${item.value}`}
                                        aria-label={`${item.title}: ${item.value}`}
                                    >
                                        {meta.icon ? (
                                            <Icon data={meta.icon} size={16} className="repeto-tp-contact-chip__icon" />
                                        ) : (
                                            renderContactGlyph(item.key)
                                        )}
                                    </a>
                                );
                            })}
                        </div>

                        {policy && (
                            <div className="repeto-tp-policy-hint repeto-tp-widget__policy">
                                <button
                                    type="button"
                                    className="repeto-tp-policy-hint__trigger"
                                    onClick={() => {
                                        if (
                                            onOpenPolicy &&
                                            typeof window !== "undefined" &&
                                            window.innerWidth <= 960
                                        ) {
                                            onOpenPolicy();
                                        }
                                    }}
                                    aria-label="Политика отмен"
                                >
                                    <Icon data={CircleInfo as IconData} size={14} />
                                    <Text variant="body-1">Политика отмен</Text>
                                </button>
                                <div className="repeto-tp-policy-hint__tooltip" role="tooltip">
                                    <Text variant="caption-1" className="repeto-tp-policy-hint__tooltip-line">
                                        Бесплатная отмена: {policy.freeHours}{" "}
                                        {policy.freeHoursWord || "часов"}
                                    </Text>
                                    <Text variant="caption-1" className="repeto-tp-policy-hint__tooltip-line">
                                        Поздняя отмена: {policy.lateActionLabel}
                                    </Text>
                                    {policy.noShowActionLabel ? (
                                        <Text variant="caption-1" className="repeto-tp-policy-hint__tooltip-line">
                                            Неявка: {policy.noShowActionLabel}
                                        </Text>
                                    ) : null}
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {switcher && (
                    <button
                        type="button"
                        className={`repeto-tp-widget__switcher${switcher.expanded ? " repeto-tp-widget__switcher--open" : ""}`}
                        onClick={switcher.onToggle}
                        aria-expanded={switcher.expanded}
                        aria-label={switcher.label || "Переключить репетитора"}
                    >
                        <Icon data={ChevronDown as IconData} size={20} />
                    </button>
                )}
            </div>

            {switcher?.expanded && switcher.panel && (
                <div className="repeto-tp-widget__switcher-panel">
                    {switcher.panel}
                </div>
            )}
        </div>
    );
};

export default PublicTutorWidget;
