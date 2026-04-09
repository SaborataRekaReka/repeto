import { useEffect, useState } from "react";
import Modal from "@/components/Modal";
import Icon from "@/components/Icon";
import Checkbox from "@/components/Checkbox";
import { getInitials, getSubjectBgColor } from "@/mocks/students";
import { useStudents } from "@/hooks/useStudents";
import { updateFileShare } from "@/hooks/useFiles";
import type { FileItem } from "@/types/files";

type ShareModalProps = {
    visible: boolean;
    item: FileItem | null;
    onClose: () => void;
    onSaved?: () => void;
};

const ShareModal = ({ visible, item, onClose, onSaved }: ShareModalProps) => {
    // Local copy of shared students for editing
    const [sharedIds, setSharedIds] = useState<Set<string>>(new Set());
    const [applyToChildren, setApplyToChildren] = useState(false);
    const [search, setSearch] = useState("");
    const [saved, setSaved] = useState(false);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const { data: studentsData } = useStudents({ limit: 100 });
    const students = studentsData?.data || [];

    // Sync state when item changes
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
        ? activeStudents.filter((s) =>
              s.name.toLowerCase().includes(search.toLowerCase())
          )
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

    const selectAll = () => {
        setSharedIds(new Set(activeStudents.map((s) => s.id)));
        setSaved(false);
    };

    const clearAll = () => {
        setSharedIds(new Set());
        setSaved(false);
    };

    const handleSave = () => {
        if (!item) {
            return;
        }

        setSaving(true);
        setError(null);

        updateFileShare(item.id, {
            studentIds: Array.from(sharedIds),
            applyToChildren,
        })
            .then(() => {
                setSaved(true);
                onSaved?.();
                setTimeout(() => onClose(), 600);
            })
            .catch((e: any) => {
                setError(e?.message || "Не удалось обновить доступ");
            })
            .finally(() => {
                setSaving(false);
            });
    };

    if (!item) return null;

    const isFolder = item.type === "folder";
    const changesMade =
        JSON.stringify(Array.from(sharedIds).sort()) !==
        JSON.stringify([...item.sharedWith].sort());

    return (
        <Modal
            classWrap="max-w-md"
            visible={visible}
            onClose={onClose}
            title=""
        >
            <div className="pt-6 px-6 pb-6">
                {/* Header */}
                <div className="flex items-center mb-5">
                    <div className="flex items-center justify-center w-10 h-10 mr-3 rounded-sm bg-purple-3 dark:bg-purple-1/20">
                        <Icon
                            className="icon-18 fill-purple-1"
                            name={isFolder ? "folder" : "file"}
                        />
                    </div>
                    <div className="min-w-0">
                        <div className="text-sm font-bold truncate">
                            {item.name}
                        </div>
                        <div className="text-xs text-n-3 dark:text-white/50">
                            {isFolder
                                ? "Управление доступом к папке"
                                : "Управление доступом к файлу"}
                        </div>
                    </div>
                </div>

                {/* Bulk actions */}
                <div className="flex items-center justify-between mb-3">
                    <div className="text-xs font-bold">
                        Доступ у {sharedIds.size} из {activeStudents.length}{" "}
                        учеников
                    </div>
                    <div className="flex gap-2">
                        <button
                            className="text-xs font-bold text-purple-1 hover:text-purple-2 transition-colors"
                            onClick={selectAll}
                        >
                            Все
                        </button>
                        <span className="text-n-3">·</span>
                        <button
                            className="text-xs font-bold text-pink-1 hover:text-pink-2 transition-colors"
                            onClick={clearAll}
                        >
                            Никто
                        </button>
                    </div>
                </div>

                {/* Search */}
                {activeStudents.length > 5 && (
                    <div className="relative mb-3">
                        <input
                            className="w-full h-10 pl-9 pr-3 bg-white border border-n-1 rounded-sm text-sm font-bold outline-none placeholder:text-n-3 focus:border-purple-1 dark:bg-n-1 dark:border-white dark:text-white dark:placeholder:text-white/50 dark:focus:border-purple-1"
                            placeholder="Найти ученика..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                        <Icon
                            className="absolute left-3 top-1/2 -translate-y-1/2 icon-16 fill-n-3 dark:fill-white/50 pointer-events-none"
                            name="search"
                        />
                    </div>
                )}

                {/* Student list */}
                <div className="max-h-64 overflow-y-auto -mx-1 px-1 space-y-1">
                    {filteredStudents.map((s) => (
                        <button
                            key={s.id}
                            className="flex items-center w-full px-3 py-2.5 rounded-sm transition-colors hover:bg-n-3/10 dark:hover:bg-white/5"
                            onClick={() => toggleStudent(s.id)}
                        >
                            <div
                                className={`flex items-center justify-center w-8 h-8 mr-3 rounded-full text-xs font-bold text-n-1 shrink-0 ${getSubjectBgColor(s.subject)}`}
                            >
                                {getInitials(s.name)}
                            </div>
                            <div className="text-left min-w-0 mr-auto">
                                <div className="text-sm font-bold truncate">
                                    {s.name}
                                </div>
                                <div className="text-xs text-n-3 dark:text-white/50">
                                    {s.subject} · {s.grade} класс
                                </div>
                            </div>
                            <Checkbox
                                className="shrink-0 ml-3"
                                value={sharedIds.has(s.id)}
                                onChange={() => toggleStudent(s.id)}
                            />
                        </button>
                    ))}
                    {filteredStudents.length === 0 && (
                        <div className="py-4 text-center text-sm text-n-3 dark:text-white/50">
                            Ученик не найден
                        </div>
                    )}
                </div>

                {/* Apply to children toggle (for folders) */}
                {isFolder && (
                    <div className="mt-4 pt-4 border-t border-dashed border-n-1 dark:border-white">
                        <Checkbox
                            label="Применить ко всем файлам внутри папки"
                            value={applyToChildren}
                            onChange={() =>
                                setApplyToChildren(!applyToChildren)
                            }
                        />
                    </div>
                )}

                {/* Actions */}
                {error && (
                    <div className="mt-4 text-xs font-bold text-pink-1">
                        {error}
                    </div>
                )}
                <div className="flex gap-3 mt-5">
                    <button
                        className="btn-stroke flex-1"
                        onClick={onClose}
                        disabled={saving}
                    >
                        Отмена
                    </button>
                    <button
                        className={`flex-1 ${
                            saved
                                ? "btn-purple opacity-80"
                                : changesMade
                                  ? "btn-purple"
                                  : "btn-stroke opacity-50 pointer-events-none"
                        }`}
                        onClick={handleSave}
                        disabled={saving || (!changesMade && !saved)}
                    >
                        {saved ? (
                            <>
                                <Icon name="check-circle" />
                                <span>Сохранено</span>
                            </>
                        ) : saving ? (
                            "Сохраняем..."
                        ) : (
                            "Сохранить"
                        )}
                    </button>
                </div>
            </div>
        </Modal>
    );
};

export default ShareModal;
