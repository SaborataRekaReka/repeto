import { useState } from "react";
import Modal from "@/components/Modal";
import Field from "@/components/Field";
import Select, { type SelectOption } from "@/components/Select";
import { students } from "@/mocks/students";

const methodOptions: SelectOption[] = [
    { id: "sbp", title: "СБП" },
    { id: "cash", title: "Наличные" },
    { id: "transfer", title: "Перевод" },
];

type CreatePaymentModalProps = {
    visible: boolean;
    onClose: () => void;
};

const CreatePaymentModal = ({ visible, onClose }: CreatePaymentModalProps) => {
    const studentOptions: SelectOption[] = students.map((s) => ({
        id: s.id,
        title: s.name,
    }));

    const today = new Date().toISOString().slice(0, 10);

    const [student, setStudent] = useState<SelectOption | null>(null);
    const [amount, setAmount] = useState("");
    const [date, setDate] = useState(today);
    const [method, setMethod] = useState<SelectOption>(methodOptions[0]);
    const [comment, setComment] = useState("");
    const [errors, setErrors] = useState<Record<string, string>>({});

    const validate = (): boolean => {
        const newErrors: Record<string, string> = {};
        if (!student) newErrors.student = "Выберите ученика";
        if (!amount.trim() || Number(amount) <= 0)
            newErrors.amount = "Введите корректную сумму";
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = () => {
        if (!validate()) return;
        onClose();
    };

    return (
        <Modal
            classWrap="max-w-[30rem]"
            title="Новая оплата"
            visible={visible}
            onClose={onClose}
        >
            <div className="p-6 space-y-4">
                <Select
                    label="Ученик *"
                    placeholder="Выберите ученика"
                    items={studentOptions}
                    value={student}
                    onChange={setStudent}
                />
                {errors.student && (
                    <p className="text-xs text-pink-1 -mt-2">{errors.student}</p>
                )}
                <Field
                    label="Сумма (₽) *"
                    type="number"
                    placeholder="4200"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    required
                />
                {errors.amount && (
                    <p className="text-xs text-pink-1 -mt-2">{errors.amount}</p>
                )}
                <div className="flex gap-4 md:flex-col">
                    <div className="flex-1">
                        <Field
                            label="Дата"
                            type="date"
                            value={date}
                            onChange={(e) => setDate(e.target.value)}
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
                    onChange={(e) => setComment(e.target.value)}
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
