import { useState, useEffect } from "react";

const DISMISSED_KEY = "portal-signup-dismissed";

const SignUpBanner = () => {
    const [dismissed, setDismissed] = useState(true);

    useEffect(() => {
        setDismissed(localStorage.getItem(DISMISSED_KEY) === "1");
    }, []);

    if (dismissed) return null;

    const handleDismiss = () => {
        localStorage.setItem(DISMISSED_KEY, "1");
        setDismissed(true);
    };

    const handleSignUp = () => {
        alert("Функция будет доступна в ближайшем обновлении");
    };

    return (
        <div className="card mt-8">
            <div className="p-5 relative">
                <button
                    className="absolute top-3 right-3 text-n-3 hover:text-n-1 dark:text-white/50 dark:hover:text-white transition-colors"
                    onClick={handleDismiss}
                    aria-label="Закрыть"
                >
                    ✕
                </button>
                <div className="text-sm font-bold mb-1">
                    Хотите получать напоминания о занятиях?
                </div>
                <p className="text-xs text-n-3 dark:text-white/50 mb-4">
                    Создайте аккаунт, чтобы получать уведомления на email о
                    занятиях и домашних заданиях.
                </p>
                <button
                    className="btn-purple btn-small"
                    onClick={handleSignUp}
                >
                    Создать аккаунт
                </button>
            </div>
        </div>
    );
};

export default SignUpBanner;
