import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Head from "next/head";
import {
    Text,
    Avatar,
    Icon,
    Button,
    TextInput,
} from "@gravity-ui/uikit";
import { ChevronDown, Gear, ArrowLeft, Sun, Moon } from "@gravity-ui/icons";
import type { IconData } from "@gravity-ui/uikit";
import type { StudentPortalData } from "@/types/student-portal";
import PublicTutorWidget, {
    type PublicTutorWidgetContactItem,
} from "@/components/PublicTutorWidget";
import LessonsTab from "./LessonsTab";
import HomeworkTab from "./HomeworkTab";
import MaterialsTab from "./MaterialsTab";
import PaymentTab from "./PaymentTab";
import SignUpBanner from "./SignUpBanner";
import PortalModal from "./PortalModal";
import { PublicPageFooter, PublicPageHeader } from "../PublicPageChrome";

import Image from "next/image";
import { useThemeMode } from "@/contexts/ThemeContext";
import { Lp2Field, Lp2Row } from "@/components/Lp2Field";
import PhoneInput from "@/components/PhoneInput";
import StudentAvatar from "@/components/StudentAvatar";
import { resolveApiAssetUrl } from "@/lib/api";
import { studentApi } from "@/lib/studentAuth";
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
    const [settingsOpen, setSettingsOpen] = useState(false);
    const [settingsName, setSettingsName] = useState(data.studentName || "");
    const [settingsPhone, setSettingsPhone] = useState(data.studentPhone || "");
    const [settingsGrade, setSettingsGrade] = useState("");
    const [settingsAge, setSettingsAge] = useState("");
    const [settingsParentName, setSettingsParentName] = useState("");
    const [settingsParentPhone, setSettingsParentPhone] = useState("");
    const [settingsParentEmail, setSettingsParentEmail] = useState("");
    const [settingsSaving, setSettingsSaving] = useState(false);
    const [settingsLoading, setSettingsLoading] = useState(false);
    const [settingsError, setSettingsError] = useState("");
    const [settingsAvatarSrc, setSettingsAvatarSrc] = useState<string | null>(
        data.studentAvatarUrl ? resolveApiAssetUrl(data.studentAvatarUrl) || null : null
    );
    const avatarInputRef = useRef<HTMLInputElement>(null);
    const avatarUploadRef = useRef<Promise<unknown> | null>(null);
    const { theme, setTheme } = useThemeMode();

    const openSettings = useCallback(async () => {
        setSettingsOpen(true);
        setSettingsError("");
        setSettingsLoading(true);
        try {
            const d = await studentApi<any>(`/student-portal/students/${studentId}/data`);
            setSettingsName(d.studentName || "");
            setSettingsPhone(d.studentPhone || "");
            setSettingsGrade(d.studentGrade || "");
            setSettingsAge(d.studentAge ? String(d.studentAge) : "");
            setSettingsParentName(d.studentParentName || "");
            setSettingsParentPhone(d.studentParentPhone || "");
            setSettingsParentEmail(d.studentParentEmail || "");
            setSettingsAvatarSrc(d.studentAvatarUrl ? resolveApiAssetUrl(d.studentAvatarUrl) || null : null);
        } catch { /* use defaults */ }
        finally { setSettingsLoading(false); }
    }, [studentId]);

    const closeSettings = useCallback(() => {
        setSettingsOpen(false);
    }, []);

    const handleAvatarChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !file.type.startsWith("image/") || file.size > 5 * 1024 * 1024) return;
        const reader = new FileReader();
        reader.onload = (ev) => setSettingsAvatarSrc(ev.target?.result as string);
        reader.readAsDataURL(file);
        const uploadPromise = (async () => {
            try {
                const formData = new FormData();
                formData.append("file", file);
                const result = await studentApi<{ avatarUrl: string }>("/student-portal/avatar", {
                    method: "POST",
                    body: formData,
                });
                setSettingsAvatarSrc(resolveApiAssetUrl(result.avatarUrl) || null);
            } catch { /* preview stays */ }
        })();
        avatarUploadRef.current = uploadPromise;
        await uploadPromise;
        avatarUploadRef.current = null;
    }, []);

    const handleSettingsSave = useCallback(async () => {
        setSettingsSaving(true);
        setSettingsError("");
        if (avatarUploadRef.current) {
            await avatarUploadRef.current;
        }
        const normalizedAge = Number(String(settingsAge || "").trim());
        const safeAge = Number.isFinite(normalizedAge) && normalizedAge > 0 ? Math.floor(normalizedAge) : null;
        try {
            await studentApi(
                `/student-portal/students/${studentId}/profile`,
                {
                    method: "PATCH",
                    body: JSON.stringify({
                        name: settingsName.trim(),
                        phone: settingsPhone.trim() || null,
                        grade: settingsGrade.trim() || null,
                        age: safeAge,
                        parentName: settingsParentName.trim() || null,
                        parentPhone: settingsParentPhone.trim() || null,
                        parentEmail: settingsParentEmail.trim() || null,
                    }),
                }
            );
            closeSettings();
            window.location.reload();
        } catch {
            setSettingsError("Не удалось сохранить. Попробуйте ещё раз.");
        } finally {
            setSettingsSaving(false);
        }
    }, [studentId, settingsName, settingsPhone, settingsGrade, settingsAge, settingsParentName, settingsParentPhone, settingsParentEmail, closeSettings]);

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
            <div className="repeto-portal-page">
                <PublicPageHeader
                    containerClassName="repeto-portal-container"
                    rightContent={
                        <>
                            <StudentAvatar
                                student={{
                                    name: data.studentName || "Ученик",
                                    avatarUrl: settingsAvatarSrc || undefined,
                                }}
                                size="s"
                            />
                            <Text variant="body-1" style={{ fontWeight: 500 }}>
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
                                          </>
                                      ),
                                  }
                                : undefined
                        }
                    />

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

                    <PublicPageFooter />
                </div>
            </div>

            <PortalModal
                open={settingsOpen}
                onClose={closeSettings}
                ariaLabel="Настройки профиля"
                overlayClassName="repeto-portal-settings-overlay"
                overlayOpenClassName="repeto-portal-settings-overlay--open"
                panelClassName="repeto-portal-settings-panel"
                panelOpenClassName="repeto-portal-settings-panel--open"
            >
                <div className="repeto-portal-settings-panel__topbar">
                    <button type="button" className="lp2__back" onClick={closeSettings} aria-label="Закрыть">
                        <Icon data={ArrowLeft as IconData} size={18} />
                    </button>
                    <Text variant="subheader-2">Настройки профиля</Text>
                </div>

                <div className="repeto-portal-settings-panel__scroll">
                            {/* Avatar */}
                            <div style={{ textAlign: "center", marginBottom: 20 }}>
                                <div
                                    onClick={() => avatarInputRef.current?.click()}
                                    style={{
                                        width: 88, height: 88, borderRadius: "50%", margin: "0 auto",
                                        cursor: "pointer", overflow: "hidden", transition: "box-shadow 0.2s",
                                        boxShadow: "0 0 0 3px rgba(174,122,255,0.15)",
                                    }}
                                    onMouseEnter={(e) => (e.currentTarget.style.boxShadow = "0 0 0 4px rgba(174,122,255,0.3)")}
                                    onMouseLeave={(e) => (e.currentTarget.style.boxShadow = "0 0 0 3px rgba(174,122,255,0.15)")}
                                >
                                    <StudentAvatar
                                        student={{
                                            name: settingsName || data.studentName || "Ученик",
                                            avatarUrl: settingsAvatarSrc || undefined,
                                        }}
                                        size="l"
                                        style={{ width: "100%", height: "100%", minWidth: "100%" }}
                                    />
                                </div>
                                <input ref={avatarInputRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handleAvatarChange} />
                                <div style={{ marginTop: 12 }}>
                                    <Button view="outlined" size="s" onClick={() => avatarInputRef.current?.click()}>
                                        Изменить фото
                                    </Button>
                                </div>
                            </div>

                            <Lp2Field label="ФИО *">
                                <TextInput
                                    value={settingsName}
                                    onUpdate={setSettingsName}
                                    placeholder="Иванов Пётр Сергеевич"
                                    size="l"
                                />
                            </Lp2Field>

                            <Lp2Field label="Email">
                                <TextInput
                                    value={data.studentEmail || ""}
                                    size="l"
                                    disabled
                                />
                            </Lp2Field>

                            <Lp2Field label="Телефон">
                                <PhoneInput
                                    value={settingsPhone}
                                    onUpdate={setSettingsPhone}
                                />
                            </Lp2Field>

                            <Lp2Row>
                                <Lp2Field label="Класс" half>
                                    <TextInput
                                        value={settingsGrade}
                                        onUpdate={setSettingsGrade}
                                        placeholder="11"
                                        size="l"
                                    />
                                </Lp2Field>
                                <Lp2Field label="Возраст" half>
                                    <TextInput
                                        value={settingsAge}
                                        onUpdate={setSettingsAge}
                                        placeholder="15"
                                        size="l"
                                        type="number"
                                    />
                                </Lp2Field>
                            </Lp2Row>

                            <Text
                                as="div"
                                variant="caption-2"
                                color="secondary"
                                style={{ marginTop: 14, marginBottom: 10, textTransform: "uppercase", letterSpacing: "0.06em" }}
                            >
                                Основной контакт родителя
                            </Text>

                            <Lp2Field label="ФИО родителя">
                                <TextInput
                                    value={settingsParentName}
                                    onUpdate={setSettingsParentName}
                                    placeholder="Иванова Мария Петровна"
                                    size="l"
                                />
                            </Lp2Field>

                            <Lp2Row>
                                <Lp2Field label="Телефон родителя" half>
                                    <PhoneInput
                                        value={settingsParentPhone}
                                        onUpdate={setSettingsParentPhone}
                                    />
                                </Lp2Field>
                                <Lp2Field label="Email родителя" half>
                                    <TextInput
                                        value={settingsParentEmail}
                                        onUpdate={setSettingsParentEmail}
                                        placeholder="parent@email.com"
                                        size="l"
                                        type="email"
                                    />
                                </Lp2Field>
                            </Lp2Row>

                            {/* Theme */}
                            <Text
                                as="div"
                                variant="caption-2"
                                color="secondary"
                                style={{ marginTop: 24, marginBottom: 10, textTransform: "uppercase", letterSpacing: "0.06em" }}
                            >
                                Тема оформления
                            </Text>
                            <div style={{ display: "flex", gap: 8 }}>
                                <Button
                                    view={theme === "light" ? "action" : "outlined"}
                                    size="m"
                                    onClick={() => setTheme("light")}
                                >
                                    <Icon data={Sun as IconData} size={16} />
                                    <span style={{ marginLeft: 6 }}>Светлая</span>
                                </Button>
                                <Button
                                    view={theme === "dark" ? "action" : "outlined"}
                                    size="m"
                                    onClick={() => setTheme("dark")}
                                >
                                    <Icon data={Moon as IconData} size={16} />
                                    <span style={{ marginLeft: 6 }}>Тёмная</span>
                                </Button>
                            </div>

                            {settingsError && (
                                <Text as="div" variant="body-1" style={{ color: "var(--g-color-text-danger)", marginTop: 8 }}>
                                    {settingsError}
                                </Text>
                            )}
                </div>

                <div className="repeto-portal-settings-panel__bottombar">
                    <Button
                        view="action"
                        size="xl"
                        width="max"
                        onClick={handleSettingsSave}
                        loading={settingsSaving}
                        disabled={!settingsName.trim()}
                    >
                        Сохранить
                    </Button>
                    <Button
                        view="flat"
                        size="l"
                        width="max"
                        onClick={() => void onLogout()}
                        style={{ marginTop: 8, color: "var(--g-color-text-danger)" }}
                    >
                        Выйти из аккаунта
                    </Button>
                </div>
            </PortalModal>
        </>
    );
};

export default StudentPortalPage;
