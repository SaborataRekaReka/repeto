import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { Icon, Popup } from "@gravity-ui/uikit";
import { Calendar, ArrowChevronLeft, ArrowChevronRight } from "@gravity-ui/icons";
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
    popupClassName?: string;
    popupZIndex?: number;
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
    popupClassName,
    popupZIndex = 1760,
    style,
}: StyledDateInputProps) => {
    const anchorRef = useRef<HTMLButtonElement>(null);
    const [calendarOpen, setCalendarOpen] = useState(false);
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

    const triggerClassName = [
        "repeto-date-input__trigger",
        calendarOpen ? "repeto-date-input__trigger--open" : "",
        className || "",
    ]
        .filter(Boolean)
        .join(" ");

    const floatingClassName = [
        "repeto-date-popup",
        "repeto-dialog-date-popup",
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
                        setCalendarOpen((prev) => !prev);
                    }, 0);
                }}
                disabled={disabled}
                style={{
                    width,
                    ...style,
                }}
            >
                <span
                    className={`repeto-date-input__value${value ? "" : " repeto-date-input__value--placeholder"}`}
                >
                    {value ? formatRuDate(value) : placeholder}
                </span>
                <Icon
                    data={Calendar as IconData}
                    size={18}
                    className="repeto-date-input__icon"
                />
            </button>
            <Popup
                open={calendarOpen}
                anchorRef={anchorRef}
                placement="bottom-start"
                onClose={() => setCalendarOpen(false)}
                floatingClassName={floatingClassName}
                zIndex={popupZIndex}
            >
                <div className="repeto-date-popup__shell">
                    <div className="repeto-date-popup__header">
                        <button
                            type="button"
                            className="repeto-date-popup__nav"
                            aria-label="Предыдущий месяц"
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
                            <Icon data={ArrowChevronLeft as IconData} size={16} />
                        </button>
                        <div className="repeto-date-popup__title">
                            {MONTH_NAMES_GEN[calendarMonth.getMonth()]}{" "}
                            {calendarMonth.getFullYear()}
                        </div>
                        <button
                            type="button"
                            className="repeto-date-popup__nav"
                            aria-label="Следующий месяц"
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
                            <Icon data={ArrowChevronRight as IconData} size={16} />
                        </button>
                    </div>

                    <div className="repeto-date-popup__weekdays">
                        {WEEK_DAY_SHORT.map((dayName) => (
                            <span key={dayName} className="repeto-date-popup__weekday">
                                {dayName}
                            </span>
                        ))}
                    </div>

                    <div className="repeto-date-popup__days">
                        {calendarCells.map((cellDate, idx) => {
                            if (!cellDate) {
                                return <div key={`empty-${idx}`} className="repeto-date-popup__day-empty" />;
                            }

                            const iso = toIsoDate(cellDate);
                            const isSelected = iso === value;
                            const isToday = iso === todayIso;
                            const dayOfWeek = cellDate.getDay();
                            const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
                            const dayClassName = [
                                "repeto-date-popup__day",
                                isWeekend ? "repeto-date-popup__day--weekend" : "",
                                isToday ? "repeto-date-popup__day--today" : "",
                                isSelected ? "repeto-date-popup__day--selected" : "",
                            ]
                                .filter(Boolean)
                                .join(" ");

                            return (
                                <button
                                    key={iso}
                                    type="button"
                                    className={dayClassName}
                                    onClick={() => {
                                        onUpdate(iso);
                                        setCalendarOpen(false);
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
