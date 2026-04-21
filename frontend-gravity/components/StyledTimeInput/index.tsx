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
    popupClassName?: string;
    style?: CSSProperties;
    stepMinutes?: number;
    min?: string;
    max?: string;
    showClockIcon?: boolean;
    popupMaxHeight?: number;
    popupZIndex?: number;
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
    disabled = false,
    width = "100%",
    className,
    popupClassName,
    style,
    stepMinutes = 30,
    min = "00:00",
    max = "23:30",
    showClockIcon = true,
    popupMaxHeight = 300,
    popupZIndex = 1760,
}: StyledTimeInputProps) => {
    const anchorRef = useRef<HTMLButtonElement>(null);
    const listRef = useRef<HTMLDivElement>(null);
    const [open, setOpen] = useState(false);
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

    const triggerClassName = [
        "repeto-time-input__trigger",
        open ? "repeto-time-input__trigger--open" : "",
        className || "",
    ]
        .filter(Boolean)
        .join(" ");

    const floatingClassName = [
        "repeto-time-popup",
        "repeto-dialog-time-popup",
        popupClassName || "",
    ]
        .filter(Boolean)
        .join(" ");

    return (
        <>
            <button
                ref={anchorRef}
                type="button"
                className={triggerClassName}
                onMouseDown={(event) => {
                    // Prevent document-level outside-click handlers from consuming trigger interaction.
                    event.preventDefault();
                    event.stopPropagation();
                }}
                onClick={(event) => {
                    if (disabled) return;
                    event.preventDefault();
                    event.stopPropagation();
                    window.setTimeout(() => {
                        setOpen((prev) => !prev);
                    }, 0);
                }}
                disabled={disabled}
                style={{
                    width,
                    ...style,
                }}
            >
                <span
                    className={`repeto-time-input__value${selectedValue ? "" : " repeto-time-input__value--placeholder"}`}
                >
                    {showClockIcon && (
                        <Icon
                            data={Clock as IconData}
                            size={14}
                            className="repeto-time-input__value-icon"
                        />
                    )}
                    {selectedValue || placeholder}
                </span>
                <Icon
                    data={ChevronDown as IconData}
                    size={18}
                    className="repeto-time-input__icon"
                />
            </button>
            <Popup
                open={open}
                anchorRef={anchorRef}
                placement="bottom-start"
                onClose={() => setOpen(false)}
                floatingClassName={floatingClassName}
                zIndex={popupZIndex}
            >
                <div
                    ref={listRef}
                    className="repeto-time-popup__list"
                    style={{
                        width: anchorWidth > 0 ? anchorWidth : undefined,
                        maxHeight: popupMaxHeight,
                    }}
                >
                    {options.map((option) => {
                        const isSelected = option === selectedValue;

                        return (
                            <button
                                key={option}
                                type="button"
                                data-selected={isSelected ? "true" : undefined}
                                className={`repeto-time-popup__option${isSelected ? " repeto-time-popup__option--selected" : ""}`}
                                onClick={() => {
                                    onUpdate(option);
                                    setOpen(false);
                                }}
                            >
                                <span>{option}</span>
                                {isSelected && (
                                    <Icon
                                        data={Clock as IconData}
                                        size={14}
                                        className="repeto-time-popup__option-icon"
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
