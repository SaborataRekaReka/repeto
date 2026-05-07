import type { CSSProperties } from "react";
import Image from "@/components/Image";

type StudentNameWithBadgeProps = {
    name: string;
    hasRepetoAccount?: boolean | null;
    className?: string;
    textClassName?: string;
    truncate?: boolean;
    smartTruncate?: boolean;
    smartTruncateMaxLength?: number;
    iconSize?: number;
    mirrorIcon?: boolean;
};

const REPETO_TOOLTIP = "Ученик в Repeto";
const DEFAULT_SMART_TRUNCATE_MAX_LENGTH = 24;

const normalizeName = (value: string) => value.replace(/\s+/g, " ").trim();

const firstLetterWithDot = (value: string) => {
    const letter = Array.from(value)[0];
    return letter ? `${letter}.` : "";
};

const smartShortenName = (name: string, maxLength: number) => {
    const normalizedName = normalizeName(name);
    if (!normalizedName) {
        return "";
    }

    if (normalizedName.length <= maxLength) {
        return normalizedName;
    }

    const parts = normalizedName.split(" ").filter(Boolean);
    if (parts.length >= 2) {
        const [firstPart, ...restParts] = parts;
        const initials = restParts
            .map((part) => firstLetterWithDot(part))
            .filter(Boolean)
            .join(" ");

        if (initials) {
            const fullInitialForm = `${firstPart} ${initials}`;
            if (fullInitialForm.length <= maxLength) {
                return fullInitialForm;
            }

            const shortInitial = firstLetterWithDot(restParts[0] || "");
            if (shortInitial) {
                const compactForm = `${firstPart} ${shortInitial}`;
                if (compactForm.length <= maxLength) {
                    return compactForm;
                }
            }
        }

        const firstPartMaxLength = Math.max(1, maxLength - 3);
        return `${firstPart.slice(0, firstPartMaxLength)}...`;
    }

    if (maxLength <= 3) {
        return "...";
    }

    return `${normalizedName.slice(0, maxLength - 3)}...`;
};

const StudentNameWithBadge = ({
    name,
    hasRepetoAccount,
    className,
    textClassName,
    truncate = false,
    smartTruncate = false,
    smartTruncateMaxLength = DEFAULT_SMART_TRUNCATE_MAX_LENGTH,
    iconSize = 13,
    mirrorIcon = false,
}: StudentNameWithBadgeProps) => {
    const normalizedName = normalizeName(name);
    const displayName =
        hasRepetoAccount && smartTruncate
            ? smartShortenName(normalizedName, smartTruncateMaxLength)
            : normalizedName;
    const shouldShowFullNameTooltip = displayName !== normalizedName;

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

    const iconClassName = [
        "repeto-student-name__icon",
        mirrorIcon ? "repeto-student-name__icon--mirrored" : "",
    ]
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
            <span className={textClass} title={shouldShowFullNameTooltip ? normalizedName : undefined}>
                {displayName}
            </span>
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
                        className={iconClassName}
                    />
                </span>
            ) : null}
        </span>
    );
};

export default StudentNameWithBadge;
