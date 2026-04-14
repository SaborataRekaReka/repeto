import { Html, Head, Main, NextScript } from "next/document";

const GHtml = Html as any;
const GHead = Head as any;
const GMain = Main as any;
const GNextScript = NextScript as any;

export default function Document() {
    return (
        <GHtml lang="ru">
            <GHead>
                <meta
                    content="Repeto — CRM для репетиторов"
                    name="description"
                />
                <meta name="mailru-domain" content="aMv8My8xlxQcqEPC" />
                <meta
                    content="Repeto — CRM для репетиторов"
                    property="og:title"
                />
                <meta
                    content="Управление учениками, расписанием и финансами в одном месте"
                    property="og:description"
                />
                <meta property="og:type" content="website" />
                <meta name="msapplication-TileColor" content="#AE7AFF" />
                <meta name="theme-color" content="#AE7AFF" />
                <meta name="apple-mobile-web-app-capable" content="yes" />
                <meta name="apple-mobile-web-app-status-bar-style" content="default" />
                <meta name="mobile-web-app-capable" content="yes" />
                <link rel="icon" href="/brand/icon.svg" type="image/svg+xml" />
                <link rel="shortcut icon" href="/brand/icon.svg" />
                <link rel="apple-touch-icon" href="/brand/icon.svg" />
                <link rel="manifest" href="/manifest.json" />
            </GHead>
            <body>
                <GMain />
                <GNextScript />
            </body>
        </GHtml>
    );
}
