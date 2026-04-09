import { useCallback, useRef, useState } from "react";
import { Listbox, Transition } from "@headlessui/react";
import Icon from "@/components/Icon";
import { getStatusLabel, getStatusColor } from "@/mocks/students";
import type { Student, StudentStatus } from "@/types/student";

const subjectOptions = [
    { id: "math", title: "Математика" },
    { id: "eng", title: "Английский" },
    { id: "phys", title: "Физика" },
    { id: "rus", title: "Русский язык" },
    { id: "chem", title: "Химия" },
    { id: "bio", title: "Биология" },
    { id: "hist", title: "История" },
    { id: "other", title: "Другой" },
];

const statusOptions: StudentStatus[] = ["active", "paused", "archived"];

type ProfileTabProps = {
    student: Student;
    onSave?: (data: Partial<Student>) => Promise<void>;
};

const fieldCell =
    "mt-4 mx-2.5 pb-3 border-b border-n-1 dark:border-white w-[calc(50%-1.25rem)] md:w-[calc(100%-1.25rem)]";

const ProfileTab = ({ student, onSave }: ProfileTabProps) => {
    const busyRef = useRef(false);

    const persist = useCallback(
        async (patch: Partial<Student>) => {
            if (busyRef.current) return;
            busyRef.current = true;
            try {
                await onSave?.(patch as any);
            } catch {
                /* silent */
            }
            busyRef.current = false;
        },
        [onSave]
    );

    const handleBlur =
        (key: keyof Student, prev: string) =>
        (e: React.FocusEvent<HTMLSpanElement>) => {
            const next = (e.currentTarget.textContent || "").trim();
            if (next === prev) return;
            if (key === "rate" || key === "age") {
                const num = Number(next);
                if (key === "rate") {
                    if (num && num !== student.rate) persist({ rate: num });
                    else e.currentTarget.textContent = prev; // revert invalid
                } else {
                    if (num && num !== student.age) persist({ age: num } as any);
                    else if (!next || next === "-") persist({ age: undefined } as any);
                    else e.currentTarget.textContent = prev; // revert invalid
                }
            } else {
                persist({ [key]: next || undefined } as any);
            }
        };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLSpanElement>) => {
        if (e.key === "Enter") {
            e.preventDefault();
            e.currentTarget.blur();
        }
        if (e.key === "Escape") {
            e.currentTarget.blur();
        }
    };

    const editable = (
        label: string,
        key: keyof Student,
        display: string,
        raw: string
    ) => (
        <div className={fieldCell}>
            <div className="mb-1.5 text-xs text-n-3 dark:text-white/75">
                {label}
            </div>
            <span
                className="block text-sm font-bold outline-none cursor-text min-h-[1.25rem]"
                contentEditable
                suppressContentEditableWarning
                onBlur={handleBlur(key, raw)}
                onKeyDown={handleKeyDown}
            >
                {display || "-"}
            </span>
        </div>
    );

    const [subjectOpen, setSubjectOpen] = useState(false);
    const [statusOpen, setStatusOpen] = useState(false);

    const handleSubjectChange = (v: any) => {
        const title = v?.title;
        setSubjectOpen(false);
        if (title && title !== student.subject) {
            persist({ subject: title } as any);
        }
    };

    const handleStatusChange = (v: StudentStatus) => {
        setStatusOpen(false);
        if (v !== student.status) {
            persist({ status: v } as any);
        }
    };

    return (
        <div>
            <div className="mb-10">
                <div className="mb-5 text-h6">Основное</div>
                <div className="flex flex-wrap -mt-4 -mx-2.5">
                    {editable("ФИО", "name", student.name, student.name)}
                    {editable(
                        "Класс",
                        "grade",
                        student.grade || "-",
                        student.grade
                    )}
                    {editable(
                        "Возраст",
                        "age" as any,
                        student.age ? String(student.age) : "-",
                        student.age ? String(student.age) : ""
                    )}

                    <div className={fieldCell}>
                        <div className="mb-1.5 text-xs text-n-3 dark:text-white/75">
                            Предмет
                        </div>
                        <div className="relative">
                            <Listbox
                                value={
                                    subjectOptions.find(
                                        (s) => s.title === student.subject
                                    ) || null
                                }
                                onChange={handleSubjectChange}
                            >
                                <Listbox.Button
                                    className="flex items-center w-full text-sm font-bold outline-none cursor-pointer min-h-[1.25rem] dark:text-white"
                                    onClick={() => setSubjectOpen((o) => !o)}
                                >
                                    <span className="mr-auto truncate">
                                        {student.subject || "-"}
                                    </span>
                                    <Icon
                                        className={`shrink-0 icon-16 ml-2 transition-transform dark:fill-white ${
                                            subjectOpen ? "rotate-180" : ""
                                        }`}
                                        name="arrow-bottom"
                                    />
                                </Listbox.Button>
                                <Transition
                                    show={subjectOpen}
                                    leave="transition duration-150"
                                    leaveFrom="opacity-100"
                                    leaveTo="opacity-0"
                                >
                                    <Listbox.Options
                                        static
                                        className="absolute left-0 right-0 mt-2 py-1 bg-white border border-n-1 rounded-sm shadow-lg z-10 dark:bg-n-1 dark:border-white"
                                    >
                                        {subjectOptions.map((item) => (
                                            <Listbox.Option
                                                key={item.id}
                                                value={item}
                                                className={({ active }) =>
                                                    `px-4 py-2 text-sm cursor-pointer transition-colors ${
                                                        active
                                                            ? "bg-background dark:bg-n-2"
                                                            : ""
                                                    } ${
                                                        item.title ===
                                                        student.subject
                                                            ? "font-bold text-purple-1"
                                                            : ""
                                                    }`
                                                }
                                            >
                                                {item.title}
                                            </Listbox.Option>
                                        ))}
                                    </Listbox.Options>
                                </Transition>
                            </Listbox>
                        </div>
                    </div>

                    <div className={fieldCell}>
                        <div className="mb-1.5 text-xs text-n-3 dark:text-white/75">
                            Ставка за занятие
                        </div>
                        <div className="flex items-baseline gap-1">
                            <span
                                className="text-sm font-bold outline-none cursor-text min-h-[1.25rem]"
                                contentEditable
                                suppressContentEditableWarning
                                onBlur={handleBlur("rate" as any, String(student.rate))}
                                onKeyDown={handleKeyDown}
                            >
                                {student.rate.toLocaleString("ru-RU")}
                            </span>
                            <span className="text-sm font-bold text-n-3 dark:text-white/50 select-none">₽</span>
                        </div>
                    </div>

                    <div className={fieldCell}>
                        <div className="mb-1.5 text-xs text-n-3 dark:text-white/75">
                            Статус
                        </div>
                        <div className="relative">
                            <Listbox
                                value={student.status}
                                onChange={handleStatusChange}
                            >
                                <Listbox.Button
                                    className="flex items-center w-full text-sm font-bold outline-none cursor-pointer min-h-[1.25rem] dark:text-white"
                                    onClick={() => setStatusOpen((o) => !o)}
                                >
                                    <div
                                        className={`w-2 h-2 mr-2 rounded-full shrink-0 ${getStatusColor(
                                            student.status
                                        )}`}
                                    />
                                    <span className="mr-auto truncate">
                                        {getStatusLabel(student.status)}
                                    </span>
                                    <Icon
                                        className={`shrink-0 icon-16 ml-2 transition-transform dark:fill-white ${
                                            statusOpen ? "rotate-180" : ""
                                        }`}
                                        name="arrow-bottom"
                                    />
                                </Listbox.Button>
                                <Transition
                                    show={statusOpen}
                                    leave="transition duration-150"
                                    leaveFrom="opacity-100"
                                    leaveTo="opacity-0"
                                >
                                    <Listbox.Options
                                        static
                                        className="absolute left-0 right-0 mt-2 py-1 bg-white border border-n-1 rounded-sm shadow-lg z-10 dark:bg-n-1 dark:border-white"
                                    >
                                        {statusOptions.map((s) => (
                                            <Listbox.Option
                                                key={s}
                                                value={s}
                                                className={({ active }) =>
                                                    `flex items-center px-4 py-2 text-sm cursor-pointer transition-colors ${
                                                        active
                                                            ? "bg-background dark:bg-n-2"
                                                            : ""
                                                    } ${
                                                        s === student.status
                                                            ? "font-bold text-purple-1"
                                                            : ""
                                                    }`
                                                }
                                            >
                                                <div
                                                    className={`w-2 h-2 mr-2 rounded-full shrink-0 ${getStatusColor(
                                                        s
                                                    )}`}
                                                />
                                                {getStatusLabel(s)}
                                            </Listbox.Option>
                                        ))}
                                    </Listbox.Options>
                                </Transition>
                            </Listbox>
                        </div>
                    </div>
                </div>
            </div>
            <div>
                <div className="mb-5 text-h6">Дополнительно</div>
                <div className="pb-3 border-b border-n-1 dark:border-white">
                    <span
                        className="block text-sm whitespace-pre-wrap outline-none cursor-text min-h-[1.25rem]"
                        contentEditable
                        suppressContentEditableWarning
                        onBlur={handleBlur("notes" as any, student.notes || "")}
                        onKeyDown={(e) => {
                            if (e.key === "Escape") e.currentTarget.blur();
                        }}
                    >
                        {(student.notes || "").trim() || "—"}
                    </span>
                </div>
            </div>
        </div>
    );
};

export default ProfileTab;
