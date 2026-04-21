import { useCallback, type ReactNode } from "react";
import { TextInput } from "@gravity-ui/uikit";

/**
 * Phone input with Russian phone mask: +7 (___) ___-__-__
 * Accepts raw digits, formats on the fly.
 */

function formatPhone(raw: string): string {
    const digits = raw.replace(/\D/g, "");

    // Normalize leading 8 → 7
    let d = digits;
    if (d.startsWith("8") && d.length > 1) {
        d = "7" + d.slice(1);
    }
    if (!d.startsWith("7") && d.length > 0) {
        d = "7" + d;
    }

    if (d.length === 0) return "";
    if (d.length <= 1) return "+7";
    if (d.length <= 4) return `+7 (${d.slice(1)}`;
    if (d.length <= 7) return `+7 (${d.slice(1, 4)}) ${d.slice(4)}`;
    if (d.length <= 9) return `+7 (${d.slice(1, 4)}) ${d.slice(4, 7)}-${d.slice(7)}`;
    return `+7 (${d.slice(1, 4)}) ${d.slice(4, 7)}-${d.slice(7, 9)}-${d.slice(9, 11)}`;
}

function stripPhone(formatted: string): string {
    return formatted.replace(/\D/g, "");
}

type PhoneInputProps = {
    value: string;
    onUpdate: (value: string) => void;
    placeholder?: string;
    size?: "s" | "m" | "l" | "xl";
    disabled?: boolean;
    onBlur?: () => void;
    endContent?: ReactNode;
};

const PhoneInput = ({
    value,
    onUpdate,
    placeholder = "+7 (900) 123-45-67",
    size = "l",
    disabled,
    onBlur,
    endContent,
}: PhoneInputProps) => {
    const handleUpdate = useCallback(
        (v: string) => {
            const digits = stripPhone(v);
            if (digits.length > 11) return;
            onUpdate(formatPhone(v));
        },
        [onUpdate],
    );

    const displayValue = value.startsWith("+") ? value : formatPhone(value);

    return (
        <TextInput
            type="tel"
            value={displayValue}
            onUpdate={handleUpdate}
            placeholder={placeholder}
            size={size}
            disabled={disabled}
            onBlur={onBlur}
            endContent={endContent}
        />
    );
};

export default PhoneInput;
export { formatPhone, stripPhone };
