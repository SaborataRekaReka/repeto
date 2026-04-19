import { useEffect, useMemo, useState } from "react";
import { useMediaQuery } from "react-responsive";
import { Card, Text, Button, Icon, Checkbox } from "@gravity-ui/uikit";
import { FolderOpen, PersonPlus, Ellipsis, ArrowUpRightFromSquare, ArrowsRotateRight } from "@gravity-ui/icons";
import type { IconData } from "@gravity-ui/uikit";
import { useStudents } from "@/hooks/useStudents";
import StudentAvatar from "@/components/StudentAvatar";
import {
    syncGoogleDriveFiles,
    syncGoogleDriveFolder,
    syncYandexDiskFiles,
    syncYandexDiskFolder,
} from "@/hooks/useFiles";
import type { CloudConnection, CloudProvider, FileItem } from "@/types/files";
import type { Student } from "@/types/student";
import { codedErrorMessage } from "@/lib/errorCodes";
import ShareModal from "./ShareModal";

const getChildItems = (allFiles: FileItem[], parentId: string | null) =>
    allFiles.filter((f) => f.parentId === parentId).sort((a, b) => {
        if (a.type !== b.type) return a.type === "folder" ? -1 : 1;
        return a.name.localeCompare(b.name, "ru");
    });

const getBreadcrumbPath = (allFiles: FileItem[], itemId: string | null) => {
    const path: FileItem[] = [];
    let currentId = itemId;
    while (currentId) {
        const current = allFiles.find((f) => f.id === currentId);
        if (!current) break;
        path.unshift(current);
        currentId = current.parentId;
    }
    return path;
};

const countChildren = (allFiles: FileItem[], folderId: string) =>
    allFiles.filter((f) => f.parentId === folderId).length;

const getFileIcon = (ext?: string) => {
    switch ((ext || "").toLowerCase()) {
        case "pdf": return "/images/pdf.svg";
        case "xlsx": case "xls": return "/images/xlsx.svg";
        case "doc": case "docx": return "/images/document.svg";
        default: return "/images/document.svg";
    }
};

const getProviderLabel = (provider: CloudProvider) =>
    provider === "google-drive" ? "Google Drive" : "Яндекс.Диск";

const getItemDisplayName = (item: FileItem) =>
    item.type === "folder" && item.parentId === null ? getProviderLabel(item.cloudProvider) : item.name;

const formatLastSynced = (value?: string | null) => {
    if (!value) return "—";
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? value : parsed.toLocaleString("ru-RU");
};

const FOLDER_STORAGE_KEY = "repeto-files-current-folder";
const SHOW_CLOUD_OVERVIEW_SECTION = false;

type FileBrowserProps = {
    files: FileItem[];
    cloudConnections: CloudConnection[];
    onUpdated?: () => Promise<void> | void;
};

const FileBrowser = ({ files, cloudConnections, onUpdated }: FileBrowserProps) => {
    const [currentFolderId, setCurrentFolderId] = useState<string | null>(() => {
        if (typeof window === "undefined") return null;
        try {
            return sessionStorage.getItem(FOLDER_STORAGE_KEY) || null;
        } catch {
            return null;
        }
    });
    const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
    const [shareTarget, setShareTarget] = useState<FileItem | null>(null);
    const [menuOpenId, setMenuOpenId] = useState<string | null>(null);
    const [syncingProvider, setSyncingProvider] = useState<"yandex-disk" | "google-drive" | null>(null);
    const [syncingFolderId, setSyncingFolderId] = useState<string | null>(null);
    const [syncingFolderProvider, setSyncingFolderProvider] = useState<"yandex-disk" | "google-drive" | null>(null);
    const [syncMsg, setSyncMsg] = useState<string | null>(null);
    const [selectedProvider, setSelectedProvider] = useState<CloudProvider | null>(null);
    const [mounted, setMounted] = useState(false);
    const isMobile = useMediaQuery({ query: "(max-width: 767px)" });
    const { data: studentsData } = useStudents({ limit: 100 });

    useEffect(() => { setMounted(true); }, []);

    const activeStudents = useMemo(
        () => (studentsData?.data || []).filter((s) => s.status === "active"),
        [studentsData]
    );

    useEffect(() => {
        try {
            if (currentFolderId) sessionStorage.setItem(FOLDER_STORAGE_KEY, currentFolderId);
            else sessionStorage.removeItem(FOLDER_STORAGE_KEY);
        } catch {
            // Private browsing
        }
    }, [currentFolderId]);

    useEffect(() => {
        if (currentFolderId && files.length > 0) {
            if (!files.some((f) => f.id === currentFolderId)) setCurrentFolderId(null);
        }
    }, [currentFolderId, files]);

    const items = useMemo(() => getChildItems(files, currentFolderId), [files, currentFolderId]);
    const breadcrumbs = useMemo(() => getBreadcrumbPath(files, currentFolderId), [files, currentFolderId]);
    const currentFolder = useMemo(
        () => files.find((f) => f.id === currentFolderId) || null,
        [files, currentFolderId],
    );
    const connectedProviders = useMemo(
        () => new Set(cloudConnections.filter((c) => c.connected).map((c) => c.provider)),
        [cloudConnections],
    );
    const connectedClouds = useMemo(
        () => cloudConnections.filter((c) => c.connected),
        [cloudConnections],
    );
    const rootFolderByProvider = useMemo(() => {
        const byProvider = new Map<CloudProvider, string>();
        for (const item of files) {
            if (item.type !== "folder" || item.parentId !== null) continue;
            if (!byProvider.has(item.cloudProvider)) {
                byProvider.set(item.cloudProvider, item.id);
            }
        }
        return byProvider;
    }, [files]);
    const activeProvider = currentFolder?.cloudProvider || selectedProvider || connectedClouds[0]?.provider || null;
    const activeCloud = useMemo(
        () => connectedClouds.find((cloud) => cloud.provider === activeProvider) || null,
        [connectedClouds, activeProvider],
    );
    const syncBusy = syncingProvider !== null || syncingFolderId !== null;
    const isProviderSyncing = (provider: "yandex-disk" | "google-drive") =>
        syncingProvider === provider || syncingFolderProvider === provider;

    useEffect(() => {
        if (connectedClouds.length === 0) {
            if (selectedProvider !== null) {
                setSelectedProvider(null);
            }
            return;
        }

        if (!selectedProvider || !connectedClouds.some((cloud) => cloud.provider === selectedProvider)) {
            setSelectedProvider(connectedClouds[0].provider);
        }
    }, [connectedClouds, selectedProvider]);

    const handleSwitchProvider = (provider: CloudProvider) => {
        setSelectedProvider(provider);
        const rootFolderId = rootFolderByProvider.get(provider);
        setCurrentFolderId(rootFolderId || null);
        setSelectedItems(new Set());
        setMenuOpenId(null);
    };

    const toggleSelect = (id: string) => {
        setSelectedItems((prev) => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id); else next.add(id);
            return next;
        });
    };

    const handleNavigate = async (item: FileItem) => {
        setSelectedProvider(item.cloudProvider);

        if (item.type === "folder") {
            setCurrentFolderId(item.id);
            setSelectedItems(new Set());
            setMenuOpenId(null);

            if (item.cloudProvider === "yandex-disk" && connectedProviders.has("yandex-disk")) {
                setSyncingFolderId(item.id);
                setSyncingFolderProvider("yandex-disk");
                setSyncMsg(null);
                try {
                    const result = await syncYandexDiskFolder(item.id);
                    await onUpdated?.();
                    setSyncMsg(`Папка синхронизирована: ${result.syncedItems} элементов`);
                } catch (e: any) {
                    setSyncMsg(codedErrorMessage("FILES-YDISK-SYNC-FOLDER", e));
                } finally {
                    setSyncingFolderId(null);
                    setSyncingFolderProvider(null);
                }
            }

            if (item.cloudProvider === "google-drive" && connectedProviders.has("google-drive")) {
                setSyncingFolderId(item.id);
                setSyncingFolderProvider("google-drive");
                setSyncMsg(null);
                try {
                    const result = await syncGoogleDriveFolder(item.id);
                    await onUpdated?.();
                    setSyncMsg(`Папка синхронизирована: ${result.syncedItems} элементов`);
                } catch (e: any) {
                    setSyncMsg(codedErrorMessage("FILES-GDRIVE-SYNC-FOLDER", e));
                } finally {
                    setSyncingFolderId(null);
                    setSyncingFolderProvider(null);
                }
            }

            return;
        }
        if (item.cloudUrl) window.open(item.cloudUrl, "_blank", "noopener,noreferrer");
    };

    const handleBulkShare = () => {
        const firstId = Array.from(selectedItems)[0];
        const item = items.find((i) => i.id === firstId);
        if (item) setShareTarget(item);
    };

    const handleSyncYandexDisk = async () => {
        setSyncingProvider("yandex-disk");
        setSyncMsg(null);
        try {
            const result = await syncYandexDiskFiles();
            await onUpdated?.();
            setSyncMsg(`Синхронизировано: ${result.syncedItems} элементов`);
        } catch (e: any) {
            setSyncMsg(codedErrorMessage("FILES-YDISK-SYNC", e));
        } finally {
            setSyncingProvider(null);
        }
    };

    const handleSyncGoogleDrive = async () => {
        setSyncingProvider("google-drive");
        setSyncMsg(null);
        try {
            const result = await syncGoogleDriveFiles();
            await onUpdated?.();
            setSyncMsg(`Синхронизировано: ${result.syncedItems} элементов`);
        } catch (e: any) {
            setSyncMsg(codedErrorMessage("FILES-GDRIVE-SYNC", e));
        } finally {
            setSyncingProvider(null);
        }
    };

    const handleSyncProvider = async (provider: CloudProvider) => {
        if (provider === "google-drive") {
            await handleSyncGoogleDrive();
            return;
        }
        await handleSyncYandexDisk();
    };

    const renderSyncButton = (
        provider: CloudProvider,
        view: "action" | "outlined" | "flat" = "outlined",
    ) => (
        <Button
            view={view}
            size="s"
            loading={isProviderSyncing(provider)}
            disabled={syncBusy && !isProviderSyncing(provider)}
            onClick={() => { void handleSyncProvider(provider); }}
            title={`Синхронизировать ${getProviderLabel(provider)}`}
            aria-label={`Синхронизировать ${getProviderLabel(provider)}`}
        >
            <Icon data={ArrowsRotateRight as IconData} size={16} />
        </Button>
    );

    return (
        <>
            {/* Toolbar */}
            <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 16, minWidth: 0 }}>
                {SHOW_CLOUD_OVERVIEW_SECTION && connectedClouds.length > 0 && (
                    <Card view="outlined" style={{ padding: "10px 12px", background: "var(--g-color-base-float)" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                            {connectedClouds.map((cloud) => (
                                <Button
                                    key={`variant-context-${cloud.provider}`}
                                    view={activeProvider === cloud.provider ? "action" : "flat"}
                                    size="s"
                                    onClick={() => handleSwitchProvider(cloud.provider)}
                                    disabled={!rootFolderByProvider.has(cloud.provider)}
                                >
                                    {cloud.label}
                                </Button>
                            ))}
                        </div>

                        {activeCloud && (
                            <div
                                style={{
                                    marginTop: 8,
                                    padding: "9px 11px",
                                    borderRadius: 10,
                                    border: "1px solid rgba(174, 122, 255, 0.34)",
                                    background: "linear-gradient(135deg, rgba(174, 122, 255, 0.22) 0%, rgba(143, 100, 245, 0.18) 55%, rgba(174, 122, 255, 0.14) 100%)",
                                    boxShadow: "0 6px 18px rgba(123, 88, 210, 0.14)",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "space-between",
                                    gap: 10,
                                    flexWrap: "wrap",
                                }}
                            >
                                <div style={{ minWidth: 0, flex: "1 1 280px" }}>
                                    <Text variant="body-1" style={{ display: "block", fontWeight: 600 }}>
                                        Активное облако: {activeCloud.label}
                                    </Text>
                                    <Text
                                        variant="caption-2"
                                        color="secondary"
                                        style={{
                                            display: "block",
                                            marginTop: 2,
                                            overflow: "hidden",
                                            textOverflow: "ellipsis",
                                            whiteSpace: "nowrap",
                                        }}
                                    >
                                        Корень: {activeCloud.rootPath || "/"} · {activeCloud.email || "без email"} · Последняя синхронизация: {formatLastSynced(activeCloud.lastSynced)}
                                    </Text>
                                </div>

                                {renderSyncButton(activeCloud.provider, "outlined")}
                            </div>
                        )}
                    </Card>
                )}

                {selectedItems.size > 0 && (
                    <div style={{ display: "flex", justifyContent: "flex-end" }}>
                        <Button view="action" size="m" onClick={handleBulkShare}>
                            <Icon data={PersonPlus as IconData} size={16} />
                            Поделиться ({selectedItems.size})
                        </Button>
                    </div>
                )}
            </div>

            {syncMsg && (
                <Text
                    variant="caption-2"
                    color={syncMsg.startsWith("Код ошибки") ? "danger" : "secondary"}
                    style={{ display: "block", marginBottom: 12 }}
                >
                    {syncMsg}
                </Text>
            )}

            {syncingFolderId && (
                <Text
                    variant="caption-2"
                    color="secondary"
                    style={{ display: "block", marginBottom: 12 }}
                >
                    Обновляем содержимое выбранной папки {syncingFolderProvider === "google-drive" ? "в Google Drive" : "в Яндекс.Диске"}...
                </Text>
            )}

            {/* Breadcrumbs */}
            <div style={{ display: "flex", alignItems: "center", gap: 4, marginBottom: 16, flexWrap: "wrap" }}>
                <button
                    onClick={() => { setCurrentFolderId(null); setSelectedItems(new Set()); }}
                    style={{
                        background: "none", border: "none", cursor: "pointer",
                        fontWeight: 600, fontSize: 14,
                        color: currentFolderId === null ? "var(--g-color-text-primary)" : "var(--g-color-text-secondary)",
                    }}
                >
                    Материалы
                </button>
                {currentFolderId !== null && activeProvider && (
                    <>
                        <span style={{ color: "var(--g-color-text-secondary)" }}>/</span>
                        <button
                            onClick={() => handleSwitchProvider(activeProvider)}
                            style={{
                                background: "none", border: "none", cursor: "pointer",
                                fontWeight: 600, fontSize: 14,
                                color: "var(--g-color-text-secondary)",
                            }}
                        >
                            {getProviderLabel(activeProvider)}
                        </button>
                    </>
                )}
                {breadcrumbs.map((bc) => (
                    <span key={bc.id} style={{ display: "flex", alignItems: "center", gap: 4 }}>
                        <span style={{ color: "var(--g-color-text-secondary)" }}>/</span>
                        <button
                            onClick={() => { void handleNavigate(bc); }}
                            style={{
                                background: "none", border: "none", cursor: "pointer",
                                fontWeight: 600, fontSize: 14,
                                color: bc.id === currentFolderId ? "var(--g-color-text-primary)" : "var(--g-color-text-secondary)",
                            }}
                        >
                            {bc.name}
                        </button>
                    </span>
                ))}
            </div>

            {/* Content */}
            {items.length === 0 ? (
                <Card view="outlined" style={{ padding: "48px 20px", textAlign: "center", background: "var(--g-color-base-float)" }}>
                    <div style={{ width: 64, height: 64, margin: "0 auto 16px", borderRadius: 16, background: "var(--g-color-base-generic)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <Icon data={FolderOpen as IconData} size={24} />
                    </div>
                    <Text variant="subheader-2" style={{ display: "block", marginBottom: 8 }}>Папка пуста</Text>
                    <Text variant="body-1" color="secondary">
                        В этой папке пока нет файлов. Добавьте файлы через облачное хранилище.
                    </Text>
                </Card>
            ) : (
                <Card view="outlined" style={{ background: "var(--g-color-base-float)", overflow: "visible" }}>
                    {mounted && !isMobile ? (
                        <table style={{ width: "100%", borderCollapse: "collapse", tableLayout: "fixed" }}>
                            <thead>
                                <tr style={{ borderBottom: "1px solid var(--g-color-line-generic)" }}>
                                    <th style={{ padding: "10px 12px", width: 32 }}></th>
                                    <th style={{ padding: "10px 20px", textAlign: "left", fontWeight: 500, fontSize: 13, color: "var(--g-color-text-secondary)" }}>Название</th>
                                    <th style={{ padding: "10px 20px", textAlign: "right", fontWeight: 500, fontSize: 13, color: "var(--g-color-text-secondary)", width: 80 }}>Размер</th>
                                    <th style={{ padding: "10px 20px", textAlign: "left", fontWeight: 500, fontSize: 13, color: "var(--g-color-text-secondary)", width: 100 }}>Изменён</th>
                                    <th style={{ padding: "10px 20px", textAlign: "left", fontWeight: 500, fontSize: 13, color: "var(--g-color-text-secondary)", width: 150 }}>Доступ</th>
                                    <th style={{ padding: "10px 12px", width: 40 }}></th>
                                </tr>
                            </thead>
                            <tbody>
                                {items.map((item) => (
                                    <tr
                                        key={item.id}
                                        style={{
                                            borderBottom: "1px solid var(--g-color-line-generic)",
                                            transition: "background 0.15s",
                                        }}
                                        onMouseEnter={(e) => (e.currentTarget.style.background = "var(--g-color-base-simple-hover)")}
                                        onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                                    >
                                        <td style={{ padding: "12px 12px" }}>
                                            <Checkbox
                                                checked={selectedItems.has(item.id)}
                                                onUpdate={() => toggleSelect(item.id)}
                                                size="m"
                                            />
                                        </td>
                                        <td style={{ padding: "12px 20px" }}>
                                            <button
                                                onClick={() => { void handleNavigate(item); }}
                                                style={{
                                                    background: "none", border: "none", cursor: "pointer",
                                                    width: "100%",
                                                    minWidth: 0,
                                                    display: "flex", alignItems: "center", gap: 12,
                                                    fontWeight: 600, fontSize: 14, textAlign: "left",
                                                    color: "var(--g-color-text-primary)",
                                                }}
                                            >
                                                <div style={{ width: 32, height: 32, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                                                    {item.type === "folder" ? (
                                                        <Icon data={FolderOpen as IconData} size={24} style={{ color: "var(--g-color-text-brand)" }} />
                                                    ) : (
                                                        <img src={getFileIcon(item.extension)} width={20} height={20} alt="" className="repeto-file-icon" />
                                                    )}
                                                </div>
                                                <span style={{ flex: "1 1 auto", minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                                    {getItemDisplayName(item)}
                                                </span>
                                                {item.type === "folder" && (
                                                    <span style={{ flexShrink: 0, marginLeft: 4, fontSize: 12, fontWeight: 600, color: "var(--g-color-text-secondary)" }}>
                                                        {countChildren(files, item.id)}
                                                    </span>
                                                )}
                                            </button>
                                        </td>
                                        <td style={{ padding: "12px 20px", textAlign: "right" }}>
                                            <Text variant="caption-2" color="secondary">{item.size || "—"}</Text>
                                        </td>
                                        <td style={{ padding: "12px 20px" }}>
                                            <Text variant="caption-2" color="secondary">{item.modifiedAt}</Text>
                                        </td>
                                        <td style={{ padding: "12px 20px" }}>
                                            <SharedBadge item={item} students={activeStudents} />
                                        </td>
                                        <td style={{ padding: "12px 12px", position: "relative" }}>
                                            <button
                                                onClick={(e) => { e.stopPropagation(); setMenuOpenId(menuOpenId === item.id ? null : item.id); }}
                                                style={{
                                                    background: "none", border: "none", cursor: "pointer",
                                                    padding: 6, borderRadius: 6, display: "flex",
                                                    color: "var(--g-color-text-secondary)",
                                                }}
                                            >
                                                <Icon data={Ellipsis as IconData} size={16} />
                                            </button>
                                            {menuOpenId === item.id && (
                                                <ItemMenu
                                                    item={item}
                                                    onShare={() => { setShareTarget(item); setMenuOpenId(null); }}
                                                    onClose={() => setMenuOpenId(null)}
                                                />
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    ) : (
                        items.map((item) => (
                            <div
                                key={item.id}
                                style={{
                                    display: "flex", alignItems: "center",
                                    padding: "12px 16px",
                                    borderTop: "1px solid var(--g-color-line-generic)",
                                }}
                            >
                                <button
                                    onClick={() => { void handleNavigate(item); }}
                                    style={{
                                        background: "none", border: "none", cursor: "pointer",
                                        display: "flex", alignItems: "center", flex: 1, minWidth: 0, marginRight: 12, textAlign: "left",
                                    }}
                                >
                                    <div style={{ width: 32, height: 32, marginRight: 12, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                                        {item.type === "folder" ? (
                                            <Icon data={FolderOpen as IconData} size={24} style={{ color: "var(--g-color-text-brand)" }} />
                                        ) : (
                                            <img src={getFileIcon(item.extension)} width={20} height={20} alt="" />
                                        )}
                                    </div>
                                    <div style={{ minWidth: 0 }}>
                                        <Text variant="body-1" style={{ fontWeight: 600, display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{getItemDisplayName(item)}</Text>
                                        <Text variant="caption-2" color="secondary">
                                            {item.type === "folder"
                                                ? `${countChildren(files, item.id)} файлов`
                                                : `${item.size || "—"} · ${item.modifiedAt}`}
                                        </Text>
                                    </div>
                                </button>
                                <SharedBadge item={item} compact students={activeStudents} />
                                <button
                                    onClick={() => setShareTarget(item)}
                                    style={{
                                        background: "none", border: "none", cursor: "pointer",
                                        padding: 6, borderRadius: 6, display: "flex", marginLeft: 8, flexShrink: 0,
                                        color: "var(--g-color-text-secondary)",
                                    }}
                                >
                                    <Icon data={PersonPlus as IconData} size={16} />
                                </button>
                            </div>
                        ))
                    )}
                </Card>
            )}

            <ShareModal
                visible={!!shareTarget}
                item={shareTarget}
                onClose={() => setShareTarget(null)}
                onSaved={onUpdated}
            />
        </>
    );
};

/* --- SharedBadge --- */
const SharedBadge = ({
    item, compact, students,
}: {
    item: FileItem; compact?: boolean;
    students: Array<Pick<Student, "id" | "name" | "subject" | "avatarUrl" | "avatarEmoji" | "avatarBackground">>;
}) => {
    if (item.sharedWith.length === 0) {
        return <Text variant="caption-2" color="secondary">{compact ? "" : "Только я"}</Text>;
    }
    const matched = students.filter((s) => item.sharedWith.includes(s.id));
    const shown = matched.slice(0, compact ? 2 : 3);
    const rest = matched.length - shown.length;
    const sz = compact ? 24 : 28;
    const avatarSize = compact ? "xs" : "s";

    return (
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            {shown.map((s) => (
                <div key={s.id} title={s.name} style={{ flexShrink: 0 }}>
                    <StudentAvatar
                        student={s}
                        size={avatarSize}
                        style={{ border: "2px solid var(--g-color-base-float)" }}
                    />
                </div>
            ))}
            {rest > 0 && (
                <div style={{
                    width: sz, height: sz, borderRadius: "50%",
                    background: "var(--g-color-base-generic)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 11, fontWeight: 700, color: "var(--g-color-text-secondary)",
                    flexShrink: 0,
                }}>
                    +{rest}
                </div>
            )}
        </div>
    );
};

/* --- ItemMenu --- */
const ItemMenu = ({
    item, onShare, onClose,
}: {
    item: FileItem; onShare: () => void; onClose: () => void;
}) => (
    <div
        style={{
            position: "absolute", top: "100%", right: 0, marginTop: 4,
            width: 220, padding: 4, borderRadius: 8,
            background: "var(--g-color-base-float)", border: "1px solid var(--g-color-line-generic)",
            boxShadow: "0 4px 24px rgba(0,0,0,0.08)", zIndex: 50,
        }}
    >
        <button
            onClick={onShare}
            style={{
                display: "flex", alignItems: "center", width: "100%",
                padding: "8px 12px", borderRadius: 6, border: "none",
                background: "none", cursor: "pointer", fontSize: 14, fontWeight: 600,
                color: "var(--g-color-text-primary)",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "var(--g-color-base-simple-hover)")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
        >
            <Icon data={PersonPlus as IconData} size={16} style={{ marginRight: 8 }} />
            Управление доступом
        </button>
        <button
            onClick={() => {
                if (!item.cloudUrl) return;
                window.open(item.cloudUrl, "_blank", "noopener,noreferrer");
                onClose();
            }}
            disabled={!item.cloudUrl}
            style={{
                display: "flex", alignItems: "center", width: "100%",
                padding: "8px 12px", borderRadius: 6, border: "none",
                background: "none", cursor: item.cloudUrl ? "pointer" : "not-allowed",
                fontSize: 14, fontWeight: 600,
                color: item.cloudUrl ? "var(--g-color-text-primary)" : "var(--g-color-text-secondary)",
                opacity: item.cloudUrl ? 1 : 0.5,
            }}
            onMouseEnter={(e) => { if (item.cloudUrl) e.currentTarget.style.background = "var(--g-color-base-simple-hover)"; }}
            onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
        >
            <Icon data={ArrowUpRightFromSquare as IconData} size={16} style={{ marginRight: 8 }} />
            Открыть в облаке
        </button>
    </div>
);

export default FileBrowser;
