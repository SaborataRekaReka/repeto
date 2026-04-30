import "@/styles/globals.css";
import "@gravity-ui/uikit/styles/styles.css";
import "@/styles/gravity-overrides.css";
import "@/styles/dashboard-tochka.css";
import "@/styles/theme-tokens.css";
import "@/styles/theme-components.css";
import "@/styles/theme-navigation.css";
import "@/styles/yandex-shell.css";
import type { AppProps } from "next/app";
import { Inter } from "next/font/google";

const inter = Inter({
    subsets: ["latin", "cyrillic"],
    variable: "--font-inter",
    display: "swap",
});
import Head from "next/head";
import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { ThemeProvider, configure } from "@gravity-ui/uikit";
import { AuthProvider } from "@/contexts/AuthContext";
import { ThemeModeProvider, useThemeMode } from "@/contexts/ThemeContext";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import CookieBanner from "@/components/CookieBanner";

configure({ lang: "ru" });

const GravityTheme = ThemeProvider as any;
const GAuthProvider = AuthProvider as any;

function PageTransitionLoader() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const { theme } = useThemeMode();

    useEffect(() => {
        const start = () => setLoading(true);
        const end = () => setLoading(false);
        const handleRouteError = (error: unknown, url: string) => {
            end();

            if (typeof window === "undefined") {
                return;
            }

            const errorName = typeof error === "object" && error !== null && "name" in error
                ? String((error as { name?: unknown }).name ?? "")
                : "";
            const errorMessage = typeof error === "object" && error !== null && "message" in error
                ? String((error as { message?: unknown }).message ?? "")
                : String(error ?? "");
            const combined = `${errorName} ${errorMessage}`;

            if (/ChunkLoadError|Loading chunk [\d]+ failed|CSS_CHUNK_LOAD_FAILED/i.test(combined)) {
                window.location.assign(url || window.location.href);
            }
        };

        router.events.on("routeChangeStart", start);
        router.events.on("routeChangeComplete", end);
        router.events.on("routeChangeError", handleRouteError);
        return () => {
            router.events.off("routeChangeStart", start);
            router.events.off("routeChangeComplete", end);
            router.events.off("routeChangeError", handleRouteError);
        };
    }, [router]);

    if (!loading) return null;

    return (
        <div className="repeto-page-loader">
            <div className="repeto-page-loader__bar" />
        </div>
    );
}

function AppContent({ Component, pageProps }: { Component: AppProps["Component"]; pageProps: AppProps["pageProps"] }) {
    const { theme } = useThemeMode();
    const router = useRouter();
    const PageComponent = Component as any;
    const isLandingRoute = router.pathname === "/";

    useEffect(() => {
        if (isLandingRoute) return;
        if (typeof window === "undefined") return;
        if (!("serviceWorker" in navigator)) return;
        if (!window.isSecureContext && window.location.hostname !== "localhost") return;

        navigator.serviceWorker
            .register("/push-sw.js", {
                scope: "/",
                updateViaCache: "none",
            })
            .catch(() => null);
    }, [isLandingRoute]);

    return (
        <GravityTheme theme={theme}>
            <Head>
                <meta
                    name="viewport"
                    content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover"
                />
                {!isLandingRoute ? <link rel="manifest" href="/site.webmanifest" /> : null}
            </Head>
            <PageTransitionLoader />
            <GAuthProvider>
                <PageComponent {...pageProps} />
                <CookieBanner />
            </GAuthProvider>
        </GravityTheme>
    );
}

export default function App({ Component, pageProps }: AppProps) {
    return (
        <ThemeModeProvider>
            <ErrorBoundary>
                <div className={inter.variable} style={{ display: "contents" }}>
                    <AppContent Component={Component} pageProps={pageProps} />
                </div>
            </ErrorBoundary>
        </ThemeModeProvider>
    );
}
