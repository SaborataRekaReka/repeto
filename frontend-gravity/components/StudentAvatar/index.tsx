import type { CSSProperties } from "react";
import { Avatar } from "@gravity-ui/uikit";
import { getInitials } from "@/lib/formatters";
import type { Student } from "@/types/student";

type StudentAvatarProps = {
    student: Pick<Student, "name" | "avatarUrl">;
    size: "xs" | "s" | "m" | "l";
    style?: CSSProperties;
};

const StudentAvatar = ({ student, size, style }: StudentAvatarProps) => {
    const initials = getInitials(student.name || "У") || "У";

    return (
        <Avatar
            imgUrl={student.avatarUrl}
            text={initials}
            size={size}
            theme="brand"
            backgroundColor="var(--accent)"
            style={style}
        />
    );
};

export default StudentAvatar;
