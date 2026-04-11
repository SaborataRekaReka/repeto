import type { PortalNotifications } from "@/types/student-portal";

type Props = {
    notifications?: PortalNotifications | null;
};

const SignUpBanner = ({ notifications }: Props) => {
    if (!notifications) return null;

    const { telegram, max } = notifications;
    const allConnected =
        (!telegram || telegram.connected) && (!max || max.connected);

    if (allConnected) {
        return (
            <div className="card mt-8">
                <div className="p-5">
                    <div className="text-sm font-bold mb-1">
                        🔔 Уведомления подключены
                    </div>
                    <p className="text-xs text-n-3 dark:text-white/50">
                        Вы будете получать напоминания о занятиях
                        {telegram?.connected && " в Telegram"}
                        {telegram?.connected && max?.connected && " и"}
                        {max?.connected && " в Макс"}
                        .
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="card mt-8">
            <div className="p-5">
                <div className="text-sm font-bold mb-1">
                    🔔 Получайте напоминания о занятиях
                </div>
                <p className="text-xs text-n-3 dark:text-white/50 mb-4">
                    Подключите мессенджер, чтобы получать уведомления о
                    назначенных занятиях, отменах и напоминания.
                </p>
                <div className="flex flex-wrap gap-3">
                    {telegram && !telegram.connected && telegram.deepLink && (
                        <a
                            href={telegram.deepLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn-purple btn-small inline-flex items-center gap-2"
                        >
                            <svg
                                width="16"
                                height="16"
                                viewBox="0 0 24 24"
                                fill="currentColor"
                            >
                                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 00-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.41-1.08.4-.36-.01-1.04-.2-1.55-.37-.63-.2-1.12-.31-1.08-.66.02-.18.27-.36.74-.55 2.92-1.27 4.86-2.11 5.83-2.51 2.78-1.16 3.35-1.36 3.73-1.36.08 0 .27.02.39.12.1.08.13.19.14.27-.01.06.01.24 0 .38z" />
                            </svg>
                            Подключить Telegram
                        </a>
                    )}
                    {max && !max.connected && (
                        <span className="text-xs text-n-3 dark:text-white/50 flex items-center">
                            Макс: напишите боту команду{" "}
                            <code className="mx-1 px-1 bg-n-1 dark:bg-white/10 rounded text-[11px]">
                                /start
                            </code>
                        </span>
                    )}
                </div>
            </div>
        </div>
    );
};

export default SignUpBanner;
