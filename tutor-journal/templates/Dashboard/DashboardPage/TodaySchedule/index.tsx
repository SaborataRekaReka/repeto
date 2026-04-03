import Link from "next/link";
import Icon from "@/components/Icon";
import { todayLessons } from "@/mocks/tutorDashboard";
import { shortName } from "@/mocks/schedule";
import type { Lesson } from "@/types/schedule";

type TodayScheduleProps = {
    onLessonClick: (lesson: Lesson) => void;
};

const statusLabel = (status: Lesson["status"]) => {
    switch (status) {
        case "planned":
            return "Запланировано";
        case "completed":
            return "Проведено";
        case "cancelled_student":
        case "cancelled_tutor":
            return "Отменено";
        case "no_show":
            return "Не явился";
    }
};

const statusColor = (status: Lesson["status"]) => {
    switch (status) {
        case "planned":
            return "bg-n-4/50 text-n-1 dark:bg-white/20 dark:text-white";
        case "completed":
            return "bg-green-1 text-n-1";
        case "cancelled_student":
        case "cancelled_tutor":
            return "bg-pink-1 text-n-1";
        case "no_show":
            return "bg-yellow-1 text-n-1";
    }
};

const TodaySchedule = ({ onLessonClick }: TodayScheduleProps) => (
    <div className="card">
        <div className="card-head">
            <div className="mr-auto text-h6">Сегодня, 3 апреля</div>
            <Link
                href="/schedule"
                className="text-xs font-bold transition-colors hover:text-purple-1"
            >
                Всё расписание →
            </Link>
        </div>
        {todayLessons.length === 0 ? (
            <div className="px-5 py-10 text-center">
                <div className="mb-2 text-lg">Сегодня занятий нет 🎉</div>
                <Link
                    href="/schedule"
                    className="btn-purple btn-small inline-flex"
                >
                    <Icon name="add-circle" />
                    <span>Запланировать</span>
                </Link>
            </div>
        ) : (
            <div>
                {todayLessons.map((lesson) => (
                    <button
                        className="flex items-center w-full px-4 py-3 border-t border-n-1 first:border-none transition-colors hover:bg-background text-left dark:border-white dark:hover:bg-white/5"
                        key={lesson.id}
                        onClick={() => onLessonClick(lesson)}
                    >
                        <div
                            className={`shrink-0 w-1.5 h-1.5 rounded-full mr-3 ${
                                lesson.color === "green"
                                    ? "bg-green-1"
                                    : lesson.color === "yellow"
                                    ? "bg-yellow-1"
                                    : "bg-purple-1"
                            }`}
                        ></div>
                        <div className="grow min-w-0">
                            <div className="flex justify-between items-center mb-0.5">
                                <div className="text-sm font-bold truncate">
                                    {shortName(lesson.studentName)}
                                </div>
                                <div className="shrink-0 ml-2 text-xs text-n-3 dark:text-white/50">
                                    {lesson.startTime} – {lesson.endTime}
                                </div>
                            </div>
                            <div className="flex justify-between items-center">
                                <div className="text-xs text-n-3 dark:text-white/50">
                                    {lesson.subject}
                                </div>
                                <div
                                    className={`shrink-0 px-2 py-0.5 text-xs font-bold ${statusColor(
                                        lesson.status
                                    )}`}
                                >
                                    {statusLabel(lesson.status)}
                                </div>
                            </div>
                        </div>
                    </button>
                ))}
            </div>
        )}
    </div>
);

export default TodaySchedule;
