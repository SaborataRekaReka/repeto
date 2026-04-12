import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { Icon, Popup } from "@gravity-ui/uikit";
import { ChevronDown, Clock } from "@gravity-ui/icons";
import type { IconData } from "@gravity-ui/uikit";

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
    className,
    style,
    stepMinutes = 30,
    min = "00:00",
    max = "23:30",
    showClockIcon = true,
}: StyledTimeInputProps) => {
    const anchorRef = useRef<HTMLButtonElement>(null);
    const listRef = useRef<HTMLDivElement>(null);
    const [open, setOpen] = useState(false);
    const [isHovered, setIsHovered] = useState(false);
    const [anchorWidth, setAnchorWidth] = useState<number>(0);

    const options = useMemo(
        () => buildTimeOptions(stepMinutes, min, max),
        [stepMinutes, min, max]
    );

    const selectedValue = value || "";

    useEffect(() => {
        if (open && anchorRef.current) {
            setAnchorWidth(anchorRef.current.offsetWidth);
        }
    }, [open]);

    useEffect(() => {
        if (open && listRef.current && selectedValue) {
            const selected = listRef.current.querySelector("[data-selected='true']");
            if (selected) {
                selected.scrollIntoView({ block: "center" });
            }
        }
    }, [open, selectedValue]);

    return (
        <>
            <button
                ref={anchorRef}
                type="button"
                className={className}
                onClick={() => {
                    if (disabled) return;
                    setOpen((prev) => !prev);
                }}
                onMouseEnter={() => {
                    if (!disabled) setIsHovered(true);
                }}
                onMouseLeave={() => setIsHovered(false)}
                onFocus={() => {
                    if (!disabled) setIsHovered(true);
                }}
                onBlur={() => setIsHovered(false)}
                disabled={disabled}
                style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    width,
                    background:
                        isHovered && !disabled
                            ? "var(--g-color-base-simple-hover)"
                            : "transparent",
                    border: open
                        ? "1px solid var(--g-color-line-brand)"
                        : isHovered
                          ? "1px solid var(--g-color-line-generic-hover)"
                          : "1px solid var(--g-color-line-generic)",
                    borderRadius: "var(--g-border-radius-m)",
                    fontSize: 13,
                    fontFamily: "inherit",
                    color: "var(--g-color-text-primary)",
                    cursor: disabled ? "default" : "pointer",
                    opacity: disabled ? 0.5 : 1,
                    boxSizing: "border-box",
                    height: 36,
                    padding: "0 12px",
                    transition: "border-color 0.15s, background-color 0.15s",
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
                <Icon
                    data={ChevronDown as IconData}
                    size={16}
                    style={{
                        color: "var(--g-color-text-secondary)",
                        flexShrink: 0,
                        transform: open ? "rotate(180deg)" : "none",
                        transition: "transform 0.15s",
                    }}
                />
            </button>
            <Popup
                open={open}
                anchorRef={anchorRef}
                placement="bottom-start"
                onClose={() => setOpen(false)}
            >
                <div
                    ref={listRef}
                    style={{
                        background: "var(--g-color-base-background)",
                        border: "1px solid var(--g-color-line-generic)",
                        borderRadius: 10,
                        padding: 6,
                        width: anchorWidth > 0 ? anchorWidth : undefined,
                        minWidth: 120,
                        maxHeight: 240,
                        overflowY: "auto",
                        boxSizing: "border-box",
                    }}
                >
                    {options.map((option) => {
                        const isSelected = option === selectedValue;

                        return (
                            <button
                                key={option}
                                type="button"
                                data-selected={isSelected ? "true" : undefined}
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
            </Popup>
        </>
    );
};

export default StyledTimeInput;
