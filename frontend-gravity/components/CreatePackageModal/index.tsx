import { useState, useEffect } from "react";
import { Dialog, TextInput, Select, Button, Text, TextArea } from "@gravity-ui/uikit";
import { useStudents } from "@/hooks/useStudents";
import { createPackage, updatePackage } from "@/hooks/usePackages";
import type { LessonPackage } from "@/types/package";

const GDialog = Dialog as any;

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
        value: s.id,
        content: s.name,
        data: s,
    }));

    const [studentId, setStudentId] = useState<string[]>([]);
    const [subject, setSubject] = useState("");
    const [lessonsCount, setLessonsCount] = useState("8");
    const [totalAmount, setTotalAmount] = useState("");
    const [validUntil, setValidUntil] = useState("");
    const [comment, setComment] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (studentId.length && !packageData) {
            const matched = studentOptions.find((s) => s.value === studentId[0]);
            if (matched?.data?.subject) setSubject(matched.data.subject);
        }
    }, [studentId, studentOptions, packageData]);

    useEffect(() => {
        if (!visible) return;
        setError(null);
        setSubmitting(false);

        if (packageData) {
            setStudentId(packageData.studentId ? [packageData.studentId] : []);
            setSubject(packageData.subject || "");
            setLessonsCount(String(packageData.lessonsTotal || 8));
            setTotalAmount(String(packageData.totalPrice || ""));
            setValidUntil(packageData.validUntilValue || "");
            setComment("");
            return;
        }

        setStudentId([]);
        setSubject("");
        setLessonsCount("8");
        setTotalAmount("");
        setValidUntil("");
        setComment("");
    }, [visible, packageData]);

    const handleSubmit = async () => {
        if (!studentId.length || !lessonsCount || !totalAmount || !subject) {
            setError("Заполните обязательные поля: ученик, предмет, количество и сумма.");
            return;
        }
        setSubmitting(true);
        setError(null);
        try {
            const payload = {
                studentId: studentId[0],
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

    const isEditing = !!packageData;

    return (
        <GDialog open={visible} onClose={onClose} size="m">
            <GDialog.Header caption={isEditing ? "Редактировать пакет" : "Новый пакет"} />
            <GDialog.Body>
                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
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
                    <div>
                        <Text variant="body-1" color="secondary" style={{ display: "block", marginBottom: 4 }}>Предмет *</Text>
                        <TextInput
                            size="m"
                            placeholder="Математика"
                            value={subject}
                            onUpdate={setSubject}
                        />
                    </div>
                    <div style={{ display: "flex", gap: 12 }}>
                        <div style={{ flex: 1 }}>
                            <Text variant="body-1" color="secondary" style={{ display: "block", marginBottom: 4 }}>Кол-во занятий *</Text>
                            <TextInput
                                size="m"
                                type="number"
                                placeholder="8"
                                value={lessonsCount}
                                onUpdate={setLessonsCount}
                            />
                        </div>
                        <div style={{ flex: 1 }}>
                            <Text variant="body-1" color="secondary" style={{ display: "block", marginBottom: 4 }}>Сумма пакета (₽) *</Text>
                            <TextInput
                                size="m"
                                type="number"
                                placeholder="16800"
                                value={totalAmount}
                                onUpdate={setTotalAmount}
                            />
                        </div>
                    </div>
                    <div>
                        <Text variant="body-1" color="secondary" style={{ display: "block", marginBottom: 4 }}>Действует до</Text>
                        <TextInput
                            size="m"
                            type={"date" as any}
                            value={validUntil}
                            onUpdate={setValidUntil}
                        />
                    </div>
                    <div>
                        <Text variant="body-1" color="secondary" style={{ display: "block", marginBottom: 4 }}>Комментарий</Text>
                        <TextArea
                            size="m"
                            placeholder="Примечание к пакету…"
                            value={comment}
                            onUpdate={setComment}
                            rows={2}
                        />
                    </div>
                    {error && (
                        <div style={{
                            padding: "8px 12px",
                            borderRadius: 8,
                            background: "var(--g-color-base-danger-light)",
                            border: "1px solid var(--g-color-line-danger)",
                        }}>
                            <Text variant="body-1" color="danger">{error}</Text>
                        </div>
                    )}
                </div>
            </GDialog.Body>
            <GDialog.Footer
                textButtonApply={submitting ? "Сохраняем..." : isEditing ? "Сохранить изменения" : "Сохранить"}
                textButtonCancel="Отмена"
                onClickButtonApply={handleSubmit}
                onClickButtonCancel={onClose}
                propsButtonApply={{ disabled: submitting }}
                propsButtonCancel={{ disabled: submitting }}
            />
        </GDialog>
    );
};

export default CreatePackageModal;
