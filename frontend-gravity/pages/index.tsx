import type { NextPage } from "next";
import Head from "next/head";

const Home: NextPage = () => (
    <>
        <Head>
            <title>Repeto | Temporary homepage</title>
            <meta
                name="description"
                content="Temporary placeholder page while a new Repeto homepage is being prepared."
            />
            <meta name="robots" content="noindex, nofollow" />
        </Head>

        <main
            style={{
                minHeight: "100vh",
                display: "grid",
                placeItems: "center",
                padding: "24px",
                background: "#f4f4f5",
                color: "#111827",
                fontFamily: "Segoe UI, Tahoma, Geneva, Verdana, sans-serif",
                textAlign: "center",
            }}
        >
            <section style={{ maxWidth: "560px" }}>
                <p
                    style={{
                        margin: "0 0 12px",
                        fontSize: "12px",
                        letterSpacing: "0.08em",
                        textTransform: "uppercase",
                        color: "#6b7280",
                    }}
                >
                    Temporary page
                </p>
                <h1 style={{ margin: "0 0 12px", fontSize: "34px", lineHeight: 1.2 }}>
                    Repeto homepage is being rebuilt
                </h1>
                <p style={{ margin: 0, fontSize: "17px", lineHeight: 1.55, color: "#374151" }}>
                    We are preparing a new version of the main page. Please check back soon.
                </p>
            </section>
        </main>
    </>
);

export default Home;
