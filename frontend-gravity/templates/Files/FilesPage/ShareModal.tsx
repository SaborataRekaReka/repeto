import { useEffect, useState } from "react";
import { Alert, Text, TextInput, Button, Icon, Checkbox } from "@gravity-ui/uikit";
import { Magnifier, FolderOpen, File as FileIcon } from "@gravity-ui/icons";
import type { IconData } from "@gravity-ui/uikit";
import AppDialog from "@/components/AppDialog";
import { getInitials } from "@/lib/formatters";
import { useStudents } from "@/hooks/useStudents";
import { updateFileShare } from "@/hooks/useFiles";
import type { FileItem } from "@/types/files";
import { codedErrorMessage } from "@/lib/errorCodes";

type ShareModalProps = {
    visible: boolean;
    item: FileItem | null;
    onClose: () => void;
    onSaved?: () => void;
};

const ShareModal = ({ visible, item, onClose, onSaved }: ShareModalProps) => {
    const [sharedIds, setSharedIds] = useState<Set<string>>(new Set());
    const [applyToChildren, setApplyToChildren] = useState(false);
    const [search, setSearch] = useState("");
    const [saved, setSaved] = useState(false);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const { data: studentsData } = useStudents({ limit: 100 });
    const students = studentsData?.data || [];

    useEffect(() => {
        if (item) {
            setSharedIds(new Set(item.sharedWith));
            setApplyToChildren(false);
            setSaved(false);
            setSearch("");
            setError(null);
        }
    }, [item]);

    const activeStudents = students.filter((s) => s.status === "active");
    const filteredStudents = search.trim()
        ? activeStudents.filter((s) => s.name.toLowerCase().includes(search.toLowerCase()))
        : activeStudents;

    const toggleStudent = (id: string) => {
        setSharedIds((prev) => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
        setSaved(false);
    };

    const selectAll = () => { setSharedIds(new Set(activeStudents.map((s) => s.id))); setSaved(false); };
    const clearAll = () => { setSharedIds(new Set()); setSaved(false); };

    const handleSave = () => {
        if (!item) return;
        setSaving(true);
        setError(null);
        updateFileShare(item.id, { studentIds: Array.from(sharedIds), applyToChildren })
            .then(() => { setSaved(true); onSaved?.(); setTimeout(() => onClose(), 600); })
            .catch((e: any) => { setError(codedErrorMessage("FILES-SHARE", e)); })
            .finally(() => { setSaving(false); });
    };

    if (!item) return null;
    const isFolder = item.type === "folder";
    const changesMade = JSON.stringify(Array.from(sharedIds).sort()) !== JSON.stringify([...item.sharedWith].sort());

    return (
        <AppDialog
            open={visible}
            onClose={onClose}
            size="l"
            caption=""
            bodyStyle={{ gap: 0 }}
            footer={{
                textButtonApply: saved ? "Сохранено ✓" : saving ? "Сохраняем..." : "Сохранить",
                textButtonCancel: "Отмена",
                onClickButtonApply: handleSave,
                onClickButtonCancel: onClose,
                propsButtonApply: { disabled: saving || (!changesMade && !saved) },
                propsButtonCancel: { disabled: saving },
            }}
        >
                {/* Header */}
                <div style={{ display: "flex", alignItems: "center", marginBottom: 20 }}>
                    <div style={{
                        width: 40, height: 40, borderRadius: 8,
                        background: "rgba(174,122,255,0.1)",
                        display: "flex", alignItems: "center", justifyContent: "center", marginRight: 12,
                    }}>
                        <Icon data={(isFolder ? FolderOpen : FileIcon) as IconData} size={18} />
                    </div>
                    <div style={{ minWidth: 0 }}>
                        <Text variant="body-1" style={{ fontWeight: 600, display: "block" }}>{item.name}</Text>
                        <Text variant="caption-2" color="secondary">
                            {isFolder ? "Управление доступом к папке" : "Управление доступом к файлу"}
                        </Text>
                    </div>
                </div>

                {/* Bulk actions */}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                    <Text variant="body-1" style={{ fontWeight: 600, fontSize: 13 }}>
                        Доступ у {sharedIds.size} из {activeStudents.length} учеников
                    </Text>
                    <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                        <button onClick={selectAll} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 13, fontWeight: 600, color: "var(--g-color-text-brand)" }}>Все</button>
                        <span style={{ color: "var(--g-color-text-secondary)" }}>·</span>
                        <button onClick={clearAll} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 13, fontWeight: 600, color: "var(--g-color-text-danger)" }}>Никто</button>
                    </div>
                </div>

                {/* Search */}
                {activeStudents.length > 5 && (
                    <div style={{ marginBottom: 12 }}>
                        <TextInput
                            size="l"
                            placeholder="Найти ученика..."
                            value={search}
                            onUpdate={setSearch}
                            startContent={
                                <Icon
                                    data={Magnifier as IconData}
                                    size={16}
                                    style={{
                                        color: "var(--g-color-text-secondary)",
                                        marginLeft: 4,
                                        marginRight: 2,
                                    }}
                                />
                            }
                        />
                    </div>
                )}

                {/* Student list */}
                <div style={{ maxHeight: 256, overflowY: "auto", display: "flex", flexDirection: "column", gap: 2 }}>
                    {filteredStudents.map((s) => (
                        <div
                            key={s.id}
                            onClick={() => toggleStudent(s.id)}
                            style={{
                                display: "flex", alignItems: "center", padding: "10px 12px",
                                borderRadius: 8, cursor: "pointer", transition: "background 0.15s",
                            }}
                            onMouseEnter={(e) => (e.currentTarget.style.background = "var(--g-color-base-simple-hover)")}
                            onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                        >
                            <div style={{
                                width: 32, height: 32, borderRadius: "50%",
                                background: "rgba(174,122,255,0.1)",
                                display: "flex", alignItems: "center", justifyContent: "center",
                                marginRight: 12, fontSize: 12, fontWeight: 700,
                                color: "var(--g-color-text-brand)", flexShrink: 0,
                            }}>
                                {getInitials(s.name)}
                            </div>
                            <div style={{ flex: 1, minWidth: 0, marginRight: 12 }}>
                                <Text variant="body-1" style={{ fontWeight: 600 }}>{s.name}</Text>
                                <Text variant="caption-2" color="secondary" style={{ display: "block" }}>{s.subject} · {s.grade} класс</Text>
                            </div>
                            <Checkbox checked={sharedIds.has(s.id)} onUpdate={() => toggleStudent(s.id)} size="l" />
                        </div>
                    ))}
                    {filteredStudents.length === 0 && (
                        <div style={{ padding: 16, textAlign: "center" }}>
                            <Text variant="body-1" color="secondary">Ученик не найден</Text>
                        </div>
                    )}
                </div>

                {/* Apply to children */}
                {isFolder && (
                    <div style={{ marginTop: 16, paddingTop: 16, borderTop: "1px dashed var(--g-color-line-generic)" }}>
                        <Checkbox checked={applyToChildren} onUpdate={(v) => setApplyToChildren(v)} size="l">
                            Применить ко всем файлам внутри папки
                        </Checkbox>
                    </div>
                )}

                {error && (
                    <Alert
                        theme="danger"
                        view="filled"
                        corners="rounded"
                        title="Не удалось обновить доступ"
                        message={error}
                        style={{ marginTop: 12 }}
                    />
                )}
        </AppDialog>
    );
};

export default ShareModal;
