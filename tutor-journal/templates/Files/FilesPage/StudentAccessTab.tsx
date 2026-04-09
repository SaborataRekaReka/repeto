import { useState } from "react";
import { useRouter } from "next/router";
import Icon from "@/components/Icon";
import { getInitials, getSubjectBgColor } from "@/mocks/students";
import { useStudents } from "@/hooks/useStudents";
import type { FileItem, StudentFileAccess } from "@/types/files";

const getFileIcon = (extension?: string) => {
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

type StudentAccessTabProps = {
    files: FileItem[];
    studentAccess: StudentFileAccess[];
};

const StudentAccessTab = ({ files, studentAccess }: StudentAccessTabProps) => {
    const [expandedId, setExpandedId] = useState<string | null>(null);
    const router = useRouter();

    const { data: studentsData } = useStudents({ limit: 100 });
    const students = studentsData?.data || [];

    const accessList = studentAccess;

    const getStudentItems = (studentId: string) =>
        files.filter((f) => f.sharedWith.includes(studentId));

    // Students with no files shared
    const studentsWithoutAccess = students.filter(
        (s) =>
            s.status === "active" &&
            !accessList.find((a) => a.studentId === s.id)
    );

    return (
        <div className="space-y-3">
            {accessList.length === 0 ? (
                <div className="card px-5 py-12 text-center">
                    <div className="mb-2 text-h5">Нет расшаренных файлов</div>
                    <div className="text-sm text-n-3 dark:text-white/50">
                        Поделитесь материалами с учениками на вкладке «Файлы»
                    </div>
                </div>
            ) : (
                <>
                    {/* Students with access */}
                    {accessList.map((access) => {
                        const student = students.find(
                            (s) => s.id === access.studentId
                        );
                        if (!student) return null;
                        const isExpanded = expandedId === access.studentId;
                        const sharedItems = isExpanded
                            ? getStudentItems(access.studentId)
                            : [];

                        return (
                            <div key={access.studentId} className="card">
                                <button
                                    className="flex items-center w-full px-5 py-4 text-left transition-colors hover:bg-n-3/10 dark:hover:bg-white/5"
                                    onClick={() =>
                                        setExpandedId(
                                            isExpanded
                                                ? null
                                                : access.studentId
                                        )
                                    }
                                >
                                    <div
                                        className={`flex items-center justify-center w-10 h-10 mr-3 rounded-full text-sm font-bold text-n-1 shrink-0 ${getSubjectBgColor(student.subject)}`}
                                    >
                                        {getInitials(student.name)}
                                    </div>
                                    <div className="min-w-0 mr-auto">
                                        <div className="text-sm font-bold">
                                            {student.name}
                                        </div>
                                        <div className="text-xs text-n-3 dark:text-white/50">
                                            {student.subject} ·{" "}
                                            {access.filesCount > 0 && `${access.filesCount} файлов`}
                                            {access.filesCount > 0 && access.foldersCount > 0 && " · "}
                                            {access.foldersCount > 0 && `${access.foldersCount} папок`}
                                            {access.filesCount === 0 && access.foldersCount === 0 && "Нет файлов"}
                                        </div>
                                    </div>
                                    <Icon
                                        className={`icon-18 fill-n-3 dark:fill-white/50 transition-transform ${
                                            isExpanded ? "rotate-180" : ""
                                        }`}
                                        name="arrow-bottom"
                                    />
                                </button>

                                {/* Expanded file list */}
                                {isExpanded && (
                                    <div className="border-t border-n-1 dark:border-white">
                                        {sharedItems.length === 0 ? (
                                            <div className="px-5 py-4 text-xs text-n-3 dark:text-white/50">
                                                Нет расшаренных элементов
                                            </div>
                                        ) : (
                                            sharedItems.map((item) => (
                                                <div
                                                    key={item.id}
                                                    className="flex items-center px-5 py-3 border-t border-n-1/20 first:border-none dark:border-white/20 transition-colors hover:bg-n-3/5 dark:hover:bg-white/3"
                                                >
                                                    <div className="flex items-center justify-center w-6 h-6 mr-3 shrink-0">
                                                        {item.type === "folder" ? (
                                                            <Icon
                                                                className="icon-16 fill-purple-1"
                                                                name="folder"
                                                            />
                                                        ) : (
                                                            <img
                                                                className="w-4 h-4"
                                                                src={getFileIcon(
                                                                    item.extension
                                                                )}
                                                                alt=""
                                                            />
                                                        )}
                                                    </div>
                                                    <div className="min-w-0 mr-auto">
                                                        <div className="text-sm font-bold truncate">
                                                            {item.name}
                                                        </div>
                                                        <div className="text-xs text-n-3 dark:text-white/50">
                                                            {item.type === "folder"
                                                                ? "Папка"
                                                                : `${item.size || ""} · ${item.modifiedAt}`}
                                                        </div>
                                                    </div>
                                                    <button
                                                        className="btn-transparent-dark btn-small btn-square shrink-0 ml-2"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            window.open(
                                                                item.cloudUrl,
                                                                "_blank",
                                                                "noopener,noreferrer"
                                                            );
                                                        }}
                                                        title="Открыть в облаке"
                                                    >
                                                        <Icon name="arrow-next" />
                                                    </button>
                                                </div>
                                            ))
                                        )}
                                        {/* Link to student profile */}
                                        <div className="px-5 py-3 border-t border-dashed border-n-1 dark:border-white">
                                            <button
                                                className="text-xs font-bold text-purple-1 hover:text-purple-2 transition-colors"
                                                onClick={() =>
                                                    router.push(
                                                        `/students/${access.studentId}`
                                                    )
                                                }
                                            >
                                                Перейти в профиль ученика →
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })}

                    {/* Students without access */}
                    {studentsWithoutAccess.length > 0 && (
                        <div className="mt-6">
                            <div className="mb-3 text-xs font-bold text-n-3 dark:text-white/50">
                                Без доступа к материалам
                            </div>
                            <div className="card">
                                {studentsWithoutAccess.map((s) => (
                                    <div
                                        key={s.id}
                                        className="flex items-center px-5 py-3 border-t border-n-1 first:border-none dark:border-white"
                                    >
                                        <div
                                            className={`flex items-center justify-center w-8 h-8 mr-3 rounded-full text-xs font-bold text-n-1 shrink-0 ${getSubjectBgColor(s.subject)}`}
                                        >
                                            {getInitials(s.name)}
                                        </div>
                                        <div className="min-w-0 mr-auto">
                                            <div className="text-sm font-bold">
                                                {s.name}
                                            </div>
                                            <div className="text-xs text-n-3 dark:text-white/50">
                                                {s.subject}
                                            </div>
                                        </div>
                                        <span className="text-xs text-n-3 dark:text-white/50">
                                            Нет файлов
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </>
            )}
        </div>
    );
};

export default StudentAccessTab;
