import { useState, useEffect } from "react";
import Switch from "@/components/Switch";
import Select from "@/components/Select";
import { useSettings, updateNotificationSettings } from "@/hooks/useSettings";

const reminderHours = [
    { id: "1", title: "1 час" },
    { id: "2", title: "2 часа" },
    { id: "4", title: "4 часа" },
    { id: "24", title: "24 часа" },
];

const selfReminderMins = [
    { id: "15", title: "15 мин" },
    { id: "30", title: "30 мин" },
    { id: "60", title: "1 час" },
];

const paymentDays = [
    { id: "1", title: "1 день" },
    { id: "3", title: "3 дня" },
    { id: "7", title: "7 дней" },
];

const channels = [
    { id: "email", title: "Email" },
    { id: "push", title: "Push (PWA)" },
    { id: "whatsapp", title: "WhatsApp" },
    { id: "sms", title: "SMS" },
    { id: "all", title: "Все" },
];

const reportDays = [
    { id: "mon", title: "Понедельник" },
    { id: "sun", title: "Воскресенье" },
];

const DEFAULTS = {
    channel: "email",
    studentReminder: true,
    studentReminderHours: "2",
    selfReminder: true,
    selfReminderMins: "30",
    paymentReminder: true,
    paymentReminderDays: "3",
    cancelNotify: true,
    weeklyReport: false,
    reportDay: "mon",
};

const Notifications = () => {
    const { data: settings, mutate } = useSettings();
    const [studentReminder, setStudentReminder] = useState(true);
    const [studentReminderHours, setStudentReminderHours] = useState<any>(
        reminderHours[1]
    );
    const [selfReminder, setSelfReminder] = useState(true);
    const [selfReminderTime, setSelfReminderTime] = useState<any>(
        selfReminderMins[1]
    );
    const [paymentReminder, setPaymentReminder] = useState(true);
    const [paymentReminderDays, setPaymentReminderDays] = useState<any>(
        paymentDays[1]
    );
    const [channel, setChannel] = useState<any>(channels[0]);
    const [cancelNotify, setCancelNotify] = useState(true);
    const [weeklyReport, setWeeklyReport] = useState(false);
    const [reportDay, setReportDay] = useState<any>(reportDays[0]);
    const [saving, setSaving] = useState(false);
    const [saveMsg, setSaveMsg] = useState<string | null>(null);

    // Load from server
    useEffect(() => {
        const ns = settings?.notificationSettings as any;
        if (!ns) return;
        setChannel(channels.find((c) => c.id === ns.channel) || channels[0]);
        setStudentReminder(ns.studentReminder ?? DEFAULTS.studentReminder);
        setStudentReminderHours(
            reminderHours.find((h) => h.id === ns.studentReminderHours) || reminderHours[1]
        );
        setSelfReminder(ns.selfReminder ?? DEFAULTS.selfReminder);
        setSelfReminderTime(
            selfReminderMins.find((m) => m.id === ns.selfReminderMins) || selfReminderMins[1]
        );
        setPaymentReminder(ns.paymentReminder ?? DEFAULTS.paymentReminder);
        setPaymentReminderDays(
            paymentDays.find((d) => d.id === ns.paymentReminderDays) || paymentDays[1]
        );
        setCancelNotify(ns.cancelNotify ?? DEFAULTS.cancelNotify);
        setWeeklyReport(ns.weeklyReport ?? DEFAULTS.weeklyReport);
        setReportDay(reportDays.find((d) => d.id === ns.reportDay) || reportDays[0]);
    }, [settings?.notificationSettings]);

    const handleSave = async () => {
        setSaving(true);
        setSaveMsg(null);
        try {
            await updateNotificationSettings({
                channel: channel?.id,
                studentReminder,
                studentReminderHours: studentReminderHours?.id,
                selfReminder,
                selfReminderMins: selfReminderTime?.id,
                paymentReminder,
                paymentReminderDays: paymentReminderDays?.id,
                cancelNotify,
                weeklyReport,
                reportDay: reportDay?.id,
            });
            await mutate();
            setSaveMsg("Сохранено");
        } catch (e: any) {
            setSaveMsg(e?.message || "Ошибка сохранения");
        } finally {
            setSaving(false);
        }
    };

    const handleReset = () => {
        setChannel(channels.find((c) => c.id === DEFAULTS.channel)!);
        setStudentReminder(DEFAULTS.studentReminder);
        setStudentReminderHours(reminderHours.find((h) => h.id === DEFAULTS.studentReminderHours)!);
        setSelfReminder(DEFAULTS.selfReminder);
        setSelfReminderTime(selfReminderMins.find((m) => m.id === DEFAULTS.selfReminderMins)!);
        setPaymentReminder(DEFAULTS.paymentReminder);
        setPaymentReminderDays(paymentDays.find((d) => d.id === DEFAULTS.paymentReminderDays)!);
        setCancelNotify(DEFAULTS.cancelNotify);
        setWeeklyReport(DEFAULTS.weeklyReport);
        setReportDay(reportDays.find((d) => d.id === DEFAULTS.reportDay)!);
        setSaveMsg(null);
    };

    const items = [
        {
            label: "Напоминание ученику о занятии",
            description: "За сколько часов до занятия отправить",
            enabled: studentReminder,
            setEnabled: setStudentReminder,
            select: {
                items: reminderHours,
                value: studentReminderHours,
                onChange: setStudentReminderHours,
            },
        },
        {
            label: "Напоминание репетитору",
            description: "За сколько до занятия напомнить вам",
            enabled: selfReminder,
            setEnabled: setSelfReminder,
            select: {
                items: selfReminderMins,
                value: selfReminderTime,
                onChange: setSelfReminderTime,
            },
        },
        {
            label: "Напоминание об оплате",
            description: "Через сколько дней после занятия",
            enabled: paymentReminder,
            setEnabled: setPaymentReminder,
            select: {
                items: paymentDays,
                value: paymentReminderDays,
                onChange: setPaymentReminderDays,
            },
        },
        {
            label: "Уведомление об отменах",
            description: "Получать уведомления при отмене занятий",
            enabled: cancelNotify,
            setEnabled: setCancelNotify,
        },
        {
            label: "Еженедельный отчёт",
            description: "День отправки отчёта",
            enabled: weeklyReport,
            setEnabled: setWeeklyReport,
            select: {
                items: reportDays,
                value: reportDay,
                onChange: setReportDay,
            },
        },
    ];

    return (
        <div className="card">
            <div className="card-title">Настройки уведомлений</div>
            <div className="p-5">
                <div className="mb-6">
                    <div className="mb-1.5 text-xs text-n-3 dark:text-white/75">
                        Канал уведомлений
                    </div>
                    <Select
                        className="max-w-[15rem]"
                        items={channels}
                        value={channel}
                        onChange={setChannel}
                    />
                </div>
                <div>
                    {items.map((item, index) => (
                        <div
                            className="flex items-center mb-4 pb-4 border-b border-n-1 last:border-none last:mb-0 last:pb-0 dark:border-white"
                            key={index}
                        >
                            <div className="mr-auto">
                                <div className="mb-1.5 text-xs text-n-3 dark:text-white/75">
                                    {item.label}
                                </div>
                                <div className="text-sm font-bold">
                                    {item.description}
                                </div>
                            </div>
                            <div className="flex items-center gap-3 ml-4">
                                {item.select && item.enabled && (
                                    <Select
                                        className="min-w-[7rem]"
                                        items={item.select.items}
                                        value={item.select.value}
                                        onChange={item.select.onChange}
                                    />
                                )}
                                <Switch
                                    value={item.enabled}
                                    setValue={() =>
                                        item.setEnabled(!item.enabled)
                                    }
                                />
                            </div>
                        </div>
                    ))}
                </div>
                <div className="flex justify-between mt-10 md:block md:mt-8">
                    <button
                        className="btn-stroke min-w-[11.7rem] md:w-full md:mb-3"
                        onClick={handleReset}
                    >
                        Сбросить
                    </button>
                    <div className="flex items-center gap-3">
                        {saveMsg && (
                            <span className={`text-xs font-bold ${saveMsg === "Сохранено" ? "text-green-1" : "text-pink-1"}`}>
                                {saveMsg}
                            </span>
                        )}
                        <button
                            className="btn-purple min-w-[11.7rem] md:w-full"
                            onClick={handleSave}
                            disabled={saving}
                        >
                            {saving ? "Сохраняем..." : "Сохранить"}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Notifications;
