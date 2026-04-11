import { Text } from "@gravity-ui/uikit";
import type { Lesson } from "@/types/schedule";

type LessonBlockProps = {
    lesson: Lesson;
    compact?: boolean;
    showTime?: boolean;
    onClick?: (lesson: Lesson) => void;
    style?: React.CSSProperties;
};

function shortName(name: string): string {
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) return `${parts[0]} ${parts[1][0]}.`;
    return parts[0] || "";
}

const STATUS_BG: Record<Lesson["status"], string> = {
    planned: "var(--g-color-base-info-light)",
    completed: "var(--g-color-base-positive-light)",
    cancelled_student: "var(--g-color-base-danger-light)",
    cancelled_tutor: "var(--g-color-base-danger-light)",
    no_show: "var(--g-color-base-warning-light)",
    reschedule_pending: "var(--g-color-base-generic)",
};

const STATUS_BORDER: Record<Lesson["status"], string> = {
    planned: "var(--g-color-line-info)",
    completed: "var(--g-color-line-positive)",
    cancelled_student: "var(--g-color-line-danger)",
    cancelled_tutor: "var(--g-color-line-danger)",
    no_show: "var(--g-color-line-warning)",
    reschedule_pending: "var(--g-color-line-generic)",
};

const STATUS_TEXT: Record<Lesson["status"], string> = {
    planned: "var(--g-color-text-info)",
    completed: "var(--g-color-text-positive)",
    cancelled_student: "var(--g-color-text-danger)",
    cancelled_tutor: "var(--g-color-text-danger)",
    no_show: "var(--g-color-text-warning)",
    reschedule_pending: "var(--g-color-text-secondary)",
};

const LessonBlock = ({ lesson, compact, showTime, onClick, style }: LessonBlockProps) => {
    const bg = STATUS_BG[lesson.status];
    const border = STATUS_BORDER[lesson.status];
    const textColor = STATUS_TEXT[lesson.status];

    if (compact) {
        return (
            <button
                onClick={() => onClick?.(lesson)}
                style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 4,
                    width: "100%",
                    padding: "2px 6px",
                    borderRadius: 4,
                    background: bg,
                    border: "none",
                    cursor: "pointer",
                    textAlign: "left",
                    overflow: "hidden",
                    ...style,
                }}
            >
                <span
                    style={{
                        width: 6,
                        height: 6,
                        borderRadius: "50%",
                        background: border,
                        flexShrink: 0,
                    }}
                />
                <Text
                    variant="caption-2"
                    ellipsis
                    style={{ color: textColor }}
                >
                    {shortName(lesson.studentName)} · {lesson.subject}
                </Text>
            </button>
        );
    }

    return (
        <button
            onClick={() => onClick?.(lesson)}
            style={{
                display: "flex",
                flexDirection: "column",
                justifyContent: "flex-start",
                width: "100%",
                height: "100%",
                padding: "4px 8px",
                borderRadius: 6,
                background: bg,
                borderLeft: `3px solid ${border}`,
                border: `1px solid ${border}`,
                borderLeftWidth: 3,
                cursor: "pointer",
                textAlign: "left",
                overflow: "hidden",
                transition: "box-shadow 0.15s",
                ...style,
            }}
            onMouseEnter={(e) => {
                e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,0,0,0.12)";
            }}
            onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = "none";
            }}
        >
            {showTime && (
                <Text variant="caption-2" color="secondary" ellipsis>
                    {lesson.startTime} – {lesson.endTime}
                </Text>
            )}
            <Text
                variant="caption-2"
                ellipsis
                style={{ fontWeight: 600, color: textColor }}
            >
                {lesson.subject}
            </Text>
            <Text variant="caption-2" color="secondary" ellipsis>
                {shortName(lesson.studentName)}
            </Text>
        </button>
    );
};

export default LessonBlock;
