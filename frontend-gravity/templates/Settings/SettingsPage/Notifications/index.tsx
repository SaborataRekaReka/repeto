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
const channels = [
    { value: "email", content: "Email" }, { value: "push", content: "Push (PWA)" },
    { value: "telegram", content: "Telegram" }, { value: "max", content: "Макс" },
    { value: "whatsapp", content: "WhatsApp" }, { value: "sms", content: "SMS" }, { value: "all", content: "Все" },
];
const reportDays = [
    { value: "mon", content: "Понедельник" }, { value: "sun", content: "Воскресенье" },
];

const DEFAULTS = { channel: "email", studentReminder: true, studentReminderHours: "2", selfReminder: true, selfReminderMins: "30", paymentReminder: true, paymentReminderDays: "3", cancelNotify: true, weeklyReport: false, reportDay: "mon" };

const Notifications = () => {
    const { data: settings, mutate } = useSettings();
    const [channel, setChannel] = useState("email");
    const [studentReminder, setStudentReminder] = useState(true);
    const [studentReminderHours, setStudentReminderHours] = useState("2");
    const [selfReminder, setSelfReminder] = useState(true);
    const [selfReminderVal, setSelfReminderVal] = useState("30");
    const [paymentReminder, setPaymentReminder] = useState(true);
    const [paymentReminderDays, setPaymentReminderDays] = useState("3");
    const [cancelNotify, setCancelNotify] = useState(true);
    const [weeklyReport, setWeeklyReport] = useState(false);
    const [reportDay, setReportDay] = useState("mon");
    const [saving, setSaving] = useState(false);
    const [saveMsg, setSaveMsg] = useState<string | null>(null);

    useEffect(() => {
        const ns = settings?.notificationSettings as any;
        if (!ns) return;
        setChannel(ns.channel || DEFAULTS.channel);
        setStudentReminder(ns.studentReminder ?? DEFAULTS.studentReminder);
        setStudentReminderHours(ns.studentReminderHours || DEFAULTS.studentReminderHours);
        setSelfReminder(ns.selfReminder ?? DEFAULTS.selfReminder);
        setSelfReminderVal(ns.selfReminderMins || DEFAULTS.selfReminderMins);
        setPaymentReminder(ns.paymentReminder ?? DEFAULTS.paymentReminder);
        setPaymentReminderDays(ns.paymentReminderDays || DEFAULTS.paymentReminderDays);
        setCancelNotify(ns.cancelNotify ?? DEFAULTS.cancelNotify);
        setWeeklyReport(ns.weeklyReport ?? DEFAULTS.weeklyReport);
        setReportDay(ns.reportDay || DEFAULTS.reportDay);
    }, [settings?.notificationSettings]);

    const handleSave = async () => {
        setSaving(true); setSaveMsg(null);
        try {
            if (channel === "push") {
                const pushResult = await enablePushNotifications();
                if (!pushResult.enabled) {
                    setSaveMsg(codedErrorMessage("SETT-NOTIF-PUSH", pushResult.reason));
                    return;
                }
            } else {
                await disablePushNotifications();
            }

            await updateNotificationSettings({ channel, studentReminder, studentReminderHours, selfReminder, selfReminderMins: selfReminderVal, paymentReminder, paymentReminderDays, cancelNotify, weeklyReport, reportDay });
            await mutate();
            setSaveMsg("Сохранено");
        } catch (e: any) { setSaveMsg(codedErrorMessage("SETT-NOTIF-SAVE", e)); }
        finally { setSaving(false); }
    };

    const handleReset = () => {
        setChannel(DEFAULTS.channel); setStudentReminder(DEFAULTS.studentReminder);
        setStudentReminderHours(DEFAULTS.studentReminderHours); setSelfReminder(DEFAULTS.selfReminder);
        setSelfReminderVal(DEFAULTS.selfReminderMins); setPaymentReminder(DEFAULTS.paymentReminder);
        setPaymentReminderDays(DEFAULTS.paymentReminderDays); setCancelNotify(DEFAULTS.cancelNotify);
        setWeeklyReport(DEFAULTS.weeklyReport); setReportDay(DEFAULTS.reportDay); setSaveMsg(null);
    };

    const items = [
        { label: "Напоминание ученику о занятии", desc: "За сколько часов до занятия отправить", on: studentReminder, setOn: setStudentReminder, opts: reminderHours, val: studentReminderHours, setVal: setStudentReminderHours },
        { label: "Напоминание репетитору", desc: "За сколько до занятия напомнить вам", on: selfReminder, setOn: setSelfReminder, opts: selfReminderMins, val: selfReminderVal, setVal: setSelfReminderVal },
        { label: "Напоминание об оплате", desc: "Через сколько дней после занятия", on: paymentReminder, setOn: setPaymentReminder, opts: paymentDays, val: paymentReminderDays, setVal: setPaymentReminderDays },
        { label: "Уведомление об отменах", desc: "Получать уведомления при отмене занятий", on: cancelNotify, setOn: setCancelNotify },
        { label: "Еженедельный отчёт", desc: "День отправки отчёта", on: weeklyReport, setOn: setWeeklyReport, opts: reportDays, val: reportDay, setVal: setReportDay },
    ];

    return (
        <Card view="outlined" style={{ background: "var(--g-color-base-float)" }}>
            <div style={{ padding: "20px 24px", borderBottom: "1px solid var(--g-color-line-generic)" }}>
                <Text variant="subheader-2">Настройки уведомлений</Text>
            </div>
            <div style={{ padding: 24 }}>
                <div style={{ marginBottom: 24 }}>
                    <Text variant="caption-2" color="secondary" style={{ display: "block", marginBottom: 6 }}>Канал уведомлений</Text>
                    <div style={{ maxWidth: 260 }}>
                        <Select options={channels} value={[channel]} onUpdate={(v) => setChannel(v[0])} size="l" width="max" />
                    </div>
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
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 32 }}>
                    <Button view="outlined" size="l" onClick={handleReset}>Сбросить</Button>
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                        {saveMsg && (
                            <Text variant="body-1" style={{ fontWeight: 600, color: saveMsg === "Сохранено" ? "var(--g-color-text-positive)" : "var(--g-color-text-danger)" }}>{saveMsg}</Text>
                        )}
                        <Button view="action" size="l" onClick={handleSave} disabled={saving}>
                            {saving ? "Сохраняем..." : "Сохранить"}
                        </Button>
                    </div>
                </div>
            </div>
        </Card>
    );
};

export default Notifications;
