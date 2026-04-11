import { useEffect, useMemo, useState } from "react";
import { useMediaQuery } from "react-responsive";
import { Card, Text, Button, Icon, Checkbox } from "@gravity-ui/uikit";
import { FolderOpen, PersonPlus, Ellipsis, ArrowUpRightFromSquare, CircleCheck } from "@gravity-ui/icons";
import type { IconData } from "@gravity-ui/uikit";
import { getInitials } from "@/mocks/students";
import { useStudents } from "@/hooks/useStudents";
import type { CloudConnection, FileItem } from "@/types/files";
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

const FOLDER_STORAGE_KEY = "repeto-files-current-folder";

type FileBrowserProps = {
    files: FileItem[];
    cloudConnections: CloudConnection[];
    onUpdated?: () => Promise<void> | void;
};

const FileBrowser = ({ files, cloudConnections, onUpdated }: FileBrowserProps) => {
    const [currentFolderId, setCurrentFolderId] = useState<string | null>(() => {
        if (typeof window === "undefined") return null;
        return sessionStorage.getItem(FOLDER_STORAGE_KEY) || null;
    });
    const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
    const [shareTarget, setShareTarget] = useState<FileItem | null>(null);
    const [menuOpenId, setMenuOpenId] = useState<string | null>(null);
    const [mounted, setMounted] = useState(false);
    const isMobile = useMediaQuery({ query: "(max-width: 767px)" });
    const { data: studentsData } = useStudents({ limit: 100 });

    useEffect(() => { setMounted(true); }, []);

    const activeStudents = useMemo(
        () => (studentsData?.data || []).filter((s) => s.status === "active"),
        [studentsData]
    );

    useEffect(() => {
        if (currentFolderId) sessionStorage.setItem(FOLDER_STORAGE_KEY, currentFolderId);
        else sessionStorage.removeItem(FOLDER_STORAGE_KEY);
    }, [currentFolderId]);

    useEffect(() => {
        if (currentFolderId && files.length > 0) {
            if (!files.some((f) => f.id === currentFolderId)) setCurrentFolderId(null);
        }
    }, [currentFolderId, files]);

    const items = useMemo(() => getChildItems(files, currentFolderId), [files, currentFolderId]);
    const breadcrumbs = useMemo(() => getBreadcrumbPath(files, currentFolderId), [files, currentFolderId]);
    const connectedCloud = cloudConnections.find((c) => c.connected);

    const toggleSelect = (id: string) => {
        setSelectedItems((prev) => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id); else next.add(id);
            return next;
        });
    };

    const handleNavigate = (item: FileItem) => {
        if (item.type === "folder") {
            setCurrentFolderId(item.id);
            setSelectedItems(new Set());
            setMenuOpenId(null);
            return;
        }
        if (item.cloudUrl) window.open(item.cloudUrl, "_blank", "noopener,noreferrer");
    };

    const handleBulkShare = () => {
        const firstId = Array.from(selectedItems)[0];
        const item = items.find((i) => i.id === firstId);
        if (item) setShareTarget(item);
    };

    return (
        <>
            {/* Toolbar */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
                {connectedCloud ? (
                    <Card view="outlined" style={{ padding: "10px 16px", display: "inline-flex", alignItems: "center", gap: 12, background: "var(--g-color-base-float)" }}>
                        <div style={{
                            width: 32, height: 32, borderRadius: "50%",
                            background: "#2ca84a", display: "flex", alignItems: "center", justifyContent: "center",
                        }}>
                            <Icon data={CircleCheck as IconData} size={16} style={{ color: "#fff" }} />
                        </div>
                        <div>
                            <Text variant="body-1" style={{ fontWeight: 600, display: "block" }}>{connectedCloud.label}</Text>
                            <Text variant="caption-2" color="secondary">{connectedCloud.rootPath} · {connectedCloud.email || "без email"}</Text>
                        </div>
                    </Card>
                ) : <div />}
                {selectedItems.size > 0 && (
                    <Button view="action" size="m" onClick={handleBulkShare}>
                        <Icon data={PersonPlus as IconData} size={16} />
                        Поделиться ({selectedItems.size})
                    </Button>
                )}
            </div>

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
                {breadcrumbs.map((bc) => (
                    <span key={bc.id} style={{ display: "flex", alignItems: "center", gap: 4 }}>
                        <span style={{ color: "var(--g-color-text-secondary)" }}>/</span>
                        <button
                            onClick={() => { setCurrentFolderId(bc.id); setSelectedItems(new Set()); }}
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
                <Card view="outlined" style={{ background: "var(--g-color-base-float)", overflow: "hidden" }}>
                    {mounted && !isMobile ? (
                        <table style={{ width: "100%", borderCollapse: "collapse" }}>
                            <thead>
                                <tr style={{ borderBottom: "1px solid var(--g-color-line-generic)" }}>
                                    <th style={{ padding: "10px 12px", width: 32 }}></th>
                                    <th style={{ padding: "10px 20px", textAlign: "left", fontWeight: 500, fontSize: 13, color: "var(--g-color-text-secondary)" }}>Название</th>
                                    <th style={{ padding: "10px 20px", textAlign: "right", fontWeight: 500, fontSize: 13, color: "var(--g-color-text-secondary)", width: 80 }}>Размер</th>
                                    <th style={{ padding: "10px 20px", textAlign: "left", fontWeight: 500, fontSize: 13, color: "var(--g-color-text-secondary)", width: 100 }}>Изменён</th>
                                    <th style={{ padding: "10px 20px", textAlign: "left", fontWeight: 500, fontSize: 13, color: "var(--g-color-text-secondary)", width: 120 }}>Доступ</th>
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
                                                onClick={() => handleNavigate(item)}
                                                style={{
                                                    background: "none", border: "none", cursor: "pointer",
                                                    display: "flex", alignItems: "center", gap: 12,
                                                    fontWeight: 600, fontSize: 14, textAlign: "left",
                                                    color: "var(--g-color-text-primary)",
                                                }}
                                            >
                                                <div style={{ width: 32, height: 32, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                                                    {item.type === "folder" ? (
                                                        <Icon data={FolderOpen as IconData} size={24} style={{ color: "var(--g-color-text-brand)" }} />
                                                    ) : (
                                                        <img src={getFileIcon(item.extension)} width={20} height={20} alt="" className="repeto-file-icon" className="repeto-file-icon" />
                                                    )}
                                                </div>
                                                <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                                    {item.name}
                                                </span>
                                                {item.type === "folder" && (
                                                    <span style={{ marginLeft: 4, fontSize: 12, fontWeight: 600, color: "var(--g-color-text-secondary)" }}>
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
                                    onClick={() => handleNavigate(item)}
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
                                        <Text variant="body-1" style={{ fontWeight: 600, display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.name}</Text>
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
    students: Array<{ id: string; name: string; subject: string }>;
}) => {
    if (item.sharedWith.length === 0) {
        return <Text variant="caption-2" color="secondary">{compact ? "" : "Только я"}</Text>;
    }
    const matched = students.filter((s) => item.sharedWith.includes(s.id));
    const shown = matched.slice(0, compact ? 2 : 3);
    const rest = matched.length - shown.length;
    const sz = compact ? 24 : 28;

    return (
        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
            {shown.map((s) => (
                <div
                    key={s.id}
                    title={s.name}
                    style={{
                        width: sz, height: sz, borderRadius: "50%",
                        background: "rgba(174,122,255,0.1)",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: 11, fontWeight: 700, color: "var(--g-color-text-brand)",
                    }}
                >
                    {getInitials(s.name)}
                </div>
            ))}
            {rest > 0 && (
                <div style={{
                    width: sz, height: sz, borderRadius: "50%",
                    background: "var(--g-color-base-generic)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 11, fontWeight: 700, color: "var(--g-color-text-secondary)",
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
