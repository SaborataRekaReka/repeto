import { Text } from "@gravity-ui/uikit";
import type { Lesson } from "@/types/schedule";

type LessonBlockProps = {
    lesson: Lesson;
    compact?: boolean;
    showTime?: boolean;
    onClick?: (lesson: Lesson) => void;
    style?: React.CSSProperties;
};

function surnameOnly(fullName: string): string {
    const parts = fullName.trim().split(/\s+/);
    return parts[0] || "";
}

const LESSON_FORMAT_LABELS: Record<Lesson["format"], string> = {
    online: "Онлайн",
    offline: "Очно",
};

const LessonBlock = ({ lesson, compact, showTime = true, onClick, style }: LessonBlockProps) => {
    const rootClassName = [
        "repeto-calendar-lesson",
        compact ? "repeto-calendar-lesson--compact" : "",
    ].filter(Boolean).join(" ");

    return (
        <button
            type="button"
            className={rootClassName}
            onClick={() => onClick?.(lesson)}
            style={style}
        >
            <span className={`repeto-calendar-lesson__dot repeto-calendar-lesson__dot--${lesson.status}`} />

            <span className="repeto-calendar-lesson__content">
                <Text
                    variant="caption-2"
                    ellipsis
                    className="repeto-calendar-lesson__title"
                >
                    {lesson.subject} · {surnameOnly(lesson.studentName)}
                </Text>

                {!compact && showTime && (
                    <Text
                        variant="caption-1"
                        ellipsis
                        className="repeto-calendar-lesson__meta"
                    >
                        {lesson.startTime} - {lesson.endTime} · {LESSON_FORMAT_LABELS[lesson.format]}
                    </Text>
                )}
            </span>
        </button>
    );
};

export default LessonBlock;
