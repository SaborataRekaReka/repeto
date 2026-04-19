import { useState } from "react";
import { Text, Button, Icon, TextArea } from "@gravity-ui/uikit";
import { TrashBin, CirclePlus } from "@gravity-ui/icons";
import type { IconData } from "@gravity-ui/uikit";
import AppDialog from "@/components/AppDialog";
import { Lp2Field } from "@/components/Lp2Field";
import { createNote, deleteNote, updateNote } from "@/hooks/useStudents";

const GIcon = Icon as any;
const GButton = Button as any;

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

const parsePortalReview = (text: string) => {
    if (!text.startsWith("PORTAL_REVIEW:")) {
        return null;
    }

    const payload = text.slice("PORTAL_REVIEW:".length);
    try {
        const parsed = JSON.parse(payload);
        if (!parsed || typeof parsed !== "object") {
            return null;
        }

        const rating = Number((parsed as any).rating);
        const feedback =
            typeof (parsed as any).feedback === "string"
                ? (parsed as any).feedback.trim()
                : "";

        return {
            rating: Number.isFinite(rating) ? rating : null,
            feedback,
        };
    } catch {
        return null;
    }
};

const NotesTab = ({
    studentId,
    studentName,
    notes,
    onMutate,
}: NotesTabProps) => {
    const [formVisible, setFormVisible] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [noteText, setNoteText] = useState("");
    const [saving, setSaving] = useState(false);
    const [busyId, setBusyId] = useState<string | null>(null);

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
            {/* ── Action button (Tochka style) ── */}
            <div className="tab-section__actions">
                <button type="button" className="tab-action-btn" onClick={handleOpenCreate}>
                    <span className="tab-action-btn__icon">
                        <GIcon data={CirclePlus as IconData} size={20} />
                    </span>
                    Добавить заметку
                </button>
            </div>

            {/* ── Notes list ── */}
            {notes.length > 0 && (
                <div className="lp2-hw-list">
                    {notes.map((note) => {
                        const portalReview = parsePortalReview(note.text);

                        return (
                            <div
                                key={note.id}
                                className="lp2-hw-item"
                                style={{ cursor: portalReview ? "default" : "pointer" }}
                                onClick={portalReview ? undefined : () => handleEdit(note)}
                            >
                                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                    <span style={{ fontWeight: 500, flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                        {portalReview ? `Отзыв из портала — ${portalReview.rating ?? "—"}/5` : note.text}
                                    </span>
                                    {!portalReview && (
                                        <>
                                            <GButton
                                                view="flat"
                                                size="s"
                                                onClick={(e: React.MouseEvent) => {
                                                    e.stopPropagation();
                                                    handleEdit(note);
                                                }}
                                            >
                                                Редактировать
                                            </GButton>
                                            <GButton
                                                view="flat"
                                                size="s"
                                                loading={busyId === note.id}
                                                disabled={!!busyId && busyId !== note.id}
                                                onClick={(e: React.MouseEvent) => {
                                                    e.stopPropagation();
                                                    void handleDelete(note.id);
                                                }}
                                            >
                                                Удалить
                                            </GButton>
                                        </>
                                    )}
                                </div>
                                <span style={{ fontSize: 12, color: "var(--g-color-text-secondary)" }}>
                                    {note.date}, {note.time}
                                    {portalReview?.feedback ? ` — ${portalReview.feedback}` : ""}
                                </span>
                            </div>
                        );
                    })}
                </div>
            )}

            {notes.length === 0 && (
                <div className="lp2-empty">Заметок пока нет</div>
            )}

            <AppDialog
                open={formVisible}
                onClose={resetForm}
                size="m"
                caption={editingId ? "Редактировать заметку" : "Добавить заметку"}
                hasCloseButton
            >
                <div className="lp2-hw-form">
                    <Lp2Field label={editingId ? "Заметка" : "Новая заметка"}>
                        <TextArea
                            value={noteText}
                            onUpdate={setNoteText}
                            placeholder="Напишите заметку..."
                            rows={3}
                            size="xl"
                            autoFocus
                        />
                    </Lp2Field>
                    <div className="tab-note-form__actions">
                        <GButton
                            view="outlined"
                            size="l"
                            onClick={resetForm}
                        >
                            Отмена
                        </GButton>
                        <GButton
                            view="action"
                            size="l"
                            disabled={!noteText.trim()}
                            loading={saving}
                            onClick={() => void handleSubmit()}
                        >
                            {editingId ? "Сохранить изменения" : "Сохранить"}
                        </GButton>
                        {editingId && (
                            <GButton
                                view="flat"
                                size="l"
                                loading={busyId === editingId}
                                onClick={() => void handleDelete(editingId)}
                            >
                                <GIcon data={TrashBin as IconData} size={14} />
                                Удалить
                            </GButton>
                        )}
                    </div>
                </div>
            </AppDialog>
        </div>
    );
};

export default NotesTab;
export type { Note };
