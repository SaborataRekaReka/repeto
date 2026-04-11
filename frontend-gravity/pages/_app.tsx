import "@/styles/globals.css";
import "@gravity-ui/uikit/styles/fonts.css";
import "@gravity-ui/uikit/styles/styles.css";
import "@/styles/gravity-overrides.css";
import type { AppProps } from "next/app";
import Head from "next/head";
import { ThemeProvider, configure } from "@gravity-ui/uikit";
import { AuthProvider } from "@/contexts/AuthContext";
import { ThemeModeProvider, useThemeMode } from "@/contexts/ThemeContext";

configure({ lang: "ru" });

const GravityTheme = ThemeProvider as any;
const GAuthProvider = AuthProvider as any;

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
