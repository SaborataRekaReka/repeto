import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/router";
import { Button, Checkbox, Icon, Text, TextInput } from "@gravity-ui/uikit";
import { ChevronDown, ChevronRight, File, Folder } from "@gravity-ui/icons";
import type { IconData } from "@gravity-ui/uikit";
import AppDialog from "@/components/AppDialog";
import type { HomeworkFile } from "@/mocks/student-details";
import type { CloudProvider } from "@/types/files";

type MaterialsPickerDialogProps = {
    open: boolean;
    onClose: () => void;
    selectedFiles: HomeworkFile[];
    availableFiles?: HomeworkFile[];
    connectedProviders?: CloudProvider[];
    defaultProvider?: CloudProvider;
    onApply: (files: HomeworkFile[]) => void;
    caption?: string;
};

const ROOT_FOLDER_ID = "ROOT";

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

const makeSelectionKey = (provider: CloudProvider, itemId: string) =>
    `${provider}:${itemId}`;

const MaterialsPickerDialog = ({
    open,
    onClose,
    selectedFiles,
    availableFiles = [],
    connectedProviders = [],
    defaultProvider,
    onApply,
    caption = "Выбор материалов",
}: MaterialsPickerDialogProps) => {
    const router = useRouter();

    const [draftSelectedKeys, setDraftSelectedKeys] = useState<string[]>([]);
    const [openAccordions, setOpenAccordions] = useState<CloudProvider[]>([]);
    const [providerSearch, setProviderSearch] = useState<
        Partial<Record<CloudProvider, string>>
    >({});
    const [currentFolderByProvider, setCurrentFolderByProvider] = useState<
        Partial<Record<CloudProvider, string | null>>
    >({});

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
    }, [connectedProviders, normalizedAvailableFiles, defaultProvider]);

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
        [draftSelectedKeys],
    );

    const selectedAvailableItems = useMemo(() => {
        return draftSelectedKeys
            .map((key) => fileBySelectionKey.get(key))
            .filter((item): item is HomeworkFile => !!item);
    }, [draftSelectedKeys, fileBySelectionKey]);

    useEffect(() => {
        if (!open) {
            return;
        }

        setDraftSelectedKeys(
            selectedFiles
                .map((file) => {
                    if (file.provider) {
                        const directKey = makeSelectionKey(file.provider, file.id);
                        if (fileBySelectionKey.has(directKey)) {
                            return directKey;
                        }
                    }

                    const fallback = normalizedAvailableFiles.find(
                        (available) => available.id === file.id,
                    );

                    if (fallback?.provider) {
                        return makeSelectionKey(fallback.provider, fallback.id);
                    }

                    return null;
                })
                .filter((key): key is string => !!key),
        );

            setOpenAccordions(pickerProviders[0] ? [pickerProviders[0]] : []);
        setProviderSearch({});
        setCurrentFolderByProvider(
            pickerProviders.reduce<Partial<Record<CloudProvider, string | null>>>(
                (acc, provider) => {
                    acc[provider] = providerRootFolderIdByProvider.get(provider) || null;
                    return acc;
                },
                {},
            ),
        );
    }, [
        open,
        selectedFiles,
        fileBySelectionKey,
        normalizedAvailableFiles,
        pickerProviders,
        providerRootFolderIdByProvider,
    ]);

    useEffect(() => {
        if (!open || pickerProviders.length === 0) {
            return;
        }

        setOpenAccordions((prev) => {
            const filtered = prev.filter((provider) =>
                pickerProviders.includes(provider),
            );

            if (filtered.length > 0) {
                return filtered;
            }

            return pickerProviders[0] ? [pickerProviders[0]] : [];
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
    }, [open, pickerProviders, providerRootFolderIdByProvider]);

    const toggleAccordion = (provider: CloudProvider) => {
        setOpenAccordions((prev) =>
            prev.includes(provider)
                ? prev.filter((value) => value !== provider)
                : [provider],
        );
    };

    const toggleDraftItem = (
        provider: CloudProvider,
        item: HomeworkFile,
        checked: boolean,
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
        const providerMeta = providerMetaByProvider.get(provider);
        const query = (providerSearch[provider] || "").trim().toLowerCase();

        if (query) {
            return providerItems.filter((item) =>
                item.name.toLowerCase().includes(query),
            );
        }

        const currentFolderId = currentFolderByProvider[provider] || null;
        const parentKey = currentFolderId || ROOT_FOLDER_ID;
        const children = providerMeta?.childrenByParent.get(parentKey) || [];

        if (children.length > 0) {
            return children;
        }

        if (!currentFolderId) {
            return children;
        }

        // Fallback for providers with synthetic root folders (e.g. "Мой диск").
        const syntheticRootId = providerRootFolderIdByProvider.get(provider) || null;
        if (currentFolderId === syntheticRootId) {
            const rootItems = providerMeta?.childrenByParent.get(ROOT_FOLDER_ID) || [];
            const withoutSyntheticRoot = rootItems.filter((item) => item.id !== syntheticRootId);
            if (withoutSyntheticRoot.length > 0) {
                return withoutSyntheticRoot;
            }
        }

        return children;
    };

    const selectAllInProvider = (provider: CloudProvider) => {
        const visibleItems = getProviderVisibleItems(provider);
        setDraftSelectedKeys((prev) => {
            const next = new Set(prev);
            visibleItems.forEach((item) =>
                next.add(makeSelectionKey(provider, item.id)),
            );
            return Array.from(next);
        });
    };

    const clearAllInProvider = (provider: CloudProvider) => {
        const visibleKeys = new Set(
            getProviderVisibleItems(provider).map((item) =>
                makeSelectionKey(provider, item.id),
            ),
        );

        setDraftSelectedKeys((prev) =>
            prev.filter((key) => !visibleKeys.has(key)),
        );
    };

    const clearAllSelection = () => {
        setDraftSelectedKeys([]);
    };

    const openFolder = (provider: CloudProvider, folderId: string) => {
        setProviderSearch((prev) => ({
            ...prev,
            [provider]: "",
        }));
        setOpenAccordions([provider]);
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

        const manualFiles = selectedFiles.filter(
            (file) =>
                !normalizedAvailableFiles.some(
                    (available) =>
                        available.id === file.id &&
                        available.provider === file.provider,
                ),
        );

        onApply([...manualFiles, ...selectedItems]);
        onClose();
    };

    return (
        <AppDialog
            size="s"
            open={open}
            onClose={onClose}
            caption={caption}
            footer={{
                onClickButtonApply: applyPickerSelection,
                textButtonApply:
                    selectedAvailableItems.length > 0
                        ? `Готово (${selectedAvailableItems.length})`
                        : "Готово",
                onClickButtonCancel: onClose,
                textButtonCancel: "Отмена",
            }}
        >
            {connectedProviders.length === 0 ? (
                <div
                    style={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        textAlign: "center",
                        padding: "24px 16px",
                        gap: 14,
                    }}
                >
                    <div
                        style={{
                            width: 56,
                            height: 56,
                            borderRadius: 16,
                            background: "var(--g-color-base-info-light)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                        }}
                    >
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
                        padding: 0,
                        borderRadius: 0,
                        background: "transparent",
                        overflowX: "hidden",
                    }}
                >
                    {pickerProviders.map((provider) => {
                        const providerItems = itemsByProvider.get(provider) || [];
                        const isOpen = openAccordions.includes(provider);
                        const visibleItems = getProviderVisibleItems(provider);
                        const visibleSelectedCount = visibleItems.reduce((count, item) => {
                            const key = makeSelectionKey(provider, item.id);
                            return count + (selectedDraftKeySet.has(key) ? 1 : 0);
                        }, 0);
                        const allVisibleSelected =
                            visibleItems.length > 0 &&
                            visibleSelectedCount === visibleItems.length;
                        const currentFolderId = currentFolderByProvider[provider] || null;
                        const providerRootFolderId =
                            providerRootFolderIdByProvider.get(provider) || null;
                        const breadcrumbs = buildProviderBreadcrumbs(provider);
                        const showBreadcrumbs = Boolean(
                            currentFolderId && currentFolderId !== providerRootFolderId,
                        );
                        const isEmpty = providerItems.length === 0;

                        return (
                            <div
                                key={provider}
                                style={{
                                    border: "1px solid var(--g-color-line-generic)",
                                    borderRadius: 12,
                                    overflow: "hidden",
                                    background: "#fff",
                                    maxWidth: "100%",
                                }}
                            >
                                <button
                                    type="button"
                                    onClick={() => {
                                        if (!isEmpty) {
                                            toggleAccordion(provider);
                                        }
                                    }}
                                    style={{
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "space-between",
                                        width: "100%",
                                        border: "none",
                                        background: "#fff",
                                        padding: "12px 14px",
                                        cursor: isEmpty ? "default" : "pointer",
                                        textAlign: "left",
                                    }}
                                >
                                    <div style={{ minWidth: 0 }}>
                                        <Text variant="subheader-2">{providerLabel(provider)}</Text>
                                        {isEmpty && (
                                            <Text variant="caption-2" color="secondary">
                                                Пусто
                                            </Text>
                                        )}
                                    </div>

                                    <Icon
                                        data={ChevronDown as IconData}
                                        size={14}
                                        style={{
                                            transform: isOpen
                                                ? "rotate(180deg)"
                                                : "rotate(0deg)",
                                            opacity: isEmpty ? 0.4 : 1,
                                            transition: "transform 120ms ease",
                                        }}
                                    />
                                </button>

                                {!isEmpty && (
                                    <div
                                        aria-hidden={!isOpen}
                                        style={{
                                            borderTop: "1px solid var(--g-color-line-generic)",
                                            background: "#fff",
                                            maxHeight: isOpen ? 560 : 0,
                                            opacity: isOpen ? 1 : 0,
                                            overflow: "hidden",
                                            pointerEvents: isOpen ? "auto" : "none",
                                            transition:
                                                "max-height 260ms cubic-bezier(0.2, 0, 0, 1), opacity 180ms ease",
                                        }}
                                    >
                                        <div
                                            style={{
                                                transform: isOpen
                                                    ? "translateY(0)"
                                                    : "translateY(-6px)",
                                                transition: "transform 240ms ease",
                                            }}
                                        >
                                            <div
                                                style={{
                                                    display: "flex",
                                                    gap: 8,
                                                    padding: "10px 14px",
                                                    borderBottom:
                                                        "1px solid var(--g-color-line-generic)",
                                                    flexWrap: "wrap",
                                                    alignItems: "center",
                                                    minWidth: 0,
                                                }}
                                            >
                                                <TextInput
                                                    value={providerSearch[provider] || ""}
                                                    onUpdate={(value) =>
                                                        setProviderSearchValue(provider, value)
                                                    }
                                                    size="m"
                                                    placeholder="Поиск по файлам..."
                                                    hasClear
                                                    style={{ flex: 1, minWidth: 0 }}
                                                />

                                                <Checkbox
                                                    size="m"
                                                    checked={allVisibleSelected}
                                                    disabled={visibleItems.length === 0}
                                                    onUpdate={(checked) => {
                                                        if (checked) {
                                                            selectAllInProvider(provider);
                                                        } else {
                                                            clearAllInProvider(provider);
                                                        }
                                                    }}
                                                >
                                                    <span
                                                        style={{
                                                            fontSize: 13,
                                                            color: "var(--g-color-text-secondary)",
                                                        }}
                                                    >
                                                        Выбрать все
                                                    </span>
                                                </Checkbox>

                                                <Text variant="caption-2" color="secondary">
                                                    {visibleSelectedCount} из {visibleItems.length}
                                                </Text>
                                            </div>

                                            {showBreadcrumbs && (
                                                <div
                                                    style={{
                                                        display: "flex",
                                                        alignItems: "center",
                                                        gap: 4,
                                                        flexWrap: "wrap",
                                                        padding: "8px 14px 6px",
                                                        borderBottom:
                                                            "1px solid var(--g-color-line-generic)",
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
                                                            fontWeight: 500,
                                                            color: "var(--g-color-text-primary)",
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
                                                            <Text
                                                                variant="caption-2"
                                                                color="secondary"
                                                            >
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
                                                                            }),
                                                                        )
                                                                    }
                                                                    style={{
                                                                        border: "none",
                                                                        background: "none",
                                                                        padding: "2px 4px",
                                                                        cursor: "pointer",
                                                                        fontSize: 13,
                                                                        fontWeight: 500,
                                                                        color: "var(--g-color-text-primary)",
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
                                                            item.id,
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
                                                                    transition: "background 80ms ease",
                                                                    minWidth: 0,
                                                                }}
                                                            >
                                                                <Checkbox
                                                                    size="m"
                                                                    checked={isSelected}
                                                                    onUpdate={(checked) =>
                                                                        toggleDraftItem(
                                                                            provider,
                                                                            item,
                                                                            checked,
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
                                                                        color: "var(--g-color-text-primary)",
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
                                                                                    item.id,
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
                                                                                    fontWeight: 400,
                                                                                    color: "var(--g-color-text-primary)",
                                                                                }}
                                                                                ellipsis
                                                                            >
                                                                                {item.name}
                                                                            </Text>
                                                                        </button>
                                                                    ) : (
                                                                        <Text variant="body-2" ellipsis>
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
                                                                                item.id,
                                                                            );
                                                                        }}
                                                                    >
                                                                        <Icon
                                                                            data={ChevronRight as IconData}
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
                                    </div>
                                )}
                            </div>
                        );
                    })}

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
    );
};

export default MaterialsPickerDialog;
