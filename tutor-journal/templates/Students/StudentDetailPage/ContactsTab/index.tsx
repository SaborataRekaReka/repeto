import { useCallback, useRef } from "react";
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

type FieldDef = { key: FieldKey; label: string };

const studentFields: FieldDef[] = [
    { key: "phone", label: "Телефон" },
    { key: "whatsapp", label: "WhatsApp" },
];

const parentFields: FieldDef[] = [
    { key: "parentName", label: "ФИО родителя" },
    { key: "parentPhone", label: "Телефон родителя" },
    { key: "parentWhatsapp", label: "WhatsApp родителя" },
    { key: "parentEmail", label: "Email родителя" },
];

const fieldCell =
    "mt-4 mx-2.5 pb-3 border-b border-n-1 dark:border-white w-[calc(50%-1.25rem)] md:w-[calc(100%-1.25rem)]";

const ContactsTab = ({ student, onSave }: ContactsTabProps) => {
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
        (key: FieldKey, prev: string) =>
        (e: React.FocusEvent<HTMLSpanElement>) => {
            const next = (e.currentTarget.textContent || "").trim();
            if (next !== prev) {
                persist({ [key]: next || undefined } as any);
            }
        };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLSpanElement>) => {
        if (e.key === "Enter" || e.key === "Escape") {
            e.preventDefault();
            e.currentTarget.blur();
        }
    };

    const renderField = (def: FieldDef) => {
        const raw = (student as any)[def.key] || "";
        return (
            <div key={def.key} className={fieldCell}>
                <div className="mb-1.5 text-xs text-n-3 dark:text-white/75">
                    {def.label}
                </div>
                <span
                    className="block text-sm font-bold outline-none cursor-text min-h-[1.25rem]"
                    contentEditable
                    suppressContentEditableWarning
                    onBlur={handleBlur(def.key, raw)}
                    onKeyDown={handleKeyDown}
                >
                    {raw || "-"}
                </span>
            </div>
        );
    };

    return (
        <div>
            <div className="mb-10">
                <div className="mb-5 text-h6">Контакты ученика</div>
                <div className="flex flex-wrap -mt-4 -mx-2.5">
                    {studentFields.map(renderField)}
                </div>
            </div>
            <div>
                <div className="mb-5 text-h6">Контакты родителя</div>
                <div className="flex flex-wrap -mt-4 -mx-2.5">
                    {parentFields.map(renderField)}
                </div>
            </div>
        </div>
    );
};

export default ContactsTab;
