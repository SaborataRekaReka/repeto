import type { Lesson } from "@/types/schedule";
import { shortName } from "@/mocks/schedule";

type LessonDotProps = {
    className?: string;
    classTitle?: string;
    lesson: Lesson;
    time?: string;
    onClick?: (lesson: Lesson) => void;
};

const LessonDot = ({ className, classTitle, lesson, time, onClick }: LessonDotProps) => {
    return (
        <button
            className={`relative flex items-center w-full pl-2.5 pr-4 py-1 bg-background transition-colors text-xs outline-none hover:text-purple-2 last:mb-0 dark:bg-n-2 ${className}`}
            onClick={() => onClick?.(lesson)}
        >
            <div
                className={`shrink-0 w-1.5 h-1.5 rounded-full ${
                    lesson.color === "green"
                        ? "bg-green-1"
                        : lesson.color === "yellow"
                        ? "bg-yellow-1"
                        : "bg-purple-1"
                }`}
            ></div>
            {time && (
                <div className="min-w-[3.3rem] ml-2.5 mr-3 text-left text-n-3 dark:text-white/75">
                    {time}
                </div>
            )}
            <div
                className={`ml-2 truncate text-xs font-bold ${classTitle}`}
            >
                {shortName(lesson.studentName)} · {lesson.subject}
            </div>
        </button>
    );
};

export default LessonDot;
