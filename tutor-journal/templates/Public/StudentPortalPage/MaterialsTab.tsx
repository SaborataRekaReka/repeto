import { useMemo, useState } from "react";
import Icon from "@/components/Icon";
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
        className="flex items-center justify-between p-4 hover:bg-n-4/50 transition-colors dark:hover:bg-white/5"
    >
        <div className="flex items-center gap-3 min-w-0">
            <Icon
                className="icon-20 shrink-0 dark:fill-white"
                name="document"
            />
            <div className="min-w-0">
                <p className="text-sm font-bold truncate">{file.name}</p>
                {file.size && (
                    <p className="text-xs text-n-3 dark:text-white/50">
                        {file.size}
                    </p>
                )}
            </div>
        </div>
        <Icon
            className="icon-16 shrink-0 ml-3 dark:fill-white"
            name="external-link"
        />
    </a>
);

const FolderRow = ({
    folder,
    onClick,
}: {
    folder: PortalFile;
    onClick: () => void;
}) => (
    <button
        onClick={onClick}
        className="flex items-center justify-between w-full p-4 text-left hover:bg-n-4/50 transition-colors dark:hover:bg-white/5"
    >
        <div className="flex items-center gap-3 min-w-0">
            <Icon
                className="icon-20 shrink-0 fill-purple-1"
                name="folder"
            />
            <p className="text-sm font-bold truncate">{folder.name}</p>
        </div>
        <Icon
            className="icon-16 shrink-0 ml-3 fill-n-3 dark:fill-white/50"
            name="arrow-next"
        />
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
            <div className="card">
                <div className="p-10 text-center">
                    <p className="text-sm font-bold mb-1">Нет материалов</p>
                    <p className="text-xs text-n-3 dark:text-white/50">
                        Репетитор пока не поделился материалами. Попросите его
                        добавить файлы в Repeto.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Homework files */}
            {!currentFolderId && fromHomework.length > 0 && (
                <div className="card">
                    <div className="card-head">
                        <div className="text-h6">Из домашних заданий</div>
                    </div>
                    <div className="divide-y divide-n-1 dark:divide-white">
                        {fromHomework.map(({ file, taskLabel }) => (
                            <a
                                key={file.id}
                                href={file.cloudUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center justify-between p-4 hover:bg-n-4/50 transition-colors dark:hover:bg-white/5"
                            >
                                <div className="flex items-center gap-3 min-w-0">
                                    <Icon
                                        className="icon-20 shrink-0 dark:fill-white"
                                        name="document"
                                    />
                                    <div className="min-w-0">
                                        <p className="text-sm font-bold truncate">
                                            {file.name}
                                        </p>
                                        <p className="text-xs text-n-3 dark:text-white/50 truncate">
                                            {taskLabel}
                                        </p>
                                    </div>
                                </div>
                                <Icon
                                    className="icon-16 shrink-0 ml-3 dark:fill-white"
                                    name="external-link"
                                />
                            </a>
                        ))}
                    </div>
                </div>
            )}

            {/* File browser */}
            <div className="card">
                {/* Breadcrumbs */}
                {currentFolderId && (
                    <div className="flex items-center gap-1 px-4 pt-4 pb-2 text-xs flex-wrap">
                        <button
                            className="font-bold text-purple-1 hover:text-purple-2 transition-colors"
                            onClick={() => setCurrentFolderId(null)}
                        >
                            Материалы
                        </button>
                        {breadcrumbs.map((crumb) => (
                            <span key={crumb.id} className="flex items-center gap-1">
                                <span className="text-n-3 dark:text-white/50">/</span>
                                {crumb.id === currentFolderId ? (
                                    <span className="font-bold text-n-1 dark:text-white">
                                        {crumb.name}
                                    </span>
                                ) : (
                                    <button
                                        className="font-bold text-purple-1 hover:text-purple-2 transition-colors"
                                        onClick={() =>
                                            setCurrentFolderId(crumb.id)
                                        }
                                    >
                                        {crumb.name}
                                    </button>
                                )}
                            </span>
                        ))}
                    </div>
                )}

                {currentItems.length === 0 ? (
                    <div className="p-8 text-center text-sm text-n-3 dark:text-white/50">
                        {currentFolderId
                            ? "Папка пуста"
                            : "Нет материалов"}
                    </div>
                ) : (
                    <div className="divide-y divide-n-1 dark:divide-white">
                        {currentItems.map((item) =>
                            item.type === "folder" ? (
                                <FolderRow
                                    key={item.id}
                                    folder={item}
                                    onClick={() =>
                                        setCurrentFolderId(item.id)
                                    }
                                />
                            ) : (
                                <FileRow key={item.id} file={item} />
                            )
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default MaterialsTab;
