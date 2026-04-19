import { useMemo, useRef, useState } from "react";
import { Text, Button, Icon, Label, TextArea } from "@gravity-ui/uikit";
import { Plus, TrashBin, CirclePlus, File as FileIcon, Folder, ArrowUpRightFromSquare } from "@gravity-ui/icons";
import type { IconData } from "@gravity-ui/uikit";
import StyledDateInput from "@/components/StyledDateInput";
import AppDialog from "@/components/AppDialog";
import MaterialsPickerDialog from "@/components/MaterialsPickerDialog";
import { useApi } from "@/hooks/useApi";
import { createHomework, updateHomework, deleteHomework } from "@/hooks/useStudents";
import type { CloudProvider, FilesOverviewResponse } from "@/types/files";
import type { HomeworkFile } from "@/mocks/student-details";

const GText = Text as any;
const GButton = Button as any;
const GIcon = Icon as any;

type StudentUpload = {
    id: string;
    name: string;
    size?: string;
    uploadedAt?: string;
    url: string;
};

type Homework = {
    id: string;
    date: string;
    task: string;
    dueDate: string;
    status: "not_done" | "done" | "overdue";
    lessonId?: string;
    lesson?: {
        id: string;
        subject: string;
        scheduledAt: string;
    } | null;
    linkedFiles?: any[];
    studentUploads?: StudentUpload[];
};

type HomeworkTabProps = {
    studentId: string;
    homeworks: Homework[];
    onMutate?: () => void;
};

/* ── TochkaField (same as LessonPanelV2) ── */
const TochkaField = ({
    label,
    children,
}: {
    label: string;
    children: React.ReactNode;
}) => {
    const fieldRef = useRef<HTMLDivElement>(null);

    const focusFieldControl = (event: React.MouseEvent<HTMLDivElement>) => {
        if (event.button !== 0) return;
        const target = event.target as HTMLElement | null;
        if (target?.closest("input, textarea, button")) return;
        const root = fieldRef.current;
        if (!root) return;
        const textControl = root.querySelector("input, textarea") as
            | HTMLInputElement
            | HTMLTextAreaElement
            | null;
        if (textControl) {
            event.preventDefault();
            textControl.focus();
        }
    };

    return (
        <div className="lp2-field">
            <div className="lp2-field__inner" ref={fieldRef} onMouseDown={focusFieldControl}>
                <span className="lp2-field__label">{label}</span>
                <div className="lp2-field__control">{children}</div>
            </div>
        </div>
    );
};

const formatDueDate = (d: string) => {
    if (!d || d === "—") return null;
    return d;
};

const HomeworkTab = ({ studentId, homeworks, onMutate }: HomeworkTabProps) => {
    const [formVisible, setFormVisible] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [task, setTask] = useState("");
    const [dueDate, setDueDate] = useState("");
    const [hwLinkedFiles, setHwLinkedFiles] = useState<HomeworkFile[]>([]);
    const [materialsPickerOpen, setMaterialsPickerOpen] = useState(false);
    const [saving, setSaving] = useState(false);
    const [busyId, setBusyId] = useState<string | null>(null);

    /* ── Fetch available files when form is open ── */
    const { data: filesOverview } = useApi<FilesOverviewResponse>(
        formVisible || materialsPickerOpen ? "/files" : null,
    );

    const availableHomeworkFiles = useMemo<HomeworkFile[]>(() => {
        const allFiles = filesOverview?.files || [];
        return allFiles.map((item: any) => ({
            id: item.id,
            name: item.name,
            url: item.cloudUrl,
            provider: item.cloudProvider,
            type: item.type,
            size: item.size,
            extension: item.extension,
            parentId: item.parentId,
            childrenCount: item.childrenCount,
        }));
    }, [filesOverview?.files]);

    const connectedProviders = useMemo<CloudProvider[]>(() => {
        const providers = ((filesOverview as any)?.cloudConnections || [])
            .filter((cloud: any) => cloud.connected)
            .map((cloud: any) => cloud.provider);
        return Array.from(new Set(providers)) as CloudProvider[];
    }, [(filesOverview as any)?.cloudConnections]);

    const defaultMaterialsProvider = useMemo<CloudProvider | undefined>(() => {
        if (connectedProviders.length === 0) return undefined;
        return connectedProviders[0];
    }, [connectedProviders]);

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

    const resetForm = () => {
        setFormVisible(false);
        setEditingId(null);
        setTask("");
        setDueDate("");
        setHwLinkedFiles([]);
        setMaterialsPickerOpen(false);
    };

    const handleOpenCreate = () => {
        setEditingId(null);
        setTask("");
        setDueDate("");
        setHwLinkedFiles([]);
        setFormVisible(true);
    };

    const handleEdit = (hw: Homework) => {
        setEditingId(hw.id);
        setTask(hw.task);
        setDueDate(
            hw.dueDate && hw.dueDate !== "—"
                ? hw.dueDate.split(".").reverse().join("-")
                : ""
        );
        setHwLinkedFiles(
            (hw.linkedFiles || []).map((f: any) => ({
                id: f.id,
                name: f.name,
                url: f.url || f.cloudUrl || "#",
                provider: f.provider || f.cloudProvider,
                type: f.type,
                extension: f.extension,
                size: f.size,
            }))
        );
        setFormVisible(true);
    };

    const handleSubmit = async () => {
        if (!task.trim()) return;
        setSaving(true);
        const fileIds = hwLinkedFiles.map((f) => f.id);
        try {
            if (editingId) {
                await updateHomework(studentId, editingId, {
                    task: task.trim(),
                    dueAt: dueDate || undefined,
                    fileIds,
                });
            } else {
                await createHomework(studentId, {
                    task: task.trim(),
                    dueAt: dueDate || undefined,
                    fileIds,
                });
            }
            onMutate?.();
            resetForm();
        } catch {
            // silent
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (hwId: string) => {
        setBusyId(hwId);
        try {
            await deleteHomework(studentId, hwId);
            onMutate?.();
        } catch {
            // silent
        } finally {
            setBusyId(null);
        }
    };

    return (
        <div className="tab-section">
            {/* ── Action button (Tochka style) ── */}
            <div className="tab-section__actions">
                <button type="button" className="tab-action-btn" onClick={handleOpenCreate}>
                    <span className="tab-action-btn__icon">
                        <GIcon data={CirclePlus as IconData} size={20} />
                    </span>
                    Добавить задание
                </button>
            </div>

            {/* ── Homework list ── */}
            {homeworks.length > 0 && (
                <div className="lp2-hw-list">
                    {homeworks.map((hw) => (
                        <div key={hw.id} className="lp2-hw-item">
                            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                <GText variant="body-1" style={{ fontWeight: 600, flex: 1, minWidth: 0 }} ellipsis>
                                    {hw.task}
                                </GText>
                                <GButton
                                    view="flat"
                                    size="s"
                                    disabled={!!busyId && busyId !== hw.id}
                                    onClick={() => handleEdit(hw)}
                                >
                                    Редактировать
                                </GButton>
                                <GButton
                                    view="flat"
                                    size="s"
                                    loading={busyId === hw.id}
                                    disabled={!!busyId && busyId !== hw.id}
                                    onClick={() => void handleDelete(hw.id)}
                                >
                                    Удалить
                                </GButton>
                            </div>
                            {formatDueDate(hw.dueDate) && (
                                <GText variant="caption-2" color="secondary">
                                    Срок: {hw.dueDate}
                                </GText>
                            )}
                            {hw.linkedFiles && hw.linkedFiles.length > 0 && (
                                <div className="hw-uploads">
                                    <GText variant="caption-2" color="secondary" style={{ marginBottom: 6 }}>
                                        Материалы репетитора:
                                    </GText>
                                    {hw.linkedFiles.map((file: any, index: number) => {
                                        const fileUrl = typeof file.url === "string" ? file.url : "";
                                        const rowKey = file.id || `${file.name || "file"}-${index}`;
                                        const fileType = (file.type || "file") === "folder" ? Folder : FileIcon;

                                        if (!fileUrl || fileUrl === "#") {
                                            return (
                                                <div key={rowKey} className="hw-upload-row hw-upload-row--muted">
                                                    <span className="hw-upload-row__icon">
                                                        <GIcon data={fileType as IconData} size={16} />
                                                    </span>
                                                    <span className="hw-upload-row__name">{file.name}</span>
                                                </div>
                                            );
                                        }

                                        return (
                                            <a
                                                key={rowKey}
                                                href={fileUrl}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="hw-upload-row"
                                            >
                                                <span className="hw-upload-row__icon">
                                                    <GIcon data={fileType as IconData} size={16} />
                                                </span>
                                                <span className="hw-upload-row__name">{file.name}</span>
                                                <GIcon data={ArrowUpRightFromSquare as IconData} size={12} className="hw-upload-row__ext" />
                                            </a>
                                        );
                                    })}
                                </div>
                            )}

                            {/* ── Student uploads ── */}
                            {hw.studentUploads && hw.studentUploads.length > 0 && (
                                <div className="hw-uploads">
                                    <GText variant="caption-2" color="secondary" style={{ marginBottom: 6 }}>
                                        Работы ученика:
                                    </GText>
                                    {hw.studentUploads.map((upload) => (
                                        <a
                                            key={upload.id}
                                            href={upload.url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="hw-upload-row"
                                        >
                                            <span className="hw-upload-row__icon">
                                                <GIcon data={FileIcon as IconData} size={16} />
                                            </span>
                                            <span className="hw-upload-row__name">{upload.name}</span>
                                            <GIcon data={ArrowUpRightFromSquare as IconData} size={12} className="hw-upload-row__ext" />
                                        </a>
                                    ))}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {homeworks.length === 0 && (
                <div className="lp2-empty">Домашних заданий пока нет</div>
            )}

            <AppDialog
                open={formVisible}
                onClose={resetForm}
                size="m"
                caption={editingId ? "Редактировать домашнее задание" : "Добавить домашнее задание"}
                hasCloseButton
            >
                <div className="lp2-hw-form">
                    <TochkaField label="Описание задания">
                        <TextArea
                            value={task}
                            onUpdate={setTask}
                            placeholder="Выучить параграф 5, решить задачи №12-18..."
                            rows={3}
                            size="xl"
                        />
                    </TochkaField>
                    <TochkaField label="Срок сдачи">
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
                    </TochkaField>

                    {/* ── Attached materials ── */}
                    {hwLinkedFiles.length > 0 && (
                        <div className="lp2-materials">
                            <GText variant="caption-2" color="secondary" style={{ marginBottom: 8 }}>
                                Прикрепленные материалы
                            </GText>
                            {hwLinkedFiles.map((file) => (
                                <div key={file.id} className="lp2-material-row">
                                    <GIcon data={((file.type || "file") === "folder" ? Folder : FileIcon) as IconData} size={16} />
                                    <GText variant="body-1" style={{ flex: 1, minWidth: 0 }} ellipsis>
                                        {file.name}
                                    </GText>
                                    <GButton view="flat" size="s" onClick={() =>
                                        setHwLinkedFiles((prev) => prev.filter((f) => f.id !== file.id))
                                    }>
                                        <GIcon data={TrashBin as IconData} size={14} />
                                    </GButton>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* ── Add material button (Tochka style) ── */}
                    {connectedProviders.length > 0 && (
                        <button
                            type="button"
                            className="hw-material-upload-btn"
                            onClick={() => setMaterialsPickerOpen(true)}
                        >
                            <span className="hw-material-upload-btn__icon">
                                <GIcon data={Plus as IconData} size={20} />
                            </span>
                            <span className="hw-material-upload-btn__content">
                                <span className="hw-material-upload-btn__title">Добавить материал</span>
                                <span className="hw-material-upload-btn__hint">{materialsHint}</span>
                            </span>
                        </button>
                    )}

                    <div className="tab-note-form__actions">
                        <GButton
                            view="outlined"
                            size="l"
                            onClick={resetForm}
                        >
                            Отмена
                        </GButton>
                        <GButton
                            view="action"
                            size="l"
                            disabled={!task.trim()}
                            loading={saving}
                            onClick={() => void handleSubmit()}
                        >
                            {editingId ? "Сохранить изменения" : "Сохранить"}
                        </GButton>
                    </div>
                </div>
            </AppDialog>

            <MaterialsPickerDialog
                open={materialsPickerOpen}
                onClose={() => setMaterialsPickerOpen(false)}
                selectedFiles={hwLinkedFiles}
                availableFiles={availableHomeworkFiles}
                connectedProviders={connectedProviders}
                defaultProvider={defaultMaterialsProvider}
                onApply={setHwLinkedFiles}
            />
        </div>
    );
};

export default HomeworkTab;
export type { Homework };
