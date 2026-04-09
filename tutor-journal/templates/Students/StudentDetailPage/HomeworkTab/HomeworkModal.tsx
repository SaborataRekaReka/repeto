import { useState, useEffect } from "react";
import Modal from "@/components/Modal";
import Field from "@/components/Field";
import Icon from "@/components/Icon";
import type { HomeworkFile, StudentUploadFile } from "@/mocks/student-details";

type Homework = {
    id: string;
    date: string;
    task: string;
    dueDate: string;
    status: "not_done" | "done" | "overdue";
    linkedFiles?: HomeworkFile[];
    studentUploads?: StudentUploadFile[];
};

type HomeworkModalProps = {
    visible: boolean;
    onClose: () => void;
    homework?: Homework | null;
    onSave: (data: {
        task: string;
        dueDate: string;
        linkedFiles: HomeworkFile[];
    }) => void;
    onDelete?: () => void;
};

const HomeworkModal = ({
    visible,
    onClose,
    homework,
    onSave,
    onDelete,
}: HomeworkModalProps) => {
    const [task, setTask] = useState("");
    const [dueDate, setDueDate] = useState("");
    const [files, setFiles] = useState<HomeworkFile[]>([]);
    const [addingFile, setAddingFile] = useState(false);
    const [fileName, setFileName] = useState("");
    const [fileUrl, setFileUrl] = useState("");

    const isEdit = !!homework;

    useEffect(() => {
        if (visible && homework) {
            setTask(homework.task);
            setDueDate(homework.dueDate);
            setFiles(homework.linkedFiles || []);
        } else if (visible) {
            setTask("");
            setDueDate("");
            setFiles([]);
        }
        setAddingFile(false);
        setFileName("");
        setFileUrl("");
    }, [visible, homework]);

    const handleAddFile = () => {
        if (!fileName.trim() || !fileUrl.trim()) return;
        setFiles([
            ...files,
            { id: `f-${Date.now()}`, name: fileName.trim(), url: fileUrl.trim() },
        ]);
        setFileName("");
        setFileUrl("");
        setAddingFile(false);
    };

    const handleRemoveFile = (id: string) => {
        setFiles(files.filter((f) => f.id !== id));
    };

    const handleSave = () => {
        if (!task.trim()) return;
        onSave({ task: task.trim(), dueDate, linkedFiles: files });
    };

    return (
        <Modal
            classWrap="max-w-[36rem]"
            title={isEdit ? "Редактировать задание" : "Новое задание"}
            visible={visible}
            onClose={onClose}
        >
            <div className="p-6 space-y-4">
                <Field
                    label="Задание *"
                    type="text"
                    placeholder="Опишите задание..."
                    value={task}
                    onChange={(e: any) => setTask(e.target.value)}
                    textarea
                    required
                />
                <Field
                    label="Срок сдачи"
                    type="date"
                    placeholder=""
                    value={dueDate}
                    onChange={(e: any) => setDueDate(e.target.value)}
                />

                {/* Linked files section */}
                <div>
                    <div className="flex items-center justify-between mb-2">
                        <label className="text-xs font-bold text-n-3 dark:text-white/50">
                            Прикреплённые материалы
                        </label>
                        {!addingFile && (
                            <button
                                type="button"
                                className="btn-stroke btn-small"
                                onClick={() => setAddingFile(true)}
                            >
                                <Icon name="add-circle" />
                                <span>Добавить файл</span>
                            </button>
                        )}
                    </div>

                    {files.length > 0 && (
                        <div className="space-y-1 mb-3">
                            {files.map((file) => (
                                <div
                                    key={file.id}
                                    className="flex items-center gap-2 p-2 rounded-sm border border-n-1 dark:border-white"
                                >
                                    <Icon
                                        className="icon-16 shrink-0 dark:fill-white"
                                        name="document"
                                    />
                                    <span className="text-sm font-bold truncate grow">
                                        {file.name}
                                    </span>
                                    <button
                                        type="button"
                                        className="btn-transparent-dark btn-small btn-square shrink-0"
                                        onClick={() =>
                                            handleRemoveFile(file.id)
                                        }
                                        title="Убрать файл"
                                    >
                                        <Icon name="close" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}

                    {files.length === 0 && !addingFile && (
                        <p className="text-xs text-n-3 dark:text-white/50">
                            Файлы не прикреплены
                        </p>
                    )}

                    {addingFile && (
                        <div className="p-3 rounded-sm border border-dashed border-n-1 dark:border-white space-y-3">
                            <Field
                                label="Название файла"
                                type="text"
                                placeholder="Таблица формул.pdf"
                                value={fileName}
                                onChange={(e: any) =>
                                    setFileName(e.target.value)
                                }
                            />
                            <Field
                                label="Ссылка (Google Drive, Яндекс Диск...)"
                                type="url"
                                placeholder="https://drive.google.com/..."
                                value={fileUrl}
                                onChange={(e: any) =>
                                    setFileUrl(e.target.value)
                                }
                            />
                            <div className="flex gap-2">
                                <button
                                    type="button"
                                    className="btn-purple btn-small"
                                    onClick={handleAddFile}
                                >
                                    Прикрепить
                                </button>
                                <button
                                    type="button"
                                    className="btn-stroke btn-small"
                                    onClick={() => {
                                        setAddingFile(false);
                                        setFileName("");
                                        setFileUrl("");
                                    }}
                                >
                                    Отмена
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* Student uploads (read-only for tutor) */}
                {isEdit &&
                    homework?.studentUploads &&
                    homework.studentUploads.length > 0 && (
                        <div>
                            <label className="text-xs font-bold text-n-3 dark:text-white/50 mb-2 block">
                                Загрузки ученика
                            </label>
                            <div className="space-y-1">
                                {homework.studentUploads.map((upload) => (
                                    <a
                                        key={upload.id}
                                        href={upload.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center gap-2 p-2 rounded-sm border border-n-1 dark:border-white hover:bg-n-4/50 transition-colors dark:hover:bg-white/5"
                                    >
                                        <Icon
                                            className="icon-16 shrink-0 dark:fill-white"
                                            name="document"
                                        />
                                        <div className="grow min-w-0">
                                            <span className="text-sm font-bold truncate block">
                                                {upload.name}
                                            </span>
                                            <span className="text-xs text-n-3 dark:text-white/50">
                                                {upload.size} · Загружено{" "}
                                                {upload.uploadedAt} · Хранится
                                                до {upload.expiresAt}
                                            </span>
                                        </div>
                                        <Icon
                                            className="icon-14 shrink-0 dark:fill-white"
                                            name="external-link"
                                        />
                                    </a>
                                ))}
                            </div>
                        </div>
                    )}

                <div className="flex gap-3 pt-4 border-t border-n-1 dark:border-white">
                    <button
                        className="btn-purple btn-medium grow"
                        onClick={handleSave}
                    >
                        {isEdit ? "Сохранить" : "Дать задание"}
                    </button>
                    <button
                        className="btn-stroke btn-medium grow"
                        onClick={onClose}
                    >
                        Отмена
                    </button>
                </div>
                {isEdit && onDelete && (
                    <button
                        className="mt-3 text-xs text-pink-1 font-bold hover:underline transition-colors"
                        onClick={onDelete}
                    >
                        Удалить задание
                    </button>
                )}
            </div>
        </Modal>
    );
};

export default HomeworkModal;
