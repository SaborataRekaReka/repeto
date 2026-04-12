import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { Button, Icon, Popup, Text } from "@gravity-ui/uikit";
import { ChevronDown, ArrowChevronLeft, ArrowChevronRight } from "@gravity-ui/icons";
import type { IconData } from "@gravity-ui/uikit";

const MONTH_NAMES_GEN = [
    "январь", "февраль", "март", "апрель", "май", "июнь",
    "июль", "август", "сентябрь", "октябрь", "ноябрь", "декабрь",
];
const WEEK_DAY_SHORT = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];

type StyledDateInputProps = {
    value: string;
    onUpdate: (value: string) => void;
    placeholder?: string;
    disabled?: boolean;
    width?: number | string;
    className?: string;
    style?: CSSProperties;
};

function toIsoDate(date: Date) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
}

function parseIsoDate(value: string): Date | null {
    if (!value) return null;
    const [y, m, d] = value.split("-").map(Number);
    if (!y || !m || !d) return null;
    return new Date(y, m - 1, d);
}

function formatRuDate(value: string): string {
    const date = parseIsoDate(value);
    if (!date) return "";
    const dd = String(date.getDate()).padStart(2, "0");
    const mm = String(date.getMonth() + 1).padStart(2, "0");
    const yyyy = date.getFullYear();
    return `${dd}.${mm}.${yyyy}`;
}

function getMonthGrid(monthDate: Date) {
    const start = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1);
    const totalDays = new Date(
        monthDate.getFullYear(),
        monthDate.getMonth() + 1,
        0
    ).getDate();
    const startDow = start.getDay() === 0 ? 7 : start.getDay();
    const leading = startDow - 1;

    const cells: Array<Date | null> = [];
    for (let i = 0; i < leading; i++) cells.push(null);
    for (let d = 1; d <= totalDays; d++) {
        cells.push(new Date(monthDate.getFullYear(), monthDate.getMonth(), d));
    }
    while (cells.length % 7 !== 0) cells.push(null);
    return cells;
}

const StyledDateInput = ({
    value,
    onUpdate,
    placeholder = "Выберите дату",
    disabled,
    width = "100%",
    className,
    style,
}: StyledDateInputProps) => {
    const anchorRef = useRef<HTMLButtonElement>(null);
    const [calendarOpen, setCalendarOpen] = useState(false);
    const [isHovered, setIsHovered] = useState(false);
    const [calendarMonth, setCalendarMonth] = useState<Date>(() => {
        const base = parseIsoDate(value) || new Date();
        return new Date(base.getFullYear(), base.getMonth(), 1);
    });

    const calendarCells = useMemo(
        () => getMonthGrid(calendarMonth),
        [calendarMonth]
    );
    const todayIso = toIsoDate(new Date());

    useEffect(() => {
        if (!calendarOpen) return;
        const selected = parseIsoDate(value);
        const base = selected || new Date();
        setCalendarMonth(new Date(base.getFullYear(), base.getMonth(), 1));
    }, [calendarOpen, value]);

    return (
        <>
            <button
                ref={anchorRef}
                type="button"
                className={className}
                onClick={() => {
                    if (disabled) return;
                    setCalendarOpen((prev) => !prev);
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
                    border: calendarOpen
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
                        color: value
                            ? "var(--g-color-text-primary)"
                            : "var(--g-color-text-hint)",
                    }}
                >
                    {value ? formatRuDate(value) : placeholder}
                </span>
                <Icon
                    data={ChevronDown as IconData}
                    size={16}
                    style={{
                        color: "var(--g-color-text-secondary)",
                        flexShrink: 0,
                        transform: calendarOpen ? "rotate(180deg)" : "none",
                        transition: "transform 0.15s",
                    }}
                />
            </button>
            <Popup
                open={calendarOpen}
                anchorRef={anchorRef}
                placement="bottom-start"
                onClose={() => setCalendarOpen(false)}
            >
                <div
                    style={{
                        background: "var(--g-color-base-background)",
                        border: "1px solid var(--g-color-line-generic)",
                        borderRadius: 10,
                        padding: 10,
                        width: 248,
                    }}
                >
                    <div
                        style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            marginBottom: 8,
                        }}
                    >
                        <Button
                            view="flat"
                            size="s"
                            onClick={() =>
                                setCalendarMonth((prev) =>
                                    new Date(
                                        prev.getFullYear(),
                                        prev.getMonth() - 1,
                                        1
                                    )
                                )
                            }
                        >
                            <Icon data={ArrowChevronLeft as IconData} size={14} />
                        </Button>
                        <Text
                            variant="body-2"
                            style={{ textTransform: "capitalize", fontWeight: 600 }}
                        >
                            {MONTH_NAMES_GEN[calendarMonth.getMonth()]}{" "}
                            {calendarMonth.getFullYear()}
                        </Text>
                        <Button
                            view="flat"
                            size="s"
                            onClick={() =>
                                setCalendarMonth((prev) =>
                                    new Date(
                                        prev.getFullYear(),
                                        prev.getMonth() + 1,
                                        1
                                    )
                                )
                            }
                        >
                            <Icon data={ArrowChevronRight as IconData} size={14} />
                        </Button>
                    </div>

                    <div
                        style={{
                            display: "grid",
                            gridTemplateColumns: "repeat(7, 1fr)",
                            gap: 4,
                            marginBottom: 6,
                        }}
                    >
                        {WEEK_DAY_SHORT.map((dayName) => (
                            <Text
                                key={dayName}
                                variant="caption-2"
                                color="secondary"
                                style={{ textAlign: "center" }}
                            >
                                {dayName}
                            </Text>
                        ))}
                    </div>

                    <div
                        style={{
                            display: "grid",
                            gridTemplateColumns: "repeat(7, 1fr)",
                            gap: 4,
                        }}
                    >
                        {calendarCells.map((cellDate, idx) => {
                            if (!cellDate) {
                                return (
                                    <div
                                        key={`empty-${idx}`}
                                        style={{ height: 28 }}
                                    />
                                );
                            }

                            const iso = toIsoDate(cellDate);
                            const isSelected = iso === value;
                            const isToday = iso === todayIso;

                            return (
                                <button
                                    key={iso}
                                    type="button"
                                    onClick={() => {
                                        onUpdate(iso);
                                        setCalendarOpen(false);
                                    }}
                                    style={{
                                        height: 28,
                                        borderRadius: 7,
                                        border: isSelected
                                            ? "1px solid var(--g-color-line-brand)"
                                            : "1px solid transparent",
                                        background: isSelected
                                            ? "var(--g-color-base-brand)"
                                            : isToday
                                              ? "var(--g-color-base-brand-hover)"
                                              : "transparent",
                                        color: isSelected
                                            ? "var(--g-color-text-light-primary)"
                                            : "var(--g-color-text-primary)",
                                        cursor: "pointer",
                                        fontSize: 12,
                                        fontWeight: isSelected ? 600 : 500,
                                    }}
                                >
                                    {cellDate.getDate()}
                                </button>
                            );
                        })}
                    </div>
                </div>
            </Popup>
        </>
    );
};

export default StyledDateInput;
