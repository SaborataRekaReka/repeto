import { useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Text, Button, Icon, TextArea, DropdownMenu } from "@gravity-ui/uikit";
import { Ellipsis } from "@gravity-ui/icons";
import type { IconData } from "@gravity-ui/uikit";
import Lp2PlannerShell, {
    Lp2PlannerLayout,
    Lp2PlannerSection,
} from "@/components/Lp2PlannerShell";
import { Lp2Field } from "@/components/Lp2Field";
import { createNote, deleteNote, updateNote } from "@/hooks/useStudents";
import TabAddSlot from "../TabAddSlot";
import {
    isLessonMaterialsNoteContent,
    isSystemLessonNoteContent,
    parsePortalReviewNote,
} from "@/lib/lessonNotes";

const GIcon = Icon as any;
const GDropdownMenu = DropdownMenu as any;

type Note = {
    id: string;
    date: string;
    time: string;
    text: string;
};

type NotesTabProps = {
    studentId: string;
    studentName: string;
    notes: Note[];
    onMutate?: () => void;
};

const NotesTab = ({
    studentId,
    studentName,
    notes,
    onMutate,
}: NotesTabProps) => {
    const [mounted, setMounted] = useState(false);
    const [shouldRender, setShouldRender] = useState(false);
    const [isPanelVisible, setIsPanelVisible] = useState(false);
    const [formVisible, setFormVisible] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [noteText, setNoteText] = useState("");
    const [saving, setSaving] = useState(false);
    const [busyId, setBusyId] = useState<string | null>(null);

    useEffect(() => {
        setMounted(true);
    }, []);

    useEffect(() => {
        if (formVisible) {
            setShouldRender(true);
            let raf1 = 0;
            let raf2 = 0;
            raf1 = requestAnimationFrame(() => {
                raf2 = requestAnimationFrame(() => setIsPanelVisible(true));
            });

            return () => {
                cancelAnimationFrame(raf1);
                cancelAnimationFrame(raf2);
            };
        }

        setIsPanelVisible(false);
        return undefined;
    }, [formVisible]);

    const handleTransitionEnd = useCallback(() => {
        if (!isPanelVisible) {
            setShouldRender(false);
        }
    }, [isPanelVisible]);

    const resetForm = () => {
        setFormVisible(false);
        setEditingId(null);
        setNoteText("");
    };

    const handleOpenCreate = () => {
        setEditingId(null);
        setNoteText("");
        setFormVisible(true);
    };

    const handleSubmit = async () => {
        if (!noteText.trim()) return;
        setSaving(true);
        try {
            if (editingId) {
                await updateNote(studentId, editingId, noteText.trim());
            } else {
                await createNote(studentId, noteText.trim());
            }
            resetForm();
            onMutate?.();
        } catch {
            // silent
        } finally {
            setSaving(false);
        }
    };

    const handleEdit = (note: Note) => {
        setEditingId(note.id);
        setNoteText(note.text);
        setFormVisible(true);
    };

    const handleDelete = async (noteId: string) => {
        setBusyId(noteId);
        try {
            await deleteNote(studentId, noteId);
            if (editingId === noteId) {
                resetForm();
            }
            onMutate?.();
        } catch {
            // silent
        } finally {
            setBusyId(null);
        }
    };

    return (
        <div className="tab-section">
            {notes.length > 0 && (
                <div className="lp2-hw-list">
                    {notes.map((note) => {
                        const portalReview = parsePortalReviewNote(note.text);
                        const isMaterialsNote = isLessonMaterialsNoteContent(note.text);
                        const isSystemNote = isSystemLessonNoteContent(note.text);
                        const isBusy = !!busyId;

                        return (
                            <div
                                key={note.id}
                                className="lp2-hw-item"
                                style={{ cursor: isSystemNote ? "default" : "pointer" }}
                                onClick={isSystemNote ? undefined : () => handleEdit(note)}
                            >
                                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                    <span style={{ fontWeight: 500, flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                        {portalReview
                                            ? `Отзыв из портала — ${portalReview.rating}/5`
                                            : isMaterialsNote
                                                ? "Материалы к занятию"
                                                : note.text}
                                    </span>
                                    {!isSystemNote && (
                                        <div className="hw-item-menu" onClick={(e) => e.stopPropagation()}>
                                            <GDropdownMenu
                                                items={[
                                                    {
                                                        text: "Редактировать",
                                                        disabled: isBusy,
                                                        action: () => handleEdit(note),
                                                    },
                                                    {
                                                        text: "Удалить",
                                                        disabled: isBusy,
                                                        action: () => void handleDelete(note.id),
                                                    },
                                                ]}
                                                renderSwitcher={(props: any) => (
                                                    <button
                                                        type="button"
                                                        className="repeto-sl-row__menu-btn"
                                                        {...props}
                                                        disabled={isBusy}
                                                        title="Действия"
                                                    >
                                                        <GIcon data={Ellipsis as IconData} size={16} />
                                                    </button>
                                                )}
                                            />
                                        </div>
                                    )}
                                </div>
                                <span style={{ fontSize: 12, color: "var(--g-color-text-secondary)" }}>
                                    {note.date}, {note.time}
                                    {portalReview?.feedback
                                        ? ` — ${portalReview.feedback}`
                                        : isMaterialsNote
                                            ? " — Привязано к материалам занятия"
                                            : ""}
                                </span>
                            </div>
                        );
                    })}
                    <TabAddSlot title="Добавить заметку" onClick={handleOpenCreate} />
                </div>
            )}

            {notes.length === 0 && (
                <div className="lp2-empty lp2-empty--with-action">
                    <span>Заметок пока нет</span>
                    <TabAddSlot title="Добавить заметку" onClick={handleOpenCreate} />
                </div>
            )}

            {mounted && (shouldRender || formVisible) && typeof document !== "undefined" &&
                createPortal(
                    <>
                        <div
                            className={`lp2-overlay lp2-overlay--notes${isPanelVisible ? " lp2-overlay--open" : ""}`}
                            onClick={resetForm}
                            aria-hidden="true"
                        />
                        <Lp2PlannerShell
                            className="lp2--homework"
                            isOpen={isPanelVisible}
                            onTransitionEnd={handleTransitionEnd}
                            ariaLabel={editingId ? "Редактировать заметку" : "Добавить заметку"}
                            ariaModal
                            onBack={resetForm}
                            backAriaLabel="Закрыть"
                            title={editingId ? "Редактировать заметку" : "Добавить заметку"}
                            centerClassName="lp2__center--homework"
                            withPlannerCenter={false}
                            topbarActions={
                                editingId ? (
                                    <Button
                                        view="flat-danger"
                                        size="s"
                                        loading={busyId === editingId}
                                        disabled={saving || busyId === editingId}
                                        onClick={() => void handleDelete(editingId)}
                                    >
                                        Удалить
                                    </Button>
                                ) : null
                            }
                            footer={
                                <div className="lp2__actions lp2__actions--split">
                                    <Button view="outlined" size="xl" onClick={resetForm} disabled={saving || !!busyId}>
                                        Отмена
                                    </Button>
                                    <Button
                                        view="action"
                                        size="xl"
                                        disabled={!noteText.trim() || !!busyId}
                                        loading={saving}
                                        onClick={() => void handleSubmit()}
                                    >
                                        {editingId ? "Сохранить изменения" : "Сохранить"}
                                    </Button>
                                </div>
                            }
                        >
                            <Lp2PlannerLayout>
                                <Lp2PlannerSection title={editingId ? "Заметка" : "Новая заметка"}>
                                    <Lp2Field label="Текст">
                                        <TextArea
                                            value={noteText}
                                            onUpdate={setNoteText}
                                            placeholder="Напишите заметку..."
                                            rows={4}
                                            size="xl"
                                            autoFocus
                                        />
                                    </Lp2Field>
                                </Lp2PlannerSection>
                            </Lp2PlannerLayout>
                        </Lp2PlannerShell>
                    </>,
                    document.body,
                )}
        </div>
    );
};

export default NotesTab;
export type { Note };
