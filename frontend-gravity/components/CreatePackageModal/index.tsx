import { useState, useEffect, useCallback, useRef } from "react";
import { createPortal } from "react-dom";
import { Alert, TextInput, Select, Button, Text, TextArea, Icon, Switch } from "@gravity-ui/uikit";
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
import StudentNameWithBadge from "@/components/StudentNameWithBadge";
import StudentAvatar from "@/components/StudentAvatar";

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
        data: {
            ...s,
            accountId: s.accountId ?? null,
        },
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
            <div className="app-select-option-entity">
                <StudentAvatar
                    student={{ name: optionLabel, avatarUrl: option?.data?.avatarUrl }}
                    size="s"
                />
                <div className="app-select-option-entity__meta">
                    <span className="app-select-option-entity__title">
                        <StudentNameWithBadge
                            name={optionLabel}
                            hasRepetoAccount={Boolean(option?.data?.accountId)}
                        />
                    </span>
                </div>
            </div>
        );
    };

    if (!mounted || (!shouldRender && !visible)) return null;

    const panelContent = (
        <div
            ref={panelRef}
            className={`lp2 lp2--mobile-inline-title ${isPanelVisible ? "lp2--open" : ""}`}
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
                        <Button view="flat" size="s" onClick={handleDelete} disabled={submitting} title="Удалить пакет">
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

                    <Lp2Field label="Публичный пакет">
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
                            <Text as="div" variant="body-2" color="secondary">
                                Показывать пакет на публичной странице преподавателя
                            </Text>
                            <Switch
                                checked={isPublicPackage}
                                onUpdate={setIsPublicPackage}
                                size="l"
                                disabled={submitting}
                            />
                        </div>
                    </Lp2Field>

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
                                popupClassName="app-select-popup"
                                renderSelectedOption={(option: any) => {
                                    const optionLabel =
                                        typeof option?.content === "string" && option.content.trim().length
                                            ? option.content
                                            : "Ученик";

                                    return (
                                        <span className="app-select-selected-entity">
                                            <StudentAvatar
                                                student={{
                                                    name: optionLabel,
                                                    avatarUrl: option?.data?.avatarUrl,
                                                }}
                                                size="xs"
                                            />
                                            <span className="app-select-selected-entity__text">
                                                <StudentNameWithBadge
                                                    name={optionLabel}
                                                    hasRepetoAccount={Boolean(option?.data?.accountId)}
                                                />
                                            </span>
                                        </span>
                                    );
                                }}
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
                            popupClassName="lp2-popup"
                            popupZIndex={1300}
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
                    {error && (
                        <Alert
                            theme="danger"
                            view="filled"
                            corners="rounded"
                            title="Ошибка пѬи сохранении пакета"
                            message={error}
                        />
                    )}
                </div>
            </div>

            <div className="lp2__bottombar">
                {isEditing ? (
                    <div className="lp2__actions lp2__actions--split">
                        <Button
                            className="lp2__action lp2__action--secondary"
                            view="outlined"
                            size="xl"
                            width="max"
                            onClick={handleDelete}
                            loading={submitting}
                            disabled={submitting}
                        >
                            Удалить пакет
                        </Button>
                        <Button
                            className="lp2__submit lp2__action"
                            view="action"
                            size="xl"
                            width="max"
                            onClick={handleSubmit}
                            loading={submitting}
                        >
                            Сохранить изменения
                        </Button>
                    </div>
                ) : (
                    <div className="lp2__actions">
                        <Button
                            className="lp2__submit lp2__action"
                            view="action"
                            size="xl"
                            width="max"
                            onClick={handleSubmit}
                            loading={submitting}
                        >
                            Сохранить
                        </Button>
                    </div>
                )}
            </div>
        </div>
    );

    return createPortal(panelContent, document.body);
};

export default CreatePackageModal;
