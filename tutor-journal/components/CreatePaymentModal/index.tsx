import { useState } from "react";
import Modal from "@/components/Modal";
import Field from "@/components/Field";
import Select from "@/components/Select";
import { students } from "@/mocks/students";

const methodOptions = [
    { id: "sbp", title: "СБП" },
    { id: "cash", title: "Наличные" },
    { id: "transfer", title: "Перевод" },
];

type CreatePaymentModalProps = {
    visible: boolean;
    onClose: () => void;
};

const CreatePaymentModal = ({ visible, onClose }: CreatePaymentModalProps) => {
    const studentOptions = students.map((s) => ({
        id: s.id,
        title: s.name,
    }));

    const today = new Date().toISOString().slice(0, 10);

    const [student, setStudent] = useState<any>(null);
    const [amount, setAmount] = useState("");
    const [date, setDate] = useState(today);
    const [method, setMethod] = useState<any>(methodOptions[0]);
    const [comment, setComment] = useState("");

    const handleSubmit = () => {
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
