import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import Layout from "@/components/Layout";
import Icon from "@/components/Icon";
import Tabs from "@/components/Tabs";
import LessonDetailModal from "@/components/LessonDetailModal";
import CreateLessonModal from "@/components/CreateLessonModal";
import Month from "./Month";
import Week from "./Week";
import Day from "./Day";
import { MONTH_NAMES } from "@/mocks/schedule";
import type { Lesson } from "@/types/schedule";

const CalendarPage = () => {
    const router = useRouter();
    const [type, setType] = useState<string>("month");
    const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null);
    const [createModal, setCreateModal] = useState(false);

    useEffect(() => {
        if (router.query.create === "1") {
            setCreateModal(true);
            router.replace("/schedule", undefined, { shallow: true });
        }
    }, [router.query.create]);

    // Current date for calendar navigation (start at April 3, 2026)
    const [currentDate, setCurrentDate] = useState(new Date(2026, 3, 3));

    const types = [
        { title: "Месяц", value: "month" },
        { title: "Неделя", value: "week" },
        { title: "День", value: "day" },
    ];

    const navigate = (direction: -1 | 1) => {
        setCurrentDate((prev) => {
            const d = new Date(prev);
            if (type === "month") {
                d.setMonth(d.getMonth() + direction);
            } else if (type === "week") {
                d.setDate(d.getDate() + direction * 7);
            } else {
                d.setDate(d.getDate() + direction);
            }
            return d;
        });
    };

    const formatDateLabel = () => {
        if (type === "month") {
            return `${MONTH_NAMES[currentDate.getMonth()]} ${currentDate.getFullYear()}`;
        }
        if (type === "week") {
            const weekStart = new Date(currentDate);
            const dayOfWeek = weekStart.getDay();
            const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
            weekStart.setDate(weekStart.getDate() + diff);
            const weekEnd = new Date(weekStart);
            weekEnd.setDate(weekEnd.getDate() + 6);

            const startDay = weekStart.getDate();
            const endDay = weekEnd.getDate();
            const startMonth = MONTH_NAMES[weekStart.getMonth()]
                .substring(0, 3)
                .toLowerCase();
            const endMonth = MONTH_NAMES[weekEnd.getMonth()]
                .substring(0, 3)
                .toLowerCase();
            return `${startDay} ${startMonth} – ${endDay} ${endMonth}, ${weekEnd.getFullYear()}`;
        }
        // day
        const day = currentDate.getDate();
        const monthGen = [
            "января", "февраля", "марта", "апреля", "мая", "июня",
            "июля", "августа", "сентября", "октября", "ноября", "декабря",
        ][currentDate.getMonth()];
        return `${day} ${monthGen} ${currentDate.getFullYear()}`;
    };

    return (
        <Layout title="Расписание">
            <div className="relative flex mb-6 lg:flex-wrap md:mb-5">
                <Tabs
                    className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 lg:static lg:w-full lg:translate-x-0 lg:translate-y-0 lg:ml-0 lg:mb-4"
                    classButton="lg:ml-0 lg:flex-1"
                    items={types}
                    value={type}
                    setValue={setType}
                />
                <div className="flex items-center md:w-full md:justify-between">
                    <button
                        className="btn-stroke btn-square btn-small mr-1 md:mr-0"
                        onClick={() => navigate(-1)}
                    >
                        <Icon name="arrow-prev" />
                    </button>
                    <button
                        className="btn-stroke btn-square btn-small md:order-3"
                        onClick={() => navigate(1)}
                    >
                        <Icon name="arrow-next" />
                    </button>
                    <div className="ml-4.5 text-h6 md:ml-0">
                        {formatDateLabel()}
                    </div>
                </div>
                <button
                    className="btn-purple btn-small ml-auto md:hidden"
                    onClick={() => setCreateModal(true)}
                >
                    <Icon name="add-circle" />
                    <span>Новое занятие</span>
                </button>
            </div>
            {type === "month" && <Month currentDate={currentDate} onLessonClick={setSelectedLesson} />}
            {type === "week" && <Week currentDate={currentDate} onLessonClick={setSelectedLesson} />}
            {type === "day" && <Day currentDate={currentDate} onLessonClick={setSelectedLesson} />}
            <LessonDetailModal
                visible={!!selectedLesson}
                onClose={() => setSelectedLesson(null)}
                lesson={selectedLesson}
            />
            <CreateLessonModal
                visible={createModal}
                onClose={() => setCreateModal(false)}
            />
        </Layout>
    );
};

export default CalendarPage;
