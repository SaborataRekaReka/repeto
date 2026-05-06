import { useMemo, useState } from "react";
import { Text, Icon, DropdownMenu } from "@gravity-ui/uikit";
import {
    Ellipsis,
    File as FileIcon,
    Folder,
    ArrowUpRightFromSquare,
} from "@gravity-ui/icons";
import type { IconData } from "@gravity-ui/uikit";
import { useApi } from "@/hooks/useApi";
import { createHomework, updateHomework, deleteHomework } from "@/hooks/useStudents";
import PillTabs from "@/components/PillTabs";
import type { CloudProvider, FilesOverviewResponse } from "@/types/files";
import type { Lesson } from "@/types/schedule";
import HomeworkModal from "./HomeworkModal";
import TabAddSlot from "../TabAddSlot";

const GText = Text as any;
const GIcon = Icon as any;
const GDropdownMenu = DropdownMenu as any;

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
    lessons?: Lesson[];
    onMutate?: () => void;
    onRemindHomework?: () => void;
};

type HomeworkFilter = "all" | "not_done" | "overdue" | "done";

const homeworkStatusLabels: Record<Homework["status"], string> = {
    not_done: "Назначено",
    overdue: "Просрочено",
    done: "Сдано",
};

const homeworkStatusToApi = (status: Homework["status"]) => {
    if (status === "done") return "COMPLETED";
    if (status === "overdue") return "OVERDUE";
    return "PENDING";
};

const formatDueDate = (date: string) => {
    if (!date || date === "—") {
        return null;
    }

    return date;
};

const HomeworkTab = ({
    studentId,
    homeworks,
    lessons = [],
    onMutate,
    onRemindHomework,
}: HomeworkTabProps) => {
    const [formVisible, setFormVisible] = useState(false);
    const [editingHomework, setEditingHomework] = useState<Homework | null>(null);
    const [busyId, setBusyId] = useState<string | null>(null);
    const [statusFilter, setStatusFilter] = useState<HomeworkFilter>("all");

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

    const homeworkStats = useMemo(() => ({
        all: homeworks.length,
        not_done: homeworks.filter((homework) => homework.status === "not_done").length,
        overdue: homeworks.filter((homework) => homework.status === "overdue").length,
        done: homeworks.filter((homework) => homework.status === "done").length,
    }), [homeworks]);

    const filteredHomeworks = useMemo(() => {
        if (statusFilter === "all") {
            return homeworks;
        }

        return homeworks.filter((homework) => homework.status === statusFilter);
    }, [homeworks, statusFilter]);

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

    const handleStatusUpdate = async (homework: Homework, nextStatus: Homework["status"]) => {
        setBusyId(homework.id);

        try {
            await updateHomework(studentId, homework.id, {
                status: homeworkStatusToApi(nextStatus),
            });
            onMutate?.();
        } finally {
            setBusyId(null);
        }
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
            {homeworks.length > 0 && (
                <div className="hw-status-tabs">
                    <PillTabs<HomeworkFilter>
                        value={statusFilter}
                        onChange={setStatusFilter}
                        size="s"
                        ariaLabel="Фильтр домашки"
                        options={[
                            { value: "all", label: "Все", count: homeworkStats.all },
                            { value: "not_done", label: "Назначено", count: homeworkStats.not_done },
                            { value: "overdue", label: "Просрочено", count: homeworkStats.overdue },
                            { value: "done", label: "Сдано", count: homeworkStats.done },
                        ]}
                    />
                </div>
            )}

            {filteredHomeworks.length > 0 && (
                <div className="lp2-hw-list">
                    {filteredHomeworks.map((homework) => {
                        const dueLabel = formatDueDate(homework.dueDate);

                        const isBusy = !!busyId;
                        const isOtherBusy = isBusy && busyId !== homework.id;
                        const menuItems = [
                            {
                                text: "Редактировать",
                                disabled: isOtherBusy,
                                action: () => handleEdit(homework),
                            },
                            homework.status === "done"
                                ? {
                                    text: "Вернуть в работу",
                                    disabled: isOtherBusy,
                                    action: () => void handleStatusUpdate(homework, "not_done"),
                                }
                                : {
                                    text: "Отметить сданным",
                                    disabled: isOtherBusy,
                                    action: () => void handleStatusUpdate(homework, "done"),
                                },
                            ...(homework.status === "not_done"
                                ? [{
                                    text: "Отметить просроченным",
                                    disabled: isBusy,
                                    action: () => void handleStatusUpdate(homework, "overdue"),
                                }]
                                : []),
                            ...(homework.status !== "done" && onRemindHomework
                                ? [{
                                    text: "Напомнить",
                                    disabled: isBusy,
                                    action: onRemindHomework,
                                }]
                                : []),
                            {
                                text: "Удалить",
                                disabled: isOtherBusy,
                                action: () => void handleDelete(homework.id),
                            },
                        ];

                        return (
                            <div key={homework.id} className={`lp2-hw-item lp2-hw-item--${homework.status}`}>
                                <div className="hw-item-topline">
                                    <div className="hw-item-title-wrap">
                                        <GText variant="body-1" className="hw-item-title">
                                            {homework.task}
                                        </GText>
                                        <GText variant="caption-2" color="secondary" className="hw-item-meta">
                                            {[dueLabel ? `Срок до ${dueLabel}` : null, homeworkStatusLabels[homework.status]]
                                                .filter(Boolean)
                                                .join(" · ")}
                                        </GText>
                                    </div>
                                    <div className="hw-item-menu" onClick={(event) => event.stopPropagation()}>
                                        <GDropdownMenu
                                            items={menuItems}
                                            renderSwitcher={(props: any) => (
                                                <button
                                                    type="button"
                                                    className="repeto-sl-row__menu-btn"
                                                    {...props}
                                                    disabled={isOtherBusy}
                                                    title="Действия"
                                                >
                                                    <GIcon data={Ellipsis as IconData} size={16} />
                                                </button>
                                            )}
                                        />
                                    </div>
                                </div>

                                {homework.linkedFiles && homework.linkedFiles.length > 0 && (
                                    <div className="hw-uploads">
                                        <GText variant="caption-2" color="secondary" className="hw-uploads__label">
                                            Материалы репетитора:
                                        </GText>
                                        {homework.linkedFiles.map((file: any, index: number) => {
                                            const fileUrl = typeof file.url === "string" ? file.url : "";
                                            const rowKey = file.id || `${file.name || "file"}-${index}`;
                                            const fileType =
                                                (file.type || "file") === "folder" ? Folder : FileIcon;

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
                                        <GText variant="caption-2" color="secondary" className="hw-uploads__label">
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
                        );
                    })}
                    <TabAddSlot title="Добавить домашку" onClick={handleOpenCreate} />
                </div>
            )}

            {homeworks.length === 0 && (
                <div className="lp2-empty lp2-empty--with-action">
                    <span>Домашних заданий пока нет</span>
                    <TabAddSlot title="Добавить домашку" onClick={handleOpenCreate} />
                </div>
            )}
            {homeworks.length > 0 && filteredHomeworks.length === 0 && (
                <div className="lp2-empty lp2-empty--with-action">
                    <span>Нет заданий в выбранном статусе</span>
                    <TabAddSlot title="Добавить домашку" onClick={handleOpenCreate} />
                </div>
            )}

            <HomeworkModal
                visible={formVisible}
                onClose={resetForm}
                homework={editingHomework}
                availableFiles={availableHomeworkFiles}
                availableLessons={lessons}
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
