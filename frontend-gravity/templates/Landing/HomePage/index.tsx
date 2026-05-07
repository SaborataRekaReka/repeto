import { useEffect, useRef, useState } from "react";
import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import { Avatar, Card, DropdownMenu, Icon, Label, Text } from "@gravity-ui/uikit";
import type { IconData } from "@gravity-ui/uikit";
import { ChevronRight, FolderOpen } from "@gravity-ui/icons";
import Image from "@/components/Image";
import { useAuth } from "@/contexts/AuthContext";
import { getInitials, shortName } from "@/lib/formatters";
import StudentAvatar from "@/components/StudentAvatar";
import StudentNameWithBadge from "@/components/StudentNameWithBadge";
import IncomeByStudents from "@/templates/Finance/FinanceOverviewPage/IncomeByStudents";
import styles from "./LandingHomePage.module.css";

const GDropdownMenu = DropdownMenu as any;

const navigation = [
    { href: "#features", label: "Возможности" },
    { href: "#pricing", label: "Тарифы" },
    { href: "#reviews", label: "Отзывы" },
];

const heroMetrics = [
    { label: "Уроков сегодня", value: "6", tone: "dark" },
    { label: "Ожидают оплату", value: "18 400 ₽", tone: "brand" },
    { label: "Поздних отмен", value: "2", tone: "green" },
];

const controlCards = [
    {
        title: "Больше не нужно искать ученика в трех местах",
        text: "Имя, предмет, тариф, контакты родителей и история занятий лежат в одной карточке.",
    },
    {
        title: "Переносы больше не ломают вам неделю",
        text: "Расписание, окна, отмены и статусы обновляются в одной системе без ручной сверки.",
    },
    {
        title: "Больше не нужно спрашивать: «А вы оплатили?»",
        text: "Баланс, пакеты, предоплата и долги видны сразу по каждому ученику.",
    },
    {
        title: "Родители сами видят, что у них по занятиям",
        text: "Расписание, домашка, история уроков и остаток по пакету открываются без переписки с вами.",
    },
];

type ShowcaseLessonStatus = "planned" | "completed" | "cancelled_student" | "cancelled_tutor" | "no_show";

const showcaseStatusTheme = (status: ShowcaseLessonStatus): "success" | "danger" | "normal" => {
    switch (status) {
        case "completed":
            return "success";
        case "cancelled_student":
        case "cancelled_tutor":
            return "danger";
        case "no_show":
            return "normal";
        default:
            return "normal";
    }
};

const showcaseStatusLabel = (status: ShowcaseLessonStatus) => {
    switch (status) {
        case "planned":
            return "Запланировано";
        case "completed":
            return "Проведено";
        case "cancelled_student":
        case "cancelled_tutor":
            return "Отменено";
        case "no_show":
            return "Не явился";
        default:
            return "Запланировано";
    }
};

const showcaseTodayLessons: Array<{
    id: string;
    studentName: string;
    subject: string;
    startTime: string;
    endTime: string;
    status: ShowcaseLessonStatus;
    hasRepetoAccount: boolean;
}> = [
    {
        id: "lesson-1",
        studentName: "Artem L.",
        subject: "Physics",
        startTime: "03:30",
        endTime: "04:30",
        status: "planned",
        hasRepetoAccount: false,
    },
    {
        id: "lesson-2",
        studentName: "Pavel K.",
        subject: "Math",
        startTime: "03:00",
        endTime: "04:00",
        status: "planned",
        hasRepetoAccount: false,
    },
];

const toRuDate = (date: Date) => {
    const dd = String(date.getDate()).padStart(2, "0");
    const mm = String(date.getMonth() + 1).padStart(2, "0");
    const yyyy = date.getFullYear();
    return `${dd}.${mm}.${yyyy}`;
};

const relativeRuDate = (monthOffset: number, day: number) => {
    const now = new Date();
    return toRuDate(new Date(now.getFullYear(), now.getMonth() + monthOffset, day));
};

const showcaseIncomePayments = [
    { id: "pay-1", studentId: "student-anna", studentName: "Анна К.", amount: 7800, date: relativeRuDate(-2, 5) },
    { id: "pay-2", studentId: "student-pavel", studentName: "Павел К.", amount: 6400, date: relativeRuDate(-2, 19) },
    { id: "pay-3", studentId: "student-anna", studentName: "Анна К.", amount: 9200, date: relativeRuDate(-1, 8) },
    { id: "pay-4", studentId: "student-pavel", studentName: "Павел К.", amount: 7100, date: relativeRuDate(-1, 22) },
    { id: "pay-5", studentId: "student-anna", studentName: "Анна К.", amount: 9800, date: relativeRuDate(0, 4) },
    { id: "pay-6", studentId: "student-pavel", studentName: "Павел К.", amount: 8300, date: relativeRuDate(0, 18) },
];

type ShowcaseFilesItem = {
    id: string;
    type: "folder" | "file";
    name: string;
    size: string;
    modifiedAt: string;
    subtitle?: string;
    extension?: string;
};

const showcaseFilesRows: ShowcaseFilesItem[] = [
    {
        id: "files-root-yandex",
        type: "folder",
        name: "Яндекс.Диск",
        size: "—",
        modifiedAt: "Сейчас",
        subtitle: "2 файлов",
    },
    {
        id: "files-doc-kinematics",
        type: "file",
        name: "Кинематика.pdf",
        size: "2.4 МБ",
        modifiedAt: "06.05",
        extension: "pdf",
    },
    {
        id: "files-doc-plan",
        type: "file",
        name: "План занятия.docx",
        size: "460 КБ",
        modifiedAt: "05.05",
        extension: "docx",
    },
];

const showcaseFileIcon = (ext?: string) => {
    switch ((ext || "").toLowerCase()) {
        case "pdf":
            return "/images/pdf.svg";
        case "xlsx":
        case "xls":
            return "/images/xlsx.svg";
        case "doc":
        case "docx":
            return "/images/document.svg";
        default:
            return "/images/document.svg";
    }
};

const steps = [
    { step: "1", title: "Зарегистрируйтесь", text: "Через email или Telegram — 30 секунд" },
    { step: "2", title: "Добавьте учеников", text: "Имя, предмет, тариф. Остальное — потом" },
    { step: "3", title: "Запланируйте занятия", text: "Повторяющиеся уроки — одной кнопкой" },
    { step: "4", title: "Забудьте про хаос", text: "Repeto напомнит, посчитает, покажет" },
];

const comparisonRows = [
    {
        scenario: "Ученик отменил за 2 часа",
        before: "Придется напоминать про оплату или забить",
        after: "Долг начислится автоматически — родитель увидит",
    },
    {
        scenario: "А мы оплатили?",
        before: "Ищете в мессенджере / Excel",
        after: "Баланс и история видны мгновенно",
    },
    {
        scenario: "Расписание на неделю",
        before: "Google Calendar + ручная сверка",
        after: "Одно расписание, синхронизация с вашим календарем",
    },
    {
        scenario: "Мама спрашивает: когда урок?",
        before: "Пишете ей сами",
        after: "Родитель видит все в своем кабинете",
    },
    {
        scenario: "Домашка",
        before: "WhatsApp, теряется в потоке",
        after: "Задание с дедлайном, статусом и файлами",
    },
    {
        scenario: "Конец месяца — сколько заработали?",
        before: "Excel-таблица (если не забыли вести)",
        after: "Дашборд: доход, уроки, отмены — моментально",
    },
];

const faqItems = [
    {
        q: "Это действительно бесплатно до 5 учеников?",
        a: "Да. До 5 учеников Repeto бесплатен навсегда. Это не пробный период: вы можете вести расписание, оплаты и заметки без скрытых ограничений по времени.",
    },
    {
        q: "Я работаю как самозанятый — подойдет ли мне Repeto?",
        a: "Да. Repeto показывает доход по периодам и позволяет экспортировать данные для формирования чеков в Мой налог.",
    },
    {
        q: "Что увидит родитель / ученик?",
        a: "Родитель получит ссылку на портал без регистрации: расписание, остаток по пакету, домашние задания и историю уроков.",
    },
    {
        q: "Нужно ли устанавливать приложение?",
        a: "Нет. Repeto — это PWA: открываете в браузере, добавляете на экран телефона и пользуетесь как обычным приложением.",
    },
];

type BentoCard = {
    id: string;
    tag: string;
    title: string;
    text: string;
    points: string[];
    imageSrc: string;
    imageAlt: string;
    imageWidth: number;
    imageHeight: number;
    variant: "wide" | "tall" | "compact";
    tone?: "default" | "dark";
};

const featureBlocks = [
    {
        id: "schedule",
        tag: "Три главных преимущества",
        title: "Расписание остается в порядке, даже когда все двигается",
        text: "Создайте постоянные уроки один раз и дальше работайте по готовому ритму. Перенос, отмена или неявка фиксируются за пару нажатий, а у вас не расползается неделя и не теряются свободные окна.",
        points: [
            "Повторяющиеся занятия на нужные дни и время",
            "Статусы: проведено, перенос, отмена, неявка",
            "Синхронизация с Google / Яндекс.Календарем",
            "Онлайн и офлайн форматы с адресом или ссылкой",
        ],
        imageSrc: "/images/landing/screen-schedule.png?v=2026050701",
        imageAlt: "Расписание в Repeto",
    },
    {
        id: "payments",
        tag: "Три главных преимущества",
        title: "Система сама показывает, где деньги и где риск потерять оплату",
        text: "У каждого ученика виден баланс, история оплат и остаток по пакету. Записали урок — сумма посчиталась. Настроили правило поздней отмены — долг начислился сам. Вам не нужно вспоминать, кто заплатил и почему цифры не сошлись.",
        points: [
            "Автоматический расчёт суммы по тарифу ученика",
            "Пакеты занятий и остаток уроков видны сразу",
            "Поздние отмены начисляются по вашей политике",
            "Экспорт оплат для отчетности и чеков",
        ],
        imageSrc: "/images/landing/screen-finance.png?v=2026050701",
        imageAlt: "Финансы в Repeto",
    },
    {
        id: "portal",
        tag: "Три главных преимущества",
        title: "Расписание, домашка и пакет видны без вашего участия",
        text: "Отправьте ссылку на портал — без регистрации и без отдельного приложения. Родитель видит расписание, остаток по пакету, домашние задания и историю уроков. Вы перестаете быть справочной службой в мессенджере.",
        points: [
            "Доступ по ссылке без регистрации",
            "Видны расписание, пакет, домашка и заметки",
            "Отмена или перенос работают по вашим правилам",
            "Меньше вопросов: когда урок и что по оплате",
        ],
        imageSrc: "/images/landing/screen-student-portal.png?v=2026050701",
        imageAlt: "Портал для родителей и учеников",
    },
];

const realScreenFeatureIds = new Set([
    "schedule",
    "payments",
    "portal",
]);

const bentoCards: BentoCard[] = [
    {
        id: "reminders",
        tag: "Напоминания",
        title: "Перед уроками не нужно писать вручную",
        text: "Repeto сам напоминает об уроках и об оплатах в нужное время, чтобы вы не держали это в голове и не тратили вечер на ручные сообщения.",
        points: [
            "Telegram, WhatsApp, Max, email и push",
            "Гибкое время отправки для уроков и оплат",
        ],
        imageSrc: "/images/landing/screen-reminders-settings.png?v=2026050701",
        imageAlt: "Напоминания в Repeto",
        imageWidth: 1440,
        imageHeight: 1000,
        variant: "wide",
    },
    {
        id: "parents-access",
        tag: "Доступ для родителей",
        title: "Родитель видит расписание, домашку и пакет без сообщений вам",
        text: "Вы просто отправляете ссылку, а дальше вопросы про время урока, остаток пакета и задания закрываются без бесконечных уточнений в мессенджере.",
        points: [
            "Доступ по ссылке без регистрации",
            "Расписание, заметки, домашка и остаток пакета",
        ],
        imageSrc: "/images/landing/screen-student-portal.png?v=2026050701",
        imageAlt: "Доступ для родителей в Repeto",
        imageWidth: 1440,
        imageHeight: 1000,
        variant: "tall",
        tone: "dark",
    },
    {
        id: "homework",
        tag: "Домашка и журнал",
        title: "Все в одном месте",
        text: "Что прошли, что задано и что нужно приложить к следующему занятию видно сразу и вам, и семье ученика.",
        points: [
            "Заметки к занятию и дедлайны",
            "Статусы выполнения домашки",
        ],
        imageSrc: "/images/landing/screen-student-live.png?v=2026050701",
        imageAlt: "Кабинет ученика в Repeto",
        imageWidth: 1360,
        imageHeight: 900,
        variant: "compact",
    },
    {
        id: "materials",
        tag: "Материалы",
        title: "Материалы не теряются в чатах",
        text: "Учебные материалы лежат структурно, открываются нужным ученикам и не тонут в переписке.",
        points: [
            "Папки, файлы и общий доступ",
            "Подключение Яндекс.Диска и Google Drive",
        ],
        imageSrc: "/images/landing/screen-files.png?v=2026050701",
        imageAlt: "Материалы и файлы в Repeto",
        imageWidth: 1440,
        imageHeight: 1000,
        variant: "compact",
    },
    {
        id: "analytics",
        tag: "Аналитика",
        title: "Операционка на глазах",
        text: "Не нужно считать вручную: дашборд сразу показывает, где вы растёте, а где теряете деньги и время.",
        points: [
            "Доход за период и средний чек",
            "Загрузка недели и процент отмен",
        ],
        imageSrc: "/images/landing/screen-dashboard.png?v=2026050701",
        imageAlt: "Аналитика в Repeto",
        imageWidth: 1440,
        imageHeight: 1000,
        variant: "compact",
    },
];

const integrationCards = [
    {
        id: "calendar",
        title: "Календари",
        text: "Google и Яндекс.Календарь синхронизируются с занятиями, переносами и свободными окнами без ручного дубляжа.",
        imageSrc: "/images/landing/calendars.png",
    },
    {
        id: "drive",
        title: "Облачные диски",
        text: "Материалы можно хранить и подтягивать из Яндекс.Диска и Google Drive без лишних копий и пересылок.",
        imageSrc: "/images/landing/yandex_google.png",
    },
    {
        id: "channels",
        title: "Мессенджеры",
        text: "Привычные каналы связи и платёжные сценарии встраиваются в рабочий процесс, а не живут отдельно от расписания.",
        imageSrc: "/images/landing/telegram_max.png",
    },
];

const _capabilitiesCardsLegacy = [
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
        name: "Free",
        price: "0 ₽",
        yearlyPrice: "0 ₽",
        period: "в месяц",
        yearlyPeriod: "навсегда",
        subtitle: "До 5 учеников",
        description: "Полный доступ к ключевым функциям Repeto без ограничений по времени.",
        ctaPrimary: "Начать бесплатно",
        ctaSecondary: "Без карты",
        features: [
            "До 5 активных учеников",
            "Расписание, финансы, домашка и портал",
            "Напоминания и учет пакетов",
            "Подходит для старта и теста системы",
        ],
    },
    {
        id: "profi",
        name: "Standard",
        price: "490 ₽",
        yearlyPrice: "4 990 ₽",
        period: "в месяц",
        yearlyPeriod: "в год",
        subtitle: "До 30 учеников",
        description: "Тариф для частного репетитора со стабильным потоком и полной автоматизацией рутины.",
        ctaPrimary: "Выбрать тариф",
        ctaSecondary: "Популярный выбор",
        featured: true,
        features: [
            "До 30 активных учеников",
            "Пакеты занятий и гибкие правила отмен",
            "Автоматические напоминания в нужные каналы",
            "Аналитика, отчеты и портал для родителей",
        ],
    },
    {
        id: "center",
        name: "Pro",
        price: "890 ₽",
        yearlyPrice: "8 990 ₽",
        period: "в месяц",
        yearlyPeriod: "в год",
        subtitle: "До 100 учеников",
        description: "Для репетитора с большой базой или небольшой команды с высокой загрузкой.",
        ctaPrimary: "Перейти на Pro",
        ctaSecondary: "Для роста",
        features: [
            "До 100 активных учеников",
            "Все возможности Standard",
            "Расширенная аналитика и контроль нагрузки",
            "Приоритетная поддержка",
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
    const profileAvatarUrl = user?.avatar?.trim() || undefined;
    const profileInitials = getInitials(profileName || "U");

    const renderHeaderActions = (isSticky: boolean) => {
        const actionsClassName = isSticky ? styles.stickyHeaderActions : styles.headerActions;

        if (!isAuthorized) {
            return (
                <div className={actionsClassName}>
                    <Link href="/auth?view=signin" className={`${styles.headerButton} ${styles.headerButtonGhost}`}>
                        Войти
                    </Link>
                    <Link href="/auth?view=signup" className={`${styles.headerButton} ${styles.headerButtonPrimary}`}>
                        До 5 учеников бесплатно
                    </Link>
                </div>
            );
        }

        return (
            <div className={actionsClassName}>
                <GDropdownMenu
                    switcher={
                        <button type="button" className={styles.headerProfileTrigger}>
                            <Avatar imgUrl={profileAvatarUrl} text={profileInitials} size="xs" theme="brand" />
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
                <title>Repeto — CRM для репетиторов: расписание, оплаты и кабинет родителей</title>
                <meta
                    name="description"
                    content="CRM для репетиторов и небольших центров: расписание, оплаты, пакеты, напоминания и родительский портал. До 5 учеников бесплатно навсегда."
                />
                <meta name="mailru-domain" content="aMv8My8xlxQcqEPC" />
                <meta property="og:title" content="Repeto — репетитору больше не нужно вести хаос вручную" />
                <meta
                    property="og:description"
                    content="Расписание, оплаты, домашка и родительский кабинет в одной системе. До 5 учеников бесплатно."
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
                                <p className={styles.heroKicker}>CRM для репетиторов и небольших центров</p>

                                <h1 className={styles.heroTitle}>
                                    Репетитору больше не нужно держать все в голове и таблицах
                                </h1>

                                <p className={styles.heroSubtitle}>
                                    Repeto помогает вести учеников, расписание, оплаты, пакеты и домашку в одной системе.
                                    Родители видят все в своем кабинете, а вы не тратите время на бесконечные уточнения.
                                </p>

                                <div className={styles.heroActions}>
                                    <Link href="/auth?view=signup" className={`${styles.heroButton} ${styles.heroButtonPrimary}`}>
                                        Начать бесплатно - до 5 учеников
                                    </Link>
                                    <a href="#features" className={`${styles.heroButton} ${styles.heroButtonGhost}`}>
                                        Посмотреть как работает
                                    </a>
                                </div>

                                <p className={styles.heroTrust}>Бесплатно до 5 учеников навсегда, без карты и скрытых ограничений</p>
                            </div>

                            <div className={styles.productStage} aria-label="Интерфейс Repeto">
                                <div className={styles.productHalo} aria-hidden="true" />
                                <div className={styles.productScreen}>
                                    <Image
                                        src="/images/landing/screen-dashboard.png?v=2026050701"
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
                            <span className={styles.scheduleTag}>Все в одном месте</span>
                            <h2 className={styles.controlTitle}>Вместо таблиц, чатов и заметок - одна система, где все под контролем</h2>
                            <p className={styles.controlText}>
                                Вы видите учеников, занятия, оплаты и домашку в едином потоке. Repeto убирает рутину,
                                чтобы вы занимались преподаванием, а не ручным контролем хаоса.
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
                            const isExpandedFeatureBlock = block.id === "payments" || block.id === "portal";
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
                                    </div>
                                </article>
                            );
                        })}
                    </div>
                </section>

                <section className={styles.showcaseSection} aria-labelledby="showcase-title">
                    <div className={styles.showcaseInner}>
                        <p className={styles.showcaseLabel}>Остальное уже внутри Repeto</p>
                        <h2 id="showcase-title" className={styles.showcaseTitle}>
                            Напоминания, домашка, материалы, аналитика и доступ для родителей в одном продукте
                        </h2>
                        <p className={styles.showcaseSubtitle}>
                            Здесь не нужно растягивать лендинг на ещё несколько широких экранов: все вторичные возможности собраны в один бенто-блок с быстрым считыванием.
                        </p>

                        <div className={styles.showcaseGrid}>
                            <article className={`${styles.showcaseCard} ${styles.showcaseCardIncome}`}>
                                <header className={styles.showcaseCardHead}>
                                    <div>
                                        <p className={styles.showcaseCardKicker}>Доход по месяцам</p>
                                        <p className={styles.showcaseCardSubvalue}>Сегментированный виджет из раздела «Финансы»</p>
                                    </div>
                                    <div className={styles.showcaseChip}>Финансы</div>
                                </header>
                                <div className={styles.showcaseIncomeWidget}>
                                    <IncomeByStudents paymentsOverride={showcaseIncomePayments} disableInteractions />
                                </div>
                                <div className={styles.showcaseCardCopy}>
                                    <h3 className={styles.showcaseCardCopyTitle}>Доход по месяцам, как в Финансах</h3>
                                    <p className={styles.showcaseCardCopyText}>Сегменты показывают вклад каждого ученика по месяцам и общий итог.</p>
                                </div>
                            </article>

                            <article className={`${styles.showcaseCard} ${styles.showcaseCardToday}`}>
                                <header className={styles.showcaseCardHead}>
                                    <div>
                                        <p className={styles.showcaseCardKicker}>Занятия сегодня</p>
                                        <p className={styles.showcaseCardSubvalue}>Копия дашборд-виджета с 2 учениками</p>
                                    </div>
                                    <div className={styles.showcaseChip}>Дашборд</div>
                                </header>
                                <div className={styles.showcaseTodaySchedule}>
                                    <Card view="outlined" style={{ overflow: "hidden", background: "#f2f3f6" }}>
                                        <div className="repeto-card-header">
                                            <Text variant="subheader-2">Ближайшие занятия</Text>
                                            <span className={`repeto-card-chevron ${styles.showcaseTodayChevron}`} aria-hidden="true">
                                                <Icon data={ChevronRight as IconData} size={18} />
                                            </span>
                                        </div>
                                        <div>
                                            {showcaseTodayLessons.map((lesson) => (
                                                <div
                                                    key={lesson.id}
                                                    className="repeto-week-lesson-row"
                                                    style={{
                                                        display: "flex",
                                                        alignItems: "center",
                                                        width: "100%",
                                                        background: "transparent",
                                                        cursor: "default",
                                                        textAlign: "left",
                                                    }}
                                                >
                                                    <StudentAvatar
                                                        student={{ name: lesson.studentName, avatarUrl: undefined }}
                                                        size="s"
                                                    />
                                                    <div style={{ flex: 1, minWidth: 0 }}>
                                                        <div
                                                            style={{
                                                                display: "flex",
                                                                justifyContent: "space-between",
                                                                alignItems: "center",
                                                                marginBottom: 2,
                                                            }}
                                                        >
                                                            <Text variant="body-2" ellipsis className="repeto-dashboard-entity-name">
                                                                <StudentNameWithBadge
                                                                    name={shortName(lesson.studentName)}
                                                                    hasRepetoAccount={lesson.hasRepetoAccount}
                                                                    truncate
                                                                />
                                                            </Text>
                                                            <Text
                                                                variant="body-1"
                                                                color="secondary"
                                                                style={{ flexShrink: 0, marginLeft: 8, fontVariantNumeric: "tabular-nums" }}
                                                            >
                                                                {lesson.startTime} - {lesson.endTime}
                                                            </Text>
                                                        </div>
                                                        <div
                                                            style={{
                                                                display: "flex",
                                                                justifyContent: "space-between",
                                                                alignItems: "center",
                                                            }}
                                                        >
                                                            <Text variant="body-1" color="secondary">
                                                                {lesson.subject}
                                                            </Text>
                                                            <Label theme={showcaseStatusTheme(lesson.status)} size="xs">
                                                                {showcaseStatusLabel(lesson.status)}
                                                            </Label>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </Card>
                                </div>
                                <div className={styles.showcaseCardCopy}>
                                    <h3 className={styles.showcaseCardCopyTitle}>Тот же виджет, как на дашборде</h3>
                                    <p className={styles.showcaseCardCopyText}>Два ученика, время урока, предмет и статус в компактной карточке.</p>
                                </div>
                            </article>

                            {bentoCards.map((card) => (
                                <article
                                    key={card.id}
                                    className={`${styles.showcaseCard} ${
                                        card.variant === "wide"
                                            ? styles.bentoCardWide
                                            : card.variant === "tall"
                                              ? styles.bentoCardTall
                                              : styles.bentoCardCompact
                                    } ${card.tone === "dark" ? styles.bentoCardDark : ""} ${
                                        card.id === "homework" ? styles.bentoCardStudentScreenshot : ""
                                    } ${
                                        card.id === "materials" ? styles.bentoCardMaterials : ""
                                    } ${
                                        card.id === "analytics" ? styles.bentoCardAnalytics : ""
                                    }`}
                                >
                                    <div className={styles.bentoCardMeta}>
                                        <span className={styles.bentoCardTag}>{card.tag}</span>
                                        <h3 className={styles.bentoCardTitle}>{card.title}</h3>
                                        <p className={styles.bentoCardText}>{card.text}</p>
                                    </div>

                                    <div className={styles.bentoCardVisual}>
                                        {card.id === "analytics" ? (
                                            <div className={styles.showcaseIncomeWidget}>
                                                <IncomeByStudents paymentsOverride={showcaseIncomePayments} />
                                            </div>
                                        ) : card.id === "materials" ? (
                                            <div className={styles.showcaseFilesWidget}>
                                                <div className={styles.showcaseFilesSimpleHead}>
                                                    <span className={styles.showcaseFilesSimpleProvider}>Яндекс.Диск</span>
                                                    <span className={styles.showcaseFilesSimpleCount}>3 файла</span>
                                                </div>
                                                <ul className={styles.showcaseFilesSimpleList}>
                                                    {showcaseFilesRows.slice(0, 3).map((item) => (
                                                        <li key={item.id} className={styles.showcaseFilesSimpleItem}>
                                                            <span className={styles.showcaseFilesSimpleIcon}>
                                                                {item.type === "folder" ? (
                                                                    <Icon data={FolderOpen as IconData} size={16} style={{ color: "var(--g-color-text-brand)" }} />
                                                                ) : (
                                                                    <Image src={showcaseFileIcon(item.extension)} width={14} height={14} alt="" unoptimized />
                                                                )}
                                                            </span>
                                                            <span className={styles.showcaseFilesSimpleMain}>
                                                                <span className={styles.showcaseFilesSimpleName}>{item.name}</span>
                                                                <span className={styles.showcaseFilesSimpleMeta}>
                                                                    {item.type === "folder" ? item.subtitle : `${item.size} · ${item.modifiedAt}`}
                                                                </span>
                                                            </span>
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                        ) : (
                                            <Image
                                                src={card.imageSrc}
                                                width={card.imageWidth}
                                                height={card.imageHeight}
                                                alt={card.imageAlt}
                                                className={styles.bentoCardImage}
                                                unoptimized
                                            />
                                        )}
                                    </div>

                                    <ul className={styles.bentoCardList}>
                                        {card.points.map((point) => (
                                            <li key={point}>{point}</li>
                                        ))}
                                    </ul>
                                </article>
                            ))}
                        </div>
                    </div>
                </section>

                <section className={styles.integrationsSection} aria-labelledby="integrations-title">
                    <div className={styles.integrationsInner}>
                        <p className={styles.integrationsLabel}>Интеграции</p>
                        <h2 id="integrations-title" className={styles.integrationsTitle}>
                            Repeto работает вместе с вашими привычными сервисами
                        </h2>
                        <p className={styles.integrationsSubtitle}>
                            Календарь, облако и каналы связи подключаются как рабочие инструменты, а не как отдельный зоопарк приложений.
                        </p>

                        <div className={styles.integrationsGrid}>
                            {integrationCards.map((card, index) => (
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
                                        <span className={styles.integrationsAccentShape} aria-hidden="true" />
                                    ) : null}
                                </article>
                            ))}
                        </div>
                    </div>
                </section>

                <section className={styles.stepsSection} aria-labelledby="steps-title">
                    <div className={styles.stepsInner}>
                        <p className={styles.stepsLabel}>Как это работает</p>
                        <h2 id="steps-title" className={styles.stepsTitle}>Подключаетесь за 10 минут</h2>
                        <div className={styles.stepsGrid}>
                            {steps.map((item) => (
                                <article key={item.step} className={styles.stepCard}>
                                    <span className={styles.stepBadge}>{item.step}</span>
                                    <h3>{item.title}</h3>
                                    <p>{item.text}</p>
                                </article>
                            ))}
                        </div>
                        <div className={styles.stepsAction}>
                            <Link href="/auth?view=signup" className={styles.stepsActionButton}>
                                Попробовать бесплатно
                            </Link>
                        </div>
                    </div>
                </section>

                <section className={styles.comparisonSection} aria-labelledby="comparison-title">
                    <div className={styles.comparisonInner}>
                        <p className={styles.comparisonLabel}>До и после</p>
                        <h2 id="comparison-title" className={styles.comparisonTitle}>
                            До Repeto и после Repeto
                        </h2>
                        <div className={styles.comparisonTable}>
                            <div className={styles.comparisonHead}>
                                <span>Ситуация</span>
                                <span>Как обычно</span>
                                <span>С Repeto</span>
                            </div>
                            {comparisonRows.map((row) => (
                                <div key={row.scenario} className={styles.comparisonRow}>
                                    <p>{row.scenario}</p>
                                    <p>{row.before}</p>
                                    <p>{row.after}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                <section id="pricing" className={styles.tariffsSection} aria-labelledby="tariffs-title">
                    <div className={styles.tariffsInner}>
                        <p className={styles.tariffsLabel}>Тарифы</p>
                        <h2 id="tariffs-title" className={styles.tariffsTitle}>
                            Начните бесплатно, платите только когда растете
                        </h2>
                        <p className={styles.tariffsLead}>
                            До 5 учеников - бесплатно навсегда. Подключение без карты, апгрейд в один клик.
                        </p>

                        <div className={styles.tariffsSwitch}>
                            <button
                                type="button"
                                className={`${styles.tariffsSwitchButton} ${!yearly ? styles.tariffsSwitchButtonActive : ""}`}
                                onClick={() => setYearly(false)}
                            >
                                Оплата помесячно
                            </button>
                            <button
                                type="button"
                                className={`${styles.tariffsSwitchButton} ${yearly ? styles.tariffsSwitchButtonActive : ""}`}
                                onClick={() => setYearly(true)}
                            >
                                Оплата за год
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

                <section id="faq" className={styles.faqSection} aria-labelledby="faq-title">
                    <div className={styles.faqInner}>
                        <p className={styles.faqLabel}>FAQ</p>
                        <h2 id="faq-title" className={styles.faqTitle}>Частые вопросы</h2>
                        <div className={styles.faqList}>
                            {faqItems.map((item) => (
                                <details key={item.q} className={styles.faqItem}>
                                    <summary>{item.q}</summary>
                                    <p>{item.a}</p>
                                </details>
                            ))}
                        </div>
                    </div>
                </section>

                <section id="reviews" className={styles.reviewsSection} aria-labelledby="reviews-title">
                    <div className={styles.reviewsInner}>
                        <p className={styles.reviewsLabel}>Отзывы</p>
                        <h2 id="reviews-title" className={styles.reviewsTitle}>Репетиторы уже ведут практику в Repeto</h2>
                        <p className={styles.reviewsPlaceholder}>
                            120+ репетиторов уже ведут практику в Repeto. Скоро здесь появятся подробные кейсы и
                            цитаты.
                        </p>
                    </div>
                </section>

                <section className={styles.finalCtaSection} aria-labelledby="final-cta-title">
                    <div className={styles.finalCtaInner}>
                        <h2 id="final-cta-title" className={styles.finalCtaTitle}>
                            Попробуйте Repeto бесплатно и перестаньте вести хаос вручную
                        </h2>
                        <p className={styles.finalCtaText}>До 5 учеников бесплатно навсегда. Подключение за 10 минут.</p>
                        <div className={styles.finalCtaActions}>
                            <Link href="/auth?view=signup" className={styles.finalCtaButton}>
                                Начать бесплатно
                            </Link>
                        </div>
                    </div>
                </section>

                <footer className={styles.siteFooter}>
                    <div className={styles.siteFooterInner}>
                        <span className={styles.siteFooterBrand}>Repeto</span>
                        <div className={styles.siteFooterLinks}>
                            <Link href="/legal" className={styles.siteFooterLink}>
                                Пользовательское соглашение
                            </Link>
                            <Link href="/legal#privacy" className={styles.siteFooterLink}>
                                Политика конфиденциальности
                            </Link>
                            <a href="mailto:help@repeto.ru" className={styles.siteFooterLink}>
                                help@repeto.ru
                            </a>
                        </div>
                    </div>
                </footer>
            </div>
        </>
    );
}
