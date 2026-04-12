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
import { codedErrorMessage } from "@/lib/errorCodes";

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
    onCreated?: () => void;
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

function normalizeRate(value: string): number {
    const normalized = String(value || "").replace(",", ".").trim();
    if (!normalized) return NaN;
    return Number(normalized);
}

const CreateStudentModal = ({ visible, onClose, onCreated }: CreateStudentModalProps) => {
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
    const [formError, setFormError] = useState<string | null>(null);
    const [touched, setTouched] = useState({
        name: false,
        subject: false,
        rate: false,
    });

    const markTouched = (field: "name" | "subject" | "rate") => {
        setTouched((prev) => (prev[field] ? prev : { ...prev, [field]: true }));
    };

    useEffect(() => {
        if (visible) {
            setName(""); setGrade(""); setSubject([]); setPhone(""); setWhatsapp("");
            setParentName(""); setParentPhone(""); setParentWhatsapp(""); setParentEmail("");
            setRate(""); setNotes("");
            setTouched({ name: false, subject: false, rate: false });
            setFormError(null);
        }
    }, [visible]);

    const handleSubmit = async () => {
        const normalizedRate = normalizeRate(rate);
        setTouched({ name: true, subject: true, rate: true });

        if (!name.trim() || !subject.length || !Number.isFinite(normalizedRate) || normalizedRate <= 0) {
            setFormError("Заполните обязательные поля.");
            return;
        }

        setSaving(true);
        setFormError(null);
        try {
            await createStudent({
                name: name.trim(),
                subject: subject[0],
                rate: normalizedRate,
                grade: grade || undefined,
                phone: phone || undefined,
                whatsapp: whatsapp || undefined,
                parentName: parentName || undefined,
                parentPhone: parentPhone || undefined,
                parentWhatsapp: parentWhatsapp || undefined,
                parentEmail: parentEmail || undefined,
                notes: notes || undefined,
            } as any);
            onCreated?.();
            onClose();
        } catch (err) {
            setFormError(codedErrorMessage("STUDENT-CREATE", err));
        } finally {
            setSaving(false);
        }
    };

    const nameError = touched.name && !name.trim();
    const subjectError = touched.subject && !subject.length;
    const rateError = touched.rate && (!Number.isFinite(normalizeRate(rate)) || normalizeRate(rate) <= 0);

    return (
        <GDialog open={visible} onClose={onClose} size="s" hasCloseButton>
            <GDialog.Header caption="Новый ученик" />
            <GDialog.Body>
                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                    <FieldRow label="ФИО *">
                        <div style={errorWrapStyle(nameError)}>
                            <TextInput
                                value={name}
                                onUpdate={setName}
                                onBlur={() => markTouched("name")}
                                placeholder="Иванов Пётр Сергеевич"
                                size="l"
                            />
                        </div>
                        {nameError && (
                            <Text as="div" variant="caption-2" style={{ marginTop: 4, color: "var(--g-color-text-danger)" }}>
                                Обязательное поле
                            </Text>
                        )}
                    </FieldRow>

                    <div style={{ display: "flex", gap: 16 }}>
                        <div style={{ flex: 1 }}>
                            <FieldRow label="Класс / возраст">
                                <TextInput
                                    value={grade}
                                    onUpdate={setGrade}
                                    placeholder="11 или Взрослый"
                                    size="l"
                                />
                            </FieldRow>
                        </div>
                        <div style={{ flex: 1 }}>
                            <FieldRow label="Предмет *">
                                <div style={errorWrapStyle(subjectError)} onClick={() => markTouched("subject")}> 
                                    <Select
                                        options={subjectOptions}
                                        value={subject}
                                        onUpdate={(value) => {
                                            setSubject(value);
                                            markTouched("subject");
                                        }}
                                        placeholder="Выберите предмет"
                                        size="l"
                                        width="max"
                                    />
                                </div>
                                {subjectError && (
                                    <Text as="div" variant="caption-2" style={{ marginTop: 4, color: "var(--g-color-text-danger)" }}>
                                        Обязательное поле
                                    </Text>
                                )}
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
                                    size="l"
                                />
                            </FieldRow>
                        </div>
                        <div style={{ flex: 1 }}>
                            <FieldRow label="WhatsApp ученика">
                                <TextInput
                                    value={whatsapp}
                                    onUpdate={setWhatsapp}
                                    placeholder="+79001234567"
                                    size="l"
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
                                    size="l"
                                />
                            </FieldRow>
                            <div style={{ display: "flex", gap: 16 }}>
                                <div style={{ flex: 1 }}>
                                    <FieldRow label="Телефон родителя">
                                        <TextInput
                                            value={parentPhone}
                                            onUpdate={setParentPhone}
                                            placeholder="+7 900 765-43-21"
                                            size="l"
                                        />
                                    </FieldRow>
                                </div>
                                <div style={{ flex: 1 }}>
                                    <FieldRow label="WhatsApp родителя">
                                        <TextInput
                                            value={parentWhatsapp}
                                            onUpdate={setParentWhatsapp}
                                            placeholder="+79007654321"
                                            size="l"
                                        />
                                    </FieldRow>
                                </div>
                            </div>
                            <FieldRow label="Email родителя">
                                <TextInput
                                    value={parentEmail}
                                    onUpdate={setParentEmail}
                                    placeholder="parent@email.com"
                                    size="l"
                                />
                            </FieldRow>
                        </div>
                    </div>

                    <FieldRow label="Ставка за занятие (₽) *">
                        <div style={errorWrapStyle(rateError)}>
                            <TextInput
                                value={rate}
                                onUpdate={setRate}
                                onBlur={() => markTouched("rate")}
                                placeholder="2100"
                                size="l"
                            />
                        </div>
                        {rateError && (
                            <Text as="div" variant="caption-2" style={{ marginTop: 4, color: "var(--g-color-text-danger)" }}>
                                Введите сумму больше 0
                            </Text>
                        )}
                    </FieldRow>

                    <FieldRow label="Заметки">
                        <TextArea
                            value={notes}
                            onUpdate={setNotes}
                            placeholder="Любые заметки…"
                            rows={3}
                            size="l"
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

export default CreateStudentModal;
