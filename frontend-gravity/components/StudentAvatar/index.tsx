import type { CSSProperties } from "react";
import { Avatar } from "@gravity-ui/uikit";
import { getInitials } from "@/lib/formatters";
import type { Student } from "@/types/student";

type StudentAvatarProps = {
    student: Pick<Student, "name" | "avatarUrl" | "avatarEmoji" | "avatarBackground">;
    size: "xs" | "s" | "m" | "l";
    style?: CSSProperties;
};

const SIZE_TO_PX = {
    xs: 24,
    s: 28,
    m: 32,
    l: 72,
} as const;

const FONT_SIZE_TO_PX = {
    xs: 13,
    s: 15,
    m: 17,
    l: 36,
} as const;

const StudentAvatar = ({ student, size, style }: StudentAvatarProps) => {
    if (student.avatarUrl) {
        return <Avatar imgUrl={student.avatarUrl} size={size} style={style} />;
    }

    const emojiOrInitials = student.avatarEmoji || getInitials(student.name || "U");
    const dimension = SIZE_TO_PX[size];
    const fontSize = FONT_SIZE_TO_PX[size];

    return (
        <span
            role="img"
            aria-label={`Аватар ${student.name}`}
            style={{
                width: dimension,
                height: dimension,
                minWidth: dimension,
                borderRadius: "999px",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                background:
                    student.avatarBackground ||
                    "linear-gradient(135deg, #eaf1ff 0%, #d4e3ff 100%)",
                color: "#1f2f4a",
                fontSize,
                lineHeight: 1,
                userSelect: "none",
                flexShrink: 0,
                ...style,
            }}
        >
            {emojiOrInitials}
        </span>
    );
};

export default StudentAvatar;