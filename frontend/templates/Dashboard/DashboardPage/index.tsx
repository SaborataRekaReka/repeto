import { useState } from "react";
import Layout from "@/components/Layout";
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
        <Layout title="Дашборд">
            <StatCards />
            <div className="grid grid-cols-3 gap-5 lg:grid-cols-1">
                <div className="col-span-2 lg:col-span-1">
                    <IncomeChart />
                    <div className="grid grid-cols-2 gap-5 mt-5 md:grid-cols-1">
                        <ConversionRate />
                        <ExpiringPackages />
                    </div>
                    <div className="mt-5">
                        <RecentPayments />
                    </div>
                </div>
                <div>
                    <TodaySchedule
                        onLessonClick={(lesson) => setSelectedLesson(lesson)}
                    />
                    <div className="mt-5">
                        <WeekSchedule
                            onLessonClick={(lesson) =>
                                setSelectedLesson(lesson)
                            }
                        />
                    </div>
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
