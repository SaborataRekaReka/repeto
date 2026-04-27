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

const SLOT_BG = "var(--repeto-surface-muted-soft)";
const SLOT_TEXT = "var(--g-color-text-primary)";

const STATUS_DOT: Record<Lesson["status"], string> = {
    planned: "var(--g-color-text-info)",
    completed: "var(--g-color-text-positive)",
    cancelled_student: "var(--g-color-text-secondary)",
    cancelled_tutor: "var(--g-color-text-secondary)",
    no_show: "var(--g-color-text-warning)",
    reschedule_pending: "var(--g-color-text-warning)",
};

const LessonBlock = ({ lesson, compact, showTime: _showTime, onClick, style }: LessonBlockProps) => {
    const bg = SLOT_BG;
    const textColor = SLOT_TEXT;
    const dotColor = STATUS_DOT[lesson.status];
    const hoverBg = `color-mix(in srgb, ${bg} 95%, var(--g-color-text-primary) 5%)`;

    if (compact) {
        return (
            <button
                onClick={() => onClick?.(lesson)}
                onMouseEnter={(event) => {
                    event.currentTarget.style.background = hoverBg;
                }}
                onMouseLeave={(event) => {
                    event.currentTarget.style.background = bg;
                }}
                style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    width: "100%",
                    minHeight: 23,
                    padding: "3px 8px",
                    borderRadius: 6,
                    background: bg,
                    border: "none",
                    cursor: "pointer",
                    textAlign: "left",
                    overflow: "hidden",
                    transition: "background 0.15s ease",
                    boxSizing: "border-box",
                    ...style,
                }}
            >
                <span
                    style={{
                        width: 6,
                        height: 6,
                        borderRadius: "50%",
                        background: dotColor,
                        flexShrink: 0,
                    }}
                />
                <Text
                    variant="caption-2"
                    ellipsis
                    style={{ color: textColor, fontWeight: 500 }}
                >
                    {lesson.subject} · {surnameOnly(lesson.studentName)}
                </Text>
            </button>
        );
    }

    return (
        <button
            onClick={() => onClick?.(lesson)}
            onMouseEnter={(event) => {
                event.currentTarget.style.background = hoverBg;
            }}
            onMouseLeave={(event) => {
                event.currentTarget.style.background = bg;
            }}
            style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                width: "100%",
                height: "100%",
                minHeight: 22,
                padding: "3px 8px",
                borderRadius: 6,
                background: bg,
                border: "none",
                cursor: "pointer",
                textAlign: "left",
                overflow: "hidden",
                transition: "background 0.15s ease",
                boxSizing: "border-box",
                ...style,
            }}
        >
            <span
                style={{
                    width: 6,
                    height: 6,
                    borderRadius: "50%",
                    background: dotColor,
                    flexShrink: 0,
                }}
            />
            <Text
                variant="caption-2"
                ellipsis
                style={{ color: textColor, fontWeight: 500 }}
            >
                {lesson.subject} · {surnameOnly(lesson.studentName)}
            </Text>
        </button>
    );
};

export default LessonBlock;
