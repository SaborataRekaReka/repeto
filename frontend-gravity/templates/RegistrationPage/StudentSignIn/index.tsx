import { useState, useRef, useCallback, useEffect } from "react";
import { useRouter } from "next/router";
import { TextInput, Button, Text } from "@gravity-ui/uikit";
import {
    requestStudentOtp,
    verifyStudentOtp,
    type StudentAuthResponse,
} from "@/lib/studentAuth";
import { codedErrorMessage } from "@/lib/errorCodes";
import AppField from "@/components/AppField";

type StudentSignInProps = {
    onBack: () => void;
    initialEmail?: string;
    onSignedIn?: (result: StudentAuthResponse) => void | Promise<void>;
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
        <form
            className="repeto-student-auth"
            onSubmit={step === "email" ? handleRequestCode : handleVerify}
            noValidate
        >
            <Text
                variant="header-2"
                className={`repeto-student-auth__title${
                    step === "code" ? " repeto-student-auth__title--code" : ""
                }`}
            >
                Вход ученика
            </Text>
            {step === "email" ? (
                <Text
                    variant="body-1"
                    color="secondary"
                    className="repeto-student-auth__subtitle"
                >
                    Введите email, на который ваш репетитор отправил приглашение
                </Text>
            ) : null}

            {step === "email" && (
                <AppField label="Email" className="repeto-student-auth__field">
                    <TextInput
                        size="l"
                        type="email"
                        placeholder="email@example.com"
                        value={email}
                        onUpdate={setEmail}
                        autoComplete="email"
                        autoFocus
                    />
                </AppField>
            )}

            {step === "code" && (
                <>
                    <Text
                        variant="subheader-1"
                        color="secondary"
                        className="repeto-student-auth__code-hint"
                    >
                        Мы отправили 6-значный код на{" "}
                        <strong className="repeto-student-auth__strong">{email}</strong>
                    </Text>

                    <div className="repeto-student-auth__code-grid">
                        {Array.from({ length: CODE_LENGTH }).map((_, index) => {
                            const value = codeDigits[index] || "";
                            const isFocused = focusedCodeIndex === index;
                            const inputClassName = [
                                "repeto-student-auth__code-input",
                                value ? "repeto-student-auth__code-input--filled" : "",
                                isFocused ? "repeto-student-auth__code-input--focused" : "",
                            ].filter(Boolean).join(" ");

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
                                    className={inputClassName}
                                    aria-label={`Цифра кода ${index + 1}`}
                                />
                            );
                        })}
                    </div>

                    <div className="repeto-student-auth__links">
                        <button
                            type="button"
                            onClick={() => {
                                setStep("email");
                                setCodeDigits(Array(CODE_LENGTH).fill(""));
                                setInfo("");
                                setError("");
                            }}
                            className="repeto-student-auth__link"
                        >
                            Изменить email
                        </button>
                        <button
                            type="button"
                            onClick={handleResend}
                            disabled={loading}
                            className="repeto-student-auth__link"
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
                    className="repeto-student-auth__status"
                >
                    {info}
                </Text>
            )}
            {error && (
                <Text variant="body-2" color="danger" className="repeto-student-auth__error">
                    {error}
                </Text>
            )}

            <Button view="action" size="l" type="submit" width="max" loading={loading} className="repeto-student-auth__submit" data-testid="auth-student-submit">
                {step === "email" ? "Получить код" : "Войти"}
            </Button>

            <div className="repeto-student-auth__back">
                <button
                    type="button"
                    onClick={onBack}
                    data-testid="auth-switch-to-tutor"
                    className="repeto-student-auth__back-btn"
                >
                    Я репетитор
                </button>
            </div>
        </form>
    );
};

export default StudentSignIn;
