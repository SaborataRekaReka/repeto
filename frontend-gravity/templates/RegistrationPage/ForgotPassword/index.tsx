import { useState } from "react";
import { TextInput, Button, Text, Icon } from "@gravity-ui/uikit";
import { CircleCheck } from "@gravity-ui/icons";
import type { IconData } from "@gravity-ui/uikit";

type ForgotPasswordProps = {
    onBack: () => void;
};

const LABEL_STYLE: React.CSSProperties = {
    display: "block",
    marginBottom: 6,
    fontSize: 13,
    fontWeight: 600,
    color: "var(--g-color-text-primary)",
};

const ForgotPassword = ({ onBack }: ForgotPasswordProps) => {
    const [email, setEmail] = useState("");
    const [sent, setSent] = useState(false);

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

    return (
        <form
            onSubmit={(e) => {
                e.preventDefault();
                setSent(true);
            }}
            noValidate
        >
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

            <Button
                view="action"
                size="xl"
                type="submit"
                width="max"
                style={{ borderRadius: 12, marginBottom: 12 }}
            >
                Отправить инструкции
            </Button>

            <Button view="flat" size="l" width="max" onClick={onBack}>
                ← Назад ко входу
            </Button>
        </form>
    );
};

export default ForgotPassword;