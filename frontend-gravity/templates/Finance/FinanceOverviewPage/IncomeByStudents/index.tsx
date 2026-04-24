import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/router";
import { Text, Card, Loader } from "@gravity-ui/uikit";
import { usePayments } from "@/hooks/usePayments";

const MONTH_NAMES_SHORT = [
    "Янв", "Фев", "Мар", "Апр", "Май", "Июн",
    "Июл", "Авг", "Сен", "Окт", "Ноя", "Дек",
];

// Token-driven palette for finance chart segments.
const PALETTE = [
    "var(--chart-brand)",
    "var(--chart-lavender)",
    "var(--chart-info)",
    "var(--chart-success)",
    "var(--chart-warning)",
];
const OTHERS_COLOR = "var(--chart-brand-soft)";

const TOP_N = 5;
const MIN_VISIBLE_HEIGHT_PCT = 6;
const EMPTY_COLUMN_HEIGHT_PCT = 36;
const EMPTY_SEGMENT_WEIGHTS = [34, 27, 21, 18];

const formatRub = (value: number) =>
    `${Math.round(value).toLocaleString("ru-RU")}\u00A0₽`;

const parseRuDate = (raw: string): Date | null => {
    const match = /^(\d{2})\.(\d{2})\.(\d{4})$/.exec(raw);
    if (!match) return null;
    const [, dd, mm, yyyy] = match;
    return new Date(Number(yyyy), Number(mm) - 1, Number(dd));
};

const toISODate = (d: Date) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
};

type TooltipState = {
    x: number;
    y: number;
    name: string;
    amount: number;
    monthLabel: string;
} | null;

type Segment = {
    id: string;
    name: string;
    amount: number;
    color: string;
};

type MonthBucket = {
    key: string;
    label: string;
    segments: Segment[];
    total: number;
    heightPct: number;
};

type LinkRibbon = {
    key: string;
    d: string;
    fill: string;
};

const ribbonsEqual = (a: LinkRibbon[], b: LinkRibbon[]): boolean => {
    if (a.length !== b.length) return false;
    for (let i = 0; i < a.length; i++) {
        if (a[i].key !== b[i].key) return false;
        if (a[i].d !== b[i].d) return false;
        if (a[i].fill !== b[i].fill) return false;
    }
    return true;
};

const withAlpha = (color: string, alpha: number): string =>
    `color-mix(in srgb, ${color} ${Math.round(alpha * 100)}%, transparent)`;

const IncomeByStudents = () => {
    const router = useRouter();
    const [tooltip, setTooltip] = useState<TooltipState>(null);
    const [ribbons, setRibbons] = useState<LinkRibbon[]>([]);
    const columnsRef = useRef<HTMLDivElement | null>(null);
    const segmentRefs = useRef<Record<string, HTMLButtonElement | null>>({});

    const { startISO, endISO } = useMemo(() => {
        const now = new Date();
        const start = new Date(now.getFullYear(), now.getMonth() - 2, 1);
        const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        return { startISO: toISODate(start), endISO: toISODate(end) };
    }, []);

    const { data: paymentsResp, loading } = usePayments({
        status: "PAID",
        from: startISO,
        to: endISO,
        limit: 500,
    });
    const payments = useMemo(() => paymentsResp?.data ?? [], [paymentsResp?.data]);

    const { months, grandTotal } = useMemo(() => {
        const now = new Date();
        const monthKeys: { key: string; label: string; year: number; month: number }[] = [];
        for (let i = 2; i >= 0; i--) {
            const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
            monthKeys.push({
                key: `${d.getFullYear()}-${d.getMonth()}`,
                label: `${MONTH_NAMES_SHORT[d.getMonth()]} ${String(d.getFullYear()).slice(-2)}`,
                year: d.getFullYear(),
                month: d.getMonth(),
            });
        }

        type Agg = {
            id: string;
            name: string;
            total: number;
            perMonth: Record<string, number>;
        };
        const byStudent = new Map<string, Agg>();

        for (const p of payments) {
            const dt = parseRuDate(p.date);
            if (!dt) continue;
            const key = `${dt.getFullYear()}-${dt.getMonth()}`;
            if (!monthKeys.find((m) => m.key === key)) continue;
            const entry =
                byStudent.get(p.studentId) ||
                {
                    id: p.studentId,
                    name: p.studentName || "Ученик",
                    total: 0,
                    perMonth: {},
                } as Agg;
            entry.total += p.amount;
            entry.perMonth[key] = (entry.perMonth[key] || 0) + p.amount;
            byStudent.set(p.studentId, entry);
        }

        const sorted = Array.from(byStudent.values()).sort((a, b) => b.total - a.total);
        const top = sorted.slice(0, TOP_N);
        const rest = sorted.slice(TOP_N);

        const monthsRaw: MonthBucket[] = monthKeys.map((m) => {
            const segments: Segment[] = [];
            top.forEach((s, i) => {
                const amount = s.perMonth[m.key] || 0;
                if (amount > 0) {
                    segments.push({
                        id: s.id,
                        name: s.name,
                        amount,
                        color: PALETTE[i] || PALETTE[PALETTE.length - 1],
                    });
                }
            });
            const restAmount = rest.reduce((sum, s) => sum + (s.perMonth[m.key] || 0), 0);
            if (restAmount > 0) {
                segments.push({
                    id: "__others__",
                    name: "Другие",
                    amount: restAmount,
                    color: OTHERS_COLOR,
                });
            }
            const total = segments.reduce((sum, seg) => sum + seg.amount, 0);
            return { key: m.key, label: m.label, segments, total, heightPct: 0 };
        });

        const maxMonthTotal = Math.max(1, ...monthsRaw.map((m) => m.total));
        const months = monthsRaw.map((m) => ({
            ...m,
            heightPct:
                m.total > 0
                    ? Math.max((m.total / maxMonthTotal) * 100, MIN_VISIBLE_HEIGHT_PCT)
                    : 0,
        }));
        const grandTotal = months.reduce((sum, m) => sum + m.total, 0);

        return { months, grandTotal };
    }, [payments]);

    const setSegmentRef = useCallback(
        (refKey: string) => (el: HTMLButtonElement | null) => {
            segmentRefs.current[refKey] = el;
        },
        []
    );

    const recalcRibbons = useCallback(() => {
        const container = columnsRef.current;
        if (!container || months.length < 2) {
            setRibbons((prev) => (prev.length === 0 ? prev : []));
            return;
        }

        const frame = container.getBoundingClientRect();
        const nextRibbons: LinkRibbon[] = [];

        for (let i = 0; i < months.length - 1; i++) {
            const leftMonth = months[i];
            const rightMonth = months[i + 1];
            const rightSegmentsById = new Map(
                rightMonth.segments.map((seg) => [seg.id, seg])
            );

            for (const leftSeg of leftMonth.segments) {
                if (!rightSegmentsById.has(leftSeg.id)) continue;

                const leftEl = segmentRefs.current[`${leftMonth.key}-${leftSeg.id}`];
                const rightEl = segmentRefs.current[`${rightMonth.key}-${leftSeg.id}`];
                if (!leftEl || !rightEl) continue;

                const leftRect = leftEl.getBoundingClientRect();
                const rightRect = rightEl.getBoundingClientRect();

                const x1 = leftRect.right - frame.left;
                const x2 = rightRect.left - frame.left;
                if (x2 <= x1) continue;

                const y1Top = leftRect.top - frame.top + 1;
                const y1Bottom = leftRect.bottom - frame.top - 1;
                const y2Top = rightRect.top - frame.top + 1;
                const y2Bottom = rightRect.bottom - frame.top - 1;

                const curve = (x2 - x1) * 0.42;
                const d = [
                    `M ${x1} ${y1Top}`,
                    `C ${x1 + curve} ${y1Top}, ${x2 - curve} ${y2Top}, ${x2} ${y2Top}`,
                    `L ${x2} ${y2Bottom}`,
                    `C ${x2 - curve} ${y2Bottom}, ${x1 + curve} ${y1Bottom}, ${x1} ${y1Bottom}`,
                    "Z",
                ].join(" ");

                nextRibbons.push({
                    key: `${leftMonth.key}-${rightMonth.key}-${leftSeg.id}`,
                    d,
                    fill: withAlpha(leftSeg.color, 0.18),
                });
            }
        }

        setRibbons((prev) => (ribbonsEqual(prev, nextRibbons) ? prev : nextRibbons));
    }, [months]);

    useEffect(() => {
        recalcRibbons();
    }, [recalcRibbons]);

    useEffect(() => {
        if (typeof window === "undefined") return;

        const onResize = () => recalcRibbons();
        window.addEventListener("resize", onResize);

        let observer: ResizeObserver | null = null;
        if (typeof ResizeObserver !== "undefined" && columnsRef.current) {
            observer = new ResizeObserver(() => recalcRibbons());
            observer.observe(columnsRef.current);
        }

        return () => {
            window.removeEventListener("resize", onResize);
            observer?.disconnect();
        };
    }, [recalcRibbons]);

    const handleEnter = (e: React.MouseEvent, seg: Segment, monthLabel: string) => {
        setTooltip({
            x: e.clientX,
            y: e.clientY,
            name: seg.name,
            amount: seg.amount,
            monthLabel,
        });
    };
    const handleMove = (e: React.MouseEvent) => {
        setTooltip((t) => (t ? { ...t, x: e.clientX, y: e.clientY } : t));
    };
    const handleLeave = () => setTooltip(null);

    return (
        <Card
            view="outlined"
            className="repeto-income-students-card repeto-income-chart-card"
        >
            <div className="repeto-card-header repeto-income-chart__header">
                <div className="repeto-income-chart__title-group">
                    <Text variant="subheader-2">Доход по ученикам</Text>
                </div>
                <div className="repeto-income-chart__total">
                    {formatRub(grandTotal)}
                </div>
            </div>

            {loading ? (
                <div className="repeto-card-body repeto-income-students-card__state">
                    <Loader size="s" />
                </div>
            ) : grandTotal === 0 ? (
                <div className="repeto-card-body repeto-income-students-card__state">
                    <Text variant="body-1" color="secondary">
                        Нет оплат за последние 3 месяца
                    </Text>
                </div>
            ) : (
                <div className="repeto-card-body repeto-income-chart__body">
                    <div className="repeto-income-chart__columns" ref={columnsRef}>
                        <svg
                            className="repeto-income-chart__links"
                            width="100%"
                            height="100%"
                            aria-hidden="true"
                            focusable="false"
                        >
                            {ribbons.map((ribbon) => (
                                <path
                                    key={ribbon.key}
                                    d={ribbon.d}
                                    fill={ribbon.fill}
                                />
                            ))}
                        </svg>
                        {months.map((m) => (
                            <div key={m.key} className="repeto-income-chart__col">
                                <span className="repeto-income-chart__col-total">
                                    {formatRub(m.total)}
                                </span>
                                <div className="repeto-income-chart__bar-wrap">
                                    <div
                                        className={`repeto-income-chart__bar${
                                            m.total === 0
                                                ? " repeto-income-chart__bar--placeholder"
                                                : ""
                                        }`}
                                        style={{
                                            height: `${
                                                m.total > 0 ? m.heightPct : EMPTY_COLUMN_HEIGHT_PCT
                                            }%`,
                                        }}
                                    >
                                        {m.total > 0
                                            ? m.segments.map((seg) => (
                                                  <button
                                                      type="button"
                                                      key={`${m.key}-${seg.id}`}
                                                      className="repeto-income-chart__seg"
                                                      style={{
                                                          flex: `${seg.amount} 0 0`,
                                                          background: seg.color,
                                                      }}
                                                      ref={setSegmentRef(`${m.key}-${seg.id}`)}
                                                      title={`${seg.name} · ${formatRub(seg.amount)}`}
                                                      onMouseEnter={(e) =>
                                                          handleEnter(e, seg, m.label)
                                                      }
                                                      onMouseMove={handleMove}
                                                      onMouseLeave={handleLeave}
                                                      onClick={() =>
                                                          seg.id !== "__others__" &&
                                                          router.push(`/students/${seg.id}`)
                                                      }
                                                      aria-label={`${seg.name}: ${formatRub(
                                                          seg.amount
                                                      )}`}
                                                  />
                                              ))
                                            : EMPTY_SEGMENT_WEIGHTS.map((weight, index) => (
                                                  <span
                                                      key={`${m.key}-placeholder-${index}`}
                                                      className="repeto-income-chart__seg-placeholder"
                                                      style={{ flex: `${weight} 0 0` }}
                                                      aria-hidden="true"
                                                  />
                                              ))}
                                    </div>
                                </div>
                                <span className="repeto-income-chart__col-label">
                                    {m.label}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {tooltip && (
                <div
                    className="repeto-income-chart__tooltip"
                    style={{ top: tooltip.y + 14, left: tooltip.x + 14 }}
                    role="tooltip"
                >
                    <div className="repeto-income-chart__tooltip-name">
                        {tooltip.name}
                    </div>
                    <div className="repeto-income-chart__tooltip-amount">
                        {formatRub(tooltip.amount)}
                        <span className="repeto-income-chart__tooltip-month">
                            {` · ${tooltip.monthLabel}`}
                        </span>
                    </div>
                </div>
            )}
        </Card>
    );
};

export default IncomeByStudents;
