import { useState, useEffect } from "react";
import Modal from "@/components/Modal";
import Field from "@/components/Field";
import Select from "@/components/Select";
import { useStudents } from "@/hooks/useStudents";
import { createPackage, updatePackage } from "@/hooks/usePackages";
import type { LessonPackage } from "@/types/package";

type CreatePackageModalProps = {
    visible: boolean;
    onClose: () => void;
    onCreated?: () => void;
    packageData?: LessonPackage | null;
};

const CreatePackageModal = ({
    visible,
    onClose,
    onCreated,
    packageData,
}: CreatePackageModalProps) => {
    const { data: studentsData } = useStudents({ limit: 200 });
    const studentOptions = (studentsData?.data || []).map((s) => ({
        id: s.id,
        title: s.name,
        subject: s.subject,
    }));

    const [student, setStudent] = useState<any>(null);
    const [subject, setSubject] = useState("");
    const [lessonsCount, setLessonsCount] = useState("8");
    const [totalAmount, setTotalAmount] = useState("");
    const [validUntil, setValidUntil] = useState("");
    const [comment, setComment] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (student && !packageData) {
            const matched = studentOptions.find((s: any) => s.id === student.id);
            if (matched) setSubject(matched.subject || "");
        }
    }, [student, studentOptions, packageData]);

    useEffect(() => {
        if (!visible) return;

        setError(null);
        setSubmitting(false);

        if (packageData) {
            const matchedStudent = studentOptions.find(
                (item: any) => item.id === packageData.studentId
            );
            setStudent(matchedStudent || null);
            setSubject(packageData.subject || "");
            setLessonsCount(String(packageData.lessonsTotal || 8));
            setTotalAmount(String(packageData.totalPrice || ""));
            setValidUntil(packageData.validUntilValue || "");
            setComment("");
            return;
        }

        setStudent(null);
        setSubject("");
        setLessonsCount("8");
        setTotalAmount("");
        setValidUntil("");
        setComment("");
    }, [visible, packageData, studentOptions]);

    const handleSubmit = async () => {
        if (!student || !lessonsCount || !totalAmount || !subject) {
            setError("Заполните обязательные поля: ученик, предмет, количество и сумма.");
            return;
        }
        setSubmitting(true);
        setError(null);
        try {
            const payload = {
                studentId: student.id,
                subject,
                lessonsTotal: Number(lessonsCount),
                totalPrice: Number(totalAmount),
                validUntil: validUntil || undefined,
            };

            if (packageData) {
                await updatePackage(packageData.id, payload);
            } else {
                await createPackage(payload);
            }

            onCreated?.();
            onClose();
        } catch (err) {
            console.error("Failed to save package:", err);
            setError("Не удалось сохранить пакет. Проверьте поля и попробуйте снова.");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <Modal
            classWrap="max-w-[30rem]"
            title={packageData ? "Редактировать пакет" : "Новый пакет"}
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
                    label="Предмет *"
                    type="text"
                    placeholder="Математика"
                    value={subject}
                    onChange={(e: any) => setSubject(e.target.value)}
                    required
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
                {error && (
                    <div className="p-2 text-xs font-bold text-pink-1 border border-pink-1 rounded-sm bg-pink-2 dark:bg-pink-1/10">
                        {error}
                    </div>
                )}
                <div className="flex gap-3 pt-4">
                    <button
                        className="btn-purple btn-medium grow"
                        onClick={handleSubmit}
                        disabled={submitting}
                    >
                        {submitting
                            ? "Сохраняем..."
                            : packageData
                            ? "Сохранить изменения"
                            : "Сохранить"}
                    </button>
                    <button
                        className="btn-stroke btn-medium grow"
                        onClick={onClose}
                        disabled={submitting}
                    >
                        Отмена
                    </button>
                </div>
            </div>
        </Modal>
    );
};

export default CreatePackageModal;
