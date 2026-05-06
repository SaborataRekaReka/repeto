import { Text } from "@gravity-ui/uikit";
import type { Lesson } from "@/types/schedule";

type LessonBlockProps = {
    lesson: Lesson;
    compact?: boolean;
    showTime?: boolean;
    titleOverride?: string;
    metaOverride?: string;
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

const LessonBlock = ({
    lesson,
    compact,
    showTime = true,
    titleOverride,
    metaOverride,
    onClick,
    style,
}: LessonBlockProps) => {
    const rootClassName = [
        "repeto-calendar-lesson",
        compact ? "repeto-calendar-lesson--compact" : "",
    ].filter(Boolean).join(" ");
    const titleText = titleOverride ?? `${lesson.subject} · ${surnameOnly(lesson.studentName)}`;
    const metaText = metaOverride ?? `${lesson.startTime} - ${lesson.endTime} · ${LESSON_FORMAT_LABELS[lesson.format]}`;

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
                    {titleText}
                </Text>

                {!compact && showTime && metaText && (
                    <Text
                        variant="caption-1"
                        ellipsis
                        className="repeto-calendar-lesson__meta"
                    >
                        {metaText}
                    </Text>
                )}
            </span>
        </button>
    );
};

export default LessonBlock;
