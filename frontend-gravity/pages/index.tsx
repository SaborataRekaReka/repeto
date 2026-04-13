import type { NextPage } from "next";
import Head from "next/head";
import Link from "next/link";

const Home: NextPage = () => {
    return (
        <>
            <Head>
                <title>Repeto | Платформа для репетиторов</title>
                <meta
                    name="description"
                    content="Repeto - платформа для управления учениками, расписанием и оплатами. Скоро полноценный лендинг."
                />
            </Head>

            <main className="landing">
                <div className="landing__bg" aria-hidden />
                <section className="landing__card">
                    <p className="landing__badge">repeto.ru</p>
                    <h1>Лендинг в разработке</h1>
                    <p>
                        Мы готовим основную страницу Repeto. Уже сейчас можно войти в систему и продолжать
                        работу с проектом.
                    </p>

                    <div className="landing__actions">
                        <Link href="/registration" className="landing__btn landing__btn_primary">
                            Войти в проект
                        </Link>
                        <Link href="/dashboard" className="landing__btn landing__btn_secondary">
                            Открыть кабинет
                        </Link>
                    </div>
                </section>
            </main>

            <style jsx>{`
                .landing {
                    min-height: 100vh;
                    display: grid;
                    place-items: center;
                    padding: 24px;
                    position: relative;
                    overflow: hidden;
                    background:
                        radial-gradient(circle at 15% 15%, #ffe7c7 0%, transparent 35%),
                        radial-gradient(circle at 85% 80%, #c6ecff 0%, transparent 32%),
                        linear-gradient(135deg, #f8f3e9 0%, #eef6ff 100%);
                    font-family: "IBM Plex Sans", "Segoe UI", sans-serif;
                }

                .landing__bg {
                    position: absolute;
                    inset: 0;
                    background-image: linear-gradient(rgba(0, 0, 0, 0.03) 1px, transparent 1px),
                        linear-gradient(90deg, rgba(0, 0, 0, 0.03) 1px, transparent 1px);
                    background-size: 28px 28px;
                    opacity: 0.35;
                    pointer-events: none;
                    animation: drift 16s linear infinite;
                }

                .landing__card {
                    position: relative;
                    width: min(760px, 100%);
                    padding: 36px;
                    border-radius: 24px;
                    background: rgba(255, 255, 255, 0.72);
                    border: 1px solid rgba(255, 255, 255, 0.85);
                    box-shadow: 0 20px 60px rgba(32, 50, 74, 0.16);
                    backdrop-filter: blur(6px);
                    animation: rise 480ms ease-out;
                }

                .landing__badge {
                    display: inline-block;
                    margin: 0 0 16px;
                    padding: 8px 12px;
                    border-radius: 999px;
                    background: #111827;
                    color: #f5f5f5;
                    font-size: 12px;
                    letter-spacing: 0.08em;
                    text-transform: uppercase;
                }

                h1 {
                    margin: 0 0 12px;
                    color: #15273f;
                    font-size: clamp(32px, 5vw, 54px);
                    line-height: 1.05;
                    letter-spacing: -0.03em;
                }

                p {
                    margin: 0;
                    color: #2d3f56;
                    font-size: clamp(16px, 2.2vw, 20px);
                    line-height: 1.5;
                    max-width: 56ch;
                }

                .landing__actions {
                    display: flex;
                    gap: 12px;
                    flex-wrap: wrap;
                    margin-top: 24px;
                }

                .landing__btn {
                    padding: 12px 18px;
                    border-radius: 12px;
                    font-weight: 600;
                    text-decoration: none;
                    transition: transform 180ms ease, box-shadow 180ms ease, background-color 180ms ease;
                }

                .landing__btn:hover {
                    transform: translateY(-2px);
                }

                .landing__btn_primary {
                    background: #106cda;
                    color: #ffffff;
                    box-shadow: 0 10px 22px rgba(16, 108, 218, 0.28);
                }

                .landing__btn_secondary {
                    background: #ffffff;
                    color: #1f2a3c;
                    border: 1px solid #d4deeb;
                }

                @keyframes rise {
                    from {
                        opacity: 0;
                        transform: translateY(10px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }

                @keyframes drift {
                    from {
                        transform: translateX(0);
                    }
                    to {
                        transform: translateX(28px);
                    }
                }

                @media (max-width: 640px) {
                    .landing__card {
                        padding: 24px;
                        border-radius: 20px;
                    }

                    .landing__actions {
                        flex-direction: column;
                    }

                    .landing__btn {
                        text-align: center;
                    }
                }
            `}</style>
        </>
    );
};

export default Home;
