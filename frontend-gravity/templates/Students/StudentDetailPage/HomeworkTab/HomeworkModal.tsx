import { useEffect, useMemo, useState } from "react";
import {
    Alert,
    Button,
    Checkbox,
    Icon,
    Select,
    Text,
    TextInput,
    TextArea,
} from "@gravity-ui/uikit";
import {
    ChevronRight,
    CirclePlus,
    File,
    Folder,
    TrashBin,
} from "@gravity-ui/icons";
import type { IconData } from "@gravity-ui/uikit";
import StyledDateInput from "@/components/StyledDateInput";
import AppDialog from "@/components/AppDialog";
import MaterialsPickerDialog from "@/components/MaterialsPickerDialog";
import type { HomeworkFile, StudentUploadFile } from "@/mocks/student-details";
import type { CloudProvider } from "@/types/files";
import type { Lesson } from "@/types/schedule";
import { useRouter } from "next/router";

type Homework = {
    id: string;
    date: string;
    task: string;
    dueDate: string;
    status: "not_done" | "done" | "overdue";
    lessonId?: string;
    linkedFiles?: HomeworkFile[];
    studentUploads?: StudentUploadFile[];
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
    }) => void;
    onDelete?: () => void;
};

const providerLabel = (provider: CloudProvider) =>
    provider === "google-drive" ? "Google Drive" : "Яндекс Диск";

const sortByTypeAndName = (a: HomeworkFile, b: HomeworkFile) => {
    const aType = a.type || "file";
    const bType = b.type || "file";

    if (aType !== bType) {
        return aType === "folder" ? -1 : 1;
    }

    return a.name.localeCompare(b.name, "ru");
};

const ROOT_FOLDER_ID = "ROOT";

const makeSelectionKey = (provider: CloudProvider, itemId: string) =>
    `${provider}:${itemId}`;

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
    const router = useRouter();
    const [task, setTask] = useState("");
    const [dueDate, setDueDate] = useState("");
    const [selectedLessonId, setSelectedLessonId] = useState<string[]>([]);
    const [files, setFiles] = useState<HomeworkFile[]>([]);

    const [taskTouched, setTaskTouched] = useState(false);
    const [formError, setFormError] = useState<string | null>(null);
    const [confirmDelete, setConfirmDelete] = useState(false);

    const [pickerOpen, setPickerOpen] = useState(false);
    const [draftSelectedKeys, setDraftSelectedKeys] = useState<string[]>([]);
    const [activePickerProvider, setActivePickerProvider] = useState<CloudProvider | null>(null);
    const [providerSearch, setProviderSearch] = useState<
        Partial<Record<CloudProvider, string>>
    >({});
    const [currentFolderByProvider, setCurrentFolderByProvider] = useState<
        Partial<Record<CloudProvider, string | null>>
    >({});

    const isEdit = Boolean(homework);

    useEffect(() => {
        if (visible && homework) {
            setTask(homework.task);
            setDueDate(homework.dueDate);
            setSelectedLessonId(homework.lessonId ? [homework.lessonId] : []);
            setFiles(homework.linkedFiles || []);
        } else if (visible) {
            setTask("");
            setDueDate("");
            setSelectedLessonId([]);
            setFiles([]);
        }

        setTaskTouched(false);
        setFormError(null);
        setConfirmDelete(false);

        setPickerOpen(false);
        setDraftSelectedKeys([]);
        setActivePickerProvider(null);
        setProviderSearch({});
        setCurrentFolderByProvider({});
    }, [visible, homework, defaultProvider, connectedProviders]);

    const lessonOptions = useMemo(() => {
        return [...availableLessons]
            .filter(
                (lesson) =>
                    lesson.status === "planned" || lesson.status === "completed"
            )
            .sort((a, b) => (a.date > b.date ? -1 : 1))
            .map((lesson) => ({
                value: lesson.id,
                content: `${lesson.subject} · ${lesson.date} · ${lesson.startTime}`,
            }));
    }, [availableLessons]);

    const normalizedAvailableFiles = useMemo(() => {
        const deduped = new Map<string, HomeworkFile>();

        availableFiles.forEach((item) => {
            if (!item.provider) {
                return;
            }

            deduped.set(makeSelectionKey(item.provider, item.id), item);
        });

        return Array.from(deduped.values());
    }, [availableFiles]);

    const pickerProviders = useMemo<CloudProvider[]>(() => {
        if (connectedProviders.length > 0) {
            const uniqueConnected = Array.from(new Set(connectedProviders));
            if (defaultProvider && uniqueConnected.includes(defaultProvider)) {
                return [
                    defaultProvider,
                    ...uniqueConnected.filter((provider) => provider !== defaultProvider),
                ];
            }

            return uniqueConnected;
        }

        const inferred = normalizedAvailableFiles
            .map((item) => item.provider)
            .filter((provider): provider is CloudProvider => !!provider);

        return Array.from(new Set(inferred));
    }, [connectedProviders, normalizedAvailableFiles]);

    const itemsByProvider = useMemo(() => {
        const map = new Map<CloudProvider, HomeworkFile[]>();

        pickerProviders.forEach((provider) => {
            map.set(provider, []);
        });

        normalizedAvailableFiles.forEach((item) => {
            const provider = item.provider;
            if (!provider) {
                return;
            }

            const bucket = map.get(provider) || [];
            bucket.push(item);
            map.set(provider, bucket);
        });

        map.forEach((items, provider) => {
            map.set(provider, [...items].sort(sortByTypeAndName));
        });

        return map;
    }, [normalizedAvailableFiles, pickerProviders]);

    const providerMetaByProvider = useMemo(() => {
        const map = new Map<
            CloudProvider,
            {
                childrenByParent: Map<string, HomeworkFile[]>;
                itemById: Map<string, HomeworkFile>;
            }
        >();

        itemsByProvider.forEach((items, provider) => {
            const childrenByParent = new Map<string, HomeworkFile[]>();
            const itemById = new Map<string, HomeworkFile>();

            for (const item of items) {
                const parentId = item.parentId || ROOT_FOLDER_ID;
                const bucket = childrenByParent.get(parentId) || [];
                bucket.push(item);
                childrenByParent.set(parentId, bucket);
                itemById.set(item.id, item);
            }

            childrenByParent.forEach((children, parentId) => {
                childrenByParent.set(parentId, [...children].sort(sortByTypeAndName));
            });

            map.set(provider, {
                childrenByParent,
                itemById,
            });
        });

        return map;
    }, [itemsByProvider]);

    const providerRootFolderIdByProvider = useMemo(() => {
        const map = new Map<CloudProvider, string | null>();

        pickerProviders.forEach((provider) => {
            const rootItems =
                providerMetaByProvider.get(provider)?.childrenByParent.get(ROOT_FOLDER_ID) || [];

            // Some providers return one synthetic root folder (e.g. "My Drive").
            // Auto-enter it so users see real root contents immediately.
            if (rootItems.length === 1 && (rootItems[0].type || "file") === "folder") {
                map.set(provider, rootItems[0].id);
            } else {
                map.set(provider, null);
            }
        });

        return map;
    }, [pickerProviders, providerMetaByProvider]);

    const fileBySelectionKey = useMemo(() => {
        const map = new Map<string, HomeworkFile>();

        normalizedAvailableFiles.forEach((item) => {
            if (!item.provider) {
                return;
            }

            map.set(makeSelectionKey(item.provider, item.id), item);
        });

        return map;
    }, [normalizedAvailableFiles]);

    const selectedDraftKeySet = useMemo(
        () => new Set(draftSelectedKeys),
        [draftSelectedKeys]
    );

    const selectedAvailableItems = useMemo(() => {
        return draftSelectedKeys
            .map((key) => fileBySelectionKey.get(key))
            .filter((item): item is HomeworkFile => !!item);
    }, [draftSelectedKeys, fileBySelectionKey]);

    const openFilePicker = () => {
        setDraftSelectedKeys(
            files
                .map((file) => {
                    if (file.provider) {
                        const directKey = makeSelectionKey(file.provider, file.id);
                        if (fileBySelectionKey.has(directKey)) {
                            return directKey;
                        }
                    }

                    const fallback = normalizedAvailableFiles.find(
                        (available) => available.id === file.id
                    );

                    if (fallback?.provider) {
                        return makeSelectionKey(fallback.provider, fallback.id);
                    }

                    return null;
                })
                .filter((key): key is string => !!key)
        );
        setActivePickerProvider(pickerProviders[0] ?? null);
        setProviderSearch({});
        setCurrentFolderByProvider(
            pickerProviders.reduce<Partial<Record<CloudProvider, string | null>>>(
                (acc, provider) => {
                    acc[provider] = providerRootFolderIdByProvider.get(provider) || null;
                    return acc;
                },
                {}
            )
        );
        setPickerOpen(true);
    };

    useEffect(() => {
        if (!pickerOpen || pickerProviders.length === 0) {
            return;
        }

        setActivePickerProvider((prev) => {
            if (prev && pickerProviders.includes(prev)) {
                return prev;
            }

            return pickerProviders[0];
        });

        setCurrentFolderByProvider((prev) => {
            const next = { ...prev };
            let changed = false;

            pickerProviders.forEach((provider) => {
                if (next[provider] === undefined) {
                    next[provider] = providerRootFolderIdByProvider.get(provider) || null;
                    changed = true;
                }
            });

            return changed ? next : prev;
        });
    }, [pickerOpen, pickerProviders, providerRootFolderIdByProvider]);

    const toggleDraftItem = (
        provider: CloudProvider,
        item: HomeworkFile,
        checked: boolean
    ) => {
        setDraftSelectedKeys((prev) => {
            const next = new Set(prev);
            const key = makeSelectionKey(provider, item.id);

            if (checked) {
                next.add(key);
            } else {
                next.delete(key);
            }

            return Array.from(next);
        });
    };

    const setProviderSearchValue = (provider: CloudProvider, value: string) => {
        setProviderSearch((prev) => ({
            ...prev,
            [provider]: value,
        }));
    };

    const getProviderVisibleItems = (provider: CloudProvider) => {
        const providerItems = itemsByProvider.get(provider) || [];
        const query = (providerSearch[provider] || "").trim().toLowerCase();

        if (query) {
            return providerItems.filter((item) =>
                item.name.toLowerCase().includes(query)
            );
        }

        const currentFolderId = currentFolderByProvider[provider] || null;
        const parentKey = currentFolderId || ROOT_FOLDER_ID;
        const children =
            providerMetaByProvider.get(provider)?.childrenByParent.get(parentKey) || [];

        return children;
    };

    const selectAllInProvider = (provider: CloudProvider) => {
        const visibleItems = getProviderVisibleItems(provider);
        setDraftSelectedKeys((prev) => {
            const next = new Set(prev);
            visibleItems.forEach((item) =>
                next.add(makeSelectionKey(provider, item.id))
            );
            return Array.from(next);
        });
    };

    const clearAllInProvider = (provider: CloudProvider) => {
        const visibleKeys = new Set(
            getProviderVisibleItems(provider).map((item) =>
                makeSelectionKey(provider, item.id)
            )
        );

        setDraftSelectedKeys((prev) =>
            prev.filter((key) => !visibleKeys.has(key))
        );
    };

    const clearAllSelection = () => {
        setDraftSelectedKeys([]);
    };

    const openFolder = (provider: CloudProvider, folderId: string) => {
        setCurrentFolderByProvider((prev) => ({
            ...prev,
            [provider]: folderId,
        }));
    };

    const buildProviderBreadcrumbs = (provider: CloudProvider) => {
        const currentFolderId = currentFolderByProvider[provider] || null;
        if (!currentFolderId) {
            return [] as Array<{ id: string; name: string }>;
        }

        const itemById = providerMetaByProvider.get(provider)?.itemById;
        if (!itemById) {
            return [] as Array<{ id: string; name: string }>;
        }

        const crumbs: Array<{ id: string; name: string }> = [];
        const visited = new Set<string>();
        let cursorId: string | null = currentFolderId;

        while (cursorId) {
            if (visited.has(cursorId)) {
                break;
            }

            visited.add(cursorId);
            const item = itemById.get(cursorId);
            if (!item) {
                break;
            }

            crumbs.unshift({ id: item.id, name: item.name });
            cursorId = item.parentId || null;
        }

        return crumbs;
    };

    const applyPickerSelection = () => {
        const selectedItems = draftSelectedKeys
            .map((key) => fileBySelectionKey.get(key))
            .filter((item): item is HomeworkFile => !!item);

        const manualFiles = files.filter(
            (file) =>
                !normalizedAvailableFiles.some(
                    (available) =>
                        available.id === file.id &&
                        available.provider === file.provider
                )
        );

        setFiles([...manualFiles, ...selectedItems]);
        setPickerOpen(false);
    };

    const handleRemoveFile = (fileToRemove: HomeworkFile) => {
        setFiles((prev) =>
            prev.filter(
                (file) =>
                    !(
                        file.id === fileToRemove.id &&
                        file.provider === fileToRemove.provider
                    )
            )
        );
    };

    const handleSave = () => {
        setTaskTouched(true);
        if (!task.trim()) {
            setFormError("Заполните обязательные поля.");
            return;
        }

        setFormError(null);
        onSave({
            task: task.trim(),
            dueDate,
            lessonId: selectedLessonId[0] || undefined,
            linkedFiles: files,
        });
    };

    const taskError = taskTouched && !task.trim();

    return (
        <>
            <AppDialog
                size="m"
                open={visible}
                onClose={onClose}
                caption={isEdit ? "Редактировать задание" : "Новое задание"}
                footer={{
                    onClickButtonApply: handleSave,
                    textButtonApply: isEdit ? "Сохранить" : "Дать задание",
                    onClickButtonCancel: onClose,
                    textButtonCancel: "Отмена",
                    entityActions:
                        isEdit && onDelete ? (
                            <Button
                                view="flat"
                                size="s"
                                className="repeto-icon-action-btn"
                                onClick={() => setConfirmDelete(true)}
                                title="Удалить задание"
                                aria-label="Удалить задание"
                            >
                                <Icon data={TrashBin as IconData} size={14} />
                            </Button>
                        ) : undefined,
                }}
            >
            <div>
                <Text
                    as="label"
                    variant="body-1"
                    color="secondary"
                    style={{ display: "block", marginBottom: 6 }}
                >
                    Задание *
                </Text>
                <div
                    style={
                        taskError
                            ? {
                                  border: "1px solid var(--g-color-line-danger)",
                                  borderRadius: 8,
                                  padding: 2,
                              }
                            : undefined
                    }
                >
                    <TextArea
                        value={task}
                        onUpdate={setTask}
                        onBlur={() => setTaskTouched(true)}
                        placeholder="Опишите задание..."
                        rows={4}
                        size="l"
                    />
                </div>
                {taskError && (
                    <Text
                        as="div"
                        variant="caption-2"
                        style={{
                            marginTop: 4,
                            color: "var(--g-color-text-danger)",
                        }}
                    >
                        Обязательное поле
                    </Text>
                )}
            </div>

            <div>
                <Text
                    as="label"
                    variant="body-1"
                    color="secondary"
                    style={{ display: "block", marginBottom: 6 }}
                >
                    Срок сдачи
                </Text>
                <StyledDateInput
                    value={dueDate}
                    onUpdate={setDueDate}
                    style={{ height: 36, padding: "0 12px" }}
                />
            </div>

            <div>
                <Text
                    as="label"
                    variant="body-1"
                    color="secondary"
                    style={{ display: "block", marginBottom: 6 }}
                >
                    Привязать к занятию
                </Text>
                <Select
                    size="l"
                    width="max"
                    value={selectedLessonId}
                    options={lessonOptions}
                    onUpdate={setSelectedLessonId}
                    placeholder={
                        lessonOptions.length > 0
                            ? "Выберите занятие"
                            : "Нет доступных занятий"
                    }
                    disabled={lessonOptions.length === 0}
                />
                {selectedLessonId.length > 0 && (
                    <Button
                        view="flat"
                        size="s"
                        style={{ marginTop: 6 }}
                        onClick={() => setSelectedLessonId([])}
                    >
                        Снять привязку
                    </Button>
                )}
            </div>

            <div>
                <div
                    style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        marginBottom: 8,
                    }}
                >
                    <Text variant="body-1" color="secondary">
                        Прикреплённые материалы
                    </Text>
                    <Button
                        view="outlined"
                        size="s"
                        onClick={openFilePicker}
                    >
                        <Icon data={CirclePlus as IconData} size={14} />
                        Прикрепить файл
                    </Button>
                </div>

                {files.map((file) => (
                    <div
                        key={
                            file.provider
                                ? makeSelectionKey(file.provider, file.id)
                                : file.id
                        }
                        style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 8,
                            padding: "6px 10px",
                            border: "1px solid var(--g-color-line-generic)",
                            borderRadius: 6,
                            marginBottom: 6,
                        }}
                    >
                        <Icon
                            data={
                                (file.type || "file") === "folder"
                                    ? (Folder as IconData)
                                    : (File as IconData)
                            }
                            size={14}
                        />
                        <div style={{ flex: 1, minWidth: 0 }}>
                            <Text
                                variant="body-2"
                                style={{ fontWeight: 600 }}
                                ellipsis
                            >
                                {file.name}
                            </Text>
                        </div>
                        <Button
                            view="flat"
                            size="s"
                            className="repeto-icon-action-btn"
                            title="Удалить файл"
                            aria-label="Удалить файл"
                            onClick={() => handleRemoveFile(file)}
                        >
                            <Icon data={TrashBin as IconData} size={14} />
                        </Button>
                    </div>
                ))}

                {files.length === 0 && (
                    <Text variant="body-2" color="secondary">
                        Файлы не прикреплены
                    </Text>
                )}
            </div>

            {isEdit && confirmDelete && onDelete && (
                <Alert
                    theme="danger"
                    view="filled"
                    corners="rounded"
                    title="Подтвердите удаление задания"
                    message={
                        <div
                            style={{
                                display: "flex",
                                flexDirection: "column",
                                gap: 8,
                            }}
                        >
                            <div>
                                Домашнее задание будет удалено без возможности
                                восстановления.
                            </div>
                            <div style={{ display: "flex", gap: 8 }}>
                                <Button
                                    view="outlined-danger"
                                    size="m"
                                    onClick={() => {
                                        setConfirmDelete(false);
                                        onDelete();
                                    }}
                                >
                                    Да, удалить
                                </Button>
                                <Button
                                    view="outlined"
                                    size="m"
                                    onClick={() => setConfirmDelete(false)}
                                >
                                    Отмена
                                </Button>
                            </div>
                        </div>
                    }
                />
            )}

            {isEdit &&
                homework?.studentUploads &&
                homework.studentUploads.length > 0 && (
                    <div>
                        <Text
                            variant="body-1"
                            color="secondary"
                            as="div"
                            style={{ marginBottom: 8 }}
                        >
                            Загрузки ученика
                        </Text>
                        {homework.studentUploads.map((upload) => (
                            <a
                                key={upload.id}
                                href={upload.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 8,
                                    padding: "6px 10px",
                                    border: "1px solid var(--g-color-line-generic)",
                                    borderRadius: 6,
                                    marginBottom: 6,
                                    textDecoration: "none",
                                }}
                            >
                                <Icon data={File as IconData} size={14} />
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <Text
                                        variant="body-2"
                                        style={{ fontWeight: 600 }}
                                    >
                                        {upload.name}
                                    </Text>
                                    <Text
                                        variant="caption-2"
                                        color="secondary"
                                        as="div"
                                    >
                                        {upload.size} · Загружено {" "}
                                        {upload.uploadedAt}
                                    </Text>
                                </div>
                            </a>
                        ))}
                    </div>
                )}

            {formError && (
                <Alert
                    theme="danger"
                    view="filled"
                    corners="rounded"
                    title="Проверьте данные задания"
                    message={formError}
                />
            )}
            </AppDialog>

            <MaterialsPickerDialog
                open={pickerOpen}
                onClose={() => setPickerOpen(false)}
                selectedFiles={files}
                availableFiles={availableFiles}
                connectedProviders={connectedProviders}
                defaultProvider={defaultProvider}
                onApply={setFiles}
            />

            {false && (
            <AppDialog
                size="s"
                open={pickerOpen}
                onClose={() => setPickerOpen(false)}
                caption="Выбор материалов"
                footer={{
                    onClickButtonApply: applyPickerSelection,
                    textButtonApply: selectedAvailableItems.length > 0
                        ? `Готово (${selectedAvailableItems.length})`
                        : "Готово",
                    onClickButtonCancel: () => setPickerOpen(false),
                    textButtonCancel: "Отмена",
                }}
            >
                {connectedProviders.length === 0 ? (
                    <div style={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        textAlign: "center",
                        padding: "24px 16px",
                        gap: 14,
                    }}>
                        <div style={{
                            width: 56,
                            height: 56,
                            borderRadius: 16,
                            background: "var(--g-color-base-info-light)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                        }}>
                            <Icon data={Folder as IconData} size={24} />
                        </div>
                        <div>
                            <Text variant="subheader-2" as="div" style={{ marginBottom: 6 }}>
                                Облачные диски не подключены
                            </Text>
                            <Text variant="body-2" color="secondary" as="div">
                                Подключите Яндекс Диск или Google Drive
                                в настройках интеграций, чтобы прикреплять файлы.
                            </Text>
                        </div>
                        <Button
                            view="action"
                            size="l"
                            onClick={() => router.push("/settings?tab=integrations")}
                        >
                            Открыть настройки
                        </Button>
                    </div>
                ) : pickerProviders.length === 0 ? (
                    <Text variant="body-2" color="secondary">
                        Нет доступных источников материалов.
                    </Text>
                ) : (
                    <div
                        style={{
                            display: "flex",
                            flexDirection: "column",
                            gap: 12,
                            padding: 10,
                            borderRadius: 12,
                            background: "var(--g-color-base-simple-hover)",
                        }}
                    >
                        {pickerProviders.length > 1 && (
                            <div style={{ display: "flex", gap: 6 }}>
                                {pickerProviders.map((provider) => {
                                    const isActive = activePickerProvider === provider;
                                    return (
                                        <button
                                            key={provider}
                                            type="button"
                                            onClick={() => {
                                                setActivePickerProvider(provider);
                                                setCurrentFolderByProvider((prev) => ({
                                                    ...prev,
                                                    [provider]:
                                                        providerRootFolderIdByProvider.get(provider) ||
                                                        null,
                                                }));
                                            }}
                                            style={{
                                                flex: 1,
                                                borderRadius: 10,
                                                border: isActive
                                                    ? "1px solid var(--g-color-line-brand)"
                                                    : "1px solid var(--g-color-line-generic)",
                                                background: "#fff",
                                                minHeight: 36,
                                                cursor: "pointer",
                                                padding: "0 12px",
                                            }}
                                        >
                                            <Text
                                                variant="body-2"
                                                style={{
                                                    fontWeight: 600,
                                                    color: isActive
                                                        ? "var(--g-color-text-brand)"
                                                        : "var(--g-color-text-primary)",
                                                }}
                                            >
                                                {providerLabel(provider)}
                                            </Text>
                                        </button>
                                    );
                                })}
                            </div>
                        )}

                        {(() => {
                            const provider = activePickerProvider || pickerProviders[0];
                            if (!provider) return null;

                            const providerItems = itemsByProvider.get(provider) || [];
                            const visibleItems = getProviderVisibleItems(provider);
                            const currentFolderId = currentFolderByProvider[provider] || null;
                            const providerRootFolderId =
                                providerRootFolderIdByProvider.get(provider) || null;
                            const breadcrumbs = buildProviderBreadcrumbs(provider);
                            const showBreadcrumbs = Boolean(
                                currentFolderId && currentFolderId !== providerRootFolderId
                            );
                            const isEmpty = providerItems.length === 0;

                            if (isEmpty) {
                                return (
                                    <div
                                        style={{
                                            display: "flex",
                                            flexDirection: "column",
                                            alignItems: "center",
                                            padding: "28px 16px",
                                            border: "1px dashed var(--g-color-line-generic)",
                                            borderRadius: 12,
                                            gap: 8,
                                            background: "#fff",
                                        }}
                                    >
                                        <Icon
                                            data={Folder as IconData}
                                            size={28}
                                            style={{ color: "var(--g-color-text-hint)" }}
                                        />
                                        <Text variant="body-2" color="secondary">
                                            Нет файлов в {providerLabel(provider)}
                                        </Text>
                                    </div>
                                );
                            }

                            return (
                                <>
                                    <TextInput
                                        value={providerSearch[provider] || ""}
                                        onUpdate={(value) =>
                                            setProviderSearchValue(provider, value)
                                        }
                                        size="l"
                                        placeholder="Поиск по файлам..."
                                        hasClear
                                    />

                                    {showBreadcrumbs && (
                                        <div
                                            style={{
                                                display: "flex",
                                                alignItems: "center",
                                                gap: 4,
                                                flexWrap: "wrap",
                                            }}
                                        >
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    setCurrentFolderByProvider((prev) => ({
                                                        ...prev,
                                                        [provider]: providerRootFolderId,
                                                    }))
                                                }
                                                style={{
                                                    border: "none",
                                                    background: "none",
                                                    padding: "2px 4px",
                                                    cursor: "pointer",
                                                    fontSize: 13,
                                                    fontWeight: 600,
                                                    color: "var(--g-color-text-brand)",
                                                    borderRadius: 4,
                                                }}
                                            >
                                                Корень
                                            </button>
                                            {breadcrumbs.map((crumb) => (
                                                <span
                                                    key={crumb.id}
                                                    style={{
                                                        display: "inline-flex",
                                                        alignItems: "center",
                                                        gap: 4,
                                                    }}
                                                >
                                                    <Text variant="caption-2" color="secondary">
                                                        /
                                                    </Text>
                                                    {crumb.id === currentFolderId ? (
                                                        <Text
                                                            variant="caption-2"
                                                            style={{ fontWeight: 600 }}
                                                        >
                                                            {crumb.name}
                                                        </Text>
                                                    ) : (
                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                setCurrentFolderByProvider(
                                                                    (prev) => ({
                                                                        ...prev,
                                                                        [provider]: crumb.id,
                                                                    })
                                                                )
                                                            }
                                                            style={{
                                                                border: "none",
                                                                background: "none",
                                                                padding: "2px 4px",
                                                                cursor: "pointer",
                                                                fontSize: 13,
                                                                fontWeight: 600,
                                                                color: "var(--g-color-text-brand)",
                                                                borderRadius: 4,
                                                            }}
                                                        >
                                                            {crumb.name}
                                                        </button>
                                                    )}
                                                </span>
                                            ))}
                                        </div>
                                    )}

                                    <div
                                        style={{
                                            borderRadius: 10,
                                            border: "1px solid var(--g-color-line-generic)",
                                            overflow: "hidden",
                                            background: "#fff",
                                        }}
                                    >
                                        <div
                                            style={{
                                                display: "flex",
                                                justifyContent: "flex-end",
                                                gap: 4,
                                                padding: "5px 10px",
                                                background: "#fff",
                                                borderBottom:
                                                    "1px solid var(--g-color-line-generic)",
                                            }}
                                        >
                                            <Button
                                                size="xs"
                                                view="flat"
                                                onClick={() => selectAllInProvider(provider)}
                                            >
                                                Выбрать все
                                            </Button>
                                            <Button
                                                size="xs"
                                                view="flat"
                                                onClick={() => clearAllInProvider(provider)}
                                            >
                                                Снять все
                                            </Button>
                                        </div>

                                        <div
                                            style={{
                                                maxHeight: 320,
                                                overflowY: "auto",
                                                overflowX: "hidden",
                                                background: "#fff",
                                            }}
                                        >
                                            {visibleItems.length === 0 ? (
                                                <div
                                                    style={{
                                                        padding: 24,
                                                        textAlign: "center",
                                                        background: "#fff",
                                                    }}
                                                >
                                                    <Text variant="body-2" color="secondary">
                                                        Ничего не найдено
                                                    </Text>
                                                </div>
                                            ) : (
                                                visibleItems.map((item, idx) => {
                                                    const isFolder =
                                                        (item.type || "file") === "folder";
                                                    const selectionKey = makeSelectionKey(
                                                        provider,
                                                        item.id
                                                    );
                                                    const isSelected =
                                                        selectedDraftKeySet.has(selectionKey);

                                                    return (
                                                        <label
                                                            key={selectionKey}
                                                            title={item.name}
                                                            style={{
                                                                display: "flex",
                                                                alignItems: "center",
                                                                gap: 10,
                                                                padding: "9px 14px",
                                                                borderTop:
                                                                    idx > 0
                                                                        ? "1px solid var(--g-color-line-generic)"
                                                                        : undefined,
                                                                cursor: "pointer",
                                                                background: isSelected
                                                                    ? "var(--g-color-base-simple-hover)"
                                                                    : "#fff",
                                                                transition:
                                                                    "background 80ms ease",
                                                            }}
                                                        >
                                                            <Checkbox
                                                                size="m"
                                                                checked={isSelected}
                                                                onUpdate={(checked) =>
                                                                    toggleDraftItem(
                                                                        provider,
                                                                        item,
                                                                        checked
                                                                    )
                                                                }
                                                            />
                                                            <Icon
                                                                data={
                                                                    isFolder
                                                                        ? (Folder as IconData)
                                                                        : (File as IconData)
                                                                }
                                                                size={16}
                                                                style={{
                                                                    flexShrink: 0,
                                                                    color: isFolder
                                                                        ? "var(--g-color-text-brand)"
                                                                        : "var(--g-color-text-secondary)",
                                                                }}
                                                            />
                                                            <div
                                                                style={{
                                                                    flex: 1,
                                                                    minWidth: 0,
                                                                }}
                                                            >
                                                                {isFolder ? (
                                                                    <button
                                                                        type="button"
                                                                        onClick={(e) => {
                                                                            e.preventDefault();
                                                                            e.stopPropagation();
                                                                            openFolder(
                                                                                provider,
                                                                                item.id
                                                                            );
                                                                        }}
                                                                        style={{
                                                                            border: "none",
                                                                            background: "transparent",
                                                                            padding: 0,
                                                                            cursor: "pointer",
                                                                            textAlign: "left",
                                                                            maxWidth: "100%",
                                                                        }}
                                                                    >
                                                                        <Text
                                                                            variant="body-2"
                                                                            style={{
                                                                                fontWeight: 600,
                                                                                color: "var(--g-color-text-brand)",
                                                                            }}
                                                                            ellipsis
                                                                        >
                                                                            {item.name}
                                                                        </Text>
                                                                    </button>
                                                                ) : (
                                                                    <Text
                                                                        variant="body-2"
                                                                        ellipsis
                                                                    >
                                                                        {item.name}
                                                                    </Text>
                                                                )}
                                                            </div>
                                                            {isFolder && (
                                                                <Button
                                                                    view="flat"
                                                                    size="xs"
                                                                    onClick={(e: React.MouseEvent) => {
                                                                        e.preventDefault();
                                                                        e.stopPropagation();
                                                                        openFolder(
                                                                            provider,
                                                                            item.id
                                                                        );
                                                                    }}
                                                                >
                                                                    <Icon
                                                                        data={
                                                                            ChevronRight as IconData
                                                                        }
                                                                        size={14}
                                                                    />
                                                                </Button>
                                                            )}
                                                        </label>
                                                    );
                                                })
                                            )}
                                        </div>
                                    </div>
                                </>
                            );
                        })()}

                        <div
                            style={{
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "space-between",
                                gap: 12,
                                padding: "8px 12px",
                                borderRadius: 10,
                                border: "1px solid var(--g-color-line-generic)",
                                background: "#fff",
                            }}
                        >
                            <div
                                style={{
                                    minWidth: 0,
                                    display: "flex",
                                    flexDirection: "column",
                                    gap: 2,
                                }}
                            >
                                <Text variant="body-2" style={{ fontWeight: 600 }}>
                                    Выбрано: {selectedAvailableItems.length}
                                </Text>
                                {selectedAvailableItems.length > 0 && (
                                    <Text variant="caption-2" color="secondary" ellipsis>
                                        {selectedAvailableItems
                                            .slice(0, 3)
                                            .map((item) => item.name)
                                            .join(", ")}
                                        {selectedAvailableItems.length > 3
                                            ? ` и еще ${selectedAvailableItems.length - 3}`
                                            : ""}
                                    </Text>
                                )}
                            </div>
                            <Button
                                view="flat"
                                size="xs"
                                onClick={clearAllSelection}
                                disabled={selectedAvailableItems.length === 0}
                            >
                                Очистить
                            </Button>
                        </div>
                    </div>
                )}
            </AppDialog>
            )}
        </>
    );
};

export default HomeworkModal;
