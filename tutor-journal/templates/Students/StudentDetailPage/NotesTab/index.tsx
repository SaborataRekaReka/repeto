import { useState } from "react";
import Icon from "@/components/Icon";

type Note = {
    id: string;
    date: string;
    time: string;
    text: string;
};

type NotesTabProps = {
    studentName: string;
    notes: Note[];
};

const NotesTab = ({ studentName, notes: initialNotes }: NotesTabProps) => {
    const [notes, setNotes] = useState<Note[]>(initialNotes);
    const [adding, setAdding] = useState(false);
    const [newNote, setNewNote] = useState("");

    const handleAdd = () => {
        if (!newNote.trim()) return;
        const now = new Date();
        const note: Note = {
            id: `n-${Date.now()}`,
            date: now.toLocaleDateString("ru-RU", {
                day: "numeric",
                month: "long",
                year: "numeric",
            }),
            time: now.toLocaleTimeString("ru-RU", {
                hour: "2-digit",
                minute: "2-digit",
            }),
            text: newNote.trim(),
        };
        setNotes([note, ...notes]);
        setNewNote("");
        setAdding(false);
    };

    return (
        <div className="card">
            <div className="card-head">
                <div className="card-title !p-0">Заметки</div>
                <button
                    className="btn-purple btn-small"
                    onClick={() => setAdding(true)}
                >
                    <Icon name="add-circle" />
                    <span>Добавить</span>
                </button>
            </div>
            <div className="px-5 pb-5">
                {adding && (
                    <div className="mb-4 p-4 border-2 border-n-1 rounded-xl dark:border-white">
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
                    <div className="space-y-4">
                        {notes.map((note) => (
                            <div
                                key={note.id}
                                className="p-4 border-2 border-n-1 rounded-xl dark:border-white"
                            >
                                <div className="flex items-center justify-between mb-2">
                                    <div className="text-xs text-n-3 dark:text-white/50">
                                        {note.date}, {note.time}
                                    </div>
                                </div>
                                <div className="text-sm">{note.text}</div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default NotesTab;
export type { Note };
