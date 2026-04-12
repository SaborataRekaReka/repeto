import { useState, useEffect } from "react";
import {
    Dialog,
    Button,
    Icon,
    TextArea,
    TextInput,
    Text,
} from "@gravity-ui/uikit";
import { File, TrashBin, CirclePlus } from "@gravity-ui/icons";
import type { IconData } from "@gravity-ui/uikit";
import StyledDateInput from "@/components/StyledDateInput";
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
    const [taskTouched, setTaskTouched] = useState(false);
    const [formError, setFormError] = useState<string | null>(null);

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
        setTaskTouched(false);
        setFormError(null);
    }, [visible, homework]);

    const handleAddFile = () => {
        if (!fileName.trim() || !fileUrl.trim()) return;
        setFiles([
            ...files,
            {
                id: `f-${Date.now()}`,
                name: fileName.trim(),
                url: fileUrl.trim(),
            },
        ]);
        setFileName("");
        setFileUrl("");
        setAddingFile(false);
    };

    const handleRemoveFile = (id: string) => {
        setFiles(files.filter((f) => f.id !== id));
    };

    const handleSave = () => {
        setTaskTouched(true);
        if (!task.trim()) {
            setFormError("Заполните обязательные поля.");
            return;
        }
        setFormError(null);
        onSave({ task: task.trim(), dueDate, linkedFiles: files });
    };

    const taskError = taskTouched && !task.trim();

    return (
        <Dialog size="m" open={visible} onClose={onClose}>
            <Dialog.Header
                caption={isEdit ? "Редактировать задание" : "Новое задание"}
            />
            <Dialog.Body>
                <div
                    style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: 16,
                    }}
                >
                    <div>
                        <Text
                            as="label"
                            variant="body-1"
                            color="secondary"
                            style={{ display: "block", marginBottom: 6 }}
                        >
                            Задание *
                        </Text>
                        <div
                            style={
                                taskError
                                    ? {
                                          border: "1px solid var(--g-color-line-danger)",
                                          borderRadius: 8,
                                          padding: 2,
                                      }
                                    : undefined
                            }
                        >
                            <TextArea
                                value={task}
                                onUpdate={setTask}
                                onBlur={() => setTaskTouched(true)}
                                placeholder="Опишите задание..."
                                rows={4}
                                size="m"
                            />
                        </div>
                        {taskError && (
                            <Text as="div" variant="caption-2" style={{ marginTop: 4, color: "var(--g-color-text-danger)" }}>
                                Обязательное поле
                            </Text>
                        )}
                    </div>

                    <div>
                        <Text
                            as="label"
                            variant="body-1"
                            color="secondary"
                            style={{ display: "block", marginBottom: 6 }}
                        >
                            Срок сдачи
                        </Text>
                        <StyledDateInput
                            value={dueDate}
                            onUpdate={setDueDate}
                            style={{ height: 36, padding: "0 12px" }}
                        />
                    </div>

                    {/* Linked files */}
                    <div>
                        <div
                            style={{
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "space-between",
                                marginBottom: 8,
                            }}
                        >
                            <Text variant="body-1" color="secondary">
                                Прикреплённые материалы
                            </Text>
                            {!addingFile && (
                                <Button
                                    view="outlined"
                                    size="s"
                                    onClick={() => setAddingFile(true)}
                                >
                                    <Icon
                                        data={CirclePlus as IconData}
                                        size={14}
                                    />
                                    Добавить
                                </Button>
                            )}
                        </div>

                        {files.map((file) => (
                            <div
                                key={file.id}
                                style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 8,
                                    padding: "6px 10px",
                                    border: "1px solid var(--g-color-line-generic)",
                                    borderRadius: 6,
                                    marginBottom: 6,
                                }}
                            >
                                <Icon data={File as IconData} size={14} />
                                <Text
                                    variant="body-2"
                                    style={{ flex: 1, fontWeight: 600 }}
                                >
                                    {file.name}
                                </Text>
                                <Button
                                    view="flat"
                                    size="xs"
                                    onClick={() => handleRemoveFile(file.id)}
                                >
                                    <Icon
                                        data={TrashBin as IconData}
                                        size={14}
                                    />
                                </Button>
                            </div>
                        ))}

                        {files.length === 0 && !addingFile && (
                            <Text variant="body-2" color="secondary">
                                Файлы не прикреплены
                            </Text>
                        )}

                        {addingFile && (
                            <div
                                style={{
                                    padding: 12,
                                    border: "1px dashed var(--g-color-line-generic)",
                                    borderRadius: 8,
                                    display: "flex",
                                    flexDirection: "column",
                                    gap: 10,
                                }}
                            >
                                <TextInput
                                    value={fileName}
                                    onUpdate={setFileName}
                                    placeholder="Название файла"
                                    size="m"
                                />
                                <TextInput
                                    value={fileUrl}
                                    onUpdate={setFileUrl}
                                    placeholder="https://drive.google.com/..."
                                    size="m"
                                />
                                <div style={{ display: "flex", gap: 8 }}>
                                    <Button
                                        view="action"
                                        size="s"
                                        onClick={handleAddFile}
                                    >
                                        Прикрепить
                                    </Button>
                                    <Button
                                        view="outlined"
                                        size="s"
                                        onClick={() => {
                                            setAddingFile(false);
                                            setFileName("");
                                            setFileUrl("");
                                        }}
                                    >
                                        Отмена
                                    </Button>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Student uploads (read-only) */}
                    {isEdit &&
                        homework?.studentUploads &&
                        homework.studentUploads.length > 0 && (
                            <div>
                                <Text
                                    variant="body-1"
                                    color="secondary"
                                    as="div"
                                    style={{ marginBottom: 8 }}
                                >
                                    Загрузки ученика
                                </Text>
                                {homework.studentUploads.map((upload) => (
                                    <a
                                        key={upload.id}
                                        href={upload.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        style={{
                                            display: "flex",
                                            alignItems: "center",
                                            gap: 8,
                                            padding: "6px 10px",
                                            border: "1px solid var(--g-color-line-generic)",
                                            borderRadius: 6,
                                            marginBottom: 6,
                                            textDecoration: "none",
                                        }}
                                    >
                                        <Icon
                                            data={File as IconData}
                                            size={14}
                                        />
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <Text
                                                variant="body-2"
                                                style={{ fontWeight: 600 }}
                                            >
                                                {upload.name}
                                            </Text>
                                            <Text
                                                variant="caption-2"
                                                color="secondary"
                                                as="div"
                                            >
                                                {upload.size} · Загружено{" "}
                                                {upload.uploadedAt} · Хранится
                                                до {upload.expiresAt}
                                            </Text>
                                        </div>
                                    </a>
                                ))}
                            </div>
                        )}

                    {formError && (
                        <Text as="div" variant="body-1" style={{ color: "var(--g-color-text-danger)" }}>
                            {formError}
                        </Text>
                    )}
                </div>
            </Dialog.Body>
            <Dialog.Footer
                onClickButtonApply={handleSave}
                textButtonApply={isEdit ? "Сохранить" : "Дать задание"}
                onClickButtonCancel={onClose}
                textButtonCancel="Отмена"
                renderButtons={
                    isEdit && onDelete
                        ? (defaultButtons) => (
                              <div
                                  style={{
                                      display: "flex",
                                      width: "100%",
                                      alignItems: "center",
                                      justifyContent: "space-between",
                                  }}
                              >
                                  <Button
                                      view="outlined-danger"
                                      size="m"
                                      onClick={onDelete}
                                  >
                                      <Icon
                                          data={TrashBin as IconData}
                                          size={14}
                                      />
                                      Удалить
                                  </Button>
                                  <div
                                      style={{
                                          display: "flex",
                                          gap: 8,
                                      }}
                                  >
                                      {defaultButtons}
                                  </div>
                              </div>
                          )
                        : undefined
                }
            />
        </Dialog>
    );
};

export default HomeworkModal;
