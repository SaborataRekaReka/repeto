import { useState, useMemo, useEffect } from "react";
import Head from "next/head";
import Link from "next/link";
import Icon from "@/components/Icon";
import Field from "@/components/Field";
import Checkbox from "@/components/Checkbox";
import {
    clearPortalTokenForTutor,
    getPortalTokenForTutor,
    setPortalTokenForTutor,
} from "@/lib/portalTokenStore";

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

type PortalPrefillResponse = {
    studentName?: string;
    studentPhone?: string;
    studentEmail?: string;
    tutorSlug?: string;
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
                const [profileRes, slotsRes] = await Promise.all([
                    fetch(`${API_BASE}/public/tutors/${encodeURIComponent(slug)}`).then((r) => r.json()),
                    fetch(`${API_BASE}/public/tutors/${encodeURIComponent(slug)}/slots`).then((r) => r.json()),
                ]);
                setProfile(profileRes);
                setSlots(slotsRes);
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
    const [reminderChannel, setReminderChannel] = useState<string | null>(null);
    const [reminderTime, setReminderTime] = useState("3h");
    const [autofillHint, setAutofillHint] = useState<string | null>(null);

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
                    }),
                }
            );
            if (!res.ok) {
                const err = await res.json().catch(() => null);
                throw new Error(err?.message || "Ошибка бронирования");
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
            alert(err.message || "Не удалось отправить заявку");
        }
    };

    return (
        <>
            <Head>
                <title>{`Запись — ${t.name || slug} — Repeto`}</title>
            </Head>
            <div className="min-h-screen bg-background dark:bg-n-2 flex flex-col">
                {loading && (
                    <div className="flex-1 flex items-center justify-center">
                        <div className="text-sm text-n-3">Загрузка...</div>
                    </div>
                )}
                {!loading && !profile && (
                    <div className="flex-1 flex items-center justify-center">
                        <div className="text-center">
                            <div className="text-h5 mb-2">Репетитор не найден</div>
                            <Link href="/" className="text-purple-1 text-sm">На главную</Link>
                        </div>
                    </div>
                )}
                {!loading && profile && (
                <>
                {/* Header bar */}
                <div className="border-b border-n-1 bg-white dark:bg-n-1 dark:border-white">
                    <div className="max-w-2xl mx-auto px-6 py-4 md:px-4 flex items-center gap-4">
                        {step > 0 && step < 3 ? (
                            <button
                                className="btn-transparent-dark btn-square btn-small cursor-pointer"
                                onClick={goBack}
                            >
                                <Icon name="arrow-prev" />
                            </button>
                        ) : step === 0 ? (
                            <Link
                                href={`/t/${slug}`}
                                className="btn-transparent-dark btn-square btn-small"
                            >
                                <Icon name="arrow-prev" />
                            </Link>
                        ) : null}
                        <div className="min-w-0">
                            <div className="text-sm font-bold truncate">
                                {t.name}
                            </div>
                            <div className="text-xs text-n-3 dark:text-white/50 truncate">
                                {t.tagline}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 max-w-2xl w-full mx-auto px-6 py-6 md:px-4">
                    {/* ── Step 0: Select subject ── */}
                    {step === 0 && (
                        <>
                            <h2 className="text-h5 mb-5">
                                Выберите предмет
                            </h2>
                            <div className="space-y-3">
                                {t.subjects.map((s, i) => {
                                    const active =
                                        selectedSubject?.name === s.name;
                                    return (
                                        <button
                                            key={i}
                                            className={`card w-full flex items-center justify-between p-5 text-left transition-colors cursor-pointer ${
                                                active
                                                    ? "!border-purple-1"
                                                    : "hover:border-purple-1/50"
                                            }`}
                                            onClick={() =>
                                                setSelectedSubject(s)
                                            }
                                        >
                                            <div className="flex items-center gap-4">
                                                <div className="flex items-center justify-center w-10 h-10 rounded-sm bg-purple-3 dark:bg-purple-1/20">
                                                    <Icon
                                                        className="icon-20 dark:fill-white"
                                                        name="certificate"
                                                    />
                                                </div>
                                                <div>
                                                    <div className="text-sm font-bold">
                                                        {s.name}
                                                    </div>
                                                    <div className="text-xs text-n-3 dark:text-white/50">
                                                        {s.duration || 60} мин{s.price ? <> · от {s.price.toLocaleString("ru-RU")} ₽</> : null}
                                                    </div>
                                                </div>
                                            </div>
                                            {/* Radio indicator */}
                                            <div
                                                className={`flex items-center justify-center w-5 h-5 rounded-full border transition-colors ${
                                                    active
                                                        ? "bg-n-1 border-n-1 dark:bg-white dark:border-white"
                                                        : "border-n-1 dark:border-white"
                                                }`}
                                            >
                                                {active && (
                                                    <div className="w-2 h-2 rounded-full bg-white dark:bg-n-1" />
                                                )}
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>
                            <button
                                className="btn-purple w-full mt-6 cursor-pointer"
                                disabled={!selectedSubject}
                                onClick={() => setStep(1)}
                            >
                                Продолжить
                            </button>
                        </>
                    )}

                    {/* ── Step 1: Calendar + time slots ── */}
                    {step === 1 && (
                        <>
                            {/* Month nav */}
                            <div className="flex items-center justify-between mb-5">
                                <h2 className="text-h5">
                                    {MONTHS_NOM[viewMonth.getMonth()]}
                                    {viewMonth.getFullYear() !==
                                    new Date().getFullYear()
                                        ? ` ${viewMonth.getFullYear()}`
                                        : ""}
                                </h2>
                                <div className="flex gap-2">
                                    <button
                                        className="btn-stroke btn-square btn-small cursor-pointer"
                                        onClick={() => {
                                            const d = new Date(viewMonth);
                                            d.setMonth(d.getMonth() - 1);
                                            setViewMonth(d);
                                        }}
                                    >
                                        <Icon name="arrow-prev" />
                                    </button>
                                    <button
                                        className="btn-stroke btn-square btn-small cursor-pointer"
                                        onClick={() => {
                                            const d = new Date(viewMonth);
                                            d.setMonth(d.getMonth() + 1);
                                            setViewMonth(d);
                                        }}
                                    >
                                        <Icon name="arrow-next" />
                                    </button>
                                </div>
                            </div>

                            {/* Weekday headers */}
                            <div className="grid grid-cols-7 text-center mb-1">
                                {DAYS_RU.map((d) => (
                                    <div
                                        key={d}
                                        className="py-2 text-xs font-bold text-n-3 dark:text-white/50"
                                    >
                                        {d}
                                    </div>
                                ))}
                            </div>

                            {/* Day grid */}
                            <div className="grid grid-cols-7 text-center">
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
                                            className={`py-2.5 text-sm transition-colors cursor-pointer disabled:cursor-default ${
                                                isSelected
                                                    ? "bg-n-1 text-white rounded-sm font-bold dark:bg-white dark:text-n-1"
                                                    : isAvailable && !isPast
                                                      ? `font-bold hover:bg-purple-3 dark:hover:bg-purple-1/20 ${isToday ? "text-purple-1" : ""}`
                                                      : "text-n-3/40 dark:text-white/20"
                                            }`}
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
                                <div className="mt-6 space-y-5">
                                    {groupedSlots.map((group) => (
                                        <div key={group.label}>
                                            <div className="text-sm font-bold mb-3">
                                                {group.label}
                                            </div>
                                            <div className="flex flex-wrap gap-2">
                                                {group.slots.map((slot) => {
                                                    const active =
                                                        selectedTime ===
                                                        slot.time;
                                                    return (
                                                        <button
                                                            key={slot.time}
                                                            className={`h-10 min-w-[5.5rem] px-5 border border-n-1 rounded-sm text-sm font-bold transition-colors cursor-pointer dark:border-white ${
                                                                active
                                                                    ? "bg-n-1 text-white border-n-1 dark:bg-white dark:text-n-1 dark:border-white"
                                                                    : "bg-white hover:border-purple-1 dark:bg-n-1 dark:hover:border-purple-1"
                                                            }`}
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
                                <button
                                    className="btn-purple w-full mt-6 cursor-pointer"
                                    onClick={() => setStep(2)}
                                >
                                    Продолжить
                                </button>
                            )}
                        </>
                    )}

                    {/* ── Step 2: Contact form ── */}
                    {step === 2 && (
                        <>
                            <h2 className="text-h5 mb-5">Ваши данные</h2>
                            {autofillHint && (
                                <div className="mb-4 p-3 text-xs font-bold border border-dashed border-n-1 rounded-sm bg-n-4/50 dark:border-white dark:bg-white/10">
                                    {autofillHint}
                                </div>
                            )}
                            <Field
                                className="mb-4"
                                label="Имя *"
                                placeholder="Иван Иванов"
                                value={name}
                                onChange={(e: any) =>
                                    setName(e.target.value)
                                }
                                required
                                autoComplete="name"
                                name="name"
                            />
                            <Field
                                className="mb-4"
                                label="Телефон *"
                                type="tel"
                                placeholder="+7 900 123-45-67"
                                value={phone}
                                onChange={(e: any) =>
                                    setPhone(e.target.value)
                                }
                                required
                                autoComplete="tel"
                                name="phone"
                            />
                            <Field
                                className="mb-4"
                                label="E-mail"
                                type="email"
                                placeholder="email@example.com"
                                value={email}
                                onChange={(e: any) =>
                                    setEmail(e.target.value)
                                }
                                autoComplete="email"
                                name="email"
                            />
                            <Field
                                className="mb-5"
                                label="Комментарий"
                                textarea
                                placeholder="Комментарий к записи"
                                value={comment}
                                onChange={(e: any) =>
                                    setComment(e.target.value)
                                }
                            />

                            {/* Reminder */}
                            <div className="mb-5">
                                <div className="mb-3 text-xs font-bold">Отправить напоминание</div>
                                <div className="flex flex-wrap gap-2 mb-3">
                                    {[
                                        { id: "max", label: "Макс", icon: "comments" },
                                        { id: "email", label: "E-mail", icon: "email" },
                                        { id: "telegram", label: "Telegram", icon: "send" },
                                    ].map((ch) => {
                                        const active = reminderChannel === ch.id;
                                        return (
                                            <button
                                                key={ch.id}
                                                type="button"
                                                className={`flex items-center gap-2 h-10 px-4 border rounded-sm text-sm font-bold transition-colors cursor-pointer ${
                                                    active
                                                        ? "bg-n-1 text-white border-n-1 dark:bg-white dark:text-n-1 dark:border-white"
                                                        : "border-n-1 bg-white hover:border-purple-1 dark:border-white dark:bg-n-1 dark:hover:border-purple-1"
                                                }`}
                                                onClick={() =>
                                                    setReminderChannel(active ? null : ch.id)
                                                }
                                            >
                                                <Icon className={`icon-16 ${active ? "fill-white dark:fill-n-1" : "dark:fill-white"}`} name={ch.icon} />
                                                {ch.label}
                                            </button>
                                        );
                                    })}
                                </div>
                                {reminderChannel && (
                                    <div className="flex flex-wrap gap-2">
                                        {[
                                            { id: "1h", label: "За 1 час" },
                                            { id: "3h", label: "За 3 часа" },
                                            { id: "24h", label: "За 24 часа" },
                                        ].map((t) => (
                                            <button
                                                key={t.id}
                                                type="button"
                                                className={`h-9 px-4 rounded-sm text-xs font-bold transition-colors cursor-pointer ${
                                                    reminderTime === t.id
                                                        ? "bg-purple-1 text-white"
                                                        : "bg-n-4/50 text-n-1 hover:bg-n-4 dark:bg-white/10 dark:text-white dark:hover:bg-white/20"
                                                }`}
                                                onClick={() => setReminderTime(t.id)}
                                            >
                                                {t.label}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>

                            <Checkbox
                                className="mb-6"
                                label="Я предоставляю согласие на обработку персональных данных"
                                value={consent}
                                onChange={() => setConsent(!consent)}
                            />

                            {/* Summary */}
                            <div className="flex items-center justify-between py-4 border-t border-n-1 dark:border-white mb-5">
                                <span className="text-sm font-bold">
                                    Итого
                                </span>
                                <span className="text-sm font-bold">
                                    {selectedSubject
                                        ? `${selectedSubject.price.toLocaleString("ru-RU")} ₽`
                                        : "—"}
                                </span>
                            </div>

                            <button
                                type="button"
                                className={`btn-dark w-full ${
                                    !name.trim() || !phone.trim() || !consent
                                        ? "opacity-50 cursor-not-allowed"
                                        : "cursor-pointer"
                                }`}
                                disabled={
                                    !name.trim() ||
                                    !phone.trim() ||
                                    !consent
                                }
                                onClick={handleSubmit}
                            >
                                Записаться
                            </button>
                        </>
                    )}

                    {/* ── Step 3: Confirmation ── */}
                    {step === 3 && (
                        <div className="text-center py-10">
                            <div className="flex items-center justify-center w-16 h-16 mx-auto mb-5 rounded-sm bg-green-2 dark:bg-green-1/20">
                                <Icon
                                    className="icon-24 fill-green-1"
                                    name="check-circle"
                                />
                            </div>
                            <h2 className="text-h4 mb-2">
                                Заявка отправлена!
                            </h2>
                            {selectedDate && selectedTime && (
                                <p className="text-sm text-n-3 dark:text-white/50 mb-1">
                                    {selectedSubject?.name} ·{" "}
                                    {formatDateLong(selectedDate)} ·{" "}
                                    {selectedTime}
                                </p>
                            )}
                            <p className="text-sm text-n-3 dark:text-white/50 mb-8">
                                Репетитор подтвердит запись и свяжется с
                                вами.
                            </p>
                            <Link
                                href={`/t/${slug}`}
                                className="btn-stroke cursor-pointer"
                            >
                                Вернуться к профилю
                            </Link>
                        </div>
                    )}
                </div>
                </>
                )}

                {/* Footer */}
                <div className="py-6 text-center text-xs text-n-3 dark:text-white/50">
                    Работает на{" "}
                    <Link
                        href="/"
                        className="font-bold hover:text-purple-1 transition-colors"
                    >
                        Repeto
                    </Link>
                </div>
            </div>
        </>
    );
};

export default BookingPage;
