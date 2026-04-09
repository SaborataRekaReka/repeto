import { useState, useCallback, useRef, useEffect } from "react";
import Icon from "@/components/Icon";
import {
    useAvailability,
    setAvailability,
    useOverrides,
    setOverride,
    deleteOverride,
    type AvailabilitySlot,
    type AvailabilityOverride,
} from "@/hooks/useAvailability";

const DAY_NAMES = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];
const HOURS = Array.from({ length: 24 }, (_, i) => i);

function endTime(start: string): string {
    const [h, m] = start.split(":").map(Number);
    const total = h * 60 + m + 30;
    return `${String(Math.floor(total / 60)).padStart(2, "0")}:${String(
        total % 60
    ).padStart(2, "0")}`;
}

type CellKey = `${number}-${number}`; // "dayOfWeek-hour"

const AvailabilityEditor = () => {
    const { data: saved, mutate } = useAvailability();
    const [open, setOpen] = useState(false);
    const [cells, setCells] = useState<Set<CellKey>>(new Set());
    const [dirty, setDirty] = useState(false);
    const [saving, setSaving] = useState(false);
    const [saveMsg, setSaveMsg] = useState<string | null>(null);

    const [dragMode, setDragMode] = useState<"add" | "remove">("add");
    const dragRef = useRef(false);

    // Sync from API — convert 30-min slots to hour-cells
    useEffect(() => {
        if (saved) {
            const set = new Set<CellKey>();
            for (const s of saved) {
                const hour = parseInt(s.startTime.split(":")[0], 10);
                set.add(`${s.dayOfWeek}-${hour}` as CellKey);
            }
            setCells(set);
            setDirty(false);
        }
    }, [saved]);

    const toggleCell = useCallback(
        (day: number, hour: number, mode?: "add" | "remove") => {
            const key: CellKey = `${day}-${hour}`;
            setCells((prev) => {
                const next = new Set(prev);
                const shouldAdd =
                    mode === "add" || (!mode && !prev.has(key));
                if (shouldAdd) next.add(key);
                else next.delete(key);
                return next;
            });
            setDirty(true);
        },
        []
    );

    const handleMouseDown = (day: number, hour: number) => {
        const key: CellKey = `${day}-${hour}`;
        const mode = cells.has(key) ? "remove" : "add";
        setDragMode(mode);
        dragRef.current = true;
        toggleCell(day, hour, mode);
    };

    const handleMouseEnter = (day: number, hour: number) => {
        if (dragRef.current) toggleCell(day, hour, dragMode);
    };

    useEffect(() => {
        const up = () => {
            dragRef.current = false;
        };
        window.addEventListener("mouseup", up);
        return () => window.removeEventListener("mouseup", up);
    }, []);

    const toggleDay = (day: number) => {
        setCells((prev) => {
            const next = new Set(prev);
            const keys = HOURS.map((h) => `${day}-${h}` as CellKey);
            const allActive = keys.every((k) => prev.has(k));
            for (const k of keys) {
                if (allActive) next.delete(k);
                else next.add(k);
            }
            return next;
        });
        setDirty(true);
    };

    const toggleHour = (hour: number) => {
        setCells((prev) => {
            const next = new Set(prev);
            const keys = DAY_NAMES.map(
                (_, i) => `${i}-${hour}` as CellKey
            );
            const allActive = keys.every((k) => prev.has(k));
            for (const k of keys) {
                if (allActive) next.delete(k);
                else next.add(k);
            }
            return next;
        });
        setDirty(true);
    };

    // Save: expand each hour-cell into two 30-min API slots
    const handleSave = async () => {
        setSaving(true);
        setSaveMsg(null);
        try {
            const slots: Omit<AvailabilitySlot, "id">[] = [];
            for (const key of cells) {
                const [dayStr, hourStr] = key.split("-");
                const day = Number(dayStr);
                const h = Number(hourStr);
                const hh = String(h).padStart(2, "0");
                slots.push({
                    dayOfWeek: day,
                    startTime: `${hh}:00`,
                    endTime: `${hh}:30`,
                });
                slots.push({
                    dayOfWeek: day,
                    startTime: `${hh}:30`,
                    endTime: endTime(`${hh}:30`),
                });
            }
            await setAvailability(slots);
            await mutate();
            setDirty(false);
            setSaveMsg("Сохранено");
            setTimeout(() => setSaveMsg(null), 2000);
        } catch {
            setSaveMsg("Ошибка сохранения");
        } finally {
            setSaving(false);
        }
    };

    const handleReset = () => {
        if (saved) {
            const set = new Set<CellKey>();
            for (const s of saved) {
                const hour = parseInt(s.startTime.split(":")[0], 10);
                set.add(`${s.dayOfWeek}-${hour}` as CellKey);
            }
            setCells(set);
        } else {
            setCells(new Set());
        }
        setDirty(false);
    };

    const totalHours = cells.size;

    // ── Overrides ──
    const { data: overrides = [], mutate: mutateOverrides } = useOverrides();
    const [addingException, setAddingException] = useState(false);
    const [exDate, setExDate] = useState("");
    const [exType, setExType] = useState<"blocked" | "custom">("blocked");
    const [exFrom, setExFrom] = useState("09:00");
    const [exTo, setExTo] = useState("18:00");
    const [exSaving, setExSaving] = useState(false);

    const MONTHS_GEN = [
        "января", "февраля", "марта", "апреля", "мая", "июня",
        "июля", "августа", "сентября", "октября", "ноября", "декабря",
    ];
    const WEEKDAYS = ["вс", "пн", "вт", "ср", "чт", "пт", "сб"];

    const formatDate = (dateStr: string) => {
        const d = new Date(dateStr + "T00:00:00");
        return `${d.getDate()} ${MONTHS_GEN[d.getMonth()]}, ${WEEKDAYS[d.getDay()]}`;
    };

    const handleAddException = async () => {
        if (!exDate) return;
        setExSaving(true);
        try {
            if (exType === "blocked") {
                await setOverride(exDate, true);
            } else {
                // Generate 30-min slots for the range
                const slots: { startTime: string; endTime: string }[] = [];
                const [fh, fm] = exFrom.split(":").map(Number);
                const [th, tm] = exTo.split(":").map(Number);
                const fromMin = fh * 60 + fm;
                const toMin = th * 60 + tm;
                for (let m = fromMin; m < toMin; m += 30) {
                    const sh = String(Math.floor(m / 60)).padStart(2, "0");
                    const sm = String(m % 60).padStart(2, "0");
                    const eh = String(Math.floor((m + 30) / 60)).padStart(2, "0");
                    const em = String((m + 30) % 60).padStart(2, "0");
                    slots.push({ startTime: `${sh}:${sm}`, endTime: `${eh}:${em}` });
                }
                await setOverride(exDate, false, slots);
            }
            await mutateOverrides();
            setAddingException(false);
            setExDate("");
        } catch {
            // silent
        } finally {
            setExSaving(false);
        }
    };

    const handleDeleteException = async (date: string) => {
        await deleteOverride(date);
        await mutateOverrides();
    };

    const handleEditException = (ov: AvailabilityOverride) => {
        setExDate(ov.date);
        if (ov.isBlocked) {
            setExType("blocked");
            setExFrom("09:00");
            setExTo("18:00");
        } else {
            setExType("custom");
            setExFrom(ov.slots[0]?.startTime || "09:00");
            setExTo(ov.slots[ov.slots.length - 1]?.endTime || "18:00");
        }
        setAddingException(true);
    };

    return (
        <div className="card mb-6 md:mb-5">
            {/* Collapsed header */}
            <button
                className="flex items-center justify-between w-full px-5 py-3 cursor-pointer"
                onClick={() => setOpen((v) => !v)}
            >
                <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-8 h-8 rounded-sm bg-purple-3 dark:bg-purple-1/20">
                        <Icon
                            className="icon-18 dark:fill-white"
                            name="clock"
                        />
                    </div>
                    <div className="text-left">
                        <span className="text-sm font-bold">
                            Рабочие часы
                        </span>
                        {totalHours > 0 && !open && (
                            <span className="ml-2 text-xs text-n-3 dark:text-white/50">
                                {totalHours} ч / неделю
                            </span>
                        )}
                    </div>
                </div>
                <Icon
                    className={`icon-20 transition-transform duration-200 dark:fill-white ${
                        open ? "rotate-180" : ""
                    }`}
                    name="arrow-bottom"
                />
            </button>

            {/* Expanded panel */}
            {open && (
                <div className="border-t border-n-1 dark:border-white">
                    <div
                        className="overflow-x-auto select-none"
                        onDragStart={(e) => e.preventDefault()}
                    >
                        <div className="min-w-[700px]">
                            {/* Hour headers */}
                            <div className="flex">
                                <div className="w-10 shrink-0" />
                                {HOURS.map((h) => (
                                    <button
                                        key={h}
                                        className="flex-1 py-2 text-center text-[11px] text-n-3 dark:text-white/50 hover:text-purple-1 dark:hover:text-purple-1 transition-colors cursor-pointer font-bold"
                                        onClick={() => toggleHour(h)}
                                        title={`${h}:00 — все дни`}
                                    >
                                        {h}
                                    </button>
                                ))}
                            </div>

                            {/* Day rows */}
                            {DAY_NAMES.map((dayName, di) => (
                                <div key={di} className="flex">
                                    <button
                                        className="w-10 shrink-0 flex items-center justify-center text-xs font-bold text-n-3 dark:text-white/50 hover:text-purple-1 dark:hover:text-purple-1 transition-colors cursor-pointer border-t border-n-1 dark:border-white/20"
                                        onClick={() => toggleDay(di)}
                                        title={`Весь ${dayName}`}
                                    >
                                        {dayName}
                                    </button>
                                    {HOURS.map((h) => {
                                        const key: CellKey = `${di}-${h}`;
                                        const active = cells.has(key);
                                        return (
                                            <div
                                                key={key}
                                                className={`flex-1 border-t border-l border-n-1 dark:border-white/20 cursor-pointer transition-colors ${
                                                    active
                                                        ? "bg-green-1/30 hover:bg-green-1/50"
                                                        : "bg-white dark:bg-n-1 hover:bg-purple-1/10"
                                                }`}
                                                style={{ height: 28 }}
                                                onMouseDown={() =>
                                                    handleMouseDown(di, h)
                                                }
                                                onMouseEnter={() =>
                                                    handleMouseEnter(di, h)
                                                }
                                            />
                                        );
                                    })}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="flex items-center justify-between px-5 py-3 border-t border-n-1 dark:border-white">
                        <div className="text-xs text-n-3 dark:text-white/50">
                            {totalHours > 0
                                ? `${totalHours} ч / неделю`
                                : "Выделите ячейки мышью"}
                        </div>
                        <div className="flex items-center gap-2">
                            {saveMsg && (
                                <span
                                    className={`text-xs font-bold ${
                                        saveMsg === "Сохранено"
                                            ? "text-green-1"
                                            : "text-pink-1"
                                    }`}
                                >
                                    {saveMsg}
                                </span>
                            )}
                            {dirty && (
                                <button
                                    className="btn-stroke btn-small"
                                    onClick={handleReset}
                                >
                                    Сбросить
                                </button>
                            )}
                            <button
                                className="btn-purple btn-small"
                                onClick={handleSave}
                                disabled={saving || !dirty}
                            >
                                {saving ? "…" : "Сохранить"}
                            </button>
                        </div>
                    </div>

                    {/* ── Exceptions section ── */}
                    <div className="border-t border-n-1 dark:border-white px-5 py-3">
                        <div className="flex items-center justify-between mb-3">
                            <span className="text-xs font-bold">
                                Исключения
                            </span>
                            {!addingException && (
                                <button
                                    className="flex items-center gap-1 text-xs font-bold text-purple-1 hover:text-purple-2 transition-colors cursor-pointer"
                                    onClick={() => setAddingException(true)}
                                >
                                    <Icon className="icon-14" name="add-circle" />
                                    Добавить
                                </button>
                            )}
                        </div>

                        {/* Add exception form */}
                        {addingException && (
                            <div className="flex flex-wrap items-end gap-3 mb-3 p-3 border border-dashed border-n-1 dark:border-white/30">
                                <div>
                                    <label className="block text-[11px] font-bold text-n-3 dark:text-white/50 mb-1">
                                        Дата
                                    </label>
                                    <input
                                        type="date"
                                        className="h-8 px-3 text-xs border border-n-1 dark:border-white rounded-sm bg-white dark:bg-n-1 dark:text-white"
                                        value={exDate}
                                        onChange={(e) => setExDate(e.target.value)}
                                    />
                                </div>
                                <div>
                                    <label className="block text-[11px] font-bold text-n-3 dark:text-white/50 mb-1">
                                        Тип
                                    </label>
                                    <div className="flex items-center gap-4 h-8">
                                        <label className="inline-flex items-center gap-2 text-xs font-medium text-n-1 dark:text-white cursor-pointer select-none">
                                            <input
                                                type="radio"
                                                name="exception-type"
                                                className="sr-only"
                                                checked={exType === "blocked"}
                                                onChange={() => setExType("blocked")}
                                            />
                                            <span className="relative w-4 h-4 rounded-full border border-n-1 dark:border-white">
                                                <span
                                                    className={`absolute inset-1 rounded-full transition-opacity dark:bg-white ${
                                                        exType === "blocked"
                                                            ? "opacity-100 bg-n-1"
                                                            : "opacity-0 bg-n-1"
                                                    }`}
                                                />
                                            </span>
                                            Выходной
                                        </label>
                                        <label className="inline-flex items-center gap-2 text-xs font-medium text-n-1 dark:text-white cursor-pointer select-none">
                                            <input
                                                type="radio"
                                                name="exception-type"
                                                className="sr-only"
                                                checked={exType === "custom"}
                                                onChange={() => setExType("custom")}
                                            />
                                            <span className="relative w-4 h-4 rounded-full border border-n-1 dark:border-white">
                                                <span
                                                    className={`absolute inset-1 rounded-full transition-opacity dark:bg-white ${
                                                        exType === "custom"
                                                            ? "opacity-100 bg-n-1"
                                                            : "opacity-0 bg-n-1"
                                                    }`}
                                                />
                                            </span>
                                            Свои часы
                                        </label>
                                    </div>
                                </div>
                                {exType === "custom" && (
                                    <div className="flex items-center gap-1">
                                        <div>
                                            <label className="block text-[11px] font-bold text-n-3 dark:text-white/50 mb-1">
                                                С
                                            </label>
                                            <input
                                                type="time"
                                                className="h-8 px-2 text-xs border border-n-1 dark:border-white rounded-sm bg-white dark:bg-n-1 dark:text-white"
                                                value={exFrom}
                                                onChange={(e) => setExFrom(e.target.value)}
                                                step={1800}
                                            />
                                        </div>
                                        <span className="mt-4 text-xs text-n-3">—</span>
                                        <div>
                                            <label className="block text-[11px] font-bold text-n-3 dark:text-white/50 mb-1">
                                                До
                                            </label>
                                            <input
                                                type="time"
                                                className="h-8 px-2 text-xs border border-n-1 dark:border-white rounded-sm bg-white dark:bg-n-1 dark:text-white"
                                                value={exTo}
                                                onChange={(e) => setExTo(e.target.value)}
                                                step={1800}
                                            />
                                        </div>
                                    </div>
                                )}
                                <div className="flex gap-1">
                                    <button
                                        className="btn-purple btn-small"
                                        onClick={handleAddException}
                                        disabled={!exDate || exSaving}
                                    >
                                        {exSaving ? "…" : "OK"}
                                    </button>
                                    <button
                                        className="btn-stroke btn-small"
                                        onClick={() => {
                                            setAddingException(false);
                                            setExDate("");
                                        }}
                                    >
                                        Закрыть
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* List of existing exceptions */}
                        {overrides.length > 0 ? (
                            <div className="space-y-1">
                                {overrides.map((ov) => (
                                    <div
                                        key={ov.date}
                                        className="flex items-center justify-between py-1.5"
                                    >
                                        <div className="flex items-center gap-2 text-xs">
                                            <span className="font-bold">
                                                {formatDate(ov.date)}
                                            </span>
                                            {ov.isBlocked ? (
                                                <span className="label-pink">
                                                    Выходной
                                                </span>
                                            ) : (
                                                <span className="label-green">
                                                    {ov.slots[0]?.startTime}–{ov.slots[ov.slots.length - 1]?.endTime}
                                                </span>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <button
                                                className="text-n-3 hover:text-purple-1 transition-colors cursor-pointer"
                                                onClick={() => handleEditException(ov)}
                                                title="Редактировать"
                                            >
                                                <Icon className="icon-16" name="edit" />
                                            </button>
                                            <button
                                                className="text-n-3 hover:text-pink-1 transition-colors cursor-pointer"
                                                onClick={() => handleDeleteException(ov.date)}
                                                title="Удалить исключение"
                                            >
                                                <Icon className="icon-16" name="remove" />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : !addingException ? (
                            <p className="text-xs text-n-3 dark:text-white/40">
                                Нет исключений. Действует обычное расписание.
                            </p>
                        ) : null}
                    </div>
                </div>
            )}
        </div>
    );
};

export default AvailabilityEditor;
