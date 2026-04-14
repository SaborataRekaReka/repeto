import { useEffect, useMemo, useRef, useState } from "react";
import { TextInput, Button, Text, Checkbox, Icon } from "@gravity-ui/uikit";
import { CircleCheck, Envelope, Clock } from "@gravity-ui/icons";
import type { IconData } from "@gravity-ui/uikit";
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
const CODE_LENGTH = 6;
const RESEND_COOLDOWN_SECONDS = 45;

const createEmptyCode = () => Array.from({ length: CODE_LENGTH }, () => "");

const formatCooldown = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
};

type SignUpStep = "form" | "code";

const SignUp = () => {
    const [step, setStep] = useState<SignUpStep>("form");
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [phone, setPhone] = useState("");
    const [password, setPassword] = useState("");
    const [passwordConfirm, setPasswordConfirm] = useState("");
    const [conditions, setConditions] = useState(false);
    const [verificationEmail, setVerificationEmail] = useState("");
    const [expiresInMinutes, setExpiresInMinutes] = useState<number>(15);
    const [codeDigits, setCodeDigits] = useState<string[]>(createEmptyCode);
    const [focusedCodeIndex, setFocusedCodeIndex] = useState<number | null>(null);
    const [resendCooldown, setResendCooldown] = useState(0);
    const [error, setError] = useState("");
    const [requestingCode, setRequestingCode] = useState(false);
    const [verifyingCode, setVerifyingCode] = useState(false);
    const { requestRegistrationCode, verifyRegistrationCode } = useAuth();
    const codeInputRefs = useRef<Array<HTMLInputElement | null>>([]);

    const normalizedEmail = useMemo(() => email.trim().toLowerCase(), [email]);
    const isPasswordStrong = useMemo(() => /^(?=.*[A-Za-zА-я])(?=.*\d).{8,}$/.test(password), [password]);
    const verificationCode = useMemo(() => codeDigits.join(""), [codeDigits]);

    useEffect(() => {
        if (resendCooldown <= 0) return;
        const timer = window.setInterval(() => {
            setResendCooldown((prev) => (prev > 0 ? prev - 1 : 0));
        }, 1000);
        return () => window.clearInterval(timer);
    }, [resendCooldown]);

    useEffect(() => {
        if (step !== "code") return;
        const timer = window.setTimeout(() => {
            codeInputRefs.current[0]?.focus();
        }, 80);
        return () => window.clearTimeout(timer);
    }, [step]);

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

    const fillCodeFrom = (startIndex: number, rawValue: string) => {
        const digits = rawValue.replace(/\D/g, "");
        if (!digits) {
            setCodeDigits((prev) => {
                const next = [...prev];
                next[startIndex] = "";
                return next;
            });
            return;
        }

        setCodeDigits((prev) => {
            const next = [...prev];
            let cursor = startIndex;
            for (const digit of digits) {
                if (cursor >= CODE_LENGTH) break;
                next[cursor] = digit;
                cursor += 1;
            }
            const focusTarget = Math.min(cursor, CODE_LENGTH - 1);
            window.requestAnimationFrame(() => {
                codeInputRefs.current[focusTarget]?.focus();
                codeInputRefs.current[focusTarget]?.select();
            });
            return next;
        });
    };

    const handleCodeKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Backspace") {
            e.preventDefault();
            setCodeDigits((prev) => {
                const next = [...prev];
                if (next[index]) {
                    next[index] = "";
                    return next;
                }
                if (index > 0) {
                    next[index - 1] = "";
                    window.requestAnimationFrame(() => {
                        codeInputRefs.current[index - 1]?.focus();
                        codeInputRefs.current[index - 1]?.select();
                    });
                }
                return next;
            });
            return;
        }

        if (e.key === "ArrowLeft" && index > 0) {
            e.preventDefault();
            codeInputRefs.current[index - 1]?.focus();
            return;
        }

        if (e.key === "ArrowRight" && index < CODE_LENGTH - 1) {
            e.preventDefault();
            codeInputRefs.current[index + 1]?.focus();
        }
    };

    const sendVerificationCode = async () => {
        setError("");
        if (password !== passwordConfirm) {
            setError("Пароли не совпадают");
            return;
        }
        if (!conditions) {
            setError("Примите условия использования");
            return;
        }

        setRequestingCode(true);
        try {
            const response = await requestRegistrationCode({
                name: name.trim(),
                email: normalizedEmail,
                phone: phone || undefined,
                password,
            });
            setVerificationEmail(response.email);
            setExpiresInMinutes(response.expiresInMinutes || 15);
            setCodeDigits(createEmptyCode());
            setResendCooldown(RESEND_COOLDOWN_SECONDS);
            setStep("code");
        } catch (err: any) {
            setError(codedErrorMessage("AUTH-SIGNUP-SEND", err));
        } finally {
            setRequestingCode(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        await sendVerificationCode();
    };

    const handleVerifyCode = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");

        if (verificationCode.length !== CODE_LENGTH) {
            setError("Введите 6-значный код");
            return;
        }

        setVerifyingCode(true);
        try {
            await verifyRegistrationCode({
                email: verificationEmail || normalizedEmail,
                code: verificationCode,
            });
        } catch (err: any) {
            setError(codedErrorMessage("AUTH-SIGNUP-VERIFY", err));
        } finally {
            setVerifyingCode(false);
        }
    };

    const handleResend = async () => {
        if (resendCooldown > 0 || requestingCode) return;
        await sendVerificationCode();
    };

    const isLoading = requestingCode || verifyingCode;

    if (step === "code") {
        return (
            <form onSubmit={handleVerifyCode} noValidate>
                <div
                    style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 12,
                        marginBottom: 18,
                    }}
                >
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <div
                            style={{
                                width: 24,
                                height: 24,
                                borderRadius: "50%",
                                background: "rgba(34,197,94,0.16)",
                                color: "var(--g-color-text-positive)",
                                display: "inline-flex",
                                alignItems: "center",
                                justifyContent: "center",
                            }}
                        >
                            <Icon data={CircleCheck as IconData} size={14} />
                        </div>
                        <Text variant="caption-2" color="secondary">Шаг 1: Данные</Text>
                    </div>
                    <div style={{ flex: 1, height: 1, background: "var(--g-color-line-generic)" }} />
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <div
                            style={{
                                width: 24,
                                height: 24,
                                borderRadius: "50%",
                                background: "var(--g-color-base-brand)",
                                color: "var(--g-color-text-light-primary)",
                                display: "inline-flex",
                                alignItems: "center",
                                justifyContent: "center",
                                fontSize: 12,
                                fontWeight: 700,
                            }}
                        >
                            2
                        </div>
                        <Text variant="caption-2" style={{ color: "var(--g-color-text-primary)", fontWeight: 600 }}>
                            Шаг 2: Код
                        </Text>
                    </div>
                </div>

                <Text variant="header-2" style={{ display: "block", marginBottom: 6 }}>
                    Введите код подтверждения
                </Text>
                <Text variant="body-1" color="secondary" style={{ display: "block", marginBottom: 20, lineHeight: 1.6 }}>
                    Мы отправили 6-значный код на <strong style={{ color: "var(--g-color-text-primary)" }}>{verificationEmail}</strong>.
                    Введите его, чтобы завершить регистрацию.
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
                                ref={(el) => {
                                    codeInputRefs.current[index] = el;
                                }}
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
                                    boxShadow: isFocused ? "0 0 0 3px rgba(0, 178, 173, 0.18)" : "none",
                                }}
                                aria-label={`Цифра кода ${index + 1}`}
                            />
                        );
                    })}
                </div>

                {error && (
                    <div
                        style={{
                            marginBottom: 14,
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
                    loading={verifyingCode}
                    disabled={verificationCode.length !== CODE_LENGTH}
                    width="max"
                    style={{ borderRadius: 12, marginBottom: 10 }}
                >
                    Завершить регистрацию
                </Button>

                <div
                    style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        gap: 10,
                        marginBottom: 20,
                    }}
                >
                    <Button
                        view="flat"
                        size="m"
                        type="button"
                        disabled={isLoading}
                        onClick={() => {
                            setError("");
                            setStep("form");
                        }}
                    >
                        Изменить данные
                    </Button>

                    <button
                        type="button"
                        onClick={handleResend}
                        disabled={resendCooldown > 0 || requestingCode}
                        style={{
                            background: "none",
                            border: "none",
                            padding: 0,
                            fontSize: 13,
                            fontWeight: 600,
                            color:
                                resendCooldown > 0
                                    ? "var(--g-color-text-secondary)"
                                    : "var(--g-color-text-brand)",
                            cursor: resendCooldown > 0 ? "default" : "pointer",
                        }}
                    >
                        {resendCooldown > 0
                            ? `Повторно через ${formatCooldown(resendCooldown)}`
                            : "Отправить код повторно"}
                    </button>
                </div>

                <div
                    style={{
                        borderRadius: 12,
                        border: "1px solid var(--g-color-line-generic)",
                        background: "var(--g-color-base-simple-hover)",
                        padding: "12px 14px",
                        display: "grid",
                        gap: 10,
                    }}
                >
                    <div style={{ display: "flex", alignItems: "center", gap: 8, color: "var(--g-color-text-secondary)" }}>
                        <Icon data={Envelope as IconData} size={14} />
                        <Text variant="caption-2">Письмо может прийти в папку «Спам»</Text>
                    </div>
                    <div style={{ height: 1, background: "var(--g-color-line-generic)" }} />
                    <div style={{ display: "flex", alignItems: "center", gap: 8, color: "var(--g-color-text-secondary)" }}>
                        <Icon data={Clock as IconData} size={14} />
                        <Text variant="caption-2">Код действует {expiresInMinutes} минут</Text>
                    </div>
                </div>
            </form>
        );
    }

    return (
        <form onSubmit={handleSubmit} noValidate>
            <div
                style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    marginBottom: 18,
                }}
            >
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <div
                        style={{
                            width: 24,
                            height: 24,
                            borderRadius: "50%",
                            background: "var(--g-color-base-brand)",
                            color: "var(--g-color-text-light-primary)",
                            display: "inline-flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: 12,
                            fontWeight: 700,
                        }}
                    >
                        1
                    </div>
                    <Text variant="caption-2" style={{ color: "var(--g-color-text-primary)", fontWeight: 600 }}>
                        Шаг 1: Данные
                    </Text>
                </div>
                <div style={{ flex: 1, height: 1, background: "var(--g-color-line-generic)" }} />
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <div
                        style={{
                            width: 24,
                            height: 24,
                            borderRadius: "50%",
                            border: "1px solid var(--g-color-line-generic)",
                            color: "var(--g-color-text-secondary)",
                            background: "var(--g-color-base-background)",
                            display: "inline-flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: 12,
                            fontWeight: 700,
                        }}
                    >
                        2
                    </div>
                    <Text variant="caption-2" color="secondary">
                        Шаг 2: Код
                    </Text>
                </div>
            </div>

            <Text variant="header-2" style={{ display: "block", marginBottom: 6 }}>
                Регистрация
            </Text>
            <Text
                variant="body-1"
                color="secondary"
                style={{ display: "block", marginBottom: 24 }}
            >
                Заполните данные, и мы отправим код подтверждения на email.
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
                {password.length > 0 && (
                    <span style={{
                        fontSize: 12,
                        marginTop: 4,
                        color: isPasswordStrong
                            ? 'var(--g-color-text-positive)'
                            : 'var(--g-color-text-warning)',
                    }}>
                        {isPasswordStrong
                            ? '✓ Надёжный пароль'
                            : 'Минимум 8 символов, буква и цифра'}
                    </span>
                )}
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
                    size="l"
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
                loading={requestingCode}
                width="max"
                style={{ borderRadius: 12 }}
            >
                Получить код на email
            </Button>
        </form>
    );
};

export default SignUp;