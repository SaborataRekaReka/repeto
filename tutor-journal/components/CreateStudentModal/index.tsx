import { useState } from "react";
import Modal from "@/components/Modal";
import Field from "@/components/Field";
import Select, { type SelectOption } from "@/components/Select";
import Icon from "@/components/Icon";

const subjectOptions: SelectOption[] = [
    { id: "math", title: "Математика" },
    { id: "eng", title: "Английский" },
    { id: "phys", title: "Физика" },
    { id: "rus", title: "Русский язык" },
    { id: "chem", title: "Химия" },
    { id: "bio", title: "Биология" },
    { id: "hist", title: "История" },
    { id: "other", title: "Другой" },
];

type CreateStudentModalProps = {
    visible: boolean;
    onClose: () => void;
};

const CreateStudentModal = ({ visible, onClose }: CreateStudentModalProps) => {
    const [name, setName] = useState("");
    const [grade, setGrade] = useState("");
    const [subject, setSubject] = useState<SelectOption | null>(null);
    const [phone, setPhone] = useState("");
    const [telegram, setTelegram] = useState("");
    const [parentName, setParentName] = useState("");
    const [parentPhone, setParentPhone] = useState("");
    const [parentTelegram, setParentTelegram] = useState("");
    const [parentEmail, setParentEmail] = useState("");
    const [rate, setRate] = useState("");
    const [notes, setNotes] = useState("");
    const [errors, setErrors] = useState<Record<string, string>>({});

    const validate = (): boolean => {
        const newErrors: Record<string, string> = {};
        if (!name.trim()) newErrors.name = "Введите ФИО ученика";
        if (!subject) newErrors.subject = "Выберите предмет";
        if (!rate.trim() || Number(rate) <= 0)
            newErrors.rate = "Введите корректную ставку";
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
            title="Новый ученик"
            visible={visible}
            onClose={onClose}
        >
            <div className="p-6 space-y-4">
                <Field
                    label="ФИО *"
                    type="text"
                    placeholder="Иванов Пётр Сергеевич"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                />
                {errors.name && (
                    <p className="text-xs text-pink-1 -mt-2">{errors.name}</p>
                )}
                <div className="flex gap-4 md:flex-col">
                    <div className="flex-1">
                        <Field
                            label="Класс / возраст"
                            type="text"
                            placeholder="11 или Взрослый"
                            value={grade}
                            onChange={(e) => setGrade(e.target.value)}
                        />
                    </div>
                    <div className="flex-1">
                        <Select
                            label="Предмет *"
                            placeholder="Выберите предмет"
                            items={subjectOptions}
                            value={subject}
                            onChange={setSubject}
                        />
                        {errors.subject && (
                            <p className="text-xs text-pink-1 mt-1">{errors.subject}</p>
                        )}
                    </div>
                </div>
                <div className="flex gap-4 md:flex-col">
                    <div className="flex-1">
                        <Field
                            label="Телефон ученика"
                            type="tel"
                            placeholder="+7 900 123-45-67"
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                        />
                    </div>
                    <div className="flex-1">
                        <Field
                            label="Telegram ученика"
                            type="text"
                            placeholder="@username"
                            value={telegram}
                            onChange={(e) => setTelegram(e.target.value)}
                        />
                    </div>
                </div>
                <div className="pt-2 border-t border-dashed border-n-1 dark:border-white">
                    <div className="mb-3 text-xs font-bold text-n-3 dark:text-white/50">
                        Родитель
                    </div>
                    <Field
                        className="mb-4"
                        label="ФИО родителя"
                        type="text"
                        placeholder="Иванова Мария Петровна"
                        value={parentName}
                        onChange={(e) => setParentName(e.target.value)}
                    />
                    <div className="flex gap-4 mb-4 md:flex-col">
                        <div className="flex-1">
                            <Field
                                label="Телефон родителя"
                                type="tel"
                                placeholder="+7 900 765-43-21"
                                value={parentPhone}
                                onChange={(e) =>
                                    setParentPhone(e.target.value)
                                }
                            />
                        </div>
                        <div className="flex-1">
                            <Field
                                label="Telegram родителя"
                                type="text"
                                placeholder="@username"
                                value={parentTelegram}
                                onChange={(e) =>
                                    setParentTelegram(e.target.value)
                                }
                            />
                        </div>
                    </div>
                    <Field
                        label="Email родителя"
                        type="email"
                        placeholder="parent@email.com"
                        value={parentEmail}
                        onChange={(e) => setParentEmail(e.target.value)}
                    />
                </div>
                <Field
                    label="Ставка за занятие (₽) *"
                    type="number"
                    placeholder="2100"
                    value={rate}
                    onChange={(e) => setRate(e.target.value)}
                    required
                />
                {errors.rate && (
                    <p className="text-xs text-pink-1 -mt-2">{errors.rate}</p>
                )}
                <Field
                    label="Заметки"
                    type="text"
                    placeholder="Любые заметки…"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
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

export default CreateStudentModal;
