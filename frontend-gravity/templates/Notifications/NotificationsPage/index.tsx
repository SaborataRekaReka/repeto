import { useState } from "react";
import GravityLayout from "@/components/GravityLayout";
import { SegmentedRadioGroup, Card, Text, Button } from "@gravity-ui/uikit";
import NotificationItem from "./NotificationItem";

import {
    useNotifications,
    markAllAsRead,
    markAsRead,
    confirmBooking,
    rejectBooking,
    confirmReschedule,
    rejectReschedule,
} from "@/hooks/useNotifications";
import { getNotificationCategory } from "@/mocks/notifications";

const tabOptions = [
    { value: "all", content: "Все" },
    { value: "unread", content: "Непрочитанные" },
    { value: "payments", content: "Оплаты" },
    { value: "schedule", content: "Расписание" },
];

const NotificationsPage = () => {
    const [tab, setTab] = useState("all");
    const [actionError, setActionError] = useState<string | null>(null);
    const [actionBusy, setActionBusy] = useState(false);

    const readFilter = tab === "unread" ? false : undefined;
    const { data: notifData, loading, refetch } = useNotifications({
        read: readFilter,
        limit: 50,
    });
    const items = notifData?.data || [];

    const filtered = items.filter((n) => {
        if (tab === "payments") return getNotificationCategory(n.type) === "payments";
        if (tab === "schedule") return getNotificationCategory(n.type) === "schedule";
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

    const handleMarkAllRead = () => runAction(() => markAllAsRead());
    const handleMarkRead = (id: string) => runAction(() => markAsRead(id));
    const handleConfirmBooking = (id: string) => runAction(() => confirmBooking(id));
    const handleRejectBooking = (id: string) => runAction(() => rejectBooking(id));
    const handleConfirmReschedule = (id: string) => runAction(() => confirmReschedule(id));
    const handleRejectReschedule = (id: string) => runAction(() => rejectReschedule(id));

    return (
        <GravityLayout title="Уведомления">
            <div className="repeto-students-toolbar">
                <SegmentedRadioGroup size="m" value={tab} onUpdate={setTab} options={tabOptions} />
                {unreadCount > 0 && (
                    <Button view="outlined" size="s" onClick={handleMarkAllRead} disabled={actionBusy}>
                        Прочитать все ({unreadCount})
                    </Button>
                )}
            </div>

            {actionError && (
                <div style={{
                    marginBottom: 16, padding: "8px 12px", borderRadius: 8,
                    background: "var(--g-color-base-danger-light)",
                    border: "1px solid var(--g-color-line-danger)",
                }}>
                    <Text variant="body-1" color="danger">{actionError}</Text>
                </div>
            )}

            {filtered.length === 0 ? (
                <Card view="outlined" style={{ padding: "64px 20px", textAlign: "center", background: "var(--g-color-base-float)" }}>
                    <Text variant="subheader-2" style={{ display: "block", marginBottom: 8 }}>
                        Нет уведомлений
                    </Text>
                    <Text variant="body-1" color="secondary">
                        Здесь будут появляться уведомления об оплатах, занятиях и других событиях.
                    </Text>
                </Card>
            ) : (
                <Card view="outlined" style={{ background: "var(--g-color-base-float)", overflow: "hidden" }}>
                    {filtered.map((n) => (
                        <NotificationItem
                            key={n.id}
                            item={n}
                            onRead={handleMarkRead}
                            onConfirmBooking={handleConfirmBooking}
                            onRejectBooking={handleRejectBooking}
                            onConfirmReschedule={handleConfirmReschedule}
                            onRejectReschedule={handleRejectReschedule}
                        />
                    ))}
                </Card>
            )}
        </GravityLayout>
    );
};

export default NotificationsPage;
