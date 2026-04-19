import { useState } from "react";
import { useRouter } from "next/router";
import { TextInput, Button, Text } from "@gravity-ui/uikit";
import {
    requestStudentOtp,
    verifyStudentOtp,
} from "@/lib/studentAuth";
import { codedErrorMessage } from "@/lib/errorCodes";

type StudentSignInProps = {
    onBack: () => void;
};

const LABEL_STYLE: React.CSSProperties = {
    display: "block",
    marginBottom: 6,
    fontSize: 13,
    fontWeight: 600,
    color: "var(--g-color-text-primary)",
};

const StudentSignIn = ({ onBack }: StudentSignInProps) => {
    const router = useRouter();
    const [step, setStep] = useState<"email" | "code">("email");
    const [email, setEmail] = useState("");
    const [code, setCode] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [info, setInfo] = useState("");

    const handleRequestCode = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setInfo("");
        if (!email.trim().includes("@")) {
            setError("Введите корректный email");
            return;
        }
        setLoading(true);
        try {
            await requestStudentOtp(email.trim(), "LOGIN");
            setStep("code");
            setInfo("Мы отправили код на " + email.trim());
        } catch (err: any) {
            setError(codedErrorMessage("STUDENT-OTP-REQUEST", err));
        } finally {
            setLoading(false);
        }
    };

    const handleVerify = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        if (code.trim().length < 4) {
            setError("Введите код из письма");
            return;
        }
        setLoading(true);
        try {
            const result = await verifyStudentOtp(email, code);
            if (result.needsSetup) {
                router.replace("/student/setup");
            } else {
                router.replace("/student");
            }
        } catch (err: any) {
            setError(codedErrorMessage("STUDENT-OTP-VERIFY", err));
        } finally {
            setLoading(false);
        }
    };

    const handleResend = async () => {
        setError("");
        setInfo("");
        setLoading(true);
        try {
            await requestStudentOtp(email.trim(), "LOGIN");
            setInfo("Новый код отправлен");
        } catch (err: any) {
            setError(codedErrorMessage("STUDENT-OTP-RESEND", err));
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={step === "email" ? handleRequestCode : handleVerify} noValidate>
            <Text variant="header-2" style={{ display: "block", marginBottom: 6 }}>
                Вход ученика
            </Text>
            <Text
                variant="body-1"
                color="secondary"
                style={{ display: "block", marginBottom: 24 }}
            >
                {step === "email"
                    ? "Введите email, на который ваш репетитор отправил приглашение"
                    : "Введите код из письма"}
            </Text>

            {step === "email" && (
                <div style={{ marginBottom: 16 }}>
                    <span style={LABEL_STYLE}>Email</span>
                    <TextInput
                        size="l"
                        type="email"
                        placeholder="email@example.com"
                        value={email}
                        onUpdate={setEmail}
                        autoComplete="email"
                        autoFocus
                    />
                </div>
            )}

            {step === "code" && (
                <>
                    <div style={{ marginBottom: 12 }}>
                        <span style={LABEL_STYLE}>Код из письма</span>
                        <TextInput
                            size="l"
                            placeholder="000000"
                            value={code}
                            onUpdate={setCode}
                            autoComplete="one-time-code"
                            autoFocus
                        />
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 16 }}>
                        <button
                            type="button"
                            onClick={() => {
                                setStep("email");
                                setCode("");
                                setInfo("");
                                setError("");
                            }}
                            style={{
                                background: "none",
                                border: "none",
                                color: "var(--g-color-text-brand)",
                                cursor: "pointer",
                                padding: 0,
                                fontSize: 13,
                            }}
                        >
                            Изменить email
                        </button>
                        <button
                            type="button"
                            onClick={handleResend}
                            disabled={loading}
                            style={{
                                background: "none",
                                border: "none",
                                color: "var(--g-color-text-brand)",
                                cursor: "pointer",
                                padding: 0,
                                fontSize: 13,
                            }}
                        >
                            Прислать ещё раз
                        </button>
                    </div>
                </>
            )}

            {info && (
                <Text variant="body-2" color="secondary" style={{ marginBottom: 12 }}>
                    {info}
                </Text>
            )}
            {error && (
                <Text variant="body-2" color="danger" style={{ marginBottom: 12 }}>
                    {error}
                </Text>
            )}

            <Button view="action" size="l" type="submit" width="max" loading={loading}>
                {step === "email" ? "Получить код" : "Войти"}
            </Button>

            <div style={{ textAlign: "center", marginTop: 16 }}>
                <button
                    type="button"
                    onClick={onBack}
                    style={{
                        background: "none",
                        border: "none",
                        color: "var(--g-color-text-secondary)",
                        cursor: "pointer",
                        padding: 0,
                        fontSize: 13,
                    }}
                >
                    ← Я репетитор
                </button>
            </div>
        </form>
    );
};

export default StudentSignIn;
