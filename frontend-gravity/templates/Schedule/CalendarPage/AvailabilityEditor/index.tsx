import { useState, useCallback, useRef, useEffect } from "react";
import { Text, Button, Icon, Card, SegmentedRadioGroup } from "@gravity-ui/uikit";
import {
    ArrowChevronDown,
    Clock,
    CirclePlus,
    Pencil,
    TrashBin,
} from "@gravity-ui/icons";
import type { IconData } from "@gravity-ui/uikit";
import {
    useAvailability,
    setAvailability,
    useOverrides,
    setOverride,
    deleteOverride,
    type AvailabilitySlot,
    type AvailabilityOverride,
} from "@/hooks/useAvailability";
import StyledDateInput from "@/components/StyledDateInput";
import StyledTimeInput from "@/components/StyledTimeInput";
import { accent } from "@/constants/brand";
import { useThemeMode } from "@/contexts/ThemeContext";

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
    const { theme } = useThemeMode();
    const isDarkTheme = theme === "dark";
    // Рабочие часы — нейтральная сетка. Акцент (accent) оставлен только для
    // header-иконки и активной «сегодня»-метки в календаре; сама карта занятости
    // больше не перекрашивает половину экрана в зелёный.
    const workHoursActiveBg = isDarkTheme
        ? "color-mix(in srgb, var(--accent) 34%, transparent)"
        : "#dcfce7";
    const workHoursIdleBg = "transparent";
    const workHoursDayActiveBg = isDarkTheme
        ? "var(--accent)"
        : "#22c55e";
    const workHoursDayActiveText = "#ffffff";
    const headerIconBg = isDarkTheme
        ? "var(--g-color-base-brand-light)"
        : accent[100];
    const headerIconColor = isDarkTheme
        ? "var(--g-color-text-brand)"
        : accent[700];

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
        <Card
            view="outlined"
            className="repeto-availability-card"
            style={{ marginBottom: 24, overflow: "hidden" }}
        >
            {/* ── Header (toggle) ── */}
            <div
                className="repeto-availability-card__header"
                onClick={() => setOpen((v) => !v)}
                style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "12px 16px",
                    cursor: "pointer",
                    userSelect: "none",
                }}
            >
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div
                        style={{
                            width: 32,
                            height: 32,
                            borderRadius: 8,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            background: headerIconBg,
                        }}
                    >
                        <Icon
                            data={Clock as IconData}
                            size={18}
                            style={{ color: headerIconColor }}
                        />
                    </div>
                    <Text variant="subheader-2">Рабочие часы</Text>
                    {totalHours > 0 && !open && (
                        <Text variant="body-1" color="secondary" className="repeto-availability-hours-inline">
                            {totalHours} ч / неделю
                        </Text>
                    )}
                </div>
                <Icon
                    data={ArrowChevronDown as IconData}
                    size={20}
                    style={{
                        color: "var(--g-color-text-secondary)",
                        transform: open ? "rotate(180deg)" : "rotate(0deg)",
                        transition: "transform 0.2s",
                    }}
                />
            </div>

            {open && (
                <>
                    {/* ── Availability grid ── */}
                    <div
                        className="repeto-scroll-x repeto-availability-card__body"
                        style={{
                            overflowX: "auto",
                        }}
                        onDragStart={(e) => e.preventDefault()}
                    >
                        <div
                            style={{ minWidth: 700 }}
                            onMouseLeave={() => { dragRef.current = false; }}
                        >
                            {/* Hour header row */}
                            <div style={{ display: "flex" }}>
                                <div style={{ width: 40, flexShrink: 0 }} />
                                {HOURS.map((h) => (
                                    <div
                                        key={h}
                                        onClick={() => toggleHour(h)}
                                        title={`${h}:00 — все дни`}
                                        style={{
                                            flex: 1,
                                            padding: "6px 0",
                                            fontSize: 11,
                                            fontWeight: 600,
                                            color: "var(--g-color-text-hint)",
                                            cursor: "pointer",
                                            textAlign: "center",
                                            userSelect: "none",
                                        }}
                                    >
                                        {h}
                                    </div>
                                ))}
                            </div>

                            {/* Day rows */}
                            {DAY_NAMES.map((dayName, di) => {
                                const dayIsActive = HOURS.every((hour) =>
                                    cells.has(`${di}-${hour}` as CellKey)
                                );
                                return (
                                <div key={di} style={{ display: "flex" }}>
                                    <div
                                        onClick={() => toggleDay(di)}
                                        title={`Весь ${dayName}`}
                                        style={{
                                            width: 40,
                                            flexShrink: 0,
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "center",
                                            fontSize: 11,
                                            fontWeight: 700,
                                            color: dayIsActive ? workHoursDayActiveText : "var(--g-color-text-hint)",
                                            background: dayIsActive ? workHoursDayActiveBg : "transparent",
                                            cursor: "pointer",
                                            borderTop: "1px solid var(--g-color-line-generic)",
                                            userSelect: "none",
                                        }}
                                    >
                                        {dayName}
                                    </div>
                                    {HOURS.map((h) => {
                                        const key: CellKey = `${di}-${h}`;
                                        const active = cells.has(key);
                                        return (
                                            <div
                                                key={key}
                                                onMouseDown={() => handleMouseDown(di, h)}
                                                onMouseEnter={() => handleMouseEnter(di, h)}
                                                style={{
                                                    flex: 1,
                                                    height: 28,
                                                    borderTop: "1px solid var(--g-color-line-generic)",
                                                    borderLeft: "1px solid var(--g-color-line-generic)",
                                                    cursor: "pointer",
                                                    background: active
                                                        ? workHoursActiveBg
                                                        : workHoursIdleBg,
                                                    transition: "background 0.1s",
                                                }}
                                            />
                                        );
                                    })}
                                </div>
                            )})}
                        </div>
                    </div>

                    {/* ── Footer ── */}
                    <div
                        style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            padding: "10px 16px",
                            borderTop: "1px solid var(--g-color-line-generic)",
                        }}
                    >
                        <Text variant="body-1" color="secondary">
                            {totalHours > 0
                                ? `${totalHours} ч / неделю`
                                : "Выделите ячейки мышью"}
                        </Text>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            {saveMsg && (
                                <Text
                                    variant="body-2"
                                    color={saveMsg === "Сохранено" ? "positive" : "danger"}
                                >
                                    {saveMsg}
                                </Text>
                            )}
                            {dirty && (
                                <Button view="outlined" size="s" onClick={handleReset}>
                                    Сбросить
                                </Button>
                            )}
                            <Button
                                view="action"
                                size="s"
                                onClick={handleSave}
                                disabled={saving || !dirty}
                            >
                                {saving ? "…" : "Сохранить"}
                            </Button>
                        </div>
                    </div>

                    {/* ── Exceptions ── */}
                    <div
                        style={{
                            borderTop: "1px solid var(--g-color-line-generic)",
                            padding: "12px 16px",
                        }}
                    >
                        <div
                            style={{
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "space-between",
                                marginBottom: 12,
                            }}
                        >
                            <Text variant="subheader-1">Исключения</Text>
                            {!addingException && (
                                <Button
                                    view="flat"
                                    size="s"
                                    onClick={() => setAddingException(true)}
                                >
                                    <Icon data={CirclePlus as IconData} size={14} />
                                    Добавить
                                </Button>
                            )}
                        </div>

                        {/* Add/edit exception form */}
                        {addingException && (
                            <div
                                style={{
                                    display: "flex",
                                    flexWrap: "wrap",
                                    alignItems: "flex-end",
                                    gap: 12,
                                    marginBottom: 12,
                                    padding: 12,
                                    borderRadius: 8,
                                    border: "1px dashed var(--g-color-line-generic)",
                                }}
                            >
                                <div>
                                    <Text
                                        variant="caption-1"
                                        color="secondary"
                                        style={{ display: "block", marginBottom: 4 }}
                                    >
                                        Дата
                                    </Text>
                                    <StyledDateInput
                                        value={exDate}
                                        onUpdate={setExDate}
                                        width={150}
                                    />
                                </div>
                                <div>
                                    <Text
                                        variant="caption-1"
                                        color="secondary"
                                        style={{ display: "block", marginBottom: 4 }}
                                    >
                                        Тип
                                    </Text>
                                    <SegmentedRadioGroup
                                        value={exType}
                                        onUpdate={(v) =>
                                            setExType(v as "blocked" | "custom")
                                        }
                                        options={[
                                            { value: "blocked", content: "Выходной" },
                                            { value: "custom", content: "Свои часы" },
                                        ]}
                                        size="m"
                                    />
                                </div>
                                {exType === "custom" && (
                                    <div
                                        style={{
                                            display: "flex",
                                            alignItems: "center",
                                            gap: 6,
                                        }}
                                    >
                                        <div>
                                            <Text
                                                variant="caption-1"
                                                color="secondary"
                                                style={{ display: "block", marginBottom: 4 }}
                                            >
                                                С
                                            </Text>
                                            <StyledTimeInput
                                                value={exFrom}
                                                onUpdate={setExFrom}
                                                stepMinutes={30}
                                                min="00:00"
                                                max="23:30"
                                                showClockIcon={false}
                                                style={{
                                                    height: 28,
                                                    padding: "0 8px",
                                                    width: 92,
                                                }}
                                            />
                                        </div>
                                        <Text
                                            variant="body-1"
                                            color="secondary"
                                            style={{ marginTop: 18 }}
                                        >
                                            —
                                        </Text>
                                        <div>
                                            <Text
                                                variant="caption-1"
                                                color="secondary"
                                                style={{ display: "block", marginBottom: 4 }}
                                            >
                                                До
                                            </Text>
                                            <StyledTimeInput
                                                value={exTo}
                                                onUpdate={setExTo}
                                                stepMinutes={30}
                                                min="00:00"
                                                max="23:30"
                                                showClockIcon={false}
                                                style={{
                                                    height: 28,
                                                    padding: "0 8px",
                                                    width: 92,
                                                }}
                                            />
                                        </div>
                                    </div>
                                )}
                                <div style={{ display: "flex", gap: 6 }}>
                                    <Button
                                        view="action"
                                        size="m"
                                        onClick={handleAddException}
                                        disabled={!exDate || exSaving}
                                    >
                                        {exSaving ? "…" : "OK"}
                                    </Button>
                                    <Button
                                        view="outlined"
                                        size="m"
                                        onClick={() => {
                                            setAddingException(false);
                                            setExDate("");
                                        }}
                                    >
                                        Закрыть
                                    </Button>
                                </div>
                            </div>
                        )}

                        {/* Exception list */}
                        {overrides.length > 0 ? (
                            <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                                {overrides.map((ov) => (
                                    <div
                                        key={ov.date}
                                        style={{
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "space-between",
                                            padding: "6px 0",
                                        }}
                                    >
                                        <div
                                            style={{
                                                display: "flex",
                                                alignItems: "center",
                                                gap: 8,
                                            }}
                                        >
                                            <Text variant="body-2">
                                                {formatDate(ov.date)}
                                            </Text>
                                            {ov.isBlocked ? (
                                                <Text
                                                    variant="body-2"
                                                    style={{ color: "var(--g-color-text-danger)" }}
                                                >
                                                    Выходной
                                                </Text>
                                            ) : (
                                                <Text variant="body-2" color="secondary">
                                                    {ov.slots[0]?.startTime}–
                                                    {ov.slots[ov.slots.length - 1]?.endTime}
                                                </Text>
                                            )}
                                        </div>
                                        <div style={{ display: "flex", gap: 2 }}>
                                            <Button
                                                view="flat"
                                                size="s"
                                                onClick={() => handleEditException(ov)}
                                                title="Редактировать"
                                            >
                                                <Icon data={Pencil as IconData} size={14} />
                                            </Button>
                                            <Button
                                                view="flat"
                                                size="s"
                                                className="repeto-icon-action-btn"
                                                onClick={() =>
                                                    handleDeleteException(ov.date)
                                                }
                                                title="Удалить"
                                                aria-label="Удалить"
                                            >
                                                <Icon data={TrashBin as IconData} size={14} />
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : !addingException ? (
                            <Text variant="body-2" color="secondary">
                                Нет исключений. Действует обычное расписание.
                            </Text>
                        ) : null}
                    </div>
                </>
            )}
        </Card>
    );
};

export default AvailabilityEditor;
