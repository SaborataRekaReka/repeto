import { useMemo, useRef, useEffect, type MouseEvent } from "react";
import { Text, Card } from "@gravity-ui/uikit";
import LessonBlock from "../LessonBlock";
import { toLocalDateKey } from "@/lib/dates";
import type { Lesson } from "@/types/schedule";

type WeekProps = {
    currentDate: Date;
    onLessonClick?: (lesson: Lesson) => void;
    onSlotClick?: (slot: { date: string; time: string }) => void;
    onMoreClick?: (date: string) => void;
    lessons?: Lesson[];
};

const DAY_NAMES_SHORT = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];
const HOUR_HEIGHT = 60; // px per hour
const TIME_COL = 56; // px, time label column width
const DAY_COL_MIN = 110;
const WEEK_MIN_WIDTH = TIME_COL + DAY_COL_MIN * 7;
const HOURS_24 = Array.from({ length: 24 }, (_, i) => i);
const WEEK_COMPACT_SINGLE_AREA_PCT = 86;
const WEEK_COMPACT_LANE_PCT = 42;
const OVERLAP_GAP_PCT = 1;
const WEEK_SLOT_BG = "var(--repeto-surface-muted-soft)";
const WEEK_SLOT_TEXT = "var(--g-color-text-primary)";

const WEEK_STATUS_DOT: Record<Lesson["status"], string> = {
    planned: "var(--g-color-text-info)",
    completed: "var(--g-color-text-positive)",
    cancelled_student: "var(--g-color-text-secondary)",
    cancelled_tutor: "var(--g-color-text-secondary)",
    no_show: "var(--g-color-text-warning)",
    reschedule_pending: "var(--g-color-text-warning)",
};

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
    if (!Number.isFinite(hh) || !Number.isFinite(mm)) return 0;
    return hh * 60 + mm;
}

function surnameOnly(fullName: string) {
    const parts = fullName.trim().split(/\s+/);
    return parts[0] || "";
}

type PositionedLesson = {
    lesson: Lesson;
    top: number;
    blockHeight: number;
    leftPct: number;
    widthPct: number;
    useCompact: boolean;
    extraCount: number;
};

type LessonSegment = {
    lesson: Lesson;
    startMin: number;
    endMin: number;
    extraCount: number;
};

function toLessonSegment(lesson: Lesson): LessonSegment {
    const startMin = parseTimeToMinutes(lesson.startTime);
    const rawEnd = parseTimeToMinutes(lesson.endTime);
    const endMin = rawEnd > startMin ? rawEnd : startMin + 30;

    return {
        lesson,
        startMin,
        endMin,
        extraCount: 0,
    };
}

function collapseSameTimeSegments(segments: LessonSegment[]): LessonSegment[] {
    if (segments.length === 0) return [];

    const collapsed: LessonSegment[] = [];
    for (const segment of segments) {
        const last = collapsed[collapsed.length - 1];
        if (last && last.startMin === segment.startMin && last.endMin === segment.endMin) {
            last.extraCount += 1;
            continue;
        }
        collapsed.push({ ...segment });
    }

    return collapsed;
}

function layoutOverlapGroup(group: LessonSegment[]): PositionedLesson[] {
    if (group.length === 0) return [];

    const ordered = [...group].sort((left, right) => {
        if (left.startMin !== right.startMin) return left.startMin - right.startMin;
        if (left.endMin !== right.endMin) return left.endMin - right.endMin;
        return left.lesson.id.localeCompare(right.lesson.id);
    });

    const columnEndMins: number[] = [];
    const withColumns = ordered.map((segment) => {
        let column = columnEndMins.findIndex((endMin) => segment.startMin >= endMin);
        if (column === -1) {
            column = columnEndMins.length;
            columnEndMins.push(segment.endMin);
        } else {
            columnEndMins[column] = segment.endMin;
        }

        return {
            ...segment,
            column,
        };
    });

    const totalColumns = Math.max(1, columnEndMins.length);
    const gapPct = totalColumns > 1 ? OVERLAP_GAP_PCT : 0;
    const compactAreaPct = Math.min(
        100,
        Math.max(
            WEEK_COMPACT_SINGLE_AREA_PCT,
            totalColumns * WEEK_COMPACT_LANE_PCT + (totalColumns - 1) * OVERLAP_GAP_PCT
        )
    );
    const widthPct = (compactAreaPct - gapPct * (totalColumns - 1)) / totalColumns;

    return withColumns.map((segment) => {
        const height = ((segment.endMin - segment.startMin) / 60) * HOUR_HEIGHT;
        const minHeight = segment.extraCount > 0 ? 36 : 20;
        const blockHeight = Math.max(height - 2, minHeight);

        return {
            lesson: segment.lesson,
            top: (segment.startMin / 60) * HOUR_HEIGHT,
            blockHeight,
            leftPct: segment.column * (widthPct + gapPct),
            widthPct,
            useCompact: blockHeight < 52,
            extraCount: segment.extraCount,
        };
    });
}

function buildPositionedLessons(lessons: Lesson[]): PositionedLesson[] {
    const sortedSegments = lessons
        .map(toLessonSegment)
        .sort((left, right) => {
            if (left.startMin !== right.startMin) return left.startMin - right.startMin;
            if (left.endMin !== right.endMin) return left.endMin - right.endMin;
            return left.lesson.id.localeCompare(right.lesson.id);
        });
    const segments = collapseSameTimeSegments(sortedSegments);

    const positioned: PositionedLesson[] = [];
    let currentGroup: LessonSegment[] = [];
    let currentGroupMaxEnd = -1;

    const flushGroup = () => {
        if (currentGroup.length === 0) return;
        positioned.push(...layoutOverlapGroup(currentGroup));
        currentGroup = [];
        currentGroupMaxEnd = -1;
    };

    for (const segment of segments) {
        if (currentGroup.length === 0) {
            currentGroup.push(segment);
            currentGroupMaxEnd = segment.endMin;
            continue;
        }

        if (segment.startMin >= currentGroupMaxEnd) {
            flushGroup();
            currentGroup.push(segment);
            currentGroupMaxEnd = segment.endMin;
            continue;
        }

        currentGroup.push(segment);
        currentGroupMaxEnd = Math.max(currentGroupMaxEnd, segment.endMin);
    }

    flushGroup();

    return positioned.sort((left, right) => {
        if (left.top !== right.top) return left.top - right.top;
        return left.leftPct - right.leftPct;
    });
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

const Week = ({ currentDate, onLessonClick, onSlotClick, onMoreClick, lessons = [] }: WeekProps) => {
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
                                className="repeto-calendar-slot-column"
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

                                {buildPositionedLessons(day.lessons).map((positioned) => {
                                    const hasMore = positioned.extraCount > 0;
                                    const slotHoverBg = `color-mix(in srgb, ${WEEK_SLOT_BG} 95%, var(--g-color-text-primary) 5%)`;
                                    const statusDot = WEEK_STATUS_DOT[positioned.lesson.status];
                                    return (
                                        <div
                                            key={positioned.lesson.id}
                                            onClick={(event) => event.stopPropagation()}
                                            style={{
                                                position: "absolute",
                                                top: positioned.top,
                                                left: `calc(${positioned.leftPct}% + 2px)`,
                                                width: `calc(${positioned.widthPct}% - 4px)`,
                                                height: positioned.blockHeight,
                                                zIndex: 2,
                                            }}
                                        >
                                            <div
                                                style={{
                                                    height: "100%",
                                                    display: "flex",
                                                    flexDirection: "column",
                                                    gap: hasMore ? 2 : 0,
                                                }}
                                            >
                                                <div style={{ flex: 1, minHeight: 0 }}>
                                                    {hasMore ? (
                                                        <button
                                                            type="button"
                                                            onClick={(event) => {
                                                                event.stopPropagation();
                                                                onLessonClick?.(positioned.lesson);
                                                            }}
                                                            onMouseEnter={(event) => {
                                                                event.currentTarget.style.background = slotHoverBg;
                                                            }}
                                                            onMouseLeave={(event) => {
                                                                event.currentTarget.style.background = WEEK_SLOT_BG;
                                                            }}
                                                            style={{
                                                                width: "100%",
                                                                height: "100%",
                                                                minHeight: 22,
                                                                display: "flex",
                                                                alignItems: "center",
                                                                gap: 6,
                                                                padding: "3px 8px",
                                                                borderRadius: 6,
                                                                border: "none",
                                                                background: WEEK_SLOT_BG,
                                                                textAlign: "left",
                                                                cursor: "pointer",
                                                                overflow: "hidden",
                                                                transition: "background 0.15s ease",
                                                            }}
                                                        >
                                                            <span
                                                                style={{
                                                                    width: 6,
                                                                    height: 6,
                                                                    borderRadius: "50%",
                                                                    background: statusDot,
                                                                    flexShrink: 0,
                                                                }}
                                                            />
                                                            <Text
                                                                variant="caption-2"
                                                                ellipsis
                                                                style={{ color: WEEK_SLOT_TEXT, fontWeight: 500 }}
                                                            >
                                                                {positioned.lesson.subject} · {surnameOnly(positioned.lesson.studentName)}
                                                            </Text>
                                                        </button>
                                                    ) : (
                                                        <LessonBlock
                                                            lesson={positioned.lesson}
                                                            compact={false}
                                                            showTime
                                                            onClick={onLessonClick}
                                                            style={{ height: "100%" }}
                                                        />
                                                    )}
                                                </div>
                                                {hasMore && (
                                                    <button
                                                        type="button"
                                                        onClick={(event) => {
                                                            event.stopPropagation();
                                                            onMoreClick?.(day.date);
                                                        }}
                                                        onMouseEnter={(event) => {
                                                            event.currentTarget.style.background = "color-mix(in srgb, var(--repeto-surface-muted-soft) 88%, var(--g-color-text-primary) 12%)";
                                                            event.currentTarget.style.color = "var(--g-color-text-primary)";
                                                        }}
                                                        onMouseLeave={(event) => {
                                                            event.currentTarget.style.background = "var(--repeto-surface-muted-soft)";
                                                            event.currentTarget.style.color = "var(--g-color-text-secondary)";
                                                        }}
                                                        style={{
                                                            alignSelf: "stretch",
                                                            border: "none",
                                                            background: "var(--repeto-surface-muted-soft)",
                                                            color: "var(--g-color-text-secondary)",
                                                            fontSize: 12,
                                                            fontWeight: 500,
                                                            lineHeight: "18px",
                                                            textAlign: "left",
                                                            padding: "2px 8px",
                                                            borderRadius: 6,
                                                            cursor: "pointer",
                                                            transition: "background 0.15s ease, color 0.15s ease",
                                                        }}
                                                    >
                                                        Ещё {positioned.extraCount}
                                                    </button>
                                                )}
                                            </div>
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
