import { useState } from "react";
import Switch from "@/components/Switch";
import Select from "@/components/Select";

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
    { id: "telegram", title: "Telegram" },
    { id: "email", title: "Email" },
    { id: "push", title: "Push" },
    { id: "all", title: "Все" },
];

const reportDays = [
    { id: "mon", title: "Понедельник" },
    { id: "sun", title: "Воскресенье" },
];

const Notifications = () => {
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
                    <button className="btn-stroke min-w-[11.7rem] md:w-full md:mb-3">
                        Сбросить
                    </button>
                    <button className="btn-purple min-w-[11.7rem] md:w-full">
                        Сохранить
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Notifications;
