import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import Head from "next/head";
import Link from "next/link";
import Image from "@/components/Image";
import Icon from "@/components/Icon";
import Modal from "@/components/Modal";
import ToggleTheme from "@/components/Footer/ToggleTheme";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3200/api";

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

function renderStars(rating: number) {
    return (
        <div className="flex items-center gap-0.5">
            {[1, 2, 3, 4, 5].map((n) => (
                <div key={n} className="shrink-0 w-3.5">
                    <Image
                        className={`w-full ${n > rating ? "opacity-25" : ""}`}
                        src="/images/star.svg"
                        width={14}
                        height={14}
                        alt=""
                    />
                </div>
            ))}
        </div>
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
            <div className="min-h-screen bg-background dark:bg-n-2 flex items-center justify-center">
                <div className="text-n-3">Загрузка...</div>
            </div>
        );
    }

    if (notFound || !profile) {
        return (
            <div className="min-h-screen bg-background dark:bg-n-2 flex items-center justify-center">
                <div className="text-center">
                    <div className="text-h3 mb-2">Репетитор не найден</div>
                    <p className="text-sm text-n-3">
                        Страница не существует или была удалена
                    </p>
                </div>
            </div>
        );
    }

    const t = profile;
    const canBook = t.hasWorkingDays !== false;

    return (
        <>
            <Head>
                <title>{`${t.name} — Repeto`}</title>
                <meta
                    name="description"
                    content={t.aboutText ? t.aboutText.slice(0, 160) : t.name}
                />
                <meta
                    property="og:title"
                    content={`${t.name} — Repeto`}
                />
                <meta
                    property="og:description"
                    content={t.subjects.map(getSubjectName).join(", ")}
                />
                <meta property="og:type" content="profile" />
            </Head>
            <div className="min-h-screen bg-background dark:bg-n-2">
                {/* Header */}
                <div className="bg-purple-1 text-white py-3 px-4 flex items-center justify-between text-xs font-bold">
                    <span>Работает на Repeto</span>
                    <ToggleTheme />
                </div>

                <div className="max-w-2xl mx-auto px-6 py-8 md:px-4">
                    {/* Hero */}
                    <div className="card mb-6">
                        <div className="p-6 text-center">
                            {t.avatarUrl ? (
                                <img
                                    src={t.avatarUrl}
                                    alt={t.name}
                                    className="w-[9rem] h-[9rem] mx-auto mb-4 rounded-full object-cover shadow-primary-4"
                                />
                            ) : (
                                <div className="flex items-center justify-center w-[9rem] h-[9rem] mx-auto mb-4 rounded-full bg-purple-3 text-3xl font-bold text-n-1 shadow-primary-4 dark:bg-purple-1/20">
                                    {getInitials(t.name)}
                                </div>
                            )}
                            <h1 className="text-h3 mb-1">{t.name}</h1>
                            {t.subjects.length > 0 ? (
                                <p className="text-sm text-n-3 dark:text-white/50 mb-3">
                                    {t.subjects.map(getSubjectName).join(", ")}
                                </p>
                            ) : (
                                <p className="text-sm text-n-3/60 dark:text-white/30 mb-3 italic">
                                    Предметы пока не указаны
                                </p>
                            )}
                            <div className="flex items-center justify-center gap-2 text-sm">
                                {t.rating ? (
                                    <button
                                        type="button"
                                        className="flex items-center gap-1.5 text-xs cursor-pointer hover:opacity-80 transition-opacity"
                                        onClick={() => setReviewsOpen(true)}
                                    >
                                        <div className="shrink-0 w-4 -mt-0.5">
                                            <Image
                                                className="w-full"
                                                src="/images/star.svg"
                                                width={16}
                                                height={16}
                                                alt=""
                                            />
                                        </div>
                                        <span className="font-bold">
                                            {Number(t.rating)}
                                        </span>
                                        <span className="text-n-3 dark:text-white/50">
                                            ({t.reviewsCount})
                                        </span>
                                    </button>
                                ) : null}
                                {t.lessonsCount > 0 ? (
                                    <span className="text-n-3 dark:text-white/50 text-xs">
                                        {t.rating ? "· " : ""}
                                        {t.lessonsCount}+ проведённых
                                        занятий
                                    </span>
                                ) : !t.rating ? (
                                    <span className="text-n-3/60 dark:text-white/30 italic">
                                        Отзывов пока нет
                                    </span>
                                ) : null}
                            </div>
                        </div>
                    </div>

                    {/* About */}
                    <div className="card mb-6">
                        <div className="card-title">О репетиторе</div>
                        <div className="p-5">
                            {t.aboutText ? (
                                <p className="text-sm leading-relaxed">
                                    {t.aboutText}
                                </p>
                            ) : (
                                <p className="text-sm text-n-3/60 dark:text-white/30 italic">
                                    Репетитор пока не добавил описание
                                </p>
                            )}
                        </div>
                    </div>
                    {/* Subjects */}
                    <div className="card mb-6">
                        <div className="card-title">Предметы</div>
                        <div className="p-5">
                            {t.subjects.length > 0 ? (
                                <div className="space-y-3">
                                    {t.subjects.map((subject, i) => (
                                        <div
                                            key={i}
                                            className="flex items-center gap-3 p-3 border border-n-1 rounded-sm dark:border-white"
                                        >
                                            <div className="flex items-center justify-center w-10 h-10 rounded-sm bg-purple-3 dark:bg-purple-1/20">
                                                <Icon
                                                    className="icon-20 dark:fill-white"
                                                    name="certificate"
                                                />
                                            </div>
                                            <div>
                                                <span className="text-sm font-bold">
                                                    {typeof subject === 'string' ? subject : subject.name}
                                                </span>
                                                {typeof subject !== 'string' && (subject.duration || subject.price) && (
                                                    <div className="text-xs text-n-3 dark:text-white/50 mt-0.5">
                                                        {subject.duration ? `${subject.duration} мин` : ''}
                                                        {subject.duration && subject.price ? ' · ' : ''}
                                                        {subject.price ? `${subject.price.toLocaleString('ru-RU')} ₽` : ''}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-sm text-n-3/60 dark:text-white/30 italic">
                                    Репетитор пока не добавил ни одного предмета
                                </p>
                            )}
                        </div>
                    </div>

                    {/* Contacts */}
                    <div className="card mb-6">
                        <div className="card-title">Контакты</div>
                        <div className="p-5">
                            {t.contacts.phone || t.contacts.whatsapp ? (
                                <div className="space-y-3">
                                    {t.contacts.phone && (
                                        <a
                                            href={`tel:${t.contacts.phone.replace(/[^+\d]/g, "")}`}
                                            className="flex items-center gap-3 text-sm hover:text-purple-1 transition-colors"
                                        >
                                            <div className="flex items-center justify-center w-10 h-10 rounded-sm bg-n-4/50 dark:bg-white/10">
                                                <Icon
                                                    className="icon-20 dark:fill-white"
                                                    name="phone"
                                                />
                                            </div>
                                            {t.contacts.phone}
                                        </a>
                                    )}
                                    {t.contacts.whatsapp && (
                                        <a
                                            href={`https://wa.me/${t.contacts.whatsapp.replace(/[^+\d]/g, "")}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="flex items-center gap-3 text-sm hover:text-purple-1 transition-colors"
                                        >
                                            <div className="flex items-center justify-center w-10 h-10 rounded-sm bg-green-2 dark:bg-green-1/20">
                                                <Icon
                                                    className="icon-20 fill-green-1 dark:fill-green-1"
                                                    name="whatsapp"
                                                />
                                            </div>
                                            WhatsApp
                                        </a>
                                    )}
                                </div>
                            ) : (
                                <p className="text-sm text-n-3/60 dark:text-white/30 italic">
                                    Контактные данные пока не указаны
                                </p>
                            )}
                        </div>
                    </div>

                    {/* CTA */}
                    {canBook ? (
                        <Link
                            href={`/t/${slug}/book`}
                            className="btn-purple btn-shadow w-full flex items-center justify-center cursor-pointer"
                        >
                            Записаться на занятие
                        </Link>
                    ) : (
                        <button
                            type="button"
                            disabled
                            className="btn-purple btn-shadow w-full flex items-center justify-center opacity-50 cursor-not-allowed"
                        >
                            Запись пока не ведется
                        </button>
                    )}

                    {/* Footer */}
                    <div className="mt-8 text-center text-xs text-n-3 dark:text-white/50">
                        Работает на{" "}
                        <Link
                            href="/"
                            className="font-bold hover:text-purple-1 transition-colors"
                        >
                            Repeto
                        </Link>
                    </div>
                </div>
            </div>

            {/* Floating edit button for owner */}
            {isOwner && (
                <Link
                    href="/settings"
                    className="fixed right-6 bottom-6 flex items-center gap-2 px-5 h-12 rounded-full bg-purple-1 text-white text-sm font-bold shadow-lg hover:bg-purple-1/90 transition-colors z-50"
                >
                    <Icon className="icon-18 fill-white" name="edit" />
                    Редактировать
                </Link>
            )}

            {/* Reviews modal */}
            <Modal
                title="Отзывы"
                visible={reviewsOpen}
                onClose={() => setReviewsOpen(false)}
            >
                <div className="p-6 md:p-4">
                    {t.reviews && t.reviews.length > 0 ? (
                        <div className="space-y-0">
                            {t.reviews.map((r, i) => (
                                <div
                                    key={i}
                                    className="flex p-5 pb-3 card mb-4 last:mb-0"
                                >
                                    <div className="relative shrink-0 w-8.5 h-8.5">
                                        <div className="flex items-center justify-center w-full h-full rounded-full bg-purple-3 text-xs font-bold text-n-1 dark:bg-purple-1/20">
                                            {r.studentName
                                                .split(" ")
                                                .map((w) => w[0])
                                                .filter(Boolean)
                                                .slice(0, 2)
                                                .join("")
                                                .toUpperCase()}
                                        </div>
                                    </div>
                                    <div className="w-[calc(100%-2.125rem)] pl-3.5">
                                        <div className="flex items-center">
                                            <div className="whitespace-nowrap text-sm font-bold">
                                                {r.studentName}
                                            </div>
                                            <div className="ml-2 pt-0.75 truncate text-xs font-medium text-n-3 dark:text-white/75">
                                                {formatReviewDate(
                                                    r.date
                                                )}
                                            </div>
                                        </div>
                                        <div className="mt-1 mb-1">
                                            {renderStars(r.rating)}
                                        </div>
                                        {r.feedback && (
                                            <div className="text-sm">
                                                {r.feedback}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-sm text-n-3/60 dark:text-white/30 italic text-center">
                            Отзывов пока нет
                        </p>
                    )}
                </div>
            </Modal>
        </>
    );
};

export default TutorPublicPage;
