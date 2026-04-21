import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import Head from "next/head";
import Link from "next/link";
import { Text, Button, Icon, Loader } from "@gravity-ui/uikit";
import type { IconData } from "@gravity-ui/uikit";
import {
    Pencil,
    GraduationCap,
    FileCheck,
    Person,
    Gear,
} from "@gravity-ui/icons";
import AppDialog from "@/components/AppDialog";
import CancelPolicyBlock from "@/components/CancelPolicyBlock";
import StudentAvatar from "@/components/StudentAvatar";
import StudentSignIn from "@/templates/RegistrationPage/StudentSignIn";
import { PublicPageFooter, PublicPageHeader } from "../PublicPageChrome";
import PublicTutorWidget, {
    type PublicTutorWidgetContactItem,
} from "@/components/PublicTutorWidget";
import {
    formatCancelPolicyActionLabel,
    formatCancelPolicyHoursWord,
} from "@/lib/cancelPolicy";
import { resolveApiAssetUrl } from "@/lib/api";
import { getStudentAccessToken, studentApi } from "@/lib/studentAuth";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "/api";

type TutorReview = {
    studentName: string;
    rating: number;
    feedback: string | null;
    date: string;
};

type PublicPackage = {
    id: string;
    subject: string;
    lessonsTotal: number;
    totalPrice: number;
    pricePerLesson: number;
    validUntil?: string | null;
    comment?: string | null;
};

type EducationEntry = {
    institution: string;
    program?: string;
    years?: string;
};

type CertificateEntry = {
    id: string;
    title: string;
    fileUrl: string;
    uploadedAt: string;
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

type SidebarSection = { id: string; label: string };

const TutorPublicPage = () => {
    const router = useRouter();
    const slug = router.query.slug as string | undefined;
    const [profile, setProfile] = useState<TutorProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const [notFound, setNotFound] = useState(false);
    const [reviewsOpen, setReviewsOpen] = useState(false);
    const [isOwner, setIsOwner] = useState(false);
    const [certPreviewIndex, setCertPreviewIndex] = useState<number | null>(null);
    const [policyPopupOpen, setPolicyPopupOpen] = useState(false);
    const [activeSection, setActiveSection] = useState<string>("about");
    const [studentSignInOpen, setStudentSignInOpen] = useState(false);
    const [studentProfileName, setStudentProfileName] = useState<string | null>(null);

    useEffect(() => {
        let canceled = false;

        const loadStudentPreview = async () => {
            if (!getStudentAccessToken()) {
                if (!canceled) {
                    setStudentProfileName(null);
                }
                return;
            }

            try {
                const setup = await studentApi<{ name?: string | null }>("/student-portal/setup");
                if (!canceled) {
                    const normalizedName = String(setup?.name || "").trim();
                    setStudentProfileName(normalizedName || "Ученик");
                }
            } catch {
                if (!canceled) {
                    setStudentProfileName(null);
                }
            }
        };

        void loadStudentPreview();

        return () => {
            canceled = true;
        };
    }, []);

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
                    <Text variant="header-2" style={{ display: "block", marginBottom: 8 }}>Репетитор не найден</Text>
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
    const certGalleryItems = certsList.map((cert) => {
        const resolvedUrl = resolveApiAssetUrl(cert.fileUrl) || cert.fileUrl;
        return {
            ...cert,
            fileUrl: resolvedUrl,
            isPdf: isPdfUrl(resolvedUrl),
            uploadedLabel: formatCertificateDate(cert.uploadedAt),
        };
    });
    const activeCertificate =
        certPreviewIndex !== null ? certGalleryItems[certPreviewIndex] || null : null;
    const hasExperience = !!t.experience?.trim();
    const hasQualification = !!t.qualificationVerified;

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
        { id: "about", label: "О специалисте" },
    ];
    if (educationList.length > 0) sidebarSections.push({ id: "education", label: "Образование" });
    if (hasExperience) sidebarSections.push({ id: "experience", label: "Опыт" });
    if (certsList.length > 0) sidebarSections.push({ id: "certificates", label: "Документы" });
    sidebarSections.push({ id: "subjects", label: "Предметы и цены" });
    if (showPublicPackages && publicPackages.length > 0) sidebarSections.push({ id: "packages", label: "Пакеты" });
    if (t.reviews && t.reviews.length > 0) sidebarSections.push({ id: "reviews", label: "Отзывы" });

    // Rating distribution for the reviews section
    const ratingCounts = [0, 0, 0, 0, 0];
    (t.reviews || []).forEach((r) => {
        const idx = Math.min(Math.max(Math.round(r.rating) - 1, 0), 4);
        ratingCounts[idx]++;
    });
    const maxReviewCount = Math.max(...ratingCounts, 1);

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
                    rightContent={
                        studentProfileName ? (
                            <>
                                <Text variant="body-1" style={{ fontWeight: 500 }}>
                                    {studentProfileName}
                                </Text>
                                <Button
                                    view="flat"
                                    size="s"
                                    onClick={() => void router.push("/student")}
                                    aria-label="Кабинет ученика"
                                >
                                    <Icon data={Gear as IconData} size={16} />
                                </Button>
                            </>
                        ) : (
                            <Button
                                view="flat"
                                size="s"
                                onClick={() => setStudentSignInOpen(true)}
                                aria-label="Вход ученика"
                            >
                                <Icon data={Person as IconData} size={16} />
                            </Button>
                        )
                    }
                />

                <div className="repeto-tp-container repeto-portal-main">
                    {/* ── Two-column layout: sidebar + content ── */}
                    <div className="repeto-tp-layout">
                        {/* Sidebar */}
                        <aside className="repeto-tp-sidebar">
                            <h2 className="repeto-tp-sidebar__title">Профиль</h2>

                            <nav className="repeto-tp-sidebar__nav page-overlay__nav page-overlay__nav--section">
                                {sidebarSections.map((sec) => (
                                    <a
                                        key={sec.id}
                                        href={`#${sec.id}`}
                                        onClick={() => setActiveSection(sec.id)}
                                        className={`repeto-tp-sidebar__item page-overlay__nav-item page-overlay__nav-item--section${activeSection === sec.id ? " repeto-tp-sidebar__item--active page-overlay__nav-item--active" : ""}`}
                                    >
                                        <span className="repeto-tp-sidebar__item-text">{sec.label}</span>
                                    </a>
                                ))}
                            </nav>
                            {canBook && (
                                <Link href={`/t/${slug}/book`} style={{ textDecoration: "none", display: "block", marginTop: 16 }}>
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
                                hasQualification={hasQualification}
                                rating={t.rating}
                                reviewsCount={t.reviewsCount}
                                onOpenReviews={() => setReviewsOpen(true)}
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
                                <Text variant="body-2" style={{ lineHeight: 1.7 }}>{t.aboutText}</Text>
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
                                    {educationList.map((edu, i) => (
                                        <div key={i} className="repeto-tp-edu-item">
                                            <span className="repeto-tp-edu-item__icon">
                                                <Icon data={GraduationCap as IconData} size={16} />
                                            </span>
                                            <div className="repeto-tp-edu-item__text">
                                                <Text variant="body-2" style={{ fontWeight: 600 }}>{edu.institution}</Text>
                                                {edu.program && <Text variant="body-1" color="secondary">{edu.program}</Text>}
                                                {edu.years && <Text variant="caption-2" color="secondary">{edu.years}</Text>}
                                            </div>
                                        </div>
                                    ))}
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
                                <Text variant="body-2" style={{ lineHeight: 1.7, whiteSpace: "pre-line" }}>{t.experience}</Text>
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
                                                        <Text variant="body-2" style={{ fontWeight: 600 }}>{name}</Text>
                                                        {duration ? (
                                                            <Text variant="body-1" color="secondary"> · {duration} мин</Text>
                                                        ) : null}
                                                    </div>
                                                </div>
                                                {price ? (
                                                    <Text variant="body-2" style={{ fontWeight: 600, whiteSpace: "nowrap" }}>
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
                            <div className="repeto-tp-section__body">
                                <div className="repeto-tp-item-list">
                                    {publicPackages.map((pkg) => (
                                        <div key={pkg.id} className="repeto-tp-item-row repeto-tp-item-row--pkg">
                                            <div className="repeto-tp-item-row__left">
                                                <div>
                                                    <Text variant="body-2" style={{ fontWeight: 600 }}>{pkg.subject}</Text>
                                                    <Text variant="body-1" color="secondary" as="div">
                                                        {pkg.lessonsTotal} занятий · {pkg.pricePerLesson.toLocaleString("ru-RU")} ₽ / занятие
                                                    </Text>
                                                    {pkg.comment ? (
                                                        <Text variant="caption-1" color="secondary" as="div" style={{ marginTop: 2 }}>{pkg.comment}</Text>
                                                    ) : null}
                                                </div>
                                            </div>
                                            <Text variant="body-2" style={{ fontWeight: 700, whiteSpace: "nowrap" }}>
                                                {pkg.totalPrice.toLocaleString("ru-RU")} ₽
                                            </Text>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {t.reviews && t.reviews.length > 0 && (
                        <div id="reviews" className="repeto-tp-section">
                            <Text variant="subheader-2" as="div" className="repeto-portal-plain-section-title">
                                Отзывы
                            </Text>
                            <div className="repeto-tp-section__body">
                                <div className="repeto-tp-reviews-summary">
                                    <div className="repeto-tp-reviews-summary__left">
                                        <Text variant="display-1" as="div" className="repeto-tp-reviews-summary__score">
                                            {t.rating ? Number(t.rating).toFixed(1) : "—"}
                                        </Text>
                                        {t.rating && renderStars(Math.round(t.rating))}
                                        <Text variant="body-1" color="secondary">
                                            {t.reviewsCount} {t.reviewsCount === 1 ? "отзыв" : t.reviewsCount < 5 ? "отзыва" : "отзывов"}
                                        </Text>
                                    </div>
                                    <div className="repeto-tp-reviews-summary__bars">
                                        {[5, 4, 3, 2, 1].map((star) => (
                                            <div key={star} className="repeto-tp-reviews-bar">
                                                <Text variant="caption-2" color="secondary" className="repeto-tp-reviews-bar__label">{star}</Text>
                                                <div className="repeto-tp-reviews-bar__track">
                                                    <div
                                                        className="repeto-tp-reviews-bar__fill"
                                                        style={{ width: `${(ratingCounts[star - 1] / maxReviewCount) * 100}%` }}
                                                    />
                                                </div>
                                                <Text variant="caption-2" color="secondary" className="repeto-tp-reviews-bar__count">
                                                    {ratingCounts[star - 1]}
                                                </Text>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="repeto-tp-reviews-list">
                                    {t.reviews.slice(0, 5).map((r, i) => (
                                        <div key={i} className="repeto-tp-review">
                                            <StudentAvatar
                                                student={{ name: r.studentName, avatarUrl: undefined }}
                                                size="m"
                                            />
                                            <div className="repeto-tp-review__body">
                                                <div className="repeto-tp-review__head">
                                                    <Text variant="body-2" style={{ fontWeight: 700 }}>{r.studentName}</Text>
                                                    {renderStars(r.rating)}
                                                    <Text variant="caption-2" color="secondary">{formatReviewDate(r.date)}</Text>
                                                </div>
                                                {r.feedback && (
                                                    <Text variant="body-2" style={{ lineHeight: 1.65, marginTop: 8 }}>{r.feedback}</Text>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                    {t.reviews.length > 5 && (
                                        <div style={{ textAlign: "center", marginTop: 8 }}>
                                            <Button view="outlined" size="m" onClick={() => setReviewsOpen(true)}>
                                                Все отзывы ({t.reviewsCount})
                                            </Button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="repeto-tp-cta repeto-tp-cta--mobile">
                        {canBook ? (
                            <Link href={`/t/${slug}/book`} style={{ textDecoration: "none", display: "block" }}>
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
                open={reviewsOpen}
                onClose={() => setReviewsOpen(false)}
                size="l"
                caption="Отзывы"
                footer={{
                    textButtonCancel: "Закрыть",
                    onClickButtonCancel: () => setReviewsOpen(false),
                }}
            >
                {t.reviews && t.reviews.length > 0 ? (
                    <div className="repeto-tp-reviews-list">
                        {t.reviews.map((r, i) => (
                            <div key={i} className="repeto-tp-review">
                                <StudentAvatar
                                    student={{ name: r.studentName, avatarUrl: undefined }}
                                    size="m"
                                />
                                <div className="repeto-tp-review__body">
                                    <div className="repeto-tp-review__head">
                                        <Text variant="body-2" style={{ fontWeight: 700 }}>{r.studentName}</Text>
                                        {renderStars(r.rating)}
                                        <Text variant="caption-2" color="secondary">{formatReviewDate(r.date)}</Text>
                                    </div>
                                    {r.feedback && (
                                        <Text variant="body-2" style={{ lineHeight: 1.6, marginTop: 6 }}>{r.feedback}</Text>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <Text variant="body-2" color="hint" style={{ display: "block", textAlign: "center", fontStyle: "italic" }}>
                        Отзывов пока нет
                    </Text>
                )}
            </AppDialog>

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
                    <Text variant="body-2" style={{ lineHeight: 1.6 }}>{policySummaryText}</Text>
                    <div style={{ marginTop: 10 }}>
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

            <AppDialog
                open={studentSignInOpen}
                onClose={() => setStudentSignInOpen(false)}
                size="s"
                caption={undefined}
                footer={undefined}
            >
                <StudentSignIn onBack={() => setStudentSignInOpen(false)} />
            </AppDialog>
        </>
    );
};

export default TutorPublicPage;
