import { useMemo, useState } from "react";
import { Card, Text, Icon } from "@gravity-ui/uikit";
import { File as FileIcon, Folder as FolderIcon, ArrowUpRightFromSquare, ChevronRight } from "@gravity-ui/icons";
import type { IconData } from "@gravity-ui/uikit";
import type { PortalFile, PortalHomework } from "@/types/student-portal";

type MaterialsTabProps = {
    files: PortalFile[];
    homework: PortalHomework[];
};

const FileRow = ({ file }: { file: PortalFile }) => (
    <a
        href={file.cloudUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="repeto-portal-file-row"
        style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 16px", textDecoration: "none", transition: "background 0.12s" }}
    >
        <div style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 0 }}>
            <Icon data={FileIcon as IconData} size={20} />
            <div style={{ minWidth: 0 }}>
                <Text variant="body-1" ellipsis style={{ fontWeight: 600 }}>{file.name}</Text>
                {file.size && <Text variant="caption-1" color="secondary" as="div">{file.size}</Text>}
            </div>
        </div>
        <Icon data={ArrowUpRightFromSquare as IconData} size={16} style={{ flexShrink: 0, marginLeft: 12 }} />
    </a>
);

const FolderRow = ({ folder, onClick }: { folder: PortalFile; onClick: () => void }) => (
    <button
        onClick={onClick}
        className="repeto-portal-file-row"
        style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%", padding: "12px 16px", textAlign: "left", background: "none", border: "none", cursor: "pointer", transition: "background 0.12s" }}
    >
        <div style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 0 }}>
            <Icon data={FolderIcon as IconData} size={20} style={{ color: "var(--g-color-text-brand)" }} />
            <Text variant="body-1" ellipsis style={{ fontWeight: 600 }}>{folder.name}</Text>
        </div>
        <Icon data={ChevronRight as IconData} size={16} style={{ flexShrink: 0, marginLeft: 12, color: "var(--g-color-text-secondary)" }} />
    </button>
);

const MaterialsTab = ({ files, homework }: MaterialsTabProps) => {
    const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);

    // Build breadcrumb path
    const breadcrumbs = useMemo(() => {
        const crumbs: Array<{ id: string | null; name: string }> = [];
        let id = currentFolderId;
        while (id) {
            const item = files.find((f) => f.id === id);
            if (!item) break;
            crumbs.unshift({ id: item.id, name: item.name });
            id = item.parentId;
        }
        return crumbs;
    }, [currentFolderId, files]);

    // Items in current folder
    const currentItems = useMemo(() => {
        if (currentFolderId) {
            return files
                .filter((f) => f.parentId === currentFolderId)
                .sort((a, b) => {
                    if (a.type !== b.type)
                        return a.type === "folder" ? -1 : 1;
                    return a.name.localeCompare(b.name);
                });
        }
        // Root: show top-level shared items (parentId === null)
        return files
            .filter((f) => f.parentId === null && !f.homeworkId)
            .sort((a, b) => {
                if (a.type !== b.type) return a.type === "folder" ? -1 : 1;
                return a.name.localeCompare(b.name);
            });
    }, [files, currentFolderId]);

    // Homework files
    const fromHomework = useMemo(() => {
        const hwFiles: { file: PortalFile; taskLabel: string }[] = [];
        const seen = new Set<string>();
        homework.forEach((h) => {
            if (h.linkedFiles) {
                h.linkedFiles.forEach((f) => {
                    if (!seen.has(f.id)) {
                        seen.add(f.id);
                        hwFiles.push({ file: f, taskLabel: h.task });
                    }
                });
            }
        });
        return hwFiles;
    }, [homework]);

    if (files.length === 0 && fromHomework.length === 0) {
        return (
            <Card view="outlined" style={{ padding: "40px 24px", textAlign: "center" }}>
                <Text variant="subheader-2" as="div" style={{ marginBottom: 4 }}>Нет материалов</Text>
                <Text variant="body-1" color="secondary">
                    Репетитор пока не поделился материалами. Попросите его добавить файлы в Repeto.
                </Text>
            </Card>
        );
    }

    return (
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
            {/* Homework files */}
            {!currentFolderId && fromHomework.length > 0 && (
                <Card view="outlined" style={{ overflow: "hidden" }}>
                    <div className="repeto-card-header">
                        <Text variant="subheader-2">Из домашних заданий</Text>
                    </div>
                    {fromHomework.map(({ file, taskLabel }, i) => (
                        <a
                            key={file.id}
                            href={file.cloudUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="repeto-portal-file-row"
                            style={{
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "space-between",
                                padding: "12px 16px",
                                textDecoration: "none",
                                transition: "background 0.12s",
                                borderTop: i > 0 ? "1px solid var(--g-color-line-generic)" : undefined,
                            }}
                        >
                            <div style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 0 }}>
                                <Icon data={FileIcon as IconData} size={20} />
                                <div style={{ minWidth: 0 }}>
                                    <Text variant="body-1" ellipsis style={{ fontWeight: 600 }}>{file.name}</Text>
                                    <Text variant="caption-1" color="secondary" ellipsis as="div">{taskLabel}</Text>
                                </div>
                            </div>
                            <Icon data={ArrowUpRightFromSquare as IconData} size={16} style={{ flexShrink: 0, marginLeft: 12 }} />
                        </a>
                    ))}
                </Card>
            )}

            {/* File browser */}
            <Card view="outlined" style={{ overflow: "hidden" }}>
                {/* Breadcrumbs */}
                {currentFolderId && (
                    <div style={{ display: "flex", alignItems: "center", gap: 4, padding: "12px 16px 8px", flexWrap: "wrap" }}>
                        <button
                            style={{ fontWeight: 600, color: "var(--g-color-text-brand)", background: "none", border: "none", cursor: "pointer", fontSize: 12 }}
                            onClick={() => setCurrentFolderId(null)}
                        >
                            Материалы
                        </button>
                        {breadcrumbs.map((crumb) => (
                            <span key={crumb.id} style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 12 }}>
                                <Text variant="caption-1" color="secondary">/</Text>
                                {crumb.id === currentFolderId ? (
                                    <Text variant="caption-1" style={{ fontWeight: 600 }}>{crumb.name}</Text>
                                ) : (
                                    <button
                                        style={{ fontWeight: 600, color: "var(--g-color-text-brand)", background: "none", border: "none", cursor: "pointer", fontSize: 12 }}
                                        onClick={() => setCurrentFolderId(crumb.id)}
                                    >
                                        {crumb.name}
                                    </button>
                                )}
                            </span>
                        ))}
                    </div>
                )}

                {currentItems.length === 0 ? (
                    <div style={{ padding: "32px 16px", textAlign: "center" }}>
                        <Text variant="body-1" color="secondary">Папка пуста</Text>
                    </div>
                ) : (
                    currentItems.map((item, i) => (
                        <div
                            key={item.id}
                            style={{ borderTop: i > 0 ? "1px solid var(--g-color-line-generic)" : undefined }}
                        >
                            {item.type === "folder" ? (
                                <FolderRow folder={item} onClick={() => setCurrentFolderId(item.id)} />
                            ) : (
                                <FileRow file={item} />
                            )}
                        </div>
                    ))
                )}
            </Card>
        </div>
    );
};

export default MaterialsTab;
