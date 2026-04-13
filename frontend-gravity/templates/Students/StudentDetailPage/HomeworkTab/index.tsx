import { useState } from "react";
import { Card, Text, Button, Icon, Label } from "@gravity-ui/uikit";
import { CirclePlus, File, TrashBin } from "@gravity-ui/icons";
import type { IconData } from "@gravity-ui/uikit";
import HomeworkModal from "./HomeworkModal";
import { createHomework, updateHomework, deleteHomework } from "@/hooks/useStudents";
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

type HomeworkTabProps = {
    studentId: string;
    homeworks: Homework[];
    onMutate?: () => void;
};

const hwStatusLabel = (status: Homework["status"]) => {
    switch (status) {
        case "not_done":
            return "Не выполнено";
        case "done":
            return "Выполнено";
        case "overdue":
            return "Просрочено";
    }
};

const hwStatusTheme = (
    status: Homework["status"]
): "normal" | "success" | "danger" => {
    switch (status) {
        case "not_done":
            return "normal";
        case "done":
            return "success";
        case "overdue":
            return "danger";
    }
};

const HomeworkTab = ({ studentId, homeworks, onMutate }: HomeworkTabProps) => {
    const [modalVisible, setModalVisible] = useState(false);
    const [editingHomework, setEditingHomework] = useState<Homework | null>(
        null
    );

    const handleCreate = () => {
        setEditingHomework(null);
        setModalVisible(true);
    };

    const handleEdit = (hw: Homework) => {
        setEditingHomework(hw);
        setModalVisible(true);
    };

    const handleSave = async (data: {
        task: string;
        dueDate: string;
        linkedFiles: HomeworkFile[];
    }) => {
        try {
            if (editingHomework) {
                await updateHomework(studentId, editingHomework.id, {
                    task: data.task,
                    dueAt: data.dueDate || undefined,
                });
            } else {
                await createHomework(studentId, {
                    task: data.task,
                    dueAt: data.dueDate || undefined,
                });
            }
            onMutate?.();
        } catch {
            // Ошибка сохранения ДЗ — silent
        }
        setModalVisible(false);
        setEditingHomework(null);
    };

    const handleDelete = async () => {
        if (editingHomework) {
            try {
                await deleteHomework(studentId, editingHomework.id);
                onMutate?.();
            } catch {
                // Ошибка удаления ДЗ — silent
            }
        }
        setModalVisible(false);
        setEditingHomework(null);
    };

    return (
        <>
            <div>
                <div
                    style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        marginBottom: 16,
                    }}
                >
                    <Text variant="subheader-2">Домашние задания</Text>
                    <Button view="action" size="s" onClick={handleCreate}>
                        <Icon data={CirclePlus as IconData} size={14} />
                        Дать задание
                    </Button>
                </div>

                {homeworks.length === 0 ? (
                    <Card
                        view="outlined"
                        style={{ padding: "48px 24px", textAlign: "center" }}
                    >
                        <Text variant="body-1" color="secondary">
                            Домашних заданий пока нет
                        </Text>
                    </Card>
                ) : (
                    <Card view="outlined" style={{ overflow: "hidden" }}>
                        <table className="repeto-students-table">
                            <thead>
                                <tr>
                                    <th>Дата</th>
                                    <th>Задание</th>
                                    <th>Срок</th>
                                    <th>Файлы</th>
                                    <th>Статус</th>
                                    <th></th>
                                </tr>
                            </thead>
                            <tbody>
                                {homeworks.map((hw) => (
                                    <tr
                                        key={hw.id}
                                        style={{ cursor: "pointer" }}
                                        onClick={() => handleEdit(hw)}
                                    >
                                        <td>
                                            <Text variant="body-2">
                                                {hw.date}
                                            </Text>
                                        </td>
                                        <td
                                            style={{
                                                maxWidth: 240,
                                                overflow: "hidden",
                                                textOverflow: "ellipsis",
                                                whiteSpace: "nowrap",
                                            }}
                                        >
                                            <Text variant="body-2">
                                                {hw.task}
                                            </Text>
                                        </td>
                                        <td>
                                            <Text
                                                variant="body-2"
                                                color="secondary"
                                            >
                                                {hw.dueDate}
                                            </Text>
                                        </td>
                                        <td>
                                            {hw.linkedFiles &&
                                            hw.linkedFiles.length > 0 ? (
                                                <span
                                                    style={{
                                                        display: "flex",
                                                        alignItems: "center",
                                                        gap: 4,
                                                    }}
                                                >
                                                    <Icon
                                                        data={File as IconData}
                                                        size={14}
                                                    />
                                                    <Text
                                                        variant="body-2"
                                                        color="secondary"
                                                    >
                                                        {hw.linkedFiles.length}
                                                    </Text>
                                                </span>
                                            ) : (
                                                <Text
                                                    variant="body-2"
                                                    color="secondary"
                                                >
                                                    —
                                                </Text>
                                            )}
                                        </td>
                                        <td>
                                            <Label
                                                theme={hwStatusTheme(hw.status)}
                                                size="xs"
                                            >
                                                {hwStatusLabel(hw.status)}
                                            </Label>
                                        </td>
                                        <td
                                            onClick={(e) =>
                                                e.stopPropagation()
                                            }
                                        >
                                            {hw.studentUploads &&
                                                hw.studentUploads.length > 0 && (
                                                    <Button
                                                        view="flat"
                                                        size="xs"
                                                        title="Скачать файлы ученика"
                                                        onClick={() =>
                                                            hw.studentUploads!.forEach(
                                                                (u) =>
                                                                    window.open(
                                                                        u.url,
                                                                        "_blank",
                                                                        "noopener,noreferrer"
                                                                    )
                                                            )
                                                        }
                                                    >
                                                        <Icon
                                                            data={
                                                                File as IconData
                                                            }
                                                            size={14}
                                                        />
                                                    </Button>
                                                )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </Card>
                )}
            </div>

            <HomeworkModal
                visible={modalVisible}
                onClose={() => {
                    setModalVisible(false);
                    setEditingHomework(null);
                }}
                homework={editingHomework}
                onSave={handleSave}
                onDelete={handleDelete}
            />
        </>
    );
};

export default HomeworkTab;
export type { Homework };
