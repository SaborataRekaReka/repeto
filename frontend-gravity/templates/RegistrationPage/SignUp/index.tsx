import {
    useEffect,
    useMemo,
    useRef,
    useState,
    type CSSProperties,
} from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { TextInput, Button, Text, Checkbox, Icon } from "@gravity-ui/uikit";
import { CircleCheck, Envelope, Clock } from "@gravity-ui/icons";
import type { IconData } from "@gravity-ui/uikit";
import { useAuth } from "@/contexts/AuthContext";
import { api, setAccessToken } from "@/lib/api";
import { codedErrorMessage } from "@/lib/errorCodes";
import {
    LEGAL_DOCUMENT_HASH,
    LEGAL_VERSION,
    MARKETING_TEXT,
    TUTOR_OFFER_TEXT,
    TUTOR_PD_TEXT,
    TUTOR_PUBLICATION_TEXT,
} from "@/lib/legal";

const LABEL_STYLE: CSSProperties = {
    display: "block",
    marginBottom: 6,
    fontSize: 13,
    fontWeight: 600,
    color: "var(--g-color-text-primary)",
};

const FIELD_STYLE: CSSProperties = { marginBottom: 14 };
const CODE_LENGTH = 6;
const RESEND_COOLDOWN_SECONDS = 45;
const PENDING_PAYMENT_STORAGE_KEY = "repeto:registration:pending-payment";

type SignUpStep = "form" | "code" | "payment";
type PlanId = "start" | "profi" | "center";
type BillingCycle = "month" | "year";

type SignUpProps = {
    initialPlanId?: string;
    initialBilling?: string;
    initialStep?: string;
    returnPaymentId?: string;
};

type RegistrationPlan = {
    id: PlanId;
    name: string;
    subtitle: string;
    studentLimit: number | null;
    monthlyPriceRub: number;
    yearlyMonthlyPriceRub: number;
    yearlyTotalRub: number;
};

type RegistrationPlansResponse = {
    defaultPlanId: PlanId;
    defaultBillingCycle: BillingCycle;
    plans: RegistrationPlan[];
};

type PendingPaymentState = {
    verificationToken: string;
    planId: PlanId;
    billingCycle: BillingCycle;
    paymentId?: string;
};

const FALLBACK_PLANS: RegistrationPlan[] = [
    {
        id: "start",
        name: "Старт",
        subtitle: "Полный доступ для старта",
        studentLimit: 1,
        monthlyPriceRub: 0,
        yearlyMonthlyPriceRub: 0,
        yearlyTotalRub: 0,
    },
    {
        id: "profi",
        name: "Практика",
        subtitle: "Оптимально для частного репетитора",
        studentLimit: 15,
        monthlyPriceRub: 300,
        yearlyMonthlyPriceRub: 250,
        yearlyTotalRub: 3000,
    },
    {
        id: "center",
        name: "Репетиторский центр",
        subtitle: "Для команды и роста без ограничений",
        studentLimit: null,
        monthlyPriceRub: 1500,
        yearlyMonthlyPriceRub: 1250,
        yearlyTotalRub: 15000,
    },
];

const createEmptyCode = () => Array.from({ length: CODE_LENGTH }, () => "");

const formatCooldown = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
};

const isPlanId = (value?: string): value is PlanId =>
    value === "start" || value === "profi" || value === "center";

const isBillingCycle = (value?: string): value is BillingCycle =>
    value === "month" || value === "year";

const formatRub = (amount: number) => `${amount.toLocaleString("ru-RU")} ₽`;

const readPendingPaymentState = (): PendingPaymentState | null => {
    if (typeof window === "undefined") return null;

    try {
        const raw = window.localStorage.getItem(PENDING_PAYMENT_STORAGE_KEY);
        if (!raw) return null;
        const parsed = JSON.parse(raw) as PendingPaymentState;
        if (!parsed?.verificationToken || !isPlanId(parsed.planId) || !isBillingCycle(parsed.billingCycle)) {
            return null;
        }
        return parsed;
    } catch {
        return null;
    }
};

const writePendingPaymentState = (value: PendingPaymentState) => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(PENDING_PAYMENT_STORAGE_KEY, JSON.stringify(value));
};

const clearPendingPaymentState = () => {
    if (typeof window === "undefined") return;
    window.localStorage.removeItem(PENDING_PAYMENT_STORAGE_KEY);
};

const SignUp = ({
    initialPlanId,
    initialBilling,
    initialStep,
    returnPaymentId,
}: SignUpProps) => {
    const router = useRouter();
    const [step, setStep] = useState<SignUpStep>("form");
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [phone, setPhone] = useState("");
    const [password, setPassword] = useState("");
    const [passwordConfirm, setPasswordConfirm] = useState("");
    const [tutorOfferAccepted, setTutorOfferAccepted] = useState(false);
    const [tutorPdAccepted, setTutorPdAccepted] = useState(false);
    const [tutorPublicationAccepted, setTutorPublicationAccepted] = useState(false);
    const [marketingAccepted, setMarketingAccepted] = useState(false);
    const [verificationEmail, setVerificationEmail] = useState("");
    const [verificationToken, setVerificationToken] = useState("");
    const [expiresInMinutes, setExpiresInMinutes] = useState<number>(15);
    const [codeDigits, setCodeDigits] = useState<string[]>(createEmptyCode);
    const [focusedCodeIndex, setFocusedCodeIndex] = useState<number | null>(null);
    const [resendCooldown, setResendCooldown] = useState(0);
    const [plans, setPlans] = useState<RegistrationPlan[]>(FALLBACK_PLANS);
    const [plansLoading, setPlansLoading] = useState(false);
    const [selectedPlanId, setSelectedPlanId] = useState<PlanId>(
        isPlanId(initialPlanId) ? initialPlanId : "profi"
    );
    const [billingCycle, setBillingCycle] = useState<BillingCycle>(
        isBillingCycle(initialBilling) ? initialBilling : "month"
    );
    const [paymentId, setPaymentId] = useState<string>(returnPaymentId || "");
    const [error, setError] = useState("");
    const [requestingCode, setRequestingCode] = useState(false);
    const [verifyingCode, setVerifyingCode] = useState(false);
    const [paying, setPaying] = useState(false);
    const [completing, setCompleting] = useState(false);
    const { requestRegistrationCode, verifyRegistrationCode, refreshUser } = useAuth();
    const codeInputRefs = useRef<Array<HTMLInputElement | null>>([]);
    const autoCompleteAttemptedRef = useRef(false);

    const normalizedEmail = useMemo(() => email.trim().toLowerCase(), [email]);
    const isPasswordStrong = useMemo(() => /^(?=.*[A-Za-zА-я])(?=.*\d).{8,}$/.test(password), [password]);
    const verificationCode = useMemo(() => codeDigits.join(""), [codeDigits]);

    const selectedPlan = useMemo(
        () => plans.find((plan) => plan.id === selectedPlanId) || plans[0],
        [plans, selectedPlanId]
    );

    const selectedPriceRub = useMemo(() => {
        if (!selectedPlan) return 0;
        return billingCycle === "year"
            ? selectedPlan.yearlyTotalRub
            : selectedPlan.monthlyPriceRub;
    }, [selectedPlan, billingCycle]);

    const updateStepQuery = (nextStep: SignUpStep) => {
        const nextQuery = {
            ...router.query,
            view: "signup",
            plan: selectedPlanId,
            billing: billingCycle,
        } as Record<string, string>;

        if (nextStep === "payment") {
            nextQuery.step = "payment";
        } else {
            delete nextQuery.step;
            delete nextQuery.paymentId;
            delete nextQuery.payment_id;
        }

        router.replace(
            { pathname: "/auth", query: nextQuery },
            undefined,
            { shallow: true }
        );
    };

    const goToStep = (nextStep: SignUpStep) => {
        setStep(nextStep);
        updateStepQuery(nextStep);
    };

    const completeAfterPayment = async (paymentIdForComplete?: string) => {
        if (!verificationToken) {
            setError("Сессия регистрации истекла. Запросите код заново.");
            goToStep("form");
            return;
        }

        setCompleting(true);
        setError("");

        try {
            const res = await api<{ user: unknown; accessToken: string }>(
                "/auth/register/complete",
                {
                    method: "POST",
                    body: {
                        verificationToken,
                        planId: selectedPlanId,
                        billingCycle,
                        paymentId: paymentIdForComplete || undefined,
                    },
                }
            );

            setAccessToken(res.accessToken);
            clearPendingPaymentState();
            await refreshUser();
            await router.push("/dashboard");
        } catch (err: any) {
            setError(codedErrorMessage("AUTH-SIGNUP-COMPLETE", err));
        } finally {
            setCompleting(false);
        }
    };

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

    useEffect(() => {
        const nextPlan = isPlanId(initialPlanId) ? initialPlanId : undefined;
        const nextBilling = isBillingCycle(initialBilling) ? initialBilling : undefined;
        if (nextPlan) setSelectedPlanId(nextPlan);
        if (nextBilling) setBillingCycle(nextBilling);
    }, [initialPlanId, initialBilling]);

    useEffect(() => {
        let cancelled = false;
        const loadPlans = async () => {
            setPlansLoading(true);
            try {
                const response = await api<RegistrationPlansResponse>("/auth/register/plans");
                if (cancelled || !response?.plans?.length) return;

                setPlans(response.plans);
                setSelectedPlanId((prev) =>
                    response.plans.some((plan) => plan.id === prev)
                        ? prev
                        : response.defaultPlanId || response.plans[0].id
                );
                setBillingCycle((prev) =>
                    prev === "month" || prev === "year"
                        ? prev
                        : response.defaultBillingCycle || "month"
                );
            } catch {
                // Keep fallback tariffs; signup flow still works.
            } finally {
                if (!cancelled) setPlansLoading(false);
            }
        };

        loadPlans();
        return () => {
            cancelled = true;
        };
    }, []);

    useEffect(() => {
        const pending = readPendingPaymentState();
        if (!pending) return;

        setVerificationToken((prev) => prev || pending.verificationToken);
        setSelectedPlanId(pending.planId);
        setBillingCycle(pending.billingCycle);
        setPaymentId((prev) => prev || pending.paymentId || "");

        if ((initialStep || "") === "payment") {
            setStep("payment");
        }
    }, [initialStep]);

    useEffect(() => {
        const shouldHandleReturn = (initialStep || "") === "payment";
        if (!shouldHandleReturn) return;
        if (autoCompleteAttemptedRef.current) return;
        if (!verificationToken) return;

        const pending = readPendingPaymentState();
        const resolvedPaymentId = returnPaymentId || paymentId || pending?.paymentId || "";
        if (!resolvedPaymentId) return;

        autoCompleteAttemptedRef.current = true;
        setPaymentId(resolvedPaymentId);
        completeAfterPayment(resolvedPaymentId);
    }, [
        initialStep,
        returnPaymentId,
        paymentId,
        verificationToken,
    ]);

    const handlePhoneChange = (value: string) => {
        let digits = value.replace(/\D/g, "");
        if (digits.startsWith("8")) digits = "7" + digits.slice(1);
        if (!digits.startsWith("7") && digits.length > 0) digits = "7" + digits;
        if (digits.length === 0) {
            setPhone("");
            return;
        }
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
        if (!tutorOfferAccepted || !tutorPdAccepted || !tutorPublicationAccepted) {
            setError("Отметьте обязательные юридические согласия");
            return;
        }

        setRequestingCode(true);
        try {
            const response = await requestRegistrationCode({
                name: name.trim(),
                email: normalizedEmail,
                phone: phone || undefined,
                password,
                legalVersion: LEGAL_VERSION,
                legalDocumentHash: LEGAL_DOCUMENT_HASH,
                consents: {
                    tutorOfferAccepted,
                    tutorPersonalDataAccepted: tutorPdAccepted,
                    tutorPublicationAccepted,
                    marketingAccepted,
                    tutorOfferText: TUTOR_OFFER_TEXT,
                    tutorPersonalDataText: TUTOR_PD_TEXT,
                    tutorPublicationText: TUTOR_PUBLICATION_TEXT,
                    marketingText: MARKETING_TEXT,
                },
            });
            setVerificationEmail(response.email);
            setExpiresInMinutes(response.expiresInMinutes || 15);
            setCodeDigits(createEmptyCode());
            setResendCooldown(RESEND_COOLDOWN_SECONDS);
            setVerificationToken("");
            setPaymentId("");
            clearPendingPaymentState();
            setStep("code");
            updateStepQuery("code");
        } catch (err: any) {
            setError(codedErrorMessage("AUTH-SIGNUP-SEND", err));
        } finally {
            setRequestingCode(false);
        }
    };

    const handleFormSubmit = async (e: React.FormEvent) => {
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
            const verification = await verifyRegistrationCode({
                email: verificationEmail || normalizedEmail,
                code: verificationCode,
            });
            setVerificationToken(verification.verificationToken);
            setVerificationEmail(verification.email);
            setStep("payment");
            updateStepQuery("payment");
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

    const handleStartPayment = async () => {
        if (!verificationToken) {
            setError("Сначала подтвердите email-код.");
            setStep("code");
            updateStepQuery("code");
            return;
        }

        setPaying(true);
        setError("");

        try {
            const response = await api<{
                requiresPayment: boolean;
                amountRub: number;
                paymentId?: string;
                confirmationUrl?: string;
            }>("/auth/register/start-payment", {
                method: "POST",
                body: {
                    verificationToken,
                    planId: selectedPlanId,
                    billingCycle,
                },
            });

            if (!response.requiresPayment) {
                await completeAfterPayment();
                return;
            }

            if (!response.confirmationUrl || !response.paymentId) {
                throw new Error("Платежная ссылка не получена");
            }

            const pending: PendingPaymentState = {
                verificationToken,
                planId: selectedPlanId,
                billingCycle,
                paymentId: response.paymentId,
            };
            writePendingPaymentState(pending);

            window.location.assign(response.confirmationUrl);
        } catch (err: any) {
            setError(codedErrorMessage("AUTH-SIGNUP-PAYMENT", err));
        } finally {
            setPaying(false);
        }
    };

    const renderStepHeader = (current: 1 | 2 | 3) => {
        const item = (
            label: string,
            stepNumber: 1 | 2 | 3,
            active: boolean,
            completed: boolean
        ) => (
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div
                    style={{
                        width: 24,
                        height: 24,
                        borderRadius: "50%",
                        background: completed
                            ? "rgba(34,197,94,0.16)"
                            : active
                              ? "var(--g-color-base-brand)"
                              : "var(--g-color-base-background)",
                        border: completed || active ? "none" : "1px solid var(--g-color-line-generic)",
                        color: completed
                            ? "var(--g-color-text-positive)"
                            : active
                              ? "var(--g-color-text-light-primary)"
                              : "var(--g-color-text-secondary)",
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: 12,
                        fontWeight: 700,
                    }}
                >
                    {completed ? <Icon data={CircleCheck as IconData} size={12} /> : stepNumber}
                </div>
                <Text
                    variant="caption-2"
                    style={{
                        color: active
                            ? "var(--g-color-text-primary)"
                            : "var(--g-color-text-secondary)",
                        fontWeight: active ? 600 : 500,
                    }}
                >
                    {label}
                </Text>
            </div>
        );

        return (
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 18 }}>
                {item("Шаг 1: Данные", 1, current === 1, current > 1)}
                <div style={{ flex: 1, height: 1, background: "var(--g-color-line-generic)" }} />
                {item("Шаг 2: Код", 2, current === 2, current > 2)}
                <div style={{ flex: 1, height: 1, background: "var(--g-color-line-generic)" }} />
                {item("Шаг 3: Оплата", 3, current === 3, false)}
            </div>
        );
    };

    const isBusy = requestingCode || verifyingCode || paying || completing;

    if (step === "payment") {
        return (
            <div>
                {renderStepHeader(3)}

                <Text variant="header-2" style={{ display: "block", marginBottom: 6 }}>
                    Завершите регистрацию
                </Text>
                <Text
                    variant="body-1"
                    color="secondary"
                    style={{ display: "block", marginBottom: 18, lineHeight: 1.6 }}
                >
                    Выберите тариф и период оплаты. Доступ к платформе открывается только после
                    успешной оплаты.
                </Text>

                <div style={{ display: "grid", gap: 10, marginBottom: 16 }}>
                    {plans.map((plan) => {
                        const active = plan.id === selectedPlanId;
                        const monthlyPrice = formatRub(plan.monthlyPriceRub);
                        const yearlyMonthly = formatRub(plan.yearlyMonthlyPriceRub);
                        return (
                            <button
                                key={plan.id}
                                type="button"
                                onClick={() => setSelectedPlanId(plan.id)}
                                style={{
                                    borderRadius: 12,
                                    border: active
                                        ? "1px solid var(--g-color-line-brand)"
                                        : "1px solid var(--g-color-line-generic)",
                                    background: active
                                        ? "var(--g-color-base-brand-hover)"
                                        : "var(--g-color-base-background)",
                                    color: active
                                        ? "var(--g-color-text-light-primary)"
                                        : "var(--g-color-text-primary)",
                                    textAlign: "left",
                                    padding: "12px 14px",
                                    cursor: "pointer",
                                }}
                            >
                                <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
                                    <div>
                                        <Text
                                            variant="body-2"
                                            style={{
                                                display: "block",
                                                fontWeight: 700,
                                                color: active
                                                    ? "var(--g-color-text-light-primary)"
                                                    : "var(--g-color-text-primary)",
                                            }}
                                        >
                                            {plan.name}
                                        </Text>
                                        <Text
                                            variant="caption-1"
                                            style={{
                                                display: "block",
                                                color: active
                                                    ? "var(--g-color-text-light-primary)"
                                                    : "var(--g-color-text-secondary)",
                                            }}
                                        >
                                            {plan.subtitle}
                                        </Text>
                                    </div>
                                    <div style={{ textAlign: "right" }}>
                                        <Text
                                            variant="body-2"
                                            style={{
                                                display: "block",
                                                fontWeight: 700,
                                                color: active
                                                    ? "var(--g-color-text-light-primary)"
                                                    : "var(--g-color-text-primary)",
                                            }}
                                        >
                                            {monthlyPrice}/мес
                                        </Text>
                                        <Text
                                            variant="caption-1"
                                            style={{
                                                display: "block",
                                                color: active
                                                    ? "var(--g-color-text-light-primary)"
                                                    : "var(--g-color-text-secondary)",
                                            }}
                                        >
                                            {yearlyMonthly}/мес при оплате за год
                                        </Text>
                                    </div>
                                </div>
                            </button>
                        );
                    })}
                </div>

                <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
                    <Button
                        view={billingCycle === "month" ? "action" : "outlined"}
                        size="m"
                        type="button"
                        onClick={() => setBillingCycle("month")}
                    >
                        Помесячно
                    </Button>
                    <Button
                        view={billingCycle === "year" ? "action" : "outlined"}
                        size="m"
                        type="button"
                        onClick={() => setBillingCycle("year")}
                    >
                        За год
                    </Button>
                </div>

                <div
                    style={{
                        borderRadius: 12,
                        border: "1px solid var(--g-color-line-generic)",
                        background: "var(--g-color-base-simple-hover)",
                        padding: "12px 14px",
                        marginBottom: 14,
                    }}
                >
                    <Text variant="body-2" style={{ display: "block", marginBottom: 4 }}>
                        К оплате: <strong>{formatRub(selectedPriceRub)}</strong>
                    </Text>
                    <Text variant="caption-1" color="secondary">
                        {billingCycle === "year"
                            ? "Списание за 12 месяцев по выбранному тарифу"
                            : "Списание за 1 месяц по выбранному тарифу"}
                    </Text>
                </div>

                {plansLoading && (
                    <Text variant="caption-1" color="secondary" style={{ display: "block", marginBottom: 12 }}>
                        Обновляем актуальные тарифы...
                    </Text>
                )}

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
                    type="button"
                    loading={paying || completing}
                    width="max"
                    onClick={handleStartPayment}
                    style={{ borderRadius: 12, marginBottom: 10 }}
                >
                    {selectedPriceRub > 0 ? "Перейти к оплате в ЮKassa" : "Активировать тариф"}
                </Button>

                {!!paymentId && (
                    <Button
                        view="outlined"
                        size="l"
                        type="button"
                        width="max"
                        loading={completing}
                        onClick={() => completeAfterPayment(paymentId)}
                        style={{ marginBottom: 10 }}
                    >
                        Я оплатил, проверить статус
                    </Button>
                )}

                <Button
                    view="flat"
                    size="m"
                    type="button"
                    disabled={isBusy}
                    onClick={() => {
                        setError("");
                        goToStep("code");
                    }}
                >
                    ← Назад к вводу кода
                </Button>
            </div>
        );
    }

    if (step === "code") {
        return (
            <form onSubmit={handleVerifyCode} noValidate>
                {renderStepHeader(2)}

                <Text variant="header-2" style={{ display: "block", marginBottom: 6 }}>
                    Введите код подтверждения
                </Text>
                <Text
                    variant="body-1"
                    color="secondary"
                    style={{ display: "block", marginBottom: 20, lineHeight: 1.6 }}
                >
                    Мы отправили 6-значный код на{" "}
                    <strong style={{ color: "var(--g-color-text-primary)" }}>{verificationEmail}</strong>.
                    Введите его, чтобы перейти к оплате тарифа.
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
                    Перейти к оплате
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
                        disabled={isBusy}
                        onClick={() => {
                            setError("");
                            goToStep("form");
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
                    <div
                        style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 8,
                            color: "var(--g-color-text-secondary)",
                        }}
                    >
                        <Icon data={Envelope as IconData} size={14} />
                        <Text variant="caption-2">Письмо может прийти в папку «Спам»</Text>
                    </div>
                    <div style={{ height: 1, background: "var(--g-color-line-generic)" }} />
                    <div
                        style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 8,
                            color: "var(--g-color-text-secondary)",
                        }}
                    >
                        <Icon data={Clock as IconData} size={14} />
                        <Text variant="caption-2">Код действует {expiresInMinutes} минут</Text>
                    </div>
                </div>
            </form>
        );
    }

    return (
        <form onSubmit={handleFormSubmit} noValidate>
            {renderStepHeader(1)}

            <Text variant="header-2" style={{ display: "block", marginBottom: 6 }}>
                Регистрация
            </Text>
            <Text
                variant="body-1"
                color="secondary"
                style={{ display: "block", marginBottom: 24 }}
            >
                Заполните данные, затем подтвердите код и оплатите выбранный тариф.
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
                    <span
                        style={{
                            fontSize: 12,
                            marginTop: 4,
                            color: isPasswordStrong
                                ? "var(--g-color-text-positive)"
                                : "var(--g-color-text-warning)",
                        }}
                    >
                        {isPasswordStrong
                            ? "✓ Надёжный пароль"
                            : "Минимум 8 символов, буква и цифра"}
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

            <div style={{ marginBottom: 20, display: "grid", gap: 10 }}>
                <Checkbox checked={tutorOfferAccepted} onUpdate={setTutorOfferAccepted} size="l">
                    <span style={{ fontSize: 13, color: "var(--g-color-text-secondary)", lineHeight: 1.4 }}>
                        Принимаю <Link href="/legal#tutor-offer" target="_blank">Оферту для репетиторов</Link>.
                    </span>
                </Checkbox>

                <Checkbox checked={tutorPdAccepted} onUpdate={setTutorPdAccepted} size="l">
                    <span style={{ fontSize: 13, color: "var(--g-color-text-secondary)", lineHeight: 1.4 }}>
                        Даю согласие на <Link href="/legal#tutor-pd-consent" target="_blank">обработку персональных данных репетитора</Link>.
                    </span>
                </Checkbox>

                <Checkbox checked={tutorPublicationAccepted} onUpdate={setTutorPublicationAccepted} size="l">
                    <span style={{ fontSize: 13, color: "var(--g-color-text-secondary)", lineHeight: 1.4 }}>
                        Даю согласие на <Link href="/legal#tutor-publication-consent" target="_blank">публикацию анкеты</Link>.
                    </span>
                </Checkbox>

                <Checkbox checked={marketingAccepted} onUpdate={setMarketingAccepted} size="l">
                    <span style={{ fontSize: 13, color: "var(--g-color-text-secondary)", lineHeight: 1.4 }}>
                        Согласен(на) на <Link href="/legal#marketing-consent" target="_blank">информационные и рекламные рассылки</Link> (необязательно).
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
