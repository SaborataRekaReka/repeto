import { useState } from "react";
import Icon from "@/components/Icon";

type Homework = {
    id: string;
    date: string;
    task: string;
    dueDate: string;
    status: "not_done" | "done" | "overdue";
};

type HomeworkTabProps = {
    homeworks: Homework[];
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
            return "bg-green-1 text-n-1 px-2 py-0.5 text-xs font-bold";
        case "overdue":
            return "bg-pink-1 text-n-1 px-2 py-0.5 text-xs font-bold";
    }
};

const HomeworkTab = ({ homeworks: initialHomeworks }: HomeworkTabProps) => {
    const [homeworks, setHomeworks] = useState<Homework[]>(initialHomeworks);
    const [adding, setAdding] = useState(false);
    const [newTask, setNewTask] = useState("");
    const [newDue, setNewDue] = useState("");

    const handleAdd = () => {
        if (!newTask.trim()) return;
        const hw: Homework = {
            id: `hw-${Date.now()}`,
            date: new Date().toLocaleDateString("ru-RU", {
                day: "numeric",
                month: "short",
                year: "numeric",
            }),
            task: newTask.trim(),
            dueDate: newDue || "—",
            status: "not_done",
        };
        setHomeworks([hw, ...homeworks]);
        setNewTask("");
        setNewDue("");
        setAdding(false);
    };

    const toggleDone = (id: string) => {
        setHomeworks(
            homeworks.map((hw) =>
                hw.id === id
                    ? {
                          ...hw,
                          status: hw.status === "done" ? "not_done" : "done",
                      }
                    : hw
            )
        );
    };

    return (
        <div className="card">
            <div className="card-head">
                <div className="card-title !p-0">Домашние задания</div>
                <button
                    className="btn-purple btn-small"
                    onClick={() => setAdding(true)}
                >
                    <Icon name="add-circle" />
                    <span>Задать ДЗ</span>
                </button>
            </div>
            <div className="px-5 pb-5">
                {adding && (
                    <div className="mb-4 p-4 border-2 border-n-1 rounded-xl dark:border-white">
                        <textarea
                            className="w-full h-20 text-sm bg-transparent outline-none resize-none placeholder:text-n-3 dark:text-white dark:placeholder:text-white/50"
                            placeholder="Описание задания..."
                            value={newTask}
                            onChange={(e) => setNewTask(e.target.value)}
                            autoFocus
                        />
                        <div className="flex items-center gap-3 mt-2">
                            <label className="text-xs text-n-3 dark:text-white/50">
                                Срок:
                            </label>
                            <input
                                type="date"
                                className="text-sm bg-transparent border border-n-1 rounded px-2 py-1 outline-none dark:border-white dark:text-white"
                                value={newDue}
                                onChange={(e) => setNewDue(e.target.value)}
                            />
                        </div>
                        <div className="flex gap-2 mt-3">
                            <button
                                className="btn-purple btn-small"
                                onClick={handleAdd}
                            >
                                Сохранить
                            </button>
                            <button
                                className="btn-stroke btn-small"
                                onClick={() => {
                                    setAdding(false);
                                    setNewTask("");
                                    setNewDue("");
                                }}
                            >
                                Отмена
                            </button>
                        </div>
                    </div>
                )}
                {homeworks.length === 0 && !adding ? (
                    <div className="py-8 text-center text-sm text-n-3 dark:text-white/50">
                        Домашних заданий пока нет
                    </div>
                ) : (
                    <table className="table-custom -mt-0.25 border-none w-full">
                        <thead>
                            <tr>
                                <th className="th-custom">Дата</th>
                                <th className="th-custom">Задание</th>
                                <th className="th-custom lg:hidden">Срок</th>
                                <th className="th-custom">Статус</th>
                                <th className="th-custom w-10"></th>
                            </tr>
                        </thead>
                        <tbody>
                            {homeworks.map((hw) => (
                                <tr key={hw.id}>
                                    <td className="td-custom text-sm">
                                        {hw.date}
                                    </td>
                                    <td className="td-custom text-sm font-bold max-w-[16rem] truncate">
                                        {hw.task}
                                    </td>
                                    <td className="td-custom text-sm lg:hidden">
                                        {hw.dueDate}
                                    </td>
                                    <td className="td-custom">
                                        <span className={statusClass(hw.status)}>
                                            {statusLabel(hw.status)}
                                        </span>
                                    </td>
                                    <td className="td-custom w-10 !px-2">
                                        <button
                                            className="btn-transparent-dark btn-small btn-square"
                                            onClick={() => toggleDone(hw.id)}
                                            title={
                                                hw.status === "done"
                                                    ? "Отменить выполнение"
                                                    : "Отметить выполненным"
                                            }
                                        >
                                            <Icon name="check" />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
};

export default HomeworkTab;
export type { Homework };
