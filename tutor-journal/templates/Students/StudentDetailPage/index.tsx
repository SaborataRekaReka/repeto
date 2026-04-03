import { useState } from "react";
import { useMediaQuery } from "react-responsive";
import Layout from "@/components/Layout";
import Tabs from "@/components/Tabs";
import LessonDetailModal from "@/components/LessonDetailModal";
import Profile from "./Profile";
import LessonHistory from "./LessonHistory";
import { useHydrated } from "@/hooks/useHydrated";
import { lessons } from "@/mocks/schedule";
import {
    getInitials,
    getSubjectBgColor,
    formatBalance,
    getBalanceColor,
    getStatusLabel,
    getStatusColor,
} from "@/mocks/students";
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
    ];

    const studentLessons = lessons
        .filter((l) => l.studentName === student.name)
        .sort((a, b) => (a.date > b.date ? -1 : 1));

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
                    {tab === "lessons" && (
                        <LessonHistory
                            lessons={studentLessons}
                            onLessonClick={setSelectedLesson}
                        />
                    )}
                    {tab === "payments" && (
                        <div className="card px-5 py-8 text-center text-sm text-n-3 dark:text-white/50">
                            Раздел оплат в разработке
                        </div>
                    )}
                    {tab === "notes" && (
                        <div className="card px-5 py-6">
                            <div className="text-sm">
                                {student.notes || "Заметок пока нет"}
                            </div>
                        </div>
                    )}
                </>
            ) : (
                <div className="flex pt-4">
                    <div className="shrink-0 w-[18rem] 4xl:w-[14.68rem]">
                        <Profile student={student} />
                    </div>
                    <div className="w-[calc(100%-18rem)] pl-[5.125rem] 4xl:w-[calc(100%-14.68rem)] 2xl:pl-16 xl:pl-10">
                        <LessonHistory
                            lessons={studentLessons}
                            onLessonClick={setSelectedLesson}
                        />
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
