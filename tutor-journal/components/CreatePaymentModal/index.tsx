import { useEffect, useState } from "react";
import Modal from "@/components/Modal";
import Field from "@/components/Field";
import Select from "@/components/Select";
import { useStudents } from "@/hooks/useStudents";
import { createPayment } from "@/hooks/usePayments";
import { toDateInputValue } from "@/lib/dates";

const methodOptions = [
    { id: "sbp", title: "СБП" },
    { id: "cash", title: "Наличные" },
    { id: "transfer", title: "Перевод" },
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
        id: s.id,
        title: s.name,
    }));

    const today = toDateInputValue(new Date());

    const [student, setStudent] = useState<any>(null);
    const [amount, setAmount] = useState("");
    const [date, setDate] = useState(today);
    const [method, setMethod] = useState<any>(methodOptions[0]);
    const [comment, setComment] = useState("");

    useEffect(() => {
        if (!visible) return;

        const matchedStudent = defaultStudent
            ? {
                  id: defaultStudent.id,
                  title: defaultStudent.name,
              }
            : null;

        setStudent(matchedStudent);
        setAmount("");
        setDate(today);
        setMethod(methodOptions[0]);
        setComment("");
    }, [visible, defaultStudent?.id, defaultStudent?.name, today]);

    const handleSubmit = async () => {
        if (!student || !amount) return;
        try {
            await createPayment({
                studentId: student.id,
                amount: Number(amount),
                date,
                method: method.id.toUpperCase(),
                comment: comment || undefined,
            });
            onCreated?.();
            onClose();
        } catch (err) {
            console.error("Failed to create payment:", err);
        }
    };

    return (
        <Modal
            classWrap="max-w-[30rem]"
            title="Новая оплата"
            visible={visible}
            onClose={onClose}
        >
            <div className="p-6 space-y-4">
                {defaultStudent ? (
                    <div>
                        <div className="mb-3 text-xs font-bold">Ученик</div>
                        <div className="flex items-center w-full h-16 px-5 bg-n-4 border border-n-1 rounded-sm text-sm font-bold text-n-1 dark:bg-n-1 dark:border-white dark:text-white">
                            {defaultStudent.name}
                        </div>
                    </div>
                ) : (
                    <Select
                        label="Ученик *"
                        placeholder="Выберите ученика"
                        items={studentOptions}
                        value={student}
                        onChange={setStudent}
                    />
                )}
                <Field
                    label="Сумма (₽) *"
                    type="number"
                    placeholder="4200"
                    value={amount}
                    onChange={(e: any) => setAmount(e.target.value)}
                    required
                />
                <div className="flex gap-4 md:flex-col">
                    <div className="flex-1">
                        <Field
                            label="Дата"
                            type="date"
                            value={date}
                            onChange={(e: any) => setDate(e.target.value)}
                        />
                    </div>
                    <div className="flex-1">
                        <Select
                            label="Способ оплаты"
                            items={methodOptions}
                            value={method}
                            onChange={setMethod}
                        />
                    </div>
                </div>
                <Field
                    label="Комментарий"
                    type="text"
                    placeholder="За какие занятия, пакет и т.д."
                    value={comment}
                    onChange={(e: any) => setComment(e.target.value)}
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

export default CreatePaymentModal;
