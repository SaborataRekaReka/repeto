import "@/styles/globals.css";
import "@gravity-ui/uikit/styles/fonts.css";
import "@gravity-ui/uikit/styles/styles.css";
import "@/styles/gravity-overrides.css";
import type { AppProps } from "next/app";
import Head from "next/head";
import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { ThemeProvider, configure } from "@gravity-ui/uikit";
import { AuthProvider } from "@/contexts/AuthContext";
import { ThemeModeProvider, useThemeMode } from "@/contexts/ThemeContext";

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
        router.events.on("routeChangeStart", start);
        router.events.on("routeChangeComplete", end);
        router.events.on("routeChangeError", end);
        return () => {
            router.events.off("routeChangeStart", start);
            router.events.off("routeChangeComplete", end);
            router.events.off("routeChangeError", end);
        };
    }, [router]);

    if (!loading) return null;

    return (
        <div className="repeto-page-loader">
            <div className="repeto-page-loader__bar" />
        </div>
    );
}

function AppContent({ Component, pageProps }: AppProps) {
    const { theme } = useThemeMode();
    const PageComponent = Component as any;

    return (
        <GravityTheme theme={theme}>
            <Head>
                <meta
                    name="viewport"
                    content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover"
                />
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
            <AppContent Component={Component} pageProps={pageProps} />
        </ThemeModeProvider>
    );
}
