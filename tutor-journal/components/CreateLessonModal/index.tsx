import { useState, useEffect } from "react";
import Modal from "@/components/Modal";
import Field from "@/components/Field";
import Select from "@/components/Select";
import SearchableSelect from "@/components/SearchableSelect";
import Checkbox from "@/components/Checkbox";
import { useStudents } from "@/hooks/useStudents";
import { createLesson, updateLesson } from "@/hooks/useLessons";
import type { Lesson } from "@/types/schedule";

const subjectOptions = [
    { id: "math", title: "Математика" },
    { id: "eng", title: "Английский" },
    { id: "phys", title: "Физика" },
    { id: "rus", title: "Русский язык" },
    { id: "chem", title: "Химия" },
    { id: "other", title: "Другой" },
];

const durationOptions = [
    { id: "30", title: "30 минут" },
    { id: "45", title: "45 минут" },
    { id: "60", title: "60 минут" },
    { id: "90", title: "90 минут" },
    { id: "120", title: "120 минут" },
];

const formatOptions = [
    { id: "online", title: "Онлайн" },
    { id: "offline", title: "Очно" },
];

type CreateLessonModalProps = {
    visible: boolean;
    onClose: () => void;
    lesson?: Lesson | null;
    defaultStudent?: { id: string; name: string } | null;
};

const CreateLessonModal = ({ visible, onClose, lesson, defaultStudent }: CreateLessonModalProps) => {
    const isEdit = !!lesson;
    const { data: studentsData } = useStudents({ limit: 200 });
    const studentOptions = (studentsData?.data || []).map((s) => ({
        id: s.id,
        title: s.name,
        subject: s.subject,
        rate: s.rate,
    }));

    const [student, setStudent] = useState<any>(null);
    const [subject, setSubject] = useState<any>(null);
    const [date, setDate] = useState("");
    const [time, setTime] = useState("");
    const [duration, setDuration] = useState<any>(durationOptions[2]);
    const [format, setFormat] = useState<any>(formatOptions[0]);
    const [location, setLocation] = useState("");
    const [cost, setCost] = useState("");
    const [repeat, setRepeat] = useState(false);
    const [note, setNote] = useState("");

    useEffect(() => {
        if (lesson) {
            const matchedStudent = studentOptions.find(
                (s) => s.title === lesson.studentName
            );
            setStudent(matchedStudent || null);
            const matchedSubject = subjectOptions.find(
                (s) => s.title === lesson.subject
            );
            setSubject(
                matchedSubject || { id: lesson.subject, title: lesson.subject }
            );
            setDate(lesson.date);
            setTime(lesson.startTime);
            const dur = durationOptions.find(
                (d) => d.id === String(lesson.duration)
            );
            setDuration(dur || durationOptions[2]);
            const fmt = formatOptions.find((f) => f.id === lesson.format);
            setFormat(fmt || formatOptions[0]);
            setCost(String(lesson.rate));
            setNote(lesson.notes || "");
        } else {
            if (defaultStudent) {
                const matched = studentOptions.find(
                    (s) => s.id === defaultStudent.id
                );
                setStudent(matched || { id: defaultStudent.id, title: defaultStudent.name });
            } else {
                setStudent(null);
            }
            setSubject(null);
            setDate("");
            setTime("");
            setDuration(durationOptions[2]);
            setFormat(formatOptions[0]);
            setLocation("");
            setCost("");
            setRepeat(false);
            setNote("");
        }
    }, [lesson, defaultStudent, visible]);

    useEffect(() => {
        if (student && !isEdit) {
            const matched = studentOptions.find((s: any) => s.id === student.id);
            if (matched) {
                if (!subject) {
                    const matchedSubject = subjectOptions.find((s) => s.title === (matched as any).subject);
                    setSubject(matchedSubject || { id: (matched as any).subject, title: (matched as any).subject });
                }
                if (!cost) setCost(String((matched as any).rate || ""));
            }
        }
    }, [student]);

    const handleSubmit = async () => {
        if (!student || !subject || !date || !time) return;
        try {
            const scheduledAt = new Date(`${date}T${time}`).toISOString();
            if (isEdit && lesson) {
                await updateLesson(lesson.id, {
                    subject: subject.title,
                    scheduledAt,
                    duration: Number(duration.id),
                    format: format.id.toUpperCase(),
                    location: location || undefined,
                    rate: Number(cost) || undefined,
                });
            } else {
                await createLesson({
                    studentId: student.id,
                    subject: subject.title,
                    scheduledAt,
                    duration: Number(duration.id),
                    format: format.id.toUpperCase(),
                    rate: Number(cost) || undefined,
                });
            }
            onClose();
        } catch (err) {
            console.error("Failed to save lesson:", err);
        }
    };

    return (
        <Modal
            classWrap="max-w-[36rem]"
            title={isEdit ? "Редактировать занятие" : "Новое занятие"}
            visible={visible}
            onClose={onClose}
        >
            <div className="p-6 space-y-4">
                <Select
                    label="Ученик *"
                    placeholder="Выберите ученика"
                    items={studentOptions}
                    value={student}
                    onChange={setStudent}
                />
                <SearchableSelect
                    label="Предмет *"
                    placeholder="Введите или выберите предмет"
                    items={subjectOptions}
                    value={subject}
                    onChange={setSubject}
                    allowCustom
                />
                <div className="flex gap-4 md:flex-col">
                    <div className="flex-1">
                        <Field
                            label="Дата *"
                            type="date"
                            value={date}
                            onChange={(e: any) => setDate(e.target.value)}
                            required
                        />
                    </div>
                    <div className="flex-1">
                        <Field
                            label="Время начала *"
                            type="time"
                            value={time}
                            onChange={(e: any) => setTime(e.target.value)}
                            required
                        />
                    </div>
                </div>
                <div className="flex gap-4 md:flex-col">
                    <div className="flex-1">
                        <Select
                            label="Длительность"
                            items={durationOptions}
                            value={duration}
                            onChange={setDuration}
                        />
                    </div>
                    <div className="flex-1">
                        <Select
                            label="Формат"
                            items={formatOptions}
                            value={format}
                            onChange={setFormat}
                        />
                    </div>
                </div>
                <Field
                    label="Место / ссылка"
                    type="text"
                    placeholder="Zoom / адрес"
                    value={location}
                    onChange={(e: any) => setLocation(e.target.value)}
                />
                <Field
                    label="Стоимость (₽)"
                    type="number"
                    placeholder="2100"
                    value={cost}
                    onChange={(e: any) => setCost(e.target.value)}
                />
                <Checkbox
                    label="Повторять еженедельно"
                    value={repeat}
                    onChange={() => setRepeat(!repeat)}
                />
                <Field
                    label="Заметка"
                    type="text"
                    placeholder="Заметка к занятию…"
                    value={note}
                    onChange={(e: any) => setNote(e.target.value)}
                    textarea
                />
                <div className="flex gap-3 pt-4">
                    <button
                        className="btn-purple btn-medium grow"
                        onClick={handleSubmit}
                    >
                        Сохранить
                    </button>
                    <button
                        className="btn-stroke btn-medium grow"
                        onClick={onClose}
                    >
                        Отмена
                    </button>
                </div>
            </div>
        </Modal>
    );
};

export default CreateLessonModal;
