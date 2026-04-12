import { useState } from "react";
import { Card, Text, Button, Icon, TextArea } from "@gravity-ui/uikit";
import { CirclePlus, TrashBin } from "@gravity-ui/icons";
import type { IconData } from "@gravity-ui/uikit";
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

const NotesTab = ({
    studentId,
    studentName,
    notes,
    onMutate,
}: NotesTabProps) => {
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
        <div>
            <div
                style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    marginBottom: 16,
                }}
            >
                <Text variant="subheader-2">Заметки</Text>
                <Button
                    view="action"
                    size="s"
                    onClick={() => setAdding(true)}
                >
                    <Icon data={CirclePlus as IconData} size={14} />
                    Добавить
                </Button>
            </div>

            {adding && (
                <Card
                    view="outlined"
                    style={{ padding: 16, marginBottom: 12 }}
                >
                    <TextArea
                        value={newNote}
                        onUpdate={setNewNote}
                        placeholder="Напишите заметку..."
                        rows={4}
                        size="l"
                        autoFocus
                    />
                    <div
                        style={{
                            display: "flex",
                            gap: 8,
                            marginTop: 10,
                        }}
                    >
                        <Button view="action" size="s" onClick={handleAdd}>
                            Сохранить
                        </Button>
                        <Button
                            view="outlined"
                            size="s"
                            onClick={() => {
                                setAdding(false);
                                setNewNote("");
                            }}
                        >
                            Отмена
                        </Button>
                    </div>
                </Card>
            )}

            {notes.length === 0 && !adding ? (
                <Card
                    view="outlined"
                    style={{ padding: "48px 24px", textAlign: "center" }}
                >
                    <Text variant="body-1" color="secondary">
                        Заметок пока нет
                    </Text>
                </Card>
            ) : (
                <div
                    style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: 8,
                    }}
                >
                    {notes.map((note) => (
                        <Card key={note.id} view="outlined" style={{ padding: 16 }}>
                            <div
                                style={{
                                    display: "flex",
                                    justifyContent: "space-between",
                                    alignItems: "flex-start",
                                    marginBottom: 8,
                                }}
                            >
                                <Text variant="caption-2" color="secondary">
                                    {note.date}, {note.time}
                                </Text>
                                <Button
                                    view="flat"
                                    size="xs"
                                    onClick={() => handleDelete(note.id)}
                                >
                                    <Icon
                                        data={TrashBin as IconData}
                                        size={14}
                                    />
                                </Button>
                            </div>
                            <Text variant="body-1">{note.text}</Text>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
};

export default NotesTab;
export type { Note };
