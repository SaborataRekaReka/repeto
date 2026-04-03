import Icon from "@/components/Icon";
import type { Notification } from "@/types/notification";
import {
    getNotificationIcon,
    getNotificationColor,
} from "@/mocks/notifications";

type NotificationItemProps = {
    item: Notification;
    onAction?: () => void;
};

const NotificationItem = ({ item, onAction }: NotificationItemProps) => (
    <div
        className={`flex items-start px-5 py-4 border-b border-n-1 last:border-none transition-colors dark:border-white ${
            !item.read
                ? "bg-purple-2/30 dark:bg-purple-1/5"
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
            {item.actionLabel && (
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

export default NotificationItem;
