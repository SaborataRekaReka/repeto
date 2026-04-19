import { useMemo, useState } from "react";
import Head from "next/head";
import Link from "next/link";
import {
    Text,
    Avatar,
    Icon,
    Tooltip,
    Button,
} from "@gravity-ui/uikit";
import { ArrowUpRightFromSquare, Smartphone, Comment, ChevronDown } from "@gravity-ui/icons";
import type { IconData } from "@gravity-ui/uikit";
import type { StudentPortalData } from "@/types/student-portal";
import LessonsTab from "./LessonsTab";
import HomeworkTab from "./HomeworkTab";
import MaterialsTab from "./MaterialsTab";
import PaymentTab from "./PaymentTab";
import SignUpBanner from "./SignUpBanner";

import Image from "next/image";
import ToggleTheme from "@/components/Footer/ToggleTheme";
import { resolveApiAssetUrl } from "@/lib/api";
import {
    formatCancelPolicyActionLabel,
    formatCancelPolicyHoursWord,
} from "@/lib/cancelPolicy";

const tabItems = [
    { value: "lessons", label: "Занятия" },
    { value: "homework", label: "Домашка" },
    { value: "materials", label: "Материалы" },
    { value: "payment", label: "Оплата" },
];

type TutorLink = {
    studentId: string;
    tutorId?: string;
    tutorName: string;
    tutorSlug?: string;
    tutorAvatarUrl?: string | null;
    subject: string;
    status?: string;
};

type Props = {
    data: StudentPortalData;
    studentId: string;
    tutors: TutorLink[];
    activeStudentId: string | null;
    onSelectStudent: (studentId: string) => void;
    onLogout: () => void | Promise<void>;
    error?: string | null;
};

const StudentPortalPage = ({
    data,
    studentId,
    tutors,
    activeStudentId,
    onSelectStudent,
    onLogout,
    error,
}: Props) => {
    const [tab, setTab] = useState("lessons");
    const [tutorSwitcherExpanded, setTutorSwitcherExpanded] = useState(false);

    const tutorKey = (item: TutorLink) => item.tutorId || item.tutorSlug || item.tutorName;
    const tutorPriority = (status?: string) => {
        if (status === "active") return 3;
        if (status === "paused") return 2;
        if (status === "pending") return 1;
        return 0;
    };

    const uniqueTutors = useMemo(() => {
        const byTutor = new Map<string, TutorLink>();

        for (const item of tutors) {
            const key = tutorKey(item);
            const existing = byTutor.get(key);

            if (!existing || tutorPriority(item.status) > tutorPriority(existing.status)) {
                byTutor.set(key, item);
            }
        }

        return Array.from(byTutor.values());
    }, [tutors]);

    const activeTutor = useMemo(
        () => tutors.find((item) => item.studentId === activeStudentId) || null,
        [activeStudentId, tutors]
    );

    const activeTutorKey = activeTutor ? tutorKey(activeTutor) : null;

    const otherTutors = useMemo(
        () =>
            uniqueTutors.filter((item) => {
                if (!activeTutorKey) return false;
                return tutorKey(item) !== activeTutorKey;
            }),
        [activeTutorKey, uniqueTutors]
    );

    const tutorName = data.tutorName || activeTutor?.tutorName || "Репетитор";
    const tutorSlug = data.tutorSlug || activeTutor?.tutorSlug || "";
    const tutorAvatarUrl = activeTutor?.tutorAvatarUrl || data.tutorAvatarUrl;
    const tutorInitials = tutorName
        .split(" ")
        .slice(0, 2)
        .map((w) => w[0])
        .join("");

    const freeHours = data.cancelPolicy?.freeHours ?? 24;
    const lateActionValue =
        data.cancelPolicy?.lateCancelAction || data.cancelPolicy?.lateAction;
    const lateActionLabel = formatCancelPolicyActionLabel(lateActionValue).replace(
        "стоимости занятия",
        "от стоимости"
    );
    const cancelPolicyTooltip =
        `Бесплатная отмена занятий не позже ${freeHours} ` +
        `${formatCancelPolicyHoursWord(freeHours)} до начала, затем ${lateActionLabel}`;

    const normalizedPhone = (data.tutorPhone || "").replace(/[^+\d]/g, "");

    return (
        <>
            <Head>
                <title>Мои занятия — Repeto</title>
            </Head>
            <div className="repeto-portal-page">
                <div className="repeto-portal-header">
                    <div className="repeto-portal-container repeto-portal-header__inner">
                        <Text variant="subheader-2">Repeto</Text>
                        <div className="repeto-portal-header__right">
                            <span className="repeto-portal-student-pill">
                                <Text variant="body-1" color="secondary">
                                    {data.studentName}
                                </Text>
                            </span>
                            <ToggleTheme />
                            <Button view="flat" size="s" onClick={() => void onLogout()}>
                                Выйти
                            </Button>
                        </div>
                    </div>
                </div>

                <div className="repeto-portal-container repeto-portal-main">
                    {error && (
                        <Text
                            variant="body-2"
                            color="danger"
                            style={{ display: "block", marginBottom: 12 }}
                        >
                            {error}
                        </Text>
                    )}

                    <Text
                        variant="subheader-2"
                        as="div"
                        className="repeto-portal-plain-section-title"
                    >
                        Ваш репетитор
                    </Text>
                    <div className="repeto-portal-tutor-simple repeto-portal-section--spaced">
                        <div className="repeto-portal-tutor-simple__row">
                            <div className="repeto-portal-tutor-avatar repeto-portal-tutor-avatar--simple">
                                {tutorAvatarUrl ? (
                                    <Image
                                        style={{ objectFit: "cover" }}
                                        src={resolveApiAssetUrl(tutorAvatarUrl) || tutorAvatarUrl}
                                        fill
                                        alt={tutorName}
                                    />
                                ) : (
                                    <Avatar
                                        text={tutorInitials}
                                        size="l"
                                        theme="brand"
                                        style={{ "--g-avatar-size": "56px" } as React.CSSProperties}
                                    />
                                )}
                            </div>
                            <div className="repeto-portal-tutor-simple__meta">
                                <div className="repeto-portal-tutor-simple__name-row">
                                    <Text
                                        variant="subheader-2"
                                        as="div"
                                        className="repeto-portal-tutor-simple__name"
                                    >
                                        {tutorName}
                                    </Text>
                                    <Tooltip
                                        content={cancelPolicyTooltip}
                                        placement="top"
                                        openDelay={120}
                                        closeDelay={0}
                                    >
                                        <button
                                            type="button"
                                            className="repeto-portal-tutor-policy-trigger"
                                            aria-label="Политика отмен"
                                        >
                                            <span aria-hidden="true">!</span>
                                        </button>
                                    </Tooltip>
                                </div>
                                <div className="repeto-portal-tutor-simple__links">
                                    {normalizedPhone && (
                                        <a
                                            href={`tel:${normalizedPhone}`}
                                            className="repeto-portal-tutor-simple__link"
                                        >
                                            <Icon data={Smartphone as IconData} size={14} />
                                            <Text variant="body-2">{data.tutorPhone}</Text>
                                        </a>
                                    )}
                                    {data.tutorWhatsapp && (
                                        <a
                                            href={`https://wa.me/${data.tutorWhatsapp}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="repeto-portal-tutor-simple__link"
                                        >
                                            <Icon data={Comment as IconData} size={14} />
                                            <Text variant="body-2">WhatsApp</Text>
                                        </a>
                                    )}
                                    {tutorSlug && (
                                        <a
                                            href={`/t/${tutorSlug}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="repeto-portal-tutor-simple__link"
                                        >
                                            <Icon data={ArrowUpRightFromSquare as IconData} size={14} />
                                            <Text variant="body-2">Профиль</Text>
                                        </a>
                                    )}
                                </div>
                            </div>
                            {uniqueTutors.length > 1 && (
                                <div className="repeto-portal-tutor-simple__switcher">
                                    <button
                                        type="button"
                                        className={`repeto-portal-tutor-switcher-trigger${
                                            tutorSwitcherExpanded
                                                ? " repeto-portal-tutor-switcher-trigger--open"
                                                : ""
                                        }`}
                                        onClick={() =>
                                            setTutorSwitcherExpanded((prev) => !prev)
                                        }
                                        aria-expanded={tutorSwitcherExpanded}
                                        aria-label={
                                            tutorSwitcherExpanded
                                                ? "Скрыть список репетиторов"
                                                : "Показать список репетиторов"
                                        }
                                    >
                                        <Icon data={ChevronDown as IconData} size={16} />
                                    </button>
                                </div>
                            )}
                        </div>

                        {uniqueTutors.length > 1 && tutorSwitcherExpanded && (
                            <div className="repeto-portal-tutor-switcher-panel">
                                <Text
                                    variant="caption-1"
                                    color="secondary"
                                    className="repeto-portal-tutor-switcher-title"
                                >
                                    Другие репетиторы
                                </Text>

                                {otherTutors.length > 0 ? (
                                    otherTutors.map((item) => {
                                        const itemInitials = item.tutorName
                                            .split(" ")
                                            .filter(Boolean)
                                            .slice(0, 2)
                                            .map((word) => word[0])
                                            .join("")
                                            .toUpperCase();

                                        return (
                                            <button
                                                key={item.studentId}
                                                type="button"
                                                className="repeto-portal-tutor-switcher-item"
                                                onClick={() => {
                                                    setTutorSwitcherExpanded(false);
                                                    onSelectStudent(item.studentId);
                                                }}
                                            >
                                                <span className="repeto-portal-tutor-switcher-item__avatar">
                                                    {item.tutorAvatarUrl ? (
                                                        <Image
                                                            style={{ objectFit: "cover" }}
                                                            src={
                                                                resolveApiAssetUrl(item.tutorAvatarUrl) ||
                                                                item.tutorAvatarUrl
                                                            }
                                                            fill
                                                            alt={item.tutorName}
                                                        />
                                                    ) : (
                                                        <Avatar
                                                            text={itemInitials || "Р"}
                                                            size="xs"
                                                            theme="brand"
                                                        />
                                                    )}
                                                </span>
                                                <span className="repeto-portal-tutor-switcher-item__meta">
                                                    <span className="repeto-portal-tutor-switcher-item__name">
                                                        {item.tutorName}
                                                    </span>
                                                    <span className="repeto-portal-tutor-switcher-item__subject">
                                                        {item.subject}
                                                    </span>
                                                </span>
                                            </button>
                                        );
                                    })
                                ) : (
                                    <Text
                                        variant="body-1"
                                        color="secondary"
                                        className="repeto-portal-tutor-switcher-empty"
                                    >
                                        Других репетиторов пока нет
                                    </Text>
                                )}
                            </div>
                        )}
                    </div>

                    <div className="repeto-scroll-x repeto-portal-tabs">
                        <div
                            className="repeto-packages-type-tabs repeto-portal-type-tabs"
                            role="tablist"
                            aria-label="Разделы портала"
                        >
                            {tabItems.map((item) => {
                                const isActive = tab === item.value;
                                return (
                                    <button
                                        key={item.value}
                                        type="button"
                                        role="tab"
                                        aria-selected={isActive}
                                        className={`repeto-packages-type-tab repeto-portal-type-tab${
                                            isActive
                                                ? " repeto-packages-type-tab--active repeto-portal-type-tab--active"
                                                : ""
                                        }`}
                                        onClick={() => setTab(item.value)}
                                    >
                                        <span>{item.label}</span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {tab === "lessons" && (
                        <LessonsTab data={data} studentId={studentId} />
                    )}
                    {tab === "homework" && (
                        <HomeworkTab homework={data.homework} studentId={studentId} />
                    )}
                    {tab === "materials" && (
                        <MaterialsTab files={data.files} homework={data.homework} />
                    )}
                    {tab === "payment" && <PaymentTab data={data} />}

                    <SignUpBanner notifications={data.notifications} />

                    <div className="repeto-portal-footer">
                        <Text variant="caption-2" color="secondary">
                            Работает на{" "}
                            <Link
                                href="/"
                                style={{
                                    fontWeight: 600,
                                    textDecoration: "none",
                                    color: "inherit",
                                }}
                            >
                                Repeto
                            </Link>
                        </Text>
                    </div>
                </div>
            </div>
        </>
    );
};

export default StudentPortalPage;
