import { useState, useMemo, useEffect, useRef } from "react";
import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import {
    Alert,
    Button,
    Text,
    TextInput,
    TextArea,
    Checkbox,
    Icon,
} from "@gravity-ui/uikit";
import {
    ArrowLeft,
    ArrowRight,
    GraduationCap,
} from "@gravity-ui/icons";
import type { IconData } from "@gravity-ui/uikit";
import PhoneInput from "@/components/PhoneInput";
import AppField from "@/components/AppField";
import { codedErrorMessage } from "@/lib/errorCodes";
import { verifyBookingEmail } from "@/lib/studentAuth";
import { PublicPageFooter, PublicPageHeader } from "../PublicPageChrome";
import StudentHeaderRight from "../StudentHeaderRight";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "/api";

type SlotData = { date: string; time: string; duration: number };
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
type TutorProfile = {
    name: string;
    subjects: { name: string; duration: number; price: number }[];
    showPublicPackages?: boolean;
    publicPackages?: PublicPackage[];
    slug?: string;
    tagline?: string;
};

type BookingPrefill = {
    name: string;
    phone: string;
    email?: string;
    updatedAt: string;
};

type BookingCreateResponse = {
    id?: string;
    otpSent?: boolean;
};

type BotInfoResponse = {
    telegram?: { configured: boolean; username?: string | null };
    max?: { configured: boolean; name?: string | null; username?: string | null };
};

type ContactStatusResponse = {
    found: boolean;
    telegramConnected: boolean;
    maxConnected: boolean;
    emailKnown: boolean;
    hasAccount?: boolean;
};

type ReminderMethod = "telegram" | "max" | "email" | "push";

type BookingPrefillStore = {
    byTutor: Record<string, BookingPrefill>;
    byPhone: Record<string, BookingPrefill>;
};

const DAYS_RU = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];
const MONTHS_NOM = [
    "Январь",
    "Февраль",
    "Март",
    "Апрель",
    "Май",
    "Июнь",
    "Июль",
    "Август",
    "Сентябрь",
    "Октябрь",
    "Ноябрь",
    "Декабрь",
];
const MONTHS_GEN = [
    "января",
    "февраля",
    "марта",
    "апреля",
    "мая",
    "июня",
    "июля",
    "августа",
    "сентября",
    "октября",
    "ноября",
    "декабря",
];
const WEEKDAYS_FULL = [
    "воскресенье",
    "понедельник",
    "вторник",
    "среда",
    "четверг",
    "пятница",
    "суббота",
];

const BOOKING_PREFILL_STORAGE_KEY = "repeto.booking-prefill.v1";

/* inline style constants removed — now using CSS classes */

const REMINDER_METHODS: Array<{ id: ReminderMethod; label: string }> = [
    { id: "telegram", label: "Telegram" },
    { id: "max", label: "Макс" },
    { id: "email", label: "Почта" },
    { id: "push", label: "Push" },
];

const REMINDER_TIME_OPTIONS = [
    { minutes: 60, label: "За 1 час" },
    { minutes: 180, label: "За 3 часа" },
    { minutes: 1440, label: "За 24 часа" },
];

function normalizePhone(value: string): string {
    return value.replace(/[^\d]/g, "");
}

function readPrefillStore(): BookingPrefillStore {
    if (typeof window === "undefined") {
        return { byTutor: {}, byPhone: {} };
    }

    try {
        const raw = localStorage.getItem(BOOKING_PREFILL_STORAGE_KEY);
        if (!raw) return { byTutor: {}, byPhone: {} };

        const parsed = JSON.parse(raw) as Partial<BookingPrefillStore>;
        return {
            byTutor: parsed.byTutor && typeof parsed.byTutor === "object" ? parsed.byTutor : {},
            byPhone: parsed.byPhone && typeof parsed.byPhone === "object" ? parsed.byPhone : {},
        };
    } catch {
        return { byTutor: {}, byPhone: {} };
    }
}

function savePrefillStore(store: BookingPrefillStore) {
    if (typeof window === "undefined") return;
    try {
        localStorage.setItem(BOOKING_PREFILL_STORAGE_KEY, JSON.stringify(store));
    } catch {
        // Private browsing or quota exceeded
    }
}

const BookingPage = ({ slug }: { slug: string }) => {
    const [profile, setProfile] = useState<TutorProfile | null>(null);
    const [slots, setSlots] = useState<SlotData[]>([]);
    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState<string | null>(null);

    useEffect(() => {
        let cancelled = false;
        const controller = new AbortController();
        const timeoutId = window.setTimeout(() => controller.abort(), 12000);

        const fetchJson = async (url: string) => {
            const response = await fetch(url, { signal: controller.signal });
            const payload = await response.json().catch(() => null);
            return { response, payload };
        };

        setLoading(true);
        setLoadError(null);
        setProfile(null);
        setSlots([]);

        (async () => {
            try {
                const [profileResult, slotsResult, botInfoRes] = await Promise.all([
                    fetchJson(`${API_BASE}/public/tutors/${encodeURIComponent(slug)}`),
                    fetchJson(`${API_BASE}/public/tutors/${encodeURIComponent(slug)}/slots`),
                    fetch(`${API_BASE}/public/bot-info`, { signal: controller.signal })
                        .then((r) => (r.ok ? r.json() : null))
                        .catch(() => null),
                ]);

                if (cancelled) return;

                if (profileResult.response.status === 404) {
                    setProfile(null);
                    return;
                }

                if (!profileResult.response.ok) {
                    throw new Error("booking_profile_load_failed");
                }

                setProfile(profileResult.payload as TutorProfile);

                if (slotsResult.response.ok && Array.isArray(slotsResult.payload)) {
                    setSlots(slotsResult.payload as SlotData[]);
                }

                const botInfo = botInfoRes as BotInfoResponse | null;
                if (botInfo?.telegram?.username) {
                    setBotUsername(botInfo.telegram.username);
                }
                if (botInfo?.max?.name) {
                    setMaxBotName(botInfo.max.name);
                }
                if (botInfo?.max?.username) {
                    setMaxBotUsername(botInfo.max.username);
                }
            } catch (error) {
                if (cancelled) return;

                const isAbort =
                    typeof error === "object" &&
                    error !== null &&
                    "name" in error &&
                    (error as { name?: string }).name === "AbortError";

                setLoadError(
                    isAbort
                        ? "Время ожидания страницы истекло. Обновите страницу и попробуйте снова."
                        : "Не удалось загрузить страницу записи. Попробуйте снова."
                );
            } finally {
                if (!cancelled) {
                    setLoading(false);
                }
                window.clearTimeout(timeoutId);
            }
        })();

        return () => {
            cancelled = true;
            controller.abort();
            window.clearTimeout(timeoutId);
        };
    }, [slug]);

    const t = profile || { name: "", subjects: [], publicPackages: [], tagline: "" };

    const [step, setStep] = useState(0);
    const [selectedSubject, setSelectedSubject] = useState<
        (typeof t.subjects)[0] | null
    >(null);
    const [selectedPackage, setSelectedPackage] = useState<PublicPackage | null>(null);
    const [viewMonth, setViewMonth] = useState(() => {
        const now = new Date();
        return new Date(now.getFullYear(), now.getMonth(), 1);
    });
    const [selectedDate, setSelectedDate] = useState<string | null>(null);
    const [selectedTime, setSelectedTime] = useState<string | null>(null);
    const [name, setName] = useState("");
    const [phone, setPhone] = useState("");
    const [email, setEmail] = useState("");
    const [comment, setComment] = useState("");
    const [submitError, setSubmitError] = useState<string | null>(null);
    const [consent, setConsent] = useState(false);
    const [autofillHint, setAutofillHint] = useState<string | null>(null);
    const [submitting, setSubmitting] = useState(false);
    const [verifying, setVerifying] = useState(false);
    const [bookingId, setBookingId] = useState<string | null>(null);
    const [otpCode, setOtpCode] = useState("");
    const [otpError, setOtpError] = useState<string | null>(null);
    const router = useRouter();

    // Messenger deep-link state
    const [linkCode] = useState(() => `book_${crypto.randomUUID()}`);
    const [botUsername, setBotUsername] = useState<string | null>(null);
    const [maxBotName, setMaxBotName] = useState<string | null>(null);
    const [maxBotUsername, setMaxBotUsername] = useState<string | null>(null);
    const [telegramLinked, setTelegramLinked] = useState(false);
    const [maxLinked, setMaxLinked] = useState(false);
    const [selectedReminderMethods, setSelectedReminderMethods] = useState<ReminderMethod[]>([]);
    const [reminderMinutesBefore, setReminderMinutesBefore] = useState(180);
    const deepLinkOpenedRef = useRef<{ telegram: boolean; max: boolean }>({
        telegram: false,
        max: false,
    });

    // Poll link status every 3s while on step 2
    useEffect(() => {
        if (step !== 2) return;
        if (telegramLinked && maxLinked) return;

        const interval = setInterval(async () => {
            try {
                const res = await fetch(`${API_BASE}/public/link-status/${encodeURIComponent(linkCode)}`);
                if (!res.ok) return;
                const data = await res.json();
                if (data.telegram) setTelegramLinked(true);
                if (data.max) setMaxLinked(true);
            } catch {
                // ignore polling errors
            }
        }, 3000);

        return () => clearInterval(interval);
    }, [step, linkCode, telegramLinked, maxLinked]);

    useEffect(() => {
        const store = readPrefillStore();
        const byTutor = store.byTutor[slug];
        if (!byTutor) return;

        setName((prev) => prev || byTutor.name || "");
        setPhone((prev) => prev || byTutor.phone || "");
        setEmail((prev) => prev || byTutor.email || "");
        setAutofillHint("Мы подставили ваши данные из прошлой записи");
    }, [slug]);

    useEffect(() => {
        const normalizedPhone = normalizePhone(phone);
        const normalizedEmail = email.trim().toLowerCase();

        if (normalizedPhone.length < 10 && !normalizedEmail.includes("@")) return;

        const timeout = setTimeout(async () => {
            try {
                const params = new URLSearchParams();
                if (normalizedPhone.length >= 10) params.set("phone", normalizedPhone);
                if (normalizedEmail.includes("@")) params.set("email", normalizedEmail);

                const res = await fetch(
                    `${API_BASE}/public/tutors/${encodeURIComponent(slug)}/contact-status?${params.toString()}`
                );
                if (!res.ok) return;

                const status = (await res.json()) as ContactStatusResponse;
                if (!status.found) return;

                setTelegramLinked(status.telegramConnected);
                setMaxLinked(status.maxConnected);

                setSelectedReminderMethods((prev) => {
                    const next = new Set(prev);
                    if (status.telegramConnected) next.add("telegram");
                    if (status.maxConnected) next.add("max");
                    return Array.from(next) as ReminderMethod[];
                });
            } catch {
                // ignore contact status lookup errors
            }
        }, 350);

        return () => clearTimeout(timeout);
    }, [phone, email, slug]);

    useEffect(() => {
        const normalized = normalizePhone(phone);
        if (normalized.length < 10) return;

        const store = readPrefillStore();
        const byPhone = store.byPhone[normalized];
        if (!byPhone) return;

        setName((prev) => prev || byPhone.name || "");
        setEmail((prev) => prev || byPhone.email || "");
        setAutofillHint("Нашли ваш прошлый профиль, данные подставлены");
    }, [phone]);

    // Dates that have at least one available slot
    const availableDates = useMemo(() => {
        const set = new Set<string>();
        slots.forEach((s) => set.add(s.date));
        return set;
    }, [slots]);

    // Time slots for a selected date
    const timeSlotsForDate = useMemo(() => {
        if (!selectedDate) return [];
        return slots.filter((s) => s.date === selectedDate);
    }, [selectedDate, slots]);

    // Group time slots: Утро < 12, День 12-17, Вечер ≥ 17
    const groupedSlots = useMemo(() => {
        const groups: { label: string; slots: typeof timeSlotsForDate }[] =
            [];
        const morning = timeSlotsForDate.filter(
            (s) => parseInt(s.time) < 12
        );
        const afternoon = timeSlotsForDate.filter((s) => {
            const h = parseInt(s.time);
            return h >= 12 && h < 17;
        });
        const evening = timeSlotsForDate.filter(
            (s) => parseInt(s.time) >= 17
        );
        if (morning.length) groups.push({ label: "Утро", slots: morning });
        if (afternoon.length)
            groups.push({ label: "День", slots: afternoon });
        if (evening.length) groups.push({ label: "Вечер", slots: evening });
        return groups;
    }, [timeSlotsForDate]);

    // Calendar grid for current viewMonth
    const calendarDays = useMemo(() => {
        const year = viewMonth.getFullYear();
        const month = viewMonth.getMonth();
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);

        // Monday = 0 in our grid
        let startDow = firstDay.getDay() - 1;
        if (startDow < 0) startDow = 6;

        const days: (number | null)[] = [];
        for (let i = 0; i < startDow; i++) days.push(null);
        for (let d = 1; d <= lastDay.getDate(); d++) days.push(d);
        while (days.length % 7 !== 0) days.push(null);
        return days;
    }, [viewMonth]);

    const toDateStr = (day: number) => {
        const y = viewMonth.getFullYear();
        const m = String(viewMonth.getMonth() + 1).padStart(2, "0");
        const d = String(day).padStart(2, "0");
        return `${y}-${m}-${d}`;
    };

    const today = new Date().toISOString().slice(0, 10);

    const formatDateLong = (dateStr: string) => {
        const d = new Date(dateStr + "T00:00:00");
        return `${d.getDate()} ${MONTHS_GEN[d.getMonth()]}, ${WEEKDAYS_FULL[d.getDay()]}`;
    };

    const goBack = () => {
        setSubmitError(null);
        if (step === 3) {
            setStep(2);
        } else if (step === 2) {
            setStep(1);
        } else if (step === 1) {
            setSelectedDate(null);
            setSelectedTime(null);
            setStep(0);
        }
    };

    const openMessengerDeepLink = (method: "telegram" | "max"): boolean => {
        if (typeof window === "undefined") return false;

        if (method === "telegram" && botUsername) {
            window.open(
                `https://t.me/${botUsername}?start=${linkCode}`,
                "_blank",
                "noopener,noreferrer"
            );
            return true;
        }

        if (method === "max" && maxBotUsername) {
            window.open(
                `https://max.ru/${maxBotUsername}?start=${linkCode}`,
                "_blank",
                "noopener,noreferrer"
            );
            return true;
        }

        return false;
    };

    const toggleReminderMethod = (method: ReminderMethod) => {
        setSelectedReminderMethods((prev) => {
            const isSelected = prev.includes(method);
            const next = isSelected
                ? prev.filter((m) => m !== method)
                : [...prev, method];

            if (!isSelected && method === "telegram" && !telegramLinked && !deepLinkOpenedRef.current.telegram) {
                deepLinkOpenedRef.current.telegram = openMessengerDeepLink("telegram");
            }

            if (!isSelected && method === "max" && !maxLinked && !deepLinkOpenedRef.current.max) {
                deepLinkOpenedRef.current.max = openMessengerDeepLink("max");
            }

            return next;
        });
    };

    const handleSubmit = async () => {
        if (!selectedDate || !selectedTime || (!selectedSubject && !selectedPackage)) return;
        setSubmitError(null);

        const trimmedName = name.trim();
        const trimmedPhone = phone.trim();
        const trimmedEmail = email.trim();

        if (!trimmedEmail.includes("@")) {
            setSubmitError("Укажите email — на него придёт код для подтверждения.");
            return;
        }

        const bookingSubject = selectedPackage?.subject || selectedSubject?.name || "";

        setSubmitting(true);
        try {
            const res = await fetch(
                `${API_BASE}/public/tutors/${encodeURIComponent(slug)}/book`,
                {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        subject: bookingSubject,
                        packageId: selectedPackage?.id,
                        date: selectedDate,
                        startTime: selectedTime,
                        clientName: trimmedName,
                        clientPhone: trimmedPhone,
                        clientEmail: trimmedEmail,
                        comment: comment.trim() || undefined,
                        telegramLinkCode:
                            selectedReminderMethods.includes("telegram") && telegramLinked
                                ? linkCode
                                : undefined,
                        maxLinkCode:
                            selectedReminderMethods.includes("max") && maxLinked
                                ? linkCode
                                : undefined,
                        reminderChannels: selectedReminderMethods,
                        reminderMinutesBefore: reminderMinutesBefore,
                    }),
                }
            );
            if (!res.ok) {
                const err = await res.json().catch(() => null);
                throw err || new Error("booking_request_failed");
            }

            const bookingPayload =
                (await res.json().catch(() => null)) as BookingCreateResponse | null;
            if (bookingPayload?.id) setBookingId(bookingPayload.id);

            const normalizedPhone = normalizePhone(trimmedPhone);
            if (trimmedName && normalizedPhone) {
                const store = readPrefillStore();
                const payload: BookingPrefill = {
                    name: trimmedName,
                    phone: trimmedPhone,
                    email: trimmedEmail || undefined,
                    updatedAt: new Date().toISOString(),
                };
                store.byTutor[slug] = payload;
                store.byPhone[normalizedPhone] = payload;
                savePrefillStore(store);
            }

            setOtpCode("");
            setOtpError(null);
            setStep(3);
        } catch (err: any) {
            setSubmitError(codedErrorMessage("PUBLIC-BOOKING", err));
        } finally {
            setSubmitting(false);
        }
    };

    const handleVerifyOtp = async () => {
        const trimmedEmail = email.trim().toLowerCase();
        const code = otpCode.trim();
        if (code.length !== 6) {
            setOtpError("Введите 6-значный код из письма");
            return;
        }
        setOtpError(null);
        setVerifying(true);
        try {
            await verifyBookingEmail(slug, trimmedEmail, code, bookingId || undefined);
            router.push("/student");
        } catch (err: any) {
            setOtpError(codedErrorMessage("PUBLIC-BOOKING-OTP", err));
        } finally {
            setVerifying(false);
        }
    };

    const handleResendOtp = async () => {
        const trimmedEmail = email.trim().toLowerCase();
        if (!trimmedEmail.includes("@")) return;
        setOtpError(null);
        try {
            // Re-issue OTP by re-submitting the booking create endpoint, which
            // silently reuses the cooldown window on the backend.
            await fetch(
                `${API_BASE}/public/tutors/${encodeURIComponent(slug)}/book`,
                {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        subject: selectedPackage?.subject || selectedSubject?.name || "",
                        packageId: selectedPackage?.id,
                        date: selectedDate,
                        startTime: selectedTime,
                        clientName: name.trim(),
                        clientPhone: phone.trim(),
                        clientEmail: trimmedEmail,
                        comment: comment.trim() || undefined,
                    }),
                },
            ).catch(() => null);
        } catch {
            /* noop */
        }
    };

    const needsTelegramConnect =
        selectedReminderMethods.includes("telegram") && !telegramLinked;
    const needsMaxConnect =
        selectedReminderMethods.includes("max") && !maxLinked;
    const needsEmailAddress =
        selectedReminderMethods.includes("email") && !email.trim();

    return (
        <>
            <Head>
                <title>{`Запись — ${t.name || slug} — Repeto`}</title>
            </Head>
            <div className="repeto-portal-page repeto-tp-page repeto-booking-page">
                <PublicPageHeader
                    containerClassName="repeto-tp-container"
                    rightContent={<StudentHeaderRight />}
                />
                {loading && (
                    <div className="repeto-tp-loading">
                        <Text variant="body-2" color="secondary">Загрузка...</Text>
                    </div>
                )}
                {!loading && loadError && (
                    <div className="repeto-tp-loading">
                        <Text variant="header-2" style={{ display: "block", marginBottom: 8 }}>Не удалось открыть запись</Text>
                        <Text variant="body-2" color="secondary" style={{ display: "block", marginBottom: 16 }}>
                            {loadError}
                        </Text>
                        <div className="repeto-bk-error-actions">
                            <Button size="l" onClick={() => window.location.reload()}>
                                Обновить страницу
                            </Button>
                            <Link href={`/t/${slug}`} style={{ textDecoration: "none" }}>
                                <Button view="flat" size="l">К странице преподавателя</Button>
                            </Link>
                        </div>
                    </div>
                )}
                {!loading && !loadError && !profile && (
                    <div className="repeto-tp-loading">
                        <Text variant="header-2" style={{ display: "block", marginBottom: 8 }}>Репетитор не найден</Text>
                        <Link href="/" style={{ color: "var(--g-color-text-brand)", fontSize: 14, textDecoration: "none" }}>На главную</Link>
                    </div>
                )}
                {!loading && !loadError && profile && (
                <>
                {/* Sub-header: back + tutor identity (personal content inside the shared shell) */}
                <div className="repeto-tp-container repeto-bk-subheader">
                    {step > 0 && step <= 3 ? (
                        <Button view="flat" size="m" onClick={goBack} className="repeto-bk-back-btn">
                            <Icon data={ArrowLeft as IconData} size={18} />
                        </Button>
                    ) : step === 0 ? (
                        <Link href={`/t/${slug}`} style={{ textDecoration: "none" }}>
                            <Button view="flat" size="m" className="repeto-bk-back-btn">
                                <Icon data={ArrowLeft as IconData} size={18} />
                            </Button>
                        </Link>
                    ) : null}
                    <div className="repeto-bk-header-info">
                        <Text variant="body-2" className="repeto-bk-header-info__name">{t.name}</Text>
                        {t.tagline && <Text variant="body-1" color="secondary">{t.tagline}</Text>}
                    </div>
                </div>

                {/* Content */}
                <div className="repeto-tp-container repeto-portal-main">
                    {/* ── Step 0: Select subject ── */}
                    {step === 0 && (
                        <div className="repeto-bk-step">
                            <Text variant="header-2" as="div" className="repeto-portal-plain-section-title">
                                Выберите предмет
                            </Text>
                            <div className="repeto-bk-options">
                                {t.subjects.map((s, i) => {
                                    const active = !selectedPackage && selectedSubject?.name === s.name;
                                    return (
                                        <button
                                            key={i}
                                            className={`repeto-bk-option${active ? " repeto-bk-option--active" : ""}`}
                                            onClick={() => { setSelectedPackage(null); setSelectedSubject(s); }}
                                        >
                                            <div className="repeto-bk-option__left">
                                                <span className="repeto-tp-item-icon">
                                                    <Icon data={GraduationCap as IconData} size={18} />
                                                </span>
                                                <div className="repeto-bk-option__text">
                                                    <Text variant="body-2" className="repeto-bk-option__title">{s.name}</Text>
                                                    <Text variant="body-1" color="secondary">
                                                        {s.duration || 60} мин{s.price ? <> · от {s.price.toLocaleString("ru-RU")} ₽</> : null}
                                                    </Text>
                                                </div>
                                            </div>
                                            <span className={`repeto-bk-radio${active ? " repeto-bk-radio--active" : ""}`}>
                                                {active && <span className="repeto-bk-radio__dot" />}
                                            </span>
                                        </button>
                                    );
                                })}

                                {(t.publicPackages || []).length > 0 && (
                                    <>
                                        <Text variant="caption-1" color="secondary" as="div" className="repeto-bk-group-label">
                                            Пакеты занятий
                                        </Text>
                                        {(t.publicPackages || []).map((pkg) => {
                                            const active = selectedPackage?.id === pkg.id;
                                            const hasDiscount = Number(pkg.discountAmount || 0) > 0;
                                            return (
                                                <button
                                                    key={pkg.id}
                                                    className={`repeto-bk-option${active ? " repeto-bk-option--active" : ""}`}
                                                    onClick={() => {
                                                        setSelectedPackage(pkg);
                                                        const match = t.subjects.find((subject) => subject.name === pkg.subject);
                                                        if (match) setSelectedSubject(match);
                                                    }}
                                                >
                                                    <div className="repeto-bk-option__left">
                                                        <span className="repeto-tp-item-icon">
                                                            <Icon data={GraduationCap as IconData} size={18} />
                                                        </span>
                                                        <div className="repeto-bk-option__text">
                                                            <Text variant="body-2" className="repeto-bk-option__title">{pkg.subject}</Text>
                                                            <Text variant="body-1" color="secondary">
                                                                {pkg.lessonsTotal} занятий · {pkg.totalPrice.toLocaleString("ru-RU")} ₽
                                                            </Text>
                                                            {hasDiscount && (
                                                                <Text variant="body-1" color="positive" as="div">
                                                                    Скидка {Number(pkg.discountAmount || 0).toLocaleString("ru-RU")} ₽
                                                                    {Number(pkg.discountPercent || 0) > 0 ? ` (${pkg.discountPercent}%)` : ""}
                                                                </Text>
                                                            )}
                                                            {pkg.comment && (
                                                                <Text variant="body-1" color="secondary" as="div">{pkg.comment}</Text>
                                                            )}
                                                        </div>
                                                    </div>
                                                    <span className={`repeto-bk-radio${active ? " repeto-bk-radio--active" : ""}`}>
                                                        {active && <span className="repeto-bk-radio__dot" />}
                                                    </span>
                                                </button>
                                            );
                                        })}
                                    </>
                                )}
                            </div>
                            <Button
                                view="action"
                                size="xl"
                                className="repeto-bk-action-btn"
                                disabled={!selectedSubject && !selectedPackage}
                                onClick={() => setStep(1)}
                            >
                                Продолжить
                            </Button>
                        </div>
                    )}

                    {/* ── Step 1: Calendar + time slots ── */}
                    {step === 1 && (
                        <div className="repeto-bk-step">
                            {/* Month nav */}
                            <div className="repeto-bk-cal-header">
                                <Text variant="header-2">
                                    {MONTHS_NOM[viewMonth.getMonth()]}
                                    {viewMonth.getFullYear() !== new Date().getFullYear() ? ` ${viewMonth.getFullYear()}` : ""}
                                </Text>
                                <div className="repeto-bk-cal-nav">
                                    <Button
                                        view="outlined"
                                        size="m"
                                        className="repeto-bk-icon-btn"
                                        onClick={() => {
                                            const d = new Date(viewMonth);
                                            d.setMonth(d.getMonth() - 1);
                                            setViewMonth(d);
                                        }}
                                    >
                                        <Icon data={ArrowLeft as IconData} size={16} />
                                    </Button>
                                    <Button
                                        view="outlined"
                                        size="m"
                                        className="repeto-bk-icon-btn"
                                        onClick={() => {
                                            const d = new Date(viewMonth);
                                            d.setMonth(d.getMonth() + 1);
                                            setViewMonth(d);
                                        }}
                                    >
                                        <Icon data={ArrowRight as IconData} size={16} />
                                    </Button>
                                </div>
                            </div>

                            {/* Weekday headers */}
                            <div className="repeto-bk-cal-grid">
                                {DAYS_RU.map((d) => (
                                    <div key={d} className="repeto-bk-cal-weekday">{d}</div>
                                ))}
                            </div>

                            {/* Day grid */}
                            <div className="repeto-bk-cal-grid">
                                {calendarDays.map((day, i) => {
                                    if (day === null) return <div key={i} />;
                                    const dateStr = toDateStr(day);
                                    const isAvailable = availableDates.has(dateStr);
                                    const isPast = dateStr < today;
                                    const isSelected = selectedDate === dateStr;
                                    const isToday = dateStr === today;
                                    return (
                                        <button
                                            key={i}
                                            disabled={!isAvailable || isPast}
                                            className={`repeto-bk-cal-day${isSelected ? " repeto-bk-cal-day--selected" : ""}${isToday && !isSelected ? " repeto-bk-cal-day--today" : ""}${!isAvailable || isPast ? " repeto-bk-cal-day--disabled" : ""}`}
                                            onClick={() => { setSelectedDate(dateStr); setSelectedTime(null); }}
                                        >
                                            {day}
                                        </button>
                                    );
                                })}
                            </div>

                            {/* Time slots */}
                            {selectedDate && groupedSlots.length > 0 && (
                                <div className="repeto-bk-time-groups">
                                    {groupedSlots.map((group) => (
                                        <div key={group.label} className="repeto-bk-time-group">
                                            <Text variant="subheader-2" as="div" style={{ marginBottom: 10 }}>{group.label}</Text>
                                            <div className="repeto-bk-time-slots">
                                                {group.slots.map((slot) => {
                                                    const active = selectedTime === slot.time;
                                                    return (
                                                        <button
                                                            key={slot.time}
                                                            className={`repeto-bk-time-slot${active ? " repeto-bk-time-slot--active" : ""}`}
                                                            onClick={() => setSelectedTime(slot.time)}
                                                        >
                                                            {slot.time}
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {selectedDate && selectedTime && (
                                <Button
                                    view="action"
                                    size="xl"
                                    className="repeto-bk-action-btn"
                                    onClick={() => setStep(2)}
                                >
                                    Продолжить
                                </Button>
                            )}
                        </div>
                    )}

                    {/* ── Step 2: Contact form ── */}
                    {step === 2 && (
                        <div className="repeto-bk-step">
                            <Text variant="header-2" as="div" className="repeto-portal-plain-section-title">
                                Ваши данные
                            </Text>
                            {submitError && (
                                <div style={{ marginBottom: 16 }}>
                                    <Alert theme="danger" title="Не удалось отправить заявку" message={submitError} />
                                </div>
                            )}
                            {autofillHint && (
                                <div className="repeto-bk-autofill-hint">{autofillHint}</div>
                            )}
                            <div className="repeto-bk-form">
                                <AppField label="Имя" required className="repeto-bk-app-field">
                                    <TextInput size="l" value={name} onUpdate={setName} placeholder="Иван Иванов" />
                                </AppField>
                                <AppField label="Телефон" required className="repeto-bk-app-field">
                                    <PhoneInput value={phone} onUpdate={setPhone} />
                                </AppField>
                                <AppField label="E-mail" required className="repeto-bk-app-field">
                                    <TextInput size="l" type="email" value={email} onUpdate={setEmail} placeholder="email@example.com" />
                                </AppField>
                                <AppField label="Комментарий" className="repeto-bk-app-field repeto-bk-app-field--last">
                                    <TextArea size="l" rows={4} value={comment} onUpdate={setComment} placeholder="Комментарий к записи" />
                                </AppField>
                            </div>

                            {/* Reminder methods */}
                            <div className="repeto-bk-reminders">
                                <Text variant="body-2" className="repeto-bk-reminders__title">
                                    Отправить напоминание
                                </Text>
                                <Text variant="body-1" color="secondary" className="repeto-bk-reminders__hint">
                                    Можно выбрать несколько способов уведомления
                                </Text>
                                <div className="repeto-bk-chips">
                                    {REMINDER_METHODS.map((method) => {
                                        const active = selectedReminderMethods.includes(method.id);
                                        return (
                                            <button
                                                key={method.id}
                                                type="button"
                                                className={`repeto-bk-chip${active ? " repeto-bk-chip--active" : ""}`}
                                                onClick={() => toggleReminderMethod(method.id)}
                                            >
                                                {method.label}
                                            </button>
                                        );
                                    })}
                                </div>
                                {selectedReminderMethods.length > 0 && (
                                    <div className="repeto-bk-chips" style={{ marginTop: 8 }}>
                                        {REMINDER_TIME_OPTIONS.map((option) => (
                                            <button
                                                key={option.minutes}
                                                type="button"
                                                className={`repeto-bk-chip repeto-bk-chip--sm${reminderMinutesBefore === option.minutes ? " repeto-bk-chip--active" : ""}`}
                                                onClick={() => setReminderMinutesBefore(option.minutes)}
                                            >
                                                {option.label}
                                            </button>
                                        ))}
                                    </div>
                                )}
                                {(needsTelegramConnect || needsMaxConnect || needsEmailAddress) && (
                                    <Text variant="body-1" color="danger" style={{ display: "block", marginTop: 10 }}>
                                        {needsTelegramConnect && "Подключите Telegram для выбранного канала. "}
                                        {needsMaxConnect && "Подключите Макс для выбранного канала. "}
                                        {needsEmailAddress && "Укажите email для уведомлений по почте."}
                                    </Text>
                                )}
                            </div>

                            <div style={{ marginBottom: 24 }}>
                                <Checkbox checked={consent} onUpdate={setConsent} size="l">
                                    Я предоставляю согласие на обработку персональных данных
                                </Checkbox>
                            </div>

                            {/* Summary */}
                            <div className="repeto-bk-summary">
                                <span className="repeto-bk-summary__label">Итого</span>
                                {selectedPackage ? (
                                    <span className="repeto-bk-summary__price">
                                        {Number(selectedPackage.discountAmount || 0) > 0 && Number(selectedPackage.originalTotalPrice || 0) > selectedPackage.totalPrice ? (
                                            <span className="repeto-bk-summary__old-price">
                                                {Number(selectedPackage.originalTotalPrice || 0).toLocaleString("ru-RU")} ₽
                                            </span>
                                        ) : null}
                                        <span>{selectedPackage.totalPrice.toLocaleString("ru-RU")} ₽</span>
                                    </span>
                                ) : (
                                    <span className="repeto-bk-summary__label">
                                        {selectedSubject ? `${selectedSubject.price.toLocaleString("ru-RU")} ₽` : "—"}
                                    </span>
                                )}
                            </div>

                            {selectedPackage && Number(selectedPackage.discountAmount || 0) > 0 && (
                                <Text variant="body-1" color="positive" style={{ display: "block", marginBottom: 16 }}>
                                    Вы экономите {Number(selectedPackage.discountAmount || 0).toLocaleString("ru-RU")} ₽
                                    {Number(selectedPackage.discountPercent || 0) > 0 ? ` (${selectedPackage.discountPercent}%)` : ""}
                                </Text>
                            )}

                            <Button
                                view="action"
                                size="xl"
                                className="repeto-bk-action-btn"
                                loading={submitting}
                                disabled={!name.trim() || !phone.trim() || !email.trim() || !consent || needsTelegramConnect || needsMaxConnect || needsEmailAddress}
                                onClick={handleSubmit}
                            >
                                Подтвердить почту
                            </Button>
                        </div>
                    )}

                    {/* ── Step 3: OTP verification ── */}
                    {step === 3 && (
                        <div className="repeto-bk-step repeto-bk-step--otp">
                            <Text variant="header-2" as="div" className="repeto-portal-plain-section-title">
                                Введите код из письма
                            </Text>
                            <Text variant="body-1" color="secondary" className="repeto-bk-otp-hint">
                                Мы отправили 6-значный код на {email.trim()}. Он войдёт в ваш кабинет и покажет эту заявку.
                            </Text>

                            <AppField label="Код" required className="repeto-bk-app-field repeto-bk-app-field--otp">
                                <TextInput
                                    size="l"
                                    placeholder="000000"
                                    value={otpCode}
                                    onUpdate={(value) => setOtpCode(value.replace(/\D/g, "").slice(0, 6))}
                                    autoComplete="one-time-code"
                                    autoFocus
                                />
                            </AppField>

                            {otpError && (
                                <div style={{ marginBottom: 16 }}>
                                    <Alert theme="danger" title="Не удалось подтвердить" message={otpError} />
                                </div>
                            )}

                            <Button
                                view="action"
                                size="xl"
                                className="repeto-bk-action-btn"
                                loading={verifying}
                                disabled={otpCode.length !== 6}
                                onClick={handleVerifyOtp}
                            >
                                Войти в кабинет
                            </Button>

                            <div className="repeto-bk-otp-links">
                                <button type="button" className="repeto-bk-text-link" onClick={() => setStep(2)}>
                                    Изменить почту
                                </button>
                                <button type="button" className="repeto-bk-text-link" onClick={handleResendOtp}>
                                    Прислать ещё раз
                                </button>
                            </div>
                        </div>
                    )}
                </div>
                </>
                )}

                <PublicPageFooter />
            </div>
        </>
    );
};

export default BookingPage;
