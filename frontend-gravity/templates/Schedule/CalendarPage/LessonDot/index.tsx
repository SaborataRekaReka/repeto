import type { Lesson } from "@/types/schedule";
import { shortName } from "@/lib/formatters";
import StudentNameWithBadge from "@/components/StudentNameWithBadge";

type LessonDotProps = {
    className?: string;
    classTitle?: string;
    lesson: Lesson;
    time?: string;
    onClick?: (lesson: Lesson) => void;
};

function getStatusDotClass(status: Lesson["status"]) {
    switch (status) {
        case "planned":
            return "bg-green-1";
        case "completed":
            return "bg-purple-1";
        case "cancelled_student":
        case "cancelled_tutor":
            return "bg-pink-1";
        case "no_show":
            return "bg-purple-1";
        case "reschedule_pending":
            return "bg-n-3 dark:bg-white/50";
    }
}

const LessonDot = ({ className, classTitle, lesson, time, onClick }: LessonDotProps) => {
    return (
        <button
            className={`relative flex items-center w-full pl-2.5 pr-4 py-1 bg-surface-page transition-colors text-xs outline-none hover:text-purple-2 last:mb-0 ${className}`}
            onClick={() => onClick?.(lesson)}
        >
            <div
                className={`shrink-0 w-1.5 h-1.5 rounded-full ${getStatusDotClass(
                    lesson.status
                )}`}
            ></div>
            {time && (
                <div className="min-w-[3.3rem] ml-2.5 mr-3 text-left text-n-3 dark:text-white/75">
                    {time}
                </div>
            )}
            <div
                className={`ml-2 truncate text-xs font-bold ${classTitle}`}
            >
                <StudentNameWithBadge
                    name={shortName(lesson.studentName)}
                    hasRepetoAccount={Boolean(lesson.studentAccountId)}
                    truncate
                />{" "}
                · {lesson.subject}
            </div>
        </button>
    );
};

export default LessonDot;
