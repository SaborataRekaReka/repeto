import { useState, useEffect, useCallback, useRef } from "react";
import { createPortal } from "react-dom";
import {
    TextInput,
    TextArea,
    Select,
    Text,
    Button,
    Icon,
} from "@gravity-ui/uikit";
import { ArrowLeft } from "@gravity-ui/icons";
import type { IconData } from "@gravity-ui/uikit";
import { createStudent } from "@/hooks/useStudents";
import { codedErrorMessage } from "@/lib/errorCodes";
import { Lp2Field, Lp2Row } from "@/components/Lp2Field";
import type { Student } from "@/types/student";

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
    onCreated?: (createdStudent?: Student) => void | Promise<void>;
};

const PANEL_Z = 960;

const NAME_MIN_LENGTH = 2;
const NAME_MAX_LENGTH = 100;
const GRADE_MAX_LENGTH = 50;
const PHONE_MAX_LENGTH = 30;
const PARENT_NAME_MAX_LENGTH = 100;
const NOTES_MAX_LENGTH = 2000;

function cleanOptionalString(value: string): string | undefined {
    const normalized = String(value || "").trim();
    return normalized.length > 0 ? normalized : undefined;
}

function isEmailLike(value: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function normalizeRate(value: string): number {
    const normalized = String(value || "").replace(",", ".").trim();
    if (!normalized) return NaN;
    return Number(normalized);
}

const CreateStudentModal = ({ visible, onClose, onCreated }: CreateStudentModalProps) => {
    const panelRef = useRef<HTMLDivElement>(null);
    const [mounted, setMounted] = useState(false);
    const [shouldRender, setShouldRender] = useState(false);
    const [isPanelVisible, setIsPanelVisible] = useState(false);

    useEffect(() => { setMounted(true); }, []);

    useEffect(() => {
        if (visible) {
            setShouldRender(true);
            const raf1 = requestAnimationFrame(() => {
                requestAnimationFrame(() => setIsPanelVisible(true));
            });
            return () => cancelAnimationFrame(raf1);
        }
        setIsPanelVisible(false);
        return undefined;
    }, [visible]);

    const handleTransitionEnd = useCallback(() => {
        if (!isPanelVisible) setShouldRender(false);
    }, [isPanelVisible]);

    const handleClose = useCallback(() => {
        setIsPanelVisible(false);
        setTimeout(() => onClose(), 350);
    }, [onClose]);

    useEffect(() => {
        if (!visible) return;
        const handler = (e: KeyboardEvent) => {
            if (e.key === "Escape") handleClose();
        };
        document.addEventListener("keydown", handler);
        return () => document.removeEventListener("keydown", handler);
    }, [visible, handleClose]);

    const [name, setName] = useState("");
    const [grade, setGrade] = useState("");
    const [age, setAge] = useState("");
    const [subject, setSubject] = useState<string[]>([]);
    const [phone, setPhone] = useState("");
    const [parentName, setParentName] = useState("");
    const [parentPhone, setParentPhone] = useState("");
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
            setName(""); setGrade(""); setAge(""); setSubject([]); setPhone("");
            setParentName(""); setParentPhone(""); setParentEmail("");
            setRate(""); setNotes("");
            setTouched({ name: false, subject: false, rate: false });
            setFormError(null);
        }
    }, [visible]);

    const handleSubmit = async () => {
        const normalizedName = name.trim();
        const normalizedRate = normalizeRate(rate);
        const normalizedAge = Number(String(age || "").trim());
        const safeAge = Number.isFinite(normalizedAge) && normalizedAge > 0
            ? Math.floor(normalizedAge)
            : undefined;
        const safeGrade = cleanOptionalString(grade);
        const safePhone = cleanOptionalString(phone);
        const safeParentName = cleanOptionalString(parentName);
        const safeParentPhone = cleanOptionalString(parentPhone);
        const safeParentEmail = cleanOptionalString(parentEmail);
        const safeNotes = cleanOptionalString(notes);
        setTouched({ name: true, subject: true, rate: true });

        if (
            !normalizedName ||
            normalizedName.length < NAME_MIN_LENGTH ||
            normalizedName.length > NAME_MAX_LENGTH
        ) {
            setFormError("ФИО должно содержать от 2 до 100 символов.");
            return;
        }

        if (!subject.length) {
            setFormError("Выберите предмет.");
            return;
        }

        if (!Number.isFinite(normalizedRate) || normalizedRate <= 0) {
            setFormError("Укажите ставку больше 0.");
            return;
        }

        if (safeGrade && safeGrade.length > GRADE_MAX_LENGTH) {
            setFormError("Поле «Класс» слишком длинное.");
            return;
        }

        if (safePhone && safePhone.length > PHONE_MAX_LENGTH) {
            setFormError("Телефон ученика слишком длинный.");
            return;
        }

        if (safeParentName && safeParentName.length > PARENT_NAME_MAX_LENGTH) {
            setFormError("ФИО родителя слишком длинное.");
            return;
        }

        if (safeParentPhone && safeParentPhone.length > PHONE_MAX_LENGTH) {
            setFormError("Телефон родителя слишком длинный.");
            return;
        }

        if (safeParentEmail && !isEmailLike(safeParentEmail)) {
            setFormError("Укажите корректный email родителя.");
            return;
        }

        if (safeNotes && safeNotes.length > NOTES_MAX_LENGTH) {
            setFormError("Заметка слишком длинная.");
            return;
        }

        setSaving(true);
        setFormError(null);
        try {
            const createdStudent = await createStudent({
                name: normalizedName,
                subject: subject[0],
                rate: normalizedRate,
                grade: safeGrade,
                age: safeAge,
                phone: safePhone,
                parentName: safeParentName,
                parentPhone: safeParentPhone,
                parentEmail: safeParentEmail,
                notes: safeNotes,
            } as any);
            await onCreated?.(createdStudent);
            handleClose();
        } catch (err) {
            setFormError(codedErrorMessage("STUDENT-CREATE", err));
        } finally {
            setSaving(false);
        }
    };

    const nameError = touched.name && !name.trim();
    const subjectError = touched.subject && !subject.length;
    const rateError = touched.rate && (!Number.isFinite(normalizeRate(rate)) || normalizeRate(rate) <= 0);

    if (!mounted || (!shouldRender && !visible)) return null;

    const panelContent = (
        <div
            ref={panelRef}
            className={`lp2 ${isPanelVisible ? "lp2--open" : ""}`}
            style={{ zIndex: PANEL_Z }}
            onTransitionEnd={handleTransitionEnd}
            role="dialog"
            aria-modal="false"
            aria-label="Новый ученик"
        >
            <div className="lp2__topbar">
                <button type="button" className="lp2__back" onClick={handleClose} aria-label="Назад">
                    <Icon data={ArrowLeft as IconData} size={18} />
                </button>
                <div className="lp2__topbar-actions" />
            </div>

            <div className="lp2__scroll">
                <div className="lp2__center">
                    <h1 className="lp2__page-title">Новый ученик</h1>

                    <Lp2Field label="ФИО *" error={nameError} errorText="Обязательное поле">
                        <TextInput
                            value={name}
                            onUpdate={setName}
                            onBlur={() => markTouched("name")}
                            placeholder="Иванов Пётр Сергеевич"
                            size="l"
                        />
                    </Lp2Field>

                    <Lp2Row>
                        <Lp2Field label="Класс" half>
                            <TextInput
                                value={grade}
                                onUpdate={setGrade}
                                placeholder="11"
                                size="l"
                            />
                        </Lp2Field>
                        <Lp2Field label="Возраст" half>
                            <TextInput
                                value={age}
                                onUpdate={setAge}
                                placeholder="15"
                                size="l"
                                type="number"
                            />
                        </Lp2Field>
                    </Lp2Row>

                    <Lp2Field label="Предмет *" error={subjectError} errorText="Обязательное поле">
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
                            popupClassName="lp2-popup"
                            popupWidth="fit"
                            popupPlacement={["bottom-start", "top-start"]}
                        />
                    </Lp2Field>

                    <Lp2Field label="Телефон ученика">
                        <TextInput
                            value={phone}
                            onUpdate={setPhone}
                            placeholder="+7 900 123-45-67"
                            size="l"
                        />
                    </Lp2Field>

                    <div
                        style={{
                            borderTop: "1px dashed var(--g-color-line-generic)",
                            paddingTop: 16,
                            marginTop: 6,
                            marginBottom: 6,
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

                        <Lp2Field label="ФИО родителя">
                            <TextInput
                                value={parentName}
                                onUpdate={setParentName}
                                placeholder="Иванова Мария Петровна"
                                size="l"
                            />
                        </Lp2Field>

                        <Lp2Field label="Телефон родителя">
                            <TextInput
                                value={parentPhone}
                                onUpdate={setParentPhone}
                                placeholder="+7 900 765-43-21"
                                size="l"
                            />
                        </Lp2Field>

                        <Lp2Field label="Email родителя">
                            <TextInput
                                value={parentEmail}
                                onUpdate={setParentEmail}
                                placeholder="parent@email.com"
                                size="l"
                            />
                        </Lp2Field>
                    </div>

                    <Lp2Field label="Ставка за занятие (₽) *" error={rateError} errorText="Введите сумму больше 0">
                        <TextInput
                            value={rate}
                            onUpdate={setRate}
                            onBlur={() => markTouched("rate")}
                            placeholder="2100"
                            size="l"
                        />
                    </Lp2Field>

                    <Lp2Field label="Заметки">
                        <TextArea
                            value={notes}
                            onUpdate={setNotes}
                            placeholder="Любые заметки..."
                            rows={3}
                            size="l"
                        />
                    </Lp2Field>

                    {formError && (
                        <Text as="div" variant="body-1" style={{ color: "var(--g-color-text-danger)" }}>
                            {formError}
                        </Text>
                    )}
                </div>
            </div>

            <div className="lp2__bottombar">
                <Button
                    className="lp2__submit"
                    view="action"
                    size="xl"
                    width="max"
                    onClick={handleSubmit}
                    loading={saving}
                >
                    Сохранить
                </Button>
            </div>
        </div>
    );

    return createPortal(panelContent, document.body);
};

export default CreateStudentModal;
