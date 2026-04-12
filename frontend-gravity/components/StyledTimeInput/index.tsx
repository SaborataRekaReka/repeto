import { useMemo, useState, type CSSProperties } from "react";
import { Icon, Popover } from "@gravity-ui/uikit";
import { ArrowChevronDown, Clock } from "@gravity-ui/icons";
import type { IconData } from "@gravity-ui/uikit";

const GPopover = Popover as any;

type StyledTimeInputProps = {
    value: string;
    onUpdate: (value: string) => void;
    placeholder?: string;
    disabled?: boolean;
    width?: number | string;
    className?: string;
    style?: CSSProperties;
    stepMinutes?: number;
    min?: string;
    max?: string;
    showClockIcon?: boolean;
};

function parseTimeToMinutes(value: string): number | null {
    if (!value) return null;
    const [h, m] = value.split(":").map(Number);
    if (Number.isNaN(h) || Number.isNaN(m)) return null;
    if (h < 0 || h > 23 || m < 0 || m > 59) return null;
    return h * 60 + m;
}

function formatMinutesToTime(minutes: number): string {
    const normalized = Math.max(0, Math.min(23 * 60 + 59, minutes));
    const h = String(Math.floor(normalized / 60)).padStart(2, "0");
    const m = String(normalized % 60).padStart(2, "0");
    return `${h}:${m}`;
}

function buildTimeOptions(stepMinutes: number, min: string, max: string): string[] {
    const minMinutes = parseTimeToMinutes(min) ?? 0;
    const maxMinutes = parseTimeToMinutes(max) ?? 23 * 60 + 30;
    const step = Math.max(1, stepMinutes);

    const options: string[] = [];
    for (let current = minMinutes; current <= maxMinutes; current += step) {
        options.push(formatMinutesToTime(current));
    }

    return options;
}

const StyledTimeInput = ({
    value,
    onUpdate,
    placeholder = "Выберите время",
    disabled,
    width = "100%",
    className = "repeto-native-input",
    style,
    stepMinutes = 30,
    min = "00:00",
    max = "23:30",
    showClockIcon = true,
}: StyledTimeInputProps) => {
    const [open, setOpen] = useState(false);

    const options = useMemo(
        () => buildTimeOptions(stepMinutes, min, max),
        [stepMinutes, min, max]
    );

    const selectedValue = value || "";

    return (
        <GPopover
            open={open}
            onOpenChange={(next: boolean) => {
                if (disabled) return;
                setOpen(next);
            }}
            openOnHover={false}
            placement="bottom-start"
            content={
                <div
                    style={{
                        background: "var(--g-color-base-background)",
                        border: "1px solid var(--g-color-line-generic)",
                        borderRadius: 10,
                        padding: 6,
                        width: 170,
                        maxHeight: 240,
                        overflowY: "auto",
                    }}
                >
                    {options.map((option) => {
                        const isSelected = option === selectedValue;

                        return (
                            <button
                                key={option}
                                type="button"
                                onClick={() => {
                                    onUpdate(option);
                                    setOpen(false);
                                }}
                                style={{
                                    width: "100%",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "space-between",
                                    padding: "6px 8px",
                                    borderRadius: 7,
                                    border: "none",
                                    background: isSelected
                                        ? "var(--g-color-base-brand)"
                                        : "transparent",
                                    color: isSelected
                                        ? "var(--g-color-text-light-primary)"
                                        : "var(--g-color-text-primary)",
                                    cursor: "pointer",
                                    fontSize: 13,
                                    fontWeight: isSelected ? 600 : 500,
                                }}
                            >
                                <span>{option}</span>
                                {isSelected && (
                                    <Icon
                                        data={Clock as IconData}
                                        size={12}
                                        style={{ color: "inherit" }}
                                    />
                                )}
                            </button>
                        );
                    })}
                </div>
            }
        >
            <button
                type="button"
                className={className}
                onClick={() => {
                    if (disabled) return;
                    setOpen((prev) => !prev);
                }}
                disabled={disabled}
                style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    width,
                    cursor: disabled ? "default" : "pointer",
                    opacity: disabled ? 0.7 : 1,
                    ...style,
                }}
            >
                <span
                    style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 6,
                        color: selectedValue
                            ? "var(--g-color-text-primary)"
                            : "var(--g-color-text-hint)",
                    }}
                >
                    {showClockIcon && (
                        <Icon data={Clock as IconData} size={14} style={{ opacity: 0.7 }} />
                    )}
                    {selectedValue || placeholder}
                </span>
                <Icon data={ArrowChevronDown as IconData} size={16} style={{ opacity: 0.7 }} />
            </button>
        </GPopover>
    );
};

export default StyledTimeInput;
