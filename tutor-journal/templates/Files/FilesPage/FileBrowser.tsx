import { useEffect, useMemo, useState } from "react";
import { useMediaQuery } from "react-responsive";
import { useColorMode } from "@chakra-ui/color-mode";
import Icon from "@/components/Icon";
import Image from "@/components/Image";
import Checkbox from "@/components/Checkbox";
import { useHydrated } from "@/hooks/useHydrated";
import { useStudents } from "@/hooks/useStudents";
import { getInitials, getSubjectBgColor } from "@/mocks/students";
import type { CloudConnection, FileItem } from "@/types/files";
import ShareModal from "./ShareModal";

type FileBrowserProps = {
    files: FileItem[];
    cloudConnections: CloudConnection[];
    onUpdated?: () => Promise<void> | void;
};

const getChildItems = (allFiles: FileItem[], parentId: string | null) =>
    allFiles
        .filter((f) => f.parentId === parentId)
        .sort((a, b) => {
            if (a.type !== b.type) {
                return a.type === "folder" ? -1 : 1;
            }
            return a.name.localeCompare(b.name, "ru");
        });

const getItemById = (allFiles: FileItem[], id: string) =>
    allFiles.find((f) => f.id === id);

const getBreadcrumbPath = (allFiles: FileItem[], itemId: string | null) => {
    const path: FileItem[] = [];
    let currentId = itemId;

    while (currentId) {
        const current = getItemById(allFiles, currentId);
        if (!current) {
            break;
        }
        path.unshift(current);
        currentId = current.parentId;
    }

    return path;
};

const countChildren = (allFiles: FileItem[], folderId: string) =>
    allFiles.filter((f) => f.parentId === folderId).length;

const getFileIcon = (extension?: string): string => {
    switch ((extension || "").toLowerCase()) {
        case "pdf":
            return "/images/pdf.svg";
        case "xlsx":
        case "xls":
            return "/images/xlsx.svg";
        case "doc":
        case "docx":
            return "/images/document.svg";
        case "psd":
            return "/images/psd.svg";
        case "fig":
        case "figma":
            return "/images/figma.svg";
        default:
            return "/images/document.svg";
    }
};

const FOLDER_STORAGE_KEY = "repeto-files-current-folder";

const FileBrowser = ({ files, cloudConnections, onUpdated }: FileBrowserProps) => {
    const [currentFolderId, setCurrentFolderId] = useState<string | null>(() => {
        if (typeof window === "undefined") return null;
        return sessionStorage.getItem(FOLDER_STORAGE_KEY) || null;
    });
    const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
    const [shareTarget, setShareTarget] = useState<FileItem | null>(null);
    const [menuOpenId, setMenuOpenId] = useState<string | null>(null);
    const { mounted } = useHydrated();
    const isMobile = useMediaQuery({ query: "(max-width: 767px)" });
    const { colorMode } = useColorMode();
    const isDark = colorMode === "dark";
    const { data: studentsData } = useStudents({ limit: 100 });

    const activeStudents = useMemo(
        () => (studentsData?.data || []).filter((s) => s.status === "active"),
        [studentsData]
    );

    // Persist current folder to sessionStorage
    useEffect(() => {
        if (currentFolderId) {
            sessionStorage.setItem(FOLDER_STORAGE_KEY, currentFolderId);
        } else {
            sessionStorage.removeItem(FOLDER_STORAGE_KEY);
        }
    }, [currentFolderId]);

    // Validate stored folder still exists in files data
    useEffect(() => {
        if (currentFolderId && files.length > 0) {
            const exists = files.some((f) => f.id === currentFolderId);
            if (!exists) {
                setCurrentFolderId(null);
            }
        }
    }, [currentFolderId, files]);

    const items = useMemo(
        () => getChildItems(files, currentFolderId),
        [files, currentFolderId]
    );

    const breadcrumbs = useMemo(
        () => getBreadcrumbPath(files, currentFolderId),
        [files, currentFolderId]
    );

    const connectedCloud = cloudConnections.find((c) => c.connected);

    const toggleSelect = (id: string) => {
        setSelectedItems((prev) => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
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

        if (item.cloudUrl) {
            window.open(item.cloudUrl, "_blank", "noopener,noreferrer");
        }
    };

    const handleBulkShare = () => {
        const firstId = Array.from(selectedItems)[0];
        const item = items.find((i) => i.id === firstId);
        if (item) {
            setShareTarget(item);
        }
    };

    return (
        <>
            <div className="flex items-center justify-between mb-5 md:flex-col md:items-start md:gap-3">
                <div className="flex items-center gap-2">
                    {connectedCloud && (
                        <div className="flex items-center gap-3 px-4 py-2.5 rounded-sm border border-n-1 bg-white dark:bg-n-1 dark:border-white">
                            <div className="w-8 h-8 rounded-full bg-green-1 flex items-center justify-center shrink-0">
                                <Icon
                                    className="icon-16 fill-white"
                                    name="check-circle"
                                />
                            </div>
                            <div>
                                <div className="text-xs font-bold">
                                    {connectedCloud.label}
                                </div>
                                <div className="text-xs text-n-3 dark:text-white/50">
                                    {connectedCloud.rootPath} · {connectedCloud.email || "без email"}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
                <div className="flex gap-2">
                    {selectedItems.size > 0 && (
                        <button
                            className="btn-purple btn-small"
                            onClick={handleBulkShare}
                        >
                            <Icon name="add-member" />
                            <span>
                                Поделиться ({selectedItems.size})
                            </span>
                        </button>
                    )}
                </div>
            </div>

            <div className="flex items-center gap-1 mb-4 text-sm flex-wrap">
                <button
                    className={`font-bold transition-colors hover:text-purple-1 ${
                        currentFolderId === null
                            ? "text-n-1 dark:text-white"
                            : "text-n-3 dark:text-white/50"
                    }`}
                    onClick={() => {
                        setCurrentFolderId(null);
                        setSelectedItems(new Set());
                    }}
                >
                    Материалы
                </button>
                {breadcrumbs.map((item) => (
                    <span key={item.id} className="flex items-center gap-1">
                        <span className="text-n-3 dark:text-white/50">/</span>
                        <button
                            className={`font-bold transition-colors hover:text-purple-1 ${
                                item.id === currentFolderId
                                    ? "text-n-1 dark:text-white"
                                    : "text-n-3 dark:text-white/50"
                            }`}
                            onClick={() => {
                                setCurrentFolderId(item.id);
                                setSelectedItems(new Set());
                            }}
                        >
                            {item.name}
                        </button>
                    </span>
                ))}
            </div>

            {items.length === 0 ? (
                <div className="card px-5 py-12 text-center">
                    <div className="flex items-center justify-center w-16 h-16 mx-auto mb-4 bg-n-4/50 rounded-sm dark:bg-white/10">
                        <Icon
                            className="icon-24 fill-n-3 dark:fill-white/50"
                            name="folder"
                        />
                    </div>
                    <div className="mb-2 text-h5">Папка пуста</div>
                    <div className="text-sm text-n-3 dark:text-white/50">
                        В этой папке пока нет файлов. Добавьте файлы через
                        облачное хранилище.
                    </div>
                </div>
            ) : (
                <div className="card">
                    {mounted && !isMobile ? (
                        <table className="table-custom w-full">
                            <thead>
                                <tr>
                                    <th className="th-custom w-8"></th>
                                    <th className="th-custom">Название</th>
                                    <th className="th-custom w-24 text-right">
                                        Размер
                                    </th>
                                    <th className="th-custom w-32 lg:hidden">
                                        Изменён
                                    </th>
                                    <th className="th-custom w-40">Доступ</th>
                                    <th className="th-custom w-10"></th>
                                </tr>
                            </thead>
                            <tbody>
                                {items.map((item) => (
                                    <tr
                                        key={item.id}
                                        className="group transition-colors hover:bg-n-3/10 dark:hover:bg-white/5"
                                    >
                                        <td className="td-custom">
                                            <Checkbox
                                                className="shrink-0"
                                                value={selectedItems.has(item.id)}
                                                onChange={() => toggleSelect(item.id)}
                                            />
                                        </td>
                                        <td className="td-custom">
                                            <button
                                                className="flex items-center text-sm font-bold transition-colors hover:text-purple-1 text-left"
                                                onClick={() => handleNavigate(item)}
                                            >
                                                <div className="flex items-center justify-center w-8 h-8 mr-3 shrink-0">
                                                    {item.type === "folder" ? (
                                                        <Image
                                                            className="w-full"
                                                            src={
                                                                isDark
                                                                    ? "/images/folder-light.svg"
                                                                    : "/images/folder-dark.svg"
                                                            }
                                                            width={32}
                                                            height={32}
                                                            alt="Folder"
                                                        />
                                                    ) : (
                                                        <div className="flex items-center justify-center w-8 h-8 bg-background dark:bg-white/10">
                                                            <Image
                                                                className="w-5"
                                                                src={getFileIcon(item.extension)}
                                                                width={20}
                                                                height={20}
                                                                alt="File"
                                                            />
                                                        </div>
                                                    )}
                                                </div>
                                                <span className="truncate">
                                                    {item.name}
                                                </span>
                                                {item.type === "folder" && (
                                                    <span className="ml-2 flex items-center text-xs font-bold text-n-3 dark:text-white/50">
                                                        <Icon
                                                            className="mr-0.5 icon-14 fill-n-3 dark:fill-white/50"
                                                            name="file"
                                                        />
                                                        {countChildren(files, item.id)}
                                                    </span>
                                                )}
                                            </button>
                                        </td>
                                        <td className="td-custom text-right text-xs font-medium text-n-3 dark:text-white/50">
                                            {item.size || "—"}
                                        </td>
                                        <td className="td-custom text-xs font-medium text-n-3 dark:text-white/50 lg:hidden">
                                            {item.modifiedAt}
                                        </td>
                                        <td className="td-custom">
                                            <SharedBadge
                                                item={item}
                                                students={activeStudents}
                                            />
                                        </td>
                                        <td className="td-custom">
                                            <div className="relative">
                                                <button
                                                    className="btn-transparent-dark btn-small btn-square"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setMenuOpenId(
                                                            menuOpenId === item.id
                                                                ? null
                                                                : item.id
                                                        );
                                                    }}
                                                >
                                                    <Icon name="dots" />
                                                </button>
                                                {menuOpenId === item.id && (
                                                    <ItemMenu
                                                        item={item}
                                                        onShare={() => {
                                                            setShareTarget(item);
                                                            setMenuOpenId(null);
                                                        }}
                                                        onClose={() => setMenuOpenId(null)}
                                                    />
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    ) : (
                        items.map((item) => (
                            <div
                                key={item.id}
                                className="flex items-center border-t border-n-1 px-4 py-4 first:border-none dark:border-white"
                            >
                                <button
                                    className="flex items-center flex-1 min-w-0 mr-3"
                                    onClick={() => handleNavigate(item)}
                                >
                                    <div className="flex items-center justify-center w-8 h-8 mr-3 shrink-0">
                                        {item.type === "folder" ? (
                                            <Image
                                                className="w-full"
                                                src={
                                                    isDark
                                                        ? "/images/folder-light.svg"
                                                        : "/images/folder-dark.svg"
                                                }
                                                width={32}
                                                height={32}
                                                alt="Folder"
                                            />
                                        ) : (
                                            <div className="flex items-center justify-center w-8 h-8 bg-background dark:bg-white/10">
                                                <Image
                                                    className="w-5"
                                                    src={getFileIcon(item.extension)}
                                                    width={20}
                                                    height={20}
                                                    alt="File"
                                                />
                                            </div>
                                        )}
                                    </div>
                                    <div className="min-w-0">
                                        <div className="text-sm font-bold truncate">
                                            {item.name}
                                        </div>
                                        <div className="text-xs text-n-3 dark:text-white/50">
                                            {item.type === "folder"
                                                ? `${countChildren(files, item.id)} файлов`
                                                : `${item.size || "—"} · ${item.modifiedAt}`}
                                        </div>
                                    </div>
                                </button>
                                <SharedBadge
                                    item={item}
                                    compact
                                    students={activeStudents}
                                />
                                <button
                                    className="btn-transparent-dark btn-small btn-square shrink-0 ml-2"
                                    onClick={() => setShareTarget(item)}
                                >
                                    <Icon name="add-member" />
                                </button>
                            </div>
                        ))
                    )}
                </div>
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

const SharedBadge = ({
    item,
    compact,
    students,
}: {
    item: FileItem;
    compact?: boolean;
    students: Array<{ id: string; name: string; subject: string }>;
}) => {
    if (item.sharedWith.length === 0) {
        return (
            <span className="text-xs text-n-3 dark:text-white/50">
                {compact ? "" : "Только я"}
            </span>
        );
    }

    const matched = students.filter((s) => item.sharedWith.includes(s.id));
    const shown = matched.slice(0, compact ? 2 : 3);
    const rest = matched.length - shown.length;

    return (
        <div className="flex items-center gap-1">
            {shown.map((s) => (
                <div
                    key={s.id}
                    className={`flex items-center justify-center rounded-full text-xs font-bold text-n-1 ${getSubjectBgColor(
                        s.subject
                    )} ${compact ? "w-6 h-6" : "w-7 h-7"}`}
                    title={s.name}
                >
                    {getInitials(s.name)}
                </div>
            ))}
            {rest > 0 && (
                <div
                    className={`flex items-center justify-center rounded-full bg-n-4/50 text-xs font-bold text-n-1 dark:bg-white/10 dark:text-white ${
                        compact ? "w-6 h-6" : "w-7 h-7"
                    }`}
                >
                    +{rest}
                </div>
            )}
        </div>
    );
};

const ItemMenu = ({
    item,
    onShare,
    onClose,
}: {
    item: FileItem;
    onShare: () => void;
    onClose: () => void;
}) => (
    <div className="absolute top-full right-0 mt-1 w-56 p-2 bg-white border border-n-1 rounded-sm shadow-lg overflow-hidden dark:bg-n-1 dark:border-white z-50">
        <button
            className="flex items-center w-full px-3 py-2 text-sm font-bold text-n-1 dark:text-white rounded-sm transition-colors hover:bg-n-3/20"
            onClick={onShare}
        >
            <Icon
                className="shrink-0 mr-2 fill-n-1 dark:fill-white"
                name="add-member"
            />
            Управление доступом
        </button>
        <button
            className={`flex items-center w-full px-3 py-2 text-sm font-bold rounded-sm transition-colors ${
                item.cloudUrl
                    ? "text-n-1 dark:text-white hover:bg-n-3/20"
                    : "text-n-3 dark:text-white/50 cursor-not-allowed"
            }`}
            disabled={!item.cloudUrl}
            onClick={() => {
                if (!item.cloudUrl) {
                    return;
                }
                window.open(item.cloudUrl, "_blank", "noopener,noreferrer");
                onClose();
            }}
        >
            <Icon
                className="shrink-0 mr-2 fill-n-1 dark:fill-white"
                name="arrow-next"
            />
            Открыть в облаке
        </button>
    </div>
);

export default FileBrowser;
