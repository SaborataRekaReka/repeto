import { useCallback, useRef, useState } from "react";
import { Card, Text, TextInput, Select } from "@gravity-ui/uikit";
import type { Student, StudentStatus } from "@/types/student";

const subjectOptions = [
    { value: "Математика", content: "Математика" },
    { value: "Английский", content: "Английский" },
    { value: "Физика", content: "Физика" },
    { value: "Русский язык", content: "Русский язык" },
    { value: "Химия", content: "Химия" },
    { value: "Биология", content: "Биология" },
    { value: "История", content: "История" },
    { value: "Другой", content: "Другой" },
];

const statusOptions = [
    { value: "active", content: "Активен" },
    { value: "paused", content: "На паузе" },
    { value: "archived", content: "Архив" },
];

type ProfileTabProps = {
    student: Student;
    onSave?: (data: Partial<Student>) => Promise<void>;
};

const FieldLabel = ({ children }: { children: React.ReactNode }) => (
    <Text
        as="div"
        variant="body-1"
        color="secondary"
        style={{ marginBottom: 4 }}
    >
        {children}
    </Text>
);

const ProfileTab = ({ student, onSave }: ProfileTabProps) => {
    const busyRef = useRef(false);
    const [localName, setLocalName] = useState(student.name);
    const [localGrade, setLocalGrade] = useState(student.grade || "");
    const [localAge, setLocalAge] = useState(
        student.age ? String(student.age) : ""
    );
    const [localRate, setLocalRate] = useState(String(student.rate));
    const [localNotes, setLocalNotes] = useState(student.notes || "");

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

    const handleBlurText = (
        key: keyof Student,
        value: string,
        prev: string | undefined
    ) => {
        const trimmed = value.trim();
        if (trimmed !== (prev || "")) {
            persist({ [key]: trimmed || undefined } as any);
        }
    };

    const handleBlurNumber = (
        key: keyof Student,
        value: string,
        prev: number | undefined
    ) => {
        const num = Number(value.trim());
        if (num && num !== prev) {
            persist({ [key]: num } as any);
        }
    };

    return (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <Card view="outlined" style={{ padding: 20 }}>
                <Text
                    variant="subheader-2"
                    as="div"
                    style={{ marginBottom: 16 }}
                >
                    Основное
                </Text>
                <div
                    style={{
                        display: "grid",
                        gridTemplateColumns: "1fr 1fr",
                        gap: 16,
                    }}
                >
                    <div>
                        <FieldLabel>ФИО</FieldLabel>
                        <TextInput
                            value={localName}
                            onUpdate={setLocalName}
                            onBlur={() =>
                                handleBlurText("name", localName, student.name)
                            }
                            size="l"
                        />
                    </div>
                    <div>
                        <FieldLabel>Класс</FieldLabel>
                        <TextInput
                            value={localGrade}
                            onUpdate={setLocalGrade}
                            onBlur={() =>
                                handleBlurText(
                                    "grade",
                                    localGrade,
                                    student.grade
                                )
                            }
                            placeholder="11 или Взрослый"
                            size="l"
                        />
                    </div>
                    <div>
                        <FieldLabel>Возраст</FieldLabel>
                        <TextInput
                            value={localAge}
                            onUpdate={setLocalAge}
                            onBlur={() =>
                                handleBlurNumber(
                                    "age" as any,
                                    localAge,
                                    student.age
                                )
                            }
                            placeholder="—"
                            size="l"
                        />
                    </div>
                    <div>
                        <FieldLabel>Предмет</FieldLabel>
                        <Select
                            options={subjectOptions}
                            value={[student.subject]}
                            onUpdate={([v]) =>
                                persist({ subject: v } as any)
                            }
                            size="l"
                            width="max"
                        />
                    </div>
                    <div>
                        <FieldLabel>Ставка (₽)</FieldLabel>
                        <TextInput
                            value={localRate}
                            onUpdate={setLocalRate}
                            onBlur={() =>
                                handleBlurNumber("rate", localRate, student.rate)
                            }
                            size="l"
                        />
                    </div>
                    <div>
                        <FieldLabel>Статус</FieldLabel>
                        <Select
                            options={statusOptions}
                            value={[student.status]}
                            onUpdate={([v]) =>
                                persist({ status: v as StudentStatus } as any)
                            }
                            size="l"
                            width="max"
                        />
                    </div>
                </div>
            </Card>
            <Card view="outlined" style={{ padding: 20 }}>
                <Text
                    variant="subheader-2"
                    as="div"
                    style={{ marginBottom: 16 }}
                >
                    Дополнительно
                </Text>
                <FieldLabel>Заметки о профиле</FieldLabel>
                <TextInput
                    value={localNotes}
                    onUpdate={setLocalNotes}
                    onBlur={() =>
                        handleBlurText(
                            "notes",
                            localNotes,
                            student.notes || ""
                        )
                    }
                    placeholder="Особенности, пожелания..."
                    size="l"
                />
            </Card>
        </div>
    );
};

export default ProfileTab;
