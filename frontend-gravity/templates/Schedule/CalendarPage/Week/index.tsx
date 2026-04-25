import { useMemo, useRef, useEffect, type MouseEvent } from "react";
import { Text, Card } from "@gravity-ui/uikit";
import LessonBlock from "../LessonBlock";
import { toLocalDateKey } from "@/lib/dates";
import type { Lesson } from "@/types/schedule";

type WeekProps = {
    currentDate: Date;
    onLessonClick?: (lesson: Lesson) => void;
    onSlotClick?: (slot: { date: string; time: string }) => void;
    lessons?: Lesson[];
};

const DAY_NAMES_SHORT = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];
const HOUR_HEIGHT = 60; // px per hour
const TIME_COL = 56; // px, time label column width
const DAY_COL_MIN = 110;
const WEEK_MIN_WIDTH = TIME_COL + DAY_COL_MIN * 7;
const HOURS_24 = Array.from({ length: 24 }, (_, i) => i);

function pad(n: number) {
    return String(n).padStart(2, "0");
}

function snapYToTime(y: number) {
    const minutes = Math.round(((y / HOUR_HEIGHT) * 60) / 30) * 30;
    const clamped = Math.max(0, Math.min(23 * 60 + 30, minutes));
    const hh = Math.floor(clamped / 60);
    const mm = clamped % 60;
    return `${pad(hh)}:${pad(mm)}`;
}

function normalizeTime(value: string) {
    return value.length === 4 ? `0${value}` : value;
}

function parseTimeToMinutes(value: string) {
    const [hh, mm] = normalizeTime(value).split(":").map(Number);
    return hh * 60 + mm;
}

type DayColumn = {
    date: string;
    dayOfWeek: string;
    dayNum: number;
    isToday: boolean;
    lessons: Lesson[];
};

function getWeekDays(currentDate: Date): DayColumn[] {
    const d = new Date(currentDate);
    const dow = d.getDay();
    const diff = dow === 0 ? -6 : 1 - dow;
    const monday = new Date(d);
    monday.setDate(d.getDate() + diff);

    const now = new Date();
    const todayIso = toLocalDateKey(now);

    return Array.from({ length: 7 }, (_, i) => {
        const dt = new Date(monday);
        dt.setDate(monday.getDate() + i);
        const iso = toLocalDateKey(dt);
        return {
            date: iso,
            dayOfWeek: DAY_NAMES_SHORT[i],
            dayNum: dt.getDate(),
            isToday: iso === todayIso,
            lessons: [],
        };
    });
}

const Week = ({ currentDate, onLessonClick, onSlotClick, lessons = [] }: WeekProps) => {
    const scrollRef = useRef<HTMLDivElement>(null);

    const handleSlotClick = (event: MouseEvent<HTMLDivElement>, date: string) => {
        if (!onSlotClick) return;
        const rect = event.currentTarget.getBoundingClientRect();
        const y = event.clientY - rect.top;
        onSlotClick({ date, time: snapYToTime(y) });
    };

    const weekDays = useMemo(() => {
        const days = getWeekDays(currentDate);
        for (const lesson of lessons) {
            const col = days.find((d) => d.date === lesson.date);
            if (col) col.lessons.push(lesson);
        }
        return days;
    }, [currentDate, lessons]);

    // Current time
    const now = new Date();
    const nowMinutes = now.getHours() * 60 + now.getMinutes();
    const nowTop = (nowMinutes / 60) * HOUR_HEIGHT;
    const todayIso = toLocalDateKey(now);

    // Scroll to 8 AM on mount (or 2h before now if later)
    useEffect(() => {
        if (scrollRef.current) {
            const scrollTo = Math.max(8 * HOUR_HEIGHT, nowTop - 2 * HOUR_HEIGHT);
            scrollRef.current.scrollTop = scrollTo;
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const gridHeight = HOUR_HEIGHT * 24;

    return (
        <Card view="outlined" className="repeto-schedule-calendar-card" style={{ overflow: "hidden" }}>
            <div className="repeto-calendar-shell">
                <div
                    ref={scrollRef}
                    className="repeto-calendar-scroll repeto-calendar-shell__inner"
                    style={{ overflowY: "auto", overflowX: "hidden", maxHeight: "calc(100vh - 180px)" }}
                >
                    <div
                        className="repeto-calendar-header"
                        style={{
                            display: "flex",
                            minWidth: WEEK_MIN_WIDTH,
                            position: "sticky",
                            top: 0,
                            zIndex: 10,
                            borderBottom: "1px solid var(--g-color-line-generic)",
                        }}
                    >
                        <div style={{ width: TIME_COL, flexShrink: 0 }} />
                        {weekDays.map((day) => (
                            <div
                                key={day.date}
                                style={{
                                    flex: 1,
                                    minWidth: DAY_COL_MIN,
                                    display: "flex",
                                    flexDirection: "column",
                                    alignItems: "center",
                                    padding: "10px 4px 8px",
                                    borderLeft: "1px solid var(--g-color-line-generic)",
                                }}
                            >
                                <Text
                                    variant="caption-2"
                                    color={day.isToday ? "brand" : "secondary"}
                                    style={{
                                        textTransform: "uppercase",
                                        fontWeight: 500,
                                        letterSpacing: 0.5,
                                    }}
                                >
                                    {day.dayOfWeek}
                                </Text>
                                <div
                                    style={{
                                        width: 32,
                                        height: 32,
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        borderRadius: "50%",
                                        background: "transparent",
                                        border: day.isToday
                                            ? "1.5px solid var(--g-color-base-brand)"
                                            : "1.5px solid transparent",
                                        marginTop: 2,
                                    }}
                                >
                                    <Text
                                        variant="subheader-2"
                                        style={{
                                            color: day.isToday
                                                ? "var(--g-color-text-brand)"
                                                : "var(--g-color-text-primary)",
                                            fontWeight: day.isToday ? 600 : 400,
                                        }}
                                    >
                                        {day.dayNum}
                                    </Text>
                                </div>
                            </div>
                        ))}
                    </div>
                    <div
                        style={{
                            display: "flex",
                            minWidth: WEEK_MIN_WIDTH,
                            height: gridHeight,
                            position: "relative",
                        }}
                    >
                        <div
                            style={{
                                width: TIME_COL,
                                flexShrink: 0,
                                position: "relative",
                            }}
                        >
                            {HOURS_24.map((h) =>
                                h === 0 ? null : (
                                    <div
                                        key={h}
                                        style={{
                                            position: "absolute",
                                            top: h * HOUR_HEIGHT - 8,
                                            right: 8,
                                            left: 0,
                                            display: "flex",
                                            justifyContent: "flex-end",
                                        }}
                                    >
                                        <Text
                                            variant="caption-2"
                                            color="secondary"
                                            style={{ userSelect: "none", whiteSpace: "nowrap" }}
                                        >
                                            {String(h).padStart(2, "0")}:00
                                        </Text>
                                    </div>
                                )
                            )}
                        </div>
                        {weekDays.map((day) => (
                            <div
                                key={day.date}
                                onClick={(event) => handleSlotClick(event, day.date)}
                                style={{
                                    flex: 1,
                                    minWidth: DAY_COL_MIN,
                                    position: "relative",
                                    borderLeft: "1px solid var(--g-color-line-generic)",
                                    cursor: "pointer",
                                }}
                            >
                                {HOURS_24.map((h) => (
                                    <div
                                        key={h}
                                        style={{
                                            position: "absolute",
                                            top: h * HOUR_HEIGHT,
                                            left: 0,
                                            right: 0,
                                            borderTop: h === 0 ? "none" : "1px solid var(--g-color-line-generic)",
                                            pointerEvents: "none",
                                        }}
                                    />
                                ))}
                                {HOURS_24.map((h) => (
                                    <div
                                        key={"half-" + h}
                                        style={{
                                            position: "absolute",
                                            top: h * HOUR_HEIGHT + HOUR_HEIGHT / 2,
                                            left: 0,
                                            right: 0,
                                            borderTop: "1px dashed var(--g-color-line-generic)",
                                            opacity: 0.5,
                                            pointerEvents: "none",
                                        }}
                                    />
                                ))}
                                {day.lessons.map((lesson) => {
                                    const startMin = parseTimeToMinutes(lesson.startTime);
                                    const endMin = parseTimeToMinutes(lesson.endTime);
                                    const top = (startMin / 60) * HOUR_HEIGHT;
                                    const height = ((endMin - startMin) / 60) * HOUR_HEIGHT;
                                    const blockHeight = Math.max(height - 2, 20);
                                    const useCompact = blockHeight < 52;
                                    return (
                                        <div
                                            key={lesson.id}
                                            onClick={(event) => event.stopPropagation()}
                                            style={{
                                                position: "absolute",
                                                top,
                                                left: 2,
                                                right: 2,
                                                height: blockHeight,
                                                zIndex: 2,
                                            }}
                                        >
                                            <LessonBlock
                                                lesson={lesson}
                                                compact={useCompact}
                                                showTime={!useCompact}
                                                onClick={onLessonClick}
                                            />
                                        </div>
                                    );
                                })}
                                {day.date === todayIso && (
                                    <div
                                        style={{
                                            position: "absolute",
                                            top: nowTop,
                                            left: -1,
                                            right: 0,
                                            height: 2,
                                            background: "var(--g-color-base-danger)",
                                            zIndex: 3,
                                            pointerEvents: "none",
                                        }}
                                    >
                                        <div
                                            style={{
                                                position: "absolute",
                                                left: -4,
                                                top: -3,
                                                width: 8,
                                                height: 8,
                                                borderRadius: "50%",
                                                background: "var(--g-color-base-danger)",
                                            }}
                                        />
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </Card>
    );
};

export default Week;
