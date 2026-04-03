import { useState } from "react";
import Field from "@/components/Field";

type ForgotPasswordProps = {
    sent: boolean;
    onSent: () => void;
    onBack: () => void;
};

const ForgotPassword = ({ sent, onSent, onBack }: ForgotPasswordProps) => {
    const [email, setEmail] = useState<string>("");

    if (sent) {
        return (
            <div>
                <div className="mb-1 text-h1">Письмо отправлено</div>
                <div className="mb-8 text-sm text-n-2 dark:text-white/50">
                    Мы отправили инструкции по восстановлению пароля на указанный email. Проверьте входящие сообщения.
                </div>
                <button
                    className="btn-purple btn-shadow w-full h-14"
                    type="button"
                    onClick={onBack}
                >
                    Назад ко входу
                </button>
            </div>
        );
    }

    return (
        <>
            <form action="" onSubmit={(e) => { e.preventDefault(); onSent(); }}>
                <div className="mb-1 text-h1">Забыли пароль?</div>
                <div className="mb-12 text-sm text-n-2 dark:text-white/50">
                    Введите email вашего аккаунта, и мы отправим инструкции по восстановлению пароля.
                </div>
                <Field
                    className="mb-4.5"
                    label="Email вашего аккаунта"
                    type="email"
                    placeholder="Введите email"
                    icon="email"
                    value={email}
                    onChange={(e: any) => setEmail(e.target.value)}
                    required
                />
                <button
                    className="btn-purple btn-shadow w-full h-14"
                    type="submit"
                >
                    Восстановить пароль
                </button>
                <button
                    className="mt-4 w-full text-sm font-bold transition-colors hover:text-purple-1"
                    type="button"
                    onClick={onBack}
                >
                    ← Назад ко входу
                </button>
            </form>
        </>
    );
};

export default ForgotPassword;