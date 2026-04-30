import { useEffect, useState } from "react";
import Link from "next/link";
import { Button, Text } from "@gravity-ui/uikit";

const COOKIE_CONSENT_KEY = "repeto:cookie-consent-v1";

const CookieBanner = () => {
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        if (typeof window === "undefined") return;
        const saved = window.localStorage.getItem(COOKIE_CONSENT_KEY);
        if (saved === "accepted" || saved === "configured") return;
        setVisible(true);
    }, []);

    const acceptCookies = () => {
        if (typeof window !== "undefined") {
            window.localStorage.setItem(COOKIE_CONSENT_KEY, "accepted");
        }
        setVisible(false);
    };

    const closeForNow = () => {
        if (typeof window !== "undefined") {
            window.localStorage.setItem(COOKIE_CONSENT_KEY, "configured");
        }
        setVisible(false);
    };

    if (!visible) return null;

    return (
        <div className="repeto-cookie-banner" role="dialog" aria-live="polite" aria-label="Cookie уведомление">
            <div className="repeto-cookie-banner__content">
                <Text variant="body-1" style={{ display: "block", marginBottom: 4, fontWeight: 600 }}>
                    Мы используем cookie
                </Text>
                <Text variant="caption-2" color="secondary" style={{ display: "block", lineHeight: 1.45 }}>
                    Cookie нужны для авторизации, стабильной работы сервиса и аналитики. Продолжая работу,
                    вы соглашаетесь с использованием cookie.
                </Text>
            </div>
            <div className="repeto-cookie-banner__actions">
                <Link href="/legal#cookies" className="repeto-cookie-banner__link">
                    Подробнее
                </Link>
                <Button size="m" view="outlined" onClick={closeForNow}>
                    Настроить
                </Button>
                <Button size="m" view="action" onClick={acceptCookies}>
                    Согласен
                </Button>
            </div>
        </div>
    );
};

export default CookieBanner;
