import { useState } from "react";
import { useRouter } from "next/router";
import { Card, Text, Icon, Button } from "@gravity-ui/uikit";
import { FolderOpen, ChevronDown, ArrowUpRightFromSquare } from "@gravity-ui/icons";
import type { IconData } from "@gravity-ui/uikit";
import { getInitials } from "@/mocks/students";
import { useStudents } from "@/hooks/useStudents";
import { updateFileShare } from "@/hooks/useFiles";
import type { FileItem, StudentFileAccess } from "@/types/files";
import { codedErrorMessage } from "@/lib/errorCodes";

const getFileIcon = (ext?: string) => {
    switch ((ext || "").toLowerCase()) {
        case "pdf": return "/images/pdf.svg";
        case "xlsx": case "xls": return "/images/xlsx.svg";
        case "doc": case "docx": return "/images/document.svg";
        default: return "/images/document.svg";
    }
};

type StudentAccessTabProps = {
    files: FileItem[];
    studentAccess: StudentFileAccess[];
    onUpdated?: () => Promise<void> | void;
};

const StudentAccessTab = ({ files, studentAccess, onUpdated }: StudentAccessTabProps) => {
    const [expandedId, setExpandedId] = useState<string | null>(null);
    const [busyStudentId, setBusyStudentId] = useState<string | null>(null);
    const [busyItemKey, setBusyItemKey] = useState<string | null>(null);
    const [errorByStudent, setErrorByStudent] = useState<Record<string, string>>({});
    const router = useRouter();
    const { data: studentsData } = useStudents({ limit: 100 });
    const students = studentsData?.data || [];
    const accessList = studentAccess;

    const getStudentItems = (studentId: string) =>
        files.filter((f) => f.sharedWith.includes(studentId));

    const studentsWithoutAccess = students.filter(
        (s) => s.status === "active" && !accessList.find((a) => a.studentId === s.id)
    );

    const clearStudentError = (studentId: string) => {
        setErrorByStudent((prev) => {
            if (!prev[studentId]) return prev;
            const next = { ...prev };
            delete next[studentId];
            return next;
        });
    };

    const setStudentError = (studentId: string, message: string) => {
        setErrorByStudent((prev) => ({ ...prev, [studentId]: message }));
    };

    const handleRevokeItemAccess = async (studentId: string, item: FileItem) => {
        const busyKey = `${studentId}:${item.id}`;
        clearStudentError(studentId);
        setBusyItemKey(busyKey);
        try {
            await updateFileShare(item.id, {
                studentIds: item.sharedWith.filter((id) => id !== studentId),
                applyToChildren: item.type === "folder",
            });
            await onUpdated?.();
        } catch (e: any) {
            setStudentError(studentId, codedErrorMessage("FILES-REVOKE", e));
        } finally {
            setBusyItemKey(null);
        }
    };

    const handleRevokeStudentAccess = async (studentId: string) => {
        const sharedItems = getStudentItems(studentId);
        if (sharedItems.length === 0) return;

        clearStudentError(studentId);
        setBusyStudentId(studentId);
        try {
            await Promise.all(
                sharedItems.map((item) =>
                    updateFileShare(item.id, {
                        studentIds: item.sharedWith.filter((id) => id !== studentId),
                        applyToChildren: item.type === "folder",
                    })
                )
            );
            await onUpdated?.();
        } catch (e: any) {
            setStudentError(studentId, codedErrorMessage("FILES-REVOKE-ALL", e));
        } finally {
            setBusyStudentId(null);
        }
    };

    return (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {accessList.length === 0 ? (
                <Card view="outlined" style={{ padding: "48px 20px", textAlign: "center", background: "var(--g-color-base-float)" }}>
                    <Text variant="subheader-2" style={{ display: "block", marginBottom: 8 }}>Нет расшаренных файлов</Text>
                    <Text variant="body-1" color="secondary">
                        Поделитесь материалами с учениками на вкладке «Файлы»
                    </Text>
                </Card>
            ) : (
                <>
                    {accessList.map((access) => {
                        const student = students.find((s) => s.id === access.studentId);
                        if (!student) return null;
                        const isExpanded = expandedId === access.studentId;
                        const sharedItems = isExpanded ? getStudentItems(access.studentId) : [];

                        return (
                            <Card key={access.studentId} view="outlined" style={{ background: "var(--g-color-base-float)", overflow: "hidden" }}>
                                <div
                                    onClick={() => setExpandedId(isExpanded ? null : access.studentId)}
                                    style={{
                                        display: "flex", alignItems: "center", padding: "14px 20px",
                                        cursor: "pointer", transition: "background 0.15s",
                                    }}
                                    onMouseEnter={(e) => (e.currentTarget.style.background = "var(--g-color-base-simple-hover)")}
                                    onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                                >
                                    <div style={{
                                        width: 40, height: 40, borderRadius: "50%",
                                        background: "rgba(174,122,255,0.1)",
                                        display: "flex", alignItems: "center", justifyContent: "center",
                                        marginRight: 12, fontSize: 13, fontWeight: 700,
                                        color: "var(--g-color-text-brand)", flexShrink: 0,
                                    }}>
                                        {getInitials(student.name)}
                                    </div>
                                    <div style={{ flex: 1, minWidth: 0, marginRight: 12 }}>
                                        <Text variant="body-1" style={{ fontWeight: 600 }}>{student.name}</Text>
                                        <Text variant="caption-2" color="secondary" style={{ display: "block" }}>
                                            {student.subject}
                                            {access.filesCount > 0 && ` · ${access.filesCount} файлов`}
                                            {access.foldersCount > 0 && ` · ${access.foldersCount} папок`}
                                        </Text>
                                    </div>
                                    <Button
                                        view="outlined-danger"
                                        size="s"
                                        disabled={busyStudentId === access.studentId}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleRevokeStudentAccess(access.studentId);
                                        }}
                                    >
                                        {busyStudentId === access.studentId ? "Убираем..." : "Убрать доступ"}
                                    </Button>
                                    <Icon
                                        data={ChevronDown as IconData}
                                        size={18}
                                        style={{
                                            transition: "transform 0.2s",
                                            transform: isExpanded ? "rotate(180deg)" : "rotate(0deg)",
                                            color: "var(--g-color-text-secondary)",
                                        }}
                                    />
                                </div>

                                {isExpanded && (
                                    <div style={{ borderTop: "1px solid var(--g-color-line-generic)" }}>
                                        {sharedItems.length === 0 ? (
                                            <div style={{ padding: "14px 20px" }}>
                                                <Text variant="caption-2" color="secondary">Нет расшаренных элементов</Text>
                                            </div>
                                        ) : (
                                            sharedItems.map((item, idx) => (
                                                <div
                                                    key={item.id}
                                                    style={{
                                                        display: "flex", alignItems: "center",
                                                        padding: "10px 20px",
                                                        borderTop: idx > 0 ? "1px solid var(--g-color-line-generic)" : undefined,
                                                        transition: "background 0.15s",
                                                    }}
                                                    onMouseEnter={(e) => (e.currentTarget.style.background = "var(--g-color-base-simple-hover)")}
                                                    onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                                                >
                                                    <div style={{ width: 24, height: 24, marginRight: 12, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                                                        {item.type === "folder" ? (
                                                            <Icon data={FolderOpen as IconData} size={16} />
                                                        ) : (
                                                            <img src={getFileIcon(item.extension)} width={16} height={16} alt="" className="repeto-file-icon" />
                                                        )}
                                                    </div>
                                                    <div style={{ flex: 1, minWidth: 0, marginRight: 12 }}>
                                                        <Text variant="body-1" style={{ fontWeight: 600 }}>{item.name}</Text>
                                                        <Text variant="caption-2" color="secondary" style={{ display: "block" }}>
                                                            {item.type === "folder" ? "Папка" : `${item.size || ""} · ${item.modifiedAt}`}
                                                        </Text>
                                                    </div>
                                                    <Button
                                                        view="outlined-danger"
                                                        size="s"
                                                        disabled={busyStudentId === access.studentId || busyItemKey === `${access.studentId}:${item.id}`}
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleRevokeItemAccess(access.studentId, item);
                                                        }}
                                                    >
                                                        {busyItemKey === `${access.studentId}:${item.id}` ? "Убираем..." : "Убрать"}
                                                    </Button>
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); window.open(item.cloudUrl, "_blank", "noopener,noreferrer"); }}
                                                        title="Открыть в облаке"
                                                        style={{
                                                            background: "none", border: "none", cursor: "pointer",
                                                            padding: 6, borderRadius: 6, display: "flex",
                                                            color: "var(--g-color-text-secondary)",
                                                        }}
                                                    >
                                                        <Icon data={ArrowUpRightFromSquare as IconData} size={14} />
                                                    </button>
                                                </div>
                                            ))
                                        )}
                                        {errorByStudent[access.studentId] && (
                                            <div
                                                style={{
                                                    margin: "10px 20px 0",
                                                    padding: "8px 12px",
                                                    borderRadius: 8,
                                                    background: "var(--g-color-base-danger-light)",
                                                    border: "1px solid var(--g-color-line-danger)",
                                                }}
                                            >
                                                <Text variant="body-1" color="danger">{errorByStudent[access.studentId]}</Text>
                                            </div>
                                        )}
                                        <div style={{ padding: "10px 20px", borderTop: "1px dashed var(--g-color-line-generic)" }}>
                                            <button
                                                onClick={() => router.push(`/students/${access.studentId}`)}
                                                style={{
                                                    background: "none", border: "none", cursor: "pointer",
                                                    fontSize: 13, fontWeight: 600,
                                                    color: "var(--g-color-text-brand)",
                                                }}
                                            >
                                                Перейти в профиль ученика →
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </Card>
                        );
                    })}

                    {studentsWithoutAccess.length > 0 && (
                        <div style={{ marginTop: 12 }}>
                            <Text variant="caption-2" color="secondary" style={{ display: "block", marginBottom: 8 }}>
                                Без доступа к материалам
                            </Text>
                            <Card view="outlined" style={{ background: "var(--g-color-base-float)", overflow: "hidden" }}>
                                {studentsWithoutAccess.map((s, i) => (
                                    <div
                                        key={s.id}
                                        style={{
                                            display: "flex", alignItems: "center",
                                            padding: "10px 20px",
                                            borderTop: i > 0 ? "1px solid var(--g-color-line-generic)" : undefined,
                                        }}
                                    >
                                        <div style={{
                                            width: 32, height: 32, borderRadius: "50%",
                                            background: "rgba(174,122,255,0.1)",
                                            display: "flex", alignItems: "center", justifyContent: "center",
                                            marginRight: 12, fontSize: 12, fontWeight: 700,
                                            color: "var(--g-color-text-brand)", flexShrink: 0,
                                        }}>
                                            {getInitials(s.name)}
                                        </div>
                                        <div style={{ flex: 1, minWidth: 0, marginRight: 12 }}>
                                            <Text variant="body-1" style={{ fontWeight: 600 }}>{s.name}</Text>
                                            <Text variant="caption-2" color="secondary" style={{ display: "block" }}>{s.subject}</Text>
                                        </div>
                                        <Text variant="caption-2" color="secondary">Нет файлов</Text>
                                    </div>
                                ))}
                            </Card>
                        </div>
                    )}
                </>
            )}
        </div>
    );
};

export default StudentAccessTab;
