import { useState, useEffect } from "react";
import { Dialog, TextInput, Select, Button, Text, TextArea } from "@gravity-ui/uikit";
import { useStudents } from "@/hooks/useStudents";
import { createPackage, updatePackage, deletePackage } from "@/hooks/usePackages";
import StyledDateInput from "@/components/StyledDateInput";
import type { LessonPackage } from "@/types/package";

const GDialog = Dialog as any;

const errorWrapStyle = (invalid: boolean) =>
    invalid
        ? {
              border: "1px solid var(--g-color-line-danger)",
              borderRadius: 8,
              padding: 2,
          }
        : undefined;

function toPositiveNumber(value: string): number {
    const normalized = String(value || "").replace(",", ".").trim();
    if (!normalized) return NaN;
    return Number(normalized);
}

type CreatePackageModalProps = {
    visible: boolean;
    onClose: () => void;
    onCreated?: () => void | Promise<void>;
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
    const [confirmDelete, setConfirmDelete] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [touched, setTouched] = useState({
        studentId: false,
        subject: false,
        lessonsCount: false,
        totalAmount: false,
    });

    const markTouched = (
        field: "studentId" | "subject" | "lessonsCount" | "totalAmount"
    ) => {
        setTouched((prev) => (prev[field] ? prev : { ...prev, [field]: true }));
    };

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
        setConfirmDelete(false);
        setTouched({
            studentId: false,
            subject: false,
            lessonsCount: false,
            totalAmount: false,
        });

        if (packageData) {
            setStudentId(packageData.studentId ? [packageData.studentId] : []);
            setSubject(packageData.subject || "");
            setLessonsCount(String(packageData.lessonsTotal || 8));
            setTotalAmount(String(packageData.totalPrice || ""));
            setValidUntil(packageData.validUntilValue || "");
            setComment(packageData.comment || "");
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
        const lessonsTotal = toPositiveNumber(lessonsCount);
        const totalPrice = toPositiveNumber(totalAmount);

        setTouched({
            studentId: true,
            subject: true,
            lessonsCount: true,
            totalAmount: true,
        });

        if (
            !studentId.length ||
            !subject.trim() ||
            !Number.isFinite(lessonsTotal) ||
            lessonsTotal <= 0 ||
            !Number.isFinite(totalPrice) ||
            totalPrice <= 0
        ) {
            setError("Заполните обязательные поля корректно.");
            return;
        }
        setSubmitting(true);
        setError(null);
        try {
            const normalizedComment = comment.trim();
            const payload = {
                studentId: studentId[0],
                subject: subject.trim(),
                lessonsTotal,
                totalPrice,
                validUntil: validUntil || undefined,
                comment: normalizedComment || null,
            };

            if (packageData) {
                await updatePackage(packageData.id, payload);
            } else {
                await createPackage(payload);
            }

            await onCreated?.();
            onClose();
        } catch (err) {
            console.error("Failed to save package:", err);
            setError("Не удалось сохранить пакет. Проверьте поля и попробуйте снова.");
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async () => {
        if (!packageData || submitting) return;

        setSubmitting(true);
        setError(null);
        try {
            await deletePackage(packageData.id);
            await onCreated?.();
            onClose();
        } catch (err) {
            console.error("Failed to delete package:", err);
            setError("Не удалось удалить пакет. Попробуйте снова.");
        } finally {
            setSubmitting(false);
        }
    };

    const requestDelete = () => {
        if (!packageData || submitting) return;
        setError(null);
        setConfirmDelete(true);
    };

    const studentError = touched.studentId && !studentId.length;
    const subjectError = touched.subject && !subject.trim();
    const lessonsCountError =
        touched.lessonsCount && (!Number.isFinite(toPositiveNumber(lessonsCount)) || toPositiveNumber(lessonsCount) <= 0);
    const totalAmountError =
        touched.totalAmount && (!Number.isFinite(toPositiveNumber(totalAmount)) || toPositiveNumber(totalAmount) <= 0);

    const isEditing = !!packageData;

    return (
        <GDialog open={visible} onClose={onClose} size="m">
            <GDialog.Header caption={isEditing ? "Редактировать пакет" : "Новый пакет"} />
            <GDialog.Body>
                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                    <div>
                        <Text variant="body-1" color="secondary" style={{ display: "block", marginBottom: 4 }}>Ученик *</Text>
                        <div style={errorWrapStyle(studentError)} onClick={() => markTouched("studentId")}> 
                            <Select
                                size="l"
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
                    <div>
                        <Text variant="body-1" color="secondary" style={{ display: "block", marginBottom: 4 }}>Предмет *</Text>
                        <div style={errorWrapStyle(subjectError)}>
                            <TextInput
                                size="l"
                                placeholder="Математика"
                                value={subject}
                                onUpdate={setSubject}
                                onBlur={() => markTouched("subject")}
                            />
                        </div>
                        {subjectError && (
                            <Text as="div" variant="caption-2" style={{ marginTop: 4, color: "var(--g-color-text-danger)" }}>
                                Обязательное поле
                            </Text>
                        )}
                    </div>
                    <div style={{ display: "flex", gap: 12 }}>
                        <div style={{ flex: 1 }}>
                            <Text variant="body-1" color="secondary" style={{ display: "block", marginBottom: 4 }}>Кол-во занятий *</Text>
                            <div style={errorWrapStyle(lessonsCountError)}>
                                <TextInput
                                    size="l"
                                    type="number"
                                    placeholder="8"
                                    value={lessonsCount}
                                    onUpdate={setLessonsCount}
                                    onBlur={() => markTouched("lessonsCount")}
                                />
                            </div>
                            {lessonsCountError && (
                                <Text as="div" variant="caption-2" style={{ marginTop: 4, color: "var(--g-color-text-danger)" }}>
                                    Введите число больше 0
                                </Text>
                            )}
                        </div>
                        <div style={{ flex: 1 }}>
                            <Text variant="body-1" color="secondary" style={{ display: "block", marginBottom: 4 }}>Сумма пакета (₽) *</Text>
                            <div style={errorWrapStyle(totalAmountError)}>
                                <TextInput
                                    size="l"
                                    type="number"
                                    placeholder="16800"
                                    value={totalAmount}
                                    onUpdate={setTotalAmount}
                                    onBlur={() => markTouched("totalAmount")}
                                />
                            </div>
                            {totalAmountError && (
                                <Text as="div" variant="caption-2" style={{ marginTop: 4, color: "var(--g-color-text-danger)" }}>
                                    Введите число больше 0
                                </Text>
                            )}
                        </div>
                    </div>
                    <div>
                        <Text variant="body-1" color="secondary" style={{ display: "block", marginBottom: 4 }}>Действует до</Text>
                        <StyledDateInput
                            value={validUntil}
                            onUpdate={setValidUntil}
                            style={{ height: 36, padding: "0 12px" }}
                        />
                    </div>
                    <div>
                        <Text variant="body-1" color="secondary" style={{ display: "block", marginBottom: 4 }}>Комментарий</Text>
                        <TextArea
                            size="l"
                            placeholder="Примечание к пакету…"
                            value={comment}
                            onUpdate={setComment}
                            rows={2}
                        />
                    </div>
                    {isEditing && (
                        <div style={{ display: "flex", justifyContent: "flex-start" }}>
                            <Button
                                view="outlined-danger"
                                size="m"
                                onClick={requestDelete}
                                disabled={submitting}
                            >
                                Удалить пакет
                            </Button>
                        </div>
                    )}
                    {isEditing && confirmDelete && (
                        <div
                            style={{
                                padding: "12px 14px",
                                borderRadius: 8,
                                background: "var(--g-color-base-danger-light)",
                                display: "flex",
                                flexDirection: "column",
                                gap: 8,
                            }}
                        >
                            <Text variant="body-1" color="danger">
                                Удалить пакет без возможности восстановления?
                            </Text>
                            <div style={{ display: "flex", gap: 8 }}>
                                <Button
                                    view="outlined-danger"
                                    size="m"
                                    onClick={handleDelete}
                                    disabled={submitting}
                                    loading={submitting}
                                >
                                    Да, удалить
                                </Button>
                                <Button
                                    view="outlined"
                                    size="m"
                                    onClick={() => setConfirmDelete(false)}
                                    disabled={submitting}
                                >
                                    Отмена
                                </Button>
                            </div>
                        </div>
                    )}
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
