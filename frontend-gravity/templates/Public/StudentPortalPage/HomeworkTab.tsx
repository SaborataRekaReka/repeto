import { useState, useRef } from "react";
import { Card, Text, Button, Icon } from "@gravity-ui/uikit";
import { File as FileIcon, ArrowUpRightFromSquare, TrashBin, ArrowUpFromLine } from "@gravity-ui/icons";
import type { IconData } from "@gravity-ui/uikit";
import { api } from "@/lib/api";
import type { PortalHomework, StudentUpload } from "@/types/student-portal";

type HomeworkTabProps = {
    homework: PortalHomework[];
    token?: string;
};

const HomeworkTab = ({ homework: initial, token }: HomeworkTabProps) => {
    const [homework, setHomework] = useState(initial);
    const [shown, setShown] = useState(5);
    const [updatingId, setUpdatingId] = useState<string | null>(null);

    const toggleHomework = async (id: string) => {
        if (!token) return;
        const current = homework.find((h) => h.id === id);
        if (!current) return;

        setUpdatingId(id);
        try {
            const nextDone = !current.done;
            await api(`/portal/${token}/homework/${id}`, {
                method: "PATCH",
                body: { done: nextDone },
            });
            setHomework((prev) =>
                prev.map((h) => (h.id === id ? { ...h, done: nextDone } : h))
            );
        } catch {
            if (typeof window !== "undefined") {
                window.alert("Не удалось обновить статус домашки. Попробуйте снова.");
            }
        } finally {
            setUpdatingId(null);
        }
    };

    const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB
    const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({});
    const [uploadingId, setUploadingId] = useState<string | null>(null);

    const handleFileUpload = async (hwId: string, file: File) => {
        if (!token) return;
        if (file.size > MAX_FILE_SIZE) {
            alert("Файл слишком большой. Максимум 5 МБ.");
            return;
        }
        setUploadingId(hwId);
        try {
            const formData = new FormData();
            formData.append("file", file);
            const res = await fetch(
                `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3200"}/portal/${token}/homework/${hwId}/upload`,
                { method: "POST", body: formData }
            );
            if (!res.ok) throw new Error("Upload failed");
            const data = await res.json();
            const upload: StudentUpload = {
                id: data.id,
                name: data.name,
                size:
                    data.size >= 1024 * 1024
                        ? (data.size / (1024 * 1024)).toFixed(1) + " МБ"
                        : Math.round(data.size / 1024) + " КБ",
                uploadedAt: new Date().toLocaleDateString("ru-RU", {
                    day: "numeric",
                    month: "short",
                }),
                expiresAt: "",
                url: data.url,
            };
            setHomework((prev) =>
                prev.map((h) =>
                    h.id === hwId
                        ? { ...h, studentUploads: [...(h.studentUploads || []), upload] }
                        : h
                )
            );
        } catch {
            alert("Не удалось загрузить файл. Попробуйте снова.");
        } finally {
            setUploadingId(null);
        }
    };

    const handleRemoveUpload = async (hwId: string, uploadId: string) => {
        if (!token) return;
        const hw = homework.find((h) => h.id === hwId);
        const upload = hw?.studentUploads?.find((u) => u.id === uploadId);
        if (!upload?.url) return;
        try {
            await api(`/portal/${token}/homework/${hwId}/upload`, {
                method: "DELETE",
                body: { fileUrl: upload.url },
            });
        } catch {
            // best-effort removal
        }
        setHomework((prev) =>
            prev.map((h) =>
                h.id === hwId
                    ? {
                          ...h,
                          studentUploads: (h.studentUploads || []).filter(
                              (u) => u.id !== uploadId
                          ),
                      }
                    : h
            )
        );
    };

    if (homework.length === 0) {
        return (
            <Card view="outlined" style={{ padding: "40px 24px", textAlign: "center" }}>
                <Text variant="subheader-2" as="div" style={{ marginBottom: 4 }}>Нет текущих заданий</Text>
                <Text variant="body-1" color="secondary">
                    Когда репетитор задаст домашнее задание, оно появится здесь.
                </Text>
            </Card>
        );
    }

    return (
        <Card view="outlined" style={{ overflow: "hidden" }}>
            <div className="repeto-card-header">
                <Text variant="subheader-2">Домашнее задание</Text>
            </div>
            <div style={{ padding: 20, display: "flex", flexDirection: "column", gap: 12 }}>
                {homework.slice(0, shown).map((h) => (
                    <Card
                        key={h.id}
                        view="outlined"
                        style={{
                            padding: 12,
                            ...(h.done ? { borderColor: "var(--g-color-line-positive)", background: "var(--g-color-base-positive-light)" } : {}),
                        }}
                    >
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                            <div style={{ marginRight: 12 }}>
                                <Text
                                    variant="body-1"
                                    style={h.done ? { textDecoration: "line-through", color: "var(--g-color-text-secondary)" } : undefined}
                                >
                                    {h.task}
                                </Text>
                                <Text variant="caption-1" color="secondary" as="div" style={{ marginTop: 4 }}>
                                    Срок: {h.due}
                                </Text>
                            </div>
                            <Button
                                view={h.done ? "outlined-success" : "action"}
                                size="s"
                                onClick={() => toggleHomework(h.id)}
                                loading={updatingId === h.id}
                                style={{ flexShrink: 0 }}
                            >
                                Выполнено
                            </Button>
                        </div>
                        {h.linkedFiles && h.linkedFiles.length > 0 && (
                            <div style={{ marginTop: 12, paddingTop: 12, borderTop: "1px dashed var(--g-color-line-generic)" }}>
                                <Text variant="caption-1" color="secondary" style={{ fontWeight: 600, marginBottom: 8, display: "block" }}>
                                    Материалы к заданию
                                </Text>
                                <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                                    {h.linkedFiles.map((file) => (
                                        <a
                                            key={file.id}
                                            href={file.cloudUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 8px", borderRadius: "var(--g-border-radius-m)", textDecoration: "none", transition: "background 0.12s" }}
                                            className="repeto-portal-file-row"
                                        >
                                            <Icon data={FileIcon as IconData} size={16} />
                                            <Text variant="caption-1" ellipsis style={{ fontWeight: 600 }}>{file.name}</Text>
                                            {file.size && (
                                                <Text variant="caption-1" color="secondary" style={{ marginLeft: "auto", flexShrink: 0 }}>{file.size}</Text>
                                            )}
                                            <Icon data={ArrowUpRightFromSquare as IconData} size={12} />
                                        </a>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Student uploads */}
                        <div style={{ marginTop: 12, paddingTop: 12, borderTop: "1px dashed var(--g-color-line-generic)" }}>
                            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                                <Text variant="caption-1" color="secondary" style={{ fontWeight: 600 }}>Мои файлы</Text>
                                <Text variant="caption-1" color="secondary">до 5 МБ · хранятся 3 дня</Text>
                            </div>
                            {h.studentUploads && h.studentUploads.length > 0 && (
                                <div style={{ display: "flex", flexDirection: "column", gap: 4, marginBottom: 8 }}>
                                    {h.studentUploads.map((upload) => (
                                        <Card key={upload.id} view="outlined" style={{ padding: "6px 8px", display: "flex", alignItems: "center", gap: 8 }}>
                                            <Icon data={FileIcon as IconData} size={16} />
                                            <div style={{ flex: 1, minWidth: 0 }}>
                                                <Text variant="caption-1" ellipsis style={{ fontWeight: 600, display: "block" }}>{upload.name}</Text>
                                                <Text variant="caption-1" color="secondary">{upload.size} · до {upload.expiresAt}</Text>
                                            </div>
                                            <Button
                                                view="flat-danger"
                                                size="xs"
                                                onClick={() => handleRemoveUpload(h.id, upload.id)}
                                            >
                                                <Icon data={TrashBin as IconData} size={14} />
                                            </Button>
                                        </Card>
                                    ))}
                                </div>
                            )}
                            <input
                                ref={(el) => { fileInputRefs.current[h.id] = el; }}
                                type="file"
                                hidden
                                onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (file) handleFileUpload(h.id, file);
                                    e.target.value = "";
                                }}
                            />
                            <Button
                                view="outlined"
                                size="s"
                                width="max"
                                loading={uploadingId === h.id}
                                onClick={() => fileInputRefs.current[h.id]?.click()}
                            >
                                <Icon data={ArrowUpFromLine as IconData} size={14} />
                                Загрузить файл
                            </Button>
                        </div>
                    </Card>
                ))}
                {shown < homework.length && (
                    <Button
                        view="outlined"
                        size="s"
                        width="max"
                        onClick={() => setShown((prev) => Math.min(prev + 5, homework.length))}
                    >
                        Показать ещё ({homework.length - shown})
                    </Button>
                )}
            </div>
        </Card>
    );
};

export default HomeworkTab;
