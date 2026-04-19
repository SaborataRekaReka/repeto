import { useState, useEffect, useCallback, useRef } from "react";
import { createPortal } from "react-dom";
import { Alert, TextInput, Select, Button, Text, TextArea, Icon, Checkbox } from "@gravity-ui/uikit";
import { TrashBin, ArrowLeft } from "@gravity-ui/icons";
import type { IconData } from "@gravity-ui/uikit";
import { useStudents } from "@/hooks/useStudents";
import {
    createPackage,
    updatePackage,
    deletePackage,
} from "@/hooks/usePackages";
import StyledDateInput from "@/components/StyledDateInput";
import { Lp2Field, Lp2Row } from "@/components/Lp2Field";
import type { LessonPackage } from "@/types/package";

function toPositiveNumber(value: string): number {
    const normalized = String(value || "").replace(",", ".").trim();
    if (!normalized) return NaN;
    return Number(normalized);
}

function toNonNegativeNumber(value: string): number {
    const normalized = String(value || "").replace(",", ".").trim();
    if (!normalized) return NaN;
    return Number(normalized);
}

type CreatePackageModalProps = {
    visible: boolean;
    onClose: () => void;
    onCreated?: () => void | Promise<void>;
    packageData?: LessonPackage | null;
    defaultPublic?: boolean;
};

const STUDENT_BADGE_COLORS = ["#7a98ff", "#9f7aea", "#e29a6a", "#6fb38b", "#5ca8a8"];

function getStudentBadgeColor(name: string) {
    let hash = 0;
    for (let i = 0; i < name.length; i += 1) {
        hash = (hash * 31 + name.charCodeAt(i)) >>> 0;
    }
    return STUDENT_BADGE_COLORS[hash % STUDENT_BADGE_COLORS.length];
}

const PANEL_Z = 950;

const CreatePackageModal = ({
    visible,
    onClose,
    onCreated,
    packageData,
    defaultPublic = false,
}: CreatePackageModalProps) => {
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

    const { data: studentsData } = useStudents({ limit: 200 }, { skip: !visible });
    const studentOptions = (studentsData?.data || []).map((s) => ({
        value: s.id,
        content: s.name,
        data: { ...s, color: getStudentBadgeColor(s.name) },
    }));

    const [studentId, setStudentId] = useState<string[]>([]);
    const [subject, setSubject] = useState("");
    const [lessonsCount, setLessonsCount] = useState("8");
    const [pricePerLesson, setPricePerLesson] = useState("");
    const [discount, setDiscount] = useState("0");
    const [totalAmount, setTotalAmount] = useState("");
    const [validUntil, setValidUntil] = useState("");
    const [comment, setComment] = useState("");
    const [isPublicPackage, setIsPublicPackage] = useState(false);
    const [manualTotal, setManualTotal] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [confirmDelete, setConfirmDelete] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [touched, setTouched] = useState({
        studentId: false,
        subject: false,
        lessonsCount: false,
        pricePerLesson: false,
        totalAmount: false,
    });

    const markTouched = (
        field: "studentId" | "subject" | "lessonsCount" | "pricePerLesson" | "totalAmount"
    ) => {
        setTouched((prev) => (prev[field] ? prev : { ...prev, [field]: true }));
    };

    useEffect(() => {
        if (isPublicPackage) return;
        if (studentId.length && !packageData) {
            const matched = studentOptions.find((s) => s.value === studentId[0]);
            if (matched?.data?.subject) setSubject(matched.data.subject);
            if (matched?.data?.rate && !touched.pricePerLesson) {
                setPricePerLesson(String(matched.data.rate));
            }
        }
    }, [studentId, studentOptions, packageData, touched.pricePerLesson, isPublicPackage]);

    useEffect(() => {
        if (isPublicPackage && studentId.length) {
            setStudentId([]);
        }
    }, [isPublicPackage, studentId.length]);

    useEffect(() => {
        if (manualTotal) return;

        const lessonsTotal = toPositiveNumber(lessonsCount);
        const lessonPrice = toPositiveNumber(pricePerLesson);
        const discountValue = toNonNegativeNumber(discount);

        if (
            !Number.isFinite(lessonsTotal) ||
            lessonsTotal <= 0 ||
            !Number.isFinite(lessonPrice) ||
            lessonPrice <= 0
        ) {
            setTotalAmount("");
            return;
        }

        const safeDiscount =
            Number.isFinite(discountValue) && discountValue >= 0 ? discountValue : 0;
        const calculatedTotal = Math.max(
            0,
            Math.round(lessonsTotal * lessonPrice - safeDiscount)
        );

        setTotalAmount(String(calculatedTotal));
    }, [lessonsCount, pricePerLesson, discount, manualTotal]);

    useEffect(() => {
        if (!visible) return;
        setError(null);
        setSubmitting(false);
        setConfirmDelete(false);
        setTouched({
            studentId: false,
            subject: false,
            lessonsCount: false,
            pricePerLesson: false,
            totalAmount: false,
        });

        if (packageData) {
            const derivedLessonPrice =
                packageData.lessonsTotal > 0
                    ? Math.round(packageData.totalPrice / packageData.lessonsTotal)
                    : 0;

            setStudentId(packageData.studentId ? [packageData.studentId] : []);
            setSubject(packageData.subject || "");
            setLessonsCount(String(packageData.lessonsTotal || 8));
            setPricePerLesson(derivedLessonPrice > 0 ? String(derivedLessonPrice) : "");
            setDiscount("0");
            setTotalAmount(String(packageData.totalPrice || ""));
            setValidUntil(packageData.validUntilValue || "");
            setComment(packageData.comment || "");
            setIsPublicPackage(!!packageData.isPublic);
            setManualTotal(true);
            return;
        }

        setStudentId([]);
        setSubject("");
        setLessonsCount("8");
        setPricePerLesson("");
        setDiscount("0");
        setTotalAmount("");
        setValidUntil("");
        setComment("");
        setIsPublicPackage(!!defaultPublic);
        setManualTotal(false);
    }, [visible, packageData, defaultPublic]);

    const handleSubmit = async () => {
        const lessonsTotal = toPositiveNumber(lessonsCount);
        const lessonPrice = toPositiveNumber(pricePerLesson);
        const totalPrice = toPositiveNumber(totalAmount);

        setTouched({
            studentId: !isPublicPackage,
            subject: true,
            lessonsCount: true,
            pricePerLesson: true,
            totalAmount: true,
        });

        if (
            (!isPublicPackage && !studentId.length) ||
            !subject.trim() ||
            !Number.isFinite(lessonsTotal) ||
            lessonsTotal <= 0 ||
            !Number.isFinite(lessonPrice) ||
            lessonPrice <= 0 ||
            !Number.isFinite(totalPrice) ||
            totalPrice <= 0
        ) {
            setError("Заполните обязательные поля корректно.");
            return;
        }
        setSubmitting(true);
        setError(null);
        try {
            const payload = {
                studentId: isPublicPackage ? undefined : studentId[0],
                isPublic: isPublicPackage,
                subject: subject.trim(),
                lessonsTotal,
                totalPrice,
                // Discount is reflected in totalPrice to preserve backward-compatible API payload.
                validUntil: validUntil || undefined,
                comment: comment.trim() || null,
            };

            if (packageData) {
                await updatePackage(packageData.id, payload);
            } else {
                await createPackage(payload);
            }

            await onCreated?.();
            handleClose();
        } catch (err) {
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
            handleClose();
        } catch (err) {
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

    const studentError = !isPublicPackage && touched.studentId && !studentId.length;
    const subjectError = touched.subject && !subject.trim();
    const lessonsCountError =
        touched.lessonsCount && (!Number.isFinite(toPositiveNumber(lessonsCount)) || toPositiveNumber(lessonsCount) <= 0);
    const pricePerLessonError =
        touched.pricePerLesson && (!Number.isFinite(toPositiveNumber(pricePerLesson)) || toPositiveNumber(pricePerLesson) <= 0);
    const totalAmountError =
        touched.totalAmount && (!Number.isFinite(toPositiveNumber(totalAmount)) || toPositiveNumber(totalAmount) <= 0);
    const lessonsForFormula = Number.isFinite(toPositiveNumber(lessonsCount)) ? toPositiveNumber(lessonsCount) : 0;
    const lessonPriceForFormula = Number.isFinite(toPositiveNumber(pricePerLesson)) ? toPositiveNumber(pricePerLesson) : 0;
    const discountForFormula = Number.isFinite(toNonNegativeNumber(discount)) ? toNonNegativeNumber(discount) : 0;
    const autoCalculatedTotal = Math.max(
        0,
        Math.round(lessonsForFormula * lessonPriceForFormula - discountForFormula)
    );

    const isEditing = !!packageData;

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
            aria-label={
                isEditing
                    ? "Редактировать пакет"
                    : isPublicPackage
                    ? "Новый публичный пакет"
                    : "Новый пакет"
            }
        >
            <div className="lp2__topbar">
                <button type="button" className="lp2__back" onClick={handleClose} aria-label="Назад">
                    <Icon data={ArrowLeft as IconData} size={18} />
                </button>
                <div className="lp2__topbar-actions">
                    {isEditing && (
                        <Button view="flat" size="s" onClick={requestDelete} disabled={submitting} title="Удалить пакет">
                            <Icon data={TrashBin as IconData} size={16} />
                        </Button>
                    )}
                </div>
            </div>

            <div className="lp2__scroll">
                <div className="lp2__center">
                    <h1 className="lp2__page-title">
                        {isEditing
                            ? "Редактирование пакета"
                            : isPublicPackage
                            ? "Новый публичный пакет"
                            : "Новый пакет"}
                    </h1>

                    {!isPublicPackage ? (
                        <Lp2Field label="Ученик *" error={studentError} errorText="Обязательное поле">
                            <Select
                                size="l"
                                width="max"
                                placeholder="Выберите ученика"
                                options={studentOptions}
                                renderOption={renderStudentOption}
                                value={studentId}
                                onUpdate={(value) => {
                                    setStudentId(value);
                                    markTouched("studentId");
                                }}
                                filterable
                                popupWidth="fit"
                                popupPlacement={["bottom-start", "top-start"]}
                                popupClassName="lp2-popup"
                            />
                        </Lp2Field>
                    ) : (
                        <Text as="div" variant="caption-2" color="secondary">
                        </Text>
                    )}

                    <Lp2Field label="Предмет *" error={subjectError} errorText="Обязательное поле">
                        <TextInput
                            size="l"
                            placeholder="Математика"
                            value={subject}
                            onUpdate={setSubject}
                            onBlur={() => markTouched("subject")}
                        />
                    </Lp2Field>

                    <Lp2Row>
                        <Lp2Field label="Кол-во занятий *" half error={lessonsCountError} errorText="Введите число больше 0">
                            <TextInput
                                size="l"
                                type="number"
                                placeholder="8"
                                value={lessonsCount}
                                onUpdate={setLessonsCount}
                                onBlur={() => markTouched("lessonsCount")}
                            />
                        </Lp2Field>
                        <Lp2Field label="Цена занятия (₽) *" half error={pricePerLessonError} errorText="Введите число больше 0">
                            <TextInput
                                size="l"
                                type="number"
                                placeholder="2100"
                                value={pricePerLesson}
                                onUpdate={(value) => {
                                    setPricePerLesson(value);
                                    if (!touched.pricePerLesson) {
                                        markTouched("pricePerLesson");
                                    }
                                }}
                                onBlur={() => markTouched("pricePerLesson")}
                            />
                        </Lp2Field>
                    </Lp2Row>

                    <Lp2Row>
                        <Lp2Field label="Скидка (₽)" half>
                            <TextInput
                                size="l"
                                type="number"
                                placeholder="0"
                                value={discount}
                                onUpdate={setDiscount}
                            />
                        </Lp2Field>
                        <Lp2Field label="Сумма пакета (₽) *" half error={totalAmountError} errorText="Введите число больше 0">
                            <TextInput
                                size="l"
                                type="number"
                                placeholder="16800"
                                value={totalAmount}
                                onUpdate={(value) => {
                                    if (!manualTotal) {
                                        setManualTotal(true);
                                    }
                                    setTotalAmount(value);
                                }}
                                onBlur={() => markTouched("totalAmount")}
                            />
                        </Lp2Field>
                    </Lp2Row>

                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
                        <Text as="div" variant="caption-2" color="secondary" style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                            {`Авторасчет: ${lessonsForFormula} x ${lessonPriceForFormula} - ${discountForFormula} = ${autoCalculatedTotal} ₽`}
                        </Text>
                        {manualTotal && (
                            <Button
                                view="flat"
                                size="s"
                                onClick={() => setManualTotal(false)}
                                disabled={submitting}
                            >
                                Вернуть авторасчет
                            </Button>
                        )}
                    </div>

                    <Lp2Field label="Действует до">
                        <StyledDateInput
                            value={validUntil}
                            onUpdate={setValidUntil}
                            style={{ height: 36, padding: 0 }}
                        />
                    </Lp2Field>

                    <Lp2Field label="Комментарий">
                        <TextArea
                            size="l"
                            placeholder="Примечание к пакету…"
                            value={comment}
                            onUpdate={setComment}
                            rows={2}
                        />
                    </Lp2Field>

                    <Lp2Field label="Видимость">
                        <Checkbox
                            checked={isPublicPackage}
                            onUpdate={setIsPublicPackage}
                            disabled={submitting}
                        >
                            Показывать пакет на публичной странице преподавателя
                        </Checkbox>
                    </Lp2Field>

                    {isEditing && confirmDelete && (
                        <Alert
                            theme="danger"
                            view="filled"
                            corners="rounded"
                            title="Подтвердите удаление пакета"
                            message={
                                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                                    <div>Пакет будет удален без возможности восстановления.</div>
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
                            }
                        />
                    )}
                    {error && (
                        <Alert
                            theme="danger"
                            view="filled"
                            corners="rounded"
                            title="Ошибка при сохранении пакета"
                            message={error}
                        />
                    )}
                </div>
            </div>

            <div className="lp2__bottombar">
                <Button
                    className="lp2__submit"
                    view="action"
                    size="xl"
                    width="max"
                    onClick={handleSubmit}
                    loading={submitting}
                >
                    {isEditing ? "Сохранить изменения" : "Сохранить"}
                </Button>
            </div>
        </div>
    );

    return createPortal(panelContent, document.body);
};

export default CreatePackageModal;
