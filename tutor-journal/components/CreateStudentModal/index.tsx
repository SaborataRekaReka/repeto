import { useState } from "react";
import Modal from "@/components/Modal";
import Field from "@/components/Field";
import Select from "@/components/Select";
import Icon from "@/components/Icon";
import { createStudent } from "@/hooks/useStudents";

const subjectOptions = [
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
    const [subject, setSubject] = useState<any>(null);
    const [phone, setPhone] = useState("");
    const [whatsapp, setWhatsapp] = useState("");
    const [parentName, setParentName] = useState("");
    const [parentPhone, setParentPhone] = useState("");
    const [parentWhatsapp, setParentWhatsapp] = useState("");
    const [parentEmail, setParentEmail] = useState("");
    const [rate, setRate] = useState("");
    const [notes, setNotes] = useState("");
    const [saving, setSaving] = useState(false);

    const handleSubmit = async () => {
        if (!name.trim() || !subject || !rate) return;
        setSaving(true);
        try {
            await createStudent({
                name: name.trim(),
                subject: subject.title,
                rate: Number(rate),
                grade: grade || undefined,
                phone: phone || undefined,
                whatsapp: whatsapp || undefined,
                parentName: parentName || undefined,
                parentPhone: parentPhone || undefined,
                parentWhatsapp: parentWhatsapp || undefined,
                parentEmail: parentEmail || undefined,
                notes: notes || undefined,
            } as any);
            onClose();
        } catch (err) {
            console.error("Failed to create student:", err);
        } finally {
            setSaving(false);
        }
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
                    onChange={(e: any) => setName(e.target.value)}
                    required
                />
                <div className="flex gap-4 md:flex-col">
                    <div className="flex-1">
                        <Field
                            label="Класс / возраст"
                            type="text"
                            placeholder="11 или Взрослый"
                            value={grade}
                            onChange={(e: any) => setGrade(e.target.value)}
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
                    </div>
                </div>
                <div className="flex gap-4 md:flex-col">
                    <div className="flex-1">
                        <Field
                            label="Телефон ученика"
                            type="tel"
                            placeholder="+7 900 123-45-67"
                            value={phone}
                            onChange={(e: any) => setPhone(e.target.value)}
                        />
                    </div>
                    <div className="flex-1">
                        <Field
                            label="WhatsApp ученика"
                            type="tel"
                            placeholder="+79001234567"
                            value={whatsapp}
                            onChange={(e: any) => setWhatsapp(e.target.value)}
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
                        onChange={(e: any) => setParentName(e.target.value)}
                    />
                    <div className="flex gap-4 mb-4 md:flex-col">
                        <div className="flex-1">
                            <Field
                                label="Телефон родителя"
                                type="tel"
                                placeholder="+7 900 765-43-21"
                                value={parentPhone}
                                onChange={(e: any) =>
                                    setParentPhone(e.target.value)
                                }
                            />
                        </div>
                        <div className="flex-1">
                            <Field
                                label="WhatsApp родителя"
                                type="tel"
                                placeholder="+79007654321"
                                value={parentWhatsapp}
                                onChange={(e: any) =>
                                    setParentWhatsapp(e.target.value)
                                }
                            />
                        </div>
                    </div>
                    <Field
                        label="Email родителя"
                        type="email"
                        placeholder="parent@email.com"
                        value={parentEmail}
                        onChange={(e: any) => setParentEmail(e.target.value)}
                    />
                </div>
                <Field
                    label="Ставка за занятие (₽) *"
                    type="number"
                    placeholder="2100"
                    value={rate}
                    onChange={(e: any) => setRate(e.target.value)}
                    required
                />
                <Field
                    label="Заметки"
                    type="text"
                    placeholder="Любые заметки…"
                    value={notes}
                    onChange={(e: any) => setNotes(e.target.value)}
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
