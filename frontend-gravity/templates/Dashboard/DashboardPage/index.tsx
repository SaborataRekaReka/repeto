import { useState } from "react";
import GravityLayout from "@/components/GravityLayout";
import LessonDetailModal from "@/components/LessonDetailModal";
import StatCards from "./StatCards";
import TodaySchedule from "./TodaySchedule";
import WeekSchedule from "./WeekSchedule";
import IncomeChart from "./IncomeChart";
import ConversionRate from "./ConversionRate";
import ExpiringPackages from "./ExpiringPackages";
import DebtList from "./DebtList";
import RecentPayments from "./RecentPayments";
import type { Lesson } from "@/types/schedule";

const DashboardPage = () => {
    const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null);

    return (
        <GravityLayout title="Дашборд">
            <StatCards />
            <div className="repeto-dashboard-grid">
                <div className="repeto-dashboard-grid__main">
                    <IncomeChart />
                    <div className="repeto-two-col">
                        <ConversionRate />
                        <ExpiringPackages />
                    </div>
                    <RecentPayments />
                </div>
                <div className="repeto-dashboard-grid__aside">
                    <TodaySchedule
                        onLessonClick={(lesson) => setSelectedLesson(lesson)}
                    />
                    <WeekSchedule
                        onLessonClick={(lesson) => setSelectedLesson(lesson)}
                    />
                    <DebtList />
                </div>
            </div>
            <LessonDetailModal
                visible={!!selectedLesson}
                onClose={() => setSelectedLesson(null)}
                lesson={selectedLesson}
            />
        </GravityLayout>
    );
};

export default DashboardPage;
