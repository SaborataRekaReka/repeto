import type { CloudConnection, FileItem, StudentFileAccess } from "@/types/files";

// --- Cloud connections (mirrors Settings → Integrations state) ---
export const cloudConnections: CloudConnection[] = [
    {
        provider: "yandex-disk",
        connected: false,
        rootPath: "/",
        email: "",
        label: "Яндекс.Диск",
    },
    {
        provider: "google-drive",
        connected: false,
        rootPath: "/",
        email: "",
        label: "Google Drive",
    },
];

export const hasAnyCloudConnected = () =>
    cloudConnections.some((c) => c.connected);

// --- Folders and files (flat list, tree built by parentId) ---
export const fileItems: FileItem[] = [
    // Root folders
    {
        id: "f1",
        name: "Математика",
        type: "folder",
        modifiedAt: "02.04.2026",
        cloudProvider: "yandex-disk",
        cloudUrl: "https://disk.yandex.ru/d/math",
        parentId: null,
        sharedWith: [],
    },
    {
        id: "f2",
        name: "Физика",
        type: "folder",
        modifiedAt: "01.04.2026",
        cloudProvider: "yandex-disk",
        cloudUrl: "https://disk.yandex.ru/d/physics",
        parentId: null,
        sharedWith: [],
    },
    {
        id: "f3",
        name: "Общие материалы",
        type: "folder",
        modifiedAt: "28.03.2026",
        cloudProvider: "yandex-disk",
        cloudUrl: "https://disk.yandex.ru/d/common",
        parentId: null,
        sharedWith: ["1", "2", "3", "4", "5", "6"],
    },

    // Математика subfolders
    {
        id: "f1-1",
        name: "11 класс — ЕГЭ",
        type: "folder",
        modifiedAt: "02.04.2026",
        cloudProvider: "yandex-disk",
        cloudUrl: "https://disk.yandex.ru/d/math/11",
        parentId: "f1",
        sharedWith: ["1", "5"],
    },
    {
        id: "f1-2",
        name: "9 класс — ОГЭ",
        type: "folder",
        modifiedAt: "30.03.2026",
        cloudProvider: "yandex-disk",
        cloudUrl: "https://disk.yandex.ru/d/math/9",
        parentId: "f1",
        sharedWith: [],
    },

    // Физика subfolders
    {
        id: "f2-1",
        name: "10 класс",
        type: "folder",
        modifiedAt: "01.04.2026",
        cloudProvider: "yandex-disk",
        cloudUrl: "https://disk.yandex.ru/d/physics/10",
        parentId: "f2",
        sharedWith: ["3"],
    },

    // Files in Математика / 11 класс
    {
        id: "file-1",
        name: "Квадратные уравнения — теория.pdf",
        type: "file",
        extension: "pdf",
        size: "2.4 МБ",
        modifiedAt: "02.04.2026",
        cloudProvider: "yandex-disk",
        cloudUrl: "https://disk.yandex.ru/d/math/11/quad.pdf",
        parentId: "f1-1",
        sharedWith: ["1", "5"],
    },
    {
        id: "file-2",
        name: "Тригонометрия — формулы.pdf",
        type: "file",
        extension: "pdf",
        size: "1.8 МБ",
        modifiedAt: "01.04.2026",
        cloudProvider: "yandex-disk",
        cloudUrl: "https://disk.yandex.ru/d/math/11/trig.pdf",
        parentId: "f1-1",
        sharedWith: ["1"],
    },
    {
        id: "file-3",
        name: "ЕГЭ Вариант 1 — задания.pdf",
        type: "file",
        extension: "pdf",
        size: "3.1 МБ",
        modifiedAt: "31.03.2026",
        cloudProvider: "yandex-disk",
        cloudUrl: "https://disk.yandex.ru/d/math/11/ege1.pdf",
        parentId: "f1-1",
        sharedWith: ["1", "5"],
    },
    {
        id: "file-4",
        name: "ЕГЭ Вариант 1 — ответы.xlsx",
        type: "file",
        extension: "xlsx",
        size: "420 КБ",
        modifiedAt: "31.03.2026",
        cloudProvider: "yandex-disk",
        cloudUrl: "https://disk.yandex.ru/d/math/11/ege1-answers.xlsx",
        parentId: "f1-1",
        sharedWith: [],
    },

    // Files in Математика / 9 класс
    {
        id: "file-5",
        name: "ОГЭ Подготовка — сборник.pdf",
        type: "file",
        extension: "pdf",
        size: "5.6 МБ",
        modifiedAt: "30.03.2026",
        cloudProvider: "yandex-disk",
        cloudUrl: "https://disk.yandex.ru/d/math/9/oge.pdf",
        parentId: "f1-2",
        sharedWith: [],
    },
    {
        id: "file-6",
        name: "Геометрия — шпаргалка.pdf",
        type: "file",
        extension: "pdf",
        size: "890 КБ",
        modifiedAt: "28.03.2026",
        cloudProvider: "yandex-disk",
        cloudUrl: "https://disk.yandex.ru/d/math/9/geom.pdf",
        parentId: "f1-2",
        sharedWith: [],
    },

    // Files in Физика / 10 класс
    {
        id: "file-7",
        name: "Механика — конспект.pdf",
        type: "file",
        extension: "pdf",
        size: "4.2 МБ",
        modifiedAt: "01.04.2026",
        cloudProvider: "yandex-disk",
        cloudUrl: "https://disk.yandex.ru/d/physics/10/mech.pdf",
        parentId: "f2-1",
        sharedWith: ["3"],
    },
    {
        id: "file-8",
        name: "Оптика — лабораторные.pdf",
        type: "file",
        extension: "pdf",
        size: "3.7 МБ",
        modifiedAt: "29.03.2026",
        cloudProvider: "yandex-disk",
        cloudUrl: "https://disk.yandex.ru/d/physics/10/optics.pdf",
        parentId: "f2-1",
        sharedWith: ["3"],
    },
    {
        id: "file-9",
        name: "Задачи на движение.xlsx",
        type: "file",
        extension: "xlsx",
        size: "1.1 МБ",
        modifiedAt: "27.03.2026",
        cloudProvider: "yandex-disk",
        cloudUrl: "https://disk.yandex.ru/d/physics/10/motion.xlsx",
        parentId: "f2-1",
        sharedWith: [],
    },

    // Files in Общие материалы (root)
    {
        id: "file-10",
        name: "Правила занятий и отмены.pdf",
        type: "file",
        extension: "pdf",
        size: "156 КБ",
        modifiedAt: "15.03.2026",
        cloudProvider: "yandex-disk",
        cloudUrl: "https://disk.yandex.ru/d/common/rules.pdf",
        parentId: "f3",
        sharedWith: ["1", "2", "3", "4", "5", "6"],
    },
    {
        id: "file-11",
        name: "Расписание каникул 2025-2026.pdf",
        type: "file",
        extension: "pdf",
        size: "210 КБ",
        modifiedAt: "01.09.2025",
        cloudProvider: "yandex-disk",
        cloudUrl: "https://disk.yandex.ru/d/common/holidays.pdf",
        parentId: "f3",
        sharedWith: ["1", "2", "3", "4", "5", "6"],
    },
    {
        id: "file-12",
        name: "Рекомендации по учебникам.pdf",
        type: "file",
        extension: "pdf",
        size: "340 КБ",
        modifiedAt: "10.01.2026",
        cloudProvider: "yandex-disk",
        cloudUrl: "https://disk.yandex.ru/d/common/books.pdf",
        parentId: "f3",
        sharedWith: ["1", "2", "3", "4", "5", "6"],
    },
];

// --- Helpers ---

export function getChildItems(parentId: string | null): FileItem[] {
    return fileItems
        .filter((f) => f.parentId === parentId)
        .sort((a, b) => {
            // Folders first, then files; alphabetically within group
            if (a.type !== b.type) return a.type === "folder" ? -1 : 1;
            return a.name.localeCompare(b.name, "ru");
        });
}

export function getItemById(id: string): FileItem | undefined {
    return fileItems.find((f) => f.id === id);
}

export function getBreadcrumbPath(itemId: string | null): FileItem[] {
    const path: FileItem[] = [];
    let currentId = itemId;
    while (currentId) {
        const item = getItemById(currentId);
        if (!item) break;
        path.unshift(item);
        currentId = item.parentId;
    }
    return path;
}

export function countChildren(folderId: string): number {
    return fileItems.filter((f) => f.parentId === folderId).length;
}

export function getFileIcon(extension?: string): string {
    switch (extension) {
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
}

export function getSharedStudentNames(
    studentIds: string[],
    allStudents: { id: string; name: string }[]
): string[] {
    return studentIds
        .map((id) => allStudents.find((s) => s.id === id)?.name)
        .filter(Boolean) as string[];
}

// Compute per-student access summary
export function getStudentAccessList(
    allStudents: { id: string; name: string; subject: string }[]
): StudentFileAccess[] {
    return allStudents
        .map((s) => {
            const shared = fileItems.filter((f) =>
                f.sharedWith.includes(s.id)
            );
            const filesCount = shared.filter((f) => f.type === "file").length;
            const foldersCount = shared.filter(
                (f) => f.type === "folder"
            ).length;
            return {
                studentId: s.id,
                studentName: s.name,
                subject: s.subject,
                filesCount,
                foldersCount,
            };
        })
        .filter((s) => s.filesCount > 0 || s.foldersCount > 0);
}

// Get files shared with a specific student
export function getStudentFiles(studentId: string): FileItem[] {
    return fileItems.filter(
        (f) => f.sharedWith.includes(studentId) && f.type === "file"
    );
}
