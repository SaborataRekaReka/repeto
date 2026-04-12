import { useState } from "react";
import { TextInput, Button, Text, Checkbox } from "@gravity-ui/uikit";
import { useAuth } from "@/contexts/AuthContext";
import { codedErrorMessage } from "@/lib/errorCodes";

const LABEL_STYLE: React.CSSProperties = {
    display: "block",
    marginBottom: 6,
    fontSize: 13,
    fontWeight: 600,
    color: "var(--g-color-text-primary)",
};

const FIELD_STYLE: React.CSSProperties = { marginBottom: 14 };

const SignUp = () => {
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [phone, setPhone] = useState("");
    const [password, setPassword] = useState("");
    const [passwordConfirm, setPasswordConfirm] = useState("");
    const [conditions, setConditions] = useState(false);
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const { register } = useAuth();

    const handlePhoneChange = (value: string) => {
        let digits = value.replace(/\D/g, "");
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
            setError(codedErrorMessage("AUTH-SIGNUP", err));
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} noValidate>
            <Text variant="header-2" style={{ display: "block", marginBottom: 6 }}>
                Регистрация
            </Text>
            <Text
                variant="body-1"
                color="secondary"
                style={{ display: "block", marginBottom: 24 }}
            >
                Создайте аккаунт репетитора
            </Text>

            <div style={FIELD_STYLE}>
                <span style={LABEL_STYLE}>Ваше имя</span>
                <TextInput
                    size="l"
                    type="text"
                    placeholder="Иванов Пётр Сергеевич"
                    value={name}
                    onUpdate={setName}
                    autoComplete="name"
                />
            </div>

            <div style={FIELD_STYLE}>
                <span style={LABEL_STYLE}>Email</span>
                <TextInput
                    size="l"
                    type="email"
                    placeholder="email@example.com"
                    value={email}
                    onUpdate={setEmail}
                    autoComplete="email"
                />
            </div>

            <div style={FIELD_STYLE}>
                <span style={LABEL_STYLE}>
                    Телефон{" "}
                    <span style={{ fontWeight: 400, color: "var(--g-color-text-secondary)" }}>
                        (необязательно)
                    </span>
                </span>
                <TextInput
                    size="l"
                    type="tel"
                    placeholder="+7 900 123-45-67"
                    value={phone}
                    onUpdate={handlePhoneChange}
                    autoComplete="tel"
                />
            </div>

            <div style={FIELD_STYLE}>
                <span style={LABEL_STYLE}>Пароль</span>
                <TextInput
                    size="l"
                    type="password"
                    placeholder="Минимум 8 символов"
                    value={password}
                    onUpdate={setPassword}
                    autoComplete="new-password"
                />
            </div>

            <div style={{ ...FIELD_STYLE, marginBottom: 20 }}>
                <span style={LABEL_STYLE}>Повторите пароль</span>
                <TextInput
                    size="l"
                    type="password"
                    placeholder="Повторите пароль"
                    value={passwordConfirm}
                    onUpdate={setPasswordConfirm}
                    autoComplete="new-password"
                />
            </div>

            <div style={{ marginBottom: 20 }}>
                <Checkbox
                    checked={conditions}
                    onUpdate={setConditions}
                    size="m"
                >
                    <span style={{ fontSize: 13, color: "var(--g-color-text-secondary)" }}>
                        Согласен с условиями использования и политикой конфиденциальности
                    </span>
                </Checkbox>
            </div>

            {error && (
                <div
                    style={{
                        marginBottom: 16,
                        padding: "10px 14px",
                        borderRadius: 10,
                        background: "rgba(209,107,143,0.10)",
                        color: "var(--g-color-text-danger)",
                        fontSize: 13,
                    }}
                >
                    {error}
                </div>
            )}

            <Button
                view="action"
                size="xl"
                type="submit"
                loading={loading}
                width="max"
                style={{ borderRadius: 12 }}
            >
                Создать аккаунт
            </Button>
        </form>
    );
};

export default SignUp;