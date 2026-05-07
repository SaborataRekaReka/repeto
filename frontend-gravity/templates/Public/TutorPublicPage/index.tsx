import { useState, useEffect, type CSSProperties } from "react";
import { useRouter } from "next/router";
import Head from "next/head";
import Link from "next/link";
import { Text, Button, Icon, Loader } from "@gravity-ui/uikit";
import type { IconData } from "@gravity-ui/uikit";
import {
    Pencil,
    GraduationCap,
    FileCheck,
    ShieldCheck,
    CircleInfo,
    Receipt,
    ChevronLeft,
    ChevronRight,
} from "@gravity-ui/icons";
import AppDialog from "@/components/AppDialog";
import CancelPolicyBlock from "@/components/CancelPolicyBlock";
import AnimatedSidebarIcon from "@/components/AnimatedSidebarIcon";
import { PublicPageFooter, PublicPageHeader } from "../PublicPageChrome";
import StudentHeaderRight from "../StudentHeaderRight";
import PublicTutorWidget, {
    type PublicTutorWidgetContactItem,
} from "@/components/PublicTutorWidget";
import {
    formatCancelPolicyActionLabel,
    formatCancelPolicyHoursWord,
} from "@/lib/cancelPolicy";
import { resolveApiAssetUrl } from "@/lib/api";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "/api";

type TutorReview = {
    studentName: string;
    rating: number;
    feedback: string | null;
    tags?: string[];
    date: string;
};

type ReviewTagSummary = {
    label: string;
    count: number;
};

type PublicPackage = {
    id: string;
    subject: string;
    lessonsTotal: number;
    totalPrice: number;
    pricePerLesson: number;
    originalTotalPrice?: number | null;
    discountAmount?: number;
    discountPercent?: number;
    validUntil?: string | null;
    comment?: string | null;
};

type EducationEntry = {
    id: string;
    institution: string;
    program?: string;
    years?: string;
    verified?: boolean;
    verificationLabel?: string | null;
};

type CertificateEntry = {
    id: string;
    title: string;
    fileUrl: string;
    uploadedAt: string;
    verified?: boolean;
    verificationLabel?: string | null;
};

type ExperienceLineEntry = {
    id: string;
    text: string;
    verified?: boolean;
    verificationLabel?: string | null;
};

type TutorProfile = {
    name: string;
    subjects: (string | { name: string; duration?: number; price?: number })[];
    aboutText: string | null;
    avatarUrl: string | null;
    lessonsCount: number;
    rating: number | null;
    reviewsCount: number;
    reviews: TutorReview[];
    reviewTags?: ReviewTagSummary[];
    contacts: {
        phone: string | null;
        whatsapp: string | null;
        email?: string | null;
        vk?: string | null;
        telegram?: string | null;
        max?: string | null;
        website?: string | null;
    };
    cancelPolicy?: {
        freeHours?: number;
        lateCancelAction?: string;
        lateAction?: string;
        noShowAction?: string;
    };
    preferredPaymentMethod?: string;
    memberSince: string;
    hasWorkingDays?: boolean;
    showPublicPackages?: boolean;
    publicPackages?: PublicPackage[];
    education?: EducationEntry[] | null;
    experience?: string | null;
    experienceLines?: ExperienceLineEntry[] | null;
    qualificationVerified?: boolean;
    qualificationLabel?: string | null;
    certificates?: CertificateEntry[] | null;
};

function getSubjectName(s: string | { name: string; duration?: number; price?: number }): string {
    return typeof s === "string" ? s : s.name;
}

function formatReviewDate(raw: string): string {
    const d = new Date(raw);
    if (isNaN(d.getTime())) return "";
    const months = [
        "января", "февраля", "марта", "апреля", "мая", "июня",
        "июля", "августа", "сентября", "октября", "ноября", "декабря",
    ];
    return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
}

function formatCountWord(count: number, one: string, few: string, many: string): string {
    const mod10 = count % 10;
    const mod100 = count % 100;
    if (mod10 === 1 && mod100 !== 11) return one;
    if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return few;
    return many;
}

function formatPublicPackageDate(raw?: string | null): string {
    if (!raw) return "";
    const d = new Date(raw);
    if (isNaN(d.getTime())) return "";
    return d.toLocaleDateString("ru-RU", {
        day: "2-digit",
        month: "short",
        year: "numeric",
    });
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

function renderStars(rating: number) {
    return (
        <span className="repeto-tp-stars">
            {[1, 2, 3, 4, 5].map((n) => (
                <span key={n} className={n <= rating ? "repeto-tp-star--filled" : "repeto-tp-star--empty"}>★</span>
            ))}
        </span>
    );
}

function formatYearsOnPlatform(memberSince: string): string {
    const start = new Date(memberSince);
    const now = new Date();
    const months = (now.getFullYear() - start.getFullYear()) * 12 + (now.getMonth() - start.getMonth());
    if (months < 1) return "Недавно на платформе";
    if (months < 12) {
        const m = months;
        const word = m === 1 ? "месяц" : m < 5 ? "месяца" : "месяцев";
        return `${m} ${word} на платформе`;
    }
    const years = Math.floor(months / 12);
    const word = years === 1 ? "год" : years < 5 ? "года" : "лет";
    return `${years} ${word} на платформе`;
}

function isPdfUrl(value?: string | null): boolean {
    const normalized = String(value || "").split("?")[0].toLowerCase();
    return normalized.endsWith(".pdf");
}

function formatCertificateDate(raw?: string): string {
    if (!raw) return "";
    const d = new Date(raw);
    if (isNaN(d.getTime())) return "";
    return d.toLocaleDateString("ru-RU", {
        day: "2-digit",
        month: "short",
        year: "numeric",
    });
}

const DEFAULT_VERIFICATION_LABEL = "Верифицирован";

function VerificationIcon({ label, className }: { label: string; className?: string }) {
    const classes = className
        ? `repeto-tp-verified-icon ${className}`
        : "repeto-tp-verified-icon";

    return (
        <span className={classes} title={label} aria-label={label}>
            <Icon data={ShieldCheck as IconData} size={14} />
        </span>
    );
}

type SidebarSection = {
    id: string;
    label: string;
    animatedIconPath: string;
    fallbackIcon: IconData;
};

const TutorPublicPage = () => {
    const router = useRouter();
    const slug = router.query.slug as string | undefined;
    const [profile, setProfile] = useState<TutorProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const [notFound, setNotFound] = useState(false);
    const [isOwner, setIsOwner] = useState(false);
    const [certPreviewIndex, setCertPreviewIndex] = useState<number | null>(null);
    const [policyPopupOpen, setPolicyPopupOpen] = useState(false);
    const [activeSection, setActiveSection] = useState<string>("about");
    const [hoveredSidebarSection, setHoveredSidebarSection] = useState<string | null>(null);
    const [reviewCarouselIndex, setReviewCarouselIndex] = useState(0);
    const [reviewCardsPerPage, setReviewCardsPerPage] = useState(3);

    useEffect(() => {
        if (!slug) return;
        setLoading(true);
        fetch(`${API_BASE}/public/tutors/${encodeURIComponent(slug)}`)
            .then((res) => {
                if (res.status === 404) {
                    setNotFound(true);
                    setLoading(false);
                    return null;
                }
                if (!res.ok) throw new Error("Failed to fetch");
                return res.json();
            })
            .then((data) => {
                if (data) setProfile(data);
                setLoading(false);
            })
            .catch(() => {
                setNotFound(true);
                setLoading(false);
            });
    }, [slug]);

    useEffect(() => {
        if (!slug) return;
        fetch(`${API_BASE}/auth/refresh`, {
            method: "POST",
            credentials: "include",
        })
            .then((res) => (res.ok ? res.json() : null))
            .then((data) => {
                if (!data?.accessToken) return;
                return fetch(`${API_BASE}/auth/me`, {
                    headers: { Authorization: `Bearer ${data.accessToken}` },
                }).then((res) => (res.ok ? res.json() : null));
            })
            .then((me) => {
                if (me?.slug === slug) setIsOwner(true);
            })
            .catch(() => {});
    }, [slug]);

    useEffect(() => {
        if (!profile) return;
        const ids = ["about", "education", "experience", "certificates", "subjects", "packages", "reviews"];
        const observers: IntersectionObserver[] = [];
        const visible = new Map<string, number>();
        ids.forEach((id) => {
            const el = document.getElementById(id);
            if (!el) return;
            const obs = new IntersectionObserver(
                (entries) => {
                    entries.forEach((e) => {
                        if (e.isIntersecting) visible.set(id, e.intersectionRatio);
                        else visible.delete(id);
                    });
                    let best: string | null = null;
                    let bestRatio = 0;
                    visible.forEach((ratio, key) => {
                        if (ratio > bestRatio) {
                            bestRatio = ratio;
                            best = key;
                        }
                    });
                    if (best) setActiveSection(best);
                },
                { rootMargin: "-80px 0px -60% 0px", threshold: [0, 0.25, 0.5, 0.75, 1] }
            );
            obs.observe(el);
            observers.push(obs);
        });
        return () => observers.forEach((o) => o.disconnect());
    }, [profile]);

    useEffect(() => {
        const updateCardsPerPage = () => {
            if (typeof window === "undefined") return;
            if (window.innerWidth < 680) {
                setReviewCardsPerPage(1);
            } else if (window.innerWidth < 1080) {
                setReviewCardsPerPage(2);
            } else {
                setReviewCardsPerPage(3);
            }
        };

        updateCardsPerPage();
        window.addEventListener("resize", updateCardsPerPage);
        return () => window.removeEventListener("resize", updateCardsPerPage);
    }, []);

    useEffect(() => {
        const reviewsLength = profile?.reviews?.length || 0;
        const maxIndex = Math.max(0, reviewsLength - reviewCardsPerPage);
        setReviewCarouselIndex((prev) => Math.min(prev, maxIndex));
    }, [profile?.reviews?.length, reviewCardsPerPage]);

    if (loading) {
        return (
            <div className="repeto-portal-page repeto-tp-page">
                <div className="repeto-tp-loading">
                    <Loader size="m" />
                </div>
            </div>
        );
    }

    if (notFound || !profile) {
        return (
            <div className="repeto-portal-page repeto-tp-page">
                <div className="repeto-tp-loading">
                    <Text variant="header-2" className="repeto-public-state__title">Репетитор не найден</Text>
                    <Text variant="body-2" color="secondary">Страница не существует или была удалена</Text>
                </div>
            </div>
        );
    }

    const t = profile;
    const publicPackages = t.publicPackages || [];
    const showPublicPackages = t.showPublicPackages !== false;
    const canBook = t.hasWorkingDays !== false;
    const educationList = Array.isArray(t.education) ? t.education.filter((e) => e.institution?.trim()) : [];
    const certsList = Array.isArray(t.certificates) ? t.certificates : [];
    const experienceList = Array.isArray(t.experienceLines) && t.experienceLines.length > 0
        ? t.experienceLines.filter((item) => item.text?.trim())
        : String(t.experience || "")
            .split(/\r?\n/)
            .map((line, index) => ({
                id: `exp-fallback-${index}`,
                text: line.trim(),
                verified: false,
            }))
            .filter((item) => item.text.length > 0);
    const certGalleryItems = certsList.map((cert) => {
        const resolvedUrl = resolveApiAssetUrl(cert.fileUrl) || cert.fileUrl;
        const verified = !!cert.verified;

        return {
            ...cert,
            fileUrl: resolvedUrl,
            verified,
            isPdf: isPdfUrl(resolvedUrl),
            uploadedLabel: formatCertificateDate(cert.uploadedAt),
        };
    });
    const activeCertificate =
        certPreviewIndex !== null ? certGalleryItems[certPreviewIndex] || null : null;
    const hasExperience = experienceList.length > 0;

    const normalizedPhone = (t.contacts.phone || "").replace(/[^+\d]/g, "");
    const freeHours = t.cancelPolicy?.freeHours ?? 24;
    const lateActionValue = t.cancelPolicy?.lateCancelAction || t.cancelPolicy?.lateAction;
    const lateActionLabel = formatCancelPolicyActionLabel(lateActionValue).replace(
        "стоимости занятия",
        "стоимости"
    );
    const noShowActionLabel = formatCancelPolicyActionLabel(t.cancelPolicy?.noShowAction).replace(
        "стоимости занятия",
        "стоимости"
    );
    const policySummaryText = `Бесплатная отмена за ${freeHours} ${formatCancelPolicyHoursWord(freeHours)} до начала. Поздняя отмена: ${lateActionLabel}. Неявка: ${noShowActionLabel}.`;

    const contactItems: PublicTutorWidgetContactItem[] = [];

    if (t.contacts.phone && normalizedPhone) {
        contactItems.push({
            key: "phone",
            title: "Телефон",
            value: t.contacts.phone,
            href: `tel:${normalizedPhone}`,
        });
    }

    if (t.contacts.whatsapp) {
        const waDigits = t.contacts.whatsapp.replace(/[^\d]/g, "");
        if (waDigits) {
            contactItems.push({
                key: "whatsapp",
                title: "WhatsApp",
                value: t.contacts.whatsapp,
                href: `https://wa.me/${waDigits}`,
                external: true,
            });
        }
    }

    if (t.contacts.email) {
        contactItems.push({
            key: "email",
            title: "Почта",
            value: t.contacts.email,
            href: `mailto:${t.contacts.email}`,
        });
    }

    if (t.contacts.vk) {
        const vkHref = resolveVkLink(t.contacts.vk);
        if (vkHref) {
            contactItems.push({
                key: "vk",
                title: "VK",
                value: t.contacts.vk,
                href: vkHref,
                external: true,
            });
        }
    }

    if (t.contacts.telegram) {
        const telegramHref = resolveTelegramLink(t.contacts.telegram);
        if (telegramHref) {
            contactItems.push({
                key: "telegram",
                title: "Telegram",
                value: t.contacts.telegram,
                href: telegramHref,
                external: true,
            });
        }
    }

    if (t.contacts.max) {
        const maxHref = resolveMaxLink(t.contacts.max);
        if (maxHref) {
            contactItems.push({
                key: "max",
                title: "Max",
                value: t.contacts.max,
                href: maxHref,
                external: true,
            });
        }
    }

    if (t.contacts.website) {
        const websiteHref = /^https?:\/\//i.test(t.contacts.website)
            ? t.contacts.website
            : `https://${t.contacts.website}`;
        contactItems.push({
            key: "website",
            title: "Сайт",
            value: t.contacts.website,
            href: websiteHref,
            external: true,
        });
    }

    // Build sidebar sections dynamically
    const sidebarSections: SidebarSection[] = [
        {
            id: "about",
            label: "О специалисте",
            animatedIconPath: "/icons/tutor-sidebar-animated/about.json",
            fallbackIcon: CircleInfo as IconData,
        },
    ];
    if (educationList.length > 0) {
        sidebarSections.push({
            id: "education",
            label: "Образование",
            animatedIconPath: "/icons/tutor-sidebar-animated/education.json",
            fallbackIcon: GraduationCap as IconData,
        });
    }
    if (hasExperience) {
        sidebarSections.push({
            id: "experience",
            label: "Опыт",
            animatedIconPath: "/icons/tutor-sidebar-animated/experience.json",
            fallbackIcon: Pencil as IconData,
        });
    }
    if (certsList.length > 0) {
        sidebarSections.push({
            id: "certificates",
            label: "Документы",
            animatedIconPath: "/icons/tutor-sidebar-animated/certificates.json",
            fallbackIcon: FileCheck as IconData,
        });
    }
    sidebarSections.push({
        id: "subjects",
        label: "Предметы и цены",
        animatedIconPath: "/icons/tutor-sidebar-animated/subjects.json",
        fallbackIcon: GraduationCap as IconData,
    });
    if (showPublicPackages && publicPackages.length > 0) {
        sidebarSections.push({
            id: "packages",
            label: "Пакеты",
            animatedIconPath: "/icons/tutor-sidebar-animated/packages.json",
            fallbackIcon: Receipt as IconData,
        });
    }
    if (t.reviews && t.reviews.length > 0) {
        sidebarSections.push({
            id: "reviews",
            label: "Отзывы",
            animatedIconPath: "/icons/tutor-sidebar-animated/reviews.json",
            fallbackIcon: Pencil as IconData,
        });
    }

    const allReviews = t.reviews || [];
    const reviewsCount = Math.max(Number(t.reviewsCount || 0), allReviews.length);
    const maxReviewCarouselIndex = Math.max(0, allReviews.length - reviewCardsPerPage);
    const visibleReviews = allReviews.slice(
        reviewCarouselIndex,
        reviewCarouselIndex + reviewCardsPerPage,
    );
    const reviewCarouselStyle = {
        "--repeto-review-card-count": reviewCardsPerPage,
    } as CSSProperties;
    const canShowReviewArrows = allReviews.length > reviewCardsPerPage;
    const reviewTags = (t.reviewTags || []).slice(0, 3);
    const ratingLabel = Number.isFinite(Number(t.rating))
        ? Number(t.rating).toFixed(1).replace(".", ",")
        : "—";
    const reviewsCountLabel = `${reviewsCount} ${formatCountWord(reviewsCount, "оценка", "оценки", "оценок")}`;
    const scrollToReviews = () => {
        setActiveSection("reviews");
        if (typeof document !== "undefined") {
            document.getElementById("reviews")?.scrollIntoView({ behavior: "smooth", block: "start" });
        }
    };

    return (
        <>
            <Head>
                <title>{`${t.name} — Repeto`}</title>
                <meta name="description" content={t.aboutText ? t.aboutText.slice(0, 160) : t.name} />
                <meta property="og:title" content={`${t.name} — Repeto`} />
                <meta property="og:description" content={t.subjects.map(getSubjectName).join(", ")} />
                <meta property="og:type" content="profile" />
            </Head>

            <div className="repeto-portal-page repeto-tp-page">
                <PublicPageHeader
                    containerClassName="repeto-tp-container"
                    rightContent={<StudentHeaderRight />}
                />

                <div className="repeto-tp-container repeto-portal-main">
                    {/* ── Two-column layout: sidebar + content ── */}
                    <div className="repeto-tp-layout">
                        {/* Sidebar */}
                        <aside className="repeto-tp-sidebar">
                            <h2 className="repeto-tp-sidebar__title">Профиль</h2>

                            <nav className="repeto-tp-sidebar__nav page-overlay__nav page-overlay__nav--section">
                                {sidebarSections.map((sec) => {
                                    const isActive = activeSection === sec.id;
                                    const playIcon = isActive || hoveredSidebarSection === sec.id;

                                    return (
                                        <a
                                            key={sec.id}
                                            href={`#${sec.id}`}
                                            onClick={() => setActiveSection(sec.id)}
                                            onMouseEnter={() => setHoveredSidebarSection(sec.id)}
                                            onMouseLeave={() =>
                                                setHoveredSidebarSection((prev) => (prev === sec.id ? null : prev))
                                            }
                                            onFocus={() => setHoveredSidebarSection(sec.id)}
                                            onBlur={() =>
                                                setHoveredSidebarSection((prev) => (prev === sec.id ? null : prev))
                                            }
                                            className={`repeto-tp-sidebar__item page-overlay__nav-item page-overlay__nav-item--section${isActive ? " repeto-tp-sidebar__item--active page-overlay__nav-item--active" : ""}`}
                                        >
                                            <span className="repeto-tp-sidebar__item-icon repeto-tp-sidebar__item-icon--animated" aria-hidden="true">
                                                <AnimatedSidebarIcon
                                                    src={sec.animatedIconPath}
                                                    play={playIcon}
                                                    fallbackIcon={sec.fallbackIcon}
                                                    size={24}
                                                />
                                            </span>
                                            <span className="repeto-tp-sidebar__item-text">{sec.label}</span>
                                        </a>
                                    );
                                })}
                            </nav>
                            {canBook && (
                                <Link href={`/t/${slug}/book`} className="repeto-tp-sidebar__cta-link">
                                    <Button view="action" size="l" className="repeto-tp-sidebar__cta">
                                        Записаться
                                    </Button>
                                </Link>
                            )}
                        </aside>

                        {/* Main content */}
                        <div className="repeto-tp-content">
                            <PublicTutorWidget
                                className="repeto-portal-section--spaced"
                                name={t.name}
                                avatarUrl={t.avatarUrl || undefined}
                                subjectsText={
                                    t.subjects.length > 0
                                        ? t.subjects.map(getSubjectName).join(", ")
                                        : undefined
                                }
                                rating={t.rating}
                                reviewsCount={t.reviewsCount}
                                onOpenReviews={reviewsCount > 0 ? scrollToReviews : undefined}
                                policy={{
                                    freeHours,
                                    freeHoursWord: formatCancelPolicyHoursWord(freeHours),
                                    lateActionLabel,
                                    noShowActionLabel,
                                }}
                                onOpenPolicy={() => setPolicyPopupOpen(true)}
                                contacts={contactItems}
                            />

                    <div id="about" className="repeto-tp-section">
                        <Text variant="subheader-2" as="div" className="repeto-portal-plain-section-title">
                            О репетиторе
                        </Text>
                        <div className="repeto-tp-section__body">
                            {t.aboutText ? (
                                <Text variant="body-2" className="repeto-tp-copy">{t.aboutText}</Text>
                            ) : (
                                <Text variant="body-2" color="secondary">
                                    Репетитор пока не добавил описание
                                </Text>
                            )}
                        </div>
                    </div>

                    {educationList.length > 0 && (
                        <div id="education" className="repeto-tp-section">
                            <Text variant="subheader-2" as="div" className="repeto-portal-plain-section-title">
                                Образование
                            </Text>
                            <div className="repeto-tp-section__body">
                                <div className="repeto-tp-edu-list">
                                    {educationList.map((edu, i) => {
                                        const educationVerified = !!edu.verified;

                                        return (
                                            <div key={edu.id || i} className="repeto-tp-edu-item">
                                                <span className="repeto-tp-edu-item__icon">
                                                    <Icon data={GraduationCap as IconData} size={16} />
                                                </span>
                                                <div className="repeto-tp-edu-item__text">
                                                    <div className="repeto-tp-edu-item__head">
                                                        <Text variant="body-2" className="repeto-tp-item-title">{edu.institution}</Text>
                                                        {educationVerified && (
                                                            <VerificationIcon label={DEFAULT_VERIFICATION_LABEL} />
                                                        )}
                                                    </div>
                                                    {edu.program && <Text variant="body-1" color="secondary">{edu.program}</Text>}
                                                    {edu.years && <Text variant="caption-2" color="secondary">{edu.years}</Text>}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    )}

                    {hasExperience && (
                        <div id="experience" className="repeto-tp-section">
                            <Text variant="subheader-2" as="div" className="repeto-portal-plain-section-title">
                                Опыт
                            </Text>
                            <div className="repeto-tp-section__body">
                                <div className="repeto-tp-experience-list">
                                    {experienceList.map((line) => (
                                        <div key={line.id} className="repeto-tp-experience-item">
                                            <Text variant="body-2" className="repeto-tp-copy">{line.text}</Text>
                                            {line.verified && (
                                                <VerificationIcon label={DEFAULT_VERIFICATION_LABEL} />
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {certsList.length > 0 && (
                        <div id="certificates" className="repeto-tp-section">
                            <Text variant="subheader-2" as="div" className="repeto-portal-plain-section-title">
                                Документы и сертификаты
                            </Text>
                            <div className="repeto-tp-section__body">
                                <div className="repeto-tp-certs-grid">
                                    {certGalleryItems.map((cert, index) => (
                                        <button
                                            key={cert.id}
                                            type="button"
                                            className="repeto-tp-cert-thumb"
                                            onClick={() => {
                                                if (cert.isPdf) {
                                                    window.open(cert.fileUrl, "_blank", "noopener,noreferrer");
                                                    return;
                                                }
                                                setCertPreviewIndex(index);
                                            }}
                                        >
                                            {cert.isPdf ? (
                                                <div className="repeto-tp-cert-thumb__pdf">
                                                    <Icon data={FileCheck as IconData} size={24} />
                                                    <Text variant="caption-2">PDF</Text>
                                                </div>
                                            ) : (
                                                <img src={cert.fileUrl} alt={cert.title} className="repeto-tp-cert-thumb__img" />
                                            )}
                                            {cert.verified && (
                                                <VerificationIcon
                                                    label={DEFAULT_VERIFICATION_LABEL}
                                                    className="repeto-tp-cert-thumb__verified"
                                                />
                                            )}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    <div id="subjects" className="repeto-tp-section">
                        <Text variant="subheader-2" as="div" className="repeto-portal-plain-section-title">
                            Предметы и цены
                        </Text>
                        <div className="repeto-tp-section__body">
                            {t.subjects.length > 0 ? (
                                <div className="repeto-tp-item-list">
                                    {t.subjects.map((subject, i) => {
                                        const name = typeof subject === "string" ? subject : subject.name;
                                        const duration = typeof subject !== "string" ? subject.duration : undefined;
                                        const price = typeof subject !== "string" ? subject.price : undefined;
                                        return (
                                            <div key={i} className="repeto-tp-item-row">
                                                <div className="repeto-tp-item-row__left">
                                                    <span className="repeto-tp-item-icon">
                                                        <Icon data={GraduationCap as IconData} size={16} />
                                                    </span>
                                                    <div>
                                                        <Text variant="body-2" className="repeto-tp-item-title">{name}</Text>
                                                        {duration ? (
                                                            <Text variant="body-1" color="secondary"> · {duration} мин</Text>
                                                        ) : null}
                                                    </div>
                                                </div>
                                                {price ? (
                                                    <Text variant="body-2" className="repeto-tp-item-price">
                                                        {price.toLocaleString("ru-RU")} ₽
                                                    </Text>
                                                ) : null}
                                            </div>
                                        );
                                    })}
                                </div>
                            ) : (
                                <Text variant="body-2" color="secondary">
                                    Репетитор пока не добавил ни одного предмета
                                </Text>
                            )}
                        </div>
                    </div>

                    {showPublicPackages && publicPackages.length > 0 && (
                        <div id="packages" className="repeto-tp-section">
                            <Text variant="subheader-2" as="div" className="repeto-portal-plain-section-title">
                                Пакеты занятий
                            </Text>
                            <div className="repeto-tp-section__body repeto-tp-section__body--packages">
                                <div className="repeto-tp-packages-grid">
                                    {publicPackages.map((pkg) => {
                                        const validUntilLabel = formatPublicPackageDate(pkg.validUntil);

                                        return (
                                            <article key={pkg.id} className="repeto-tp-package-card">
                                                <div className="repeto-tp-package-card__head">
                                                    <div>
                                                        <Text variant="body-2" as="div" className="repeto-tp-package-card__subject">
                                                            {pkg.subject}
                                                        </Text>
                                                        <Text variant="body-1" color="secondary" as="div" className="repeto-tp-package-card__meta">
                                                            {pkg.lessonsTotal} {formatCountWord(pkg.lessonsTotal, "занятие", "занятия", "занятий")}
                                                        </Text>
                                                    </div>
                                                    {pkg.discountPercent ? (
                                                        <span className="repeto-tp-package-card__badge">
                                                            −{pkg.discountPercent}%
                                                        </span>
                                                    ) : null}
                                                </div>

                                                <div className="repeto-tp-package-card__price-row">
                                                    <Text variant="header-1" as="div" className="repeto-tp-package-card__total">
                                                        {pkg.totalPrice.toLocaleString("ru-RU")} ₽
                                                    </Text>
                                                    {pkg.originalTotalPrice ? (
                                                        <span className="repeto-tp-package-card__old-price">
                                                            {pkg.originalTotalPrice.toLocaleString("ru-RU")} ₽
                                                        </span>
                                                    ) : null}
                                                </div>

                                                <Text variant="body-1" color="secondary" as="div" className="repeto-tp-package-card__per-lesson">
                                                    {pkg.pricePerLesson.toLocaleString("ru-RU")} ₽ за занятие
                                                </Text>

                                                {pkg.comment || validUntilLabel ? (
                                                    <div className="repeto-tp-package-card__footer">
                                                        {pkg.comment ? (
                                                            <Text variant="caption-1" color="secondary" as="span">
                                                                {pkg.comment}
                                                            </Text>
                                                        ) : null}
                                                        {validUntilLabel ? (
                                                            <Text variant="caption-1" color="secondary" as="span">
                                                                до {validUntilLabel}
                                                            </Text>
                                                        ) : null}
                                                    </div>
                                                ) : null}
                                            </article>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    )}

                    {t.reviews && t.reviews.length > 0 && (
                        <div id="reviews" className="repeto-tp-section">
                            <Text variant="subheader-2" as="div" className="repeto-portal-plain-section-title">
                                Отзывы
                            </Text>
                            <div className="repeto-tp-reviews-market">
                                <div className="repeto-tp-reviews-market__top">
                                    <div className="repeto-tp-reviews-market__hero">
                                        <div className="repeto-tp-market-score" aria-label={`Средняя оценка ${ratingLabel}`}>
                                            <span className="repeto-tp-market-score__value">{ratingLabel}</span>
                                        </div>
                                        <div className="repeto-tp-market-summary">
                                            <Text variant="body-2" as="div" className="repeto-tp-market-summary__title">
                                                Выбор учеников
                                            </Text>
                                            <Text variant="body-1" color="secondary" as="div">
                                                {reviewsCountLabel}
                                            </Text>
                                        </div>
                                        {reviewTags.map((tag) => (
                                            <span key={tag.label} className="repeto-tp-market-chip">
                                                {tag.label}
                                            </span>
                                        ))}
                                    </div>

                                    {canShowReviewArrows && (
                                        <div className="repeto-tp-review-carousel__actions">
                                            <Button
                                                view="outlined"
                                                size="m"
                                                className="repeto-tp-review-carousel__arrow"
                                                disabled={reviewCarouselIndex === 0}
                                                onClick={() => setReviewCarouselIndex((prev) => Math.max(0, prev - 1))}
                                                aria-label="Предыдущие отзывы"
                                            >
                                                <Icon data={ChevronLeft as IconData} size={16} />
                                            </Button>
                                            <Button
                                                view="outlined"
                                                size="m"
                                                className="repeto-tp-review-carousel__arrow"
                                                disabled={reviewCarouselIndex >= maxReviewCarouselIndex}
                                                onClick={() =>
                                                    setReviewCarouselIndex((prev) =>
                                                        Math.min(maxReviewCarouselIndex, prev + 1)
                                                    )
                                                }
                                                aria-label="Следующие отзывы"
                                            >
                                                <Icon data={ChevronRight as IconData} size={16} />
                                            </Button>
                                        </div>
                                    )}
                                </div>

                                <div className="repeto-tp-review-carousel" style={reviewCarouselStyle}>
                                    {visibleReviews.map((r, i) => (
                                        <article key={`${r.studentName}-${r.date}-${reviewCarouselIndex + i}`} className="repeto-tp-review-card">
                                            <div className="repeto-tp-review-card__head">
                                                <div className="repeto-tp-review-card__author">
                                                    <Text variant="body-2" as="div" className="repeto-tp-reviewer">
                                                        {r.studentName}
                                                    </Text>
                                                    <Text variant="caption-2" color="secondary" as="div">
                                                        {formatReviewDate(r.date)}
                                                    </Text>
                                                </div>
                                                {renderStars(r.rating)}
                                            </div>
                                            {r.feedback ? (
                                                <Text variant="body-2" className="repeto-tp-review-text">
                                                    {r.feedback}
                                                </Text>
                                            ) : (
                                                <Text variant="body-2" color="secondary" className="repeto-tp-review-text">
                                                    Оценка без текстового комментария
                                                </Text>
                                            )}
                                        </article>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="repeto-tp-cta repeto-tp-cta--mobile">
                        {canBook ? (
                            <Link href={`/t/${slug}/book`} className="repeto-tp-cta-link">
                                <Button view="action" size="xl" className="repeto-tp-cta-btn">
                                    Записаться на занятие
                                </Button>
                            </Link>
                        ) : (
                            <Button view="action" size="xl" className="repeto-tp-cta-btn" disabled>
                                Запись пока не ведётся
                            </Button>
                        )}
                    </div>

                        </div>{/* end .repeto-tp-content */}
                    </div>{/* end .repeto-tp-layout */}

                    <PublicPageFooter />
                </div>
            </div>

            {isOwner && (
                <div className="repeto-tp-owner-fab">
                    <Button view="action" size="l" onClick={() => router.push("/settings")}>
                        <Icon data={Pencil as IconData} size={16} />
                        Редактировать
                    </Button>
                </div>
            )}

            <AppDialog
                open={!!activeCertificate}
                onClose={() => setCertPreviewIndex(null)}
                size="l"
                hasCloseButton
                caption={undefined}
                footer={undefined}
                className="repeto-tp-lightbox-dialog"
                modalClassName="repeto-tp-lightbox-modal"
                bodyClassName="repeto-tp-lightbox-body"
            >
                {activeCertificate && (
                    !activeCertificate.isPdf ? (
                        <div className="repeto-tp-cert-preview">
                            <img src={activeCertificate.fileUrl} alt={activeCertificate.title} className="repeto-tp-cert-preview__img" />
                        </div>
                    ) : null
                )}
            </AppDialog>

            <AppDialog
                open={policyPopupOpen}
                onClose={() => setPolicyPopupOpen(false)}
                size="s"
                caption="Политика отмен"
                footer={undefined}
            >
                <div className="repeto-tp-policy-popup">
                    <Text variant="body-2" className="repeto-tp-policy-copy">{policySummaryText}</Text>
                    <div className="repeto-tp-policy-block">
                        <CancelPolicyBlock
                            freeHours={t.cancelPolicy?.freeHours}
                            lateCancelAction={t.cancelPolicy?.lateCancelAction}
                            lateAction={t.cancelPolicy?.lateAction}
                            noShowAction={t.cancelPolicy?.noShowAction}
                            preferredPaymentMethod={t.preferredPaymentMethod}
                        />
                    </div>
                </div>
            </AppDialog>
        </>
    );
};

export default TutorPublicPage;
