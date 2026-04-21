import { useMemo, useState } from "react";
import { Text, Button, Icon } from "@gravity-ui/uikit";
import {
    CirclePlus,
    File as FileIcon,
    Folder,
    ArrowUpRightFromSquare,
} from "@gravity-ui/icons";
import type { IconData } from "@gravity-ui/uikit";
import { useApi } from "@/hooks/useApi";
import { createHomework, updateHomework, deleteHomework } from "@/hooks/useStudents";
import type { CloudProvider, FilesOverviewResponse } from "@/types/files";
import HomeworkModal from "./HomeworkModal";

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

const formatDueDate = (date: string) => {
    if (!date || date === "—") {
        return null;
    }

    return date;
};

const HomeworkTab = ({ studentId, homeworks, onMutate }: HomeworkTabProps) => {
    const [formVisible, setFormVisible] = useState(false);
    const [editingHomework, setEditingHomework] = useState<Homework | null>(null);
    const [busyId, setBusyId] = useState<string | null>(null);

    const { data: filesOverview } = useApi<FilesOverviewResponse>(formVisible ? "/files" : null);

    const availableHomeworkFiles = useMemo(() => {
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
    }, [filesOverview]);

    const defaultMaterialsProvider = useMemo<CloudProvider | undefined>(() => {
        if (connectedProviders.length === 0) {
            return undefined;
        }

        return connectedProviders[0];
    }, [connectedProviders]);

    const resetForm = () => {
        setFormVisible(false);
        setEditingHomework(null);
    };

    const handleOpenCreate = () => {
        setEditingHomework(null);
        setFormVisible(true);
    };

    const handleEdit = (homework: Homework) => {
        setEditingHomework(homework);
        setFormVisible(true);
    };

    const handleModalSave = async (data: {
        task: string;
        dueDate: string;
        lessonId?: string;
        linkedFiles: Array<{ id: string }>;
    }) => {
        const fileIds = data.linkedFiles.map((file) => file.id);

        if (editingHomework) {
            await updateHomework(studentId, editingHomework.id, {
                task: data.task,
                dueAt: data.dueDate || undefined,
                fileIds,
            });
        } else {
            await createHomework(studentId, {
                task: data.task,
                dueAt: data.dueDate || undefined,
                fileIds,
            });
        }

        onMutate?.();
    };

    const handleModalDelete = async () => {
        if (!editingHomework) {
            return;
        }

        await deleteHomework(studentId, editingHomework.id);
        onMutate?.();
    };

    const handleDelete = async (homeworkId: string) => {
        setBusyId(homeworkId);

        try {
            await deleteHomework(studentId, homeworkId);
            onMutate?.();
        } finally {
            setBusyId(null);
        }
    };

    return (
        <div className="tab-section">
            <div className="tab-section__actions">
                <button type="button" className="tab-action-btn" onClick={handleOpenCreate}>
                    <span className="tab-action-btn__icon">
                        <GIcon data={CirclePlus as IconData} size={20} />
                    </span>
                    Добавить задание
                </button>
            </div>

            {homeworks.length > 0 && (
                <div className="lp2-hw-list">
                    {homeworks.map((homework) => (
                        <div key={homework.id} className="lp2-hw-item">
                            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                <GText
                                    variant="body-1"
                                    style={{ fontWeight: 600, flex: 1, minWidth: 0 }}
                                    ellipsis
                                >
                                    {homework.task}
                                </GText>
                                <GButton
                                    view="flat"
                                    size="s"
                                    disabled={!!busyId && busyId !== homework.id}
                                    onClick={() => handleEdit(homework)}
                                >
                                    Редактировать
                                </GButton>
                                <GButton
                                    view="flat"
                                    size="s"
                                    loading={busyId === homework.id}
                                    disabled={!!busyId && busyId !== homework.id}
                                    onClick={() => void handleDelete(homework.id)}
                                >
                                    Удалить
                                </GButton>
                            </div>

                            {formatDueDate(homework.dueDate) && (
                                <GText variant="caption-2" color="secondary">
                                    Срок: {homework.dueDate}
                                </GText>
                            )}

                            {homework.linkedFiles && homework.linkedFiles.length > 0 && (
                                <div className="hw-uploads">
                                    <GText
                                        variant="caption-2"
                                        color="secondary"
                                        style={{ marginBottom: 6 }}
                                    >
                                        Материалы репетитора:
                                    </GText>
                                    {homework.linkedFiles.map((file: any, index: number) => {
                                        const fileUrl = typeof file.url === "string" ? file.url : "";
                                        const rowKey = file.id || `${file.name || "file"}-${index}`;
                                        const fileType =
                                            (file.type || "file") === "folder" ? Folder : FileIcon;

                                        if (!fileUrl || fileUrl === "#") {
                                            return (
                                                <div
                                                    key={rowKey}
                                                    className="hw-upload-row hw-upload-row--muted"
                                                >
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
                                                <GIcon
                                                    data={ArrowUpRightFromSquare as IconData}
                                                    size={12}
                                                    className="hw-upload-row__ext"
                                                />
                                            </a>
                                        );
                                    })}
                                </div>
                            )}

                            {homework.studentUploads && homework.studentUploads.length > 0 && (
                                <div className="hw-uploads">
                                    <GText
                                        variant="caption-2"
                                        color="secondary"
                                        style={{ marginBottom: 6 }}
                                    >
                                        Работы ученика:
                                    </GText>
                                    {homework.studentUploads.map((upload) => (
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
                                            <GIcon
                                                data={ArrowUpRightFromSquare as IconData}
                                                size={12}
                                                className="hw-upload-row__ext"
                                            />
                                        </a>
                                    ))}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {homeworks.length === 0 && <div className="lp2-empty">Домашних заданий пока нет</div>}

            <HomeworkModal
                visible={formVisible}
                onClose={resetForm}
                homework={editingHomework}
                availableFiles={availableHomeworkFiles}
                connectedProviders={connectedProviders}
                defaultProvider={defaultMaterialsProvider}
                onSave={handleModalSave}
                onDelete={editingHomework ? handleModalDelete : undefined}
            />
        </div>
    );
};

export default HomeworkTab;
export type { Homework };
