import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Head from "next/head";
import { useRouter } from "next/router";
import {
    Text,
    Avatar,
    Icon,
    Button,
} from "@gravity-ui/uikit";
import { Gear, Calendar, CircleInfo, FolderOpen, Receipt } from "@gravity-ui/icons";
import type { IconData } from "@gravity-ui/uikit";
import type { StudentPortalData } from "@/types/student-portal";
import PublicTutorWidget, {
    type PublicTutorWidgetContactItem,
} from "@/components/PublicTutorWidget";
import AnimatedSidebarIcon from "@/components/AnimatedSidebarIcon";
import LessonsTab from "./LessonsTab";
import HomeworkTab from "./HomeworkTab";
import MaterialsTab from "./MaterialsTab";
import PaymentTab from "./PaymentTab";
import SignUpBanner from "./SignUpBanner";
import { PublicPageFooter, PublicPageHeader } from "../PublicPageChrome";
import StudentSettingsDialog from "../StudentSettingsDialog";

import Image from "next/image";
import StudentAvatar from "@/components/StudentAvatar";
import { resolveApiAssetUrl } from "@/lib/api";
import {
    formatCancelPolicyActionLabel,
    formatCancelPolicyHoursWord,
} from "@/lib/cancelPolicy";

const tabItems: Array<{
    value: "lessons" | "homework" | "materials" | "payment";
    label: string;
    animatedIconPath: string;
    fallbackIcon: IconData;
}> = [
    {
        value: "lessons",
        label: "Занятия",
        animatedIconPath: "/icons/student-sidebar-animated/lessons.json",
        fallbackIcon: Calendar as IconData,
    },
    {
        value: "homework",
        label: "Домашка",
        animatedIconPath: "/icons/student-sidebar-animated/homework.json",
        fallbackIcon: CircleInfo as IconData,
    },
    {
        value: "materials",
        label: "Материалы",
        animatedIconPath: "/icons/student-sidebar-animated/materials.json",
        fallbackIcon: FolderOpen as IconData,
    },
    {
        value: "payment",
        label: "Оплата",
        animatedIconPath: "/icons/student-sidebar-animated/payment.json",
        fallbackIcon: Receipt as IconData,
    },
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
    const router = useRouter();
    const [tab, setTab] = useState("lessons");
    const [hoveredSidebarTab, setHoveredSidebarTab] = useState<string | null>(null);
    const [tutorSwitcherExpanded, setTutorSwitcherExpanded] = useState(false);
    const [settingsOpen, setSettingsOpen] = useState(false);
    const settingsQueryHandledRef = useRef(false);
    const studentAvatarSrc = data.studentAvatarUrl
        ? resolveApiAssetUrl(data.studentAvatarUrl) || null
        : null;

    const openSettings = useCallback(() => {
        setSettingsOpen(true);
    }, []);

    const closeSettings = useCallback(() => {
        setSettingsOpen(false);
    }, []);

    useEffect(() => {
        if (!router.isReady) return;

        const settingsParam = Array.isArray(router.query.settings)
            ? router.query.settings[0]
            : router.query.settings;
        const tabParam = Array.isArray(router.query.tab)
            ? router.query.tab[0]
            : router.query.tab;

        const shouldOpenFromQuery =
            settingsParam === "1" ||
            settingsParam === "true" ||
            settingsParam === "yes" ||
            tabParam === "settings" ||
            tabParam === "profile";

        if (!shouldOpenFromQuery) {
            settingsQueryHandledRef.current = false;
            return;
        }

        if (settingsQueryHandledRef.current) return;
        settingsQueryHandledRef.current = true;

        void openSettings();

        const nextQuery: Record<string, string | string[] | undefined> = {
            ...router.query,
        };
        delete nextQuery.settings;
        if (tabParam === "settings" || tabParam === "profile") {
            delete nextQuery.tab;
        }

        void router.replace(
            {
                pathname: router.pathname,
                query: nextQuery,
            },
            undefined,
            { shallow: true },
        );
    }, [openSettings, router]);

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
    const resolvedTutorAvatarUrl = tutorAvatarUrl
        ? resolveApiAssetUrl(tutorAvatarUrl) || tutorAvatarUrl
        : undefined;
    const tutorReviewsCount = Number.isFinite(Number(data.tutorReviewsCount))
        ? Math.max(0, Number(data.tutorReviewsCount))
        : 0;
    const tutorRating = Number.isFinite(Number(data.tutorRating))
        ? Number(data.tutorRating)
        : null;

    const openTutorReviews = useCallback(() => {
        if (!tutorSlug || typeof window === "undefined") return;
        window.location.href = `/t/${encodeURIComponent(tutorSlug)}#reviews`;
    }, [tutorSlug]);

    const freeHours = data.cancelPolicy?.freeHours ?? 24;
    const lateActionValue =
        data.cancelPolicy?.lateCancelAction || data.cancelPolicy?.lateAction;
    const lateActionLabel = formatCancelPolicyActionLabel(lateActionValue).replace(
        "стоимости занятия",
        "от стоимости"
    );
    const noShowActionLabel = formatCancelPolicyActionLabel(
        data.cancelPolicy?.noShowAction
    ).replace("стоимости занятия", "от стоимости");

    const normalizedPhone = (data.tutorPhone || "").replace(/[^+\d]/g, "");
    const widgetContacts: PublicTutorWidgetContactItem[] = [];

    if (normalizedPhone) {
        widgetContacts.push({
            key: "phone",
            title: "Телефон",
            value: data.tutorPhone || normalizedPhone,
            href: `tel:${normalizedPhone}`,
        });
    }

    if (data.tutorWhatsapp) {
        const waDigits = data.tutorWhatsapp.replace(/[^\d]/g, "");
        if (waDigits) {
            widgetContacts.push({
                key: "whatsapp",
                title: "WhatsApp",
                value: data.tutorWhatsapp,
                href: `https://wa.me/${waDigits}`,
                external: true,
            });
        }
    }

    if (tutorSlug) {
        widgetContacts.push({
            key: "website",
            title: "Профиль",
            value: `/t/${tutorSlug}`,
            href: `/t/${tutorSlug}`,
            external: true,
        });
    }

    return (
        <>
            <Head>
                <title>Мои занятия — Repeto</title>
            </Head>
            <div className="repeto-portal-page repeto-tp-page repeto-student-portal-page">
                <PublicPageHeader
                    containerClassName="repeto-tp-container repeto-student-portal-container"
                    rightContent={
                        <>
                            <StudentAvatar
                                student={{
                                    name: data.studentName || "Ученик",
                                    avatarUrl: studentAvatarSrc || undefined,
                                }}
                                size="s"
                            />
                            <Text variant="body-1" className="repeto-portal-header__student-name">
                                {data.studentName}
                            </Text>
                            <Button
                                view="flat"
                                size="s"
                                onClick={openSettings}
                                aria-label="Настройки"
                            >
                                <Icon data={Gear as IconData} size={16} />
                            </Button>
                        </>
                    }
                />

                <div className="repeto-tp-container repeto-portal-main repeto-student-portal-main">
                    <div className="repeto-tp-layout repeto-student-portal-layout">
                        <aside className="repeto-tp-sidebar repeto-student-portal-sidebar">
                            <h2 className="repeto-tp-sidebar__title repeto-student-portal-sidebar__title">
                                Кабинет ученика
                            </h2>

                            <nav
                                className="repeto-tp-sidebar__nav page-overlay__nav page-overlay__nav--section"
                                role="tablist"
                                aria-label="Разделы портала"
                            >
                                {tabItems.map((item) => {
                                    const isActive = tab === item.value;
                                    const playIcon = isActive || hoveredSidebarTab === item.value;
                                    return (
                                        <button
                                            key={item.value}
                                            type="button"
                                            role="tab"
                                            aria-selected={isActive}
                                            className={`repeto-tp-sidebar__item repeto-student-portal-sidebar__tab page-overlay__nav-item page-overlay__nav-item--section${
                                                isActive
                                                    ? " repeto-tp-sidebar__item--active page-overlay__nav-item--active"
                                                    : ""
                                            }`}
                                            onClick={() => setTab(item.value)}
                                            onMouseEnter={() => setHoveredSidebarTab(item.value)}
                                            onMouseLeave={() => setHoveredSidebarTab((prev) => (prev === item.value ? null : prev))}
                                            onFocus={() => setHoveredSidebarTab(item.value)}
                                            onBlur={() => setHoveredSidebarTab((prev) => (prev === item.value ? null : prev))}
                                        >
                                            <span className="repeto-student-portal-sidebar__tab-icon">
                                                <AnimatedSidebarIcon
                                                    src={item.animatedIconPath}
                                                    play={playIcon}
                                                    fallbackIcon={item.fallbackIcon}
                                                    size={24}
                                                />
                                            </span>
                                            <span className="repeto-tp-sidebar__item-text">{item.label}</span>
                                        </button>
                                    );
                                })}
                            </nav>
                        </aside>

                        <div className="repeto-tp-content repeto-student-portal-content">
                            {error && (
                                <Text variant="body-2" color="danger" className="repeto-portal-error">
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
                            <PublicTutorWidget
                                className="repeto-portal-section--spaced"
                                name={tutorName}
                                avatarUrl={resolvedTutorAvatarUrl}
                                subjectsText={activeTutor?.subject || undefined}
                                contacts={widgetContacts}
                                rating={tutorRating}
                                reviewsCount={tutorReviewsCount}
                                onOpenReviews={tutorReviewsCount > 0 ? openTutorReviews : undefined}
                                policy={
                                    data.cancelPolicy
                                        ? {
                                              freeHours,
                                              freeHoursWord: formatCancelPolicyHoursWord(freeHours),
                                              lateActionLabel,
                                              noShowActionLabel,
                                          }
                                        : undefined
                                }
                                switcher={
                                    uniqueTutors.length > 1
                                        ? {
                                              expanded: tutorSwitcherExpanded,
                                              onToggle: () => setTutorSwitcherExpanded((prev) => !prev),
                                              label: tutorSwitcherExpanded
                                                  ? "Скрыть список репетиторов"
                                                  : "Показать список репетиторов",
                                              panel: (
                                                  <>
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
                                                                                  className="repeto-cover-image"
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
                                                  </>
                                              ),
                                          }
                                        : undefined
                                }
                            />

                            <div className="repeto-scroll-x repeto-portal-tabs repeto-portal-tabs--mobile">
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

                            <PublicPageFooter />
                        </div>
                    </div>
                </div>
            </div>

            <StudentSettingsDialog
                open={settingsOpen}
                onClose={closeSettings}
                fallbackProfile={{
                    name: data.studentName,
                    email: data.studentEmail,
                    phone: data.studentPhone,
                    avatarUrl: data.studentAvatarUrl,
                }}
                onLogout={onLogout}
                reloadOnSave
            />
        </>
    );
};

export default StudentPortalPage;
