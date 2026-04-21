import { useCallback, useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { Alert, Button, Icon, Select, Text, TextArea } from "@gravity-ui/uikit";
import { ArrowLeft, File, Folder, Plus, TrashBin } from "@gravity-ui/icons";
import type { IconData } from "@gravity-ui/uikit";
import StyledDateInput from "@/components/StyledDateInput";
import AppField from "@/components/AppField";
import MaterialsPickerDialog from "@/components/MaterialsPickerDialog";
import type { HomeworkFile } from "@/mocks/student-details";
import type { CloudProvider } from "@/types/files";
import type { Lesson } from "@/types/schedule";

type HomeworkStudentUpload = {
    id: string;
    name: string;
    url: string;
    size?: string;
    uploadedAt?: string;
    expiresAt?: string;
};

type Homework = {
    id: string;
    date: string;
    task: string;
    dueDate: string;
    status: "not_done" | "done" | "overdue";
    lessonId?: string;
    linkedFiles?: HomeworkFile[];
    studentUploads?: HomeworkStudentUpload[];
};

type HomeworkModalProps = {
    visible: boolean;
    onClose: () => void;
    homework?: Homework | null;
    availableFiles?: HomeworkFile[];
    availableLessons?: Lesson[];
    connectedProviders?: CloudProvider[];
    defaultProvider?: CloudProvider;
    onSave: (data: {
        task: string;
        dueDate: string;
        lessonId?: string;
        linkedFiles: HomeworkFile[];
    }) => Promise<void> | void;
    onDelete?: () => Promise<void> | void;
};

const normalizeDueDate = (value: string) => {
    if (!value || value === "—") {
        return "";
    }

    if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
        return value;
    }

    const parts = value.split(".");
    if (parts.length === 3) {
        const [day, month, year] = parts;
        return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
    }

    return value;
};

const normalizeFiles = (files: unknown): HomeworkFile[] => {
    if (!Array.isArray(files)) {
        return [];
    }

    return files
        .map((item: any) => {
            const id = typeof item?.id === "string" ? item.id : "";
            const name = typeof item?.name === "string" ? item.name : "";
            if (!id || !name) {
                return null;
            }

            const provider = item.provider || item.cloudProvider;
            return {
                id,
                name,
                url: item.url || item.cloudUrl || "#",
                provider,
                type: item.type,
                extension: item.extension,
                size: item.size,
                parentId: item.parentId,
                childrenCount: item.childrenCount,
            } as HomeworkFile;
        })
        .filter((item): item is HomeworkFile => !!item);
};

const lessonSortValue = (lesson: Lesson) =>
    String((lesson as any)?.scheduledAt || lesson.date || "");

const extractErrorMessage = (error: unknown, fallback: string) => {
    if (error instanceof Error && error.message.trim()) {
        return error.message;
    }

    return fallback;
};

const HomeworkModal = ({
    visible,
    onClose,
    homework,
    availableFiles = [],
    availableLessons = [],
    connectedProviders = [],
    defaultProvider,
    onSave,
    onDelete,
}: HomeworkModalProps) => {
    const [mounted, setMounted] = useState(false);
    const [shouldRender, setShouldRender] = useState(false);
    const [isPanelVisible, setIsPanelVisible] = useState(false);

    const [task, setTask] = useState("");
    const [dueDate, setDueDate] = useState("");
    const [selectedLessonId, setSelectedLessonId] = useState<string[]>([]);
    const [files, setFiles] = useState<HomeworkFile[]>([]);

    const [formError, setFormError] = useState<string | null>(null);
    const [taskTouched, setTaskTouched] = useState(false);
    const [confirmDelete, setConfirmDelete] = useState(false);
    const [saving, setSaving] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [pickerOpen, setPickerOpen] = useState(false);

    const isEdit = Boolean(homework);

    useEffect(() => {
        setMounted(true);
    }, []);

    useEffect(() => {
        if (visible) {
            setShouldRender(true);
            const raf = requestAnimationFrame(() => {
                requestAnimationFrame(() => setIsPanelVisible(true));
            });
            return () => cancelAnimationFrame(raf);
        }

        setIsPanelVisible(false);
        return undefined;
    }, [visible]);

    const handleTransitionEnd = useCallback(() => {
        if (!isPanelVisible) {
            setShouldRender(false);
        }
    }, [isPanelVisible]);

    useEffect(() => {
        if (!visible) {
            return;
        }

        if (homework) {
            setTask(homework.task || "");
            setDueDate(normalizeDueDate(homework.dueDate || ""));
            setSelectedLessonId(homework.lessonId ? [homework.lessonId] : []);
            setFiles(normalizeFiles(homework.linkedFiles));
        } else {
            setTask("");
            setDueDate("");
            setSelectedLessonId([]);
            setFiles([]);
        }

        setFormError(null);
        setTaskTouched(false);
        setConfirmDelete(false);
        setSaving(false);
        setDeleting(false);
        setPickerOpen(false);
    }, [visible, homework]);

    useEffect(() => {
        if (!visible) {
            return;
        }

        const onKeyDown = (event: KeyboardEvent) => {
            if (event.key === "Escape") {
                onClose();
            }
        };

        document.addEventListener("keydown", onKeyDown);
        return () => document.removeEventListener("keydown", onKeyDown);
    }, [visible, onClose]);

    const lessonOptions = useMemo(() => {
        return [...availableLessons]
            .filter(
                (lesson) => lesson.status === "planned" || lesson.status === "completed"
            )
            .sort((a, b) => (lessonSortValue(a) > lessonSortValue(b) ? -1 : 1))
            .map((lesson) => ({
                value: lesson.id,
                content: `${lesson.subject} · ${lesson.date} · ${lesson.startTime}`,
            }));
    }, [availableLessons]);

    const normalizedAvailableFiles = useMemo(
        () => normalizeFiles(availableFiles),
        [availableFiles]
    );

    const materialsHint = useMemo(() => {
        const hasYandex = connectedProviders.includes("yandex-disk");
        const hasGoogle = connectedProviders.includes("google-drive");

        if (hasYandex && hasGoogle) {
            return "Яндекс Диск и Google Drive";
        }

        if (hasYandex) {
            return "Яндекс Диск";
        }

        if (hasGoogle) {
            return "Google Drive";
        }

        return "Подключите облачное хранилище";
    }, [connectedProviders]);

    const handleSubmit = useCallback(async () => {
        if (!task.trim()) {
            setTaskTouched(true);
            setFormError("Добавьте описание задания.");
            return;
        }

        setTaskTouched(false);
        setFormError(null);
        setSaving(true);

        try {
            await onSave({
                task: task.trim(),
                dueDate,
                lessonId: selectedLessonId[0],
                linkedFiles: files,
            });
            onClose();
        } catch (error) {
            setFormError(extractErrorMessage(error, "Не удалось сохранить домашнее задание."));
        } finally {
            setSaving(false);
        }
    }, [dueDate, files, onClose, onSave, selectedLessonId, task]);

    const handleDelete = useCallback(async () => {
        if (!onDelete) {
            return;
        }

        if (!confirmDelete) {
            setConfirmDelete(true);
            return;
        }

        setFormError(null);
        setDeleting(true);

        try {
            await onDelete();
            onClose();
        } catch (error) {
            setFormError(extractErrorMessage(error, "Не удалось удалить домашнее задание."));
        } finally {
            setDeleting(false);
        }
    }, [confirmDelete, onClose, onDelete]);

    if (!mounted || (!shouldRender && !visible) || typeof document === "undefined") {
        return null;
    }

    const title = isEdit ? "Редактировать домашнее задание" : "Добавить домашнее задание";

    return createPortal(
        <>
            <div
                className={`lp2-overlay${isPanelVisible ? " lp2-overlay--open" : ""}`}
                onClick={onClose}
                aria-hidden="true"
            />
            <div
                className={`lp2 lp2--homework${isPanelVisible ? " lp2--open" : ""}`}
                onTransitionEnd={handleTransitionEnd}
                role="dialog"
                aria-modal="true"
                aria-label={title}
            >
                <div className="lp2__topbar">
                    <button type="button" className="lp2__back" onClick={onClose} aria-label="Закрыть">
                        <Icon data={ArrowLeft as IconData} size={18} />
                    </button>
                    <Text variant="subheader-2">{title}</Text>
                    <div className="lp2__topbar-actions">
                        {isEdit && onDelete ? (
                            <Button
                                view="flat-danger"
                                size="s"
                                onClick={() => void handleDelete()}
                                loading={deleting}
                                disabled={saving}
                            >
                                {confirmDelete ? "Подтвердить" : "Удалить"}
                            </Button>
                        ) : (
                            <span style={{ width: 80, height: 1 }} aria-hidden="true" />
                        )}
                    </div>
                </div>

                <div className="lp2__scroll">
                    <div className="lp2__center lp2__center--homework">
                        {formError && <Alert theme="danger" message={formError} />}

                        <AppField
                            label="Описание задания"
                            error={taskTouched && !task.trim() ? "Обязательное поле" : undefined}
                        >
                            <TextArea
                                value={task}
                                onUpdate={setTask}
                                onBlur={() => setTaskTouched(true)}
                                placeholder="Выучить параграф 5, решить задачи №12-18..."
                                rows={4}
                                size="xl"
                            />
                        </AppField>

                        <AppField label="Срок сдачи">
                            <StyledDateInput
                                value={dueDate}
                                onUpdate={setDueDate}
                                popupClassName="repeto-dialog-date-popup"
                                popupZIndex={1705}
                                style={{
                                    height: 40,
                                    padding: 0,
                                    fontSize: 15,
                                    border: "none",
                                    borderRadius: 0,
                                    background: "transparent",
                                }}
                            />
                        </AppField>

                        {lessonOptions.length > 0 && (
                            <AppField label="Привязать к занятию">
                                <Select
                                    value={selectedLessonId}
                                    onUpdate={(value) => setSelectedLessonId(value as string[])}
                                    options={lessonOptions}
                                    hasClear
                                    placeholder="Без привязки"
                                    width="max"
                                />
                            </AppField>
                        )}

                        {files.length > 0 && (
                            <div className="lp2-materials">
                                <Text variant="caption-2" color="secondary" style={{ marginBottom: 8 }}>
                                    Прикрепленные материалы
                                </Text>
                                {files.map((file) => (
                                    <div key={file.id} className="lp2-material-row">
                                        <Icon
                                            data={((file.type || "file") === "folder" ? Folder : File) as IconData}
                                            size={16}
                                        />
                                        <Text variant="body-1" style={{ flex: 1, minWidth: 0 }} ellipsis>
                                            {file.name}
                                        </Text>
                                        <Button
                                            view="flat"
                                            size="s"
                                            onClick={() =>
                                                setFiles((prev) => prev.filter((item) => item.id !== file.id))
                                            }
                                            disabled={saving || deleting}
                                        >
                                            <Icon data={TrashBin as IconData} size={14} />
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        )}

                        {connectedProviders.length > 0 ? (
                            <button
                                type="button"
                                className="hw-material-upload-btn"
                                onClick={() => setPickerOpen(true)}
                                disabled={saving || deleting}
                            >
                                <span className="hw-material-upload-btn__icon">
                                    <Icon data={Plus as IconData} size={20} />
                                </span>
                                <span className="hw-material-upload-btn__content">
                                    <span className="hw-material-upload-btn__title">Добавить материал</span>
                                    <span className="hw-material-upload-btn__hint">{materialsHint}</span>
                                </span>
                            </button>
                        ) : (
                            <Text variant="caption-2" color="secondary" style={{ marginTop: 4 }}>
                                Подключите облако в разделе Файлы, чтобы прикреплять материалы.
                            </Text>
                        )}
                    </div>
                </div>

                <div className="lp2__bottombar">
                    <div className="lp2__actions lp2__actions--split">
                        <Button view="outlined" size="xl" onClick={onClose} disabled={saving || deleting}>
                            Отмена
                        </Button>
                        <Button
                            view="action"
                            size="xl"
                            onClick={() => void handleSubmit()}
                            loading={saving}
                            disabled={!task.trim() || deleting}
                        >
                            {isEdit ? "Сохранить изменения" : "Сохранить"}
                        </Button>
                    </div>
                </div>
            </div>

            <MaterialsPickerDialog
                open={pickerOpen}
                onClose={() => setPickerOpen(false)}
                selectedFiles={files}
                availableFiles={normalizedAvailableFiles}
                connectedProviders={connectedProviders}
                defaultProvider={defaultProvider}
                onApply={setFiles}
            />
        </>,
        document.body
    );
};

export default HomeworkModal;
