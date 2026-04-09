import { useState } from "react";
import Icon from "@/components/Icon";
import { createNote, deleteNote } from "@/hooks/useStudents";

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

const NotesTab = ({ studentId, studentName, notes, onMutate }: NotesTabProps) => {
    const [adding, setAdding] = useState(false);
    const [newNote, setNewNote] = useState("");

    const handleAdd = async () => {
        if (!newNote.trim()) return;
        try {
            await createNote(studentId, newNote.trim());
            setNewNote("");
            setAdding(false);
            onMutate?.();
        } catch (err) {
            console.error("Failed to create note:", err);
        }
    };

    const handleDelete = async (noteId: string) => {
        try {
            await deleteNote(studentId, noteId);
            onMutate?.();
        } catch (err) {
            console.error("Failed to delete note:", err);
        }
    };

    return (
        <div className="card">
            <div className="card-head">
                <div className="text-h6">Заметки</div>
                <button
                    className="btn-purple btn-small"
                    onClick={() => setAdding(true)}
                >
                    <Icon name="add-circle" />
                    <span>Добавить</span>
                </button>
            </div>
            {adding && (
                <div className="p-5 border-b border-n-1 bg-background dark:bg-n-2 dark:border-white">
                    <textarea
                        className="w-full h-24 text-sm bg-transparent outline-none resize-none placeholder:text-n-3 dark:text-white dark:placeholder:text-white/50"
                        placeholder="Напишите заметку..."
                        value={newNote}
                        onChange={(e) => setNewNote(e.target.value)}
                        autoFocus
                    />
                    <div className="flex gap-2 mt-2">
                        <button
                            className="btn-purple btn-small"
                            onClick={handleAdd}
                        >
                            Сохранить
                        </button>
                        <button
                            className="btn-stroke btn-small"
                            onClick={() => {
                                setAdding(false);
                                setNewNote("");
                            }}
                        >
                            Отмена
                        </button>
                    </div>
                </div>
            )}
            {notes.length === 0 && !adding ? (
                <div className="py-8 text-center text-sm text-n-3 dark:text-white/50">
                    Заметок пока нет
                </div>
            ) : (
                <div>
                    {notes.map((note) => (
                        <div
                            key={note.id}
                            className="px-5 py-4 border-t border-n-1 dark:border-white"
                        >
                            <div className="flex items-center justify-between mb-1">
                                <div className="text-xs text-n-3 dark:text-white/50">
                                    {note.date}, {note.time}
                                </div>
                                <button
                                    className="group"
                                    onClick={() => handleDelete(note.id)}
                                >
                                    <Icon
                                        className="icon-18 fill-n-3 transition-colors group-hover:fill-pink-1"
                                        name="trash"
                                    />
                                </button>
                            </div>
                            <div className="text-sm">{note.text}</div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default NotesTab;
export type { Note };
