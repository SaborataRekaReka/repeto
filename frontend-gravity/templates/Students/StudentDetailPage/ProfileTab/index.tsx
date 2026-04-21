import { useCallback, useRef, useState } from "react";
import { Text, TextInput, Select, Icon, Label, DropdownMenu } from "@gravity-ui/uikit";
import { Bell, Link, ChevronDown, Lock } from "@gravity-ui/icons";
import type { IconData } from "@gravity-ui/uikit";
import type { Student, StudentStatus } from "@/types/student";
import PhoneInput from "@/components/PhoneInput";
import StudentAvatar from "@/components/StudentAvatar";
import StudentNameWithBadge from "@/components/StudentNameWithBadge";
import Lp2Field, { Lp2Row } from "@/components/Lp2Field";
import { formatBalance, getStatusLabel } from "@/mocks/students";

const GDropdownMenu = DropdownMenu as any;

const statusTheme = (status: Student["status"]): "success" | "normal" => {
    switch (status) {
        case "active":
            return "success";
        default:
            return "normal";
    }
};

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
    onRemind?: () => void;
    onPortalAction?: () => void;
    portalActionLabel?: string;
    portalActionBusy?: boolean;
    onStatusSelect?: (status: Student["status"]) => void;
    statusUpdating?: boolean;
    studentActionError?: string | null;
};

const ProfileTab = ({
    student,
    onSave,
    onRemind,
    onPortalAction,
    portalActionLabel,
    portalActionBusy,
    onStatusSelect,
    statusUpdating,
    studentActionError,
}: ProfileTabProps) => {
    const busyRef = useRef(false);
    const [localName, setLocalName] = useState(student.name);
    const [localGrade, setLocalGrade] = useState(student.grade || "");
    const [localAge, setLocalAge] = useState(student.age ? String(student.age) : "");
    const [localRate, setLocalRate] = useState(String(student.rate));
    const [localNotes, setLocalNotes] = useState(student.notes || "");
    const [phone, setPhone] = useState(student.phone || "");
    const [studentEmail, setStudentEmail] = useState(student.email || "");
    const [parentName, setParentName] = useState(student.parentName || "");
    const [parentPhone, setParentPhone] = useState(student.parentPhone || "");
    const [parentEmail, setParentEmail] = useState(student.parentEmail || "");
    const hasRepetoAccount = Boolean(student.accountId);
    const lockEndContent = hasRepetoAccount ? (
        <Icon
            data={Lock as IconData}
            size={14}
            style={{ color: "var(--g-color-text-secondary)", marginRight: 8 }}
        />
    ) : undefined;

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
            persist({ [key]: trimmed || null } as any);
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
        <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
            <div className="profile-hero">
                <StudentAvatar
                    student={student}
                    size="l"
                    style={{ "--g-avatar-size": "72px", flexShrink: 0 } as React.CSSProperties}
                />
                <div className="profile-hero__info">
                    <Text variant="header-1" as="div">
                        <StudentNameWithBadge
                            name={student.name}
                            hasRepetoAccount={hasRepetoAccount}
                        />
                    </Text>
                    <Text variant="body-1" color="secondary" as="div">
                        {student.subject}
                        {student.grade
                            ? ` · ${student.grade}${student.grade !== "Взрослый" ? " кл." : ""}`
                            : ""}
                        {student.age ? ` · ${student.age} лет` : ""}
                    </Text>

                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 4 }}>
                        <GDropdownMenu
                            switcher={
                                <button
                                    type="button"
                                    disabled={statusUpdating}
                                    style={{
                                        border: "none",
                                        background: "transparent",
                                        padding: 0,
                                        margin: 0,
                                        display: "inline-flex",
                                        alignItems: "center",
                                        gap: 4,
                                        cursor: statusUpdating ? "default" : "pointer",
                                    }}
                                >
                                    <Label theme={statusTheme(student.status)} size="xs">
                                        {getStatusLabel(student.status)}
                                    </Label>
                                    <Icon
                                        data={ChevronDown as IconData}
                                        size={12}
                                        style={{ color: "var(--g-color-text-secondary)" }}
                                    />
                                </button>
                            }
                            items={[
                                {
                                    text:
                                        student.status === "active"
                                            ? "Активный (текущий)"
                                            : student.status === "archived"
                                              ? "Вытащить из архива"
                                              : "Сделать активным",
                                    action: () => onStatusSelect?.("active"),
                                },
                                {
                                    text:
                                        student.status === "paused"
                                            ? "На паузе (текущий)"
                                            : "Поставить на паузу",
                                    action: () => onStatusSelect?.("paused"),
                                },
                                {
                                    text:
                                        student.status === "archived"
                                            ? "В архиве (текущий)"
                                            : "Перенести в архив",
                                    action: () => onStatusSelect?.("archived"),
                                },
                            ]}
                        />
                        <Text
                            variant="body-2"
                            style={{
                                color:
                                    student.balance < 0
                                        ? "#D16B8F"
                                        : student.balance > 0
                                          ? "#22C55E"
                                          : undefined,
                            }}
                        >
                            {formatBalance(student.balance)}
                        </Text>
                    </div>

                    <div className="tab-section__actions" style={{ marginTop: 8, marginBottom: 0 }}>
                        <button
                            type="button"
                            className="tab-action-btn tab-action-btn--compact tab-action-btn--primary"
                            onClick={onRemind}
                        >
                            <span className="tab-action-btn__icon">
                                <Icon data={Bell as IconData} size={20} />
                            </span>
                            Напомнить
                        </button>
                        <button
                            type="button"
                            className="tab-action-btn tab-action-btn--compact"
                            onClick={onPortalAction}
                            disabled={portalActionBusy}
                        >
                            <span className="tab-action-btn__icon">
                                <Icon data={Link as IconData} size={20} />
                            </span>
                            {portalActionLabel || "Пригласить в Repeto"}
                        </button>
                    </div>

                    {studentActionError && (
                        <Text
                            as="div"
                            variant="caption-2"
                            style={{ color: "var(--g-color-text-danger)", marginTop: 8 }}
                        >
                            {studentActionError}
                        </Text>
                    )}
                </div>
            </div>

            <div className="lp2-section-title" style={{ marginTop: 28 }}>Основное</div>


            <Lp2Field label="ФИО">
                <TextInput
                    value={localName}
                    onUpdate={setLocalName}
                    onBlur={() => handleBlurText("name", localName, student.name)}
                    disabled={hasRepetoAccount}
                    endContent={lockEndContent}
                    size="l"
                />
            </Lp2Field>

            <Lp2Row>
                <Lp2Field label="Предмет" half>
                    <Select
                        options={subjectOptions}
                        value={[student.subject]}
                        onUpdate={([v]) => persist({ subject: v } as any)}
                        size="l"
                        width="max"
                    />
                </Lp2Field>
                <Lp2Field label="Ставка (₽)" half>
                    <TextInput
                        value={localRate}
                        onUpdate={setLocalRate}
                        onBlur={() => handleBlurNumber("rate", localRate, student.rate)}
                        size="l"
                    />
                </Lp2Field>
            </Lp2Row>

            <Lp2Row>
                <Lp2Field label="Класс" half>
                    <TextInput
                        value={localGrade}
                        onUpdate={setLocalGrade}
                        onBlur={() => handleBlurText("grade", localGrade, student.grade)}
                        disabled={hasRepetoAccount}
                        endContent={lockEndContent}
                        placeholder="11 или Взрослый"
                        size="l"
                    />
                </Lp2Field>
                <Lp2Field label="Возраст" half>
                    <TextInput
                        value={localAge}
                        onUpdate={setLocalAge}
                        onBlur={() => handleBlurNumber("age" as any, localAge, student.age)}
                        disabled={hasRepetoAccount}
                        endContent={lockEndContent}
                        placeholder="—"
                        size="l"
                    />
                </Lp2Field>
            </Lp2Row>

            <Lp2Field label="Статус">
                <Select
                    options={statusOptions}
                    value={[student.status]}
                    onUpdate={([v]) => persist({ status: v as StudentStatus } as any)}
                    size="l"
                    width="max"
                />
            </Lp2Field>

            <div className="lp2-section-title" style={{ marginTop: 28 }}>Контакты</div>

            <Lp2Field label="Телефон">
                <PhoneInput
                    value={phone}
                    onUpdate={setPhone}
                    onBlur={() => handleBlurText("phone" as any, phone, student.phone)}
                    disabled={hasRepetoAccount}
                    endContent={lockEndContent}
                />
            </Lp2Field>

            <Lp2Field label="Email ученика">
                <TextInput
                    value={studentEmail}
                    onUpdate={setStudentEmail}
                    onBlur={() => handleBlurText("email" as any, studentEmail, student.email)}
                    disabled={hasRepetoAccount}
                    endContent={lockEndContent}
                    placeholder="student@email.com"
                    size="l"
                    type="email"
                />
            </Lp2Field>

            <Lp2Field label="ФИО родителя">
                <TextInput
                    value={parentName}
                    onUpdate={setParentName}
                    onBlur={() => handleBlurText("parentName" as any, parentName, student.parentName)}
                    disabled={hasRepetoAccount}
                    endContent={lockEndContent}
                    placeholder="Иванова Мария Петровна"
                    size="l"
                />
            </Lp2Field>

            <Lp2Row>
                <Lp2Field label="Телефон родителя" half>
                    <PhoneInput
                        value={parentPhone}
                        onUpdate={setParentPhone}
                        onBlur={() => handleBlurText("parentPhone" as any, parentPhone, student.parentPhone)}
                        disabled={hasRepetoAccount}
                        endContent={lockEndContent}
                    />
                </Lp2Field>
                <Lp2Field label="Email родителя" half>
                    <TextInput
                        value={parentEmail}
                        onUpdate={setParentEmail}
                        onBlur={() => handleBlurText("parentEmail" as any, parentEmail, student.parentEmail)}
                        disabled={hasRepetoAccount}
                        endContent={lockEndContent}
                        placeholder="parent@email.com"
                        size="l"
                    />
                </Lp2Field>
            </Lp2Row>

            <div className="lp2-section-title" style={{ marginTop: 28 }}>Заметки</div>

            <Lp2Field label="Заметки о профиле">
                <TextInput
                    value={localNotes}
                    onUpdate={setLocalNotes}
                    onBlur={() => handleBlurText("notes", localNotes, student.notes || "")}
                    placeholder="Особенности, пожелания..."
                    size="l"
                />
            </Lp2Field>
        </div>
    );
};

export default ProfileTab;
