import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { Text, Card, Icon, Loader, Tooltip } from "@gravity-ui/uikit";
import { ChevronRight } from "@gravity-ui/icons";
import type { IconData } from "@gravity-ui/uikit";
import { useAvailability, useOverrides } from "@/hooks/useAvailability";
import { useLessons } from "@/hooks/useLessons";

const MONTH_NAMES_SHORT = [
    "янв", "фев", "мар", "апр", "май", "июн",
    "июл", "авг", "сен", "окт", "ноя", "дек",
];

const CORE_WEEKS = 8;
const SIDE_DAYS = 7;
const MIN_COLS = 12;
const MAX_COLS = 34;
const MIN_COL_PX = 16;
const MIN_DOT_ROWS = 4;
const MAX_DOT_ROWS = 10;
const MIN_DOT_PX = 6;
const MAX_DOT_PX = 16;
const LABEL_ROW_PX = 14;

const clamp = (value: number, min: number, max: number) =>
    Math.max(min, Math.min(max, value));

const toISODate = (d: Date) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
};

const addDays = (d: Date, amount: number) => {
    const copy = new Date(d);
    copy.setDate(copy.getDate() + amount);
    return copy;
};

const formatShortDate = (d: Date) => `${d.getDate()} ${MONTH_NAMES_SHORT[d.getMonth()]}`;

// Mon=0 .. Sun=6 to match backend `dayOfWeek`
const mondayBasedDow = (d: Date) => (d.getDay() + 6) % 7;

const startOfWeekMon = (d: Date) => {
    const copy = new Date(d);
    copy.setDate(copy.getDate() - mondayBasedDow(copy));
    copy.setHours(0, 0, 0, 0);
    return copy;
};

type DotState = "booked" | "free" | "off";

type DayColumn = {
    key: string;
    dateLabel: string;
    tickLabel: string;
    bookedCount: number;
    totalCount: number;
    loadPct: number;
    isSide: boolean;
};

type MatrixColumn = {
    key: string;
    titleLabel: string;
    tickLabel: string;
    dots: DotState[];
    bookedCount: number;
    totalCount: number;
    loadPct: number;
    isSide: boolean;
};

type MatrixLayout = {
    bucketSize: number;
    dotRows: number;
    dotSize: number;
    colGap: number;
    rowGap: number;
    labelStep: number;
};

const buildDotCells = (bookedCount: number, totalCount: number, dotRows: number): DotState[] => {
    if (totalCount === 0) {
        return Array.from({ length: dotRows }, () => "off");
    }

    let bookedDots = Math.round((bookedCount / totalCount) * dotRows);
    if (bookedCount > 0) bookedDots = Math.max(1, bookedDots);
    if (bookedCount < totalCount) bookedDots = Math.min(dotRows - 1, bookedDots);
    if (bookedCount === totalCount) bookedDots = dotRows;

    const cells: DotState[] = Array.from({ length: dotRows }, () => "free");
    const bookedStart = Math.floor((dotRows - bookedDots) / 2);
    for (let idx = bookedStart; idx < bookedStart + bookedDots; idx += 1) {
        cells[idx] = "booked";
    }
    return cells;
};

const estimateMatrixLayout = (zoneWidth: number, zoneHeight: number, totalDays: number): MatrixLayout => {
    const safeWidth = zoneWidth > 0 ? zoneWidth : 540;
    const safeHeight = zoneHeight > 0 ? zoneHeight : 96;

    const colGap = safeWidth < 520 ? 1 : 2;
    const rowGap = safeHeight < 96 ? 1 : 2;

    const rawCapacity = Math.floor((safeWidth + colGap) / (MIN_COL_PX + colGap));
    const columnCapacity = clamp(rawCapacity, MIN_COLS, MAX_COLS);
    const bucketSize = Math.max(1, Math.ceil(totalDays / columnCapacity));
    const renderedColumns = Math.ceil(totalDays / bucketSize);

    const availableHeight = Math.max(24, safeHeight - LABEL_ROW_PX);
    const rawRows = Math.floor((availableHeight + rowGap) / (MIN_DOT_PX + rowGap));
    const dotRows = clamp(rawRows, MIN_DOT_ROWS, MAX_DOT_ROWS);
    const dotSize = clamp(
        Math.floor((availableHeight - (dotRows - 1) * rowGap) / dotRows),
        MIN_DOT_PX,
        MAX_DOT_PX,
    );

    const labelStep = renderedColumns > 24
        ? 3
        : renderedColumns > 16
            ? 2
            : 1;

    return {
        bucketSize,
        dotRows,
        dotSize,
        colGap,
        rowGap,
        labelStep,
    };
};

const WeekLoad = () => {
    const router = useRouter();
    const matrixWrapRef = useRef<HTMLDivElement | null>(null);
    const [matrixZone, setMatrixZone] = useState({ width: 0, height: 0 });

    useEffect(() => {
        const node = matrixWrapRef.current;
        if (!node) return;

        const updateFromNode = () => {
            const next = {
                width: Math.round(node.clientWidth),
                height: Math.round(node.clientHeight),
            };
            setMatrixZone((prev) =>
                prev.width === next.width && prev.height === next.height ? prev : next,
            );
        };

        updateFromNode();

        if (typeof ResizeObserver === "undefined") {
            return;
        }

        const observer = new ResizeObserver((entries) => {
            const entry = entries[0];
            if (!entry) return;
            const next = {
                width: Math.round(entry.contentRect.width),
                height: Math.round(entry.contentRect.height),
            };
            setMatrixZone((prev) =>
                prev.width === next.width && prev.height === next.height ? prev : next,
            );
        });

        observer.observe(node);
        return () => observer.disconnect();
    }, []);

    const {
        coreStart,
        coreEnd,
        rangeStart,
        rangeEnd,
        rangeStartISO,
        rangeEndISO,
        periodLabel,
    } = useMemo(() => {
        const base = startOfWeekMon(new Date());
        const coreRangeStart = base;
        const coreRangeEnd = addDays(coreRangeStart, CORE_WEEKS * 7 - 1);
        const fullStart = addDays(coreRangeStart, -SIDE_DAYS);
        const fullEnd = addDays(coreRangeEnd, SIDE_DAYS);

        return {
            coreStart: coreRangeStart,
            coreEnd: coreRangeEnd,
            rangeStart: fullStart,
            rangeEnd: fullEnd,
            rangeStartISO: toISODate(fullStart),
            rangeEndISO: toISODate(fullEnd),
            periodLabel: `${formatShortDate(coreRangeStart)} - ${formatShortDate(coreRangeEnd)}`,
        };
    }, []);

    const { data: slots = [], loading: loadingSlots } = useAvailability();
    const { data: overrides = [], loading: loadingOverrides } = useOverrides();
    const { data: lessons = [], loading: loadingLessons } = useLessons({
        from: rangeStartISO,
        to: rangeEndISO,
    });

    const loading = loadingSlots || loadingLessons || loadingOverrides;

    const { dayColumns, coreBooked, coreTotal } = useMemo(() => {
        type SlotInstance = { startTime: string };

        const byDow = new Map<number, SlotInstance[]>();
        for (const s of slots) {
            const arr = byDow.get(s.dayOfWeek) || [];
            arr.push({ startTime: s.startTime });
            byDow.set(s.dayOfWeek, arr);
        }
        for (const arr of byDow.values()) {
            arr.sort((a, b) => a.startTime.localeCompare(b.startTime));
        }

        const overrideByDate = new Map<string, { isBlocked: boolean; slots: SlotInstance[] }>();
        for (const ov of overrides) {
            overrideByDate.set(ov.date, {
                isBlocked: ov.isBlocked,
                slots: ov.slots?.map((s) => ({ startTime: s.startTime })) || [],
            });
        }

        // Index lessons by date+startTime for O(1) lookup.
        const lessonKey = new Set<string>();
        for (const l of lessons) {
            if (l.status === "cancelled_student" || l.status === "cancelled_tutor") {
                continue;
            }
            lessonKey.add(`${l.date}|${(l.startTime || "").slice(0, 5)}`);
        }

        const rows: DayColumn[] = [];
        let coreBooked = 0;
        let coreTotal = 0;

        const cursor = new Date(rangeStart);
        while (cursor <= rangeEnd) {
            const iso = toISODate(cursor);
            const dow = mondayBasedDow(cursor);
            let daySlots: SlotInstance[] = (byDow.get(dow) || []).slice();

            const ov = overrideByDate.get(iso);
            if (ov) {
                if (ov.isBlocked) {
                    const blockedTimes = new Set(ov.slots.map((s) => s.startTime));
                    if (ov.slots.length === 0) {
                        daySlots = [];
                    } else {
                        daySlots = daySlots.filter((s) => !blockedTimes.has(s.startTime));
                    }
                } else {
                    const seen = new Set(daySlots.map((s) => s.startTime));
                    for (const extra of ov.slots) {
                        if (!seen.has(extra.startTime)) {
                            daySlots.push(extra);
                            seen.add(extra.startTime);
                        }
                    }
                }
            }

            let bookedCount = 0;
            for (const slot of daySlots) {
                if (lessonKey.has(`${iso}|${slot.startTime}`)) {
                    bookedCount += 1;
                }
            }
            const totalCount = daySlots.length;
            const loadPct = totalCount > 0
                ? Math.round((bookedCount / totalCount) * 100)
                : 0;

            const isSide = cursor < coreStart || cursor > coreEnd;
            const isWeekStart = mondayBasedDow(cursor) === 0;
            const tickLabel = isWeekStart
                ? String(cursor.getDate())
                : "";

            rows.push({
                key: iso,
                dateLabel: formatShortDate(cursor),
                tickLabel,
                bookedCount,
                totalCount,
                loadPct,
                isSide,
            });

            if (!isSide) {
                coreBooked += bookedCount;
                coreTotal += totalCount;
            }

            cursor.setDate(cursor.getDate() + 1);
        }

        return { dayColumns: rows, coreBooked, coreTotal };
    }, [slots, overrides, lessons, coreStart, coreEnd, rangeStart, rangeEnd]);

    const matrixLayout = useMemo(
        () => estimateMatrixLayout(matrixZone.width, matrixZone.height, dayColumns.length),
        [matrixZone.width, matrixZone.height, dayColumns.length],
    );

    const columns = useMemo<MatrixColumn[]>(() => {
        const result: MatrixColumn[] = [];

        for (
            let startIdx = 0, bucketIndex = 0;
            startIdx < dayColumns.length;
            startIdx += matrixLayout.bucketSize, bucketIndex += 1
        ) {
            const chunk = dayColumns.slice(startIdx, startIdx + matrixLayout.bucketSize);
            if (chunk.length === 0) continue;

            const bookedCount = chunk.reduce((sum, item) => sum + item.bookedCount, 0);
            const totalCount = chunk.reduce((sum, item) => sum + item.totalCount, 0);
            const loadPct = totalCount > 0
                ? Math.round((bookedCount / totalCount) * 100)
                : 0;

            const first = chunk[0];
            const last = chunk[chunk.length - 1];
            const weekTick = chunk.find((item) => item.tickLabel)?.tickLabel || "";
            const defaultTick = String(Number(first.key.slice(8, 10)));
            const tickLabel = bucketIndex % matrixLayout.labelStep === 0
                ? (weekTick || defaultTick)
                : "";

            result.push({
                key: `${first.key}-${last.key}`,
                titleLabel: first.key === last.key
                    ? first.dateLabel
                    : `${first.dateLabel} - ${last.dateLabel}`,
                tickLabel,
                dots: buildDotCells(bookedCount, totalCount, matrixLayout.dotRows),
                bookedCount,
                totalCount,
                loadPct,
                isSide: chunk.every((item) => item.isSide),
            });
        }

        return result;
    }, [dayColumns, matrixLayout.bucketSize, matrixLayout.dotRows, matrixLayout.labelStep]);

    const matrixStyle = useMemo(() => {
        return {
            gridTemplateColumns: `repeat(${Math.max(columns.length, 1)}, minmax(0, 1fr))`,
            ["--repeto-dot-size" as any]: `${matrixLayout.dotSize}px`,
            ["--repeto-dot-rows" as any]: String(matrixLayout.dotRows),
            ["--repeto-col-gap" as any]: `${matrixLayout.colGap}px`,
            ["--repeto-row-gap" as any]: `${matrixLayout.rowGap}px`,
        } as CSSProperties;
    }, [columns.length, matrixLayout.dotSize, matrixLayout.dotRows, matrixLayout.colGap, matrixLayout.rowGap]);

    const averageLoad = coreTotal > 0
        ? Math.round((coreBooked / coreTotal) * 100)
        : 0;

    return (
        <Card className="repeto-week-load-card" view="outlined">
            {loading ? (
                <div className="repeto-card-body repeto-week-load__state">
                    <Loader size="s" />
                </div>
            ) : coreTotal === 0 ? (
                <div className="repeto-card-body repeto-week-load__state">
                    <Text variant="body-1" color="secondary">
                        Настройте рабочие часы, чтобы увидеть нагрузку
                    </Text>
                    <button
                        type="button"
                        className="repeto-week-load__cta repeto-week-load__cta--sm"
                        onClick={() => router.push("/schedule")}
                    >
                        Смотреть расписание
                    </button>
                </div>
            ) : (
                <div className="repeto-card-body repeto-week-load__body">
                    <aside className="repeto-week-load__aside">
                        <div className="repeto-week-load__aside-head">
                            <div className="repeto-week-load__title-group">
                                <Text variant="subheader-2">Нагрузка по слотам</Text>
                                <Text variant="caption-2" color="secondary">
                                    {periodLabel}
                                </Text>
                            </div>
                            <Link
                                href="/schedule"
                                className="repeto-card-chevron repeto-week-load__aside-chevron"
                                aria-label="Открыть расписание"
                            >
                                <Icon data={ChevronRight as IconData} size={18} />
                            </Link>
                        </div>

                        <ul className="repeto-week-load__legend">
                            <li className="repeto-week-load__legend-item">
                                <span className="repeto-week-load__dot repeto-week-load__dot--booked" />
                                Занято
                            </li>
                            <li className="repeto-week-load__legend-item">
                                <span className="repeto-week-load__dot repeto-week-load__dot--free" />
                                Свободно
                            </li>
                            <li className="repeto-week-load__legend-item">
                                <span className="repeto-week-load__dot repeto-week-load__dot--off" />
                                Нет слотов
                            </li>
                        </ul>

                        <div className="repeto-week-load__summary">
                            <div className="repeto-week-load__summary-value">{averageLoad}%</div>
                            <div className="repeto-week-load__summary-label">Средняя загрузка за месяц</div>
                        </div>

                        <button
                            type="button"
                            className="repeto-week-load__cta"
                            onClick={() => router.push("/schedule")}
                        >
                            Смотреть расписание
                        </button>
                    </aside>

                    <div className="repeto-week-load__matrix-wrap" ref={matrixWrapRef}>
                        <div
                            className="repeto-week-load__matrix"
                            style={matrixStyle}
                        >
                            {columns.map((col) => (
                                <div
                                    key={col.key}
                                    className={`repeto-week-load__day${col.isSide ? " repeto-week-load__day--side" : ""}`}
                                >
                                    <div className="repeto-week-load__dots">
                                        {col.dots.map((state, i) => (
                                            <Tooltip
                                                key={i}
                                                placement="right"
                                                openDelay={70}
                                                closeDelay={0}
                                                content={
                                                    <span>
                                                        {col.titleLabel}
                                                        <br />
                                                        {`Загрузка: ${col.loadPct}%`}
                                                    </span>
                                                }
                                            >
                                                <span
                                                    className={`repeto-week-load__dot repeto-week-load__dot--${state} repeto-week-load__dot-cell`}
                                                    role="img"
                                                    aria-label={`${col.titleLabel}. Загрузка ${col.loadPct} процентов.`}
                                                />
                                            </Tooltip>
                                        ))}
                                    </div>
                                    <span className="repeto-week-load__tick">{col.tickLabel}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </Card>
    );
};

export default WeekLoad;
