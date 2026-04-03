import Icon from "@/components/Icon";
import type { Lesson } from "@/types/schedule";
import { shortName } from "@/mocks/schedule";

type LessonHistoryProps = {
    lessons: Lesson[];
    onLessonClick?: (lesson: Lesson) => void;
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

const statusClass = (status: Lesson["status"]) => {
    switch (status) {
        case "planned":
            return "label-stroke";
        case "completed":
            return "bg-green-1 text-n-1 px-2 py-0.5 text-xs font-bold";
        case "cancelled_student":
        case "cancelled_tutor":
            return "bg-pink-1 text-n-1 px-2 py-0.5 text-xs font-bold";
        case "no_show":
            return "bg-yellow-1 text-n-1 px-2 py-0.5 text-xs font-bold";
    }
};

const LessonHistory = ({ lessons, onLessonClick }: LessonHistoryProps) => (
    <div className="card">
        <div className="card-title">Занятия</div>
        {lessons.length === 0 ? (
            <div className="px-5 py-8 text-center text-sm text-n-3 dark:text-white/50">
                Занятий пока нет
            </div>
        ) : (
            <table className="table-custom -mt-0.25 border-none">
                <thead>
                    <tr>
                        <th className="th-custom">Дата</th>
                        <th className="th-custom">Время</th>
                        <th className="th-custom lg:hidden">Предмет</th>
                        <th className="th-custom text-right lg:hidden">
                            Ставка
                        </th>
                        <th className="th-custom">Статус</th>
                        <th className="th-custom w-13"></th>
                    </tr>
                </thead>
                <tbody>
                    {lessons.map((lesson) => (
                        <tr key={lesson.id}>
                            <td className="td-custom text-sm font-bold">
                                {lesson.date}
                            </td>
                            <td className="td-custom text-sm">
                                {lesson.startTime} – {lesson.endTime}
                            </td>
                            <td className="td-custom text-sm lg:hidden">
                                {lesson.subject}
                            </td>
                            <td className="td-custom text-sm font-bold text-right lg:hidden">
                                {lesson.rate.toLocaleString("ru-RU")} ₽
                            </td>
                            <td className="td-custom">
                                <div className={statusClass(lesson.status)}>
                                    {statusLabel(lesson.status)}
                                </div>
                            </td>
                            <td className="td-custom w-13 !px-3 text-right">
                                <button
                                    className="btn-transparent-dark btn-small btn-square"
                                    onClick={() => onLessonClick?.(lesson)}
                                >
                                    <Icon name="arrow-next" />
                                </button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        )}
    </div>
);

export default LessonHistory;
