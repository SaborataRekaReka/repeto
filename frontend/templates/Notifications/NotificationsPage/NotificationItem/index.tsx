import Link from "next/link";
import Icon from "@/components/Icon";
import type { Notification } from "@/types/notification";
import {
    getNotificationIcon,
    getNotificationColor,
} from "@/mocks/notifications";

type NotificationItemProps = {
    item: Notification;
    onAction?: () => void;
    onRead?: (id: string) => void;
    onConfirmBooking?: (id: string) => void;
    onRejectBooking?: (id: string) => void;
    onConfirmReschedule?: (id: string) => void;
    onRejectReschedule?: (id: string) => void;
};

function getEntityLink(item: Notification): { href: string; label: string; icon: string } | null {
    const type = item.type;
    if (
        (type === "lesson_cancelled" ||
            type === "lesson_reminder" ||
            type === "booking_confirmed" ||
            type === "homework_submitted") &&
        item.studentId
    ) {
        return { href: `/students/${item.studentId}`, label: "К ученику", icon: "profile" };
    }
    if ((type === "payment_received" || type === "payment_overdue") && item.studentId) {
        return { href: `/students/${item.studentId}`, label: "К ученику", icon: "profile" };
    }
    return null;
}

const NotificationItem = ({
    item,
    onAction,
    onRead,
    onConfirmBooking,
    onRejectBooking,
    onConfirmReschedule,
    onRejectReschedule,
}: NotificationItemProps) => {
    const isBookingNew =
        item.type === "booking_new" && item.bookingRequestId;
    const isRescheduleRequested =
        item.type === "reschedule_requested" && !item.read;

    const entityLink = getEntityLink(item);

    return (
        <div
            onClick={() => {
                if (!item.read) {
                    onRead?.(item.id);
                }
            }}
            className={`flex items-start px-5 py-4 border-b border-n-1 last:border-none transition-colors dark:border-white ${
                !item.read
                    ? "bg-purple-2/30 dark:bg-purple-1/5 cursor-pointer"
                    : "hover:bg-background dark:hover:bg-white/5"
            }`}
        >
            <div
                className={`flex items-center justify-center shrink-0 w-9 h-9 rounded-full mr-3 ${getNotificationColor(
                    item.type
                )}`}
            >
                <Icon
                    className="icon-18 dark:fill-white"
                    name={getNotificationIcon(item.type)}
                />
            </div>
            <div className="grow min-w-0">
                <div className="flex items-center justify-between mb-0.5">
                    <span className="text-sm font-bold truncate mr-2">
                        {item.title}
                    </span>
                    <div className="flex items-center shrink-0 gap-2">
                        <span className="text-xs text-n-3 dark:text-white/50">
                            {item.time}
                        </span>
                        {!item.read && (
                            <div className="w-2 h-2 rounded-full bg-purple-1" />
                        )}
                    </div>
                </div>
                <div className="text-xs text-n-3 dark:text-white/50">
                    {item.description}
                </div>

                {/* Booking action buttons */}
                {isBookingNew && !item.read && (
                    <div className="flex gap-2 mt-2">
                        <button
                            className="btn-purple btn-small"
                            onClick={(e) => {
                                e.stopPropagation();
                                onConfirmBooking?.(item.id);
                            }}
                        >
                            Подтвердить
                        </button>
                        <button
                            className="btn-stroke btn-small !border-pink-1 !text-pink-1 hover:!bg-pink-1 hover:!text-white"
                            onClick={(e) => {
                                e.stopPropagation();
                                onRejectBooking?.(item.id);
                            }}
                        >
                            Отклонить
                        </button>
                    </div>
                )}

                {/* Reschedule action buttons */}
                {isRescheduleRequested && (
                    <div className="flex gap-2 mt-2">
                        <button
                            className="btn-purple btn-small"
                            onClick={(e) => {
                                e.stopPropagation();
                                onConfirmReschedule?.(item.id);
                            }}
                        >
                            Подтвердить перенос
                        </button>
                        <button
                            className="btn-stroke btn-small !border-pink-1 !text-pink-1 hover:!bg-pink-1 hover:!text-white"
                            onClick={(e) => {
                                e.stopPropagation();
                                onRejectReschedule?.(item.id);
                            }}
                        >
                            Отклонить
                        </button>
                    </div>
                )}

                {/* Entity link */}
                {entityLink && !isBookingNew && !isRescheduleRequested && (
                    <Link
                        href={entityLink.href}
                        className="inline-flex items-center gap-1 mt-2 text-xs font-bold text-purple-1 hover:underline"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <Icon className="icon-14 fill-purple-1" name={entityLink.icon} />
                        {entityLink.label}
                    </Link>
                )}

                {item.actionLabel && !isBookingNew && !isRescheduleRequested && !entityLink && (
                    <button
                        className="mt-2 text-xs font-bold text-purple-1 hover:underline"
                        onClick={(e) => {
                            e.stopPropagation();
                            onAction?.();
                        }}
                    >
                        {item.actionLabel}
                    </button>
                )}
            </div>
        </div>
    );
};

export default NotificationItem;
