import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { useMediaQuery } from "react-responsive";
import Layout from "@/components/Layout";
import Tabs from "@/components/Tabs";
import Icon from "@/components/Icon";
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
import { useHydrated } from "@/hooks/useHydrated";
import { useLessons } from "@/hooks/useLessons";
import { usePayments } from "@/hooks/usePayments";
import { useSettings } from "@/hooks/useSettings";
import { updateStudent } from "@/hooks/useStudents";
import {
    getInitials,
    getSubjectBgColor,
    formatBalance,
    getBalanceColor,
    getStatusLabel,
    getStatusColor,
} from "@/mocks/students";
import {
    useStudentNotes,
    useStudentHomework,
} from "@/hooks/useStudents";
import type { Student } from "@/types/student";
import type { Lesson } from "@/types/schedule";

const TAB_VALUES = ["lessons", "profile", "contacts", "payments", "notes", "homework"] as const;

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
        return typeof queryTab === "string" && TAB_VALUES.includes(queryTab as any)
            ? queryTab
            : "lessons";
    };

    // optimistic local copy so UI doesn't jerk on save
    const [local, setLocal] = useState<Student>(student);
    useEffect(() => setLocal(student), [student]);

    const [tab, setTab] = useState<string>(getTabFromQuery);
    const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null);
    const [scheduleModal, setScheduleModal] = useState(false);
    const [paymentModal, setPaymentModal] = useState(false);
    const [portalLinkModal, setPortalLinkModal] = useState(false);

    useEffect(() => {
        const nextTab = getTabFromQuery();
        setTab((prev) => (prev === nextTab ? prev : nextTab));
    }, [router.query.tab]);

    const handleTabChange = (nextTab: string) => {
        setTab(nextTab);
        const { tab: _tab, ...restQuery } = router.query;
        const nextQuery =
            nextTab === "lessons"
                ? restQuery
                : { ...restQuery, tab: nextTab };

        router.replace(
            {
                pathname: router.pathname,
                query: nextQuery,
            },
            undefined,
            { shallow: true }
        );
    };

    const handleInlineSave = async (data: Partial<Student>) => {
        // optimistic: apply patch locally first
        setLocal((prev) => ({ ...prev, ...data } as Student));
        try {
            await updateStudent(student.id, data as any);
            onRefresh?.();
        } catch {
            // revert on error
            setLocal(student);
        }
    };

    const { mounted } = useHydrated();

    const isTablet = useMediaQuery({ query: "(max-width: 1023px)" });

    const tabs = [
        { title: "Занятия", value: "lessons" },
        { title: "Профиль", value: "profile" },
        { title: "Контакты", value: "contacts" },
        { title: "Оплаты", value: "payments" },
        { title: "Заметки", value: "notes" },
        { title: "Домашка", value: "homework" },
    ];

    const menuItems = [
        { value: "lessons", title: "Занятия", content: "История уроков", icon: "calendar" },
        { value: "profile", title: "Профиль", content: "ФИО, предмет, ставка", icon: "profile" },
        { value: "contacts", title: "Контакты", content: "Телефон и родитель", icon: "email" },
        { value: "payments", title: "Оплаты", content: "Платежи и баланс", icon: "card" },
        { value: "notes", title: "Заметки", content: "Записи об ученике", icon: "edit" },
        { value: "homework", title: "Домашка", content: "Задания и проверка", icon: "document" },
    ];

    const { data: allLessons = [] } = useLessons({ studentId: student.id });
    const studentLessons = [...allLessons].sort((a, b) =>
        a.date > b.date ? -1 : 1
    );

    const { data: paymentsData, refetch: refetchPayments } = usePayments({
        studentId: student.id,
        limit: 100,
    });
    const studentPayments = paymentsData?.data || [];

    const handlePaymentCreated = () => {
        refetchPayments();
        onRefresh?.();
    };

    const { data: notesData, mutate: mutateNotes } = useStudentNotes(student.id);
    const notes = notesData?.data || [];

    const { data: hwData, mutate: mutateHomework } = useStudentHomework(student.id);
    const homeworks = hwData?.data || [];

    const handleMessage = () => {
        if (student.whatsapp) {
            const num = student.whatsapp.replace(/[^+\d]/g, "");
            window.open(`https://wa.me/${num}`, "_blank");
        } else if (student.phone) {
            window.open(`tel:${student.phone.replace(/[^+\d]/g, "")}`, "_self");
        }
    };

    const renderTabContent = () => (
        <>
            {tab === "lessons" && (
                <LessonHistory
                    lessons={studentLessons}
                    onLessonClick={setSelectedLesson}
                    onAdd={() => setScheduleModal(true)}
                />
            )}
            {tab === "profile" && (
                <ProfileTab
                    student={local}
                    onSave={handleInlineSave}
                />
            )}
            {tab === "contacts" && (
                <ContactsTab
                    student={local}
                    onSave={handleInlineSave}
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
                            date: d.toLocaleDateString("ru-RU", { day: "numeric", month: "long", year: "numeric" }),
                            time: d.toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" }),
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
                            date: d.toLocaleDateString("ru-RU", { day: "numeric", month: "short", year: "numeric" }),
                            task: h.task,
                            dueDate: h.dueAt ? new Date(h.dueAt).toLocaleDateString("ru-RU") : "—",
                            status: (h.status || "not_done").toLowerCase(),
                        };
                    })}
                    onMutate={() => mutateHomework()}
                />
            )}
        </>
    );

    return (
        <Layout title="Ученики" back>
            {mounted && isTablet ? (
                <>
                    <div className="mb-8 pt-4 text-center">
                        <div
                            className={`flex items-center justify-center w-[5.25rem] h-[5.25rem] mx-auto mb-2.5 rounded-full text-xl font-bold text-n-1 ${getSubjectBgColor(
                                local.subject
                            )}`}
                        >
                            {getInitials(local.name)}
                        </div>
                        <div className="text-h4 text-center">{local.name}</div>
                        <div className="text-sm">
                            {local.subject}
                            {local.grade ? ` · ${local.grade}${local.grade !== "Взрослый" ? " класс" : ""}` : ""}
                            {local.age ? ` · ${local.age} лет` : ""}
                        </div>
                    </div>
                    <Tabs
                        className="mb-6"
                        classButton="md:grow"
                        items={tabs}
                        value={tab}
                        setValue={handleTabChange}
                    />
                    {renderTabContent()}
                </>
            ) : (
                <div className="flex card lg:block">
                    <div className="shrink-0 w-96 pt-19 px-5 pb-7 border-r border-n-1 4xl:w-80 lg:w-full lg:border-none dark:border-white md:pt-12">
                        <div
                            className={`flex items-center justify-center w-21 h-21 mx-auto mb-3 rounded-full text-xl font-bold text-n-1 ${getSubjectBgColor(
                                local.subject
                            )}`}
                        >
                            {getInitials(local.name)}
                        </div>
                        <div className="flex items-center justify-center gap-3 mb-2">
                            <button
                                className="group flex items-center gap-1 text-xs text-n-1 transition-colors hover:text-purple-1 dark:text-white dark:hover:text-purple-1"
                                onClick={handleMessage}
                                title="Написать"
                            >
                                <Icon className="icon-16 fill-n-1 transition-colors group-hover:fill-purple-1 dark:fill-white" name="email" />
                            </button>
                            <button
                                className="group flex items-center gap-1 text-xs text-n-1 transition-colors hover:text-purple-1 dark:text-white dark:hover:text-purple-1"
                                onClick={() => setPortalLinkModal(true)}
                                title="Ссылка для ученика"
                            >
                                <Icon className="icon-16 fill-n-1 transition-colors group-hover:fill-purple-1 dark:fill-white" name="external-link" />
                            </button>
                        </div>
                        <div className="mb-1 text-center text-h5">
                            {local.name}
                        </div>
                        <div className="text-center text-sm">
                            {local.subject}
                            {local.grade ? ` · ${local.grade}${local.grade !== "Взрослый" ? " класс" : ""}` : ""}
                            {local.age ? ` · ${local.age} лет` : ""}
                        </div>
                        <div className="flex items-center justify-center mt-2 mb-10 gap-2">
                            <div className="flex items-center text-xs font-bold">
                                <div
                                    className={`w-2 h-2 mr-1.5 rounded-full ${getStatusColor(
                                        local.status
                                    )}`}
                                ></div>
                                {getStatusLabel(local.status)}
                            </div>
                            <span
                                className={`text-sm font-bold ${getBalanceColor(
                                    local.balance
                                )}`}
                            >
                                {formatBalance(local.balance)}
                            </span>
                        </div>
                        <div>
                            {menuItems.map((item) => (
                                <button
                                    className={`flex items-center w-full pl-7 py-4 pr-4 transition-colors tap-highlight-color hover:bg-background/60 dark:hover:bg-n-2 ${
                                        item.value === tab
                                            ? "bg-background dark:bg-n-2"
                                            : ""
                                    }`}
                                    key={item.value}
                                    onClick={() => handleTabChange(item.value)}
                                >
                                    <Icon
                                        className="shrink-0 icon-18 mr-6 dark:fill-white"
                                        name={item.icon}
                                    />
                                    <div className="grow text-left">
                                        <div className="mb-1 text-sm font-bold">
                                            {item.title}
                                        </div>
                                        <div className="text-xs">
                                            {item.content}
                                        </div>
                                    </div>
                                </button>
                            ))}
                        </div>

                    </div>
                    <div className="flex flex-col grow pt-6 pl-10 pr-6 pb-7 2xl:pl-8 xl:pl-6 lg:p-5">
                        {renderTabContent()}
                    </div>
                </div>
            )}
            <LessonDetailModal
                visible={!!selectedLesson}
                onClose={() => setSelectedLesson(null)}
                lesson={selectedLesson}
            />
            <CreateLessonModal
                visible={scheduleModal}
                onClose={() => setScheduleModal(false)}
                defaultStudent={{ id: student.id, name: student.name }}
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
        </Layout>
    );
};

export default StudentDetailPage;
