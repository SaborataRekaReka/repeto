import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/router";
import Layout from "@/components/Layout";
import Icon from "@/components/Icon";
import Tabs from "@/components/Tabs";
import LessonDetailModal from "@/components/LessonDetailModal";
import CreateLessonModal from "@/components/CreateLessonModal";
import Month from "./Month";
import Week from "./Week";
import Day from "./Day";
import AvailabilityEditor from "./AvailabilityEditor";
import { MONTH_NAMES } from "@/mocks/schedule";
import { useLessons } from "@/hooks/useLessons";
import { toLocalDateKey } from "@/lib/dates";
import type { Lesson } from "@/types/schedule";

const CalendarPage = () => {
    const router = useRouter();
    const [type, setType] = useState<string>("month");
    const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null);
    const [createModal, setCreateModal] = useState(false);

    const [editLesson, setEditLesson] = useState<Lesson | null>(null);

    const handleEdit = (lesson: Lesson) => {
        setEditLesson(lesson);
        setCreateModal(true);
    };

    const handleDelete = (lessonId: string) => {
        console.log("TODO: delete lesson from backend", lessonId);
    };

    useEffect(() => {
        if (router.query.create === "1") {
            setCreateModal(true);
            router.replace("/schedule", undefined, { shallow: true });
        }
    }, [router.query.create]);

    // Current date for calendar navigation (start at today)
    const [currentDate, setCurrentDate] = useState(new Date());

    // Calculate date range for API fetch based on view type
    const dateRange = useMemo(() => {
        const d = currentDate;
        if (type === "month") {
            const from = new Date(d.getFullYear(), d.getMonth() - 1, 20);
            const to = new Date(d.getFullYear(), d.getMonth() + 1, 10);
            return { from: toLocalDateKey(from), to: toLocalDateKey(to) };
        }
        if (type === "week") {
            const start = new Date(d);
            const dow = start.getDay();
            start.setDate(start.getDate() - (dow === 0 ? 6 : dow - 1));
            const end = new Date(start);
            end.setDate(end.getDate() + 6);
            return { from: toLocalDateKey(start), to: toLocalDateKey(end) };
        }
        return { from: toLocalDateKey(d), to: toLocalDateKey(d) };
    }, [currentDate, type]);

    const { data: lessons = [] } = useLessons(dateRange);

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
            <AvailabilityEditor />
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
            {type === "month" && <Month currentDate={currentDate} onLessonClick={setSelectedLesson} lessons={lessons} />}
            {type === "week" && <Week currentDate={currentDate} onLessonClick={setSelectedLesson} lessons={lessons} />}
            {type === "day" && <Day currentDate={currentDate} onLessonClick={setSelectedLesson} lessons={lessons} />}
            <LessonDetailModal
                visible={!!selectedLesson}
                onClose={() => setSelectedLesson(null)}
                lesson={selectedLesson}
                onEdit={handleEdit}
                onDelete={handleDelete}
            />
            <CreateLessonModal
                visible={createModal}
                onClose={() => {
                    setCreateModal(false);
                    setEditLesson(null);
                }}
                lesson={editLesson}
            />
        </Layout>
    );
};

export default CalendarPage;
