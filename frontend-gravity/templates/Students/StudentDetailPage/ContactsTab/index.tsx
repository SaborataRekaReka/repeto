import { useCallback, useRef, useState } from "react";
import { Card, Label, Text, TextInput } from "@gravity-ui/uikit";
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

type MessengerStatusCardProps = {
    title: string;
    shortLabel: string;
    connected: boolean;
    connectedTint: string;
};

const MessengerStatusCard = ({
    title,
    shortLabel,
    connected,
    connectedTint,
}: MessengerStatusCardProps) => (
    <div
        style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            padding: "12px 14px",
            borderRadius: 12,
            border: `1px solid ${connected ? connectedTint : "var(--g-color-line-generic)"}`,
            background: connected
                ? connectedTint
                : "var(--g-color-base-simple-hover)",
        }}
    >
        <div
            style={{
                width: 34,
                height: 34,
                borderRadius: 10,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 11,
                fontWeight: 800,
                letterSpacing: "0.04em",
                background: "var(--g-color-base-float)",
                color: "var(--g-color-text-primary)",
                flexShrink: 0,
            }}
        >
            {shortLabel}
        </div>

        <div style={{ minWidth: 0, flex: 1 }}>
            <Text
                as="div"
                variant="body-2"
                style={{ fontWeight: 700, marginBottom: 2 }}
            >
                {title}
            </Text>
            <Text as="div" variant="caption-2" color="secondary">
                {connected
                    ? "Уведомления будут приходить в этот канал"
                    : "Канал пока не привязан"}
            </Text>
        </div>

        <Label theme={connected ? "success" : "normal"} size="s">
            {connected ? "Подключён" : "Не подключён"}
        </Label>
    </div>
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
                    <div style={{ gridColumn: "1 / -1" }}>
                        <FieldLabel>Мессенджеры</FieldLabel>
                        <div
                            style={{
                                display: "grid",
                                gridTemplateColumns:
                                    "repeat(auto-fit, minmax(220px, 1fr))",
                                gap: 10,
                            }}
                        >
                            <MessengerStatusCard
                                title="Telegram"
                                shortLabel="TG"
                                connected={Boolean(student.telegramChatId)}
                                connectedTint="rgba(80, 154, 255, 0.16)"
                            />
                            <MessengerStatusCard
                                title="Макс"
                                shortLabel="MX"
                                connected={Boolean(student.maxChatId)}
                                connectedTint="rgba(84, 209, 153, 0.16)"
                            />
                        </div>
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
