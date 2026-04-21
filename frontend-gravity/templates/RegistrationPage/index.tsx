import { useEffect, useState } from "react";
import Head from "next/head";
import { useRouter } from "next/router";
import Logo from "@/components/Logo";
import SignIn from "./SignIn";
import SignUp from "./SignUp";
import ForgotPassword from "./ForgotPassword";
import StudentSignIn from "./StudentSignIn";
import { useThemeMode } from "@/contexts/ThemeContext";

type View = "signin" | "signup" | "forgot" | "student";

const isView = (value: string | undefined): value is View =>
    value === "signin" ||
    value === "signup" ||
    value === "forgot" ||
    value === "student";

const RegistrationPage = () => {
    const router = useRouter();
    const [view, setView] = useState<View>("signin");
    const { theme } = useThemeMode();
    const isDark = theme === "dark";
    const resetToken =
        typeof router.query.token === "string" ? router.query.token.trim() : "";
    const queryView =
        typeof router.query.view === "string" ? router.query.view.trim() : undefined;
    const initialPlanId =
        typeof router.query.plan === "string" ? router.query.plan.trim().toLowerCase() : undefined;
    const initialBilling =
        typeof router.query.billing === "string" ? router.query.billing.trim().toLowerCase() : undefined;
    const initialStep =
        typeof router.query.step === "string" ? router.query.step.trim().toLowerCase() : undefined;
    const initialEmail =
        typeof router.query.email === "string" ? router.query.email.trim() : undefined;
    const returnPaymentId =
        typeof router.query.paymentId === "string"
            ? router.query.paymentId.trim()
            : typeof router.query.payment_id === "string"
              ? router.query.payment_id.trim()
              : undefined;

    const applyView = (nextView: View) => {
        setView(nextView);
        const nextQuery = { ...router.query, view: nextView };
        router.replace(
            { pathname: "/auth", query: nextQuery },
            undefined,
            { shallow: true }
        );
    };

    useEffect(() => {
        if (resetToken) {
            setView("forgot");
            return;
        }

        if (isView(queryView)) {
            setView(queryView);
            return;
        }

        setView("signin");
    }, [queryView, resetToken]);

    const handleBackToSignIn = () => {
        const nextQuery = { ...router.query };
        delete nextQuery.token;
        nextQuery.view = "signin";
        router.replace({ pathname: "/auth", query: nextQuery }, undefined, {
            shallow: true,
        });
        setView("signin");
    };

    return (
        <>
            <Head>
                <title>Repeto — Вход</title>
            </Head>
            <div
                style={{
                    minHeight: "100vh",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    background: "var(--repeto-bg)",
                    padding: "24px 16px",
                }}
            >
                <div style={{ width: "100%", maxWidth: 420 }}>
                    {/* Logo */}
                    <div style={{ display: "flex", justifyContent: "center", marginBottom: 28 }}>
                        <div style={{ filter: isDark ? "brightness(0) invert(1)" : "none", transition: "filter 0.2s" }}>
                            <Logo className="w-[8rem]" />
                        </div>
                    </div>

                    {/* Card */}
                    <div
                        style={{
                            background: "var(--g-color-base-float)",
                            borderRadius: 20,
                            padding: "32px 32px 28px",
                            boxShadow: "0 2px 32px rgba(174,122,255,0.10), 0 1px 4px rgba(0,0,0,0.06)",
                            border: "1px solid rgba(174,122,255,0.10)",
                        }}
                    >
                        {view === "forgot" ? (
                            <ForgotPassword onBack={handleBackToSignIn} token={resetToken || undefined} />
                        ) : view === "signup" ? (
                            <SignUp
                                initialPlanId={initialPlanId}
                                initialBilling={initialBilling}
                                initialStep={initialStep}
                                returnPaymentId={returnPaymentId}
                            />
                        ) : view === "student" ? (
                            <StudentSignIn onBack={() => applyView("signin")} initialEmail={initialEmail} />
                        ) : (
                            <SignIn onRecover={() => applyView("forgot")} />
                        )}
                    </div>

                    {/* Switch link */}
                    {view === "signin" && (
                        <div style={{ marginTop: 16 }}>
                            <button
                                onClick={() => applyView("student")}
                                style={{
                                    width: "100%",
                                    padding: "10px 14px",
                                    background: "transparent",
                                    border: "1px solid var(--g-color-line-generic)",
                                    borderRadius: 12,
                                    cursor: "pointer",
                                    color: "var(--g-color-text-primary)",
                                    fontSize: 14,
                                    fontWeight: 500,
                                }}
                            >
                                У меня есть репетитор
                            </button>
                        </div>
                    )}
                    {(view === "signin" || view === "signup") && (
                        <p
                            style={{
                                textAlign: "center",
                                marginTop: 20,
                                fontSize: 14,
                                color: "var(--g-color-text-secondary)",
                            }}
                        >
                            {view === "signup" ? "Уже есть аккаунт? " : "Нет аккаунта? "}
                            <button
                                onClick={() => applyView(view === "signup" ? "signin" : "signup")}
                                style={{
                                    color: "var(--g-color-text-brand)",
                                    fontWeight: 600,
                                    background: "none",
                                    border: "none",
                                    cursor: "pointer",
                                    padding: 0,
                                    fontSize: 14,
                                }}
                            >
                                {view === "signup" ? "Войти" : "Зарегистрироваться"}
                            </button>
                        </p>
                    )}
                </div>
            </div>
        </>
    );
};

export default RegistrationPage;