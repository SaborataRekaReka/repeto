import { useState, useEffect, useCallback, useRef } from "react";
import { createPortal } from "react-dom";
import {
    TextInput,
    TextArea,
    Text,
    Button,
    Icon,
    Switch,
    Tooltip,
} from "@gravity-ui/uikit";
import { ArrowLeft, CircleQuestion } from "@gravity-ui/icons";
import type { IconData } from "@gravity-ui/uikit";
import { createStudent, checkStudentEmail } from "@/hooks/useStudents";
import { useSettings } from "@/hooks/useSettings";
import { codedErrorMessage } from "@/lib/errorCodes";
import { Lp2Field, Lp2Row } from "@/components/Lp2Field";
import PhoneInput from "@/components/PhoneInput";
import type { Student } from "@/types/student";

const DEFAULT_SUBJECTS = [
    "Математика", "Английский", "Физика", "Русский язык",
    "Химия", "Биология", "История",
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
    const [subject, setSubject] = useState("");
    const [subjectFocused, setSubjectFocused] = useState(false);
    const [phone, setPhone] = useState("");
    const [email, setEmail] = useState("");
    const [inviteToRepeto, setInviteToRepeto] = useState(false);
    const [parentName, setParentName] = useState("");
    const [parentPhone, setParentPhone] = useState("");
    const [parentEmail, setParentEmail] = useState("");
    const [rate, setRate] = useState("");
    const [notes, setNotes] = useState("");
    const [saving, setSaving] = useState(false);
    const [formError, setFormError] = useState<string | null>(null);
    const [emailCheckResult, setEmailCheckResult] = useState<{ exists: boolean; name?: string } | null>(null);
    const [emailChecking, setEmailChecking] = useState(false);
    const emailCheckTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
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
            setName(""); setGrade(""); setAge(""); setSubject(""); setPhone("");
            setEmail(""); setInviteToRepeto(false);
            setParentName(""); setParentPhone(""); setParentEmail("");
            setRate(""); setNotes("");
            setTouched({ name: false, subject: false, rate: false });
            setFormError(null);
            setEmailCheckResult(null);
            setEmailChecking(false);
        }
    }, [visible]);

    // Debounced email lookup
    useEffect(() => {
        if (emailCheckTimerRef.current) clearTimeout(emailCheckTimerRef.current);
        const trimmed = email.trim().toLowerCase();
        if (!trimmed || !isEmailLike(trimmed)) {
            setEmailCheckResult(null);
            setEmailChecking(false);
            setInviteToRepeto(false);
            return;
        }
        setEmailChecking(true);
        setEmailCheckResult(null);
        setInviteToRepeto(false);
        emailCheckTimerRef.current = setTimeout(async () => {
            try {
                const result = await checkStudentEmail(trimmed);
                setEmailCheckResult(result);
            } catch {
                setEmailCheckResult(null);
            } finally {
                setEmailChecking(false);
            }
        }, 500);
        return () => { if (emailCheckTimerRef.current) clearTimeout(emailCheckTimerRef.current); };
    }, [email]);

    const handleSubmit = async () => {
        const normalizedName = name.trim();
        const normalizedRate = normalizeRate(rate);
        const normalizedAge = Number(String(age || "").trim());
        const safeAge = Number.isFinite(normalizedAge) && normalizedAge > 0
            ? Math.floor(normalizedAge)
            : undefined;
        const safeGrade = cleanOptionalString(grade);
        const safePhone = cleanOptionalString(phone);
        const safeEmail = cleanOptionalString(email);
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

        if (!subject.trim()) {
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

        if (safeEmail && !isEmailLike(safeEmail)) {
            setFormError("Укажите корректный email ученика.");
            return;
        }

        if (inviteToRepeto && !safeEmail) {
            setFormError("Укажите email ученика, чтобы отправить приглашение.");
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
                subject: subject.trim(),
                rate: normalizedRate,
                grade: safeGrade,
                age: safeAge,
                phone: safePhone,
                email: safeEmail,
                invite: inviteToRepeto || undefined,
                parentName: safeParentName,
                parentPhone: safeParentPhone,
                parentEmail: safeParentEmail,
                notes: safeNotes,
            });
            await onCreated?.(createdStudent);
            handleClose();
        } catch (err) {
            setFormError(codedErrorMessage("STUDENT-CREATE", err));
        } finally {
            setSaving(false);
        }
    };

    const nameError = touched.name && !name.trim();
    const subjectError = touched.subject && !subject.trim();

    const { data: settingsData } = useSettings();
    const userSubjects: string[] = settingsData?.subjects || [];
    const allSuggestions = [...new Set([...userSubjects, ...DEFAULT_SUBJECTS])];
    const filteredSuggestions = subject.trim()
        ? allSuggestions.filter((s) => s.toLowerCase().includes(subject.trim().toLowerCase()))
        : allSuggestions;
    const showSuggestions = subjectFocused && filteredSuggestions.length > 0;
    const rateError = touched.rate && (!Number.isFinite(normalizeRate(rate)) || normalizeRate(rate) <= 0);
    const normalizedEmail = email.trim().toLowerCase();
    const showInviteControls = normalizedEmail.length > 0 && isEmailLike(normalizedEmail);
    const studentExists = emailCheckResult?.exists === true;
    const inviteToggleLabel = studentExists ? "Работать вместе" : "Пригласить";
    const inviteStatusText = emailChecking
        ? "Проверяем ученика в Repeto..."
        : studentExists
            ? "Ученик зарегистрирован в Repeto"
            : "Ученик не зарегистрирован в Repeto";

    if (!mounted || (!shouldRender && !visible)) return null;

    const panelContent = (
        <div
            ref={panelRef}
            className={`lp2 lp2--mobile-inline-title ${isPanelVisible ? "lp2--open" : ""}`}
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
                        <div style={{ position: "relative" }}>
                            <TextInput
                                value={subject}
                                onUpdate={(value) => {
                                    setSubject(value);
                                    markTouched("subject");
                                }}
                                onFocus={() => setSubjectFocused(true)}
                                onBlur={() => { setTimeout(() => setSubjectFocused(false), 150); }}
                                placeholder="Введите или выберите предмет"
                                size="l"
                                autoComplete="off"
                            />
                            {showSuggestions && (
                                <div className="lp2-autocomplete-list">
                                    {filteredSuggestions.map((s) => (
                                        <button
                                            key={s}
                                            type="button"
                                            className="lp2-autocomplete-item"
                                            onMouseDown={(e) => { e.preventDefault(); setSubject(s); setSubjectFocused(false); markTouched("subject"); }}
                                        >
                                            {s}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    </Lp2Field>

                    <Lp2Field label="Телефон ученика">
                        <PhoneInput
                            value={phone}
                            onUpdate={setPhone}
                        />
                    </Lp2Field>

                    <Lp2Field label="Email ученика">
                        <TextInput
                            value={email}
                            onUpdate={setEmail}
                            placeholder="student@email.com"
                            size="l"
                            type="email"
                        />
                    </Lp2Field>

                    {showInviteControls && (
                        <div className="lp2-invite-card">
                            <div className="lp2-invite-card__text">
                                <div className="lp2-invite-card__title-row">
                                    <Text variant="body-2" className="lp2-invite-card__title">
                                        {inviteStatusText}
                                    </Text>
                                    <Tooltip
                                        content="Ученик получит приглашение на почту"
                                        placement="top"
                                        openDelay={120}
                                        closeDelay={0}
                                    >
                                        <span
                                            className="lp2-invite-card__hint"
                                            aria-label="Ученик получит приглашение на почту"
                                        >
                                            <Icon data={CircleQuestion as IconData} size={14} />
                                        </span>
                                    </Tooltip>
                                </div>
                                <Text variant="body-2" color="secondary" className="lp2-invite-card__subtitle">
                                    {inviteToggleLabel}
                                </Text>
                            </div>
                            <Switch
                                checked={inviteToRepeto}
                                onUpdate={setInviteToRepeto}
                                size="l"
                                disabled={emailChecking}
                            />
                        </div>
                    )}

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
                            <PhoneInput
                                value={parentPhone}
                                onUpdate={setParentPhone}
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
