import { useEffect, useRef, useState } from "react";
import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import { Avatar, Card, DropdownMenu, Icon, Label, Text } from "@gravity-ui/uikit";
import type { IconData } from "@gravity-ui/uikit";
import { ChevronRight, CreditCard, Envelope, FolderOpen } from "@gravity-ui/icons";
import AppDialog from "@/components/AppDialog";
import AnimatedSidebarIcon from "@/components/AnimatedSidebarIcon";
import Image from "@/components/Image";
import { useAuth } from "@/contexts/AuthContext";
import { getInitials, shortName } from "@/lib/formatters";
import { formatBalance } from "@/mocks/students";
import StudentAvatar from "@/components/StudentAvatar";
import StudentNameWithBadge from "@/components/StudentNameWithBadge";
import IncomeByStudents from "@/templates/Finance/FinanceOverviewPage/IncomeByStudents";
import ScheduleMonthPreview from "@/templates/Schedule/CalendarPage/Month";
import HomeworkTab, { type Homework as StudentHomework } from "@/templates/Students/StudentDetailPage/HomeworkTab";
import PaymentHistory from "@/templates/Students/StudentDetailPage/PaymentHistory";
import LessonHistory from "@/templates/Students/StudentDetailPage/LessonHistory";
import type { Payment } from "@/types/finance";
import type { Lesson } from "@/types/schedule";
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

type FeatureBentoCard = {
    id: string;
    tag: string;
    title: string;
    shortText: string;
    modalTitle: string;
    modalText: string;
    details: string[];
    layout: "wide" | "side" | "compact";
};

type FeatureBentoModalMetric = {
    value: string;
    label: string;
    caption: string;
};

type FeatureBentoModalDiscovery = {
    icon: string;
    title: string;
    text: string;
};

const discoveryIconSources: Record<string, string> = {
    "Серия занятий": "/icons/sidebar-animated/calendar.json",
    "Контекст урока": "/icons/sidebar-animated/book-open.json",
    "Синхронизация": "/icons/sidebar-animated/folder-connection.json",
    "Баланс ученика": "/icons/sidebar-animated/wallet.json",
    "Пакеты и скидки": "/icons/sidebar-animated/box.json",
    "Пакеты и остаток": "/icons/sidebar-animated/box.json",
    "Отчеты": "/icons/sidebar-animated/chart-square.json",
    "Чистый обзор": "/icons/sidebar-animated/chart-square.json",
    "Профиль": "/icons/sidebar-animated/profile.json",
    "История": "/icons/sidebar-animated/note-text.json",
    "Связанный аккаунт": "/icons/sidebar-animated/user-tick.json",
    "Сценарии": "/icons/sidebar-animated/clock.json",
    "Получатели": "/icons/sidebar-animated/people.json",
    "Контроль": "/icons/sidebar-animated/task-square.json",
    "Доверие": "/icons/sidebar-animated/user-tick.json",
    "Условия": "/icons/sidebar-animated/receipt.json",
    "Заявка": "/icons/sidebar-animated/calendar.json",
    "Домашка": "/icons/sidebar-animated/task-square.json",
    "Файлы": "/icons/sidebar-animated/folder-open.json",
    "Журнал": "/icons/sidebar-animated/note-text.json",
};

type FeatureBentoModalShowcase = {
    eyebrow: string;
    title: string;
    text: string;
    primaryAction: string;
    secondaryAction: string;
    benefits: string[];
    metrics: FeatureBentoModalMetric[];
    discovery: FeatureBentoModalDiscovery[];
};

const featureBentoCards: FeatureBentoCard[] = [
    {
        id: "schedule",
        tag: "Расписание",
        title: "Занятия, переносы, отмены и свободные окна в одном календаре",
        shortText: "Постоянные уроки, переносы, отмены и свободные окна видны в одном календаре.",
        modalTitle: "Расписание без ручной сверки",
        modalText: "Repeto держит в порядке регулярные занятия, разовые уроки, переносы и отмены. Вы видите неделю целиком и не собираете расписание заново после каждого изменения.",
        details: [
            "Повторяющиеся и разовые занятия",
            "Переносы, отмены и неявки",
            "Свободные окна и синхронизация календаря",
        ],
        layout: "wide",
    },
    {
        id: "payments",
        tag: "Финансы",
        title: "Доход, долги и баланс по каждому ученику",
        shortText: "Доход, пакеты, баланс и задолженности собираются по каждому ученику без Excel.",
        modalTitle: "Оплаты видно до конца месяца",
        modalText: "Система показывает, кто оплатил, кто должен и сколько занятий осталось в пакете. Поздние отмены и задолженности не теряются в переписке.",
        details: [
            "Баланс по каждому ученику",
            "Пакеты и остаток занятий",
            "Долги и история платежей",
        ],
        layout: "side",
    },
    {
        id: "students",
        tag: "База",
        title: "Все важное в карточке ученика",
        shortText: "Контакты, родители, предмет, тариф и история занятий в одной карточке.",
        modalTitle: "Карточка ученика вместо разрозненных заметок",
        modalText: "Все важное по ученику хранится рядом: контакты, родитель, предмет, ставка, история занятий, оплат и заметок. Быстрее найти контекст перед уроком или разговором с семьей.",
        details: [
            "Контакты ученика и родителя",
            "Предмет, ставка и условия",
            "История занятий, оплат и заметок",
        ],
        layout: "compact",
    },
    {
        id: "reminders",
        tag: "Напоминания",
        title: "Напоминайте об уроках и оплатах",
        shortText: "Уроки и оплаты уходят в нужный канал в нужное время.",
        modalTitle: "Напоминания уходят без ручных сообщений",
        modalText: "Repeto напоминает об уроках, переносах и оплатах по вашим правилам. Это снижает забытые занятия и убирает вечернюю рассылку сообщений вручную.",
        details: [
            "Напоминания перед уроком",
            "Сообщения об оплатах",
            "Каналы: push, email и мессенджеры",
        ],
        layout: "compact",
    },
    {
        id: "public-page",
        tag: "Витрина",
        title: "Публичная страница репетитора",
        shortText: "Личная ссылка с предметами, ценами, контактами и записью на занятие.",
        modalTitle: "Публичная страница для новых учеников",
        modalText: "У репетитора есть аккуратная страница, которую можно отправить из профиля, Авито, VK или мессенджера. На ней видны предметы, стоимость, контакты, правила занятий и кнопка записи.",
        details: [
            "Персональная ссылка на профиль",
            "Предметы, цены и контакты",
            "Запись на занятие без лишней переписки",
        ],
        layout: "compact",
    },
    {
        id: "homework",
        tag: "Журнал",
        title: "Домашка и заметки",
        shortText: "Что прошли, что задали и какие файлы нужны - рядом с уроком.",
        modalTitle: "Домашка и заметки не теряются после занятия",
        modalText: "После урока можно зафиксировать тему, ошибки, задание и материалы. Ученик и родитель видят актуальную информацию в одном месте, а не ищут ее в переписке.",
        details: [
            "Заметки к занятию",
            "Домашние задания и статус",
            "Файлы и материалы рядом с уроком",
        ],
        layout: "compact",
    },
];

const featureBentoModalShowcases: Record<string, FeatureBentoModalShowcase> = {
    schedule: {
        eyebrow: "",
        title: "Регулярные уроки, переносы и свободные окна в одном расписании",
        text: "Расписание в Repeto устроено как рабочий центр репетитора: повторяющиеся занятия создают базовый ритм, разовые изменения не ломают серию, а статусы сразу объясняют, что произошло с каждым уроком.",
        primaryAction: "Посмотреть расписание",
        secondaryAction: "Как устроены переносы",
        benefits: [
            "Создавайте повторяющиеся занятия на нужные дни и время",
            "Фиксируйте переносы, отмены, неявки и проведенные уроки",
            "Смотрите свободные окна без ручной сверки календарей",
        ],
        metrics: [],
        discovery: [
            { icon: "01", title: "Серия занятий", text: "Постоянный урок живет как серия, но отдельный день можно перенести без пересоздания всего расписания." },
            { icon: "02", title: "Контекст урока", text: "В карточке видны ученик, предмет, формат, ставка, статус оплаты и ближайшие действия." },
            { icon: "03", title: "Синхронизация", text: "Google и Яндекс.Календарь получают актуальные события без второго ручного календаря." },
        ],
    },
    payments: {
        eyebrow: "",
        title: "Доход, долги и пакеты в одном понятном финансовом потоке",
        text: "Финансовый контур Repeto связан с реальными занятиями: уроки создают начисления, оплаты закрывают долг, а остаток пакета обновляется без ручного пересчета.",
        primaryAction: "Открыть финансы",
        secondaryAction: "Разобрать пакеты",
        benefits: [
            "Баланс по каждому ученику считается на основе проведенных уроков и платежей",
            "Пакеты показывают остаток занятий и ближайшие списания в одном экране",
            "Перед сообщением семье сразу видно долг, оплату и причину начисления",
        ],
        metrics: [],
        discovery: [
            { icon: "₽", title: "Баланс ученика", text: "Карточка ученика показывает текущий долг, поступившие оплаты и расшифровку начислений." },
            { icon: "%", title: "Пакеты и остаток", text: "Пакетные уроки списываются автоматически, а остаток всегда синхронизирован с расписанием." },
            { icon: "↗", title: "Чистый обзор", text: "Доход за период и проблемные долги собираются в одном месте без Excel и заметок." },
        ],
    },
    students: {
        eyebrow: "",
        title: "Карточка ученика собирает учебный, финансовый и семейный контекст перед каждым уроком",
        text: "Вместо разрозненных заметок в мессенджерах у репетитора есть единая запись: контакты, родители, цель, предмет, ставка, история занятий, оплат, домашки и материалов.",
        primaryAction: "Посмотреть карточку",
        secondaryAction: "Что видит родитель",
        benefits: [
            "Данные ученика и родителя лежат рядом с историей занятий",
            "Ставка, предмет, формат и правила отмен доступны до урока",
            "Заметки и домашка не теряются между переписками",
        ],
        metrics: [],
        discovery: [
            { icon: "ID", title: "Профиль", text: "Имя, контакты, родитель, предмет, класс и персональные условия хранятся в одном месте." },
            { icon: "Δ", title: "История", text: "Лента показывает занятия, оплаты, заметки и домашку без поиска по чатам." },
            { icon: "↔", title: "Связанный аккаунт", text: "Когда ученик или родитель подключается, данные синхронизируются с их порталом." },
        ],
    },
    reminders: {
        eyebrow: "Напоминания",
        title: "Автоматические сообщения закрывают рутину вокруг уроков, оплат и домашних заданий",
        text: "Репетитор задает правила один раз: кому писать, когда отправлять, какой канал использовать и какой текст подставлять. Repeto отправляет напоминания в нужный момент и сохраняет связь с конкретным учеником.",
        primaryAction: "Настроить правило",
        secondaryAction: "Посмотреть шаблоны",
        benefits: [
            "Напоминания об уроке уходят заранее, а не вечером вручную",
            "Долги и оплаты можно отправлять родителю из контекста ученика",
            "Шаблоны сохраняют тон общения и снижают ручной труд",
        ],
        metrics: [
            { value: "15 мин", label: "до урока", caption: "типовое правило" },
            { value: "3", label: "канала", caption: "push, email, мессенджеры" },
            { value: "1", label: "клик", caption: "из карточки ученика" },
        ],
        discovery: [
            { icon: "⏱", title: "Сценарии", text: "Урок, оплата, домашка и перенос используют разные тексты и условия отправки." },
            { icon: "@", title: "Получатели", text: "Сообщение можно адресовать ученику, родителю или обоим участникам." },
            { icon: "✓", title: "Контроль", text: "Перед отправкой видно, какой долг, урок или задание попадет в сообщение." },
        ],
    },
    "public-page": {
        eyebrow: "Публичная страница",
        title: "Профиль репетитора превращает входящий интерес в понятную запись на занятие",
        text: "Публичная страница показывает специализацию, образование, опыт, предметы, цены, пакеты и отзывы. Новый ученик сразу видит доверие, условия и свободные окна для записи.",
        primaryAction: "Открыть витрину",
        secondaryAction: "Как работает запись",
        benefits: [
            "Личная ссылка подходит для профиля, объявлений и мессенджеров",
            "Цены, предметы, пакеты и правила отмен видны до переписки",
            "Запись ведет к выбранному окну, а не к хаотичному диалогу",
        ],
        metrics: [
            { value: "4.9", label: "рейтинг", caption: "показывает доверие" },
            { value: "3", label: "шага", caption: "до заявки" },
            { value: "1", label: "ссылка", caption: "для всех каналов" },
        ],
        discovery: [
            { icon: "★", title: "Доверие", text: "Образование, опыт, отзывы и документы собраны в структуре, которую легко просмотреть." },
            { icon: "₽", title: "Условия", text: "Предметы, цены, пакеты и политика отмен снижают лишние вопросы перед записью." },
            { icon: "→", title: "Заявка", text: "Виджет бронирования переводит интерес в выбранное время и понятный следующий шаг." },
        ],
    },
    homework: {
        eyebrow: "Журнал и домашка",
        title: "Материалы, заметки и задания остаются рядом с конкретным занятием",
        text: "После урока можно зафиксировать тему, ошибки, файлы, задание и статус выполнения. Ученик и родитель видят актуальную информацию без поиска по переписке.",
        primaryAction: "Открыть журнал",
        secondaryAction: "Как устроены файлы",
        benefits: [
            "Заметки к уроку связаны с датой, учеником и предметом",
            "Домашка получает дедлайн, статус и вложения",
            "Материалы можно хранить в папках и подключенных дисках",
        ],
        metrics: [
            { value: "12", label: "заданий", caption: "в работе" },
            { value: "5", label: "файлов", caption: "открыты ученику" },
            { value: "2", label: "дедлайна", caption: "на этой неделе" },
        ],
        discovery: [
            { icon: "HW", title: "Домашка", text: "Каждое задание видно со статусом, дедлайном и связанными материалами." },
            { icon: "DOC", title: "Файлы", text: "Документы и презентации не тонут в чатах и остаются у нужного ученика." },
            { icon: "LOG", title: "Журнал", text: "Тема урока, ошибки и план следующего занятия сохраняются в истории." },
        ],
    },
};

const studentBentoNavItems = ["Профиль", "Занятия", "Оплаты", "Заметки", "Домашка", "История"];

const getFeatureBentoModalToneClass = (cardId: string) => {
    switch (cardId) {
        case "schedule":
            return styles.featureBentoModalToneSchedule;
        case "payments":
            return styles.featureBentoModalTonePayments;
        case "students":
            return styles.featureBentoModalToneStudents;
        case "reminders":
            return styles.featureBentoModalToneReminders;
        case "public-page":
            return styles.featureBentoModalTonePublic;
        case "homework":
            return styles.featureBentoModalToneHomework;
        default:
            return "";
    }
};

function FeatureBentoModalContent({ cardId, showcase }: { cardId: string; showcase: FeatureBentoModalShowcase }) {
    const useUnifiedLandingCta = cardId === "schedule" || cardId === "payments" || cardId === "students";

    return (
        <div className={`${styles.featureBentoModalShell} ${getFeatureBentoModalToneClass(cardId)}`}>
            <section className={`${styles.featureBentoModalSection} ${styles.featureBentoModalIntro}`}>
                <div className={styles.featureBentoModalIntroCopy}>
                    {showcase.eyebrow ? <span className={styles.featureBentoModalTag}>{showcase.eyebrow}</span> : null}
                    <h3 className={styles.featureBentoModalTitle}>{showcase.title}</h3>
                    <p className={styles.featureBentoModalText}>{showcase.text}</p>

                    <div className={styles.featureBentoModalActions}>
                        {useUnifiedLandingCta ? (
                            <>
                                <Link href="/auth?view=signup" className={styles.featureBentoModalFooterPrimaryAction}>
                                    Начать пользоваться
                                    <Icon data={ChevronRight as IconData} size={18} />
                                </Link>
                                <a href="#pricing" className={styles.featureBentoModalFooterSecondaryAction}>
                                    Смотреть тарифы
                                </a>
                            </>
                        ) : (
                            <>
                                <Link href="/auth?view=signup" className={styles.featureBentoModalPrimaryAction}>
                                    {showcase.primaryAction}
                                    <Icon data={ChevronRight as IconData} size={16} />
                                </Link>
                                <a href="#pricing" className={styles.featureBentoModalSecondaryAction}>
                                    {showcase.secondaryAction}
                                </a>
                            </>
                        )}
                    </div>
                </div>

                <ul className={styles.featureBentoModalBenefitList}>
                    {showcase.benefits.map((benefit) => (
                        <li key={benefit}>{benefit}</li>
                    ))}
                </ul>
            </section>

            <section className={`${styles.featureBentoModalSection} ${styles.featureBentoModalVisualPanel}`}>
                <FeatureBentoModalVisual cardId={cardId} />
            </section>

            {showcase.metrics.length > 0 ? (
                <section className={`${styles.featureBentoModalSection} ${styles.featureBentoModalMetrics}`}>
                    {showcase.metrics.map((metric) => (
                        <article key={`${metric.value}-${metric.label}`} className={styles.featureBentoModalMetric}>
                            <strong>{metric.value}</strong>
                            <span>{metric.label}</span>
                            <p>{metric.caption}</p>
                        </article>
                    ))}
                </section>
            ) : null}

            <section className={`${styles.featureBentoModalSection} ${styles.featureBentoModalDiscovery}`}>
                <div className={styles.featureBentoModalDiscoveryGrid}>
                    {showcase.discovery.map((item) => (
                        <article key={item.title}>
                            <AnimatedSidebarIcon
                                src={discoveryIconSources[item.title] || "/icons/sidebar-animated/info-circle.json"}
                                play
                                fallbackIcon={FolderOpen as IconData}
                                size={30}
                                className={styles.featureBentoModalDiscoveryIcon}
                            />
                            <h5>{item.title}</h5>
                            <p>{item.text}</p>
                        </article>
                    ))}
                </div>
            </section>

            <section className={`${styles.featureBentoModalSection} ${styles.featureBentoModalFooterCta}`}>
                <h4>Начните вести занятия в Repeto</h4>
                <div className={styles.featureBentoModalFooterActions}>
                    <Link href="/auth?view=signup" className={styles.featureBentoModalFooterPrimaryAction}>
                        Начать пользоваться
                        <Icon data={ChevronRight as IconData} size={18} />
                    </Link>
                    <a href="#pricing" className={styles.featureBentoModalFooterSecondaryAction}>
                        Смотреть тарифы
                    </a>
                </div>
            </section>
        </div>
    );
}

function FeatureBentoModalVisual({ cardId }: { cardId: string }) {
    const workHourLabels = ["09", "11", "15", "17"];
    const workHourRows = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];
    const workHourSequentialCellKeys = ["Ср-09", "Ср-11", "Ср-15", "Ср-17", "Чт-09", "Чт-11", "Чт-15", "Чт-17"];
    const workHourSequentialCellIndexByKey = new Map(workHourSequentialCellKeys.map((key, index) => [key, index]));
    const workHourSequentialCycleLength = workHourSequentialCellKeys.length * 2;
    const [workHourSequentialStep, setWorkHourSequentialStep] = useState(0);

    useEffect(() => {
        if (cardId !== "schedule") {
            return;
        }

        setWorkHourSequentialStep(0);

        const intervalId = window.setInterval(() => {
            setWorkHourSequentialStep((prevStep) => (prevStep + 1) % workHourSequentialCycleLength);
        }, 800);

        return () => {
            window.clearInterval(intervalId);
        };
    }, [cardId, workHourSequentialCycleLength]);

    const workHourLitCount =
        workHourSequentialStep < workHourSequentialCellKeys.length
            ? workHourSequentialStep + 1
            : Math.max(0, workHourSequentialCycleLength - 1 - workHourSequentialStep);

    if (cardId === "schedule") {
        const lessonFields = [
            { label: "Предмет", value: "Математика" },
            { label: "Дата", value: "22 мая" },
            { label: "Время", value: "16:30" },
            { label: "Длительность", value: "60 минут" },
            { label: "Формат", value: "Онлайн" },
            { label: "Стоимость", value: "2 400 ₽" },
        ];

        return (
            <div className={`${styles.featureBentoModalVisualStage} ${styles.featureBentoModalVisualSchedule}`}>
                <article className={styles.featureBentoModalVisualSplitColumn}>
                    <div className={styles.featureBentoModalVisualSplitWidget}>
                    <div className={styles.featureBentoModalScheduleCard}>
                        <header className={styles.featureBentoModalScheduleCardHeader}>
                            <div>
                                <span className={styles.featureBentoModalScheduleIcon}>⏱</span>
                                <div>
                                    <strong>Рабочие часы</strong>
                                    <em>23 ч/неделю</em>
                                </div>
                            </div>
                            <span className={styles.featureBentoModalScheduleChevron}>⌄</span>
                        </header>

                        <div className={styles.featureBentoModalWorkHoursBody}>
                            <div className={styles.featureBentoModalWorkHoursGrid}>
                                <span />
                                {workHourLabels.map((hour) => (
                                    <b key={hour}>{hour}</b>
                                ))}
                                {workHourRows.map((day, dayIndex) => {
                                    const isSequentialRow = dayIndex === 2 || dayIndex === 3;

                                    return (
                                        <div
                                            key={day}
                                            className={[
                                                styles.featureBentoModalWorkHoursRow,
                                                isSequentialRow ? styles.featureBentoModalWorkHoursRowSequential : "",
                                            ]
                                                .filter(Boolean)
                                                .join(" ")}
                                        >
                                            <strong className={dayIndex === 2 ? styles.featureBentoModalWorkHoursDayActive : undefined}>{day}</strong>
                                            {workHourLabels.map((hour) => {
                                                const cellKey = `${day}-${hour}`;
                                                const sequentialCellIndex = workHourSequentialCellIndexByKey.get(cellKey);
                                                const isSequentialCell = sequentialCellIndex !== undefined;
                                                const isChosenCell = isSequentialCell && sequentialCellIndex < workHourLitCount;

                                                return (
                                                    <i
                                                        key={cellKey}
                                                        className={[
                                                            isSequentialCell ? styles.featureBentoModalWorkHoursCellActive : "",
                                                            isChosenCell ? styles.featureBentoModalWorkHoursCellChosen : "",
                                                        ]
                                                            .filter(Boolean)
                                                            .join(" ")}
                                                    />
                                                );
                                            })}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                    </div>
                    <p className={styles.featureBentoModalVisualSplitCaption}>Неделя показывает занятые часы и свободные окна в одном месте.</p>
                </article>

                <article className={styles.featureBentoModalVisualSplitColumn}>
                    <div className={styles.featureBentoModalVisualSplitWidget}>
                    <div className={styles.featureBentoModalLessonCard}>
                        <header className={styles.featureBentoModalLessonHeader}>
                            <div>
                                <strong>Новое занятие</strong>
                            </div>
                        </header>

                        <div className={styles.featureBentoModalLessonBody}>
                            <section className={styles.featureBentoModalLessonSection}>
                                <div className={styles.featureBentoModalLessonStudent}>
                                    <span>ИП</span>
                                    <div>
                                        <b>Иванов Петр</b>
                                        <em>Связанный аккаунт</em>
                                    </div>
                                    <i />
                                    <div className={styles.featureBentoModalLessonStudentMenu} aria-hidden="true">
                                        <span>
                                            <b>Иванов Петр</b>
                                            <em>Математика</em>
                                        </span>
                                        <span>
                                            <b>Козлова Мария</b>
                                            <em>Английский</em>
                                        </span>
                                        <span>
                                            <b>Орлова Яна</b>
                                            <em>Физика</em>
                                        </span>
                                </div>
                                </div>

                                <div className={styles.featureBentoModalLessonFields}>
                                    {lessonFields.map((field) => {
                                        const isCostField = field.label === "Стоимость";

                                        return (
                                            <span key={field.label} className={isCostField ? styles.featureBentoModalLessonCostField : undefined}>
                                                <b>{field.label}</b>
                                                {isCostField ? (
                                                    <em className={styles.featureBentoModalLessonCostValue}>
                                                        <span>{field.value}</span>
                                                    </em>
                                                ) : (
                                                    <em>{field.value}</em>
                                                )}
                                            </span>
                                        );
                                    })}
                                </div>
                            </section>

                            <section className={styles.featureBentoModalLessonSection}>
                                <h4>Детали</h4>
                                <div className={styles.featureBentoModalLessonRepeat}>
                                    <div>
                                        <strong>Повторять еженедельно</strong>
                                        <span>В тот же день и время</span>
                                    </div>
                                    <i />
                                </div>
                                <div className={styles.featureBentoModalLessonNote}>
                                    <b>Заметки</b>
                                    <span>Подготовить новый материал по производной...</span>
                                </div>
                            </section>
                        </div>
                    </div>
                    </div>
                    <p className={styles.featureBentoModalVisualSplitCaption}>Карточка урока собирается за минуту и сразу готова к сохранению.</p>
                </article>
            </div>
        );
    }

    if (cardId === "payments") {
        return (
            <div className={`${styles.featureBentoModalVisualStage} ${styles.featureBentoModalVisualPayments}`}>
                <article className={styles.featureBentoModalVisualSplitColumn}>
                    <div className={styles.featureBentoModalVisualSplitWidget}>
                        <div className="repeto-tochka-dash">
                            <Card className="repeto-income-card repeto-tochka-income" view="outlined">
                                <header className="repeto-tochka-income__header">
                                    <span className="repeto-tochka-income__title">Доход с декабря по май</span>
                                    <span className="repeto-card-chevron" aria-hidden="true">
                                        <Icon data={ChevronRight as IconData} size={18} />
                                    </span>
                                </header>

                                <div className="repeto-tochka-income__amount">
                                    {`${featureBentoIncomeTotal.toLocaleString("ru-RU")} ₽`}
                                </div>

                                <div className="repeto-tochka-income__chart repeto-tochka-income__chart--compact">
                                    <div className="repeto-tochka-income__axis">
                                        <span className="repeto-tochka-income__axis-tick">
                                            {featureBentoIncomeAxisMax.toLocaleString("ru-RU")}
                                        </span>
                                        <span className="repeto-tochka-income__axis-tick">
                                            {Math.round(featureBentoIncomeAxisMax / 2).toLocaleString("ru-RU")}
                                        </span>
                                        <span className="repeto-tochka-income__axis-tick">0</span>
                                    </div>

                                    <div className="repeto-tochka-income__plot">
                                        <span className="repeto-tochka-income__grid repeto-tochka-income__grid--top" />
                                        <span className="repeto-tochka-income__grid repeto-tochka-income__grid--mid" />
                                        <span className="repeto-tochka-income__grid repeto-tochka-income__grid--bottom" />

                                        <div className="repeto-tochka-income__bars">
                                            {featureBentoIncomeMonths.map((month) => {
                                                const height = featureBentoIncomeAxisMax ? (month.total / featureBentoIncomeAxisMax) * 100 : 0;

                                                return (
                                                    <div
                                                        key={month.key}
                                                        className={`repeto-tochka-income__col${month.isCurrent ? " repeto-tochka-income__col--current" : ""}`}
                                                    >
                                                        <div className="repeto-tochka-income__pair">
                                                            <span
                                                                className="repeto-tochka-income__bar"
                                                                style={{ height: `${height}%` }}
                                                            />
                                                        </div>
                                                        <span className="repeto-tochka-income__col-label">{month.label}</span>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                </div>
                            </Card>
                        </div>
                    </div>
                    <p className={styles.featureBentoModalVisualSplitCaption}>Доход по месяцам считается из фактических платежей и сразу виден в динамике.</p>
                </article>

                <article className={styles.featureBentoModalVisualSplitColumn}>
                    <div className={styles.featureBentoModalVisualSplitWidget}>
                        <div className="repeto-tochka-dash">
                            <Card className="repeto-recent-payments-card" view="outlined" style={{ overflow: "hidden" }}>
                                <div className="repeto-card-header">
                                    <Text variant="subheader-2">Последние оплаты</Text>
                                    <span className="repeto-card-chevron" aria-hidden="true">
                                        <Icon data={ChevronRight as IconData} size={18} />
                                    </span>
                                </div>

                                <div className="repeto-card-body repeto-recent-payments__body">
                                    <div className="repeto-portal-balance-operations__list repeto-recent-payments-ops">
                                        {featureBentoRecentPayments.map((payment) => (
                                        <div
                                            key={payment.id}
                                            className="repeto-portal-balance-operation-row"
                                        >
                                            <span className="repeto-portal-balance-operation-row__icon repeto-portal-balance-operation-row__icon--payment">
                                                <Icon data={CreditCard as IconData} size={18} />
                                            </span>

                                            <div className="repeto-portal-balance-operation-row__copy">
                                                <div className="repeto-portal-balance-operation-row__title">
                                                    <StudentNameWithBadge
                                                        name={payment.studentName}
                                                        hasRepetoAccount={Boolean(payment.studentAccountId)}
                                                        truncate
                                                    />
                                                </div>

                                                <div className="repeto-portal-balance-operation-row__subtitle">
                                                    {payment.date}
                                                    {" · "}
                                                    {payment.method}
                                                </div>
                                            </div>

                                            <div className="repeto-portal-balance-operation-row__amount repeto-portal-balance-operation-row__amount--credit">
                                                +{payment.amount.toLocaleString("ru-RU")} ₽
                                            </div>
                                        </div>
                                    ))}
                                    </div>
                                </div>
                            </Card>
                        </div>
                    </div>
                    <p className={styles.featureBentoModalVisualSplitCaption}>Последние оплаты показывают, кто и когда оплатил, без перехода в полный раздел финансов.</p>
                </article>

                <article className={styles.featureBentoModalVisualSplitColumn}>
                    <div className={styles.featureBentoModalVisualSplitWidget}>
                        <div className={styles.showcaseIncomeWidget}>
                            <IncomeByStudents paymentsOverride={showcaseIncomePayments} disableInteractions ribbonAlpha={0.38} />
                        </div>
                    </div>
                    <p className={styles.featureBentoModalVisualSplitCaption}>Сегменты показывают вклад каждого ученика по месяцам и общий итог.</p>
                </article>
            </div>
        );
    }

    if (cardId === "students") {
        return (
            <div className={`${styles.featureBentoModalVisualStage} ${styles.featureBentoModalVisualStudents}`}>
                <article className={`${styles.featureBentoModalVisualSplitColumn} ${styles.featureBentoModalStudentsWidgetHomework}`}>
                    <HomeworkTab
                        studentId="showcase-student"
                        homeworks={showcaseStudentHomework}
                        lessons={showcaseStudentLessonsHistory}
                    />
                    <p className={styles.featureBentoModalVisualSplitCaption}>Домашка показывает дедлайн, статус и материалы прямо в карточке ученика.</p>
                </article>

                <article className={styles.featureBentoModalVisualSplitColumn}>
                    <PaymentHistory
                        payments={showcaseStudentPaymentsHistory}
                        lessons={showcaseStudentLessonsHistory}
                    />
                    <p className={styles.featureBentoModalVisualSplitCaption}>Оплаты объединяют операции и начисления, чтобы баланс читался без отдельного раздела.</p>
                </article>

                <article className={styles.featureBentoModalVisualSplitColumn}>
                    <LessonHistory lessons={showcaseStudentLessonsHistory} />
                    <p className={styles.featureBentoModalVisualSplitCaption}>Занятия показывают дату, время, предмет и статус в том же формате, что в карточке ученика.</p>
                </article>
            </div>
        );
    }

    if (cardId === "reminders") {
        const flow = ["Урок", "Правило", "Канал", "Сообщение"];

        return (
            <div className={`${styles.featureBentoModalVisualStage} ${styles.featureBentoModalVisualReminders}`}>
                <div className={styles.featureBentoModalAutomationFlow}>
                    {flow.map((item, index) => (
                        <span key={item}>
                            <b>{String(index + 1).padStart(2, "0")}</b>
                            {item}
                        </span>
                    ))}
                </div>
                <div className={styles.featureBentoModalMessageCard}>
                    <header>
                        <span>Об оплате</span>
                        <strong>родителю</strong>
                    </header>
                    <p>Здравствуйте! Напоминаю про оплату двух занятий: 4 800 ₽. Ссылка на кабинет ниже.</p>
                    <div>
                        <i>Push</i>
                        <i>Email</i>
                        <i>Telegram</i>
                    </div>
                </div>
                <div className={styles.featureBentoModalReminderRule}>
                    <span>Отправить за 15 минут до урока</span>
                    <b />
                </div>
            </div>
        );
    }

    if (cardId === "public-page") {
        return (
            <div className={`${styles.featureBentoModalVisualStage} ${styles.featureBentoModalVisualPublic}`}>
                <div className={styles.featureBentoModalPublicPage}>
                    <aside>
                        <strong>Профиль</strong>
                        <span>О специалисте</span>
                        <span>Предметы и цены</span>
                        <span>Отзывы</span>
                    </aside>
                    <main>
                        <div className={styles.featureBentoModalPublicHero}>
                            <span>АБ</span>
                            <div>
                                <b>Анна Белова</b>
                                <em>Математика · ЕГЭ · 4.9</em>
                            </div>
                        </div>
                        <div className={styles.featureBentoModalPublicRows}>
                            <span>Математика · 60 мин <b>2 500 ₽</b></span>
                            <span>Подготовка к ЕГЭ · 90 мин <b>3 600 ₽</b></span>
                        </div>
                    </main>
                </div>
                <div className={styles.featureBentoModalBookingMini}>
                    <strong>Выберите время</strong>
                    <div>
                        <span>14:00</span>
                        <span>16:30</span>
                        <span>18:00</span>
                    </div>
                    <button type="button">Записаться</button>
                </div>
            </div>
        );
    }

    return (
        <div className={`${styles.featureBentoModalVisualStage} ${styles.featureBentoModalVisualHomework}`}>
            <div className={styles.featureBentoModalHomeworkNote}>
                <span>Урок 22 мая</span>
                <strong>Производная и графики</strong>
                <p>Разобрать ошибки из пробника, закрепить задачи 7 и 12.</p>
            </div>
            <div className={styles.featureBentoModalHomeworkTasks}>
                <span><b />12 задач · до пятницы</span>
                <span><b />варианты-егэ.pdf</span>
                <span><b />ожидает проверки</span>
            </div>
            <div className={styles.featureBentoModalFilesMini}>
                <Icon data={FolderOpen as IconData} size={18} />
                <span>Материалы ученика</span>
            </div>
        </div>
    );
}

function StudentCardBentoPreview() {
    return (
        <div className={styles.featureBentoStudentPreview} aria-hidden="true">
            <aside className={styles.featureBentoStudentSidebar}>
                <div className={styles.featureBentoStudentCurrent}>
                    <span>Иванов П. С.</span>
                    <b>«</b>
                </div>

                <div className={styles.featureBentoStudentCreate}>Создать</div>

                <nav className={styles.featureBentoStudentNav}>
                    <span className={styles.featureBentoStudentNavTrack} />
                    {studentBentoNavItems.map((item) => (
                        <span key={item} className={styles.featureBentoStudentNavItem}>
                            <i />
                            {item}
                        </span>
                    ))}
                </nav>
            </aside>

            <section className={styles.featureBentoStudentMain}>
                <div className={styles.featureBentoStudentSearch}>Поиск учеников...</div>

                <div className={styles.featureBentoStudentProfileHead}>
                    <div className={styles.featureBentoStudentAvatar}>ПИ</div>
                    <div>
                        <strong>Иванов Петр Сергеевич</strong>
                        <span>Математика · 11 кл. · 17 лет</span>
                        <div className={styles.featureBentoStudentStatusRow}>
                            <em>Активен · -7 600 ₽</em>
                            <span className={styles.featureBentoStudentReminder}>Напомнить</span>
                        </div>
                    </div>
                </div>

                <div className={styles.featureBentoStudentPanels}>
                    <section className={`${styles.featureBentoStudentPanel} ${styles.featureBentoStudentPanelProfile}`}>
                        <h4>Основное</h4>
                        <div className={styles.featureBentoStudentFields}>
                            <span>
                                <b>ФИО</b>
                                Иванов Петр Сергеевич
                            </span>
                            <span>
                                <b>Предмет</b>
                                Математика
                            </span>
                            <span>
                                <b>Класс</b>
                                11
                            </span>
                        </div>
                    </section>

                    <section className={`${styles.featureBentoStudentPanel} ${styles.featureBentoStudentPanelLessons}`}>
                        <h4>Занятия</h4>
                        <div className={styles.featureBentoStudentRows}>
                            <span>
                                <b>Сегодня, 17:00-18:00</b>
                                Математика · Производная и графики
                            </span>
                            <span>
                                <b>Ср, 19:30</b>
                                Пробник ЕГЭ · онлайн
                            </span>
                            <span>
                                <b>Пт, 18:00</b>
                                Разбор ошибок · запланировано
                            </span>
                        </div>
                    </section>

                    <section className={`${styles.featureBentoStudentPanel} ${styles.featureBentoStudentPanelPayments}`}>
                        <h4>Оплаты</h4>
                        <div className={styles.featureBentoStudentRows}>
                            <span>
                                <b>Баланс</b>
                                <em className={styles.featureBentoStudentDebt}>-7 600 ₽</em>
                            </span>
                            <span>
                                <b>Пакет</b>
                                Осталось 3 из 8 занятий
                            </span>
                            <span>
                                <b>Последний платеж</b>
                                12 мая · 9 600 ₽
                            </span>
                        </div>
                    </section>

                    <section className={`${styles.featureBentoStudentPanel} ${styles.featureBentoStudentPanelNotes}`}>
                        <h4>Заметки</h4>
                        <div className={styles.featureBentoStudentRows}>
                            <span>
                                <b>Цель</b>
                                80+ баллов по профильной математике
                            </span>
                            <span>
                                <b>Сложности</b>
                                Тригонометрия и параметры
                            </span>
                            <span>
                                <b>Контакт родителя</b>
                                Елена · Telegram
                            </span>
                        </div>
                    </section>

                    <section className={`${styles.featureBentoStudentPanel} ${styles.featureBentoStudentPanelHomework}`}>
                        <h4>Домашка</h4>
                        <div className={styles.featureBentoStudentHomework}>
                            <span>
                                <b>12 задач</b>
                                к следующему занятию
                            </span>
                            <span>
                                <b>Файл</b>
                                варианты-егэ.pdf
                            </span>
                            <span>
                                <b>Статус</b>
                                ожидает проверки
                            </span>
                        </div>
                    </section>

                    <section className={`${styles.featureBentoStudentPanel} ${styles.featureBentoStudentPanelHistory}`}>
                        <h4>История</h4>
                        <div className={styles.featureBentoStudentRows}>
                            <span>
                                <b>14 мая</b>
                                Проведено занятие · +2 400 ₽
                            </span>
                            <span>
                                <b>12 мая</b>
                                Родитель оплатил пакет
                            </span>
                            <span>
                                <b>10 мая</b>
                                Домашка отправлена на проверку
                            </span>
                        </div>
                    </section>
                </div>
            </section>
        </div>
    );
}

function ReminderBentoPreview() {
    return (
        <div className={styles.featureBentoReminderPreview} aria-hidden="true">
            <div className={styles.featureBentoReminderShell}>
                <header className={styles.featureBentoReminderHeader}>
                    <span className={styles.featureBentoReminderBack}>‹</span>
                    <div>
                        <strong>Напомнить</strong>
                        <span>
                            Иванов Пётр Сергеевич
                            <i />
                        </span>
                    </div>
                </header>

                <div className={styles.featureBentoReminderBody}>
                    <section className={styles.featureBentoReminderSection}>
                        <h4>Тип напоминания</h4>
                        <div className={styles.featureBentoReminderSelect}>
                            <span className={styles.featureBentoReminderSelectValue}>Об оплате</span>
                            <i />
                            <div className={styles.featureBentoReminderSelectMenu}>
                                <span>О домашке</span>
                                <span>О занятии</span>
                            </div>
                        </div>
                    </section>

                    <section className={styles.featureBentoReminderSection}>
                        <h4>Долг и оплата</h4>
                        <div className={styles.featureBentoReminderEmpty}>Нет проведённых занятий без оплаты.</div>
                    </section>

                    <div className={styles.featureBentoReminderToggleRow}>
                        <span>Напомнить родителям</span>
                        <i />
                    </div>

                    <section className={styles.featureBentoReminderSection}>
                        <h4>Сообщение</h4>
                        <div className={styles.featureBentoReminderTextarea}>
                            <b>Текст сообщения</b>
                            <span>Добавить сообщение к напоминанию...</span>
                        </div>
                    </section>
                </div>

                <div className={styles.featureBentoReminderSubmit}>Отправить</div>
            </div>
        </div>
    );
}

/*
const tutorPageBentoSubjects = [
    { name: "Математика", meta: "60 мин", price: "2 500 ₽" },
    { name: "Подготовка к ЕГЭ", meta: "90 мин", price: "3 600 ₽" },
];

const tutorPageBentoPackages = [
    { title: "8 занятий", meta: "Математика", price: "18 400 ₽", badge: "−8%" },
    { title: "12 занятий", meta: "ЕГЭ", price: "38 900 ₽", badge: "−10%" },
];

const tutorPageBentoReviews = [
    { name: "Мария", text: "Стало понятнее, ушел страх задач второй части." },
    { name: "Илья", text: "Удобная запись и понятные материалы после урока." },
];

function TutorPageBentoPreview() {
    return (
        <div className={styles.tutorPageBentoScroll} aria-label="Мини-страница репетитора" tabIndex={0}>
            <PublicTutorWidget
                name="Анна Белова"
                subjectsText="Математика · ЕГЭ · 8-11 класс"
                rating={4.9}
                reviewsCount={37}
                className={styles.tutorPageBentoWidget}
            />

            <section className={styles.tutorPageBentoSection}>
                <div className={styles.tutorPageBentoSectionHead}>
                    <span>О репетиторе</span>
                    <strong>7 лет</strong>
                </div>
                <p>Готовит к экзаменам, ведет школьников 8-11 классов и дает понятный план после первого занятия.</p>
            </section>

            <section className={styles.tutorPageBentoSection}>
                <div className={styles.tutorPageBentoSectionHead}>
                    <span>Образование</span>
                    <strong>Проверено</strong>
                </div>
                <div className={styles.tutorPageBentoRow}>
                    <span>МГУ, мехмат</span>
                    <em>2015-2021</em>
                </div>
            </section>

            <section className={styles.tutorPageBentoSection}>
                <div className={styles.tutorPageBentoSectionHead}>
                    <span>Опыт</span>
                    <strong>1560 уроков</strong>
                </div>
                <div className={styles.tutorPageBentoTimeline}>
                    <span>ЕГЭ и ОГЭ по математике</span>
                    <span>Индивидуальные планы для учеников</span>
                </div>
            </section>

            <section className={styles.tutorPageBentoSection}>
                <div className={styles.tutorPageBentoSectionHead}>
                    <span>Документы</span>
                    <strong>2 файла</strong>
                </div>
                <div className={styles.tutorPageBentoFiles}>
                    <span>Диплом</span>
                    <span>Сертификат ЕГЭ</span>
                </div>
            </section>

            <section className={styles.tutorPageBentoSection}>
                <div className={styles.tutorPageBentoSectionHead}>
                    <span>Предметы и цены</span>
                </div>
                <div className={styles.tutorPageBentoRows}>
                    {tutorPageBentoSubjects.map((subject) => (
                        <div key={subject.name} className={styles.tutorPageBentoPriceRow}>
                            <div>
                                <span>{subject.name}</span>
                                <em>{subject.meta}</em>
                            </div>
                            <strong>{subject.price}</strong>
                        </div>
                    ))}
                </div>
            </section>

            <section className={styles.tutorPageBentoSection}>
                <div className={styles.tutorPageBentoSectionHead}>
                    <span>Пакеты занятий</span>
                </div>
                <div className={styles.tutorPageBentoPackages}>
                    {tutorPageBentoPackages.map((pkg) => (
                        <article key={pkg.title}>
                            <span>{pkg.title}</span>
                            <em>{pkg.meta}</em>
                            <strong>{pkg.price}</strong>
                            <b>{pkg.badge}</b>
                        </article>
                    ))}
                </div>
            </section>

            <section className={styles.tutorPageBentoSection}>
                <div className={styles.tutorPageBentoSectionHead}>
                    <span>Отзывы</span>
                    <strong>4,9</strong>
                </div>
                <div className={styles.tutorPageBentoReviews}>
                    {tutorPageBentoReviews.map((review) => (
                        <article key={review.name}>
                            <div>
                                <span>{review.name}</span>
                                <em>★★★★★</em>
                            </div>
                            <p>{review.text}</p>
                        </article>
                    ))}
                </div>
            </section>

            <section className={styles.tutorPageBentoSection}>
                <div className={styles.tutorPageBentoSectionHead}>
                    <span>Политика отмен</span>
                </div>
                <p>Бесплатная отмена за 24 часа. Поздняя отмена - 50% стоимости.</p>
            </section>

            <button type="button" className={styles.tutorPageBentoCta} tabIndex={-1}>
                Записаться на занятие
                <Icon data={ChevronRight as IconData} size={16} />
            </button>
        </div>
    );
}
*/

function TutorPageScreenshotBentoPreview() {
    return (
        <div className={styles.tutorPageScreenshotFrame} aria-label="Скриншот страницы репетитора">
            <Image
                src="/images/landing/tutor-public-page-long.png?v=2026051601"
                width={1754}
                height={3548}
                alt=""
                className={styles.tutorPageScreenshotImage}
                unoptimized
            />
        </div>
    );
}

function PublicTutorPageBentoPreview() {
    return (
        <div className={styles.featureBentoPublicPreview} aria-hidden="true">
            <div className={styles.featureBentoPublicShell}>
                <header className={styles.featureBentoPublicTopbar}>
                    <strong>Repeto</strong>
                    <div>
                        <span className={styles.featureBentoPublicUserAvatar}>ИП</span>
                        <span>Иванов Пётр Сергеевич</span>
                        <i />
                        <i />
                    </div>
                </header>

                <div className={styles.featureBentoPublicLayout}>
                    <aside className={styles.featureBentoPublicSidebar}>
                        <h4>Профиль</h4>
                        <nav>
                            {[
                                "О специалисте",
                                "Образование",
                                "Опыт",
                                "Документы",
                                "Предметы и цены",
                                "Пакеты",
                                "Отзывы",
                            ].map((item, index) => (
                                <span key={item} className={index === 0 ? styles.featureBentoPublicNavActive : undefined}>
                                    <i />
                                    {item}
                                </span>
                            ))}
                        </nav>
                        <b>Записаться</b>
                    </aside>

                    <main className={styles.featureBentoPublicPageWindow}>
                        <div className={styles.featureBentoPublicPageTrack}>
                            <section className={styles.featureBentoPublicHeroWidget}>
                                <div className={styles.featureBentoPublicTutorAvatar}>АБ</div>
                                <div className={styles.featureBentoPublicTutorMain}>
                                    <h4>Анна Белова</h4>
                                    <p>Математика, Английский, Физика</p>
                                    <div className={styles.featureBentoPublicRatingRow}>
                                        <strong>☆ 4.9</strong>
                                        <span>6 отзывов</span>
                                    </div>
                                    <div className={styles.featureBentoPublicContactRow}>
                                        <i />
                                        <i />
                                        <i />
                                        <i />
                                        <i />
                                    </div>
                                </div>
                                <span className={styles.featureBentoPublicPolicy}>Политика отмен</span>
                            </section>

                            <section className={styles.featureBentoPublicSection}>
                                <h4>О репетиторе</h4>
                                <p>
                                    Помогаю школьникам и студентам системно закрывать пробелы и уверенно выходить на высокий результат.
                                    Работаю по индивидуальному учебному плану и веду регулярную обратную связь для родителей.
                                </p>
                            </section>

                            <section className={styles.featureBentoPublicSection}>
                                <h4>Образование</h4>
                                <div className={styles.featureBentoPublicRows}>
                                    <span>
                                        <b>МГУ им. М.В. Ломоносова</b>
                                        <em>Математика, специалист · 2012-2017</em>
                                    </span>
                                    <span>
                                        <b>НИУ ВШЭ</b>
                                        <em>Педагогический дизайн · 2019-2020</em>
                                    </span>
                                </div>
                            </section>

                            <section className={styles.featureBentoPublicSection}>
                                <h4>Опыт</h4>
                                <div className={styles.featureBentoPublicTimeline}>
                                    <span>9 лет индивидуальной подготовки к ЕГЭ и ОГЭ</span>
                                    <span>1560+ проведённых занятий в онлайн и офлайн формате</span>
                                    <span>Регулярные отчёты для родителей после каждого блока</span>
                                </div>
                            </section>

                            <section className={styles.featureBentoPublicSection}>
                                <h4>Предметы и цены</h4>
                                <div className={styles.featureBentoPublicPriceRows}>
                                    <span>
                                        <b>Математика</b>
                                        <em>60 минут</em>
                                        <strong>2 500 ₽</strong>
                                    </span>
                                    <span>
                                        <b>Подготовка к ЕГЭ</b>
                                        <em>90 минут</em>
                                        <strong>3 600 ₽</strong>
                                    </span>
                                </div>
                            </section>

                            <section className={styles.featureBentoPublicSection}>
                                <h4>Пакеты занятий</h4>
                                <div className={styles.featureBentoPublicPackages}>
                                    <span>
                                        <b>8 занятий</b>
                                        <em>Математика</em>
                                        <strong>18 400 ₽</strong>
                                    </span>
                                    <span>
                                        <b>12 занятий</b>
                                        <em>ЕГЭ</em>
                                        <strong>38 900 ₽</strong>
                                    </span>
                                </div>
                            </section>

                            <section className={styles.featureBentoPublicSection}>
                                <h4>Отзывы</h4>
                                <div className={styles.featureBentoPublicReviews}>
                                    <span>
                                        <b>Мария</b>
                                        <em>Стало понятнее, ушёл страх задач второй части.</em>
                                    </span>
                                    <span>
                                        <b>Илья</b>
                                        <em>Удобная запись и понятные материалы после урока.</em>
                                    </span>
                                </div>
                            </section>
                        </div>
                    </main>
                </div>
            </div>

            <div className={styles.featureBentoPublicConnector} aria-hidden="true">
                <span className={styles.featureBentoPublicConnectorDot} />
                <span className={styles.featureBentoPublicConnectorVertical} />
                <span className={styles.featureBentoPublicConnectorHorizontal} />
            </div>

            <div className={styles.featureBentoPublicBookingCard}>
                <header>
                    <span>‹</span>
                    <div>
                        <b>Анна Сергеевна Белова</b>
                        <em>Математика, Английский, Физика</em>
                    </div>
                </header>
                <strong>Май</strong>
                <div className={styles.featureBentoPublicCalendarGrid}>
                    {Array.from({ length: 21 }).map((_, index) => (
                        <span key={index} className={index === 17 ? styles.featureBentoPublicCalendarActive : undefined}>
                            {index + 4}
                        </span>
                    ))}
                </div>
                <div className={styles.featureBentoPublicTimes}>
                    <span>14:00</span>
                    <span>16:30</span>
                    <span>18:00</span>
                </div>
                <button type="button" tabIndex={-1}>Продолжить</button>
            </div>
        </div>
    );
}

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

const showcaseStudentLessonsHistory: Lesson[] = [
    {
        id: "showcase-lesson-1",
        studentId: "showcase-student",
        studentName: "Sofia Gorina",
        studentAccountId: "showcase-account-sofia",
        subject: "Информатика",
        date: "2026-05-14",
        startTime: "16:30",
        endTime: "17:30",
        duration: 60,
        format: "online",
        status: "completed",
        rate: 2400,
    },
    {
        id: "showcase-lesson-2",
        studentId: "showcase-student",
        studentName: "Sofia Gorina",
        studentAccountId: "showcase-account-sofia",
        subject: "Информатика",
        date: "2026-05-16",
        startTime: "15:00",
        endTime: "16:00",
        duration: 60,
        format: "online",
        status: "completed",
        rate: 2400,
    },
    {
        id: "showcase-lesson-3",
        studentId: "showcase-student",
        studentName: "Sofia Gorina",
        studentAccountId: "showcase-account-sofia",
        subject: "Информатика",
        date: "2026-05-19",
        startTime: "17:00",
        endTime: "18:00",
        duration: 60,
        format: "online",
        status: "planned",
        rate: 2400,
    },
];

const showcaseStudentPaymentsHistory: Payment[] = [
    {
        id: "showcase-payment-1",
        studentId: "showcase-student",
        studentName: "Sofia Gorina",
        studentAccountId: "showcase-account-sofia",
        lessonId: "showcase-lesson-1",
        amount: 2400,
        date: "16.05.2026",
        method: "sbp",
        status: "paid",
        comment: "Оплата за проведенный урок",
    },
    {
        id: "showcase-payment-2",
        studentId: "showcase-student",
        studentName: "Sofia Gorina",
        studentAccountId: "showcase-account-sofia",
        amount: 2400,
        date: "14.05.2026",
        method: "transfer",
        status: "paid",
        comment: "Предоплата",
    },
    {
        id: "showcase-payment-3",
        studentId: "showcase-student",
        studentName: "Sofia Gorina",
        studentAccountId: "showcase-account-sofia",
        amount: 1200,
        date: "12.05.2026",
        method: "cash",
        status: "paid",
        comment: "Частичная оплата",
    },
];

const showcaseStudentHomework: StudentHomework[] = [
    {
        id: "showcase-homework-1",
        date: "14.05.2026",
        task: "Разобрать задания 7 и 12 из пробника ЕГЭ, подготовить короткое объяснение решения.",
        dueDate: "20.05.2026",
        status: "not_done",
        lessonId: "showcase-lesson-2",
        linkedFiles: [
            {
                id: "showcase-homework-file-1",
                name: "Вариант-23.pdf",
                url: "#",
                type: "file",
            },
        ],
        studentUploads: [],
    },
    {
        id: "showcase-homework-2",
        date: "11.05.2026",
        task: "Повторить формулы логарифмов и решить 10 заданий из блока B.",
        dueDate: "15.05.2026",
        status: "overdue",
        lessonId: "showcase-lesson-1",
        linkedFiles: [],
        studentUploads: [],
    },
    {
        id: "showcase-homework-3",
        date: "08.05.2026",
        task: "Сделать конспект по теме «Системы счисления» и загрузить решение.",
        dueDate: "12.05.2026",
        status: "done",
        lessonId: "showcase-lesson-1",
        linkedFiles: [],
        studentUploads: [
            {
                id: "showcase-upload-1",
                name: "Решение-12.pdf",
                size: "380 КБ",
                uploadedAt: "12 мая",
                url: "#",
            },
        ],
    },
];

const featureBentoSchedulePreviewDate = new Date(2026, 4, 1);

type FeatureBentoScheduleSeedItem = {
    day: number;
    lessons: Array<{
        subject: string;
        studentName: string;
        status?: Lesson["status"];
    }>;
};
const featureBentoScheduleSeed: FeatureBentoScheduleSeedItem[] = [
    {
        day: 2,
        lessons: [{ subject: "Математика", studentName: "Иванов Михаил", status: "completed" }],
    },
    {
        day: 6,
        lessons: [{ subject: "Математика", studentName: "Иванов Михаил", status: "reschedule_pending" }],
    },
    {
        day: 7,
        lessons: [
            { subject: "Английский", studentName: "Козлова Мария", status: "completed" },
            { subject: "Математика", studentName: "Волков Артем", status: "planned" },
            { subject: "Физика", studentName: "Лебедева Софья", status: "planned" },
            { subject: "Русский язык", studentName: "Морозов Кирилл", status: "planned" },
            { subject: "Русский язык", studentName: "Кузнецова Дарья", status: "reschedule_pending" },
            { subject: "Химия", studentName: "Орлова Яна", status: "completed" },
            { subject: "Биология", studentName: "Тарасов Денис", status: "planned" },
            { subject: "Алгебра", studentName: "Петрова Алиса", status: "planned" },
        ],
    },
    {
        day: 10,
        lessons: [
            { subject: "Физика", studentName: "Сидоров Илья", status: "planned" },
            { subject: "Русский язык", studentName: "Морозов Кирилл", status: "completed" },
            { subject: "Русский язык", studentName: "Кузнецова Дарья", status: "planned" },
            { subject: "История", studentName: "Егоров Влад", status: "planned" },
            { subject: "Математика", studentName: "Волков Артем", status: "reschedule_pending" },
            { subject: "Физика", studentName: "Лебедева Софья", status: "planned" },
            { subject: "Английский", studentName: "Козлова Мария", status: "completed" },
            { subject: "Геометрия", studentName: "Иванов Михаил", status: "planned" },
        ],
    },
    {
        day: 13,
        lessons: [
            { subject: "Английский", studentName: "Козлова Мария", status: "completed" },
            { subject: "Математика", studentName: "Волков Артем", status: "planned" },
            { subject: "Английский", studentName: "Петрова Алиса", status: "planned" },
            { subject: "Физика", studentName: "Сидоров Илья", status: "planned" },
            { subject: "Русский язык", studentName: "Кузнецова Дарья", status: "planned" },
            { subject: "Химия", studentName: "Орлова Яна", status: "reschedule_pending" },
            { subject: "Биология", studentName: "Тарасов Денис", status: "completed" },
            { subject: "Алгебра", studentName: "Иванов Михаил", status: "planned" },
        ],
    },
    {
        day: 14,
        lessons: [{ subject: "Математика", studentName: "Иванов Михаил", status: "completed" }],
    },
    {
        day: 16,
        lessons: [
            { subject: "Физика", studentName: "Сидоров Илья", status: "planned" },
            { subject: "Русский язык", studentName: "Морозов Кирилл", status: "planned" },
            { subject: "Русский язык", studentName: "Кузнецова Дарья", status: "planned" },
            { subject: "Английский", studentName: "Козлова Мария", status: "reschedule_pending" },
            { subject: "Математика", studentName: "Волков Артем", status: "completed" },
            { subject: "Геометрия", studentName: "Иванов Михаил", status: "planned" },
            { subject: "Химия", studentName: "Орлова Яна", status: "planned" },
            { subject: "История", studentName: "Егоров Влад", status: "planned" },
        ],
    },
    {
        day: 18,
        lessons: [{ subject: "Математика", studentName: "Иванов Михаил", status: "planned" }],
    },
    {
        day: 19,
        lessons: [
            { subject: "Английский", studentName: "Козлова Мария", status: "planned" },
            { subject: "Математика", studentName: "Волков Артем", status: "planned" },
            { subject: "Английский", studentName: "Петрова Алиса", status: "completed" },
            { subject: "Физика", studentName: "Лебедева Софья", status: "planned" },
            { subject: "Русский язык", studentName: "Кузнецова Дарья", status: "planned" },
            { subject: "Химия", studentName: "Орлова Яна", status: "reschedule_pending" },
            { subject: "Биология", studentName: "Тарасов Денис", status: "planned" },
            { subject: "Алгебра", studentName: "Иванов Михаил", status: "completed" },
        ],
    },
    {
        day: 21,
        lessons: [{ subject: "Математика", studentName: "Иванов Михаил", status: "planned" }],
    },
    {
        day: 22,
        lessons: [
            { subject: "Физика", studentName: "Сидоров Илья", status: "planned" },
            { subject: "Русский язык", studentName: "Морозов Кирилл", status: "planned" },
            { subject: "Русский язык", studentName: "Кузнецова Дарья", status: "planned" },
            { subject: "Английский", studentName: "Козлова Мария", status: "completed" },
            { subject: "Математика", studentName: "Волков Артем", status: "planned" },
            { subject: "Геометрия", studentName: "Иванов Михаил", status: "reschedule_pending" },
            { subject: "Химия", studentName: "Орлова Яна", status: "planned" },
            { subject: "История", studentName: "Егоров Влад", status: "completed" },
        ],
    },
    {
        day: 25,
        lessons: [
            { subject: "Английский", studentName: "Козлова Мария", status: "planned" },
            { subject: "Математика", studentName: "Волков Артем", status: "completed" },
            { subject: "Физика", studentName: "Сидоров Илья", status: "planned" },
            { subject: "Русский язык", studentName: "Морозов Кирилл", status: "planned" },
            { subject: "Русский язык", studentName: "Кузнецова Дарья", status: "planned" },
        ],
    },
];

const featureBentoScheduleLessons: Lesson[] = featureBentoScheduleSeed.flatMap(({ day, lessons }) =>
    lessons.map((lesson, index) => {
        const startHour = 9 + (index % 8);
        const startTime = `${String(startHour).padStart(2, "0")}:00`;
        const endTime = `${String(startHour + 1).padStart(2, "0")}:00`;

        return {
            id: `feature-bento-schedule-${day}-${index}`,
            studentName: lesson.studentName,
            subject: lesson.subject,
            date: `2026-05-${String(day).padStart(2, "0")}`,
            startTime,
            endTime,
            duration: 60,
            format: "online",
            status: lesson.status ?? "planned",
            rate: 2_000,
        };
    })
);

type FeatureBentoIncomeMonth = {
    key: string;
    label: string;
    total: number;
    isCurrent?: boolean;
};

const featureBentoIncomeMonths: FeatureBentoIncomeMonth[] = [
    { key: "2025-12", label: "Дек", total: 20_123 },
    { key: "2026-01", label: "Янв", total: 10_200 },
    { key: "2026-02", label: "Фев", total: 18_800 },
    { key: "2026-03", label: "Мар", total: 20_500 },
    { key: "2026-04", label: "Апр", total: 21_000 },
    { key: "2026-05", label: "Май", total: 21_500, isCurrent: true },
];

const featureBentoIncomeAxisMax = 50_000;
const featureBentoIncomeTotal = featureBentoIncomeMonths.reduce((sum, month) => sum + month.total, 0);

type FeatureBentoDebtStudent = {
    id: string;
    name: string;
    subject: string;
    balance: number;
    accountId?: string | null;
};

const featureBentoDebtStudents: FeatureBentoDebtStudent[] = [
    {
        id: "debt-sofia-gorina",
        name: "Sofia Gorina",
        subject: "Computer Science",
        balance: -20_800,
        accountId: null,
    },
    {
        id: "debt-pavel-kim",
        name: "Pavel Kim",
        subject: "Math",
        balance: -19_000,
        accountId: null,
    },
];

type FeatureBentoRecentPayment = {
    id: string;
    studentName: string;
    studentAccountId?: string | null;
    date: string;
    method: string;
    amount: number;
};

const featureBentoRecentPayments: FeatureBentoRecentPayment[] = [
    {
        id: "payment-sofia-gorina",
        studentName: "Sofia Gorina",
        studentAccountId: null,
        date: "16.05.2026",
        method: "СБП",
        amount: 12_400,
    },
    {
        id: "payment-pavel-kim",
        studentName: "Pavel Kim",
        studentAccountId: null,
        date: "14.05.2026",
        method: "Картой",
        amount: 9_600,
    },
    {
        id: "payment-alisa-petrova",
        studentName: "Alisa Petrova",
        studentAccountId: "account-alisa",
        date: "12.05.2026",
        method: "Перевод",
        amount: 14_000,
    },
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
    const [activeBentoId, setActiveBentoId] = useState<string | null>(null);
    const [isStickyVisible, setIsStickyVisible] = useState(false);
    const lastScrollYRef = useRef(0);
    const paymentsBentoCardRef = useRef<HTMLElement | null>(null);
    const isAuthorized = Boolean(user);
    const profileName = user?.name?.trim() || "Профиль";
    const profileAvatarUrl = user?.avatar?.trim() || undefined;
    const profileInitials = getInitials(profileName || "U");
    const activeFeatureBento = featureBentoCards.find((card) => card.id === activeBentoId) || null;
    const activeFeatureBentoModal = activeFeatureBento ? featureBentoModalShowcases[activeFeatureBento.id] : null;

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

    useEffect(() => {
        const card = paymentsBentoCardRef.current;

        if (!card) {
            return;
        }

        const applyGradientProgress = (progress: number) => {
            const easedProgress = progress * progress * (3 - 2 * progress);

            card.style.setProperty("--feature-bento-finance-gradient-green-x", `${2 + easedProgress * 38}%`);
            card.style.setProperty("--feature-bento-finance-gradient-green-y", `${36 + easedProgress * 28}%`);
            card.style.setProperty("--feature-bento-finance-gradient-blue-x", `${96 - easedProgress * 46}%`);
            card.style.setProperty("--feature-bento-finance-gradient-blue-y", `${58 + easedProgress * 34}%`);
            card.style.setProperty("--feature-bento-finance-gradient-flow-x", `${easedProgress * 100}%`);
            card.style.setProperty("--feature-bento-finance-gradient-y", `${34 - easedProgress * 50}px`);
            card.style.setProperty("--feature-bento-finance-gradient-scale", `${1.03 + easedProgress * 0.07}`);
        };

        const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

        if (prefersReducedMotion) {
            applyGradientProgress(0.52);
            return;
        }

        const updateGradientProgress = () => {
            const rect = card.getBoundingClientRect();
            const viewportHeight = window.innerHeight || document.documentElement.clientHeight;
            const rawProgress = (viewportHeight - rect.top) / (viewportHeight + rect.height);
            const progress = Math.min(1, Math.max(0, rawProgress));

            applyGradientProgress(progress);
        };

        updateGradientProgress();
        window.addEventListener("scroll", updateGradientProgress, { passive: true });
        window.addEventListener("resize", updateGradientProgress);

        return () => {
            window.removeEventListener("scroll", updateGradientProgress);
            window.removeEventListener("resize", updateGradientProgress);
        };
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

                <section id="features" className={styles.featureBentoSection} aria-label="Возможности Repeto">
                    <div className={styles.featureBentoInner}>
                        <div className={styles.featureBentoGrid}>
                            {featureBentoCards.map((card) => (
                                <article
                                    key={card.id}
                                    ref={card.id === "payments" ? paymentsBentoCardRef : undefined}
                                    className={`${styles.featureBentoCard} ${
                                        card.layout === "wide"
                                            ? styles.featureBentoCardWide
                                            : card.layout === "side"
                                              ? styles.featureBentoCardSide
                                              : styles.featureBentoCardCompact
                                    } ${card.id === "students" ? styles.featureBentoCardStudent : ""} ${
                                        card.id === "reminders" ? styles.featureBentoCardReminder : ""
                                    } ${card.id === "public-page" ? styles.featureBentoCardPublicPage : ""
                                    }`}
                                    onClick={() => setActiveBentoId(card.id)}
                                >
                                    <button
                                        type="button"
                                        className={styles.featureBentoExpandButton}
                                        onClick={(event) => {
                                            event.stopPropagation();
                                            setActiveBentoId(card.id);
                                        }}
                                        title={`Подробнее: ${card.title}`}
                                        aria-label={`Открыть подробности: ${card.title}`}
                                    >
                                        <span className={styles.featureBentoExpandGlyph} aria-hidden="true">
                                            <span
                                                className={`${styles.featureBentoExpandCorner} ${styles.featureBentoExpandCornerTl}`}
                                            />
                                            <span
                                                className={`${styles.featureBentoExpandCorner} ${styles.featureBentoExpandCornerTr}`}
                                            />
                                            <span
                                                className={`${styles.featureBentoExpandCorner} ${styles.featureBentoExpandCornerBl}`}
                                            />
                                            <span
                                                className={`${styles.featureBentoExpandCorner} ${styles.featureBentoExpandCornerBr}`}
                                            />
                                        </span>
                                    </button>

                                    <div className={styles.featureBentoCopy}>
                                        {card.layout === "compact" && card.id !== "students" && card.id !== "reminders" && card.id !== "public-page" ? (
                                            <span className={styles.featureBentoTag}>{card.tag}</span>
                                        ) : null}
                                        <h3 className={styles.featureBentoCardTitle}>{card.title}</h3>
                                        {card.layout === "compact" && card.id !== "students" && card.id !== "reminders" && card.id !== "public-page" ? (
                                            <p className={styles.featureBentoCardText}>{card.shortText}</p>
                                        ) : null}
                                    </div>

                                    {card.id === "schedule" ? (
                                        <div className={styles.featureBentoSchedulePreview} aria-hidden="true">
                                            <div className={styles.featureBentoScheduleCalendar}>
                                                <ScheduleMonthPreview
                                                    currentDate={featureBentoSchedulePreviewDate}
                                                    lessons={featureBentoScheduleLessons}
                                                />
                                            </div>
                                        </div>
                                    ) : null}

                                    {card.id === "payments" ? (
                                        <div className={`${styles.featureBentoFinancePreview} repeto-tochka-dash`} aria-hidden="true">
                                            <Card className="repeto-income-card repeto-tochka-income" view="outlined">
                                                <header className="repeto-tochka-income__header">
                                                    <span className="repeto-tochka-income__title">Доход с декабря по май</span>
                                                    <span className="repeto-card-chevron" aria-hidden="true">
                                                        <Icon data={ChevronRight as IconData} size={18} />
                                                    </span>
                                                </header>

                                                <div className="repeto-tochka-income__amount">
                                                    {`${featureBentoIncomeTotal.toLocaleString("ru-RU")} ₽`}
                                                </div>

                                                <div className="repeto-tochka-income__chart repeto-tochka-income__chart--compact">
                                                    <div className="repeto-tochka-income__axis">
                                                        <span className="repeto-tochka-income__axis-tick">
                                                            {featureBentoIncomeAxisMax.toLocaleString("ru-RU")}
                                                        </span>
                                                        <span className="repeto-tochka-income__axis-tick">
                                                            {Math.round(featureBentoIncomeAxisMax / 2).toLocaleString("ru-RU")}
                                                        </span>
                                                        <span className="repeto-tochka-income__axis-tick">0</span>
                                                    </div>

                                                    <div className="repeto-tochka-income__plot">
                                                        <span className="repeto-tochka-income__grid repeto-tochka-income__grid--top" />
                                                        <span className="repeto-tochka-income__grid repeto-tochka-income__grid--mid" />
                                                        <span className="repeto-tochka-income__grid repeto-tochka-income__grid--bottom" />

                                                        <div className="repeto-tochka-income__bars">
                                                            {featureBentoIncomeMonths.map((month) => {
                                                                const height = featureBentoIncomeAxisMax
                                                                    ? (month.total / featureBentoIncomeAxisMax) * 100
                                                                    : 0;

                                                                return (
                                                                    <div
                                                                        key={month.key}
                                                                        className={`repeto-tochka-income__col${month.isCurrent ? " repeto-tochka-income__col--current" : ""}`}
                                                                    >
                                                                        <div className="repeto-tochka-income__pair">
                                                                            <span
                                                                                className="repeto-tochka-income__bar"
                                                                                style={{ height: `${height}%` }}
                                                                            />
                                                                        </div>
                                                                        <span className="repeto-tochka-income__col-label">{month.label}</span>
                                                                    </div>
                                                                );
                                                            })}
                                                        </div>
                                                    </div>
                                                </div>
                                            </Card>

                                            <Card view="outlined" style={{ overflow: "hidden" }}>
                                                <div className="repeto-card-header">
                                                    <Text variant="subheader-2">Задолженности</Text>
                                                    <span className="repeto-card-chevron" aria-hidden="true">
                                                        <Icon data={ChevronRight as IconData} size={18} />
                                                    </span>
                                                </div>

                                                <div>
                                                    {featureBentoDebtStudents.map((student) => (
                                                        <div
                                                            key={student.id}
                                                            className="repeto-week-lesson-row"
                                                            style={{
                                                                display: "flex",
                                                                alignItems: "center",
                                                                width: "100%",
                                                                textDecoration: "none",
                                                            }}
                                                        >
                                                            <StudentAvatar student={{ name: student.name, avatarUrl: undefined }} size="s" />
                                                            <div
                                                                style={{
                                                                    flex: 1,
                                                                    minWidth: 0,
                                                                }}
                                                            >
                                                                <Text
                                                                    as="div"
                                                                    variant="body-2"
                                                                    ellipsis
                                                                    className="repeto-dashboard-entity-name"
                                                                >
                                                                    <StudentNameWithBadge
                                                                        name={student.name}
                                                                        hasRepetoAccount={Boolean(student.accountId)}
                                                                        truncate
                                                                    />
                                                                </Text>

                                                                <Text as="div" variant="body-1" color="secondary" style={{ marginTop: 2 }}>
                                                                    {student.subject}
                                                                </Text>
                                                            </div>

                                                            <div
                                                                style={{
                                                                    display: "flex",
                                                                    alignItems: "center",
                                                                    gap: 8,
                                                                    flexShrink: 0,
                                                                }}
                                                            >
                                                                <Text
                                                                    variant="body-1"
                                                                    className="repeto-dashboard-inline-value"
                                                                    style={{ color: "var(--finance-debt)" }}
                                                                >
                                                                    {formatBalance(student.balance)}
                                                                </Text>
                                                                <span className={styles.featureBentoDebtMailIcon}>
                                                                    <Icon data={Envelope as IconData} size={15} />
                                                                </span>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </Card>
                                        </div>
                                    ) : null}

                                    {card.id === "students" ? <StudentCardBentoPreview /> : null}

                                    {card.id === "reminders" ? <ReminderBentoPreview /> : null}

                                    {card.id === "public-page" ? <PublicTutorPageBentoPreview /> : null}

                                    {card.layout === "compact" && card.id !== "students" && card.id !== "reminders" && card.id !== "public-page" ? (
                                        <ul className={styles.featureBentoPointList}>
                                            {card.details.slice(0, 2).map((detail) => (
                                                <li key={detail}>{detail}</li>
                                            ))}
                                        </ul>
                                    ) : null}
                                </article>
                            ))}
                        </div>
                    </div>
                </section>

                <AppDialog
                    open={Boolean(activeFeatureBento)}
                    onClose={() => setActiveBentoId(null)}
                    size="xl"
                    hasCloseButton
                    caption={activeFeatureBento?.id === "schedule" || activeFeatureBento?.id === "payments" || activeFeatureBento?.id === "students" ? undefined : activeFeatureBentoModal?.eyebrow || activeFeatureBento?.title || "Возможность Repeto"}
                    className={[styles.featureBentoDialog, activeFeatureBento?.id === "schedule" || activeFeatureBento?.id === "payments" || activeFeatureBento?.id === "students" ? styles.featureBentoDialogNoHeader : ""]
                        .filter(Boolean)
                        .join(" ")}
                    modalClassName={styles.featureBentoDialogModal}
                    bodyClassName={styles.featureBentoModalBody}
                >
                    {activeFeatureBento && activeFeatureBentoModal ? (
                        <FeatureBentoModalContent cardId={activeFeatureBento.id} showcase={activeFeatureBentoModal} />
                    ) : null}
                </AppDialog>

                <section className={styles.featuresContinuation}>
                    <div className={styles.featuresContinuationInner}>
                        {featureBlocks.map((block) => {
                            const isExpandedFeatureBlock = block.id === "payments" || block.id === "portal";
                            const isRealScreenFeature = realScreenFeatureIds.has(block.id);

                            return (
                                <article
                                    key={block.id}
                                    className={`${styles.featureRow} ${isExpandedFeatureBlock ? styles.featureRowExpandedRight : ""}`}
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
