import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/router";
import {
    Alert,
    Text,
    Button,
} from "@gravity-ui/uikit";
import PageOverlay from "@/components/PageOverlay";
import AppDialog from "@/components/AppDialog";
import LessonPanelV2 from "@/components/LessonPanelV2";
import CreatePaymentModal from "@/components/CreatePaymentModal";
import StudentNameWithBadge from "@/components/StudentNameWithBadge";
import ActivateAccountModal from "./ActivateAccountModal";
import RemindModal from "@/components/RemindModal";
import LessonHistory from "./LessonHistory";
import PaymentHistory from "./PaymentHistory";
import ProfileTab from "./ProfileTab";
import NotesTab from "./NotesTab";
import HomeworkTab from "./HomeworkTab";
import ActivityTab, { type StudentActivityItem } from "./ActivityTab";
import { useLessons, deleteLesson } from "@/hooks/useLessons";
import { usePayments } from "@/hooks/usePayments";
import { useSettings } from "@/hooks/useSettings";
import { codedErrorMessage } from "@/lib/errorCodes";
import {
    checkStudentEmail,
    unlinkStudentAccount,
    updateStudent,
    useStudentNotes,
    useStudentHomework,
} from "@/hooks/useStudents";

import type { Student } from "@/types/student";
import type { Lesson } from "@/types/schedule";

const TAB_VALUES = [
    "profile",
    "lessons",
    "payments",
    "notes",
    "homework",
    "activity",
] as const;

const tabs = [
    { title: "Профиль", value: "profile" },
    { title: "Занятия", value: "lessons" },
    { title: "Оплаты", value: "payments" },
    { title: "Заметки", value: "notes" },
    { title: "Домашка", value: "homework" },
    { title: "История", value: "activity" },
];

type StudentDetailPageProps = {
    student: Student;
    onRefresh?: () => void;
};

const isEmailLike = (value?: string) => {
    const email = (value || "").trim();
    return email.includes("@") && email.includes(".");
};

const parseActivityTimestamp = (value: unknown, time = "00:00") => {
    const raw = String(value || "").trim();
    if (!raw) return 0;

    const ru = raw.match(/^(\d{2})\.(\d{2})\.(\d{4})$/);
    if (ru) {
        const parsed = new Date(`${ru[3]}-${ru[2]}-${ru[1]}T${time}`).getTime();
        return Number.isFinite(parsed) ? parsed : 0;
    }

    const isoDate = raw.match(/^\d{4}-\d{2}-\d{2}$/);
    const parsed = new Date(isoDate ? `${raw}T${time}` : raw).getTime();
    return Number.isFinite(parsed) ? parsed : 0;
};

const lessonStatusLabel = (status: Lesson["status"]) => {
    switch (status) {
        case "completed":
            return "Проведено";
        case "cancelled_student":
        case "cancelled_tutor":
            return "Отменено";
        case "no_show":
            return "Неявка";
        case "reschedule_pending":
            return "Перенос";
        case "planned":
        default:
            return "Запланировано";
    }
};

const paymentMethodLabel = (method: string) => {
    switch (method) {
        case "sbp":
            return "СБП";
        case "cash":
            return "Наличные";
        case "yukassa":
            return "ЮKassa";
        case "transfer":
        default:
            return "Перевод";
    }
};

const StudentDetailPage = ({ student, onRefresh }: StudentDetailPageProps) => {
    const router = useRouter();
    const { data: settings } = useSettings();
    const tutorSlug = settings?.account?.slug || "";

    const getTabFromQuery = () => {
        const queryTab = router.query.tab;
        return typeof queryTab === "string" &&
            TAB_VALUES.includes(queryTab as any)
            ? queryTab
            : "profile";
    };

    const [local, setLocal] = useState<Student>(student);
    useEffect(() => setLocal(student), [student]);

    const [tab, setTab] = useState<string>(getTabFromQuery);
    const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null);
    const [scheduleModal, setScheduleModal] = useState(false);
    const [editLesson, setEditLesson] = useState<Lesson | null>(null);
    const [paymentModal, setPaymentModal] = useState(false);
    const [paymentLessonId, setPaymentLessonId] = useState<string | null>(null);
    const [activateAccountModal, setActivateAccountModal] = useState(false);
    const [unlinkConfirmOpen, setUnlinkConfirmOpen] = useState(false);
    const [unlinkLoading, setUnlinkLoading] = useState(false);
    const [remindModal, setRemindModal] = useState(false);
    const [remindInitialType, setRemindInitialType] = useState<"payment" | "lesson" | "homework">("payment");
    const [optimisticRemovedLessonIds, setOptimisticRemovedLessonIds] = useState<string[]>([]);
    const [lessonActionError, setLessonActionError] = useState<string | null>(null);
    const [statusUpdating, setStatusUpdating] = useState(false);
    const [archiveConfirmOpen, setArchiveConfirmOpen] = useState(false);
    const [studentActionError, setStudentActionError] = useState<string | null>(null);
    const [portalAccountExists, setPortalAccountExists] = useState(false);

    useEffect(() => {
        const nextTab = getTabFromQuery();
        setTab((prev) => (prev === nextTab ? prev : nextTab));
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [router.query.tab]);

    useEffect(() => {
        if (local.accountId) {
            setPortalAccountExists(true);
            return;
        }

        const email = (local.email || "").trim().toLowerCase();
        if (!isEmailLike(email)) {
            setPortalAccountExists(false);
            return;
        }

        let cancelled = false;
        const timer = setTimeout(async () => {
            try {
                const result = await checkStudentEmail(email);
                if (!cancelled) {
                    setPortalAccountExists(result.exists);
                }
            } catch {
                if (!cancelled) {
                    setPortalAccountExists(false);
                }
            }
        }, 350);

        return () => {
            cancelled = true;
            clearTimeout(timer);
        };
    }, [local.accountId, local.email]);

    const handleTabChange = (nextTab: string) => {
        setTab(nextTab);
        const { tab: _tab, ...restQuery } = router.query;
        const nextQuery =
            nextTab === "profile"
                ? restQuery
                : { ...restQuery, tab: nextTab };
        router.replace(
            { pathname: router.pathname, query: nextQuery },
            undefined,
            { shallow: true }
        );
    };

    const handleInlineSave = async (data: Partial<Student>) => {
        const localPatch = Object.fromEntries(
            Object.entries(data as Record<string, unknown>).map(([key, value]) => [
                key,
                value ?? undefined,
            ])
        ) as Partial<Student>;

        setLocal((prev) => ({ ...prev, ...localPatch } as Student));
        try {
            await updateStudent(student.id, data as any);
            onRefresh?.();
        } catch {
            setLocal(student);
        }
    };

    const { data: allLessons = [], refetch: refetchLessons } = useLessons({ studentId: student.id });
    const visibleLessons = allLessons.filter(
        (lesson) => !optimisticRemovedLessonIds.includes(lesson.id)
    );
    const studentLessons = [...visibleLessons].sort((a, b) =>
        a.date > b.date ? -1 : 1
    );

    useEffect(() => {
        if (!router.isReady) return;

        const queryLessonId = router.query.lessonId;
        if (typeof queryLessonId !== "string" || queryLessonId.length === 0) {
            return;
        }

        const targetLesson = studentLessons.find((lesson) => lesson.id === queryLessonId);
        if (!targetLesson) {
            return;
        }

        setSelectedLesson((prev) => (prev?.id === targetLesson.id ? prev : targetLesson));

        const nextQuery = { ...router.query };
        delete nextQuery.lessonId;
        router.replace(
            { pathname: router.pathname, query: nextQuery },
            undefined,
            { shallow: true }
        );
    }, [router.isReady, router.pathname, router.query.lessonId, studentLessons]);

    useEffect(() => {
        if (optimisticRemovedLessonIds.length === 0) return;
        const existingIds = new Set(allLessons.map((lesson) => lesson.id));
        setOptimisticRemovedLessonIds((prev) => prev.filter((id) => existingIds.has(id)));
    }, [allLessons, optimisticRemovedLessonIds.length]);

    const handleOpenCreateLesson = () => {
        setLessonActionError(null);
        setEditLesson(null);
        setScheduleModal(true);
    };

    const handleEditLesson = (lesson: Lesson) => {
        setLessonActionError(null);
        setEditLesson(lesson);
        setScheduleModal(true);
    };

    const handleDeleteLesson = async (lessonId: string) => {
        setLessonActionError(null);
        setOptimisticRemovedLessonIds((prev) => (
            prev.includes(lessonId) ? prev : [...prev, lessonId]
        ));

        try {
            await deleteLesson(lessonId);
            await refetchLessons();
            onRefresh?.();
        } catch (error: any) {
            setOptimisticRemovedLessonIds((prev) => prev.filter((id) => id !== lessonId));
            setLessonActionError(codedErrorMessage("LESSON-DELETE", error));
        }
    };

    const applyStudentStatus = async (nextStatus: Student["status"]) => {
        if (statusUpdating || local.status === nextStatus) return;
        setStudentActionError(null);
        const previousStatus = local.status;
        setLocal((prev) => ({ ...prev, status: nextStatus }));
        try {
            await updateStudent(student.id, { status: nextStatus });
            onRefresh?.();
        } catch (error: any) {
            setLocal((prev) => ({ ...prev, status: previousStatus }));
            setStudentActionError(codedErrorMessage("STUDENT-STATUS", error));
        } finally {
            setStatusUpdating(false);
        }
    };

    const handleStatusSelect = (nextStatus: Student["status"]) => {
        if (statusUpdating || local.status === nextStatus) return;
        if (nextStatus === "archived") {
            setArchiveConfirmOpen(true);
            return;
        }
        setStatusUpdating(true);
        void applyStudentStatus(nextStatus);
    };

    const confirmArchiveStudent = () => {
        if (statusUpdating) return;
        setArchiveConfirmOpen(false);
        setStatusUpdating(true);
        void applyStudentStatus("archived");
    };

    const handlePortalAction = () => {
        setStudentActionError(null);
        if (local.accountId) {
            setUnlinkConfirmOpen(true);
            return;
        }
        setActivateAccountModal(true);
    };

    const confirmUnlinkAccount = async () => {
        if (unlinkLoading) return;
        setUnlinkLoading(true);
        setStudentActionError(null);
        try {
            const result = await unlinkStudentAccount(student.id);
            setLocal((prev) => ({
                ...prev,
                accountId: result.accountId,
                email: result.email || prev.email,
            }));
            setUnlinkConfirmOpen(false);
            onRefresh?.();
        } catch (error: any) {
            setStudentActionError(codedErrorMessage("UNLINK-ACCOUNT", error));
        } finally {
            setUnlinkLoading(false);
        }
    };

    const portalActionLabel = local.accountId
        ? "Разорвать связь"
        : portalAccountExists
          ? "Работать вместе"
          : "Пригласить в Repeto";

    const { data: paymentsData, refetch: refetchPayments } = usePayments({
        studentId: student.id,
        limit: 100,
    });
    const studentPayments = paymentsData?.data || [];

    const openPaymentModal = (lesson?: Lesson) => {
        setPaymentLessonId(lesson?.id || null);
        setPaymentModal(true);
    };

    const handlePaymentCreated = () => {
        refetchPayments();
        onRefresh?.();
    };

    const { data: notesData, mutate: mutateNotes } = useStudentNotes(
        student.id
    );
    const notes = notesData?.data || [];

    const { data: hwData, mutate: mutateHomework } = useStudentHomework(
        student.id
    );
    const homeworks = hwData?.data || [];

    const activityItems = useMemo<StudentActivityItem[]>(() => {
        const lessonItems = studentLessons.map((lesson) => ({
            id: `lesson-${lesson.id}`,
            tone: "lesson" as const,
            timestamp: parseActivityTimestamp(lesson.date, lesson.startTime),
            title: `Занятие: ${lesson.subject}`,
            meta: `${lessonStatusLabel(lesson.status)} · ${lesson.startTime}-${lesson.endTime}`,
            amount: lesson.rate ? `${lesson.rate.toLocaleString("ru-RU")} ₽` : undefined,
        }));

        const paymentItems = studentPayments.map((payment) => ({
            id: `payment-${payment.id}`,
            tone: "payment" as const,
            timestamp: parseActivityTimestamp(payment.date),
            title: "Оплата",
            meta: payment.comment || paymentMethodLabel(payment.method),
            amount: `+${payment.amount.toLocaleString("ru-RU")} ₽`,
        }));

        const noteItems = notes.map((note: any) => ({
            id: `note-${note.id}`,
            tone: "note" as const,
            timestamp: parseActivityTimestamp(note.createdAt),
            title: "Заметка",
            meta: String(note.content || "").slice(0, 140),
        }));

        const homeworkItems = homeworks.map((homework: any) => {
            const status = String(homework.status || "PENDING").toUpperCase();
            const title = status === "COMPLETED"
                ? "Домашка сдана"
                : status === "OVERDUE"
                  ? "Домашка просрочена"
                  : "Домашка назначена";

            return {
                id: `homework-${homework.id}`,
                tone: "homework" as const,
                timestamp: parseActivityTimestamp(homework.createdAt || homework.dueAt),
                title,
                meta: String(homework.task || ""),
            };
        });

        return [...lessonItems, ...paymentItems, ...noteItems, ...homeworkItems];
    }, [homeworks, notes, studentLessons, studentPayments]);



    const renderTabContent = () => (
        <>
            {tab === "lessons" && (
                <>
                    {lessonActionError && (
                        <Text
                            as="div"
                            variant="body-2"
                            style={{ color: "var(--g-color-text-danger)", marginBottom: 12 }}
                        >
                            {lessonActionError}
                        </Text>
                    )}
                    <LessonHistory
                        lessons={studentLessons}
                        onLessonClick={setSelectedLesson}
                        onAdd={handleOpenCreateLesson}
                    />
                </>
            )}
            {tab === "profile" && (
                <ProfileTab
                    student={local}
                    onSave={handleInlineSave}
                    onRemind={() => {
                        setRemindInitialType(local.balance < 0 ? "payment" : "lesson");
                        setRemindModal(true);
                    }}
                    onPortalAction={handlePortalAction}
                    portalActionLabel={portalActionLabel}
                    portalActionBusy={unlinkLoading}
                    onStatusSelect={handleStatusSelect}
                    statusUpdating={statusUpdating}
                    studentActionError={studentActionError}
                />
            )}
            {tab === "payments" && (
                <PaymentHistory
                    payments={studentPayments}
                    lessons={studentLessons}
                    balance={local.balance}
                    onAdd={openPaymentModal}
                />
            )}
            {tab === "notes" && (
                <NotesTab
                    studentId={student.id}
                    studentName={student.name}
                    notes={notes.map((n: any) => {
                        const d = new Date(n.createdAt);
                        return {
                            id: n.id,
                            date: d.toLocaleDateString("ru-RU", {
                                day: "numeric",
                                month: "long",
                                year: "numeric",
                            }),
                            time: d.toLocaleTimeString("ru-RU", {
                                hour: "2-digit",
                                minute: "2-digit",
                            }),
                            text: n.content,
                        };
                    })}
                    onMutate={() => mutateNotes()}
                />
            )}
            {tab === "homework" && (
                <HomeworkTab
                    studentId={student.id}
                    lessons={studentLessons}
                    homeworks={homeworks.map((h: any) => {
                        const d = new Date(h.createdAt);
                        const status =
                            h.status === "done" ||
                            h.status === "overdue" ||
                            h.status === "not_done"
                                ? h.status
                                : String(h.status || "not_done").toLowerCase();

                        const normalizedStatus =
                            status === "done" || status === "completed"
                                ? "done"
                                : status === "overdue"
                                  ? "overdue"
                                  : "not_done";

                        const formatUploadDate = (value: unknown) => {
                            if (!value) {
                                return "—";
                            }
                            const parsed = new Date(String(value));
                            if (Number.isNaN(parsed.getTime())) {
                                return String(value);
                            }
                            return parsed.toLocaleDateString("ru-RU");
                        };

                        const parseUploadNameFromUrl = (url: string, index: number) => {
                            const fallback = `Файл ${index + 1}`;
                            const basename = url.split("/").pop() || fallback;

                            try {
                                return decodeURIComponent(basename || fallback);
                            } catch {
                                return basename || fallback;
                            }
                        };

                        const rawUploads = [
                            ...(Array.isArray(h.studentUploads) ? h.studentUploads : []),
                            ...(Array.isArray(h.attachments) ? h.attachments : []),
                        ];

                        const normalizedUploads = rawUploads
                            .map((upload: any, index: number) => {
                                if (typeof upload === "string") {
                                    return {
                                        id: upload || `upload-${index + 1}`,
                                        name: parseUploadNameFromUrl(upload, index),
                                        size: "—",
                                        uploadedAt: "—",
                                        expiresAt: "—",
                                        url: upload,
                                    };
                                }

                                const uploadUrl = upload.url || upload.fileUrl || "";

                                return {
                                    id: upload.id || uploadUrl || `upload-${index + 1}`,
                                    name:
                                        upload.name ||
                                        parseUploadNameFromUrl(uploadUrl || "", index),
                                    size: upload.size || "—",
                                    uploadedAt: formatUploadDate(
                                        upload.uploadedAt || upload.createdAt
                                    ),
                                    expiresAt: formatUploadDate(upload.expiresAt),
                                    url: uploadUrl,
                                };
                            })
                            .filter((upload: any) => !!upload.url);

                        const linkedLesson =
                            h.lesson && h.lesson.id
                                ? {
                                      id: h.lesson.id,
                                      subject: h.lesson.subject,
                                      scheduledAt: h.lesson.scheduledAt,
                                  }
                                : null;

                        return {
                            id: h.id,
                            date: d.toLocaleDateString("ru-RU", {
                                day: "numeric",
                                month: "short",
                                year: "numeric",
                            }),
                            task: h.task,
                            dueDate: h.dueAt
                                ? new Date(h.dueAt).toLocaleDateString("ru-RU")
                                : "—",
                            status: normalizedStatus,
                            lessonId: h.lessonId || linkedLesson?.id || undefined,
                            lesson: linkedLesson,
                            linkedFiles: (h.linkedFiles || []).map((file: any) => ({
                                id: file.id,
                                name: file.name,
                                url: file.url || file.cloudUrl || "#",
                                provider: file.cloudProvider || file.provider,
                                extension: file.extension || undefined,
                                size: file.size || undefined,
                            })),
                            studentUploads: normalizedUploads,
                        };
                    })}
                    onMutate={() => mutateHomework()}
                    onRemindHomework={() => {
                        setRemindInitialType("homework");
                        setRemindModal(true);
                    }}
                />
            )}
            {tab === "activity" && (
                <ActivityTab items={activityItems} />
            )}
        </>
    );

    const navItems = tabs.map((t) => ({
        key: t.value,
        label: t.title,
    }));

    return (
        <PageOverlay
            className="page-overlay--student-detail-bg"
            title={
                <StudentNameWithBadge
                    name={local.name}
                    hasRepetoAccount={Boolean(local.accountId)}
                    truncate
                    smartTruncate
                    smartTruncateMaxLength={16}
                    iconSize={15}
                    mirrorIcon
                />
            }
            breadcrumb="Ученики"
            nav={navItems}
            activeNav={tab}
            onNavChange={handleTabChange}
            backHref="/students"
        >
            {tab === "profile" ? (
                <div className="student-detail-surface">
                    {renderTabContent()}
                </div>
            ) : (
                <div className="student-detail-dashboard-shell">
                    {renderTabContent()}
                </div>
            )}

            <LessonPanelV2
                open={!!selectedLesson || scheduleModal}
                onClose={() => {
                    setSelectedLesson(null);
                    setScheduleModal(false);
                    setEditLesson(null);
                }}
                lesson={selectedLesson || editLesson}
                onSaved={async () => {
                    await refetchLessons();
                    onRefresh?.();
                }}
                onDeleted={handleDeleteLesson}
                defaultStudent={
                    selectedLesson || editLesson
                        ? undefined
                        : { id: student.id, name: student.name, accountId: student.accountId ?? null }
                }
            />
            <CreatePaymentModal
                visible={paymentModal}
                onClose={() => {
                    setPaymentModal(false);
                    setPaymentLessonId(null);
                }}
                onCreated={handlePaymentCreated}
                defaultStudent={{
                    id: student.id,
                    name: student.name,
                    accountId: student.accountId ?? null,
                }}
                defaultLessonId={paymentLessonId}
            />
            <ActivateAccountModal
                visible={activateAccountModal}
                onClose={() => setActivateAccountModal(false)}
                onSuccess={onRefresh}
                studentId={student.id}
                studentName={student.name}
                studentEmail={local.email}
                hasAccount={!!local.accountId || portalAccountExists}
            />
            <RemindModal
                visible={remindModal}
                onClose={() => setRemindModal(false)}
                onSent={onRefresh}
                studentId={student.id}
                studentName={student.name}
                hasRepetoAccount={Boolean(local.accountId)}
                hasDebt={local.balance < 0}
                hasParentEmail={!!local.parentEmail}
                hasTelegramChannel={Boolean(local.telegramChatId || local.telegram)}
                hasMaxChannel={Boolean(local.maxChatId)}
                estimatedDebtAmount={Math.max(0, -local.balance)}
                initialType={remindInitialType}
            />
            <AppDialog
                size="s"
                open={archiveConfirmOpen}
                onClose={() => setArchiveConfirmOpen(false)}
                caption="Перенести в архив"
            >
                <Alert
                    theme="warning"
                    view="filled"
                    corners="rounded"
                    title="Подтвердите перенос в архив"
                    message={
                        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                            <div>{`Ученик «${local.name}» будет перенесен в архив.`}</div>
                            <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, flexWrap: "wrap" }}>
                                <Button
                                    view="outlined"
                                    size="m"
                                    onClick={() => setArchiveConfirmOpen(false)}
                                    disabled={statusUpdating}
                                >
                                    Отмена
                                </Button>
                                <Button
                                    view="action"
                                    size="m"
                                    onClick={confirmArchiveStudent}
                                    loading={statusUpdating}
                                    disabled={statusUpdating}
                                >
                                    Перенести
                                </Button>
                            </div>
                        </div>
                    }
                />
            </AppDialog>
            <AppDialog
                size="s"
                open={unlinkConfirmOpen}
                onClose={() => {
                    if (!unlinkLoading) setUnlinkConfirmOpen(false);
                }}
                caption="Разорвать связь с профилем"
            >
                <Alert
                    theme="warning"
                    view="filled"
                    corners="rounded"
                    title="Подтвердите разрыв связи"
                    message={
                        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                            <div>
                                Ученик станет обычной записью CRM, и вы снова сможете редактировать его личные данные.
                            </div>
                            <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, flexWrap: "wrap" }}>
                                <Button
                                    view="outlined"
                                    size="m"
                                    onClick={() => setUnlinkConfirmOpen(false)}
                                    disabled={unlinkLoading}
                                >
                                    Отмена
                                </Button>
                                <Button
                                    view="flat-danger"
                                    size="m"
                                    onClick={confirmUnlinkAccount}
                                    loading={unlinkLoading}
                                    disabled={unlinkLoading}
                                >
                                    Разорвать связь
                                </Button>
                            </div>
                        </div>
                    }
                />
            </AppDialog>
        </PageOverlay>
    );
};

export default StudentDetailPage;
