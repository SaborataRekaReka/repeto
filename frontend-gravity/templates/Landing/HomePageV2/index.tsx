import { useEffect, useMemo, useState } from "react";
import Head from "next/head";
import Link from "next/link";
import { ArrowRight, ChevronRight } from "@gravity-ui/icons";
import { Icon } from "@gravity-ui/uikit";
import type { IconData } from "@gravity-ui/uikit";
import AppDialog from "@/components/AppDialog";
import Image from "@/components/Image";
import styles from "./LandingHomePageV2.module.css";

type BentoCard = {
    id: string;
    eyebrow: string;
    title: string;
    text: string;
    metric: string;
    points: string[];
};

const navigation = [
    { href: "#products", label: "Продукт" },
    { href: "#solutions", label: "Решения" },
    { href: "#developers", label: "Интеграции" },
    { href: "#pricing", label: "Тарифы" },
];

const heroStats = [
    { id: "lessons", label: "Занятий в системе", value: "2.4M" },
    { id: "automation", label: "Рутины автоматизировано", value: "80%" },
    { id: "uptime", label: "Доступность сервиса", value: "99.98%" },
];

const bentoCards: BentoCard[] = [
    {
        id: "payments",
        eyebrow: "Payments",
        title: "Оплаты сходятся в одном потоке",
        text: "Пакеты, разовые уроки, долги и предоплата живут в единой истории без ручных сверок.",
        metric: "+132 400 ₽",
        points: ["Карты, переводы и ссылки", "История по каждому ученику", "Автостатусы после занятий"],
    },
    {
        id: "billing",
        eyebrow: "Billing",
        title: "Любая модель начислений",
        text: "Абонементы, оплата по факту и смешанные сценарии работают в одном интерфейсе.",
        metric: "6 моделей",
        points: ["Абонементы и остатки", "Списание по расписанию", "Поздние отмены по правилам"],
    },
    {
        id: "portal",
        eyebrow: "Portal",
        title: "Кабинет для семьи ученика",
        text: "Родители видят расписание, домашку и остаток пакета без лишних сообщений репетитору.",
        metric: "1 ссылка",
        points: ["Без отдельной регистрации", "Расписание и домашние задания", "Прозрачный баланс"],
    },
    {
        id: "analytics",
        eyebrow: "Analytics",
        title: "Операционная аналитика",
        text: "Доход, загрузка недели, отмены и риски показываются сразу, а не в конце месяца.",
        metric: "Live data",
        points: ["Доход по ученикам", "Загрузка по дням", "Отмены и пропуски"],
    },
    {
        id: "automation",
        eyebrow: "Automation",
        title: "Автосценарии вместо рутины",
        text: "Напоминания, события уроков и статусы запускаются сами по понятным правилам.",
        metric: "12 сценариев",
        points: ["Push, email и мессенджеры", "Триггеры по урокам", "Логи отправок"],
    },
    {
        id: "integrations",
        eyebrow: "Integrations",
        title: "Интеграции с рабочими сервисами",
        text: "Календари, облачные диски и отчёты подключаются как единая рабочая среда.",
        metric: "10+ связок",
        points: ["Google и Яндекс Календарь", "Google Drive и Яндекс Диск", "Экспорт данных"],
    },
];

export default function LandingHomePageV2() {
    const [stickyHeader, setStickyHeader] = useState(false);
    const [activeStatIndex, setActiveStatIndex] = useState(0);
    const [activeCardId, setActiveCardId] = useState<string | null>(null);

    useEffect(() => {
        const handleScroll = () => setStickyHeader(window.scrollY > 24);
        handleScroll();
        window.addEventListener("scroll", handleScroll, { passive: true });
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    useEffect(() => {
        const intervalId = window.setInterval(() => {
            setActiveStatIndex((current) => (current + 1) % heroStats.length);
        }, 2600);

        return () => window.clearInterval(intervalId);
    }, []);

    const activeCard = useMemo(
        () => bentoCards.find((card) => card.id === activeCardId) || null,
        [activeCardId],
    );

    return (
        <>
            <Head>
                <title>Repeto Home v2 — новая главная</title>
                <meta
                    name="description"
                    content="Вторая версия главной Repeto с hero-секцией и интерактивным bento-блоком."
                />
            </Head>

            <div className={styles.page}>
                <div className={styles.heroSurface}>
                    <header className={`${styles.header} ${stickyHeader ? styles.headerSticky : ""}`}>
                        <Link href="/" className={styles.logoLink} aria-label="Repeto">
                            <Image src="/brand/logo.svg" width={146} height={21} alt="Repeto" priority unoptimized />
                        </Link>

                        <nav className={styles.navigation} aria-label="Навигация Home v2">
                            {navigation.map((item) => (
                                <a key={item.href} href={item.href} className={styles.navigationLink}>
                                    {item.label}
                                </a>
                            ))}
                        </nav>

                        <div className={styles.headerActions}>
                            <Link href="/auth?view=signin" className={styles.headerButtonGhost}>
                                Войти
                            </Link>
                            <Link href="/auth?view=signup" className={styles.headerButtonPrimary}>
                                Начать бесплатно
                            </Link>
                        </div>
                    </header>

                    <section className={styles.hero}>
                        <div className={styles.heroCopy}>
                            <p className={styles.heroKicker}>Инфраструктура для частного преподавателя</p>
                            <h1 className={styles.heroTitle}>
                                Управляйте расписанием, оплатами и коммуникацией в одном интерфейсе
                            </h1>
                            <p className={styles.heroSubtitle}>
                                Черновик Home v2 переносит SaaS-механику: косой градиент, живой продуктовый экран,
                                плотную сетку карточек и раскрытие сценариев в модалке.
                            </p>

                            <div className={styles.heroActions}>
                                <Link href="/auth?view=signup" className={styles.heroActionPrimary}>
                                    Запустить Repeto
                                    <Icon data={ArrowRight as IconData} size={16} />
                                </Link>
                                <a href="#solutions" className={styles.heroActionSecondary}>
                                    Смотреть bento
                                    <Icon data={ChevronRight as IconData} size={16} />
                                </a>
                            </div>

                            <div className={styles.heroStats}>
                                {heroStats.map((stat, index) => (
                                    <article
                                        key={stat.id}
                                        className={`${styles.heroStatCard} ${index === activeStatIndex ? styles.heroStatCardActive : ""}`}
                                    >
                                        <p>{stat.label}</p>
                                        <strong>{stat.value}</strong>
                                    </article>
                                ))}
                            </div>
                        </div>

                        <div className={styles.heroVisual} aria-label="Интерфейс Repeto">
                            <div className={styles.heroVisualMain}>
                                <Image
                                    src="/images/landing/screen-dashboard.png?v=2026050701"
                                    width={1440}
                                    height={1000}
                                    alt="Интерфейс Repeto"
                                    className={styles.heroVisualImage}
                                    priority
                                    unoptimized
                                />
                            </div>

                            <div className={`${styles.heroFloat} ${styles.heroFloatTop}`}>
                                <span>Поток оплат</span>
                                <strong>+132 400 ₽</strong>
                                <p>за 30 дней</p>
                            </div>

                            <div className={`${styles.heroFloat} ${styles.heroFloatBottom}`}>
                                <span>Расписание</span>
                                <strong>24 урока</strong>
                                <p>без пересечений</p>
                            </div>
                        </div>
                    </section>
                </div>

                <main>
                    <section id="solutions" className={styles.bentoSection}>
                        <div className={styles.bentoInner}>
                            <div className={styles.bentoHead}>
                                <p className={styles.bentoKicker}>Flexible solutions</p>
                                <h2 className={styles.bentoTitle}>Модули под любой рабочий процесс</h2>
                                <p className={styles.bentoSubtitle}>
                                    Bento-сетка сделана как интерактивная витрина: карточки поднимаются при наведении,
                                    внутри есть движущиеся визуализации, а кнопка раскрывает подробный сценарий.
                                </p>
                            </div>

                            <div className={styles.bentoGrid}>
                                {bentoCards.map((card, index) => (
                                    <article
                                        key={card.id}
                                        className={`${styles.bentoCard} ${index === 0 ? styles.bentoCardWide : ""} ${index === 1 ? styles.bentoCardTall : ""}`}
                                    >
                                        <div className={styles.bentoCardTop}>
                                            <p className={styles.bentoCardEyebrow}>{card.eyebrow}</p>
                                            <h3 className={styles.bentoCardTitle}>{card.title}</h3>
                                            <p className={styles.bentoCardText}>{card.text}</p>
                                        </div>

                                        <div className={styles.bentoCardVisual}>
                                            <div className={styles.bentoVisualLine} />
                                            <div className={styles.bentoVisualBars}>
                                                <span style={{ height: "32%" }} />
                                                <span style={{ height: "58%" }} />
                                                <span style={{ height: "46%" }} />
                                                <span style={{ height: "72%" }} />
                                            </div>
                                            <div className={styles.bentoVisualMetric}>{card.metric}</div>
                                        </div>

                                        <button
                                            type="button"
                                            className={styles.bentoOpenButton}
                                            onClick={() => setActiveCardId(card.id)}
                                        >
                                            Открыть сценарий
                                            <Icon data={ArrowRight as IconData} size={14} />
                                        </button>
                                    </article>
                                ))}
                            </div>
                        </div>
                    </section>
                </main>

                <AppDialog
                    open={Boolean(activeCard)}
                    onClose={() => setActiveCardId(null)}
                    size="l"
                    hasCloseButton
                    caption={activeCard?.title}
                    bodyClassName={styles.modalBody}
                >
                    {activeCard ? (
                        <div className={styles.modalContent}>
                            <p className={styles.modalEyebrow}>{activeCard.eyebrow}</p>
                            <p className={styles.modalText}>{activeCard.text}</p>
                            <div className={styles.modalMetric}>{activeCard.metric}</div>
                            <ul className={styles.modalList}>
                                {activeCard.points.map((point) => (
                                    <li key={point}>{point}</li>
                                ))}
                            </ul>
                            <div className={styles.modalActions}>
                                <Link href="/auth?view=signup" className={styles.modalPrimaryAction}>
                                    Подключить в Repeto
                                </Link>
                                <button type="button" className={styles.modalGhostAction} onClick={() => setActiveCardId(null)}>
                                    Закрыть
                                </button>
                            </div>
                        </div>
                    ) : null}
                </AppDialog>
            </div>
        </>
    );
}