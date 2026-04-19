import { useState, useEffect } from "react";
import { Card, Text, Button, Select, Switch } from "@gravity-ui/uikit";
import { useSettings, updateNotificationSettings } from "@/hooks/useSettings";
import { disablePushNotifications, enablePushNotifications } from "@/lib/pushNotifications";
import { codedErrorMessage } from "@/lib/errorCodes";

const reminderHours = [
    { value: "1", content: "1 час" }, { value: "2", content: "2 часа" },
    { value: "4", content: "4 часа" }, { value: "24", content: "24 часа" },
];
const selfReminderMins = [
    { value: "15", content: "15 мин" }, { value: "30", content: "30 мин" }, { value: "60", content: "1 час" },
];
const paymentDays = [
    { value: "1", content: "1 день" }, { value: "3", content: "3 дня" }, { value: "7", content: "7 дней" },
];

type NotificationChannelKey = "email" | "push" | "telegram" | "max";

const CHANNEL_OPTIONS: Array<{ value: NotificationChannelKey; content: string }> = [
    { value: "email", content: "Email" },
    { value: "push", content: "Push" },
    { value: "telegram", content: "Telegram" },
    { value: "max", content: "Макс" },
];

const DEFAULTS = {
    channels: ["email"] as NotificationChannelKey[],
    studentReminder: true,
    studentReminderHours: "2",
    selfReminder: true,
    selfReminderMins: "30",
    paymentReminder: true,
    paymentReminderDays: "3",
    cancelNotify: true,
};

const Notifications = () => {
    const { data: settings, mutate } = useSettings();
    const [channels, setChannels] = useState<NotificationChannelKey[]>(DEFAULTS.channels);
    const [studentReminder, setStudentReminder] = useState(true);
    const [studentReminderHours, setStudentReminderHours] = useState("2");
    const [selfReminder, setSelfReminder] = useState(true);
    const [selfReminderVal, setSelfReminderVal] = useState("30");
    const [paymentReminder, setPaymentReminder] = useState(true);
    const [paymentReminderDays, setPaymentReminderDays] = useState("3");
    const [cancelNotify, setCancelNotify] = useState(true);
    const [telegramBotUsername, setTelegramBotUsername] = useState<string | null>(null);
    const [maxBotUsername, setMaxBotUsername] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);
    const [saveMsg, setSaveMsg] = useState<string | null>(null);

    const normalizeChannels = (value: unknown): NotificationChannelKey[] => {
        const allowed = new Set<NotificationChannelKey>(["email", "push", "telegram", "max"]);
        const source = Array.isArray(value)
            ? value
            : typeof value === "string"
              ? [value]
              : [];

        const normalized = source
            .map((item) => String(item || "").trim().toLowerCase() as NotificationChannelKey)
            .filter((item) => allowed.has(item));

        return normalized.length > 0
            ? Array.from(new Set(normalized))
            : DEFAULTS.channels;
    };

    const openChannelDeepLink = (channel: NotificationChannelKey) => {
        if (typeof window === "undefined") return;

        if (channel === "telegram" && telegramBotUsername) {
            window.open(`https://t.me/${telegramBotUsername}`, "_blank", "noopener,noreferrer");
        }

        if (channel === "max" && maxBotUsername) {
            window.open(`https://max.ru/${maxBotUsername}`, "_blank", "noopener,noreferrer");
        }
    };

    const toggleChannel = (channel: NotificationChannelKey) => {
        setChannels((prev) => {
            const isSelected = prev.includes(channel);
            const next = isSelected
                ? prev.filter((item) => item !== channel)
                : [...prev, channel];

            if (!isSelected && (channel === "telegram" || channel === "max")) {
                openChannelDeepLink(channel);
            }

            return next;
        });
    };

    useEffect(() => {
        const ns = settings?.notificationSettings as any;
        if (!ns) return;

        const fromChannels = normalizeChannels(ns.channels);
        const fromLegacyChannel = normalizeChannels(ns.channel);
        const selectedChannels = Array.isArray(ns.channels) ? fromChannels : fromLegacyChannel;

        setChannels(selectedChannels);
        setStudentReminder(ns.studentReminder ?? DEFAULTS.studentReminder);
        setStudentReminderHours(ns.studentReminderHours || DEFAULTS.studentReminderHours);
        setSelfReminder(ns.selfReminder ?? DEFAULTS.selfReminder);
        setSelfReminderVal(ns.selfReminderMins || DEFAULTS.selfReminderMins);
        setPaymentReminder(ns.paymentReminder ?? DEFAULTS.paymentReminder);
        setPaymentReminderDays(ns.paymentReminderDays || DEFAULTS.paymentReminderDays);
        setCancelNotify(ns.cancelNotify ?? DEFAULTS.cancelNotify);
    }, [settings?.notificationSettings]);

    useEffect(() => {
        let cancelled = false;

        const loadBotInfo = async () => {
            try {
                const response = await fetch("/api/public/bot-info");
                if (!response.ok) return;

                const payload = (await response.json()) as {
                    telegram?: { username?: string | null };
                    max?: { username?: string | null };
                };

                if (cancelled) return;
                setTelegramBotUsername(payload?.telegram?.username || null);
                setMaxBotUsername(payload?.max?.username || null);
            } catch {
                if (cancelled) return;
                setTelegramBotUsername(null);
                setMaxBotUsername(null);
            }
        };

        loadBotInfo();

        return () => {
            cancelled = true;
        };
    }, []);

    const handleSave = async () => {
        setSaving(true); setSaveMsg(null);
        try {
            if (channels.length === 0) {
                setSaveMsg("Выберите хотя бы один канал уведомлений.");
                return;
            }

            if (channels.includes("push")) {
                const pushResult = await enablePushNotifications();
                if (!pushResult.enabled) {
                    setSaveMsg(codedErrorMessage("SETT-NOTIF-PUSH", pushResult.reason));
                    return;
                }
            } else {
                await disablePushNotifications();
            }

            await updateNotificationSettings({
                channels: channels.map((channel) => channel.toUpperCase()),
                channel: channels[0],
                studentReminder,
                studentReminderHours,
                selfReminder,
                selfReminderMins: selfReminderVal,
                paymentReminder,
                paymentReminderDays,
                cancelNotify,
            });
            await mutate();
            setSaveMsg("Сохранено");
        } catch (e: any) { setSaveMsg(codedErrorMessage("SETT-NOTIF-SAVE", e)); }
        finally { setSaving(false); }
    };

    const items = [
        { label: "Напоминание ученику о занятии", desc: "За сколько часов до занятия отправить", on: studentReminder, setOn: setStudentReminder, opts: reminderHours, val: studentReminderHours, setVal: setStudentReminderHours },
        { label: "Напоминание репетитору", desc: "За сколько до занятия напомнить вам", on: selfReminder, setOn: setSelfReminder, opts: selfReminderMins, val: selfReminderVal, setVal: setSelfReminderVal },
        { label: "Напоминание об оплате", desc: "Через сколько дней после занятия", on: paymentReminder, setOn: setPaymentReminder, opts: paymentDays, val: paymentReminderDays, setVal: setPaymentReminderDays },
        { label: "Уведомление об отменах", desc: "Получать уведомления при отмене занятий", on: cancelNotify, setOn: setCancelNotify },
    ];

    return (
        <Card view="outlined" style={{ background: "var(--g-color-base-float)" }}>
            <div style={{ padding: "20px 24px", borderBottom: "1px solid var(--g-color-line-generic)" }}>
                <Text variant="subheader-2">Настройки уведомлений</Text>
            </div>
            <div style={{ padding: 24 }}>
                <div style={{ marginBottom: 24 }}>
                    <Text variant="caption-2" color="secondary" style={{ display: "block", marginBottom: 10 }}>
                        Каналы уведомлений
                    </Text>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                        {CHANNEL_OPTIONS.map((option) => {
                            const selected = channels.includes(option.value);
                            return (
                                <button
                                    key={option.value}
                                    type="button"
                                    onClick={() => toggleChannel(option.value)}
                                    style={{
                                        height: 40,
                                        padding: "0 14px",
                                        borderRadius: 10,
                                        border: `1px solid ${selected ? "var(--g-color-base-brand)" : "var(--g-color-line-generic)"}`,
                                        background: selected ? "var(--g-color-base-brand)" : "transparent",
                                        color: selected ? "var(--g-color-text-light-primary)" : "var(--g-color-text-primary)",
                                        fontSize: 14,
                                        fontWeight: 700,
                                        cursor: "pointer",
                                    }}
                                >
                                    {option.content}
                                </button>
                            );
                        })}
                    </div>
                    <Text variant="caption-2" color="secondary" style={{ display: "block", marginTop: 8 }}>
                        Можно выбрать несколько каналов одновременно.
                    </Text>
                    {(telegramBotUsername || maxBotUsername) && (
                        <Text variant="caption-2" color="secondary" style={{ display: "block", marginTop: 4 }}>
                            При выборе Telegram или Макс откроется бот для авторизации канала.
                        </Text>
                    )}
                </div>
                <div style={{ display: "flex", flexDirection: "column" }}>
                    {items.map((item, idx) => (
                        <div key={idx} style={{ display: "flex", alignItems: "center", padding: "16px 0", borderBottom: idx < items.length - 1 ? "1px solid var(--g-color-line-generic)" : undefined }}>
                            <div style={{ flex: 1, marginRight: 16 }}>
                                <Text variant="body-1" style={{ fontWeight: 600, display: "block" }}>{item.label}</Text>
                                <Text variant="caption-2" color="secondary" style={{ display: "block", marginTop: 2 }}>{item.desc}</Text>
                            </div>
                            <div style={{ display: "flex", alignItems: "center", gap: 12, flexShrink: 0 }}>
                                {item.opts && item.on && (
                                    <div style={{ minWidth: 120 }}>
                                        <Select options={item.opts} value={[item.val!]} onUpdate={(v) => item.setVal!(v[0])} size="s" width="max" />
                                    </div>
                                )}
                                <Switch checked={item.on} onUpdate={(v) => item.setOn(v)} size="l" />
                            </div>
                        </div>
                    ))}
                </div>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", marginTop: 32, gap: 12 }}>
                    {saveMsg && (
                        <Text variant="body-1" style={{ fontWeight: 600, color: saveMsg === "Сохранено" ? "var(--g-color-text-positive)" : "var(--g-color-text-danger)" }}>
                            {saveMsg}
                        </Text>
                    )}
                    <Button view="action" size="l" onClick={handleSave} disabled={saving}>
                        {saving ? "Сохраняем..." : "Сохранить"}
                    </Button>
                </div>
            </div>
        </Card>
    );
};

export default Notifications;
