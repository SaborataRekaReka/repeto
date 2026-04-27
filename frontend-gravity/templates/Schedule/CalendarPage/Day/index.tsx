import { useMemo, useRef, useEffect, type MouseEvent } from "react";
import { Text, Card } from "@gravity-ui/uikit";
import LessonBlock from "../LessonBlock";
import { toLocalDateKey } from "@/lib/dates";
import type { Lesson } from "@/types/schedule";

type DayProps = {
    currentDate: Date;
    onLessonClick?: (lesson: Lesson) => void;
    onSlotClick?: (slot: { date: string; time: string }) => void;
    lessons?: Lesson[];
};

const DAY_NAMES_FULL = [
    "Воскресенье", "Понедельник", "Вторник", "Среда",
    "Четверг", "Пятница", "Суббота",
];
const MONTH_NAMES_GEN = [
    "января", "февраля", "марта", "апреля", "мая", "июня",
    "июля", "августа", "сентября", "октября", "ноября", "декабря",
];

const HOUR_HEIGHT = 60;
const TIME_COL = 56;
const HOURS_24 = Array.from({ length: 24 }, (_, i) => i);
const DAY_COMPACT_SINGLE_AREA_PCT = 32;
const DAY_COMPACT_LANE_PCT = 24;
const OVERLAP_GAP_PCT = 1;

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

type PositionedLesson = {
    lesson: Lesson;
    top: number;
    blockHeight: number;
    leftPct: number;
    widthPct: number;
    useCompact: boolean;
};

type LessonSegment = {
    lesson: Lesson;
    startMin: number;
    endMin: number;
};

function toLessonSegment(lesson: Lesson): LessonSegment {
    const startMin = parseTimeToMinutes(lesson.startTime);
    const rawEnd = parseTimeToMinutes(lesson.endTime);
    const endMin = rawEnd > startMin ? rawEnd : startMin + 30;

    return {
        lesson,
        startMin,
        endMin,
    };
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
            DAY_COMPACT_SINGLE_AREA_PCT,
            totalColumns * DAY_COMPACT_LANE_PCT + (totalColumns - 1) * OVERLAP_GAP_PCT
        )
    );
    const widthPct = (compactAreaPct - gapPct * (totalColumns - 1)) / totalColumns;

    return withColumns.map((segment) => {
        const height = ((segment.endMin - segment.startMin) / 60) * HOUR_HEIGHT;
        const blockHeight = Math.max(height - 2, 20);

        return {
            lesson: segment.lesson,
            top: (segment.startMin / 60) * HOUR_HEIGHT,
            blockHeight,
            leftPct: segment.column * (widthPct + gapPct),
            widthPct,
            useCompact: blockHeight < 52,
        };
    });
}

function buildPositionedLessons(lessons: Lesson[]): PositionedLesson[] {
    const segments = lessons
        .map(toLessonSegment)
        .sort((left, right) => {
            if (left.startMin !== right.startMin) return left.startMin - right.startMin;
            if (left.endMin !== right.endMin) return left.endMin - right.endMin;
            return left.lesson.id.localeCompare(right.lesson.id);
        });

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

const Day = ({ currentDate, onLessonClick, onSlotClick, lessons = [] }: DayProps) => {
    const scrollRef = useRef<HTMLDivElement>(null);

    const iso = toLocalDateKey(currentDate);
    const dayLessons = useMemo(
        () => lessons.filter((l) => l.date === iso),
        [lessons, iso]
    );
    const positionedLessons = useMemo(
        () => buildPositionedLessons(dayLessons),
        [dayLessons]
    );

    const now = new Date();
    const todayIso = toLocalDateKey(now);
    const isToday = iso === todayIso;
    const nowMinutes = now.getHours() * 60 + now.getMinutes();
    const nowTop = (nowMinutes / 60) * HOUR_HEIGHT;

    const dayName = DAY_NAMES_FULL[currentDate.getDay()];
    const dayNum = currentDate.getDate();
    const monthName = MONTH_NAMES_GEN[currentDate.getMonth()];

    const gridHeight = HOUR_HEIGHT * 24;

    const handleSlotClick = (event: MouseEvent<HTMLDivElement>) => {
        if (!onSlotClick) return;
        const rect = event.currentTarget.getBoundingClientRect();
        const y = event.clientY - rect.top;
        onSlotClick({ date: iso, time: snapYToTime(y) });
    };

    // Scroll to 8 AM on mount (or 2h before now if later)
    useEffect(() => {
        if (scrollRef.current) {
            const scrollTo = Math.max(8 * HOUR_HEIGHT, nowTop - 2 * HOUR_HEIGHT);
            scrollRef.current.scrollTop = scrollTo;
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return (
        <Card view="outlined" className="repeto-schedule-calendar-card" style={{ overflow: "hidden" }}>
            <div className="repeto-calendar-shell">
                <div style={{ minWidth: 360 }}>
                    <div
                        className="repeto-calendar-header"
                        style={{
                            display: "flex",
                            borderBottom: "1px solid var(--g-color-line-generic)",
                        }}
                    >
                        <div style={{ width: TIME_COL, flexShrink: 0 }} />
                        <div
                            style={{
                                flex: 1,
                                minWidth: 304,
                                display: "flex",
                                flexDirection: "column",
                                alignItems: "center",
                                padding: "10px 4px 8px",
                                borderLeft: "1px solid var(--g-color-line-generic)",
                            }}
                        >
                            <Text
                                variant="caption-2"
                                color={isToday ? "brand" : "secondary"}
                                style={{
                                    textTransform: "uppercase",
                                    fontWeight: 500,
                                    letterSpacing: 0.5,
                                }}
                            >
                                {dayName}
                            </Text>
                            <div
                                style={{
                                    width: 32,
                                    height: 32,
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    borderRadius: "50%",
                                    background: isToday
                                        ? "var(--g-color-base-brand)"
                                        : "transparent",
                                    marginTop: 2,
                                }}
                            >
                                <Text
                                    variant="subheader-2"
                                    style={{
                                        color: isToday
                                            ? "var(--g-color-text-brand-contrast)"
                                            : "var(--g-color-text-primary)",
                                    }}
                                >
                                    {dayNum}
                                </Text>
                            </div>
                            <Text variant="caption-2" color="secondary">
                                {monthName}
                            </Text>
                        </div>
                    </div>

                    <div
                        ref={scrollRef}
                        className="repeto-calendar-scroll"
                        style={{ overflowY: "auto", overflowX: "hidden", maxHeight: "calc(100vh - 260px)" }}
                    >
                        <div
                            style={{
                                display: "flex",
                                height: gridHeight,
                                position: "relative",
                            }}
                        >
                    {/* ── Time labels ── */}
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

                    {/* ── Day column ── */}
                    <div
                        onClick={handleSlotClick}
                        className="repeto-calendar-slot-column"
                        style={{
                            flex: 1,
                            minWidth: 304,
                            position: "relative",
                            borderLeft: "1px solid var(--g-color-line-generic)",
                            cursor: "pointer",
                        }}
                    >
                        {/* Hour lines */}
                        {HOURS_24.map((h) => (
                            <div
                                key={h}
                                style={{
                                    position: "absolute",
                                    top: h * HOUR_HEIGHT,
                                    left: 0,
                                    right: 0,
                                    borderTop:
                                        h === 0
                                            ? "none"
                                            : "1px solid var(--g-color-line-generic)",
                                    pointerEvents: "none",
                                }}
                            />
                        ))}

                        {/* Half-hour dashed lines */}
                        {HOURS_24.map((h) => (
                            <div
                                key={`half-${h}`}
                                style={{
                                    position: "absolute",
                                    top: h * HOUR_HEIGHT + HOUR_HEIGHT / 2,
                                    left: 0,
                                    right: 0,
                                    borderTop:
                                        "1px dashed var(--g-color-line-generic)",
                                    opacity: 0.5,
                                    pointerEvents: "none",
                                }}
                            />
                        ))}

                        {/* Lesson blocks */}
                        {positionedLessons.map((positioned) => {
                            const laneWidth = `calc(${positioned.widthPct}% - 8px)`;
                            return (
                                <div
                                    key={positioned.lesson.id}
                                    onClick={(event) => event.stopPropagation()}
                                    style={{
                                        position: "absolute",
                                        top: positioned.top,
                                        left: `calc(${positioned.leftPct}% + 4px)`,
                                        width: laneWidth,
                                        maxWidth: laneWidth,
                                        height: positioned.blockHeight,
                                        zIndex: 2,
                                    }}
                                >
                                    <LessonBlock
                                        lesson={positioned.lesson}
                                        compact={positioned.useCompact}
                                        showTime={!positioned.useCompact}
                                        onClick={onLessonClick}
                                        style={{
                                            width: "100%",
                                            maxWidth: "100%",
                                        }}
                                    />
                                </div>
                            );
                        })}

                        {/* Now indicator */}
                        {isToday && (
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
                </div>
                    </div>
                </div>
            </div>
        </Card>
    );
};

export default Day;
