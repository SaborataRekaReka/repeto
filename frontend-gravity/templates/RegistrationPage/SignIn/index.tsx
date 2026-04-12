import { useState } from "react";
import { TextInput, Button, Text, Icon } from "@gravity-ui/uikit";
import { Eye, EyeSlash } from "@gravity-ui/icons";
import type { IconData } from "@gravity-ui/uikit";
import { useAuth } from "@/contexts/AuthContext";
import { codedErrorMessage } from "@/lib/errorCodes";

type SignInProps = {
    onRecover: () => void;
};

const LABEL_STYLE: React.CSSProperties = {
    display: "block",
    marginBottom: 6,
    fontSize: 13,
    fontWeight: 600,
    color: "var(--g-color-text-primary)",
};

const FIELD_STYLE: React.CSSProperties = {
    marginBottom: 16,
};

const SignIn = ({ onRecover }: SignInProps) => {
    const [login, setLogin] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const { login: authLogin } = useAuth();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setLoading(true);
        try {
            await authLogin(login.trim(), password);
        } catch (err: any) {
            setError(codedErrorMessage("AUTH-SIGNIN", err));
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} noValidate>
            <Text
                variant="header-2"
                style={{ display: "block", marginBottom: 6 }}
            >
                Вход в Repeto
            </Text>
            <Text
                variant="body-1"
                color="secondary"
                style={{ display: "block", marginBottom: 24 }}
            >
                Введите данные вашего аккаунта
            </Text>

            {/* Email / phone */}
            <div style={FIELD_STYLE}>
                <span style={LABEL_STYLE}>Email или телефон</span>
                <TextInput
                    size="l"
                    type="text"
                    placeholder="email@example.com"
                    value={login}
                    onUpdate={setLogin}
                    autoComplete="email"
                />
            </div>

            {/* Password */}
            <div style={{ marginBottom: 8 }}>
                <span style={LABEL_STYLE}>Пароль</span>
                <TextInput
                    size="l"
                    type={showPassword ? "text" : "password"}
                    placeholder="Введите пароль"
                    value={password}
                    onUpdate={setPassword}
                    autoComplete="current-password"
                    rightContent={
                        <button
                            type="button"
                            onClick={() => setShowPassword((v) => !v)}
                            style={{
                                display: "flex",
                                alignItems: "center",
                                padding: "0 10px",
                                background: "none",
                                border: "none",
                                cursor: "pointer",
                                color: "var(--g-color-text-secondary)",
                            }}
                            aria-label={showPassword ? "Скрыть пароль" : "Показать пароль"}
                        >
                            <Icon
                                data={showPassword ? (EyeSlash as IconData) : (Eye as IconData)}
                                size={16}
                            />
                        </button>
                    }
                />
            </div>

            {/* Forgot password */}
            <div style={{ textAlign: "right", marginBottom: 24 }}>
                <button
                    type="button"
                    onClick={onRecover}
                    style={{
                        fontSize: 13,
                        color: "var(--g-color-text-brand)",
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        padding: 0,
                        fontWeight: 600,
                    }}
                >
                    Забыли пароль?
                </button>
            </div>

            {/* Error */}
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
                Войти
            </Button>
        </form>
    );
};

export default SignIn;