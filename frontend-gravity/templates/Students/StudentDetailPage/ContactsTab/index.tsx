import { useCallback, useRef, useState } from "react";
import { Card, Label, Text, TextInput } from "@gravity-ui/uikit";
import type { Student } from "@/types/student";

type ContactsTabProps = {
    student: Student;
    onSave?: (data: Partial<Student>) => Promise<void>;
};

type FieldKey =
    | "phone"
    | "parentName"
    | "parentPhone"
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
    icon: React.ReactNode;
    connected: boolean;
    connectedTint: string;
};

const TelegramGlyph = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
        <path
            d="M21.2 4.84c.38-.15.78.18.7.57l-2.86 13.66a.58.58 0 0 1-.87.38l-4.2-2.43-2.12 2.07a.58.58 0 0 1-.98-.42v-3.45l8.57-7.74c.26-.24-.08-.63-.38-.44l-10.37 6.17-3.9-1.15a.58.58 0 0 1-.03-1.1l15.44-6.12Z"
            fill="currentColor"
        />
    </svg>
);

const MaxGlyph = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
        <path
            d="M4 18V6h2.25l5.75 7.25L17.75 6H20v12h-2.75v-7.3L12 17.15 6.75 10.7V18H4Z"
            fill="currentColor"
        />
    </svg>
);

const MessengerStatusCard = ({
    title,
    icon,
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
                background: connected
                    ? "var(--g-color-base-float)"
                    : "var(--g-color-base-generic)",
                color: "var(--g-color-text-primary)",
                flexShrink: 0,
            }}
        >
            {icon}
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
    const [parentName, setParentName] = useState(student.parentName || "");
    const [parentPhone, setParentPhone] = useState(student.parentPhone || "");
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
            // Send null for cleared fields so backend can persist deletion.
            persist({ [key]: trimmed.length > 0 ? trimmed : null } as any);
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
                            size="l"
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
                                icon={<TelegramGlyph />}
                                connected={Boolean(student.telegramChatId)}
                                connectedTint="rgba(80, 154, 255, 0.16)"
                            />
                            <MessengerStatusCard
                                title="Макс"
                                icon={<MaxGlyph />}
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
                            size="l"
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
                            size="l"
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
                            size="l"
                        />
                    </div>
                </div>
            </Card>
        </div>
    );
};

export default ContactsTab;
