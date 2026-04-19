import { useEffect, useState } from "react";
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
import { useLessons, deleteLesson } from "@/hooks/useLessons";
import { usePayments } from "@/hooks/usePayments";
import { useSettings } from "@/hooks/useSettings";
import { codedErrorMessage } from "@/lib/errorCodes";
import {
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
] as const;

const tabs = [
    { title: "Профиль", value: "profile" },
    { title: "Занятия", value: "lessons" },
    { title: "Оплаты", value: "payments" },
    { title: "Заметки", value: "notes" },
    { title: "Домашка", value: "homework" },
];

type StudentDetailPageProps = {
    student: Student;
    onRefresh?: () => void;
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
    const [activateAccountModal, setActivateAccountModal] = useState(false);
    const [remindModal, setRemindModal] = useState(false);
    const [optimisticRemovedLessonIds, setOptimisticRemovedLessonIds] = useState<string[]>([]);
    const [lessonActionError, setLessonActionError] = useState<string | null>(null);
    const [statusUpdating, setStatusUpdating] = useState(false);
    const [archiveConfirmOpen, setArchiveConfirmOpen] = useState(false);
    const [studentActionError, setStudentActionError] = useState<string | null>(null);

    useEffect(() => {
        const nextTab = getTabFromQuery();
        setTab((prev) => (prev === nextTab ? prev : nextTab));
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [router.query.tab]);

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

    const { data: paymentsData, refetch: refetchPayments } = usePayments({
        studentId: student.id,
        limit: 100,
    });
    const studentPayments = paymentsData?.data || [];

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
                    onRemind={() => setRemindModal(true)}
                    onActivateAccount={() => setActivateAccountModal(true)}
                    onStatusSelect={handleStatusSelect}
                    statusUpdating={statusUpdating}
                    studentActionError={studentActionError}
                />
            )}
            {tab === "payments" && (
                <PaymentHistory
                    payments={studentPayments}
                    onAdd={() => setPaymentModal(true)}
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
                />
            )}
        </>
    );

    const navItems = tabs.map((t) => ({
        key: t.value,
        label: t.title,
    }));

    return (
        <PageOverlay
            title={
                <StudentNameWithBadge
                    name={local.name}
                    hasRepetoAccount={Boolean(local.accountId)}
                />
            }
            breadcrumb="Ученики"
            nav={navItems}
            activeNav={tab}
            onNavChange={handleTabChange}
            backHref="/students"
        >
            {renderTabContent()}

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
                onClose={() => setPaymentModal(false)}
                onCreated={handlePaymentCreated}
                defaultStudent={{
                    id: student.id,
                    name: student.name,
                    accountId: student.accountId ?? null,
                }}
            />
            <ActivateAccountModal
                visible={activateAccountModal}
                onClose={() => setActivateAccountModal(false)}
                onSuccess={onRefresh}
                studentId={student.id}
                studentName={student.name}
                studentEmail={local.email}
                hasAccount={!!local.accountId}
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
        </PageOverlay>
    );
};

export default StudentDetailPage;
