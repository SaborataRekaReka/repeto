import { useEffect, useMemo, useState } from "react";
import { Text, TextInput } from "@gravity-ui/uikit";
import AppDialog from "@/components/AppDialog";
import { updateAccount } from "@/hooks/useSettings";
import { codedErrorMessage } from "@/lib/errorCodes";

type SubjectEntry = {
    name: string;
    price: string;
    duration: string;
};

type AddSubjectModalProps = {
    open: boolean;
    onClose: () => void;
    settingsData: any;
    onSaved?: (subjectName: string) => void | Promise<void>;
};

const DEFAULT_DURATION = "60";

const normalizeSubjectName = (value: unknown) => {
    if (typeof value !== "string") {
        return "";
    }
    return value.trim();
};

const normalizeField = (value: unknown) => {
    if (typeof value !== "string") {
        return "";
    }
    return value.trim();
};

const getSubjectKey = (value: string) => value.toLocaleLowerCase("ru-RU");

const parseDuration = (value: string) => {
    const normalized = value.replace(/\s+/g, "").replace(",", ".");
    const numeric = Number(normalized);
    if (!Number.isFinite(numeric) || numeric <= 0) {
        return null;
    }
    return String(Math.round(numeric));
};

const AddSubjectModal = ({
    open,
    onClose,
    settingsData,
    onSaved,
}: AddSubjectModalProps) => {
    const [name, setName] = useState("");
    const [price, setPrice] = useState("");
    const [duration, setDuration] = useState(DEFAULT_DURATION);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const existingSubjects = useMemo<SubjectEntry[]>(() => {
        const subjectsMap = new Map<string, SubjectEntry>();

        const addEntry = (entry: SubjectEntry) => {
            const normalizedName = normalizeSubjectName(entry.name);
            if (!normalizedName) {
                return;
            }

            const key = getSubjectKey(normalizedName);
            if (!subjectsMap.has(key)) {
                subjectsMap.set(key, {
                    name: normalizedName,
                    price: normalizeField(entry.price),
                    duration: normalizeField(entry.duration) || DEFAULT_DURATION,
                });
            }
        };

        const subjectDetails = Array.isArray(settingsData?.subjectDetails)
            ? settingsData.subjectDetails
            : [];

        subjectDetails.forEach((item: any) => {
            addEntry({
                name: item?.name,
                price: item?.price,
                duration: item?.duration,
            });
        });

        const plainSubjects = Array.isArray(settingsData?.subjects)
            ? settingsData.subjects
            : [];

        plainSubjects.forEach((item: unknown) => {
            const normalizedName = normalizeSubjectName(item);
            if (!normalizedName) {
                return;
            }

            addEntry({
                name: normalizedName,
                price: "",
                duration: DEFAULT_DURATION,
            });
        });

        return Array.from(subjectsMap.values());
    }, [settingsData?.subjectDetails, settingsData?.subjects]);

    useEffect(() => {
        if (!open) {
            return;
        }

        setName("");
        setPrice("");
        setDuration(DEFAULT_DURATION);
        setError(null);
    }, [open]);

    const handleSave = async () => {
        if (saving) {
            return;
        }

        const normalizedName = normalizeSubjectName(name);
        if (!normalizedName) {
            setError("Введите название предмета.");
            return;
        }

        const normalizedDuration = parseDuration(duration);
        if (!normalizedDuration) {
            setError("Укажите корректную длительность в минутах.");
            return;
        }

        const subjectKey = getSubjectKey(normalizedName);
        const existing = existingSubjects.find((item) => getSubjectKey(item.name) === subjectKey);

        if (existing) {
            await onSaved?.(existing.name);
            onClose();
            return;
        }

        setSaving(true);
        setError(null);

        try {
            const nextDetails: SubjectEntry[] = [
                ...existingSubjects,
                {
                    name: normalizedName,
                    price: normalizeField(price),
                    duration: normalizedDuration,
                },
            ];

            await updateAccount({
                subjects: nextDetails.map((item) => item.name),
                subjectDetails: nextDetails,
            });

            await onSaved?.(normalizedName);
            onClose();
        } catch (err) {
            setError(codedErrorMessage("SUBJECT-ADD", err));
        } finally {
            setSaving(false);
        }
    };

    return (
        <AppDialog
            open={open}
            onClose={onClose}
            size="s"
            hasCloseButton
            caption="Добавить предмет"
            footer={{
                textButtonApply: "Сохранить",
                textButtonCancel: "Отмена",
                onClickButtonApply: handleSave,
                onClickButtonCancel: onClose,
                propsButtonApply: { loading: saving },
            }}
        >
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                <div>
                    <Text
                        as="div"
                        variant="body-1"
                        style={{ marginBottom: 4, color: "var(--g-color-text-secondary)" }}
                    >
                        Предмет *
                    </Text>
                    <TextInput
                        value={name}
                        onUpdate={setName}
                        placeholder="Математика"
                        size="l"
                    />
                </div>

                <div style={{ display: "flex", gap: 12 }}>
                    <div style={{ flex: 1 }}>
                        <Text
                            as="div"
                            variant="body-1"
                            style={{ marginBottom: 4, color: "var(--g-color-text-secondary)" }}
                        >
                            Цена за час
                        </Text>
                        <TextInput
                            value={price}
                            onUpdate={setPrice}
                            placeholder="2100"
                            size="l"
                        />
                    </div>

                    <div style={{ flex: 1 }}>
                        <Text
                            as="div"
                            variant="body-1"
                            style={{ marginBottom: 4, color: "var(--g-color-text-secondary)" }}
                        >
                            Длительность (мин)
                        </Text>
                        <TextInput
                            value={duration}
                            onUpdate={setDuration}
                            placeholder={DEFAULT_DURATION}
                            size="l"
                        />
                    </div>
                </div>

                {error && (
                    <Text as="div" variant="body-1" style={{ color: "var(--g-color-text-danger)" }}>
                        {error}
                    </Text>
                )}
            </div>
        </AppDialog>
    );
};

export default AddSubjectModal;