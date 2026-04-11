import { useState, useEffect, useMemo } from "react";
import {
    Dialog,
    TextInput,
    TextArea,
    Select,
    Checkbox,
    Text,
    Button,
    Popover,
} from "@gravity-ui/uikit";
import { useStudents } from "@/hooks/useStudents";
import { createLesson, updateLesson } from "@/hooks/useLessons";
import type { Lesson } from "@/types/schedule";

const MONTH_NAMES_GEN = [
    "январь", "февраль", "март", "апрель", "май", "июнь",
    "июль", "август", "сентябрь", "октябрь", "ноябрь", "декабрь",
];
const WEEK_DAY_SHORT = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];
const GDialog = Dialog as any;
const GPopover = Popover as any;

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
    const totalDays = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0).getDate();
    const startDow = start.getDay() === 0 ? 7 : start.getDay();
    const leading = startDow - 1;

    const cells: Array<Date | null> = [];
    for (let i = 0; i < leading; i++) cells.push(null);
    for (let d = 1; d <= totalDays; d++) cells.push(new Date(monthDate.getFullYear(), monthDate.getMonth(), d));
    while (cells.length % 7 !== 0) cells.push(null);
    return cells;
}

const subjectItems = [
    { value: "Математика", content: "Математика" },
    { value: "Английский", content: "Английский" },
    { value: "Физика", content: "Физика" },
    { value: "Русский язык", content: "Русский язык" },
    { value: "Химия", content: "Химия" },
    { value: "Другой", content: "Другой" },
];

const durationItems = [
    { value: "30", content: "30 минут" },
    { value: "45", content: "45 минут" },
    { value: "60", content: "60 минут" },
    { value: "90", content: "90 минут" },
    { value: "120", content: "120 минут" },
];

const formatItems = [
    { value: "online", content: "Онлайн" },
    { value: "offline", content: "Очно" },
];

type CreateLessonModalProps = {
    visible: boolean;
    onClose: () => void;
    lesson?: Lesson | null;
    defaultStudent?: { id: string; name: string } | null;
    defaultDate?: string;
    defaultTime?: string;
};

const FieldRow = ({ label, children }: { label: string; children: React.ReactNode }) => (
    <div>
        <Text
            as="div"
            variant="body-1"
            style={{ marginBottom: 4, color: "var(--g-color-text-secondary)" }}
        >
            {label}
        </Text>
        {children}
    </div>
);

const CreateLessonModal = ({
    visible,
    onClose,
    lesson,
    defaultStudent,
    defaultDate,
    defaultTime,
}: CreateLessonModalProps) => {
    const isEdit = !!lesson;
    const { data: studentsData } = useStudents({ limit: 200 });
    const students = studentsData?.data || [];

    const studentItems = students.map((s) => ({
        value: s.id,
        content: s.name,
    }));

    const [studentId, setStudentId] = useState<string[]>([]);
    const [subject, setSubject] = useState<string[]>([]);
    const [date, setDate] = useState("");
    const [time, setTime] = useState("");
    const [duration, setDuration] = useState<string[]>(["60"]);
    const [format, setFormat] = useState<string[]>(["online"]);
    const [location, setLocation] = useState("");
    const [cost, setCost] = useState("");
    const [repeat, setRepeat] = useState(false);
    const [note, setNote] = useState("");
    const [saving, setSaving] = useState(false);
    const [calendarOpen, setCalendarOpen] = useState(false);
    const [calendarMonth, setCalendarMonth] = useState<Date>(() => {
        const selected = parseIsoDate(defaultDate || "");
        const base = selected || new Date();
        return new Date(base.getFullYear(), base.getMonth(), 1);
    });

    const calendarCells = useMemo(() => getMonthGrid(calendarMonth), [calendarMonth]);
    const todayIso = toIsoDate(new Date());

    useEffect(() => {
        if (!visible) return;

        if (lesson) {
            const matched = students.find((s) => s.name === lesson.studentName);
            setStudentId(matched ? [matched.id] : []);
            const matchedSubject = subjectItems.find(
                (s) => s.value === lesson.subject
            );
            setSubject(matchedSubject ? [matchedSubject.value] : [lesson.subject]);
            setDate(lesson.date);
            setTime(lesson.startTime);
            const lessonDate = parseIsoDate(lesson.date);
            if (lessonDate) {
                setCalendarMonth(new Date(lessonDate.getFullYear(), lessonDate.getMonth(), 1));
            }
            const dur = durationItems.find(
                (d) => d.value === String(lesson.duration)
            );
            setDuration([dur?.value || "60"]);
            const fmt = formatItems.find(
                (f) => f.value === lesson.format?.toLowerCase()
            );
            setFormat([fmt?.value || "online"]);
            setCost(String(lesson.rate));
            setNote(lesson.notes || "");
        } else {
            setStudentId(defaultStudent ? [defaultStudent.id] : []);
            setSubject([]);
            setDate(defaultDate || "");
            setTime(defaultTime || "");
            const selectedDate = parseIsoDate(defaultDate || "");
            const base = selectedDate || new Date();
            setCalendarMonth(new Date(base.getFullYear(), base.getMonth(), 1));
            setDuration(["60"]);
            setFormat(["online"]);
            setLocation("");
            setCost("");
            setRepeat(false);
            setNote("");
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [visible, defaultDate, defaultTime]);

    // Auto-fill subject & cost from student
    useEffect(() => {
        if (!isEdit && studentId.length > 0) {
            const s = students.find((st) => st.id === studentId[0]);
            if (s) {
                if (!subject.length) {
                    const matched = subjectItems.find(
                        (si) => si.value === s.subject
                    );
                    if (matched) setSubject([matched.value]);
                }
                if (!cost) setCost(String(s.rate || ""));
            }
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [studentId]);

    const handleSubmit = async () => {
        if (!studentId.length || !subject.length || !date || !time) return;
        setSaving(true);
        try {
            const scheduledAt = new Date(`${date}T${time}`).toISOString();
            if (isEdit && lesson) {
                await updateLesson(lesson.id, {
                    subject: subject[0],
                    scheduledAt,
                    duration: Number(duration[0]),
                    format: format[0].toUpperCase(),
                    location: location || undefined,
                    rate: Number(cost) || undefined,
                });
            } else {
                await createLesson({
                    studentId: studentId[0],
                    subject: subject[0],
                    scheduledAt,
                    duration: Number(duration[0]),
                    format: format[0].toUpperCase(),
                    rate: Number(cost) || undefined,
                });
            }
            onClose();
        } catch (err) {
            console.error("Failed to save lesson:", err);
        } finally {
            setSaving(false);
        }
    };

    return (
        <GDialog open={visible} onClose={onClose} size="s" hasCloseButton>
            <GDialog.Header
                caption={isEdit ? "Редактировать занятие" : "Новое занятие"}
            />
            <GDialog.Body>
                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                    {!isEdit && (
                        <FieldRow label="Ученик *">
                            <Select
                                options={studentItems}
                                value={studentId}
                                onUpdate={setStudentId}
                                placeholder="Выберите ученика"
                                size="m"
                                width="max"
                                filterable
                            />
                        </FieldRow>
                    )}

                    <FieldRow label="Предмет *">
                        <Select
                            options={subjectItems}
                            value={subject}
                            onUpdate={setSubject}
                            placeholder="Выберите предмет"
                            size="m"
                            width="max"
                            filterable
                        />
                    </FieldRow>

                    <div style={{ display: "flex", gap: 16 }}>
                        <div style={{ flex: 1 }}>
                            <FieldRow label="Дата *">
                                <GPopover
                                    open={calendarOpen}
                                    onOpenChange={setCalendarOpen}
                                    placement="bottom-start"
                                    content={
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
                                                            new Date(prev.getFullYear(), prev.getMonth() - 1, 1)
                                                        )
                                                    }
                                                >
                                                    &lt;
                                                </Button>
                                                <Text variant="body-2" style={{ textTransform: "capitalize", fontWeight: 600 }}>
                                                    {MONTH_NAMES_GEN[calendarMonth.getMonth()]} {calendarMonth.getFullYear()}
                                                </Text>
                                                <Button
                                                    view="flat"
                                                    size="s"
                                                    onClick={() =>
                                                        setCalendarMonth((prev) =>
                                                            new Date(prev.getFullYear(), prev.getMonth() + 1, 1)
                                                        )
                                                    }
                                                >
                                                    &gt;
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
                                                        return <div key={`empty-${idx}`} style={{ height: 28 }} />;
                                                    }

                                                    const iso = toIsoDate(cellDate);
                                                    const isSelected = iso === date;
                                                    const isToday = iso === todayIso;

                                                    return (
                                                        <button
                                                            key={iso}
                                                            type="button"
                                                            onClick={() => {
                                                                setDate(iso);
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
                                    }
                                >
                                    <button
                                        type="button"
                                        onClick={() => setCalendarOpen((prev) => !prev)}
                                        className="repeto-native-input"
                                        style={{
                                            height: 36,
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "space-between",
                                            width: "100%",
                                            cursor: "pointer",
                                            padding: "0 10px",
                                        }}
                                    >
                                        <span style={{ color: date ? "var(--g-color-text-primary)" : "var(--g-color-text-hint)" }}>
                                            {date ? formatRuDate(date) : "Выберите дату"}
                                        </span>
                                        v
                                    </button>
                                </GPopover>
                            </FieldRow>
                        </div>
                        <div style={{ flex: 1 }}>
                            <FieldRow label="Время начала *">
                                <input
                                    type="time"
                                    value={time}
                                    onChange={(e) => setTime(e.target.value)}
                                    className="repeto-native-input"
                                />
                            </FieldRow>
                        </div>
                    </div>

                    <div style={{ display: "flex", gap: 16 }}>
                        <div style={{ flex: 1 }}>
                            <FieldRow label="Длительность">
                                <Select
                                    options={durationItems}
                                    value={duration}
                                    onUpdate={setDuration}
                                    size="m"
                                    width="max"
                                />
                            </FieldRow>
                        </div>
                        <div style={{ flex: 1 }}>
                            <FieldRow label="Формат">
                                <Select
                                    options={formatItems}
                                    value={format}
                                    onUpdate={setFormat}
                                    size="m"
                                    width="max"
                                />
                            </FieldRow>
                        </div>
                    </div>

                    <FieldRow label="Место / ссылка">
                        <TextInput
                            value={location}
                            onUpdate={setLocation}
                            placeholder="Zoom / адрес"
                            size="m"
                        />
                    </FieldRow>

                    <FieldRow label="Стоимость (₽)">
                        <TextInput
                            value={cost}
                            onUpdate={setCost}
                            placeholder="2100"
                            size="m"
                        />
                    </FieldRow>

                    <Checkbox
                        checked={repeat}
                        onUpdate={setRepeat}
                        size="m"
                    >
                        Повторять еженедельно
                    </Checkbox>

                    <FieldRow label="Заметка">
                        <TextArea
                            value={note}
                            onUpdate={setNote}
                            placeholder="Заметка к занятию…"
                            rows={3}
                            size="m"
                        />
                    </FieldRow>

                    <div style={{ display: "flex", gap: 12, paddingTop: 4 }}>
                        <Button
                            view="action"
                            size="l"
                            onClick={handleSubmit}
                            loading={saving}
                            style={{ flex: 1 }}
                        >
                            Сохранить
                        </Button>
                        <Button
                            view="outlined"
                            size="l"
                            onClick={onClose}
                            style={{ flex: 1 }}
                        >
                            Отмена
                        </Button>
                    </div>
                </div>
            </GDialog.Body>
        </GDialog>
    );
};

export default CreateLessonModal;