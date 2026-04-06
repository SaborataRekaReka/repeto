import { useState } from "react";
import Modal from "@/components/Modal";
import Field from "@/components/Field";
import Select, { type SelectOption } from "@/components/Select";
import { students } from "@/mocks/students";

const subjectOptions: SelectOption[] = [
    { id: "math", title: "Математика" },
    { id: "eng", title: "Английский" },
    { id: "phys", title: "Физика" },
    { id: "rus", title: "Русский язык" },
    { id: "chem", title: "Химия" },
    { id: "other", title: "Другой" },
];

const durationOptions: SelectOption[] = [
    { id: "30", title: "30 минут" },
    { id: "45", title: "45 минут" },
    { id: "60", title: "60 минут" },
    { id: "90", title: "90 минут" },
    { id: "120", title: "120 минут" },
];

const formatOptions: SelectOption[] = [
    { id: "online", title: "Онлайн" },
    { id: "offline", title: "Очно" },
];

type CreateLessonModalProps = {
    visible: boolean;
    onClose: () => void;
};

const CreateLessonModal = ({ visible, onClose }: CreateLessonModalProps) => {
    const studentOptions: SelectOption[] = students.map((s) => ({
        id: s.id,
        title: s.name,
    }));

    const [student, setStudent] = useState<SelectOption | null>(null);
    const [subject, setSubject] = useState<SelectOption | null>(null);
    const [date, setDate] = useState("");
    const [time, setTime] = useState("");
    const [duration, setDuration] = useState<SelectOption>(durationOptions[2]);
    const [format, setFormat] = useState<SelectOption>(formatOptions[0]);
    const [location, setLocation] = useState("");
    const [cost, setCost] = useState("");
    const [repeat, setRepeat] = useState(false);
    const [note, setNote] = useState("");
    const [errors, setErrors] = useState<Record<string, string>>({});

    const validate = (): boolean => {
        const newErrors: Record<string, string> = {};
        if (!student) newErrors.student = "Выберите ученика";
        if (!subject) newErrors.subject = "Выберите предмет";
        if (!date) newErrors.date = "Выберите дату";
        if (!time) newErrors.time = "Укажите время начала";
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = () => {
        if (!validate()) return;
        onClose();
    };

    return (
        <Modal
            classWrap="max-w-[36rem]"
            title="Новое занятие"
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
                {errors.student && (
                    <p className="text-xs text-pink-1 -mt-2">{errors.student}</p>
                )}
                <Select
                    label="Предмет *"
                    placeholder="Выберите предмет"
                    items={subjectOptions}
                    value={subject}
                    onChange={setSubject}
                />
                {errors.subject && (
                    <p className="text-xs text-pink-1 -mt-2">{errors.subject}</p>
                )}
                <div className="flex gap-4 md:flex-col">
                    <div className="flex-1">
                        <Field
                            label="Дата *"
                            type="date"
                            value={date}
                            onChange={(e) => setDate(e.target.value)}
                            required
                        />
                        {errors.date && (
                            <p className="text-xs text-pink-1 mt-1">{errors.date}</p>
                        )}
                    </div>
                    <div className="flex-1">
                        <Field
                            label="Время начала *"
                            type="time"
                            value={time}
                            onChange={(e) => setTime(e.target.value)}
                            required
                        />
                        {errors.time && (
                            <p className="text-xs text-pink-1 mt-1">{errors.time}</p>
                        )}
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
                    onChange={(e) => setLocation(e.target.value)}
                />
                <Field
                    label="Стоимость (₽)"
                    type="number"
                    placeholder="2100"
                    value={cost}
                    onChange={(e) => setCost(e.target.value)}
                />
                <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                        type="checkbox"
                        className="w-5 h-5 rounded border-2 border-n-1 dark:border-white"
                        checked={repeat}
                        onChange={(e) => setRepeat(e.target.checked)}
                    />
                    <span className="text-sm font-bold">
                        Повторять еженедельно
                    </span>
                </label>
                <Field
                    label="Заметка"
                    type="text"
                    placeholder="Заметка к занятию…"
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
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
