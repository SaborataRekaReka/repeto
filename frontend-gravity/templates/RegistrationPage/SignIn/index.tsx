import { useState } from "react";
import Field from "@/components/Field";
import Checkbox from "@/components/Checkbox";
import { useAuth } from "@/contexts/AuthContext";

type SignInProps = {
    onRecover: () => void;
};

const SignIn = ({ onRecover }: SignInProps) => {
    const [email, setEmail] = useState<string>("");
    const [password, setPassword] = useState<string>("");
    const [remember, setRemember] = useState<boolean>(false);
    const [error, setError] = useState<string>("");
    const [loading, setLoading] = useState(false);
    const { login } = useAuth();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setLoading(true);
        try {
            await login(email.trim(), password);
        } catch (err: any) {
            const message = err?.message || "Неверный email/телефон или пароль";
            if (message === "Failed to fetch") {
                setError("Не удалось подключиться к серверу. Проверьте, что backend запущен на localhost:3200.");
            } else {
                setError(message);
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <form action="" onSubmit={handleSubmit}>
                <div className="mb-1 text-h1">Вход</div>
                <div className="mb-12 text-sm text-n-2 dark:text-white/50">
                    Введите данные вашего аккаунта
                </div>
                <Field
                    className="mb-4.5"
                    label="Email или телефон"
                    type="text"
                    placeholder="Введите email или телефон"
                    icon="email"
                    value={email}
                    onChange={(e: any) => setEmail(e.target.value)}
                    required
                />
                <Field
                    className="mb-6.5"
                    label="Пароль"
                    type="password"
                    placeholder="Введите пароль"
                    value={password}
                    onChange={(e: any) => setPassword(e.target.value)}
                    required
                />
                <div className="flex justify-between items-center mb-6.5">
                    <Checkbox
                        label="Запомнить меня"
                        value={remember}
                        onChange={() => setRemember(!remember)}
                    />
                    <button
                        className="mt-0.5 text-xs font-bold transition-colors hover:text-purple-1"
                        type="button"
                        onClick={onRecover}
                    >
                        Забыли пароль?
                    </button>
                </div>
                {error && (
                    <div className="mb-4 text-sm text-pink-1">{error}</div>
                )}
                <button
                    className="btn-purple btn-shadow w-full h-14"
                    type="submit"
                    disabled={loading}
                >
                    {loading ? "Вход..." : "Войти"}
                </button>
            </form>
        </>
    );
};

export default SignIn;