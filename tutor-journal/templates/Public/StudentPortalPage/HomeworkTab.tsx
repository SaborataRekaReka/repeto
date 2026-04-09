import { useState, useRef } from "react";
import Icon from "@/components/Icon";
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
            <div className="card">
                <div className="p-10 text-center">
                    <p className="text-sm font-bold mb-1">Нет текущих заданий</p>
                    <p className="text-xs text-n-3 dark:text-white/50">
                        Когда репетитор задаст домашнее задание, оно появится
                        здесь.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="card">
            <div className="card-head"><div className="text-h6">Домашнее задание</div></div>
            <div className="p-5 space-y-3">
                {homework.slice(0, shown).map((h) => (
                    <div
                        key={h.id}
                        className={`p-3 rounded-sm border ${
                            h.done
                                ? "border-green-1 bg-green-2 dark:bg-green-1/10"
                                : "border-n-1 dark:border-white"
                        }`}
                    >
                        <div className="flex items-start justify-between">
                            <div className="mr-3">
                                <p
                                    className={`text-sm ${
                                        h.done
                                            ? "line-through text-n-3"
                                            : ""
                                    }`}
                                >
                                    {h.task}
                                </p>
                                <p className="mt-1 text-xs text-n-3 dark:text-white/50">
                                    Срок: {h.due}
                                </p>
                            </div>
                            <button
                                className={`btn-small shrink-0 ${
                                    h.done
                                        ? "btn-stroke !border-green-1 !text-green-1"
                                        : "btn-purple"
                                }`}
                                onClick={() => toggleHomework(h.id)}
                                disabled={updatingId === h.id}
                            >
                                {updatingId === h.id ? "Сохраняем..." : "Выполнено"}
                            </button>
                        </div>
                        {h.linkedFiles && h.linkedFiles.length > 0 && (
                            <div className="mt-3 pt-3 border-t border-dashed border-n-1 dark:border-white/20">
                                <div className="text-xs font-bold text-n-3 dark:text-white/50 mb-2">
                                    Материалы к заданию
                                </div>
                                <div className="space-y-1">
                                    {h.linkedFiles.map((file) => (
                                        <a
                                            key={file.id}
                                            href={file.cloudUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="flex items-center gap-2 p-2 rounded-sm hover:bg-n-4/50 transition-colors dark:hover:bg-white/5"
                                        >
                                            <Icon
                                                className="icon-16 shrink-0 dark:fill-white"
                                                name="document"
                                            />
                                            <span className="text-xs font-bold truncate">
                                                {file.name}
                                            </span>
                                            {file.size && (
                                                <span className="text-xs text-n-3 dark:text-white/50 shrink-0 ml-auto">
                                                    {file.size}
                                                </span>
                                            )}
                                            <Icon
                                                className="icon-12 shrink-0 dark:fill-white"
                                                name="external-link"
                                            />
                                        </a>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Student uploads */}
                        <div className="mt-3 pt-3 border-t border-dashed border-n-1 dark:border-white/20">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-xs font-bold text-n-3 dark:text-white/50">
                                    Мои файлы
                                </span>
                                <span className="text-xs text-n-3 dark:text-white/50">
                                    до 5 МБ · хранятся 3 дня
                                </span>
                            </div>
                            {h.studentUploads && h.studentUploads.length > 0 && (
                                <div className="space-y-1 mb-2">
                                    {h.studentUploads.map((upload) => (
                                        <div
                                            key={upload.id}
                                            className="flex items-center gap-2 p-2 rounded-sm border border-n-1 dark:border-white"
                                        >
                                            <Icon
                                                className="icon-16 shrink-0 dark:fill-white"
                                                name="document"
                                            />
                                            <div className="grow min-w-0">
                                                <span className="text-xs font-bold truncate block">
                                                    {upload.name}
                                                </span>
                                                <span className="text-xs text-n-3 dark:text-white/50">
                                                    {upload.size} · до{" "}
                                                    {upload.expiresAt}
                                                </span>
                                            </div>
                                            <button
                                                type="button"
                                                className="btn-transparent-dark btn-small btn-square shrink-0"
                                                onClick={() =>
                                                    handleRemoveUpload(
                                                        h.id,
                                                        upload.id
                                                    )
                                                }
                                                title="Удалить"
                                            >
                                                <Icon name="close" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                            <input
                                ref={(el) => {
                                    fileInputRefs.current[h.id] = el;
                                }}
                                type="file"
                                className="hidden"
                                accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.txt"
                                onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (file) handleFileUpload(h.id, file);
                                    e.target.value = "";
                                }}
                            />
                            <button
                                className="btn-stroke btn-small w-full"
                                onClick={() =>
                                    fileInputRefs.current[h.id]?.click()
                                }
                                disabled={uploadingId === h.id}
                            >
                                <Icon name="add-circle" />
                                <span>{uploadingId === h.id ? "Загрузка..." : "Загрузить файл"}</span>
                            </button>
                        </div>
                    </div>
                ))}
                {shown < homework.length && (
                    <button
                        className="btn-stroke btn-small w-full"
                        onClick={() =>
                            setShown((prev) =>
                                Math.min(prev + 5, homework.length)
                            )
                        }
                    >
                        Показать ещё ({homework.length - shown})
                    </button>
                )}
            </div>
        </div>
    );
};

export default HomeworkTab;
