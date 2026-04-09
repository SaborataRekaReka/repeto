import { useState } from "react";
import Layout from "@/components/Layout";
import Tabs from "@/components/Tabs";
import Empty from "@/components/Empty";
import NotificationItem from "./NotificationItem";

import { useNotifications, markAllAsRead, markAsRead, confirmBooking, rejectBooking, confirmReschedule, rejectReschedule } from "@/hooks/useNotifications";
import {
    getNotificationCategory,
} from "@/mocks/notifications";
import type { Notification } from "@/types/notification";

const tabs = [
    { title: "Все", value: "all" },
    { title: "Непрочитанные", value: "unread" },
    { title: "Оплаты", value: "payments" },
    { title: "Расписание", value: "schedule" },
];

const NotificationsPage = () => {
    const [tab, setTab] = useState<string>("all");
    const [actionError, setActionError] = useState<string | null>(null);
    const [actionBusy, setActionBusy] = useState(false);

    const readFilter = tab === "unread" ? false : undefined;
    const { data: notifData, loading, refetch } = useNotifications({
        read: readFilter,
        limit: 50,
    });
    const items = notifData?.data || [];

    const filtered = items.filter((n) => {
        if (tab === "payments")
            return getNotificationCategory(n.type) === "payments";
        if (tab === "schedule")
            return getNotificationCategory(n.type) === "schedule";
        return true;
    });

    const unreadCount = items.filter((n) => !n.read).length;

    const runAction = async (action: () => Promise<unknown>) => {
        setActionError(null);
        setActionBusy(true);
        try {
            await action();
            await refetch();
        } catch (error) {
            setActionError(
                error instanceof Error
                    ? error.message
                    : "Не удалось выполнить действие с уведомлениями"
            );
        } finally {
            setActionBusy(false);
        }
    };

    const handleMarkAllRead = async () => {
        await runAction(() => markAllAsRead());
    };

    const handleMarkRead = async (id: string) => {
        await runAction(() => markAsRead(id));
    };

    const handleConfirmBooking = async (notificationId: string) => {
        await runAction(() => confirmBooking(notificationId));
    };

    const handleRejectBooking = async (notificationId: string) => {
        await runAction(() => rejectBooking(notificationId));
    };

    const handleConfirmReschedule = async (notificationId: string) => {
        await runAction(() => confirmReschedule(notificationId));
    };

    const handleRejectReschedule = async (notificationId: string) => {
        await runAction(() => rejectReschedule(notificationId));
    };

    return (
        <Layout title="Уведомления">
            <div className="flex items-center mb-6 md:mb-5 md:block">
                <Tabs
                    className="mr-auto md:ml-0"
                    classButton="md:ml-0 md:flex-1"
                    items={tabs}
                    value={tab}
                    setValue={setTab}
                />
                {unreadCount > 0 && (
                    <button
                        className="btn-stroke btn-small md:mt-4"
                        onClick={handleMarkAllRead}
                        disabled={actionBusy}
                    >
                        Прочитать все ({unreadCount})
                    </button>
                )}
            </div>

            {actionError && (
                <div className="mb-4 text-xs font-medium text-pink-1">
                    {actionError}
                </div>
            )}

            {filtered.length === 0 ? (
                <Empty
                    title="Нет уведомлений"
                    content="Здесь будут появляться уведомления об оплатах, занятиях и других событиях."
                    buttonText=""
                />
            ) : (
                <div className="card">
                    {filtered.map((n) => (
                        <NotificationItem
                            item={n}
                            key={n.id}
                            onRead={handleMarkRead}
                            onAction={() =>
                                console.log("TODO: action for", n.id)
                            }
                            onConfirmBooking={handleConfirmBooking}
                            onRejectBooking={handleRejectBooking}
                            onConfirmReschedule={handleConfirmReschedule}
                            onRejectReschedule={handleRejectReschedule}
                        />
                    ))}
                </div>
            )}
        </Layout>
    );
};

export default NotificationsPage;
