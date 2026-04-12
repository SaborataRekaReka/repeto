import { useEffect, useState } from "react";
import { Dialog, TextInput, Select, Button, Text, TextArea } from "@gravity-ui/uikit";
import { useStudents } from "@/hooks/useStudents";
import { createPayment } from "@/hooks/usePayments";
import { toDateInputValue } from "@/lib/dates";
import StyledDateInput from "@/components/StyledDateInput";
import { codedErrorMessage } from "@/lib/errorCodes";

const GDialog = Dialog as any;

const methodOptions = [
    { value: "sbp", content: "СБП" },
    { value: "cash", content: "Наличные" },
    { value: "transfer", content: "Перевод" },
];

type CreatePaymentModalProps = {
    visible: boolean;
    onClose: () => void;
    onCreated?: () => void | Promise<void>;
    defaultStudent?: {
        id: string;
        name: string;
    } | null;
};

const MAX_PAYMENT_AMOUNT = 2147483647;

const errorWrapStyle = (invalid: boolean) =>
    invalid
        ? {
              border: "1px solid var(--g-color-line-danger)",
              borderRadius: 8,
              padding: 2,
          }
        : undefined;

function normalizeAmount(value: string): number {
    const digitsOnly = String(value || "").replace(/[^\d]/g, "");
    if (!digitsOnly) return NaN;
    return Number(digitsOnly);
}

const CreatePaymentModal = ({
    visible,
    onClose,
    onCreated,
    defaultStudent,
}: CreatePaymentModalProps) => {
    const { data: studentsData } = useStudents({ limit: 200 });
    const studentOptions = (studentsData?.data || []).map((s) => ({
        value: s.id,
        content: s.name,
    }));

    const today = toDateInputValue(new Date());

    const [studentId, setStudentId] = useState<string[]>([]);
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

    useEffect(() => {
        if (!visible) return;
        setStudentId(defaultStudent ? [defaultStudent.id] : []);
        setAmount("");
        setDate(today);
        setMethod(["sbp"]);
        setComment("");
        setSaving(false);
        setErrorText(null);
        setTouched({ studentId: false, amount: false });
    }, [visible, defaultStudent?.id, defaultStudent?.name, today]);

    const handleSubmit = async () => {
        if (saving) return;

        const normalizedAmount = normalizeAmount(amount);
        setTouched({ studentId: true, amount: true });

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
            await createPayment({
                studentId: studentId[0],
                amount: normalizedAmount,
                date,
                method: method[0].toUpperCase(),
                comment: comment || undefined,
            });
            await onCreated?.();
            onClose();
        } catch (err) {
            setErrorText(codedErrorMessage("PAY-CREATE", err));
        } finally {
            setSaving(false);
        }
    };

    const studentError = !defaultStudent && touched.studentId && !studentId.length;
    const amountError =
        touched.amount &&
        (!Number.isFinite(normalizeAmount(amount)) || normalizeAmount(amount) < 1 || normalizeAmount(amount) > MAX_PAYMENT_AMOUNT);

    return (
        <GDialog open={visible} onClose={onClose} size="m">
            <GDialog.Header caption="Новая оплата" />
            <GDialog.Body>
                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                    {defaultStudent ? (
                        <div>
                            <Text variant="body-1" color="secondary" style={{ display: "block", marginBottom: 4 }}>Ученик</Text>
                            <div style={{
                                padding: "10px 12px",
                                background: "var(--g-color-base-generic)",
                                borderRadius: 8,
                            }}>
                                <Text variant="body-1" style={{ fontWeight: 600 }}>{defaultStudent.name}</Text>
                            </div>
                        </div>
                    ) : (
                        <div>
                            <Text variant="body-1" color="secondary" style={{ display: "block", marginBottom: 4 }}>Ученик *</Text>
                            <div style={errorWrapStyle(studentError)} onClick={() => markTouched("studentId")}> 
                                <Select
                                    size="m"
                                    width="max"
                                    placeholder="Выберите ученика"
                                    options={studentOptions}
                                    value={studentId}
                                    onUpdate={(value) => {
                                        setStudentId(value);
                                        markTouched("studentId");
                                    }}
                                    filterable
                                />
                            </div>
                            {studentError && (
                                <Text as="div" variant="caption-2" style={{ marginTop: 4, color: "var(--g-color-text-danger)" }}>
                                    Обязательное поле
                                </Text>
                            )}
                        </div>
                    )}
                    <div>
                        <Text variant="body-1" color="secondary" style={{ display: "block", marginBottom: 4 }}>Сумма (₽) *</Text>
                        <div style={errorWrapStyle(amountError)}>
                            <TextInput
                                size="m"
                                type="text"
                                placeholder="4200"
                                value={amount}
                                onUpdate={setAmount}
                                onBlur={() => markTouched("amount")}
                            />
                        </div>
                        {amountError && (
                            <Text as="div" variant="caption-2" style={{ marginTop: 4, color: "var(--g-color-text-danger)" }}>
                                Введите корректную сумму больше 0
                            </Text>
                        )}
                    </div>
                    <div style={{ display: "flex", gap: 12 }}>
                        <div style={{ flex: 1 }}>
                            <Text variant="body-1" color="secondary" style={{ display: "block", marginBottom: 4 }}>Дата</Text>
                            <StyledDateInput
                                value={date}
                                onUpdate={setDate}
                                style={{ height: 36, padding: "0 12px" }}
                            />
                        </div>
                        <div style={{ flex: 1 }}>
                            <Text variant="body-1" color="secondary" style={{ display: "block", marginBottom: 4 }}>Способ оплаты</Text>
                            <Select
                                size="m"
                                width="max"
                                options={methodOptions}
                                value={method}
                                onUpdate={setMethod}
                            />
                        </div>
                    </div>
                    <div>
                        <Text variant="body-1" color="secondary" style={{ display: "block", marginBottom: 4 }}>Комментарий</Text>
                        <TextArea
                            size="m"
                            placeholder="За какие занятия, пакет и т.д."
                            value={comment}
                            onUpdate={setComment}
                            rows={2}
                        />
                    </div>
                    {errorText && (
                        <Text variant="body-1" style={{ color: "var(--g-color-text-danger)" }}>
                            {errorText}
                        </Text>
                    )}
                </div>
            </GDialog.Body>
            <GDialog.Footer
                textButtonApply={saving ? "Сохраняем..." : "Сохранить"}
                textButtonCancel="Отмена"
                onClickButtonApply={handleSubmit}
                onClickButtonCancel={onClose}
            />
        </GDialog>
    );
};

export default CreatePaymentModal;
