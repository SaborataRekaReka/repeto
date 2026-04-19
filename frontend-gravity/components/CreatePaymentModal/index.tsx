import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
    TextInput,
    Select,
    Button,
    Text,
    TextArea,
    Icon,
} from "@gravity-ui/uikit";
import { ArrowLeft } from "@gravity-ui/icons";
import type { IconData } from "@gravity-ui/uikit";
import { useStudents } from "@/hooks/useStudents";
import { createPayment, updatePayment, deletePayment, usePayments } from "@/hooks/usePayments";
import { useLessons } from "@/hooks/useLessons";
import { toDateInputValue } from "@/lib/dates";
import StyledDateInput from "@/components/StyledDateInput";
import { Lp2Field, Lp2Row } from "@/components/Lp2Field";
import { codedErrorMessage } from "@/lib/errorCodes";
import type { Payment } from "@/types/finance";

const methodOptions = [
    { value: "sbp", content: "СБП" },
    { value: "cash", content: "Наличные" },
    { value: "transfer", content: "Перевод" },
    { value: "yukassa", content: "ЮKassa" },
];

const STUDENT_BADGE_COLORS = ["#7a98ff", "#9f7aea", "#e29a6a", "#6fb38b", "#5ca8a8"];

function getStudentBadgeColor(name: string) {
    let hash = 0;
    for (let i = 0; i < name.length; i += 1) {
        hash = (hash * 31 + name.charCodeAt(i)) >>> 0;
    }
    return STUDENT_BADGE_COLORS[hash % STUDENT_BADGE_COLORS.length];
}

type CreatePaymentModalProps = {
    visible: boolean;
    onClose: () => void;
    onCreated?: (createdPayment?: any) => void | Promise<void>;
    onDeleted?: (deletedPayment?: Payment) => void | Promise<void>;
    defaultStudent?: {
        id: string;
        name: string;
    } | null;
    paymentData?: Payment | null;
};

const MAX_PAYMENT_AMOUNT = 2147483647;

function normalizeAmount(value: string): number {
    const digitsOnly = String(value || "").replace(/[^\d]/g, "");
    if (!digitsOnly) return NaN;
    return Number(digitsOnly);
}

function toInputDate(value: string | undefined, fallback: string): string {
    if (!value) return fallback;

    const raw = String(value).trim();
    if (!raw) return fallback;

    if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) {
        return raw;
    }

    const ru = raw.match(/^(\d{2})\.(\d{2})\.(\d{4})$/);
    if (ru) {
        return `${ru[3]}-${ru[2]}-${ru[1]}`;
    }

    const parsed = new Date(raw);
    if (Number.isNaN(parsed.getTime())) return fallback;

    return toDateInputValue(parsed);
}

const PANEL_Z = 135;

const CreatePaymentModal = ({
    visible,
    onClose,
    onCreated,
    onDeleted,
    defaultStudent,
    paymentData,
}: CreatePaymentModalProps) => {
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
        } else {
            setIsPanelVisible(false);
        }
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
        const handler = (e: KeyboardEvent) => { if (e.key === "Escape") handleClose(); };
        document.addEventListener("keydown", handler);
        return () => document.removeEventListener("keydown", handler);
    }, [visible, handleClose]);
    const studentsQuery = paymentData
        ? { limit: 200 }
        : { status: "active", limit: 200 };

    const {
        data: studentsData,
        loading: studentsLoading,
        error: studentsError,
        refetch: refetchStudents,
    } = useStudents(studentsQuery, { skip: !visible });
    const studentOptions = (studentsData?.data || []).map((s) => ({
        value: s.id,
        content: s.name,
        data: { color: getStudentBadgeColor(s.name) },
    }));
    const hasStudentLoadError = Boolean(studentsError);
    const hasNoActiveStudents =
        !studentsLoading && !hasStudentLoadError && studentOptions.length === 0;

    const today = toDateInputValue(new Date());

    const [studentId, setStudentId] = useState<string[]>([]);
    const [lessonId, setLessonId] = useState<string[]>([]);
    const [amount, setAmount] = useState("");
    const [date, setDate] = useState(today);
    const [method, setMethod] = useState<string[]>(["sbp"]);
    const [comment, setComment] = useState("");
    const [saving, setSaving] = useState(false);
    const [errorText, setErrorText] = useState<string | null>(null);
    const [touched, setTouched] = useState({
        studentId: false,
        amount: false,
    });

    const markTouched = (field: "studentId" | "amount") => {
        setTouched((prev) => (prev[field] ? prev : { ...prev, [field]: true }));
    };

    const isStudentSelectDisabled =
        saving || studentsLoading || hasStudentLoadError || hasNoActiveStudents;

    const selectedStudentValue = defaultStudent?.id || studentId[0] || "__no-student__";

    const { data: studentLessons = [], loading: lessonsLoading } = useLessons({
        studentId: selectedStudentValue,
    });

    const { data: studentPaymentsData } = usePayments({
        studentId: selectedStudentValue,
        limit: 300,
    });

    const linkedLessonIds = useMemo(() => {
        const ids = new Set<string>();
        (studentPaymentsData?.data || []).forEach((payment) => {
            if (paymentData?.id && payment.id === paymentData.id) {
                return;
            }
            if (payment.lessonId) {
                ids.add(payment.lessonId);
            }
        });
        return ids;
    }, [studentPaymentsData?.data, paymentData?.id]);

    const completedLessonOptions = useMemo(() => {
        return [...studentLessons]
            .filter(
                (lesson) =>
                    lesson.status === "completed" && !linkedLessonIds.has(lesson.id)
            )
            .sort((a, b) => (a.date > b.date ? -1 : 1))
            .map((lesson) => ({
                value: lesson.id,
                content: `${lesson.subject} · ${lesson.date} · ${lesson.rate.toLocaleString("ru-RU")} ₽`,
            }));
    }, [studentLessons, linkedLessonIds]);

    const completedLessonById = useMemo(() => {
        const map = new Map<string, (typeof studentLessons)[number]>();
        studentLessons.forEach((lesson) => {
            if (lesson.status === "completed") {
                map.set(lesson.id, lesson);
            }
        });
        return map;
    }, [studentLessons]);
    const studentPlaceholder = studentsLoading
        ? "Загружаем учеников..."
        : hasStudentLoadError
          ? "Не удалось загрузить учеников"
          : hasNoActiveStudents
            ? "Нет активных учеников"
            : "Выберите ученика";
    const selectedStudentId = studentId[0];
    const isEditing = !!paymentData;

    useEffect(() => {
        if (!visible) return;
        if (paymentData) {
            setStudentId([paymentData.studentId]);
            setLessonId(paymentData.lessonId ? [paymentData.lessonId] : []);
            setAmount(String(paymentData.amount || ""));
            setDate(toInputDate(paymentData.date, today));
            setMethod([paymentData.method || "sbp"]);
            setComment(paymentData.comment || "");
        } else {
            setStudentId(defaultStudent ? [defaultStudent.id] : []);
            setLessonId([]);
            setAmount("");
            setDate(today);
            setMethod(["sbp"]);
            setComment("");
        }
        setSaving(false);
        setErrorText(null);
        setTouched({ studentId: false, amount: false });
    }, [visible, defaultStudent, paymentData, today]);

    useEffect(() => {
        if (!visible || !!defaultStudent || !!paymentData) return;
        setLessonId([]);
    }, [selectedStudentId, visible, defaultStudent, paymentData]);

    useEffect(() => {
        if (!lessonId.length) return;
        const selected = completedLessonById.get(lessonId[0]);
        if (!selected) {
            setLessonId([]);
            return;
        }

        if (!amount.trim()) {
            setAmount(String(selected.rate));
        }
    }, [lessonId, completedLessonById, amount]);

    const handleSubmit = async () => {
        if (saving) return;

        const normalizedAmount = normalizeAmount(amount);
        setTouched({ studentId: true, amount: true });

        if (!defaultStudent) {
            if (studentsLoading) {
                setErrorText("Список учеников загружается. Повторите попытку через секунду.");
                return;
            }
            if (hasStudentLoadError) {
                setErrorText("Не удалось загрузить список активных учеников. Обновите список и попробуйте снова.");
                return;
            }
            if (hasNoActiveStudents) {
                setErrorText("Нет активных учеников. Добавьте ученика перед записью оплаты.");
                return;
            }
        }

        if (!studentId.length) {
            setErrorText("Выберите ученика.");
            return;
        }
        if (!Number.isFinite(normalizedAmount) || normalizedAmount < 1) {
            setErrorText("Введите корректную сумму больше 0.");
            return;
        }
        if (normalizedAmount > MAX_PAYMENT_AMOUNT) {
            setErrorText("Сумма слишком большая.");
            return;
        }
        if (!method.length) {
            setErrorText("Выберите способ оплаты.");
            return;
        }

        setSaving(true);
        setErrorText(null);
        try {
            const payload = {
                studentId: studentId[0],
                lessonId: lessonId[0] || null,
                amount: normalizedAmount,
                date,
                method: method[0].toUpperCase(),
                comment: comment.trim() ? comment.trim() : null,
            };

            if (paymentData) {
                await updatePayment(paymentData.id, payload);
                await onCreated?.();
            } else {
                const createdPayment = await createPayment({
                    ...payload,
                    lessonId: payload.lessonId || undefined,
                    comment: payload.comment || undefined,
                });
                await onCreated?.(createdPayment);
            }

            handleClose();
        } catch (err) {
            setErrorText(codedErrorMessage(paymentData ? "PAY-UPD" : "PAY-CREATE", err));
        } finally {
            setSaving(false);
        }
    };

    const canDelete = !!paymentData && paymentData.isManual !== false;

    const handleDelete = async () => {
        if (!paymentData || saving || !canDelete) return;

        setSaving(true);
        setErrorText(null);
        try {
            await deletePayment(paymentData.id);
            await onDeleted?.(paymentData);
            await onCreated?.();
            handleClose();
        } catch (err) {
            setErrorText(codedErrorMessage("PAY-DEL", err));
        } finally {
            setSaving(false);
        }
    };

    const studentError =
        !defaultStudent &&
        touched.studentId &&
        !studentId.length &&
        !studentsLoading &&
        !hasStudentLoadError &&
        !hasNoActiveStudents;
    const amountError =
        touched.amount &&
        (!Number.isFinite(normalizeAmount(amount)) || normalizeAmount(amount) < 1 || normalizeAmount(amount) > MAX_PAYMENT_AMOUNT);

    const renderStudentOption = (option: any) => {
        const optionLabel =
            typeof option?.content === "string" && option.content.trim().length
                ? option.content
                : "Ученик";

        return (
            <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "4px 0" }}>
                <div
                    style={{
                        width: 28,
                        height: 28,
                        borderRadius: "50%",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "#fff",
                        fontWeight: 600,
                        fontSize: 13,
                        flexShrink: 0,
                        background: option?.data?.color || getStudentBadgeColor(optionLabel),
                    }}
                >
                    {optionLabel.charAt(0).toUpperCase()}
                </div>
                <Text variant="body-1">{optionLabel}</Text>
            </div>
        );
    };

    if (!mounted || (!shouldRender && !visible)) return null;

    const panelContent = (
        <div
            ref={panelRef}
            className={`lp2 ${isPanelVisible ? "lp2--open" : ""}`}
            style={{ zIndex: PANEL_Z }}
            onTransitionEnd={handleTransitionEnd}
            role="dialog"
            aria-modal="false"
            aria-label={isEditing ? "Редактирование оплаты" : "Новая оплата"}
        >
            <div className="lp2__topbar">
                <button type="button" className="lp2__back" onClick={handleClose} aria-label="Назад">
                    <Icon data={ArrowLeft as IconData} size={18} />
                </button>
                <div className="lp2__topbar-actions" />
            </div>

            <div className="lp2__scroll">
                <div className="lp2__center">
                    <h1 className="lp2__page-title">{isEditing ? "Редактирование оплаты" : "Новая оплата"}</h1>

                    {defaultStudent ? (
                        <Lp2Field label="Ученик">
                            <Text variant="body-1" style={{ fontWeight: 600 }}>{defaultStudent.name}</Text>
                        </Lp2Field>
                    ) : (
                        <Lp2Field label="Ученик *" error={studentError} errorText="Обязательное поле">
                            <Select
                                size="l"
                                width="max"
                                placeholder={studentPlaceholder}
                                options={studentOptions}
                                renderOption={renderStudentOption}
                                value={studentId}
                                onUpdate={(value) => {
                                    setStudentId(value);
                                    markTouched("studentId");
                                }}
                                filterable
                                disabled={isStudentSelectDisabled}
                                popupWidth="fit"
                                popupPlacement={["bottom-start", "top-start"]}
                                popupClassName="lp2-popup"
                            />
                            {studentsLoading && (
                                <Text as="div" variant="caption-2" color="secondary" style={{ marginTop: 4 }}>
                                    Загружаем активных учеников...
                                </Text>
                            )}
                            {hasStudentLoadError && (
                                <div style={{ marginTop: 6, display: "flex", alignItems: "center", gap: 8 }}>
                                    <Text as="div" variant="caption-2" style={{ color: "var(--g-color-text-danger)" }}>
                                        Не удалось загрузить список активных учеников.
                                    </Text>
                                    <Button
                                        view="outlined"
                                        size="s"
                                        onClick={() => { void refetchStudents(); }}
                                        disabled={saving}
                                    >
                                        Обновить
                                    </Button>
                                </div>
                            )}
                            {hasNoActiveStudents && (
                                <Text as="div" variant="caption-2" color="secondary" style={{ marginTop: 4 }}>
                                    Нет активных учеников для выбора.
                                </Text>
                            )}
                        </Lp2Field>
                    )}

                    <Lp2Field label="Сумма (₽) *" error={amountError} errorText="Введите корректную сумму больше 0">
                        <TextInput
                            size="l"
                            type="text"
                            placeholder="4200"
                            value={amount}
                            onUpdate={setAmount}
                            onBlur={() => markTouched("amount")}
                        />
                    </Lp2Field>

                    <Lp2Row>
                        <Lp2Field label="Дата" half>
                            <StyledDateInput
                                value={date}
                                onUpdate={setDate}
                                style={{ height: 36, padding: 0 }}
                            />
                        </Lp2Field>
                        <Lp2Field label="Способ оплаты" half>
                            <Select
                                size="l"
                                width="max"
                                options={methodOptions}
                                value={method}
                                onUpdate={setMethod}
                                popupClassName="lp2-popup"
                            />
                        </Lp2Field>
                    </Lp2Row>

                    <Lp2Field label="Привязать к занятию (опционально)">
                        <Select
                            size="l"
                            width="max"
                            placeholder={
                                selectedStudentValue === "__no-student__"
                                    ? "Сначала выберите ученика"
                                    : lessonsLoading
                                      ? "Загружаем занятия..."
                                      : completedLessonOptions.length > 0
                                        ? "Выберите проведенное занятие"
                                        : "Нет свободных проведенных занятий"
                            }
                            options={completedLessonOptions}
                            value={lessonId}
                            onUpdate={setLessonId}
                            disabled={
                                saving ||
                                selectedStudentValue === "__no-student__" ||
                                lessonsLoading ||
                                completedLessonOptions.length === 0
                            }
                            popupClassName="lp2-popup"
                        />
                        <Text as="div" variant="caption-2" color="secondary" style={{ marginTop: 4 }}>
                            Занятия, уже связанные с оплатами, в список не попадают.
                        </Text>
                    </Lp2Field>

                    <Lp2Field label="Комментарий">
                        <TextArea
                            size="l"
                            placeholder="За какие занятия, пакет и т.д."
                            value={comment}
                            onUpdate={setComment}
                            rows={2}
                        />
                    </Lp2Field>

                    {errorText && (
                        <Text variant="body-1" style={{ color: "var(--g-color-text-danger)" }}>
                            {errorText}
                        </Text>
                    )}
                </div>
            </div>

            <div className="lp2__bottombar">
                {isEditing ? (
                    <div className="lp2__actions lp2__actions--split">
                        <Button
                            className="lp2__action lp2__action--secondary"
                            view="outlined"
                            size="xl"
                            width="max"
                            onClick={handleDelete}
                            loading={saving}
                            disabled={saving || !canDelete}
                            title={
                                !canDelete
                                    ? "Оплаты из платежной системы удалять нельзя"
                                    : undefined
                            }
                        >
                            Удалить
                        </Button>
                        <Button
                            className="lp2__submit lp2__action"
                            view="action"
                            size="xl"
                            width="max"
                            onClick={handleSubmit}
                            loading={saving}
                        >
                            Сохранить
                        </Button>
                    </div>
                ) : (
                    <div className="lp2__actions">
                        <Button
                            className="lp2__submit lp2__action"
                            view="action"
                            size="xl"
                            width="max"
                            onClick={handleSubmit}
                            loading={saving}
                        >
                            Сохранить
                        </Button>
                    </div>
                )}
            </div>
        </div>
    );

    return createPortal(panelContent, document.body);
};

export default CreatePaymentModal;
