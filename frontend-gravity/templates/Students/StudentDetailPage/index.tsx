import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import {
    Card,
    Text,
    Button,
    Icon,
    Label,
} from "@gravity-ui/uikit";
import { Envelope, Link, Calendar, Person, CreditCard, Pencil, CircleCheck, Comment } from "@gravity-ui/icons";
import type { IconData } from "@gravity-ui/uikit";
import GravityLayout from "@/components/GravityLayout";
import LessonDetailModal from "@/components/LessonDetailModal";
import CreateLessonModal from "@/components/CreateLessonModal";
import CreatePaymentModal from "@/components/CreatePaymentModal";
import PortalLinkModal from "./PortalLinkModal";
import LessonHistory from "./LessonHistory";
import PaymentHistory from "./PaymentHistory";
import ProfileTab from "./ProfileTab";
import ContactsTab from "./ContactsTab";
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
import { sendDebtReminder } from "@/hooks/useNotifications";
import {
    getInitials,
    formatBalance,
    getStatusLabel,
} from "@/mocks/students";
import type { Student } from "@/types/student";
import type { Lesson } from "@/types/schedule";

const TAB_VALUES = [
    "lessons",
    "profile",
    "contacts",
    "payments",
    "notes",
    "homework",
] as const;

const tabs = [
    { title: "Занятия", value: "lessons", icon: Calendar },
    { title: "Профиль", value: "profile", icon: Person },
    { title: "Контакты", value: "contacts", icon: Envelope },
    { title: "Оплаты", value: "payments", icon: CreditCard },
    { title: "Заметки", value: "notes", icon: Pencil },
    { title: "Домашка", value: "homework", icon: CircleCheck },
];

const statusTheme = (
    status: Student["status"]
): "success" | "normal" => {
    switch (status) {
        case "active":
            return "success";
        default:
            return "normal";
    }
};

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
            : "lessons";
    };

    const [local, setLocal] = useState<Student>(student);
    useEffect(() => setLocal(student), [student]);

    const [tab, setTab] = useState<string>(getTabFromQuery);
    const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null);
    const [scheduleModal, setScheduleModal] = useState(false);
    const [editLesson, setEditLesson] = useState<Lesson | null>(null);
    const [paymentModal, setPaymentModal] = useState(false);
    const [portalLinkModal, setPortalLinkModal] = useState(false);
    const [debtSending, setDebtSending] = useState(false);
    const [optimisticRemovedLessonIds, setOptimisticRemovedLessonIds] = useState<string[]>([]);
    const [lessonActionError, setLessonActionError] = useState<string | null>(null);

    useEffect(() => {
        const nextTab = getTabFromQuery();
        setTab((prev) => (prev === nextTab ? prev : nextTab));
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [router.query.tab]);

    const handleTabChange = (nextTab: string) => {
        setTab(nextTab);
        const { tab: _tab, ...restQuery } = router.query;
        const nextQuery =
            nextTab === "lessons"
                ? restQuery
                : { ...restQuery, tab: nextTab };
        router.replace(
            { pathname: router.pathname, query: nextQuery },
            undefined,
            { shallow: true }
        );
    };

    const handleInlineSave = async (data: Partial<Student>) => {
        setLocal((prev) => ({ ...prev, ...data } as Student));
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

    const handleMessage = () => {
        if (student.whatsapp) {
            const num = student.whatsapp.replace(/[^+\d]/g, "");
            window.open(`https://wa.me/${num}`, "_blank");
        } else if (student.phone) {
            window.open(
                `tel:${student.phone.replace(/[^+\d]/g, "")}`,
                "_self"
            );
        }
    };

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
                <ProfileTab student={local} onSave={handleInlineSave} />
            )}
            {tab === "contacts" && (
                <ContactsTab student={local} onSave={handleInlineSave} />
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
                            status: (h.status || "not_done").toLowerCase(),
                        };
                    })}
                    onMutate={() => mutateHomework()}
                />
            )}
        </>
    );

    return (
        <GravityLayout title={local.name} back>
            <div className="repeto-student-layout">
                {/* Sidebar */}
                <aside className="repeto-student-sidebar">
                    {/* Avatar + info */}
                    <div
                        style={{
                            textAlign: "center",
                            padding: "28px 20px 20px",
                        }}
                    >
                        <div
                            className="repeto-avatar repeto-avatar--lg"
                            style={{ margin: "0 auto 14px" }}
                        >
                            {getInitials(local.name)}
                        </div>
                        <Text
                            variant="subheader-2"
                            as="div"
                            style={{ marginBottom: 4 }}
                        >
                            {local.name}
                        </Text>
                        <Text
                            variant="body-1"
                            color="secondary"
                            as="div"
                            style={{ marginBottom: 12 }}
                        >
                            {local.subject}
                            {local.grade
                                ? ` · ${local.grade}${
                                      local.grade !== "Взрослый" ? " кл." : ""
                                  }`
                                : ""}
                        </Text>
                        <div
                            style={{
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                gap: 8,
                                marginBottom: 16,
                            }}
                        >
                            <Label
                                theme={statusTheme(local.status)}
                                size="xs"
                            >
                                {getStatusLabel(local.status)}
                            </Label>
                            <Text
                                variant="body-2"
                                style={{
                                    color:
                                        local.balance < 0
                                            ? "#D16B8F"
                                            : local.balance > 0
                                            ? "#22C55E"
                                            : undefined,
                                }}
                            >
                                {formatBalance(local.balance)}
                            </Text>
                        </div>
                        <div
                            style={{
                                display: "flex",
                                justifyContent: "center",
                                gap: 8,
                            }}
                        >
                            <Button
                                view="outlined"
                                size="s"
                                onClick={handleMessage}
                            >
                                <Icon
                                    data={Envelope as IconData}
                                    size={14}
                                />
                                Написать
                            </Button>
                            <Button
                                view="outlined"
                                size="s"
                                onClick={() => setPortalLinkModal(true)}
                            >
                                <Icon data={Link as IconData} size={14} />
                                Портал
                            </Button>
                            {local.balance < 0 && (
                                <Button
                                    view="outlined"
                                    size="s"
                                    loading={debtSending}
                                    onClick={async () => {
                                        setDebtSending(true);
                                        try {
                                            await sendDebtReminder(student.id);
                                        } catch (e) {
                                            console.error("Debt reminder failed", e);
                                        } finally {
                                            setDebtSending(false);
                                        }
                                    }}
                                >
                                    <Icon data={Comment as IconData} size={14} />
                                    Напомнить
                                </Button>
                            )}
                        </div>
                    </div>

                    {/* Nav */}
                    <nav style={{ padding: "8px", display: "flex", flexDirection: "column", gap: 2 }}>
                        {tabs.map((t) => (
                            <button
                                key={t.value}
                                onClick={() => handleTabChange(t.value)}
                                style={{
                                    display: "flex", alignItems: "center", gap: 12,
                                    padding: "10px 16px", borderRadius: 10,
                                    border: "none", cursor: "pointer", width: "100%", textAlign: "left",
                                    background: tab === t.value ? "rgba(174,122,255,0.08)" : "transparent",
                                    color: tab === t.value ? "var(--g-color-text-brand)" : "var(--g-color-text-primary)",
                                    fontWeight: tab === t.value ? 600 : 400, fontSize: 14,
                                    transition: "all 0.15s",
                                }}
                                onMouseEnter={(e) => { if (tab !== t.value) e.currentTarget.style.background = "var(--g-color-base-simple-hover)"; }}
                                onMouseLeave={(e) => { if (tab !== t.value) e.currentTarget.style.background = "transparent"; }}
                            >
                                <Icon data={t.icon as IconData} size={18} />
                                {t.title}
                            </button>
                        ))}
                    </nav>
                </aside>

                {/* Content */}
                <div className="repeto-student-content">
                    {/* Mobile tabs */}
                    <div className="repeto-student-mobile-tabs">
                        <div
                            className="repeto-students-toolbar__tabs"
                            style={{ width: "100%", overflowX: "auto" }}
                        >
                            {tabs.map((t) => (
                                <button
                                    key={t.value}
                                    className={`repeto-students-toolbar__tab${
                                        tab === t.value
                                            ? " repeto-students-toolbar__tab--active"
                                            : ""
                                    }`}
                                    onClick={() => handleTabChange(t.value)}
                                >
                                    {t.title}
                                </button>
                            ))}
                        </div>
                    </div>

                    {renderTabContent()}
                </div>
            </div>

            <LessonDetailModal
                visible={!!selectedLesson}
                onClose={() => setSelectedLesson(null)}
                lesson={selectedLesson}
                onEdit={handleEditLesson}
                onDelete={handleDeleteLesson}
                onUpdated={refetchLessons}
            />
            <CreateLessonModal
                visible={scheduleModal}
                onClose={() => {
                    setScheduleModal(false);
                    setEditLesson(null);
                }}
                onCreated={async () => {
                    await refetchLessons();
                    onRefresh?.();
                }}
                lesson={editLesson}
                defaultStudent={editLesson ? undefined : { id: student.id, name: student.name }}
            />
            <CreatePaymentModal
                visible={paymentModal}
                onClose={() => setPaymentModal(false)}
                onCreated={handlePaymentCreated}
                defaultStudent={{ id: student.id, name: student.name }}
            />
            <PortalLinkModal
                visible={portalLinkModal}
                onClose={() => setPortalLinkModal(false)}
                studentId={student.id}
                studentName={student.name}
                tutorSlug={tutorSlug}
            />
        </GravityLayout>
    );
};

export default StudentDetailPage;
