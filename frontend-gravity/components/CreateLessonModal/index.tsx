import { useState, useEffect } from "react";
import {
    Dialog,
    TextInput,
    TextArea,
    Select,
    Checkbox,
    Text,
    Button,
} from "@gravity-ui/uikit";
import { useStudents } from "@/hooks/useStudents";
import { createLesson, updateLesson } from "@/hooks/useLessons";
import type { Lesson } from "@/types/schedule";
import StyledDateInput from "@/components/StyledDateInput";
import StyledTimeInput from "@/components/StyledTimeInput";
import { codedErrorMessage } from "@/lib/errorCodes";

const GDialog = Dialog as any;

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
    onCreated?: (savedLesson?: Lesson | Lesson[]) => void | Promise<void>;
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

const errorWrapStyle = (invalid: boolean) =>
    invalid
        ? {
              border: "1px solid var(--g-color-line-danger)",
              borderRadius: 8,
              padding: 2,
          }
        : undefined;

type RequiredField = "student" | "subject" | "date" | "time";

const CreateLessonModal = ({
    visible,
    onClose,
    onCreated,
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
    const [formError, setFormError] = useState<string | null>(null);
    const [touched, setTouched] = useState<Record<RequiredField, boolean>>({
        student: false,
        subject: false,
        date: false,
        time: false,
    });

    const markTouched = (field: RequiredField) => {
        setTouched((prev) => (prev[field] ? prev : { ...prev, [field]: true }));
    };

    useEffect(() => {
        if (!visible) return;
        setFormError(null);
        setTouched({ student: false, subject: false, date: false, time: false });

        if (lesson) {
            const matched = students.find((s) => s.name === lesson.studentName);
            setStudentId(matched ? [matched.id] : []);
            const matchedSubject = subjectItems.find(
                (s) => s.value === lesson.subject
            );
            setSubject(matchedSubject ? [matchedSubject.value] : [lesson.subject]);
            setDate(lesson.date);
            setTime(lesson.startTime);
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
        const requiresStudent = !isEdit;
        const hasStudent = studentId.length > 0;
        const hasSubject = subject.length > 0;
        const hasDate = !!date;
        const hasTime = !!time;

        setTouched({
            student: requiresStudent,
            subject: true,
            date: true,
            time: true,
        });

        if ((requiresStudent && !hasStudent) || !hasSubject || !hasDate || !hasTime) {
            setFormError("Заполните обязательные поля.");
            return;
        }

        setSaving(true);
        setFormError(null);
        try {
            const scheduledAt = new Date(`${date}T${time}`).toISOString();
            let savedLesson: Lesson | Lesson[] | undefined;

            if (isEdit && lesson) {
                savedLesson = await updateLesson(lesson.id, {
                    subject: subject[0],
                    scheduledAt,
                    duration: Number(duration[0]),
                    format: format[0].toUpperCase(),
                    location: location || undefined,
                    rate: Number(cost) || undefined,
                    notes: note,
                });
            } else {
                savedLesson = await createLesson({
                    studentId: studentId[0],
                    subject: subject[0],
                    scheduledAt,
                    duration: Number(duration[0]),
                    format: format[0].toUpperCase(),
                    location: location || undefined,
                    rate: Number(cost) || undefined,
                    notes: note,
                });
            }

            await onCreated?.(savedLesson);
            onClose();
        } catch (err) {
            setFormError(codedErrorMessage("LESSON-SAVE", err));
        } finally {
            setSaving(false);
        }
    };

    const studentError = !isEdit && touched.student && !studentId.length;
    const subjectError = touched.subject && !subject.length;
    const dateError = touched.date && !date;
    const timeError = touched.time && !time;

    return (
        <GDialog open={visible} onClose={onClose} size="s" hasCloseButton>
            <GDialog.Header
                caption={isEdit ? "Редактировать занятие" : "Новое занятие"}
            />
            <GDialog.Body>
                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                    {!isEdit && (
                        <FieldRow label="Ученик *">
                            <div style={errorWrapStyle(studentError)} onClick={() => markTouched("student")}> 
                                <Select
                                    options={studentItems}
                                    value={studentId}
                                    onUpdate={(value) => {
                                        setStudentId(value);
                                        markTouched("student");
                                    }}
                                    placeholder="Выберите ученика"
                                    size="m"
                                    width="max"
                                    filterable
                                />
                            </div>
                            {studentError && (
                                <Text as="div" variant="caption-2" style={{ marginTop: 4, color: "var(--g-color-text-danger)" }}>
                                    Обязательное поле
                                </Text>
                            )}
                        </FieldRow>
                    )}

                    <FieldRow label="Предмет *">
                        <div style={errorWrapStyle(subjectError)} onClick={() => markTouched("subject")}> 
                            <Select
                                options={subjectItems}
                                value={subject}
                                onUpdate={(value) => {
                                    setSubject(value);
                                    markTouched("subject");
                                }}
                                placeholder="Выберите предмет"
                                size="m"
                                width="max"
                                filterable
                            />
                        </div>
                        {subjectError && (
                            <Text as="div" variant="caption-2" style={{ marginTop: 4, color: "var(--g-color-text-danger)" }}>
                                Обязательное поле
                            </Text>
                        )}
                    </FieldRow>

                    <div style={{ display: "flex", gap: 16 }}>
                        <div style={{ flex: 1 }}>
                            <FieldRow label="Дата *">
                                <div style={errorWrapStyle(dateError)} onClick={() => markTouched("date")}> 
                                    <StyledDateInput
                                        value={date}
                                        onUpdate={(value) => {
                                            setDate(value);
                                            markTouched("date");
                                        }}
                                        style={{ height: 36, padding: "0 10px" }}
                                    />
                                </div>
                                {dateError && (
                                    <Text as="div" variant="caption-2" style={{ marginTop: 4, color: "var(--g-color-text-danger)" }}>
                                        Обязательное поле
                                    </Text>
                                )}
                            </FieldRow>
                        </div>
                        <div style={{ flex: 1 }}>
                            <FieldRow label="Время начала *">
                                <div style={errorWrapStyle(timeError)} onClick={() => markTouched("time")}> 
                                    <StyledTimeInput
                                        value={time}
                                        onUpdate={(value) => {
                                            setTime(value);
                                            markTouched("time");
                                        }}
                                        showClockIcon={false}
                                        style={{ height: 36, padding: "0 10px" }}
                                    />
                                </div>
                                {timeError && (
                                    <Text as="div" variant="caption-2" style={{ marginTop: 4, color: "var(--g-color-text-danger)" }}>
                                        Обязательное поле
                                    </Text>
                                )}
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

                    {formError && (
                        <Text as="div" variant="body-1" style={{ color: "var(--g-color-text-danger)" }}>
                            {formError}
                        </Text>
                    )}

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