import { useState } from "react";
import Head from "next/head";
import Logo from "@/components/Logo";
import SignIn from "./SignIn";
import SignUp from "./SignUp";
import ForgotPassword from "./ForgotPassword";
import { useThemeMode } from "@/contexts/ThemeContext";

type View = "signin" | "signup" | "forgot";

const RegistrationPage = () => {
    const [view, setView] = useState<View>("signin");
    const { theme } = useThemeMode();
    const isDark = theme === "dark";

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
                            <ForgotPassword onBack={() => setView("signin")} />
                        ) : view === "signup" ? (
                            <SignUp />
                        ) : (
                            <SignIn onRecover={() => setView("forgot")} />
                        )}
                    </div>

                    {/* Switch link */}
                    {view !== "forgot" && (
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
                                onClick={() => setView(view === "signup" ? "signin" : "signup")}
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