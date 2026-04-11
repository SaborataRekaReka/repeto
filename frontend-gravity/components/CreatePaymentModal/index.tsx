import { useEffect, useState } from "react";
import { Dialog, TextInput, Select, Button, Text, TextArea } from "@gravity-ui/uikit";
import { useStudents } from "@/hooks/useStudents";
import { createPayment } from "@/hooks/usePayments";
import { toDateInputValue } from "@/lib/dates";

const GDialog = Dialog as any;

const methodOptions = [
    { value: "sbp", content: "СБП" },
    { value: "cash", content: "Наличные" },
    { value: "transfer", content: "Перевод" },
];

type CreatePaymentModalProps = {
    visible: boolean;
    onClose: () => void;
    onCreated?: () => void;
    defaultStudent?: {
        id: string;
        name: string;
    } | null;
};

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

    useEffect(() => {
        if (!visible) return;
        setStudentId(defaultStudent ? [defaultStudent.id] : []);
        setAmount("");
        setDate(today);
        setMethod(["sbp"]);
        setComment("");
    }, [visible, defaultStudent?.id, defaultStudent?.name, today]);

    const handleSubmit = async () => {
        if (!studentId.length || !amount) return;
        try {
            await createPayment({
                studentId: studentId[0],
                amount: Number(amount),
                date,
                method: method[0].toUpperCase(),
                comment: comment || undefined,
            });
            onCreated?.();
            onClose();
        } catch (err) {
            console.error("Failed to create payment:", err);
        }
    };

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
                            <Select
                                size="m"
                                width="max"
                                placeholder="Выберите ученика"
                                options={studentOptions}
                                value={studentId}
                                onUpdate={setStudentId}
                                filterable
                            />
                        </div>
                    )}
                    <div>
                        <Text variant="body-1" color="secondary" style={{ display: "block", marginBottom: 4 }}>Сумма (₽) *</Text>
                        <TextInput
                            size="m"
                            type="number"
                            placeholder="4200"
                            value={amount}
                            onUpdate={setAmount}
                        />
                    </div>
                    <div style={{ display: "flex", gap: 12 }}>
                        <div style={{ flex: 1 }}>
                            <Text variant="body-1" color="secondary" style={{ display: "block", marginBottom: 4 }}>Дата</Text>
                            <TextInput
                                size="m"
                                type={"date" as any}
                                value={date}
                                onUpdate={setDate}
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
                </div>
            </GDialog.Body>
            <GDialog.Footer
                textButtonApply="Сохранить"
                textButtonCancel="Отмена"
                onClickButtonApply={handleSubmit}
                onClickButtonCancel={onClose}
            />
        </GDialog>
    );
};

export default CreatePaymentModal;
