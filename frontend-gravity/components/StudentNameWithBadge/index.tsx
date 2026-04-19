import type { CSSProperties } from "react";
import Image from "@/components/Image";

type StudentNameWithBadgeProps = {
    name: string;
    hasRepetoAccount?: boolean | null;
    className?: string;
    textClassName?: string;
    truncate?: boolean;
    iconSize?: number;
};

const REPETO_TOOLTIP = "Ученик в Repeto";

const StudentNameWithBadge = ({
    name,
    hasRepetoAccount,
    className,
    textClassName,
    truncate = false,
    iconSize = 13,
}: StudentNameWithBadgeProps) => {
    const rootClassName = [
        "repeto-student-name",
        truncate ? "repeto-student-name--truncate" : "",
        className || "",
    ]
        .filter(Boolean)
        .join(" ");

    const textClass = ["repeto-student-name__text", textClassName || ""]
        .filter(Boolean)
        .join(" ");

    const iconStyle: CSSProperties = {
        width: iconSize,
        height: iconSize,
        minWidth: iconSize,
        minHeight: iconSize,
    };

    return (
        <span className={rootClassName}>
            <span className={textClass}>{name}</span>
            {hasRepetoAccount ? (
                <span
                    className="repeto-student-name__badge"
                    title={REPETO_TOOLTIP}
                    aria-label={REPETO_TOOLTIP}
                    style={iconStyle}
                >
                    <Image
                        src="/brand/icon.svg"
                        alt=""
                        aria-hidden="true"
                        width={iconSize}
                        height={iconSize}
                        className="repeto-student-name__icon"
                    />
                </span>
            ) : null}
        </span>
    );
};

export default StudentNameWithBadge;
