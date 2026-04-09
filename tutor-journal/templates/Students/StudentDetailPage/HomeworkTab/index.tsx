import { useState } from "react";
import Icon from "@/components/Icon";
import DropdownMenu from "@/components/DropdownMenu";
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

const statusLabel = (status: Homework["status"]) => {
    switch (status) {
        case "not_done":
            return "Не выполнено";
        case "done":
            return "Выполнено";
        case "overdue":
            return "Просрочено";
    }
};

const statusClass = (status: Homework["status"]) => {
    switch (status) {
        case "not_done":
            return "label-stroke";
        case "done":
            return "label-green";
        case "overdue":
            return "label-stroke-pink";
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
        } catch (err) {
            console.error("Failed to save homework:", err);
        }
        setModalVisible(false);
        setEditingHomework(null);
    };

    const handleDelete = async () => {
        if (editingHomework) {
            try {
                await deleteHomework(studentId, editingHomework.id);
                onMutate?.();
            } catch (err) {
                console.error("Failed to delete homework:", err);
            }
        }
        setModalVisible(false);
        setEditingHomework(null);
    };

    return (
        <>
            <div className="card">
                <div className="card-head">
                    <div className="text-h6">Домашние задания</div>
                    <button
                        className="btn-purple btn-small"
                        onClick={handleCreate}
                    >
                        <Icon name="add-circle" />
                        <span>Дать задание</span>
                    </button>
                </div>
                {homeworks.length === 0 ? (
                    <div className="py-8 text-center text-sm text-n-3 dark:text-white/50">
                        Домашних заданий пока нет
                    </div>
                ) : (
                    <div>
                        <table className="w-full">
                            <thead>
                                <tr>
                                    <th className="th-custom">Дата</th>
                                    <th className="th-custom">Задание</th>
                                    <th className="th-custom lg:hidden">
                                        Срок
                                    </th>
                                    <th className="th-custom lg:hidden">
                                        Файлы
                                    </th>
                                    <th className="th-custom">Статус</th>
                                    <th className="th-custom w-10"></th>
                                </tr>
                            </thead>
                            <tbody>
                                {homeworks.map((hw) => (
                                    <tr
                                        key={hw.id}
                                        className="cursor-pointer hover:bg-n-4/50 transition-colors dark:hover:bg-white/5"
                                        onClick={() => handleEdit(hw)}
                                    >
                                        <td className="td-custom text-sm">
                                            {hw.date}
                                        </td>
                                        <td className="td-custom text-sm font-bold max-w-[16rem] truncate">
                                            {hw.task}
                                        </td>
                                        <td className="td-custom text-sm lg:hidden">
                                            {hw.dueDate}
                                        </td>
                                        <td className="td-custom text-sm lg:hidden">
                                            {hw.linkedFiles &&
                                            hw.linkedFiles.length > 0 ? (
                                                <span className="flex items-center gap-1 text-n-3 dark:text-white/50">
                                                    <Icon
                                                        className="icon-16 dark:fill-white"
                                                        name="document"
                                                    />
                                                    {hw.linkedFiles.length}
                                                </span>
                                            ) : (
                                                <span className="text-n-3 dark:text-white/50">
                                                    —
                                                </span>
                                            )}
                                        </td>
                                        <td className="td-custom">
                                            <span
                                                className={statusClass(
                                                    hw.status
                                                )}
                                            >
                                                {statusLabel(hw.status)}
                                            </span>
                                        </td>
                                        <td className="td-custom w-10 !px-2" onClick={(e) => e.stopPropagation()}>
                                            <DropdownMenu
                                                items={[
                                                    {
                                                        label: "Открыть задание",
                                                        icon: "edit",
                                                        onClick: () => handleEdit(hw),
                                                    },
                                                    ...(hw.studentUploads && hw.studentUploads.length > 0
                                                        ? [
                                                              {
                                                                  label: "Скачать файлы ученика",
                                                                  icon: "document",
                                                                  onClick: () =>
                                                                      hw.studentUploads!.forEach((u) =>
                                                                          window.open(u.url, "_blank", "noopener,noreferrer")
                                                                      ),
                                                              },
                                                          ]
                                                        : []),
                                                    {
                                                        label: "Удалить",
                                                        icon: "close",
                                                        onClick: async () => {
                                                            try {
                                                                await deleteHomework(studentId, hw.id);
                                                                onMutate?.();
                                                            } catch (err) {
                                                                console.error("Failed to delete homework:", err);
                                                            }
                                                        },
                                                        danger: true,
                                                    },
                                                ]}
                                            />
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
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
