import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import Head from "next/head";
import Link from "next/link";
import { Card, Text, Button, Icon, Modal } from "@gravity-ui/uikit";
import type { IconData } from "@gravity-ui/uikit";
import { Pencil, Smartphone, Comment, GraduationCap } from "@gravity-ui/icons";
import { brand } from "@/constants/brand";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "/api";

type TutorReview = {
    studentName: string;
    rating: number;
    feedback: string | null;
    date: string;
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
    memberSince: string;
    hasWorkingDays?: boolean;
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

function formatHoursWord(hours: number): string {
    const abs = Math.abs(hours) % 100;
    const last = abs % 10;
    if (abs > 10 && abs < 20) return "часов";
    if (last === 1) return "час";
    if (last >= 2 && last <= 4) return "часа";
    return "часов";
}

function formatPolicyActionLabel(action?: string): string {
    const normalized = (action || "").trim().toLowerCase();

    if (
        normalized === "full" ||
        normalized === "full_charge" ||
        normalized === "charge"
    ) {
        return "100% стоимости занятия";
    }
    if (normalized === "half" || normalized === "half_charge") {
        return "50% стоимости занятия";
    }
    if (normalized === "none" || normalized === "no_charge") {
        return "без штрафа";
    }

    return action || "100% стоимости занятия";
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
            <div style={{ minHeight: "100vh", background: "var(--g-color-base-background)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Text variant="body-2" color="secondary">Загрузка...</Text>
            </div>
        );
    }

    if (notFound || !profile) {
        return (
            <div style={{ minHeight: "100vh", background: "var(--g-color-base-background)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <div style={{ textAlign: "center" }}>
                    <Text variant="header-2" style={{ display: "block", marginBottom: 8 }}>Репетитор не найден</Text>
                    <Text variant="body-2" color="secondary">Страница не существует или была удалена</Text>
                </div>
            </div>
        );
    }

    const t = profile;
    const canBook = t.hasWorkingDays !== false;
    const freeHours = Number(t.cancelPolicy?.freeHours ?? 24);
    const lateCancelActionLabel = formatPolicyActionLabel(
        t.cancelPolicy?.lateCancelAction || t.cancelPolicy?.lateAction
    );
    const noShowActionLabel = formatPolicyActionLabel(
        t.cancelPolicy?.noShowAction
    );

    return (
        <>
            <Head>
                <title>{`${t.name} — Repeto`}</title>
                <meta name="description" content={t.aboutText ? t.aboutText.slice(0, 160) : t.name} />
                <meta property="og:title" content={`${t.name} — Repeto`} />
                <meta property="og:description" content={t.subjects.map(getSubjectName).join(", ")} />
                <meta property="og:type" content="profile" />
            </Head>

            <div style={{ minHeight: "100vh", background: "var(--g-color-base-background)" }}>
                {/* Top bar */}
                <div style={{
                    background: brand[400],
                    color: "#fff",
                    padding: "10px 20px",
                    fontSize: 12,
                    fontWeight: 600,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                }}>
                    Работает на платформе&nbsp;
                    <Link href="/" style={{ color: "#fff", textDecoration: "underline", fontWeight: 700 }}>
                        Repeto
                    </Link>
                </div>

                <div style={{ maxWidth: 640, margin: "0 auto", padding: "32px 16px" }}>

                    {/* Hero card */}
                    <Card view="outlined" style={{ marginBottom: 16, padding: 32, textAlign: "center", borderRadius: 16, background: "var(--g-color-base-float)" }}>
                        {t.avatarUrl ? (
                            <img
                                src={t.avatarUrl}
                                alt={t.name}
                                style={{
                                    width: 112, height: 112, borderRadius: "50%",
                                    objectFit: "cover", margin: "0 auto 20px",
                                    display: "block",
                                    boxShadow: "0 4px 20px rgba(174,122,255,0.25)",
                                }}
                            />
                        ) : (
                            <div style={{
                                width: 112, height: 112, borderRadius: "50%",
                                background: `linear-gradient(135deg, ${brand[400]} 0%, ${brand[700]} 100%)`,
                                display: "flex", alignItems: "center", justifyContent: "center",
                                margin: "0 auto 20px",
                                fontSize: 36, fontWeight: 800, color: "#fff",
                                boxShadow: "0 4px 20px rgba(174,122,255,0.25)",
                            }}>
                                {getInitials(t.name)}
                            </div>
                        )}

                        <Text variant="header-2" style={{ display: "block", marginBottom: 4 }}>{t.name}</Text>

                        {t.subjects.length > 0 ? (
                            <Text variant="body-2" color="secondary" style={{ display: "block", marginBottom: 12 }}>
                                {t.subjects.map(getSubjectName).join(", ")}
                            </Text>
                        ) : (
                            <Text variant="body-2" color="hint" style={{ display: "block", marginBottom: 12, fontStyle: "italic" }}>
                                Предметы пока не указаны
                            </Text>
                        )}

                        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 12 }}>
                            {t.rating ? (
                                <button
                                    type="button"
                                    onClick={() => setReviewsOpen(true)}
                                    style={{
                                        display: "flex", alignItems: "center", gap: 6,
                                        background: "none", border: "none", cursor: "pointer", padding: 0,
                                    }}
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
                                <Text variant="body-2" color="hint" style={{ fontStyle: "italic" }}>Отзывов пока нет</Text>
                            ) : null}
                        </div>
                    </Card>

                    {/* About */}
                    <Card view="outlined" style={{ marginBottom: 16, borderRadius: 16, overflow: "hidden", background: "var(--g-color-base-float)" }}>
                        <div style={{ padding: "16px 24px", borderBottom: "1px solid var(--g-color-line-generic)" }}>
                            <Text variant="subheader-2">О репетиторе</Text>
                        </div>
                        <div style={{ padding: "20px 24px" }}>
                            {t.aboutText ? (
                                <Text variant="body-2" style={{ lineHeight: 1.7 }}>{t.aboutText}</Text>
                            ) : (
                                <Text variant="body-2" color="hint" style={{ fontStyle: "italic" }}>
                                    Репетитор пока не добавил описание
                                </Text>
                            )}
                        </div>
                    </Card>

                    {/* Subjects */}
                    <Card view="outlined" style={{ marginBottom: 16, borderRadius: 16, overflow: "hidden", background: "var(--g-color-base-float)" }}>
                        <div style={{ padding: "16px 24px", borderBottom: "1px solid var(--g-color-line-generic)" }}>
                            <Text variant="subheader-2">Предметы</Text>
                        </div>
                        <div style={{ padding: "16px 24px" }}>
                            {t.subjects.length > 0 ? (
                                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                                    {t.subjects.map((subject, i) => (
                                        <div key={i} style={{
                                            display: "flex", alignItems: "center", gap: 14,
                                            padding: "12px 14px",
                                            border: "1px solid var(--g-color-line-generic)",
                                            borderRadius: 10,
                                            background: "var(--g-color-base-float)",
                                        }}>
                                            <div style={{
                                                width: 40, height: 40, borderRadius: 10, flexShrink: 0,
                                                background: "rgba(174,122,255,0.1)",
                                                display: "flex", alignItems: "center", justifyContent: "center",
                                                color: brand[400],
                                            }}>
                                                <Icon data={GraduationCap as IconData} size={20} />
                                            </div>
                                            <div>
                                                <Text variant="body-2" style={{ fontWeight: 600, display: "block" }}>
                                                    {typeof subject === "string" ? subject : subject.name}
                                                </Text>
                                                {typeof subject !== "string" && (subject.duration || subject.price) && (
                                                    <Text variant="caption-2" color="secondary" style={{ display: "block", marginTop: 2 }}>
                                                        {subject.duration ? `${subject.duration} мин` : ""}
                                                        {subject.duration && subject.price ? " · " : ""}
                                                        {subject.price ? `${subject.price.toLocaleString("ru-RU")} ₽` : ""}
                                                    </Text>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <Text variant="body-2" color="hint" style={{ fontStyle: "italic" }}>
                                    Репетитор пока не добавил ни одного предмета
                                </Text>
                            )}
                        </div>
                    </Card>

                    {/* Cancel policy */}
                    <Card view="outlined" style={{ marginBottom: 16, borderRadius: 16, overflow: "hidden", background: "var(--g-color-base-float)" }}>
                        <div style={{ padding: "16px 24px", borderBottom: "1px solid var(--g-color-line-generic)" }}>
                            <Text variant="subheader-2">Политика отмен</Text>
                        </div>
                        <div style={{ padding: "20px 24px" }}>
                            <Text variant="body-2" style={{ display: "block", lineHeight: 1.7 }}>
                                Бесплатная отмена за <strong>{freeHours} {formatHoursWord(freeHours)}</strong> до занятия.
                            </Text>
                            <Text variant="body-2" style={{ display: "block", marginTop: 6, lineHeight: 1.7 }}>
                                Поздняя отмена: <strong>{lateCancelActionLabel}</strong>. Неявка: <strong>{noShowActionLabel}</strong>.
                            </Text>
                        </div>
                    </Card>

                    {/* Contacts */}
                    <Card view="outlined" style={{ marginBottom: 24, borderRadius: 16, overflow: "hidden", background: "var(--g-color-base-float)" }}>
                        <div style={{ padding: "16px 24px", borderBottom: "1px solid var(--g-color-line-generic)" }}>
                            <Text variant="subheader-2">Контакты</Text>
                        </div>
                        <div style={{ padding: "16px 24px" }}>
                            {t.contacts.phone || t.contacts.whatsapp ? (
                                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                                    {t.contacts.phone && (
                                        <a
                                            href={`tel:${t.contacts.phone.replace(/[^+\d]/g, "")}`}
                                            style={{ display: "flex", alignItems: "center", gap: 14, textDecoration: "none", color: "inherit" }}
                                        >
                                            <div style={{
                                                width: 40, height: 40, borderRadius: 10, flexShrink: 0,
                                                background: "rgba(174,122,255,0.1)",
                                                display: "flex", alignItems: "center", justifyContent: "center",
                                                color: brand[400],
                                            }}>
                                                <Icon data={Smartphone as IconData} size={18} />
                                            </div>
                                            <Text variant="body-2">{t.contacts.phone}</Text>
                                        </a>
                                    )}
                                    {t.contacts.whatsapp && (
                                        <a
                                            href={`https://wa.me/${t.contacts.whatsapp.replace(/[^+\d]/g, "")}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            style={{ display: "flex", alignItems: "center", gap: 14, textDecoration: "none", color: "inherit" }}
                                        >
                                            <div style={{
                                                width: 40, height: 40, borderRadius: 10, flexShrink: 0,
                                                background: "rgba(34,197,94,0.1)",
                                                display: "flex", alignItems: "center", justifyContent: "center",
                                                color: "#22C55E",
                                            }}>
                                                <Icon data={Comment as IconData} size={18} />
                                            </div>
                                            <Text variant="body-2">WhatsApp</Text>
                                        </a>
                                    )}
                                </div>
                            ) : (
                                <Text variant="body-2" color="hint" style={{ fontStyle: "italic" }}>
                                    Контактные данные пока не указаны
                                </Text>
                            )}
                        </div>
                    </Card>

                    {/* CTA */}
                    {canBook ? (
                        <Link href={`/t/${slug}/book`} style={{ display: "block", width: "100%", textDecoration: "none" }}>
                            <Button
                                view="action"
                                size="xl"
                                style={{
                                    width: "100%",
                                    display: "inline-flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    textAlign: "center",
                                    lineHeight: "20px",
                                    fontWeight: 600,
                                    height: 52,
                                    borderRadius: 12,
                                }}
                            >
                                Записаться на занятие
                            </Button>
                        </Link>
                    ) : (
                        <Button
                            view="action"
                            size="xl"
                            style={{
                                width: "100%",
                                display: "inline-flex",
                                alignItems: "center",
                                justifyContent: "center",
                                textAlign: "center",
                                lineHeight: "20px",
                                fontWeight: 600,
                                height: 52,
                                borderRadius: 12,
                            }}
                            disabled
                        >
                            Запись пока не ведётся
                        </Button>
                    )}

                    {/* Footer */}
                    <div style={{ marginTop: 32, textAlign: "center" }}>
                        <Text variant="caption-2" color="secondary">
                            Работает на платформе{" "}
                            <Link href="/" style={{ color: brand[400], fontWeight: 700, textDecoration: "none" }}>
                                Repeto
                            </Link>
                        </Text>
                    </div>
                </div>
            </div>

            {/* Floating edit button for owner */}
            {isOwner && (
                <div style={{ position: "fixed", right: 24, bottom: 24, zIndex: 50 }}>
                    <Button
                        view="action"
                        size="l"
                        onClick={() => router.push("/settings")}
                        style={{ borderRadius: 24, paddingLeft: 20, paddingRight: 20, fontWeight: 600, boxShadow: "0 4px 20px rgba(174,122,255,0.35)" }}
                    >
                        <Icon data={Pencil as IconData} size={16} />
                        Редактировать
                    </Button>
                </div>
            )}

            {/* Reviews modal */}
            <Modal open={reviewsOpen} onClose={() => setReviewsOpen(false)}>
                <div style={{ padding: "8px 24px 24px" }}>
                    <Text variant="header-1" style={{ display: "block", marginBottom: 20 }}>Отзывы</Text>
                    {t.reviews && t.reviews.length > 0 ? (
                        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                            {t.reviews.map((r, i) => (
                                <Card key={i} style={{ padding: "16px 20px", borderRadius: 12 }}>
                                    <div style={{ display: "flex", gap: 12 }}>
                                        <div style={{
                                            width: 36, height: 36, borderRadius: "50%", flexShrink: 0,
                                            background: `linear-gradient(135deg, ${brand[400]} 0%, ${brand[700]} 100%)`,
                                            display: "flex", alignItems: "center", justifyContent: "center",
                                            fontSize: 12, fontWeight: 700, color: "#fff",
                                        }}>
                                            {r.studentName.split(" ").map((w: string) => w[0]).filter(Boolean).slice(0, 2).join("").toUpperCase()}
                                        </div>
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <div style={{ display: "flex", alignItems: "baseline", gap: 8, flexWrap: "wrap" }}>
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
                        <Text variant="body-2" color="hint" style={{ fontStyle: "italic", display: "block", textAlign: "center" }}>
                            Отзывов пока нет
                        </Text>
                    )}
                </div>
            </Modal>
        </>
    );
};

export default TutorPublicPage;
