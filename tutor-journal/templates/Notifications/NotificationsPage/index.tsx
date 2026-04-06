import { useState } from "react";
import { useRouter } from "next/router";
import Layout from "@/components/Layout";
import Tabs from "@/components/Tabs";
import Empty from "@/components/Empty";
import NotificationItem from "./NotificationItem";

import {
    notifications,
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
    const router = useRouter();
    const [tab, setTab] = useState<string>("all");
    const [items, setItems] = useState<Notification[]>(notifications);

    const filtered = items.filter((n) => {
        if (tab === "unread") return !n.read;
        if (tab === "payments")
            return getNotificationCategory(n.type) === "payments";
        if (tab === "schedule")
            return getNotificationCategory(n.type) === "schedule";
        return true;
    });

    const unreadCount = items.filter((n) => !n.read).length;

    const markAllRead = () => {
        setItems((prev) => prev.map((n) => ({ ...n, read: true })));
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
                        onClick={markAllRead}
                    >
                        Прочитать все ({unreadCount})
                    </button>
                )}
            </div>

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
                            onAction={() => {
                                if (n.actionUrl) {
                                    router.push(n.actionUrl);
                                }
                            }}
                        />
                    ))}
                </div>
            )}
        </Layout>
    );
};

export default NotificationsPage;
