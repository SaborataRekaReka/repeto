import { useCallback, useRef, useState } from "react";
import { Card, Text, TextInput } from "@gravity-ui/uikit";
import type { Student } from "@/types/student";

type ContactsTabProps = {
    student: Student;
    onSave?: (data: Partial<Student>) => Promise<void>;
};

type FieldKey =
    | "phone"
    | "whatsapp"
    | "parentName"
    | "parentPhone"
    | "parentWhatsapp"
    | "parentEmail";

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

const ContactsTab = ({ student, onSave }: ContactsTabProps) => {
    const busyRef = useRef(false);

    const [phone, setPhone] = useState(student.phone || "");
    const [whatsapp, setWhatsapp] = useState(student.whatsapp || "");
    const [parentName, setParentName] = useState(student.parentName || "");
    const [parentPhone, setParentPhone] = useState(student.parentPhone || "");
    const [parentWhatsapp, setParentWhatsapp] = useState(
        student.parentWhatsapp || ""
    );
    const [parentEmail, setParentEmail] = useState(student.parentEmail || "");

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

    const handleBlur = (
        key: FieldKey,
        value: string,
        prev: string | undefined
    ) => {
        const trimmed = value.trim();
        if (trimmed !== (prev || "")) {
            persist({ [key]: trimmed || undefined } as any);
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
                    Контакты ученика
                </Text>
                <div
                    style={{
                        display: "grid",
                        gridTemplateColumns: "1fr 1fr",
                        gap: 16,
                    }}
                >
                    <div>
                        <FieldLabel>Телефон</FieldLabel>
                        <TextInput
                            value={phone}
                            onUpdate={setPhone}
                            onBlur={() =>
                                handleBlur("phone", phone, student.phone)
                            }
                            placeholder="+7 900 123-45-67"
                            size="m"
                        />
                    </div>
                    <div>
                        <FieldLabel>WhatsApp</FieldLabel>
                        <TextInput
                            value={whatsapp}
                            onUpdate={setWhatsapp}
                            onBlur={() =>
                                handleBlur(
                                    "whatsapp",
                                    whatsapp,
                                    student.whatsapp
                                )
                            }
                            placeholder="+79001234567"
                            size="m"
                        />
                    </div>
                    <div>
                        <FieldLabel>Telegram</FieldLabel>
                        <Text variant="body-1" color={student.telegramChatId ? "positive" : "secondary"}>
                            {student.telegramChatId ? "✅ Подключён" : "Не подключён"}
                        </Text>
                    </div>
                    <div>
                        <FieldLabel>Макс</FieldLabel>
                        <Text variant="body-1" color={student.maxChatId ? "positive" : "secondary"}>
                            {student.maxChatId ? "✅ Подключён" : "Не подключён"}
                        </Text>
                    </div>
                </div>
            </Card>
            <Card view="outlined" style={{ padding: 20 }}>
                <Text
                    variant="subheader-2"
                    as="div"
                    style={{ marginBottom: 16 }}
                >
                    Контакты родителя
                </Text>
                <div
                    style={{
                        display: "grid",
                        gridTemplateColumns: "1fr 1fr",
                        gap: 16,
                    }}
                >
                    <div style={{ gridColumn: "1 / -1" }}>
                        <FieldLabel>ФИО родителя</FieldLabel>
                        <TextInput
                            value={parentName}
                            onUpdate={setParentName}
                            onBlur={() =>
                                handleBlur(
                                    "parentName",
                                    parentName,
                                    student.parentName
                                )
                            }
                            placeholder="Иванова Мария Петровна"
                            size="m"
                        />
                    </div>
                    <div>
                        <FieldLabel>Телефон родителя</FieldLabel>
                        <TextInput
                            value={parentPhone}
                            onUpdate={setParentPhone}
                            onBlur={() =>
                                handleBlur(
                                    "parentPhone",
                                    parentPhone,
                                    student.parentPhone
                                )
                            }
                            placeholder="+7 900 765-43-21"
                            size="m"
                        />
                    </div>
                    <div>
                        <FieldLabel>WhatsApp родителя</FieldLabel>
                        <TextInput
                            value={parentWhatsapp}
                            onUpdate={setParentWhatsapp}
                            onBlur={() =>
                                handleBlur(
                                    "parentWhatsapp",
                                    parentWhatsapp,
                                    student.parentWhatsapp
                                )
                            }
                            placeholder="+79007654321"
                            size="m"
                        />
                    </div>
                    <div style={{ gridColumn: "1 / -1" }}>
                        <FieldLabel>Email родителя</FieldLabel>
                        <TextInput
                            value={parentEmail}
                            onUpdate={setParentEmail}
                            onBlur={() =>
                                handleBlur(
                                    "parentEmail",
                                    parentEmail,
                                    student.parentEmail
                                )
                            }
                            placeholder="parent@email.com"
                            size="m"
                        />
                    </div>
                </div>
            </Card>
        </div>
    );
};

export default ContactsTab;
