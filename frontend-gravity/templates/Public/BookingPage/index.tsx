import { useState, useMemo, useEffect, useRef } from "react";
import Head from "next/head";
import Link from "next/link";
import {
    Card,
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
    CircleCheck,
} from "@gravity-ui/icons";
import type { IconData } from "@gravity-ui/uikit";
import {
    clearPortalTokenForTutor,
    getPortalTokenForTutor,
    setPortalTokenForTutor,
} from "@/lib/portalTokenStore";
import { codedErrorMessage } from "@/lib/errorCodes";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3200/api";

type SlotData = { date: string; time: string; duration: number };
type TutorProfile = {
    name: string;
    subjects: { name: string; duration: number; price: number }[];
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
    portalToken?: string | null;
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
    portalToken?: string | null;
};

type ReminderMethod = "telegram" | "max" | "email" | "push";

type PortalPrefillResponse = {
    studentName?: string;
    studentPhone?: string;
    studentEmail?: string;
    tutorSlug?: string;
    notifications?: {
        telegram?: { connected: boolean };
        max?: { connected: boolean };
    };
};

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

const PANEL_STYLE = {
    padding: 24,
    borderRadius: 16,
    background: "var(--g-color-base-float)",
} as const;

const ACTION_BUTTON_STYLE = {
    width: "100%",
    justifyContent: "center",
    fontWeight: 600,
    height: 48,
    borderRadius: 12,
} as const;

const FIELD_LABEL_STYLE = {
    display: "block",
    marginBottom: 8,
    fontSize: 13,
    fontWeight: 600,
    color: "var(--g-color-text-primary)",
} as const;

const ICON_BUTTON_STYLE = {
    width: 36,
    minWidth: 36,
    height: 36,
    padding: 0,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    lineHeight: 0,
} as const;

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
    localStorage.setItem(BOOKING_PREFILL_STORAGE_KEY, JSON.stringify(store));
}

const BookingPage = ({ slug }: { slug: string }) => {
    const [profile, setProfile] = useState<TutorProfile | null>(null);
    const [slots, setSlots] = useState<SlotData[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        (async () => {
            try {
                const [profileRes, slotsRes, botInfoRes] = await Promise.all([
                    fetch(`${API_BASE}/public/tutors/${encodeURIComponent(slug)}`).then((r) => r.json()),
                    fetch(`${API_BASE}/public/tutors/${encodeURIComponent(slug)}/slots`).then((r) => r.json()),
                    fetch(`${API_BASE}/public/bot-info`).then((r) => r.json()).catch(() => null),
                ]);
                setProfile(profileRes);
                setSlots(slotsRes);
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
            } catch (err) {
                console.error("Failed to load booking data:", err);
            } finally {
                setLoading(false);
            }
        })();
    }, [slug]);

    const t = profile || { name: "", subjects: [], tagline: "" };

    const [step, setStep] = useState(0);
    const [selectedSubject, setSelectedSubject] = useState<
        (typeof t.subjects)[0] | null
    >(null);
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
    const [consent, setConsent] = useState(false);
    const [autofillHint, setAutofillHint] = useState<string | null>(null);

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

                if (status.portalToken) {
                    setPortalTokenForTutor(slug, status.portalToken);
                }

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
        const token = getPortalTokenForTutor(slug);
        if (!token) return;

        let cancelled = false;

        (async () => {
            try {
                const res = await fetch(
                    `${API_BASE}/portal/${encodeURIComponent(token)}`
                );

                if (!res.ok) {
                    if (res.status === 404 || res.status === 400) {
                        clearPortalTokenForTutor(slug);
                    }
                    return;
                }

                const portalData =
                    (await res.json()) as PortalPrefillResponse;

                if (cancelled) return;
                if (portalData.tutorSlug && portalData.tutorSlug !== slug) {
                    return;
                }

                const nextName = portalData.studentName?.trim() || "";
                const nextPhone = portalData.studentPhone?.trim() || "";
                const nextEmail = portalData.studentEmail?.trim() || "";

                if (nextName) setName((prev) => prev || nextName);
                if (nextPhone) setPhone((prev) => prev || nextPhone);
                if (nextEmail) setEmail((prev) => prev || nextEmail);

                if (portalData.notifications?.telegram?.connected) {
                    setTelegramLinked(true);
                    setSelectedReminderMethods((prev) =>
                        prev.includes("telegram") ? prev : [...prev, "telegram"]
                    );
                }
                if (portalData.notifications?.max?.connected) {
                    setMaxLinked(true);
                    setSelectedReminderMethods((prev) =>
                        prev.includes("max") ? prev : [...prev, "max"]
                    );
                }

                if (nextName || nextPhone || nextEmail) {
                    setAutofillHint("Подтянули ваши данные из профиля ученика");

                    if (nextName) {
                        const store = readPrefillStore();
                        const payload: BookingPrefill = {
                            name: nextName,
                            phone: nextPhone,
                            email: nextEmail || undefined,
                            updatedAt: new Date().toISOString(),
                        };
                        store.byTutor[slug] = payload;
                        const normalizedPhone = normalizePhone(nextPhone);
                        if (normalizedPhone) {
                            store.byPhone[normalizedPhone] = payload;
                        }
                        savePrefillStore(store);
                    }
                }
            } catch {
                // ignore background prefill errors
            }
        })();

        return () => {
            cancelled = true;
        };
    }, [slug]);

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
        if (step === 2) {
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
        if (!selectedDate || !selectedTime || !selectedSubject) return;

        const trimmedName = name.trim();
        const trimmedPhone = phone.trim();
        const trimmedEmail = email.trim();

        try {
            const res = await fetch(
                `${API_BASE}/public/tutors/${encodeURIComponent(slug)}/book`,
                {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        subject: selectedSubject.name,
                        date: selectedDate,
                        startTime: selectedTime,
                        clientName: trimmedName,
                        clientPhone: trimmedPhone,
                        clientEmail: trimmedEmail || undefined,
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
            if (bookingPayload?.portalToken) {
                setPortalTokenForTutor(slug, bookingPayload.portalToken);
            }

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

            setStep(3);
        } catch (err: any) {
            alert(codedErrorMessage("PUBLIC-BOOKING", err));
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
            <div
                style={{
                    minHeight: "100vh",
                    background: "var(--g-color-base-background)",
                    display: "flex",
                    flexDirection: "column",
                }}
            >
                {loading && (
                    <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <Text variant="body-2" color="secondary">Загрузка...</Text>
                    </div>
                )}
                {!loading && !profile && (
                    <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <div style={{ textAlign: "center" }}>
                            <Text variant="header-2" style={{ display: "block", marginBottom: 8 }}>Репетитор не найден</Text>
                            <Link href="/" style={{ color: "var(--g-color-text-brand)", fontSize: 14, textDecoration: "none" }}>На главную</Link>
                        </div>
                    </div>
                )}
                {!loading && profile && (
                <>
                {/* Header bar */}
                <div
                    style={{
                        borderBottom: "1px solid var(--g-color-line-generic)",
                        background: "var(--g-color-base-float)",
                    }}
                >
                    <div
                        style={{
                            maxWidth: 768,
                            margin: "0 auto",
                            padding: "16px 24px",
                            display: "flex",
                            alignItems: "center",
                            gap: 12,
                        }}
                    >
                        {step > 0 && step < 3 ? (
                            <Button
                                view="flat"
                                size="l"
                                onClick={goBack}
                                style={ICON_BUTTON_STYLE}
                            >
                                <Icon data={ArrowLeft as IconData} size={16} style={{ display: "block" }} />
                            </Button>
                        ) : step === 0 ? (
                            <Link href={`/t/${slug}`} style={{ textDecoration: "none" }}>
                                <Button
                                    view="flat"
                                    size="l"
                                    style={ICON_BUTTON_STYLE}
                                >
                                    <Icon data={ArrowLeft as IconData} size={16} style={{ display: "block" }} />
                                </Button>
                            </Link>
                        ) : null}
                        <div style={{ minWidth: 0 }}>
                            <div
                                style={{
                                    fontSize: 14,
                                    fontWeight: 700,
                                    whiteSpace: "nowrap",
                                    overflow: "hidden",
                                    textOverflow: "ellipsis",
                                }}
                            >
                                {t.name}
                            </div>
                            <div
                                style={{
                                    fontSize: 12,
                                    color: "var(--g-color-text-secondary)",
                                    whiteSpace: "nowrap",
                                    overflow: "hidden",
                                    textOverflow: "ellipsis",
                                }}
                            >
                                {t.tagline}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Content */}
                <div
                    style={{
                        flex: 1,
                        maxWidth: 768,
                        width: "100%",
                        margin: "0 auto",
                        padding: "24px",
                    }}
                >
                    {/* ── Step 0: Select subject ── */}
                    {step === 0 && (
                        <Card view="outlined" style={PANEL_STYLE}>
                            <Text variant="header-2" style={{ display: "block", marginBottom: 20 }}>
                                Выберите предмет
                            </Text>
                            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                                {t.subjects.map((s, i) => {
                                    const active =
                                        selectedSubject?.name === s.name;
                                    return (
                                        <button
                                            key={i}
                                            style={{
                                                width: "100%",
                                                display: "flex",
                                                alignItems: "center",
                                                justifyContent: "space-between",
                                                padding: "16px 18px",
                                                textAlign: "left",
                                                borderRadius: 12,
                                                border: `1px solid ${active ? "var(--g-color-text-brand)" : "var(--g-color-line-generic)"}`,
                                                background: "var(--g-color-base-float)",
                                                cursor: "pointer",
                                                transition: "border-color 0.15s, background 0.15s",
                                            }}
                                            onClick={() =>
                                                setSelectedSubject(s)
                                            }
                                        >
                                            <div style={{ display: "flex", alignItems: "center", gap: 14, minWidth: 0 }}>
                                                <div
                                                    style={{
                                                        width: 40,
                                                        height: 40,
                                                        borderRadius: 10,
                                                        display: "flex",
                                                        alignItems: "center",
                                                        justifyContent: "center",
                                                        background: "rgba(174,122,255,0.1)",
                                                        flexShrink: 0,
                                                    }}
                                                >
                                                    <Icon
                                                        data={GraduationCap as IconData}
                                                        size={20}
                                                        style={{ color: "var(--g-color-text-brand)" }}
                                                    />
                                                </div>
                                                <div style={{ minWidth: 0 }}>
                                                    <div style={{ fontSize: 14, fontWeight: 700, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                                        {s.name}
                                                    </div>
                                                    <div style={{ fontSize: 12, color: "var(--g-color-text-secondary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                                        {s.duration || 60} мин{s.price ? <> · от {s.price.toLocaleString("ru-RU")} ₽</> : null}
                                                    </div>
                                                </div>
                                            </div>
                                            {/* Radio indicator */}
                                            <div
                                                style={{
                                                    width: 20,
                                                    height: 20,
                                                    borderRadius: "50%",
                                                    border: `1px solid ${active ? "var(--g-color-base-brand)" : "var(--g-color-line-generic)"}`,
                                                    background: active ? "var(--g-color-base-brand)" : "transparent",
                                                    display: "flex",
                                                    alignItems: "center",
                                                    justifyContent: "center",
                                                    flexShrink: 0,
                                                }}
                                            >
                                                {active && (
                                                    <div style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--g-color-text-light-primary)" }} />
                                                )}
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>
                            <Button
                                view="action"
                                size="xl"
                                style={{ ...ACTION_BUTTON_STYLE, marginTop: 24 }}
                                disabled={!selectedSubject}
                                onClick={() => setStep(1)}
                            >
                                Продолжить
                            </Button>
                        </Card>
                    )}

                    {/* ── Step 1: Calendar + time slots ── */}
                    {step === 1 && (
                        <Card view="outlined" style={PANEL_STYLE}>
                            {/* Month nav */}
                            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
                                <Text variant="header-2">
                                    {MONTHS_NOM[viewMonth.getMonth()]}
                                    {viewMonth.getFullYear() !==
                                    new Date().getFullYear()
                                        ? ` ${viewMonth.getFullYear()}`
                                        : ""}
                                </Text>
                                <div style={{ display: "flex", gap: 8 }}>
                                    <Button
                                        view="outlined"
                                        size="l"
                                        style={ICON_BUTTON_STYLE}
                                        onClick={() => {
                                            const d = new Date(viewMonth);
                                            d.setMonth(d.getMonth() - 1);
                                            setViewMonth(d);
                                        }}
                                    >
                                        <Icon data={ArrowLeft as IconData} size={16} style={{ display: "block" }} />
                                    </Button>
                                    <Button
                                        view="outlined"
                                        size="l"
                                        style={ICON_BUTTON_STYLE}
                                        onClick={() => {
                                            const d = new Date(viewMonth);
                                            d.setMonth(d.getMonth() + 1);
                                            setViewMonth(d);
                                        }}
                                    >
                                        <Icon data={ArrowRight as IconData} size={16} style={{ display: "block" }} />
                                    </Button>
                                </div>
                            </div>

                            {/* Weekday headers */}
                            <div style={{ display: "grid", gridTemplateColumns: "repeat(7, minmax(0, 1fr))", textAlign: "center", marginBottom: 4 }}>
                                {DAYS_RU.map((d) => (
                                    <div
                                        key={d}
                                        style={{ padding: "8px 4px", fontSize: 12, fontWeight: 700, color: "var(--g-color-text-secondary)" }}
                                    >
                                        {d}
                                    </div>
                                ))}
                            </div>

                            {/* Day grid */}
                            <div style={{ display: "grid", gridTemplateColumns: "repeat(7, minmax(0, 1fr))", textAlign: "center" }}>
                                {calendarDays.map((day, i) => {
                                    if (day === null)
                                        return <div key={i} />;
                                    const dateStr = toDateStr(day);
                                    const isAvailable =
                                        availableDates.has(dateStr);
                                    const isPast = dateStr < today;
                                    const isSelected =
                                        selectedDate === dateStr;
                                    const isToday = dateStr === today;
                                    return (
                                        <button
                                            key={i}
                                            disabled={!isAvailable || isPast}
                                            style={{
                                                padding: "10px 4px",
                                                fontSize: 16,
                                                fontWeight: 700,
                                                border: "none",
                                                borderRadius: 8,
                                                background: isSelected
                                                    ? "var(--g-color-base-brand)"
                                                    : "transparent",
                                                color: isSelected
                                                    ? "var(--g-color-text-light-primary)"
                                                    : isAvailable && !isPast
                                                    ? isToday
                                                        ? "var(--g-color-text-brand)"
                                                        : "var(--g-color-text-primary)"
                                                    : "var(--g-color-text-hint)",
                                                cursor: !isAvailable || isPast ? "default" : "pointer",
                                                opacity: !isAvailable || isPast ? 0.5 : 1,
                                                transition: "background 0.15s, color 0.15s, opacity 0.15s",
                                            }}
                                            onClick={() => {
                                                setSelectedDate(dateStr);
                                                setSelectedTime(null);
                                            }}
                                        >
                                            {day}
                                        </button>
                                    );
                                })}
                            </div>

                            {/* Time slots grouped by period */}
                            {selectedDate && groupedSlots.length > 0 && (
                                <div style={{ marginTop: 24, display: "flex", flexDirection: "column", gap: 20 }}>
                                    {groupedSlots.map((group) => (
                                        <div key={group.label}>
                                            <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 10 }}>
                                                {group.label}
                                            </div>
                                            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                                                {group.slots.map((slot) => {
                                                    const active =
                                                        selectedTime ===
                                                        slot.time;
                                                    return (
                                                        <button
                                                            key={slot.time}
                                                            style={{
                                                                height: 40,
                                                                minWidth: 88,
                                                                padding: "0 20px",
                                                                borderRadius: 10,
                                                                border: `1px solid ${active ? "var(--g-color-base-brand)" : "var(--g-color-line-generic)"}`,
                                                                background: active
                                                                    ? "var(--g-color-base-brand)"
                                                                    : "var(--g-color-base-float)",
                                                                color: active
                                                                    ? "var(--g-color-text-light-primary)"
                                                                    : "var(--g-color-text-primary)",
                                                                fontSize: 14,
                                                                fontWeight: 700,
                                                                cursor: "pointer",
                                                                transition: "all 0.15s",
                                                            }}
                                                            onClick={() =>
                                                                setSelectedTime(
                                                                    slot.time
                                                                )
                                                            }
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
                                    style={{ ...ACTION_BUTTON_STYLE, marginTop: 24 }}
                                    onClick={() => setStep(2)}
                                >
                                    Продолжить
                                </Button>
                            )}
                        </Card>
                    )}

                    {/* ── Step 2: Contact form ── */}
                    {step === 2 && (
                        <Card view="outlined" style={PANEL_STYLE}>
                            <Text variant="header-2" style={{ display: "block", marginBottom: 20 }}>Ваши данные</Text>
                            {autofillHint && (
                                <div
                                    style={{
                                        marginBottom: 16,
                                        padding: "12px",
                                        fontSize: 12,
                                        fontWeight: 700,
                                        border: "1px dashed var(--g-color-line-generic)",
                                        borderRadius: 8,
                                        background: "var(--g-color-base-simple-hover)",
                                    }}
                                >
                                    {autofillHint}
                                </div>
                            )}
                            <label style={{ display: "block", marginBottom: 16 }}>
                                <span style={FIELD_LABEL_STYLE}>Имя *</span>
                                <TextInput
                                    size="l"
                                    value={name}
                                    onUpdate={setName}
                                    placeholder="Иван Иванов"
                                />
                            </label>
                            <label style={{ display: "block", marginBottom: 16 }}>
                                <span style={FIELD_LABEL_STYLE}>Телефон *</span>
                                <TextInput
                                    size="l"
                                    type="tel"
                                    value={phone}
                                    onUpdate={setPhone}
                                    placeholder="+7 900 123-45-67"
                                />
                            </label>
                            <label style={{ display: "block", marginBottom: 16 }}>
                                <span style={FIELD_LABEL_STYLE}>E-mail</span>
                                <TextInput
                                    size="l"
                                    type="email"
                                    value={email}
                                    onUpdate={setEmail}
                                    placeholder="email@example.com"
                                />
                            </label>
                            <label style={{ display: "block", marginBottom: 20 }}>
                                <span style={FIELD_LABEL_STYLE}>Комментарий</span>
                                <TextArea
                                    size="l"
                                    rows={4}
                                    value={comment}
                                    onUpdate={setComment}
                                    placeholder="Комментарий к записи"
                                />
                            </label>

                            {/* Reminder methods and timing */}
                            <div style={{ marginBottom: 20 }}>
                                <Text variant="body-2" style={{ fontWeight: 700, display: "block", marginBottom: 6 }}>
                                    Отправить напоминание
                                </Text>
                                <Text variant="body-1" color="secondary" style={{ display: "block", marginBottom: 12, fontSize: 13 }}>
                                    Можно выбрать несколько способов уведомления
                                </Text>

                                <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 10 }}>
                                    {REMINDER_METHODS.map((method) => {
                                        const active = selectedReminderMethods.includes(method.id);

                                        return (
                                            <button
                                                key={method.id}
                                                type="button"
                                                style={{
                                                    height: 40,
                                                    padding: "0 14px",
                                                    display: "inline-flex",
                                                    alignItems: "center",
                                                    justifyContent: "center",
                                                    border: `1px solid ${active ? "var(--g-color-base-brand)" : "var(--g-color-line-generic)"}`,
                                                    borderRadius: 10,
                                                    fontSize: 14,
                                                    fontWeight: 700,
                                                    lineHeight: 1,
                                                    background: active
                                                        ? "var(--g-color-base-brand)"
                                                        : "transparent",
                                                    color: active
                                                        ? "var(--g-color-text-light-primary)"
                                                        : "var(--g-color-text-primary)",
                                                    cursor: "pointer",
                                                }}
                                                onClick={() => toggleReminderMethod(method.id)}
                                            >
                                                {method.label}
                                            </button>
                                        );
                                    })}
                                </div>

                                {selectedReminderMethods.length > 0 && (
                                    <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                                        {REMINDER_TIME_OPTIONS.map((option) => (
                                            <button
                                                key={option.minutes}
                                                type="button"
                                                style={{
                                                    height: 40,
                                                    padding: "0 14px",
                                                    display: "inline-flex",
                                                    alignItems: "center",
                                                    justifyContent: "center",
                                                    border: `1px solid ${
                                                        reminderMinutesBefore === option.minutes
                                                            ? "var(--g-color-base-brand)"
                                                            : "var(--g-color-line-generic)"
                                                    }`,
                                                    borderRadius: 10,
                                                    fontSize: 12,
                                                    fontWeight: 700,
                                                    lineHeight: 1,
                                                    background:
                                                        reminderMinutesBefore === option.minutes
                                                            ? "var(--g-color-base-brand)"
                                                            : "transparent",
                                                    color:
                                                        reminderMinutesBefore === option.minutes
                                                            ? "var(--g-color-text-light-primary)"
                                                            : "var(--g-color-text-primary)",
                                                    cursor: "pointer",
                                                }}
                                                onClick={() => setReminderMinutesBefore(option.minutes)}
                                            >
                                                {option.label}
                                            </button>
                                        ))}
                                    </div>
                                )}

                                {(needsTelegramConnect || needsMaxConnect || needsEmailAddress) && (
                                    <Text variant="body-1" color="danger" style={{ display: "block", marginTop: 10, fontSize: 12 }}>
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
                            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 0", borderTop: "1px solid var(--g-color-line-generic)", marginBottom: 20 }}>
                                <span style={{ fontSize: 14, fontWeight: 700 }}>Итого</span>
                                <span style={{ fontSize: 14, fontWeight: 700 }}>
                                    {selectedSubject
                                        ? `${selectedSubject.price.toLocaleString("ru-RU")} ₽`
                                        : "—"}
                                </span>
                            </div>

                            <Button
                                view="action"
                                size="xl"
                                style={ACTION_BUTTON_STYLE}
                                disabled={
                                    !name.trim() ||
                                    !phone.trim() ||
                                    !consent ||
                                    needsTelegramConnect ||
                                    needsMaxConnect ||
                                    needsEmailAddress
                                }
                                onClick={handleSubmit}
                            >
                                Записаться
                            </Button>
                        </Card>
                    )}

                    {/* ── Step 3: Confirmation ── */}
                    {step === 3 && (
                        <Card view="outlined" style={{ ...PANEL_STYLE, textAlign: "center", paddingTop: 40, paddingBottom: 40 }}>
                            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 64, height: 64, margin: "0 auto 20px", borderRadius: 12, background: "rgba(34,197,94,0.15)" }}>
                                <Icon
                                    data={CircleCheck as IconData}
                                    size={24}
                                    style={{ color: "#22C55E" }}
                                />
                            </div>
                            <Text variant="header-1" style={{ display: "block", marginBottom: 8 }}>Заявка отправлена!</Text>
                            {selectedDate && selectedTime && (
                                <Text variant="body-2" color="secondary" style={{ display: "block", marginBottom: 4 }}>
                                    {selectedSubject?.name} ·{" "}
                                    {formatDateLong(selectedDate)} ·{" "}
                                    {selectedTime}
                                </Text>
                            )}
                            <Text variant="body-2" color="secondary" style={{ display: "block", marginBottom: 28 }}>
                                Репетитор подтвердит запись и свяжется с
                                вами.
                            </Text>
                            <Link href={`/t/${slug}`} style={{ display: "inline-block", textDecoration: "none" }}>
                                <Button view="outlined" size="l" style={{ borderRadius: 10 }}>
                                    Вернуться к профилю
                                </Button>
                            </Link>
                        </Card>
                    )}
                </div>
                </>
                )}

                {/* Footer */}
                <div style={{ padding: "24px", textAlign: "center", fontSize: 12, color: "var(--g-color-text-secondary)" }}>
                    Работает на{" "}
                    <Link
                        href="/"
                        style={{ fontWeight: 700, color: "var(--g-color-text-brand)", textDecoration: "none" }}
                    >
                        Repeto
                    </Link>
                </div>
            </div>
        </>
    );
};

export default BookingPage;
