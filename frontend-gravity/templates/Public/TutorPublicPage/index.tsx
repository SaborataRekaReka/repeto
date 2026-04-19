import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import Head from "next/head";
import Link from "next/link";
import { Card, Text, Button, Icon } from "@gravity-ui/uikit";
import type { IconData } from "@gravity-ui/uikit";
import { Pencil, Smartphone, Comment, GraduationCap } from "@gravity-ui/icons";
import AppDialog from "@/components/AppDialog";
import CancelPolicyBlock from "@/components/CancelPolicyBlock";
import { brand } from "@/constants/brand";

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
};

function getInitials(name: string): string {
    return name
        .split(" ")
        .map((w) => w[0])
        .filter(Boolean)
        .slice(0, 2)
        .join("")
        .toUpperCase();
}

function getSubjectName(s: string | { name: string; duration?: number; price?: number }): string {
    return typeof s === 'string' ? s : s.name;
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

function renderStars(rating: number) {
    return (
        <span style={{ letterSpacing: 1 }}>
            {[1, 2, 3, 4, 5].map((n) => (
                <span
                    key={n}
                    style={{
                        color: n <= rating ? brand[400] : "#d1d5db",
                        fontSize: 14,
                    }}
                >
                    ★
                </span>
            ))}
        </span>
    );
}

const TutorPublicPage = () => {
    const router = useRouter();
    const slug = router.query.slug as string | undefined;
    const [profile, setProfile] = useState<TutorProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const [notFound, setNotFound] = useState(false);
    const [reviewsOpen, setReviewsOpen] = useState(false);
    const [isOwner, setIsOwner] = useState(false);

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

    // Detect if logged-in tutor is viewing their own page
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

    if (loading) {
        return (
            <div className="repeto-public-state">
                <Text variant="body-2" color="secondary">Загрузка...</Text>
            </div>
        );
    }

    if (notFound || !profile) {
        return (
            <div className="repeto-public-state">
                <div className="repeto-public-state__inner">
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
    return (
        <>
            <Head>
                <title>{`${t.name} — Repeto`}</title>
                <meta name="description" content={t.aboutText ? t.aboutText.slice(0, 160) : t.name} />
                <meta property="og:title" content={`${t.name} — Repeto`} />
                <meta property="og:description" content={t.subjects.map(getSubjectName).join(", ")} />
                <meta property="og:type" content="profile" />
            </Head>

            <div className="repeto-public-page">
                {/* Top bar */}
                <div className="repeto-public-powered-bar">
                    Работает на платформе&nbsp;
                    <Link href="/">
                        Repeto
                    </Link>
                </div>

                <div className="repeto-public-shell">

                    {/* Hero card */}
                    <Card view="outlined" className="repeto-public-hero repeto-section-card">
                        {t.avatarUrl ? (
                            <img
                                src={t.avatarUrl}
                                alt={t.name}
                                className="repeto-public-hero__avatar-image"
                            />
                        ) : (
                            <div
                                className="repeto-public-hero__avatar-fallback"
                                style={{ background: `linear-gradient(135deg, ${brand[400]} 0%, ${brand[700]} 100%)` }}
                            >
                                {getInitials(t.name)}
                            </div>
                        )}

                        <Text variant="header-2" className="repeto-public-hero__name">{t.name}</Text>

                        {t.subjects.length > 0 ? (
                            <Text variant="body-2" color="secondary" className="repeto-public-hero__subjects">
                                {t.subjects.map(getSubjectName).join(", ")}
                            </Text>
                        ) : (
                            <Text variant="body-2" color="hint" className="repeto-public-hero__subjects repeto-public-empty">
                                Предметы пока не указаны
                            </Text>
                        )}

                        <div className="repeto-public-hero__meta">
                            {t.rating ? (
                                <button
                                    type="button"
                                    onClick={() => setReviewsOpen(true)}
                                    className="repeto-public-hero__rating-btn"
                                >
                                    {renderStars(Math.round(t.rating))}
                                    <Text variant="body-2" style={{ fontWeight: 700 }}>{Number(t.rating).toFixed(1)}</Text>
                                    <Text variant="body-2" color="secondary">({t.reviewsCount})</Text>
                                </button>
                            ) : null}

                            {t.lessonsCount > 0 ? (
                                <Text variant="body-2" color="secondary">
                                    {t.rating ? "· " : ""}{t.lessonsCount}+ занятий
                                </Text>
                            ) : !t.rating ? (
                                <Text variant="body-2" color="hint" className="repeto-public-empty">Отзывов пока нет</Text>
                            ) : null}
                        </div>
                    </Card>

                    {/* About */}
                    <Card view="outlined" className="repeto-portal-section repeto-portal-section--spaced">
                        <div className="repeto-card-header">
                            <Text variant="subheader-2">О репетиторе</Text>
                        </div>
                        <div className="repeto-portal-section__body">
                            {t.aboutText ? (
                                <Text variant="body-2" style={{ lineHeight: 1.7 }}>{t.aboutText}</Text>
                            ) : (
                                <Text variant="body-2" color="secondary">
                                    Репетитор пока не добавил описание
                                </Text>
                            )}
                        </div>
                    </Card>

                    {/* Subjects */}
                    <Card view="outlined" className="repeto-portal-section repeto-portal-section--spaced">
                        <div className="repeto-card-header">
                            <Text variant="subheader-2">Предметы</Text>
                        </div>
                        <div className="repeto-portal-section__body">
                            {t.subjects.length > 0 ? (
                                <div className="repeto-portal-stack" style={{ gap: 8 }}>
                                    {t.subjects.map((subject, i) => {
                                        const name = typeof subject === "string" ? subject : subject.name;
                                        const duration = typeof subject !== "string" ? subject.duration : undefined;
                                        const price = typeof subject !== "string" ? subject.price : undefined;
                                        return (
                                            <Card key={i} view="outlined" className="repeto-portal-item-card repeto-portal-item-card--tight">
                                                <div className="repeto-portal-item-row">
                                                    <div className="repeto-portal-item-mainline" style={{ gap: 10 }}>
                                                        <Icon data={GraduationCap as IconData} size={16} />
                                                        <Text variant="body-2" style={{ fontWeight: 600 }}>{name}</Text>
                                                        {duration ? (
                                                            <Text variant="body-1" color="secondary">· {duration} мин</Text>
                                                        ) : null}
                                                    </div>
                                                    {price ? (
                                                        <Text variant="body-2" style={{ fontWeight: 600, whiteSpace: "nowrap" }}>
                                                            {price.toLocaleString("ru-RU")} ₽
                                                        </Text>
                                                    ) : null}
                                                </div>
                                            </Card>
                                        );
                                    })}
                                </div>
                            ) : (
                                <Text variant="body-2" color="secondary">
                                    Репетитор пока не добавил ни одного предмета
                                </Text>
                            )}
                        </div>
                    </Card>

                    {showPublicPackages && (
                        <Card view="outlined" className="repeto-portal-section repeto-portal-section--spaced">
                            <div className="repeto-card-header">
                                <Text variant="subheader-2">Пакеты занятий</Text>
                            </div>
                            <div className="repeto-portal-section__body">
                                {publicPackages.length > 0 ? (
                                    <div className="repeto-portal-stack" style={{ gap: 8 }}>
                                        {publicPackages.map((pkg) => (
                                            <Card key={pkg.id} view="outlined" className="repeto-portal-item-card">
                                                <div className="repeto-portal-item-row">
                                                    <div className="repeto-portal-item-main">
                                                        <Text variant="body-2" style={{ fontWeight: 600 }}>
                                                            {pkg.subject}
                                                        </Text>
                                                        <Text variant="body-1" color="secondary">
                                                            {pkg.lessonsTotal} занятий · {pkg.pricePerLesson.toLocaleString("ru-RU")} ₽ / занятие
                                                        </Text>
                                                        {pkg.comment ? (
                                                            <Text variant="caption-1" color="secondary">{pkg.comment}</Text>
                                                        ) : null}
                                                    </div>
                                                    <div className="repeto-portal-item-side">
                                                        <Text variant="body-2" style={{ fontWeight: 700, whiteSpace: "nowrap" }}>
                                                            {pkg.totalPrice.toLocaleString("ru-RU")} ₽
                                                        </Text>
                                                    </div>
                                                </div>
                                            </Card>
                                        ))}
                                    </div>
                                ) : (
                                    <Text variant="body-2" color="secondary">
                                        Публичные пакеты пока не добавлены
                                    </Text>
                                )}
                            </div>
                        </Card>
                    )}

                    {/* Cancel policy */}
                    <Card view="outlined" className="repeto-portal-section repeto-portal-section--spaced">
                        <div className="repeto-card-header">
                            <Text variant="subheader-2">Политика отмен</Text>
                        </div>
                        <div className="repeto-portal-section__body">
                            <CancelPolicyBlock
                                freeHours={t.cancelPolicy?.freeHours}
                                lateCancelAction={t.cancelPolicy?.lateCancelAction}
                                lateAction={t.cancelPolicy?.lateAction}
                                noShowAction={t.cancelPolicy?.noShowAction}
                                preferredPaymentMethod={t.preferredPaymentMethod}
                            />
                        </div>
                    </Card>

                    {/* Contacts */}
                    <Card view="outlined" className="repeto-portal-section repeto-portal-section--spaced" style={{ marginBottom: 24 }}>
                        <div className="repeto-card-header">
                            <Text variant="subheader-2">Контакты</Text>
                        </div>
                        <div className="repeto-portal-section__body">
                            {t.contacts.phone || t.contacts.whatsapp ? (
                                <div className="repeto-portal-stack" style={{ gap: 8 }}>
                                    {t.contacts.phone && (
                                        <a
                                            href={`tel:${t.contacts.phone.replace(/[^+\d]/g, "")}`}
                                            className="repeto-public-contact-row"
                                        >
                                            <div className="repeto-portal-item-mainline" style={{ gap: 10 }}>
                                                <Icon data={Smartphone as IconData} size={16} />
                                                <Text variant="body-2">{t.contacts.phone}</Text>
                                            </div>
                                        </a>
                                    )}
                                    {t.contacts.whatsapp && (
                                        <a
                                            href={`https://wa.me/${t.contacts.whatsapp.replace(/[^+\d]/g, "")}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="repeto-public-contact-row"
                                        >
                                            <div className="repeto-portal-item-mainline" style={{ gap: 10 }}>
                                                <Icon data={Comment as IconData} size={16} />
                                                <Text variant="body-2">WhatsApp</Text>
                                            </div>
                                        </a>
                                    )}
                                </div>
                            ) : (
                                <Text variant="body-2" color="secondary">
                                    Контактные данные пока не указаны
                                </Text>
                            )}
                        </div>
                    </Card>

                    {/* CTA */}
                    {canBook ? (
                        <Link href={`/t/${slug}/book`} className="repeto-public-cta-link">
                            <Button
                                view="action"
                                size="xl"
                                className="repeto-public-cta-btn"
                            >
                                Записаться на занятие
                            </Button>
                        </Link>
                    ) : (
                        <Button
                            view="action"
                            size="xl"
                            className="repeto-public-cta-btn"
                            disabled
                        >
                            Запись пока не ведётся
                        </Button>
                    )}

                    {/* Footer */}
                    <div className="repeto-public-footer">
                        <Text variant="caption-2" color="secondary">
                            Работает на платформе{" "}
                            <Link href="/" style={{ fontWeight: 700, textDecoration: "none" }}>
                                Repeto
                            </Link>
                        </Text>
                    </div>
                </div>
            </div>

            {/* Floating edit button for owner */}
            {isOwner && (
                <div className="repeto-public-owner-fab">
                    <Button
                        view="action"
                        size="l"
                        onClick={() => router.push("/settings")}
                    >
                        <Icon data={Pencil as IconData} size={16} />
                        Редактировать
                    </Button>
                </div>
            )}

            {/* Reviews modal */}
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
                    <div className="repeto-public-list" style={{ gap: 12 }}>
                        {t.reviews.map((r, i) => (
                            <Card key={i} className="repeto-public-review-card">
                                <div className="repeto-public-review-row">
                                    <div className="repeto-public-review-avatar">
                                        {r.studentName.split(" ").map((w: string) => w[0]).filter(Boolean).slice(0, 2).join("").toUpperCase()}
                                    </div>
                                    <div className="repeto-public-review-main">
                                        <div className="repeto-public-review-head">
                                            <Text variant="body-2" style={{ fontWeight: 700 }}>{r.studentName}</Text>
                                            <Text variant="caption-2" color="secondary">{formatReviewDate(r.date)}</Text>
                                        </div>
                                        <div style={{ margin: "4px 0" }}>{renderStars(r.rating)}</div>
                                        {r.feedback && (
                                            <Text variant="body-2" style={{ lineHeight: 1.6 }}>{r.feedback}</Text>
                                        )}
                                    </div>
                                </div>
                            </Card>
                        ))}
                    </div>
                ) : (
                    <Text variant="body-2" color="hint" className="repeto-public-empty" style={{ display: "block", textAlign: "center" }}>
                        Отзывов пока нет
                    </Text>
                )}
            </AppDialog>
        </>
    );
};

export default TutorPublicPage;
