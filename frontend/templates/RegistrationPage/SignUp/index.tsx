import { useState } from "react";
import Field from "@/components/Field";
import Checkbox from "@/components/Checkbox";
import { useAuth } from "@/contexts/AuthContext";

type SignUpProps = {};

const SignUp = ({}: SignUpProps) => {
    const [name, setName] = useState<string>("");
    const [email, setEmail] = useState<string>("");
    const [phone, setPhone] = useState<string>("");

    const handlePhoneChange = (e: any) => {
        let digits = e.target.value.replace(/\D/g, "");
        if (digits.startsWith("8")) digits = "7" + digits.slice(1);
        if (!digits.startsWith("7") && digits.length > 0) digits = "7" + digits;
        if (digits.length === 0) { setPhone(""); return; }
        let formatted = "+7";
        if (digits.length > 1) formatted += " " + digits.slice(1, 4);
        if (digits.length > 4) formatted += " " + digits.slice(4, 7);
        if (digits.length > 7) formatted += "-" + digits.slice(7, 9);
        if (digits.length > 9) formatted += "-" + digits.slice(9, 11);
        setPhone(formatted);
    };
    const [password, setPassword] = useState<string>("");
    const [passwordConfirm, setPasswordConfirm] = useState<string>("");
    const [conditions, setConditions] = useState<boolean>(false);
    const [error, setError] = useState<string>("");
    const [loading, setLoading] = useState(false);
    const { register } = useAuth();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        if (password !== passwordConfirm) {
            setError("Пароли не совпадают");
            return;
        }
        if (!conditions) {
            setError("Примите условия использования");
            return;
        }
        setLoading(true);
        try {
            await register({ name, email, phone: phone || undefined, password });
        } catch (err: any) {
            if (err?.message === "Failed to fetch") {
                setError("Нет соединения с сервером. Проверьте, что backend запущен на http://localhost:3200");
            } else {
                setError(err?.message || "Ошибка регистрации");
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <form action="" onSubmit={handleSubmit}>
                <div className="mb-1 text-h1">Регистрация</div>
                <div className="mb-12 text-sm text-n-2 dark:text-white/50">
                    Создайте аккаунт репетитора
                </div>
                <Field
                    className="mb-4.5"
                    label="Ваше имя"
                    type="text"
                    placeholder="Иванов Пётр Сергеевич"
                    value={name}
                    onChange={(e: any) => setName(e.target.value)}
                    required
                />
                <Field
                    className="mb-4.5"
                    label="Email"
                    type="email"
                    placeholder="email@example.com"
                    icon="email"
                    value={email}
                    onChange={(e: any) => setEmail(e.target.value)}
                    required
                />
                <Field
                    className="mb-4.5"
                    label="Телефон"
                    type="tel"
                    placeholder="+7 900 123-45-67"
                    value={phone}
                    onChange={handlePhoneChange}
                />
                <Field
                    className="mb-4.5"
                    label="Пароль"
                    type="password"
                    placeholder="Введите пароль"
                    value={password}
                    onChange={(e: any) => setPassword(e.target.value)}
                    required
                />
                <Field
                    className="mb-6.5"
                    label="Повторите пароль"
                    type="password"
                    placeholder="Повторите пароль"
                    value={passwordConfirm}
                    onChange={(e: any) => setPasswordConfirm(e.target.value)}
                    required
                />
                <Checkbox
                    className="mb-6.5"
                    label="Согласен с условиями использования и политикой конфиденциальности"
                    value={conditions}
                    onChange={() => setConditions(!conditions)}
                />
                {error && (
                    <div className="mb-4 text-sm text-pink-1">{error}</div>
                )}
                <button
                    className="btn-purple btn-shadow w-full h-14"
                    type="submit"
                    disabled={loading}
                >
                    {loading ? "Создание..." : "Создать аккаунт"}
                </button>
            </form>
        </>
    );
};

export default SignUp;