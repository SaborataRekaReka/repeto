import "@/styles/globals.css";
import "@gravity-ui/uikit/styles/styles.css";
import "@/styles/gravity-overrides.css";
import "@/styles/dashboard-tochka.css";
import type { AppProps } from "next/app";
import Head from "next/head";
import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { ThemeProvider, configure } from "@gravity-ui/uikit";
import { AuthProvider } from "@/contexts/AuthContext";
import { ThemeModeProvider, useThemeMode } from "@/contexts/ThemeContext";
import { ErrorBoundary } from "@/components/ErrorBoundary";

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
            </GAuthProvider>
        </GravityTheme>
    );
}

export default function App({ Component, pageProps }: AppProps) {
    return (
        <ThemeModeProvider>
            <ErrorBoundary>
                <AppContent Component={Component} pageProps={pageProps} />
            </ErrorBoundary>
        </ThemeModeProvider>
    );
}
