import { useState } from "react";
import Modal from "@/components/Modal";
import Field from "@/components/Field";
import Select from "@/components/Select";
import { students } from "@/mocks/students";

type CreatePackageModalProps = {
    visible: boolean;
    onClose: () => void;
};

const CreatePackageModal = ({ visible, onClose }: CreatePackageModalProps) => {
    const studentOptions = students.map((s) => ({
        id: s.id,
        title: s.name,
    }));

    const [student, setStudent] = useState<any>(null);
    const [lessonsCount, setLessonsCount] = useState("8");
    const [totalAmount, setTotalAmount] = useState("");
    const [validUntil, setValidUntil] = useState("");
    const [comment, setComment] = useState("");

    const handleSubmit = () => {
        onClose();
    };

    return (
        <Modal
            classWrap="max-w-[30rem]"
            title="Новый пакет"
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
                <div className="flex gap-4 md:flex-col">
                    <div className="flex-1">
                        <Field
                            label="Кол-во занятий *"
                            type="number"
                            placeholder="8"
                            value={lessonsCount}
                            onChange={(e: any) =>
                                setLessonsCount(e.target.value)
                            }
                            required
                        />
                    </div>
                    <div className="flex-1">
                        <Field
                            label="Сумма пакета (₽) *"
                            type="number"
                            placeholder="16800"
                            value={totalAmount}
                            onChange={(e: any) =>
                                setTotalAmount(e.target.value)
                            }
                            required
                        />
                    </div>
                </div>
                <Field
                    label="Действует до"
                    type="date"
                    value={validUntil}
                    onChange={(e: any) => setValidUntil(e.target.value)}
                />
                <Field
                    label="Комментарий"
                    type="text"
                    placeholder="Примечание к пакету…"
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

export default CreatePackageModal;
