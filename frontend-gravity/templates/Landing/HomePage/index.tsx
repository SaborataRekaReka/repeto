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
        imageSrc: "/images/landing/sheld.png",
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
        imageSrc: "/images/landing/money_after_control.png",
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
        imageSrc: "/images/landing/public_page_rep.png",
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
        imageSrc: "/images/landing/cancel_policy.png",
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
        imageSrc: "/images/landing/reminders.png",
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
        imageSrc: "/images/landing/parent_portal.png",
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
        imageSrc: "/images/landing/homework.png",
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
        imageSrc: "/images/landing/files.png",
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
        imageSrc: "/images/landing/analytics.png",
    },
];

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
    },
    {
        id: "student-page",
        title: "Личная страница у каждого ученика",
        text: "У каждого ученика свой кабинет: расписание, домашние задания, история занятий и текущий баланс всегда под рукой.",
        tone: "purple",
    },
    {
        id: "dashboard",
        title: "Дашборд",
        text: "Главные показатели за период в одном экране: доход, количество уроков, отмены и динамика без ручных таблиц.",
        tone: "gray",
    },
    {
        id: "finance",
        title: "Раздел Финансы",
        text: "Контролируйте оплаты, долги, предоплату и остатки по пакетам в одном месте без постоянных проверок вручную.",
        tone: "soft",
    },
    {
        id: "tax-export",
        title: "Выгрузка отчётов для самозанятых",
        text: "Подготовленные данные по оплатам можно быстро выгрузить для формирования чеков и работы с «Мой налог».",
        tone: "green",
    },
    {
        id: "packages",
        title: "Пакеты занятий и скидки",
        text: "Настраивайте пакеты уроков, персональные скидки и спецусловия: система сама учитывает остатки и итоговую стоимость.",
        tone: "purple",
    },
    {
        id: "notifications",
        title: "Уведомления и их настройка",
        text: "Гибко выбирайте каналы и время отправки: напоминания об уроках и оплатах уходят автоматически по вашим правилам.",
        tone: "gray",
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
                                    src="/brand/logo_landing.svg"
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
                            <h1 className={styles.heroTitle}>
                                Перестаньте терять деньги на отменах
                                <br />
                                и забытых оплатах
                            </h1>

                            <p className={styles.heroSubtitle}>
                                Repeto — журнал репетитора, который ведёт расписание, считает долги,
                                напоминает об оплатах и даёт родителям доступ к расписанию. Вместо Excel,
                                блокнота и десяти переписок.
                            </p>

                            <div className={styles.heroActions}>
                                <a href="#pricing" className={`${styles.heroButton} ${styles.heroButtonGhost}`}>
                                    <span className={styles.heroButtonPriceRow}>
                                        <span className={styles.heroButtonPriceCrossed}>300 ₽</span>
                                        250 ₽/мес
                                    </span>
                                    <span className={styles.heroButtonPriceDesc}>При оплате за год</span>
                                </a>
                                <Link href="/auth?view=signup" className={`${styles.heroButton} ${styles.heroButtonPrimary}`}>
                                    Начать пользоваться
                                </Link>
                            </div>

                            <div className={styles.previewWrap}>
                                <Image
                                    src="/images/landing/dashboard-preview.png?v=2026041501"
                                    width={1600}
                                    height={1036}
                                    alt="Интерфейс Repeto"
                                    className={styles.previewImage}
                                    priority
                                    unoptimized
                                />
                            </div>
                        </section>
                    </div>
                </div>

                <section id="features" className={styles.scheduleSection}>
                    <div className={styles.scheduleSectionInner}>
                        <div className={styles.scheduleContent}>
                            <span className={styles.scheduleTag}>{featureBlocks[0].tag}</span>
                            <h2 className={styles.scheduleTitle}>{featureBlocks[0].title}</h2>
                            <p className={styles.scheduleText}>{featureBlocks[0].text}</p>
                            <ul className={styles.schedulePointList}>
                                {featureBlocks[0].points.map((point) => (
                                    <li key={point} className={styles.schedulePointItem}>
                                        {point}
                                    </li>
                                ))}
                            </ul>
                        </div>

                        <div className={styles.scheduleImageWrap}>
                            <Image
                                src="/images/landing/sheld.png"
                                width={960}
                                height={640}
                                alt={featureBlocks[0].imageAlt || featureBlocks[0].title}
                                className={styles.scheduleImage}
                                unoptimized
                            />
                        </div>
                    </div>
                </section>

                <section className={styles.featuresContinuation}>
                    <div className={styles.featuresContinuationInner}>
                        {featureBlocks.slice(1).map((block, index) => {
                            const isExpandedFeatureBlock = block.id === "payments" || block.id === "public-page";

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
                                        className={`${styles.featureVisualWrap} ${
                                            isExpandedFeatureBlock ? styles.featureVisualWrapExpanded : ""
                                        }`}
                                    >
                                        {block.imageSrc ? (
                                            <Image
                                                src={block.imageSrc}
                                                width={960}
                                                height={640}
                                                alt={block.imageAlt || block.title}
                                                className={`${styles.featureVisualImage} ${
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
                            {capabilitiesCards.map((card, index) => (
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
                                    {index === 0 ? (
                                        <div className={styles.capabilitiesCardPreview} aria-hidden="true">
                                            <Image
                                                src="/images/landing/public_page_rep.png"
                                                width={420}
                                                height={252}
                                                alt=""
                                                unoptimized
                                            />
                                        </div>
                                    ) : index === 1 ? (
                                        <Image
                                            src="/images/landing/public_student.png"
                                            width={120}
                                            height={70}
                                            alt=""
                                            unoptimized
                                            className={styles.capabilitiesCardStudentImg}
                                        />
                                    ) : index === 2 ? (
                                        <Image
                                            src="/images/landing/dashboard_mini.png"
                                            width={120}
                                            height={70}
                                            alt=""
                                            unoptimized
                                            className={styles.capabilitiesCardPlainImg}
                                        />
                                    ) : index === 3 ? (
                                        <Image
                                            src="/images/landing/finance.png"
                                            width={120}
                                            height={70}
                                            alt=""
                                            unoptimized
                                            className={styles.capabilitiesCardPlainImg}
                                        />
                                    ) : index === 4 ? (
                                        <Image
                                            src="/images/landing/nalog.png"
                                            width={120}
                                            height={70}
                                            alt=""
                                            unoptimized
                                            className={styles.capabilitiesCardPlainImg}
                                        />
                                    ) : index === 5 ? (
                                        <Image
                                            src="/images/landing/paket_zanaty.png"
                                            width={120}
                                            height={70}
                                            alt=""
                                            unoptimized
                                            className={styles.capabilitiesCardPlainImg}
                                        />
                                    ) : index === 6 ? (
                                        <Image
                                            src="/images/landing/notis.png"
                                            width={120}
                                            height={70}
                                            alt=""
                                            unoptimized
                                            className={styles.capabilitiesCardPlainImg}
                                        />
                                    ) : (
                                        <div className={styles.capabilitiesCardIcon} aria-hidden="true" />
                                    )}
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
                                        <h3 className={styles.tariffName}>{plan.name}</h3>
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
            </div>
        </>
    );
}
