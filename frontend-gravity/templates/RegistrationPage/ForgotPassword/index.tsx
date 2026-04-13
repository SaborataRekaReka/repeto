import { useState } from "react";
import { TextInput, Button, Text, Icon } from "@gravity-ui/uikit";
import { CircleCheck } from "@gravity-ui/icons";
import type { IconData } from "@gravity-ui/uikit";
import { api } from "@/lib/api";
import { codedErrorMessage } from "@/lib/errorCodes";

type ForgotPasswordProps = {
    onBack: () => void;
    token?: string;
};

const LABEL_STYLE: React.CSSProperties = {
    display: "block",
    marginBottom: 6,
    fontSize: 13,
    fontWeight: 600,
    color: "var(--g-color-text-primary)",
};

const ForgotPassword = ({ onBack, token }: ForgotPasswordProps) => {
    const isResetMode = Boolean(token);
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [passwordRepeat, setPasswordRepeat] = useState("");
    const [sent, setSent] = useState(false);
    const [resetDone, setResetDone] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const handleForgotSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setLoading(true);
        try {
            await api('/auth/forgot-password', {
                method: 'POST',
                body: { email: email.trim().toLowerCase() },
            });
            setSent(true);
        } catch (err: any) {
            setError(codedErrorMessage("AUTH-FORGOT", err));
        } finally {
            setLoading(false);
        }
    };

    const handleResetSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");

        if (password.length < 8) {
            setError("Пароль должен содержать минимум 8 символов");
            return;
        }
        if (password !== passwordRepeat) {
            setError("Пароли не совпадают");
            return;
        }

        setLoading(true);
        try {
            await api('/auth/reset-password', {
                method: 'POST',
                body: { token, password },
            });
            setResetDone(true);
        } catch (err: any) {
            setError(codedErrorMessage("AUTH-RESET", err));
        } finally {
            setLoading(false);
        }
    };

    if (resetDone) {
        return (
            <div style={{ textAlign: "center", padding: "8px 0" }}>
                <div
                    style={{
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "center",
                        width: 56,
                        height: 56,
                        borderRadius: "50%",
                        background: "rgba(34,197,94,0.12)",
                        color: "#22C55E",
                        marginBottom: 20,
                    }}
                >
                    <Icon data={CircleCheck as IconData} size={28} />
                </div>
                <Text variant="header-2" style={{ display: "block", marginBottom: 8 }}>
                    Пароль обновлен
                </Text>
                <Text
                    variant="body-1"
                    color="secondary"
                    style={{ display: "block", marginBottom: 28, lineHeight: 1.6 }}
                >
                    Войдите с новым паролем.
                </Text>
                <Button view="action" size="l" width="max" onClick={onBack}>
                    Перейти ко входу
                </Button>
            </div>
        );
    }

    if (sent) {
        return (
            <div style={{ textAlign: "center", padding: "8px 0" }}>
                <div
                    style={{
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "center",
                        width: 56,
                        height: 56,
                        borderRadius: "50%",
                        background: "rgba(34,197,94,0.12)",
                        color: "#22C55E",
                        marginBottom: 20,
                    }}
                >
                    <Icon data={CircleCheck as IconData} size={28} />
                </div>
                <Text variant="header-2" style={{ display: "block", marginBottom: 8 }}>
                    Письмо отправлено
                </Text>
                <Text
                    variant="body-1"
                    color="secondary"
                    style={{ display: "block", marginBottom: 28, lineHeight: 1.6 }}
                >
                    Проверьте входящие сообщения на{" "}
                    <strong style={{ color: "var(--g-color-text-primary)" }}>{email}</strong>. Следуйте
                    инструкциям в письме.
                </Text>
                <Button view="outlined" size="l" width="max" onClick={onBack}>
                    ← Назад ко входу
                </Button>
            </div>
        );
    }

    if (isResetMode) {
        return (
            <form onSubmit={handleResetSubmit} noValidate>
                <Text variant="header-2" style={{ display: "block", marginBottom: 6 }}>
                    Новый пароль
                </Text>
                <Text
                    variant="body-1"
                    color="secondary"
                    style={{ display: "block", marginBottom: 24, lineHeight: 1.6 }}
                >
                    Установите новый пароль для вашего аккаунта.
                </Text>

                <div style={{ marginBottom: 16 }}>
                    <span style={LABEL_STYLE}>Новый пароль</span>
                    <TextInput
                        size="l"
                        type="password"
                        placeholder="Минимум 8 символов"
                        value={password}
                        onUpdate={setPassword}
                        autoComplete="new-password"
                    />
                </div>

                <div style={{ marginBottom: 24 }}>
                    <span style={LABEL_STYLE}>Повторите пароль</span>
                    <TextInput
                        size="l"
                        type="password"
                        placeholder="Повторите новый пароль"
                        value={passwordRepeat}
                        onUpdate={setPasswordRepeat}
                        autoComplete="new-password"
                    />
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
                    width="max"
                    loading={loading}
                    style={{ borderRadius: 12, marginBottom: 12 }}
                >
                    Сохранить пароль
                </Button>

                <Button view="flat" size="l" width="max" onClick={onBack} disabled={loading}>
                    ← Назад ко входу
                </Button>
            </form>
        );
    }

    return (
        <form onSubmit={handleForgotSubmit} noValidate>
            <Text variant="header-2" style={{ display: "block", marginBottom: 6 }}>
                Восстановление пароля
            </Text>
            <Text
                variant="body-1"
                color="secondary"
                style={{ display: "block", marginBottom: 24, lineHeight: 1.6 }}
            >
                Введите email вашего аккаунта, и мы отправим инструкции по восстановлению.
            </Text>

            <div style={{ marginBottom: 24 }}>
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
                width="max"
                loading={loading}
                disabled={!email.trim()}
                style={{ borderRadius: 12, marginBottom: 12 }}
            >
                Отправить инструкции
            </Button>

            <Button view="flat" size="l" width="max" onClick={onBack} disabled={loading}>
                ← Назад ко входу
            </Button>
        </form>
    );
};

export default ForgotPassword;