import { useState, useRef, useCallback, useEffect } from "react";
import { useRouter } from "next/router";
import { TextInput, Button, Text } from "@gravity-ui/uikit";
import {
    requestStudentOtp,
    verifyStudentOtp,
    type StudentAuthResponse,
} from "@/lib/studentAuth";
import { codedErrorMessage } from "@/lib/errorCodes";

type StudentSignInProps = {
    onBack: () => void;
    initialEmail?: string;
    onSignedIn?: (result: StudentAuthResponse) => void | Promise<void>;
};

const LABEL_STYLE: React.CSSProperties = {
    display: "block",
    marginBottom: 6,
    fontSize: 13,
    fontWeight: 600,
    color: "var(--g-color-text-primary)",
};

const CODE_LENGTH = 6;

const StudentSignIn = ({ onBack, initialEmail, onSignedIn }: StudentSignInProps) => {
    const router = useRouter();
    const [step, setStep] = useState<"email" | "code">("email");
    const [email, setEmail] = useState(initialEmail || "");
    const [codeDigits, setCodeDigits] = useState<string[]>(Array(CODE_LENGTH).fill(""));
    const [focusedCodeIndex, setFocusedCodeIndex] = useState<number | null>(null);
    const codeInputRefs = useRef<Array<HTMLInputElement | null>>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [info, setInfo] = useState("");

    useEffect(() => {
        if (initialEmail) setEmail(initialEmail);
    }, [initialEmail]);

    const codeValue = codeDigits.join("");

    const fillCodeFrom = useCallback(
        (startIndex: number, raw: string) => {
            const digits = raw.replace(/\D/g, "").slice(0, CODE_LENGTH - startIndex);
            if (!digits) return;
            setCodeDigits((prev) => {
                const next = [...prev];
                for (let i = 0; i < digits.length; i++) {
                    next[startIndex + i] = digits[i];
                }
                return next;
            });
            const nextIdx = Math.min(startIndex + digits.length, CODE_LENGTH - 1);
            codeInputRefs.current[nextIdx]?.focus();
        },
        []
    );

    const handleCodeKeyDown = useCallback(
        (index: number, event: React.KeyboardEvent<HTMLInputElement>) => {
            if (event.key === "Backspace" && !codeDigits[index] && index > 0) {
                event.preventDefault();
                setCodeDigits((prev) => {
                    const next = [...prev];
                    next[index - 1] = "";
                    return next;
                });
                codeInputRefs.current[index - 1]?.focus();
            } else if (event.key === "ArrowLeft" && index > 0) {
                codeInputRefs.current[index - 1]?.focus();
            } else if (event.key === "ArrowRight" && index < CODE_LENGTH - 1) {
                codeInputRefs.current[index + 1]?.focus();
            }
        },
        [codeDigits]
    );

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
            setInfo("");
        } catch (err: any) {
            setError(codedErrorMessage("STUDENT-OTP-REQUEST", err));
        } finally {
            setLoading(false);
        }
    };

    const handleVerify = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        if (codeValue.length < 4) {
            setError("Введите код из письма");
            return;
        }
        setLoading(true);
        try {
            const result = await verifyStudentOtp(email, codeValue);
            if (onSignedIn) {
                await onSignedIn(result);
                return;
            }
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
            <Text variant="header-2" style={{ display: "block", marginBottom: step === "code" ? 16 : 6 }}>
                Вход ученика
            </Text>
            <Text
                variant="body-1"
                color="secondary"
                style={{ display: step === "email" ? "block" : "none", marginBottom: 24 }}
            >
                {step === "email"
                    ? "Введите email, на который ваш репетитор отправил приглашение"
                    : ""}
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
                    <Text
                        variant="subheader-1"
                        color="secondary"
                        style={{
                            display: "block",
                            marginBottom: 30,
                            lineHeight: 1.55,
                            fontWeight: 500,
                            letterSpacing: "0.01em",
                        }}
                    >
                        Мы отправили 6-значный код на{" "}
                        <strong style={{ color: "var(--g-color-text-primary)" }}>{email}</strong>
                    </Text>

                    <div
                        style={{
                            display: "grid",
                            gridTemplateColumns: `repeat(${CODE_LENGTH}, minmax(0, 1fr))`,
                            gap: 8,
                            marginBottom: 18,
                            width: "100%",
                        }}
                    >
                        {Array.from({ length: CODE_LENGTH }).map((_, index) => {
                            const value = codeDigits[index] || "";
                            const isFocused = focusedCodeIndex === index;
                            return (
                                <input
                                    key={index}
                                    ref={(el) => { codeInputRefs.current[index] = el; }}
                                    inputMode="numeric"
                                    pattern="[0-9]*"
                                    autoComplete={index === 0 ? "one-time-code" : "off"}
                                    maxLength={1}
                                    value={value}
                                    onFocus={() => setFocusedCodeIndex(index)}
                                    onBlur={() => setFocusedCodeIndex((prev) => (prev === index ? null : prev))}
                                    onChange={(event) => fillCodeFrom(index, event.target.value)}
                                    onPaste={(event) => {
                                        event.preventDefault();
                                        fillCodeFrom(index, event.clipboardData.getData("text"));
                                    }}
                                    onKeyDown={(event) => handleCodeKeyDown(index, event)}
                                    style={{
                                        width: "100%",
                                        minWidth: 0,
                                        height: 54,
                                        borderRadius: 12,
                                        border: `1px solid ${isFocused ? "var(--g-color-line-brand)" : "var(--g-color-line-generic)"}`,
                                        textAlign: "center",
                                        fontSize: 24,
                                        fontWeight: 700,
                                        color: "var(--g-color-text-primary)",
                                        background: value
                                            ? "var(--g-color-base-simple-hover)"
                                            : "var(--g-color-base-background)",
                                        outline: "none",
                                        boxShadow: isFocused
                                            ? "0 0 0 3px color-mix(in srgb, var(--accent) 22%, transparent)"
                                            : "none",
                                    }}
                                    aria-label={`Цифра кода ${index + 1}`}
                                />
                            );
                        })}
                    </div>

                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 16 }}>
                        <button
                            type="button"
                            onClick={() => {
                                setStep("email");
                                setCodeDigits(Array(CODE_LENGTH).fill(""));
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
                <Text
                    variant="body-1"
                    color="secondary"
                    style={{ marginBottom: 20, lineHeight: 1.5, fontWeight: 500 }}
                >
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
