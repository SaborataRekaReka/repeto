import { Html, Head, Main, NextScript } from "next/document";

export default function Document() {
    return (
        <Html lang="ru">
            <Head>
                <meta
                    content="Repeto — CRM для репетиторов"
                    name="description"
                />
                <meta
                    content="Repeto — CRM для репетиторов"
                    property="og:title"
                />
                <meta
                    content="Управление учениками, расписанием и финансами в одном месте"
                    property="og:description"
                />
                <meta property="og:type" content="website" />
                <meta name="msapplication-TileColor" content="#da532c" />
                <meta name="theme-color" content="#ffffff" />
                <link rel="icon" href="/fav.svg" type="image/svg+xml" />
                <link rel="shortcut icon" href="/fav.svg" />
            </Head>
            <body>
                <Main />
                <NextScript />
            </body>
        </Html>
    );
}
