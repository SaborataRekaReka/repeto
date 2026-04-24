import { useEffect, useState } from "react";
import Link from "next/link";
import { Xmark } from "@gravity-ui/icons";
import { Icon } from "@gravity-ui/uikit";
import type { IconData } from "@gravity-ui/uikit";

const DISMISS_KEY = "repeto:dashboard:insight-banner:dismissed";

/**
 * Tochka-inspired lavender promo banner. Appears on the dashboard once per
 * browser until the user dismisses it. Suggests enabling auto-reminders.
 */
const InsightBanner = () => {
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        if (typeof window === "undefined") return;
        try {
            const dismissed = window.localStorage.getItem(DISMISS_KEY) === "1";
            if (!dismissed) setVisible(true);
        } catch {
            setVisible(true);
        }
    }, []);

    const handleDismiss = () => {
        setVisible(false);
        try {
            window.localStorage.setItem(DISMISS_KEY, "1");
        } catch {
            /* ignore */
        }
    };

    if (!visible) return null;

    return (
        <aside className="repeto-insight-banner" role="note">
            <div className="repeto-insight-banner__content">
                <div className="repeto-insight-banner__title">
                    Автоматизируйте напоминания ученикам
                </div>
                <div className="repeto-insight-banner__text">
                    Включите уведомления о занятиях и оплате — меньше переносов и долгов, больше времени на преподавание.
                </div>
            </div>
            <Link href="/settings" className="repeto-insight-banner__cta">
                Настроить
            </Link>
            <button
                type="button"
                className="repeto-insight-banner__close"
                onClick={handleDismiss}
                aria-label="Скрыть подсказку"
            >
                <Icon data={Xmark as IconData} size={14} />
            </button>
        </aside>
    );
};

export default InsightBanner;
