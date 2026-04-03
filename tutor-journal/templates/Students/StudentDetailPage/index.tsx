import { useState } from "react";
import { useMediaQuery } from "react-responsive";
import Layout from "@/components/Layout";
import Tabs from "@/components/Tabs";
import LessonDetailModal from "@/components/LessonDetailModal";
import Profile from "./Profile";
import LessonHistory from "./LessonHistory";
import PaymentHistory from "./PaymentHistory";
import NotesTab from "./NotesTab";
import HomeworkTab from "./HomeworkTab";
import { useHydrated } from "@/hooks/useHydrated";
import { lessons } from "@/mocks/schedule";
import { payments } from "@/mocks/finance-tutor";
import {
    getInitials,
    getSubjectBgColor,
    formatBalance,
    getBalanceColor,
    getStatusLabel,
    getStatusColor,
} from "@/mocks/students";
import {
    studentNotes,
    studentHomeworks,
} from "@/mocks/student-details";
import type { Student } from "@/types/student";
import type { Lesson } from "@/types/schedule";

type StudentDetailPageProps = {
    student: Student;
};

const StudentDetailPage = ({ student }: StudentDetailPageProps) => {
    const [tab, setTab] = useState<string>("lessons");
    const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null);
    const { mounted } = useHydrated();

    const isTablet = useMediaQuery({ query: "(max-width: 1023px)" });

    const tabs = [
        { title: "Занятия", value: "lessons" },
        { title: "Оплаты", value: "payments" },
        { title: "Заметки", value: "notes" },
        { title: "Домашка", value: "homework" },
    ];

    const studentLessons = lessons
        .filter((l) => l.studentName === student.name)
        .sort((a, b) => (a.date > b.date ? -1 : 1));

    const studentPayments = payments.filter(
        (p) => p.studentId === student.id
    );

    const notes = studentNotes.filter(
        (n) => n.studentId === student.id
    );

    const homeworks = studentHomeworks.filter(
        (h) => h.studentId === student.id
    );

    const renderTabContent = () => (
        <>
            {tab === "lessons" && (
                <LessonHistory
                    lessons={studentLessons}
                    onLessonClick={setSelectedLesson}
                />
            )}
            {tab === "payments" && (
                <PaymentHistory payments={studentPayments} />
            )}
            {tab === "notes" && (
                <NotesTab
                    studentName={student.name}
                    notes={notes.map((n) => ({
                        id: n.id,
                        date: n.date,
                        time: n.time,
                        text: n.text,
                    }))}
                />
            )}
            {tab === "homework" && (
                <HomeworkTab
                    homeworks={homeworks.map((h) => ({
                        id: h.id,
                        date: h.date,
                        task: h.task,
                        dueDate: h.dueDate,
                        status: h.status,
                    }))}
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
                                student.subject
                            )}`}
                        >
                            {getInitials(student.name)}
                        </div>
                        <div className="text-h4">{student.name}</div>
                        <div className="text-sm">
                            {student.subject} · {student.grade}
                            {student.grade !== "Взрослый" ? " класс" : ""}
                        </div>
                    </div>
                    <Tabs
                        className="mb-6"
                        classButton="md:grow"
                        items={tabs}
                        value={tab}
                        setValue={setTab}
                    />
                    {renderTabContent()}
                </>
            ) : (
                <div className="flex pt-4">
                    <div className="shrink-0 w-[18rem] 4xl:w-[14.68rem]">
                        <Profile student={student} />
                    </div>
                    <div className="w-[calc(100%-18rem)] pl-[5.125rem] 4xl:w-[calc(100%-14.68rem)] 2xl:pl-16 xl:pl-10">
                        <Tabs
                            className="mb-6"
                            items={tabs}
                            value={tab}
                            setValue={setTab}
                        />
                        {renderTabContent()}
                    </div>
                </div>
            )}
            <LessonDetailModal
                visible={!!selectedLesson}
                onClose={() => setSelectedLesson(null)}
                lesson={selectedLesson}
            />
        </Layout>
    );
};

export default StudentDetailPage;
