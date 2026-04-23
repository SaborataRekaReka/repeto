import Link from "next/link";
import { Text, Button, Icon } from "@gravity-ui/uikit";
import {
    CircleCheck,
    TriangleExclamation,
    Clock,
    Xmark,
    Calendar,
    FileText,
    PersonPlus,
    CircleInfo,
    Person,
} from "@gravity-ui/icons";
import type { IconData } from "@gravity-ui/uikit";
import type { Notification, NotificationType } from "@/types/notification";

const iconMap: Record<NotificationType, unknown> = {
    payment_received: CircleCheck,
    payment_overdue: TriangleExclamation,
    lesson_reminder: Clock,
    lesson_cancelled: Xmark,
    reschedule_requested: Calendar,
    homework_submitted: FileText,
    booking_new: PersonPlus,
    booking_confirmed: CircleCheck,
    booking_rejected: Xmark,
    system: CircleInfo,
};

const colorMap: Record<NotificationType, string> = {
    payment_received: "rgba(46,184,92,0.15)",
    payment_overdue: "rgba(239,71,111,0.15)",
    lesson_reminder: "rgba(255,193,7,0.15)",
    lesson_cancelled: "rgba(239,71,111,0.15)",
    reschedule_requested: "rgba(255,193,7,0.15)",
    homework_submitted: "rgba(174,122,255,0.15)",
    booking_new: "rgba(174,122,255,0.15)",
    booking_confirmed: "rgba(46,184,92,0.15)",
    booking_rejected: "rgba(239,71,111,0.15)",
    system: "rgba(128,128,128,0.12)",
};

const bannerThemeMap: Record<NotificationType, "info" | "warning" | "danger" | "success"> = {
    payment_received: "success",
    payment_overdue: "danger",
    lesson_reminder: "warning",
    lesson_cancelled: "danger",
    reschedule_requested: "warning",
    homework_submitted: "info",
    booking_new: "info",
    booking_confirmed: "success",
    booking_rejected: "danger",
    system: "info",
};

const bannerIconMap: Record<NotificationType, unknown> = {
    payment_received: CircleCheck,
    payment_overdue: TriangleExclamation,
    lesson_reminder: TriangleExclamation,
    lesson_cancelled: TriangleExclamation,
    reschedule_requested: TriangleExclamation,
    homework_submitted: CircleInfo,
    booking_new: CircleInfo,
    booking_confirmed: CircleCheck,
    booking_rejected: TriangleExclamation,
    system: CircleInfo,
};

function getEntityLink(item: Notification): { href: string; label: string } | null {
    if (item.title === "Оставлен отзыв на занятие") {
        const reviewHref =
            item.studentId && item.lessonId
                ? `/students/${item.studentId}?tab=lessons&lessonId=${item.lessonId}`
                : undefined;

        const href = reviewHref || item.actionUrl || (item.studentId ? `/students/${item.studentId}` : undefined);
        if (href) {
            return { href, label: "Открыть отзыв" };
        }
    }

    const t = item.type;
    if (
        (t === "lesson_cancelled" || t === "lesson_reminder" ||
         t === "booking_confirmed" || t === "homework_submitted" ||
         t === "payment_received" || t === "payment_overdue") &&
        item.studentId
    ) {
        return { href: `/students/${item.studentId}`, label: "К ученику" };
    }
    return null;
}

type NotificationItemProps = {
    item: Notification;
    onAction?: () => void;
    onRead?: (id: string) => void;
    onConfirmBooking?: (id: string) => void;
    onRejectBooking?: (id: string) => void;
    onConfirmReschedule?: (id: string) => void;
    onRejectReschedule?: (id: string) => void;
};

const NotificationItem = ({
    item,
    onAction,
    onRead,
    onConfirmBooking,
    onRejectBooking,
    onConfirmReschedule,
    onRejectReschedule,
}: NotificationItemProps) => {
    const isBookingNew = item.type === "booking_new" && item.bookingRequestId;
    const isRescheduleRequested = item.type === "reschedule_requested" && !item.read;
    const entityLink = getEntityLink(item);
    const iconComponent = iconMap[item.type];
    const iconBg = colorMap[item.type];

    return (
        <div
            onClick={() => { if (!item.read) onRead?.(item.id); }}
            style={{
                display: "flex", alignItems: "flex-start",
                padding: "16px 20px",
                borderBottom: "1px solid var(--g-color-line-generic)",
                transition: "background 0.15s",
                cursor: !item.read ? "pointer" : undefined,
                background: !item.read ? "rgba(174,122,255,0.04)" : undefined,
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = !item.read ? "rgba(174,122,255,0.07)" : "var(--g-color-base-simple-hover)")}
            onMouseLeave={(e) => (e.currentTarget.style.background = !item.read ? "rgba(174,122,255,0.04)" : "transparent")}
        >
            {/* Icon */}
            <div style={{
                width: 36, height: 36, borderRadius: "50%",
                background: iconBg, flexShrink: 0, marginRight: 12,
                display: "flex", alignItems: "center", justifyContent: "center",
            }}>
                <Icon data={iconComponent as IconData} size={18} />
            </div>

            {/* Content */}
            <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 2 }}>
                    <Text variant="body-1" style={{ fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", marginRight: 8 }}>
                        {item.title}
                    </Text>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
                        <Text variant="caption-2" color="secondary">{item.time}</Text>
                        {!item.read && (
                            <div style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--g-color-text-brand)", flexShrink: 0 }} />
                        )}
                    </div>
                </div>

                {item.description && (
                    <div className={`repeto-notif-banner repeto-notif-banner--${bannerThemeMap[item.type]}`}>
                        <span className="repeto-notif-banner__icon">
                            <Icon data={bannerIconMap[item.type] as IconData} size={16} />
                        </span>
                        <span className="repeto-notif-banner__text">{item.description}</span>
                    </div>
                )}

                {/* Booking action buttons */}
                {isBookingNew && !item.read && (
                    <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
                        <Button view="action" size="s" onClick={(e) => { e.stopPropagation(); onConfirmBooking?.(item.id); }}>
                            Подтвердить
                        </Button>
                        <Button view="outlined-danger" size="s" onClick={(e) => { e.stopPropagation(); onRejectBooking?.(item.id); }}>
                            Отклонить
                        </Button>
                    </div>
                )}

                {/* Reschedule action buttons */}
                {isRescheduleRequested && (
                    <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
                        <Button view="action" size="s" onClick={(e) => { e.stopPropagation(); onConfirmReschedule?.(item.id); }}>
                            Подтвердить перенос
                        </Button>
                        <Button view="outlined-danger" size="s" onClick={(e) => { e.stopPropagation(); onRejectReschedule?.(item.id); }}>
                            Отклонить
                        </Button>
                    </div>
                )}

                {/* Entity link */}
                {entityLink && !isBookingNew && !isRescheduleRequested && (
                    <Link
                        href={entityLink.href}
                        onClick={(e) => e.stopPropagation()}
                        style={{
                            display: "inline-flex", alignItems: "center", gap: 4,
                            marginTop: 10, fontSize: 13, fontWeight: 600,
                            color: "var(--g-color-text-brand)", textDecoration: "none",
                        }}
                    >
                        <Icon data={Person as IconData} size={14} />
                        {entityLink.label}
                    </Link>
                )}

                {/* Generic action */}
                {item.actionLabel && !isBookingNew && !isRescheduleRequested && !entityLink && (
                    <button
                        onClick={(e) => { e.stopPropagation(); onAction?.(); }}
                        style={{
                            display: "block", marginTop: 10, background: "none", border: "none",
                            cursor: "pointer", fontSize: 13, fontWeight: 600,
                            color: "var(--g-color-text-brand)", padding: 0,
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
