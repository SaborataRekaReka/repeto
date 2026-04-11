import { useState, useEffect } from "react";
import {
    Dialog,
    TextInput,
    TextArea,
    Select,
    Text,
    Button,
} from "@gravity-ui/uikit";
import { createStudent } from "@/hooks/useStudents";

const GDialog = Dialog as any;

const subjectOptions = [
    { value: "Математика", content: "Математика" },
    { value: "Английский", content: "Английский" },
    { value: "Физика", content: "Физика" },
    { value: "Русский язык", content: "Русский язык" },
    { value: "Химия", content: "Химия" },
    { value: "Биология", content: "Биология" },
    { value: "История", content: "История" },
    { value: "Другой", content: "Другой" },
];

type CreateStudentModalProps = {
    visible: boolean;
    onClose: () => void;
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

const CreateStudentModal = ({ visible, onClose }: CreateStudentModalProps) => {
    const [name, setName] = useState("");
    const [grade, setGrade] = useState("");
    const [subject, setSubject] = useState<string[]>([]);
    const [phone, setPhone] = useState("");
    const [whatsapp, setWhatsapp] = useState("");
    const [parentName, setParentName] = useState("");
    const [parentPhone, setParentPhone] = useState("");
    const [parentWhatsapp, setParentWhatsapp] = useState("");
    const [parentEmail, setParentEmail] = useState("");
    const [rate, setRate] = useState("");
    const [notes, setNotes] = useState("");
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (visible) {
            setName(""); setGrade(""); setSubject([]); setPhone(""); setWhatsapp("");
            setParentName(""); setParentPhone(""); setParentWhatsapp(""); setParentEmail("");
            setRate(""); setNotes("");
        }
    }, [visible]);

    const handleSubmit = async () => {
        if (!name.trim() || !subject.length || !rate) return;
        setSaving(true);
        try {
            await createStudent({
                name: name.trim(),
                subject: subject[0],
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
        <GDialog open={visible} onClose={onClose} size="s" hasCloseButton>
            <GDialog.Header caption="Новый ученик" />
            <GDialog.Body>
                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                    <FieldRow label="ФИО *">
                        <TextInput
                            value={name}
                            onUpdate={setName}
                            placeholder="Иванов Пётр Сергеевич"
                            size="m"
                        />
                    </FieldRow>

                    <div style={{ display: "flex", gap: 16 }}>
                        <div style={{ flex: 1 }}>
                            <FieldRow label="Класс / возраст">
                                <TextInput
                                    value={grade}
                                    onUpdate={setGrade}
                                    placeholder="11 или Взрослый"
                                    size="m"
                                />
                            </FieldRow>
                        </div>
                        <div style={{ flex: 1 }}>
                            <FieldRow label="Предмет *">
                                <Select
                                    options={subjectOptions}
                                    value={subject}
                                    onUpdate={setSubject}
                                    placeholder="Выберите предмет"
                                    size="m"
                                    width="max"
                                />
                            </FieldRow>
                        </div>
                    </div>

                    <div style={{ display: "flex", gap: 16 }}>
                        <div style={{ flex: 1 }}>
                            <FieldRow label="Телефон ученика">
                                <TextInput
                                    value={phone}
                                    onUpdate={setPhone}
                                    placeholder="+7 900 123-45-67"
                                    size="m"
                                />
                            </FieldRow>
                        </div>
                        <div style={{ flex: 1 }}>
                            <FieldRow label="WhatsApp ученика">
                                <TextInput
                                    value={whatsapp}
                                    onUpdate={setWhatsapp}
                                    placeholder="+79001234567"
                                    size="m"
                                />
                            </FieldRow>
                        </div>
                    </div>

                    <div
                        style={{
                            borderTop: "1px dashed var(--g-color-line-generic)",
                            paddingTop: 16,
                        }}
                    >
                        <Text
                            as="div"
                            variant="caption-2"
                            color="secondary"
                            style={{
                                marginBottom: 12,
                                textTransform: "uppercase",
                                letterSpacing: "0.06em",
                            }}
                        >
                            Родитель
                        </Text>
                        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                            <FieldRow label="ФИО родителя">
                                <TextInput
                                    value={parentName}
                                    onUpdate={setParentName}
                                    placeholder="Иванова Мария Петровна"
                                    size="m"
                                />
                            </FieldRow>
                            <div style={{ display: "flex", gap: 16 }}>
                                <div style={{ flex: 1 }}>
                                    <FieldRow label="Телефон родителя">
                                        <TextInput
                                            value={parentPhone}
                                            onUpdate={setParentPhone}
                                            placeholder="+7 900 765-43-21"
                                            size="m"
                                        />
                                    </FieldRow>
                                </div>
                                <div style={{ flex: 1 }}>
                                    <FieldRow label="WhatsApp родителя">
                                        <TextInput
                                            value={parentWhatsapp}
                                            onUpdate={setParentWhatsapp}
                                            placeholder="+79007654321"
                                            size="m"
                                        />
                                    </FieldRow>
                                </div>
                            </div>
                            <FieldRow label="Email родителя">
                                <TextInput
                                    value={parentEmail}
                                    onUpdate={setParentEmail}
                                    placeholder="parent@email.com"
                                    size="m"
                                />
                            </FieldRow>
                        </div>
                    </div>

                    <FieldRow label="Ставка за занятие (₽) *">
                        <TextInput
                            value={rate}
                            onUpdate={setRate}
                            placeholder="2100"
                            size="m"
                        />
                    </FieldRow>

                    <FieldRow label="Заметки">
                        <TextArea
                            value={notes}
                            onUpdate={setNotes}
                            placeholder="Любые заметки…"
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

export default CreateStudentModal;
