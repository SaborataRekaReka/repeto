import LessonPanelV2 from "@/components/LessonPanelV2";
import type { Lesson } from "@/types/schedule";

type CreateLessonModalProps = {
    visible: boolean;
    onClose: () => void;
    onCreated?: (savedLesson?: Lesson | Lesson[]) => void | Promise<void>;
    lesson?: Lesson | null;
    defaultStudent?: {
        id: string;
        name: string;
        accountId?: string | null;
    } | null;
    defaultDate?: string;
    defaultTime?: string;
};

const CreateLessonModal = ({
    visible,
    onClose,
    onCreated,
    lesson,
    defaultStudent,
    defaultDate,
    defaultTime,
}: CreateLessonModalProps) => {
    const handleSaved = async () => {
        await onCreated?.();
    };

    return (
        <LessonPanelV2
            open={visible}
            onClose={onClose}
            lesson={lesson}
            onSaved={handleSaved}
            defaultStudent={defaultStudent}
            defaultDate={defaultDate}
            defaultTime={defaultTime}
        />
    );
};

export default CreateLessonModal;
