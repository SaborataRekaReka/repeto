import { useState } from "react";
import Layout from "@/components/Layout";
import LessonDetailModal from "@/components/LessonDetailModal";
import StatCards from "./StatCards";
import TodaySchedule from "./TodaySchedule";
import IncomeChart from "./IncomeChart";
import DebtList from "./DebtList";
import RecentPayments from "./RecentPayments";
import type { Lesson } from "@/types/schedule";

const DashboardPage = () => {
    const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null);

    return (
        <Layout title="Дашборд">
            <StatCards />
            <div className="flex -mx-2.5 lg:block lg:mx-0">
                <div className="w-[calc(66.666%-1.25rem)] mx-2.5 lg:w-full lg:mx-0 lg:mb-5">
                    <IncomeChart />
                    <RecentPayments />
                </div>
                <div className="w-[calc(33.333%-1.25rem)] mx-2.5 lg:w-full lg:mx-0">
                    <TodaySchedule
                        onLessonClick={(lesson) => setSelectedLesson(lesson)}
                    />
                    <div className="mt-5">
                        <DebtList />
                    </div>
                </div>
            </div>
            <LessonDetailModal
                visible={!!selectedLesson}
                onClose={() => setSelectedLesson(null)}
                lesson={selectedLesson}
            />
        </Layout>
    );
};

export default DashboardPage;
