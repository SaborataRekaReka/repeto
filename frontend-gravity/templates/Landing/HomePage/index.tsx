import { useEffect, useRef, useState } from "react";
import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import { Avatar, DropdownMenu } from "@gravity-ui/uikit";
import Image from "@/components/Image";
import { useAuth } from "@/contexts/AuthContext";
import { getInitials } from "@/lib/formatters";
import styles from "./LandingHomePage.module.css";

const GDropdownMenu = DropdownMenu as any;

const navigation = [
    { href: "#features", label: "Возможности" },
    { href: "#pricing", label: "Стоимость" },
    { href: "#faq", label: "FAQ" },
];

const heroMetrics = [
    { label: "Уроков сегодня", value: "6", tone: "dark" },
    { label: "Ожидают оплату", value: "18 400 ₽", tone: "brand" },
    { label: "Поздних отмен", value: "2", tone: "green" },
];

const controlCards = [
    {
        title: "Ученики",
        text: "Карточки, тарифы, предметы, контакты родителей и история занятий в одном месте.",
    },
    {
        title: "Расписание",
        text: "Повторяющиеся уроки, переносы, отмены и синхронизация с календарями.",
    },
    {
        title: "Оплаты",
        text: "Баланс, долги, пакеты занятий и понятная история платежей без ручных таблиц.",
    },
    {
        title: "Портал",
        text: "Родители и ученики видят расписание, домашку, остатки пакета и правила отмен.",
    },
];

const featureBlocks = [
    {
        id: "schedule",
        tag: "Расписание и календарь",
        title: "Расписание, которое работает за вас",
        text: "Создавайте повторяющиеся занятия — вторник/четверг 17:00 — одним действием. Переносите, отменяйте, ставьте «неявку» — всё в два тапа. Синхронизация с Google Calendar и Яндекс.Календарём: занятия появляются в привычном приложении, без двойного ввода.",
        points: [
            "Повторяющиеся занятия на нужные дни",
            "Статусы: проведено, отменено учеником, неявка, перенос",
            "Двусторонняя синхронизация с Google / Яндекс.Календарём",
            "Онлайн и офлайн форматы с указанием места",
        ],
        imageSrc: "/images/landing/screen-schedule.png?v=2026042903",
        imageAlt: "Расписание в Repeto",
    },
    {
        id: "payments",
        tag: "Учёт оплат и пакеты",
        title: "Деньги под контролем — без неловких разговоров",
        text: "У каждого ученика — баланс и история оплат. Записали занятие — сумма рассчиталась автоматически. Видите долги, предоплату, оплаченные и просроченные платежи. Продаёте пакеты — Repeto сам считает, сколько занятий осталось. Больше не нужно вспоминать «а Маша заплатила за март?».",
        points: [
            "Автоматический расчёт суммы по тарифу ученика",
            "Пакеты занятий: 8 уроков за 4 000 ₽ — остаток виден всегда",
            "СБП, наличные, перевод, ЮKassa — все способы оплаты",
            "Экспорт в Excel для налоговой отчётности",
        ],
        imageSrc: "/images/landing/screen-finance.png?v=2026042903",
    },
    {
        id: "public-page",
        tag: "Личная страница репетитора",
        title: "Публичная страница преподавателя",
        text: "Покажите предметы, формат занятий, стоимость и свободные окна. Одну ссылку можно отправлять новым ученикам и родителям.",
        points: [
            "Покажите предметы, формат занятий, стоимость и свободные окна",
            "Одну ссылку можно отправлять новым ученикам и родителям",
        ],
        imageSrc: "/images/landing/screen-public-page.png?v=2026042903",
    },
    {
        id: "cancel-policy",
        tag: "Политики отмен",
        title: "Правила отмен — один раз настроить, больше не спорить",
        text: "Задайте политику: «отмена менее чем за 24 часа — занятие оплачивается». Когда ученик отменяет поздно — долг начисляется автоматически. Родитель видит это в своём кабинете. Без конфликтов и «ну вы же понимаете».",
        points: [
            "Гибкие правила: срок отмены, штраф, процент от стоимости",
            "Автоматическое начисление при поздней отмене",
            "Прозрачность: родитель видит причину долга",
        ],
        imageSrc: "/images/landing/screen-cancel-policy.png?v=2026042904",
    },
    {
        id: "reminders",
        tag: "Напоминания",
        title: "Напоминания, которые снижают пропуски",
        text: "Repeto напоминает ученику и родителю о занятии заранее — в Telegram, WhatsApp, Max, по email или push-уведомлением. Напоминание об оплате отправляется автоматически. Не нужно писать самому, шаблоны готовы.",
        points: [
            "6 каналов: Telegram, WhatsApp, Max, email, SMS, push",
            "Напоминания об уроках и об оплатах",
            "Вы видите статус доставки каждого сообщения",
            "Настраиваемое время: за 1 час, за день, за 3 дня",
        ],
        imageSrc: "/images/landing/screen-reminders-settings.png?v=2026042904",
    },
    {
        id: "portal",
        tag: "Портал для родителей и учеников",
        title: "Родитель всё видит сам — и перестаёт звонить",
        text: "Отправьте родителю ссылку — без регистрации. Он откроет личный кабинет, где видно расписание, остаток по пакету, домашние задания и историю занятий. Может сам отменить урок (с учётом вашей политики), оставить отзыв и загрузить файл с домашкой.",
        points: [
            "Доступ по ссылке — никакой регистрации",
            "Видны: расписание, пакет, домашка, заметки",
            "Родитель может отменять / переносить уроки",
            "Ребёнок сдаёт ДЗ прямо в портале",
        ],
        imageSrc: "/images/landing/screen-student-portal.png?v=2026042904",
    },
    {
        id: "homework",
        tag: "Домашние задания и записи уроков",
        title: "Журнал уроков — что прошли, что задали",
        text: "После каждого занятия — запишите, что прошли и что задали. Прикрепите файл или ссылку. Домашка видна ученику и родителю, со сроком и статусом. Вы видите, кто сделал, кто нет — до следующего урока.",
        points: [
            "Заметки к каждому уроку: что пройдено",
            "Домашнее задание: описание, срок, файлы",
            "Статусы: задано → выполнено / просрочено",
            "Доступ ученика/родителя через портал",
        ],
        imageSrc: "/images/landing/screen-homework.png?v=2026042904",
    },
    {
        id: "files",
        tag: "Файлы и материалы",
        title: "Все материалы — в одном месте",
        text: "Храните учебные материалы в Repeto. Создавайте папки, загружайте файлы, делитесь ими с конкретными учениками. Интеграция с Яндекс.Диском и Google Drive — работайте с привычным хранилищем, не перетаскивая файлы вручную.",
        points: [
            "Папки и файлы, как в файловом менеджере",
            "Общий доступ к отдельным файлам для учеников",
            "Синхронизация с Яндекс.Диском и Google Drive",
        ],
        imageSrc: "/images/landing/screen-files.png?v=2026042904",
    },
    {
        id: "dashboard",
        tag: "Дашборд и финансовая аналитика",
        title: "Сколько вы заработали — одним взглядом",
        text: "На главном экране — доход за месяц, количество уроков, средний чек, процент отмен. Видите, куда уходит время и где теряете деньги. Без ручных подсчётов, без Excel.",
        points: [
            "Доход за месяц / неделю / период",
            "Количество проведённых занятий",
            "Средний тариф и процент отмен",
            "Экспорт данных для самозанятых",
        ],
        imageSrc: "/images/landing/screen-dashboard.png?v=2026042903",
    },
];

const realScreenFeatureIds = new Set([
    "schedule",
    "payments",
    "public-page",
    "cancel-policy",
    "reminders",
    "portal",
    "homework",
    "files",
    "dashboard",
]);

const integrationsCards = [
    {
        id: "drive",
        title: "Облачные диски",
        text: "Материалы, домашние задания и документы хранятся в одном потоке: ничего не теряется и всегда под рукой.",
        imageSrc: "/images/landing/yandex_google.png",
    },
    {
        id: "calendar",
        title: "Календари",
        text: "Занятия и переносы автоматически синхронизируются в календарях, чтобы расписание оставалось актуальным без ручного дубляжа.",
        imageSrc: "/images/landing/calendars.png",
    },
    {
        id: "notifications",
        title: "Telegram, Max",
        text: "Удобные уведомления о занятиях и оплатах приходят в привычные каналы: вы не тратите время на ручные напоминания.",
        imageSrc: "/images/landing/telegram_max.png",
    },
];

const capabilitiesCards = [
    {
        id: "public-page",
        title: "Публичная страница преподавателя",
        text: "Покажите предметы, формат занятий, стоимость и свободные окна. Одну ссылку можно отправлять новым ученикам и родителям.",
        tone: "dark",
        illustrationSrc: "/images/landing/capabilities/public-page-concept-transparent.png",
    },
    {
        id: "student-page",
        title: "Кабинет ученика",
        text: "У каждого ученика свой кабинет: расписание, домашние задания, история занятий и текущий баланс всегда под рукой.",
        tone: "purple",
        illustrationSrc: "/images/landing/capabilities/student-page-concept-transparent.png",
    },
    {
        id: "dashboard",
        title: "Дашборд",
        text: "Главные показатели за период в одном экране: доход, количество уроков, отмены и динамика без ручных таблиц.",
        tone: "gray",
        illustrationSrc: "/images/landing/capabilities/dashboard-concept-transparent.png",
    },
    {
        id: "finance",
        title: "Раздел Финансы",
        text: "Контролируйте оплаты, долги, предоплату и остатки по пакетам в одном месте без постоянных проверок вручную.",
        tone: "soft",
        illustrationSrc: "/images/landing/capabilities/finance-concept-transparent.png",
    },
    {
        id: "tax-export",
        title: "Выгрузка отчётов",
        text: "Подготовленные данные по оплатам можно быстро выгрузить для формирования чеков и работы с «Мой налог».",
        tone: "green",
        illustrationSrc: "/images/landing/capabilities/tax-export-concept-transparent.png",
    },
    {
        id: "packages",
        title: "Пакеты занятий и скидки",
        text: "Настраивайте пакеты уроков, персональные скидки и спецусловия: система сама учитывает остатки и итоговую стоимость.",
        tone: "purple",
        illustrationSrc: "/images/landing/capabilities/packages-concept-transparent.png",
    },
    {
        id: "notifications",
        title: "Уведомления и их настройка",
        text: "Гибко выбирайте каналы и время отправки: напоминания об уроках и оплатах уходят автоматически по вашим правилам.",
        tone: "gray",
        illustrationSrc: "/images/landing/capabilities/notifications-concept-transparent.png",
    },
];

const tariffPlans = [
    {
        id: "start",
        name: "Старт",
        price: "0 ₽",
        yearlyPrice: "0 ₽",
        period: "в месяц",
        yearlyPeriod: "навсегда",
        subtitle: "Полный доступ для старта",
        description: "Доступен весь функционал Repeto, но вести можно только одного ученика.",
        ctaPrimary: "Начать бесплатно",
        ctaSecondary: "Подходит для теста",
        features: [
            "Все разделы и инструменты платформы",
            "Только 1 активный ученик",
            "Расписание, финансы, уведомления",
            "Портал ученика и домашние задания",
        ],
    },
    {
        id: "profi",
        name: "Практика",
        price: "300 ₽",
        yearlyPrice: "250 ₽",
        period: "в месяц",
        yearlyPeriod: "в мес. при оплате за год",
        subtitle: "Оптимально для частного репетитора",
        description: "До 15 учеников в одном аккаунте и полный набор функций для стабильной работы.",
        ctaPrimary: "Выбрать тариф",
        ctaSecondary: "14 дней на проверку",
        featured: true,
        features: [
            "До 15 активных учеников",
            "Пакеты занятий и скидки",
            "Интеграции и автоматические напоминания",
            "Аналитика дохода и отмен",
        ],
    },
    {
        id: "center",
        name: "Репетиторский центр",
        price: "1 500 ₽",
        yearlyPrice: "1 250 ₽",
        period: "в месяц",
        yearlyPeriod: "в мес. при оплате за год",
        subtitle: "Для команды и роста без ограничений",
        description: "Для репетиторских центров: учеников можно добавлять без лимита.",
        ctaPrimary: "Подключить центр",
        ctaSecondary: "Без ограничений по масштабу",
        features: [
            "Без лимита по количеству учеников",
            "Единая система расписания и финансов",
            "Отчеты и контроль оплаты по всем направлениям",
            "Гибкая коммуникация с родителями и учениками",
        ],
    },
];

export default function LandingHomePage() {
    const router = useRouter();
    const { user, logout } = useAuth();
    const [yearly, setYearly] = useState(false);
    const [isStickyVisible, setIsStickyVisible] = useState(false);
    const lastScrollYRef = useRef(0);
    const isAuthorized = Boolean(user);
    const profileName = user?.name?.trim() || "Профиль";
    const profileInitials = getInitials(profileName || "U");

    const renderHeaderActions = (isSticky: boolean) => {
        const actionsClassName = isSticky ? styles.stickyHeaderActions : styles.headerActions;

        if (!isAuthorized) {
            return (
                <div className={actionsClassName}>
                    <Link href="/auth?view=signup" className={`${styles.headerButton} ${styles.headerButtonGhost}`}>
                        Регистрация
                    </Link>
                    <Link href="/auth?view=signin" className={`${styles.headerButton} ${styles.headerButtonPrimary}`}>
                        Войти
                    </Link>
                </div>
            );
        }

        return (
            <div className={actionsClassName}>
                <GDropdownMenu
                    switcher={
                        <button type="button" className={styles.headerProfileTrigger}>
                            <Avatar text={profileInitials} size="xs" theme="brand" />
                            <span className={styles.headerProfileName}>{profileName}</span>
                        </button>
                    }
                    items={[
                        {
                            text: "Открыть журнал",
                            action: () => router.push("/dashboard"),
                        },
                        {
                            text: "Выйти",
                            action: () => {
                                void logout();
                            },
                        },
                    ]}
                />
            </div>
        );
    };

    useEffect(() => {
        lastScrollYRef.current = window.scrollY;

        const onScroll = () => {
            const currentY = window.scrollY;
            const previousY = lastScrollYRef.current;
            const delta = 6;

            if (currentY <= 120) {
                setIsStickyVisible(false);
            } else if (currentY < previousY - delta) {
                setIsStickyVisible(true);
            } else if (currentY > previousY + delta) {
                setIsStickyVisible(false);
            }

            lastScrollYRef.current = currentY;
        };

        window.addEventListener("scroll", onScroll, { passive: true });
        return () => window.removeEventListener("scroll", onScroll);
    }, []);

    return (
        <>
            <Head>
                <title>Repeto — журнал репетитора: расписание, оплаты, напоминания</title>
                <meta
                    name="description"
                    content="CRM для репетиторов. Расписание занятий, учёт оплат и пакетов, напоминания и портал для родителей."
                />
                <meta name="mailru-domain" content="aMv8My8xlxQcqEPC" />
                <meta property="og:title" content="Repeto — перестаньте терять деньги на отменах" />
                <meta
                    property="og:description"
                    content="Журнал репетитора: расписание, оплаты, пакеты, напоминания, портал для родителей."
                />
                <meta property="og:image" content="/fb-og-image.jpg" />
            </Head>

            <div className={styles.page}>
                <header className={`${styles.stickyHeader} ${isStickyVisible ? styles.stickyHeaderVisible : ""}`}>
                    <Link href="/" className={styles.stickyLogoLink} aria-label="Repeto">
                        <Image
                            src="/brand/logo.svg"
                            width={160}
                            height={23}
                            alt="Repeto"
                            priority
                            unoptimized
                        />
                    </Link>

                    <nav className={styles.stickyNav} aria-label="Главная навигация">
                        {navigation.map((item) => (
                            <a key={item.href} href={item.href} className={styles.stickyNavLink}>
                                {item.label}
                            </a>
                        ))}
                    </nav>

                    {renderHeaderActions(true)}
                </header>

                <div className={styles.heroSurface}>
                    <div className={styles.desktopFrame}>
                        <header className={styles.header}>
                            <Link href="/" className={styles.logoLink} aria-label="Repeto">
                                <Image
                                    src="/brand/logo.svg"
                                    width={160}
                                    height={23}
                                    alt="Repeto"
                                    priority
                                    unoptimized
                                />
                            </Link>

                            <nav className={styles.nav} aria-label="Главная навигация">
                                {navigation.map((item) => (
                                    <a key={item.href} href={item.href} className={styles.navLink}>
                                        {item.label}
                                    </a>
                                ))}
                            </nav>

                            {renderHeaderActions(false)}
                        </header>

                        <section className={styles.hero}>
                            <div className={styles.heroCopy}>
                                <p className={styles.heroKicker}>CRM и платформа для работы с учениками</p>

                                <h1 className={styles.heroTitle}>
                                    Ученики, занятия и оплаты в одной системе
                                </h1>

                                <p className={styles.heroSubtitle}>
                                    Repeto помогает вести расписание, считать долги, продавать пакеты,
                                    отправлять напоминания и давать родителям понятный доступ к занятиям.
                                </p>

                                <div className={styles.heroActions}>
                                    <Link href="/auth?view=signup" className={`${styles.heroButton} ${styles.heroButtonPrimary}`}>
                                        Начать бесплатно
                                    </Link>
                                    <a href="#features" className={`${styles.heroButton} ${styles.heroButtonGhost}`}>
                                        Посмотреть возможности
                                    </a>
                                </div>

                                <p className={styles.heroTrust}>Бесплатный старт · Без карты · Для репетиторов и небольших центров</p>
                            </div>

                            <div className={styles.productStage} aria-label="Интерфейс Repeto">
                                <div className={styles.productHalo} aria-hidden="true" />
                                <div className={styles.productScreen}>
                                    <Image
                                        src="/images/landing/screen-dashboard.png?v=2026042903"
                                        width={1440}
                                        height={1000}
                                        alt="Дашборд Repeto"
                                        className={styles.productScreenImage}
                                        priority
                                        unoptimized
                                    />
                                </div>

                                <div className={`${styles.productFloatCard} ${styles.productFloatCardTop}`}>
                                    <span className={styles.floatLabel}>Баланс ученика</span>
                                    <strong>+4 800 ₽</strong>
                                    <span className={styles.floatHint}>2 урока к оплате</span>
                                </div>

                                <div className={`${styles.productFloatCard} ${styles.productFloatCardBottom}`}>
                                    <span className={styles.floatLabel}>Родительский портал</span>
                                    <strong>Открыт доступ</strong>
                                    <span className={styles.floatHint}>Расписание, домашка, пакет</span>
                                </div>

                                <div className={styles.productMetrics}>
                                    {heroMetrics.map((metric) => (
                                        <div
                                            key={metric.label}
                                            className={`${styles.productMetric} ${
                                                metric.tone === "brand"
                                                    ? styles.productMetricBrand
                                                    : metric.tone === "green"
                                                      ? styles.productMetricGreen
                                                      : ""
                                            }`}
                                        >
                                            <span>{metric.label}</span>
                                            <strong>{metric.value}</strong>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </section>
                    </div>
                </div>

                <section id="features" className={styles.controlSection}>
                    <div className={styles.controlSectionInner}>
                        <div className={styles.controlSectionHead}>
                            <span className={styles.scheduleTag}>Под контролем</span>
                            <h2 className={styles.controlTitle}>Вся практика видна с первого экрана</h2>
                            <p className={styles.controlText}>
                                Repeto собирает рабочий день репетитора в понятную систему: кто учится,
                                когда занятие, сколько должны и что видит родитель.
                            </p>
                        </div>

                        <div className={styles.controlGrid}>
                            {controlCards.map((card, index) => (
                                <article key={card.title} className={styles.controlCard}>
                                    <span className={styles.controlNumber}>{String(index + 1).padStart(2, "0")}</span>
                                    <h3>{card.title}</h3>
                                    <p>{card.text}</p>
                                </article>
                            ))}
                        </div>
                    </div>
                </section>

                <section className={styles.featuresContinuation}>
                    <div className={styles.featuresContinuationInner}>
                        {featureBlocks.map((block, index) => {
                            const isExpandedFeatureBlock = block.id === "payments" || block.id === "public-page";
                            const isRealScreenFeature = realScreenFeatureIds.has(block.id);

                            return (
                                <article
                                    key={block.id}
                                    className={`${styles.featureRow} ${index % 2 === 0 ? styles.featureRowReverse : ""} ${
                                        isExpandedFeatureBlock ? styles.featureRowExpandedRight : ""
                                    }`}
                                >
                                    <div className={styles.scheduleContent}>
                                        <span className={styles.scheduleTag}>{block.tag}</span>
                                        <h3 className={styles.scheduleTitle}>{block.title}</h3>
                                        <p className={styles.scheduleText}>{block.text}</p>
                                        <ul className={styles.schedulePointList}>
                                            {block.points.map((point) => (
                                                <li key={point} className={styles.schedulePointItem}>
                                                    {point}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>

                                    <div
                                        className={`${styles.featureVisualWrap} ${isRealScreenFeature ? styles.featureVisualWrapScreen : ""} ${
                                            isExpandedFeatureBlock ? styles.featureVisualWrapExpanded : ""
                                        }`}
                                    >
                                        {block.imageSrc ? (
                                            <Image
                                                src={block.imageSrc}
                                                width={isRealScreenFeature ? 1440 : 960}
                                                height={isRealScreenFeature ? 1000 : 640}
                                                alt={block.imageAlt || block.title}
                                                className={`${styles.featureVisualImage} ${isRealScreenFeature ? styles.featureVisualImageScreen : ""} ${
                                                    isExpandedFeatureBlock ? styles.featureVisualImageExpanded : ""
                                                }`}
                                                unoptimized
                                            />
                                        ) : (
                                            <div className={styles.featureStub} aria-hidden="true" />
                                        )}
                                    </div>
                                </article>
                            );
                        })}
                    </div>
                </section>

                <section className={styles.integrationsSection} aria-labelledby="integrations-title">
                    <div className={styles.integrationsInner}>
                        <p className={styles.integrationsLabel}>Подкючите любимые сервисы</p>
                        <h2 id="integrations-title" className={styles.integrationsTitle}>
                            Интеграция с другими сервисами
                        </h2>

                        <div className={styles.integrationsGrid}>
                            {integrationsCards.map((card, index) => (
                                <article
                                    key={card.id}
                                    className={`${styles.integrationsCard} ${index === 2 ? styles.integrationsCardAccent : ""}`}
                                >
                                    <div className={styles.integrationsCardIconWrap} aria-hidden="true">
                                        <Image
                                            src={card.imageSrc}
                                            width={208}
                                            height={136}
                                            alt=""
                                            unoptimized
                                            className={styles.integrationsCardImage}
                                        />
                                    </div>
                                    <h3 className={styles.integrationsCardTitle}>{card.title}</h3>
                                    <p className={styles.integrationsCardText}>{card.text}</p>

                                    {index === 2 ? (
                                        <>

                                            <span className={styles.integrationsAccentShape} aria-hidden="true" />
                                        </>
                                    ) : null}
                                </article>
                            ))}
                        </div>
                    </div>
                </section>

                <section className={styles.capabilitiesSection} aria-labelledby="capabilities-title">
                    <div className={styles.capabilitiesInner}>
                        <p className={styles.capabilitiesLabel}>Что еще</p>
                        <h2 id="capabilities-title" className={styles.capabilitiesTitle}>
                            Все ключевые процессы в одном месте
                        </h2>

                        <div className={styles.capabilitiesGrid}>
                            {capabilitiesCards.map((card) => (
                                <article
                                    key={card.id}
                                    className={`${styles.capabilitiesCard} ${
                                        ({
                                            dark:   styles.capabilitiesCardDark,
                                            purple: styles.capabilitiesCardPurple,
                                            gray:   styles.capabilitiesCardGray,
                                            green:  styles.capabilitiesCardGreen,
                                            soft:   styles.capabilitiesCardSoft,
                                        } as Record<string, string>)[card.tone] ?? styles.capabilitiesCardSoft
                                    }`}
                                >
                                    <div className={styles.capabilitiesIllustrationWrap} aria-hidden="true">
                                        <Image
                                            src={card.illustrationSrc}
                                            width={900}
                                            height={720}
                                            alt=""
                                            unoptimized
                                            className={styles.capabilitiesIllustration}
                                        />
                                    </div>
                                    <h3 className={styles.capabilitiesCardTitle}>{card.title}</h3>
                                    <p className={styles.capabilitiesCardText}>{card.text}</p>
                                </article>
                            ))}
                        </div>
                    </div>
                </section>

                <section id="pricing" className={styles.tariffsSection} aria-labelledby="tariffs-title">
                    <div className={styles.tariffsInner}>
                        <p className={styles.tariffsLabel}>Тарифы</p>
                        <h2 id="tariffs-title" className={styles.tariffsTitle}>
                            Выберите тариф под ваш формат работы
                        </h2>

                        <div className={styles.tariffsSwitch}>
                            <button
                                type="button"
                                className={`${styles.tariffsSwitchButton} ${!yearly ? styles.tariffsSwitchButtonActive : ""}`}
                                onClick={() => setYearly(false)}
                            >
                                Помесячно
                            </button>
                            <button
                                type="button"
                                className={`${styles.tariffsSwitchButton} ${yearly ? styles.tariffsSwitchButtonActive : ""}`}
                                onClick={() => setYearly(true)}
                            >
                                За год − 2 мес. в подарок
                            </button>
                        </div>

                        <div className={styles.tariffsGrid}>
                            {tariffPlans.map((plan) => (
                                <article
                                    key={plan.id}
                                    className={`${styles.tariffCard} ${plan.featured ? styles.tariffCardFeatured : ""}`}
                                >
                                    <div className={styles.tariffCardHead}>
                                        <div className={styles.tariffTitleRow}>
                                            <h3 className={styles.tariffName}>{plan.name}</h3>
                                            {plan.featured && <span className={styles.tariffBadge}>Популярный</span>}
                                        </div>
                                        <div className={styles.tariffPriceRow}>
                                            <span className={styles.tariffPrice}>
                                                {yearly ? plan.yearlyPrice : plan.price}
                                            </span>
                                            <span className={styles.tariffPeriod}>
                                                {yearly ? plan.yearlyPeriod : plan.period}
                                            </span>
                                        </div>
                                        <p className={styles.tariffSubtitle}>{plan.subtitle}</p>
                                        <p className={styles.tariffDescription}>{plan.description}</p>

                                        <div className={styles.tariffButtons}>
                                            <a
                                                href={`/auth?view=signup&plan=${plan.id}&billing=${yearly ? "year" : "month"}`}
                                                className={styles.tariffButtonPrimary}
                                            >
                                                {plan.ctaPrimary}
                                            </a>
                                            <span className={styles.tariffButtonGhost}>{plan.ctaSecondary}</span>
                                        </div>
                                    </div>

                                    <div className={styles.tariffFeaturesBlock}>
                                        <p className={styles.tariffFeaturesTitle}>Что входит</p>
                                        <ul className={styles.tariffFeaturesList}>
                                            {plan.features.map((feature) => (
                                                <li key={feature} className={styles.tariffFeatureItem}>
                                                    {feature}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                </article>
                            ))}
                        </div>
                    </div>
                </section>

                <footer className={styles.siteFooter}>
                    <div className={styles.siteFooterInner}>
                        <span className={styles.siteFooterBrand}>Repeto</span>
                        <div className={styles.siteFooterLinks}>
                            <Link href="/legal" className={styles.siteFooterLink}>
                                Юридическая информация
                            </Link>
                            <Link href="/legal#privacy" className={styles.siteFooterLink}>
                                Политика конфиденциальности
                            </Link>
                        </div>
                    </div>
                </footer>
            </div>
        </>
    );
}
