import { useEffect, useState, useCallback, useRef, useMemo } from "react";
import { createPortal } from "react-dom";
import {
    Text,
    Button,
    Label,
    Icon,
    Select,
    TextInput,
    TextArea,
    Switch,
    Alert,
} from "@gravity-ui/uikit";
import {
    ArrowLeft,
    TrashBin,
    Plus,
    File,
    Folder,
    ChevronDown,
    ChevronRight,
} from "@gravity-ui/icons";
import type { IconData } from "@gravity-ui/uikit";
import {
    createLesson,
    updateLesson,
    updateLessonStatus,
    deleteLesson,
} from "@/hooks/useLessons";
import {
    useStudents,
    useStudentNotes,
    useStudentHomework,
    createHomework,
    updateHomework,
    deleteHomework,
    createNote,
    updateNote,
    deleteNote,
} from "@/hooks/useStudents";
import { useApi } from "@/hooks/useApi";
import { updateFileShare } from "@/hooks/useFiles";
import type { CloudProvider, FilesOverviewResponse } from "@/types/files";
import type { Lesson, LessonStatus } from "@/types/schedule";
import type { Student } from "@/types/student";
import type { HomeworkFile } from "@/mocks/student-details";
import StudentAvatar from "@/components/StudentAvatar";
import StudentNameWithBadge from "@/components/StudentNameWithBadge";
import StyledDateInput from "@/components/StyledDateInput";
import CreateStudentModal from "@/components/CreateStudentModal";
import AddSubjectModal from "@/components/AddSubjectModal";
import CreatePaymentModal from "@/components/CreatePaymentModal";
import { updatePayment } from "@/hooks/usePayments";
import AppDialog from "@/components/AppDialog";
import MaterialsPickerDialog from "@/components/MaterialsPickerDialog";
import AppSelect from "@/components/AppSelect";
import AppField from "@/components/AppField";
import { codedErrorMessage } from "@/lib/errorCodes";
import {
    buildLessonMaterialsNote,
    isLessonMaterialsNoteContent,
    parseLessonMaterialsNote,
} from "@/lib/lessonNotes";
import { useRouter } from "next/router";
import { useAuth } from "@/contexts/AuthContext";

const GText = Text as any;
const GButton = Button as any;
const GLabel = Label as any;
const GIcon = Icon as any;
const GSelect = Select as any;

/* ═══════════════════════════════════════════════════════════
   Constants
   ═══════════════════════════════════════════════════════════ */

const durationItems = [
    { value: "30", content: "30 минут" },
    { value: "45", content: "45 минут" },
    { value: "60", content: "60 минут" },
    { value: "90", content: "90 минут" },
    { value: "120", content: "120 минут" },
];

const formatItems = [
    { value: "online", content: "Онлайн" },
    { value: "offline", content: "Офлайн" },
];

const timeItems = Array.from({ length: 48 }, (_, index) => {
    const hours = String(Math.floor(index / 2)).padStart(2, "0");
    const minutes = index % 2 === 0 ? "00" : "30";
    const value = `${hours}:${minutes}`;
    return { value, content: value };
});

const ADD_STUDENT_OPTION_VALUE = "__add_student__";
const ADD_SUBJECT_OPTION_VALUE = "__add_subject__";
const RECURRENCE_WEEKS_AHEAD = 52;
const PANEL_Z = 960;
type EditableLessonStatus =
    | "planned"
    | "completed"
    | "cancelled"
    | "no_show"
    | "reschedule_pending";

const statusItems = [
    { value: "planned", content: "Запланировано" },
    { value: "completed", content: "Проведено" },
    { value: "cancelled", content: "Отменено" },
    { value: "no_show", content: "Неявка" },
    { value: "reschedule_pending", content: "Запрос на перенос" },
];

/* ═══════════════════════════════════════════════════════════
   Helpers
   ═══════════════════════════════════════════════════════════ */

const toEditableStatus = (status: LessonStatus): EditableLessonStatus => {
    if (status === "cancelled_student" || status === "cancelled_tutor") {
        return "cancelled";
    }
    return status as EditableLessonStatus;
};

const toApiStatus = (status: EditableLessonStatus): LessonStatus => {
    if (status === "cancelled") return "cancelled_student";
    return status as LessonStatus;
};

const getTodayDateKey = () => {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, "0");
    const d = String(now.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
};

const inferDefaultStatus = (dateKey?: string): EditableLessonStatus => {
    if (!dateKey) return "planned";
    return dateKey < getTodayDateKey() ? "completed" : "planned";
};

const formatHistoryDate = (dateKey: string, timeKey: string) => {
    try {
        const value = new Date(`${dateKey}T${timeKey || "00:00"}`);
        if (Number.isNaN(value.getTime())) return `${dateKey} ${timeKey}`.trim();
        return value.toLocaleString("ru-RU", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        });
    } catch {
        return `${dateKey} ${timeKey}`.trim();
    }
};

const buildStatusHistoryText = (status: EditableLessonStatus, dateKey: string, timeKey: string) => {
    switch (status) {
        case "completed":
            return "Занятие отмечено как проведенное";
        case "cancelled":
            return "Ученик отменил занятие";
        case "no_show":
            return "Ученик не пришел на занятие";
        case "reschedule_pending":
            return `Ученик попросил о переносе на ${formatHistoryDate(dateKey, timeKey)}`;
        case "planned":
        default:
            return "Занятие переведено в статус «Запланировано»";
    }
};

const normalizeSubjectName = (value: unknown) => {
    if (typeof value !== "string") return "";
    return value.trim();
};

const splitSubjectNames = (value: unknown): string[] => {
    if (Array.isArray(value)) {
        return value.flatMap((entry) => splitSubjectNames(entry));
    }

    if (typeof value !== "string") {
        return [];
    }

    return value
        .split(/[,;\/|\n]+/g)
        .map((item) => normalizeSubjectName(item))
        .filter((item): item is string => Boolean(item));
};

function getIsoWeekday(dateKey: string) {
    const day = new Date(`${dateKey}T12:00:00`).getDay();
    return day === 0 ? 7 : day;
}

function buildRecurrenceUntil(dateKey: string) {
    const until = new Date(`${dateKey}T23:59:59.999`);
    until.setDate(until.getDate() + RECURRENCE_WEEKS_AHEAD * 7);
    return until.toISOString();
}

const ROOT_FOLDER_ID = "ROOT";

const makeSelectionKey = (provider: CloudProvider, itemId: string) =>
    `${provider}:${itemId}`;

const sortByTypeAndName = (a: HomeworkFile, b: HomeworkFile) => {
    const aType = a.type || "file";
    const bType = b.type || "file";
    if (aType !== bType) return aType === "folder" ? -1 : 1;
    return a.name.localeCompare(b.name, "ru");
};

const formatOptionalDate = (value?: string) => {
    if (!value) return "—";
    if (/^\d{2}\.\d{2}\.\d{4}$/.test(value)) return value;
    if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
        const [year, month, day] = value.split("-");
        return `${day}.${month}.${year}`;
    }
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return value;
    return parsed.toLocaleDateString("ru-RU", { day: "2-digit", month: "2-digit", year: "numeric" });
};

const toDateInputValue = (value?: string) => {
    if (!value) return "";
    if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
    if (/^\d{2}\.\d{2}\.\d{4}$/.test(value)) {
        const [day, month, year] = value.split(".");
        return `${year}-${month}-${day}`;
    }
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return "";
    const year = parsed.getFullYear();
    const month = String(parsed.getMonth() + 1).padStart(2, "0");
    const day = String(parsed.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
};

const mapHomeworkLinkedFiles = (files: any[]): HomeworkFile[] => {
    return files
        .map((file) => {
            if (!file || typeof file !== "object") return null;
            const provider = file.provider || file.cloudProvider;
            return {
                id: String(file.id || "").trim(),
                name: String(file.name || "Файл"),
                url: file.url || file.cloudUrl || "#",
                provider:
                    provider === "google-drive" || provider === "yandex-disk"
                        ? provider
                        : undefined,
                type: file.type === "folder" ? "folder" : "file",
                extension: file.extension || undefined,
                size: file.size || undefined,
            } as HomeworkFile;
        })
        .filter((file): file is HomeworkFile => !!file && !!file.id);
};

const normalizeHomeworkForPanel = (raw: any): LessonPanelHomeworkItem | null => {
    if (!raw || typeof raw !== "object") return null;
    const id = String(raw.id || "").trim();
    if (!id) return null;
    const linkedFilesSource = Array.isArray(raw.linkedFiles) ? raw.linkedFiles : [];
    return {
        id,
        task: String(raw.task || "").trim() || "Без описания",
        dueAt: raw.dueAt ? String(raw.dueAt) : undefined,
        lessonId: raw.lessonId || raw.lesson?.id || null,
        linkedFiles: mapHomeworkLinkedFiles(linkedFilesSource),
    };
};

const normalizePaymentForPanel = (raw: any): LessonPanelPaymentItem | null => {
    if (!raw || typeof raw !== "object") return null;
    const id = String(raw.id || "").trim();
    if (!id) return null;
    return {
        id,
        amount: Number(raw.amount) || 0,
        status: String(raw.status || "paid").toLowerCase(),
        method: raw.method ? String(raw.method).toLowerCase() : undefined,
        date: raw.date ? String(raw.date) : raw.createdAt ? String(raw.createdAt) : undefined,
        lessonId: raw.lessonId || raw.lesson?.id || null,
    };
};

/* ═══════════════════════════════════════════════════════════
   Types
   ═══════════════════════════════════════════════════════════ */

type LessonPanelHomeworkItem = {
    id: string;
    task: string;
    dueAt?: string;
    lessonId?: string | null;
    linkedFiles: HomeworkFile[];
};

type LessonPanelPaymentItem = {
    id: string;
    amount: number;
    status: string;
    method?: string;
    date?: string;
    lessonId?: string | null;
};

type LessonPanelV2Props = {
    open: boolean;
    onClose: () => void;
    lesson?: Lesson | null;
    onSaved?: () => void | Promise<void>;
    onDeleted?: (lessonId: string) => void;
    defaultStudent?: {
        id: string;
        name: string;
        accountId?: string | null;
    } | null;
    defaultDate?: string;
    defaultTime?: string;
};

/* ═══════════════════════════════════════════════════════════
   Sub-components
   ═══════════════════════════════════════════════════════════ */

const SectionTitle = ({ children }: { children: React.ReactNode }) => (
    <h3 className="lp2-section-title">{children}</h3>
);

/* ═══════════════════════════════════════════════════════════
   Main component
   ═══════════════════════════════════════════════════════════ */

const LessonPanelV2 = ({
    open,
    onClose,
    lesson,
    onSaved,
    onDeleted,
    defaultStudent,
    defaultDate,
    defaultTime,
}: LessonPanelV2Props) => {
    const router = useRouter();
    const { user, refreshUser } = useAuth();
    const [mounted, setMounted] = useState(false);
    const [shouldRender, setShouldRender] = useState(false);
    const [isPanelVisible, setIsPanelVisible] = useState(false);
    const panelRef = useRef<HTMLDivElement>(null);

    const isExisting = !!lesson;

    // ── Status & action state ──
    const [actionError, setActionError] = useState<string | null>(null);
    const [confirmDelete, setConfirmDelete] = useState(false);
    const [paymentModalOpen, setPaymentModalOpen] = useState(false);
    const [sessionPaymentItems, setSessionPaymentItems] = useState<LessonPanelPaymentItem[]>([]);
    const [createStudentModalVisible, setCreateStudentModalVisible] = useState(false);
    const [addSubjectModalVisible, setAddSubjectModalVisible] = useState(false);

    // ── Students data ──
    const { data: studentsData, refetch: refetchStudents } = useStudents(
        { limit: 200 },
        { skip: !open },
    );
    const students = studentsData?.data || [];

    const { data: settingsData, refetch: refetchSettings } = useApi<any>(
        "/settings",
        undefined,
        { skip: !open },
    );

    // ── Form fields ──
    const [studentId, setStudentId] = useState<string[]>([]);
    const [subject, setSubject] = useState<string[]>([]);
    const [date, setDate] = useState("");
    const [time, setTime] = useState("");
    const [duration, setDuration] = useState<string[]>(["60"]);
    const [format, setFormat] = useState<string[]>(["online"]);
    const [status, setStatus] = useState<EditableLessonStatus>("planned");
    const [statusTouchedManually, setStatusTouchedManually] = useState(false);
    const [location, setLocation] = useState("");
    const [cost, setCost] = useState("");
    const [repeat, setRepeat] = useState(false);
    const [note, setNote] = useState("");
    const [saving, setSaving] = useState(false);
    const [formError, setFormError] = useState<string | null>(null);

    type RequiredField = "student" | "subject" | "date" | "time";
    const [touched, setTouched] = useState<Record<RequiredField, boolean>>({
        student: false, subject: false, date: false, time: false,
    });
    const markTouched = (field: RequiredField) => {
        setTouched((prev) => (prev[field] ? prev : { ...prev, [field]: true }));
    };

    // ── Homework state ──
    const [hwFormVisible, setHwFormVisible] = useState(false);
    const [hwEditingId, setHwEditingId] = useState<string | null>(null);
    const [hwTask, setHwTask] = useState("");
    const [hwDueDate, setHwDueDate] = useState("");
    const [hwLinkedFiles, setHwLinkedFiles] = useState<HomeworkFile[]>([]);
    const [materialsPickerOpen, setMaterialsPickerOpen] = useState(false);
    const [homeworkMaterialsPickerOpen, setHomeworkMaterialsPickerOpen] = useState(false);
    const [draftSelectedKeys, setDraftSelectedKeys] = useState<string[]>([]);
    const [hwSaving, setHwSaving] = useState(false);
    const [hwBusyId, setHwBusyId] = useState<string | null>(null);
    const [sessionHomeworkItems, setSessionHomeworkItems] = useState<LessonPanelHomeworkItem[]>([]);
    const [removedHomeworkIds, setRemovedHomeworkIds] = useState<string[]>([]);
    const [lessonMaterials, setLessonMaterials] = useState<HomeworkFile[]>([]);
    const [materialsDirty, setMaterialsDirty] = useState(false);

    const subjectItems = useMemo(() => {
        const names = new Set<string>();
        const remember = (value: unknown) => {
            const normalized = normalizeSubjectName(value);
            if (normalized) names.add(normalized);
        };
        const subjectDetails = Array.isArray(settingsData?.subjectDetails) ? settingsData.subjectDetails : [];
        subjectDetails.forEach((item: any) => remember(item?.name));
        const settingsSubjects = Array.isArray(settingsData?.subjects) ? settingsData.subjects : [];
        settingsSubjects.forEach((item: unknown) => remember(item));
        const authSubjects = Array.isArray(user?.subjects) ? (user?.subjects ?? []) : [];
        authSubjects.forEach((item: unknown) => remember(item));
        remember(lesson?.subject);
        remember(subject[0]);
        const options = Array.from(names).map((name) => ({ value: name, content: name }));
        return [...options, { value: ADD_SUBJECT_OPTION_VALUE, content: "Добавить предмет" }];
    }, [lesson?.subject, settingsData?.subjectDetails, settingsData?.subjects, subject, user?.subjects]);

    const { data: filesOverview, refetch: refetchFilesOverview } = useApi<FilesOverviewResponse>(
        open && (hwFormVisible || materialsPickerOpen || homeworkMaterialsPickerOpen) ? "/files" : null,
    );

    const availableHomeworkFiles = useMemo<HomeworkFile[]>(() => {
        const allFiles = filesOverview?.files || [];
        return allFiles.map((item) => ({
            id: item.id,
            name: item.name,
            url: item.cloudUrl,
            provider: item.cloudProvider,
            type: item.type,
            size: item.size,
            extension: item.extension,
            parentId: item.parentId,
            childrenCount: item.childrenCount,
        }));
    }, [filesOverview?.files]);

    const connectedProviders = useMemo<CloudProvider[]>(() => {
        const providers = (filesOverview?.cloudConnections || [])
            .filter((cloud) => cloud.connected)
            .map((cloud) => cloud.provider);
        return Array.from(new Set(providers));
    }, [filesOverview?.cloudConnections]);

    const defaultMaterialsProvider = useMemo<CloudProvider | undefined>(() => {
        const preferred: CloudProvider =
            settingsData?.homeworkDefaultCloud === "GOOGLE_DRIVE"
                ? "google-drive"
                : "yandex-disk";
        if (connectedProviders.includes(preferred)) return preferred;
        return connectedProviders[0];
    }, [settingsData?.homeworkDefaultCloud, connectedProviders]);

    const homeworkMaterialsHint = useMemo(() => {
        const hasYandex = connectedProviders.includes("yandex-disk");
        const hasGoogle = connectedProviders.includes("google-drive");
        if (hasYandex && hasGoogle) {
            return "Яндекс Диск и Google Drive · доступ ученику";
        }
        if (hasYandex) {
            return "Яндекс Диск · доступ ученику";
        }
        if (hasGoogle) {
            return "Google Drive · доступ ученику";
        }
        return "Подключите облачное хранилище";
    }, [connectedProviders]);

    const normalizedAvailableFiles = useMemo(() => {
        const deduped = new Map<string, HomeworkFile>();
        availableHomeworkFiles.forEach((item) => {
            if (!item.provider) return;
            deduped.set(makeSelectionKey(item.provider, item.id), item);
        });
        return Array.from(deduped.values());
    }, [availableHomeworkFiles]);

    const fileBySelectionKey = useMemo(() => {
        const map = new Map<string, HomeworkFile>();
        normalizedAvailableFiles.forEach((item) => {
            if (!item.provider) return;
            map.set(makeSelectionKey(item.provider, item.id), item);
        });
        return map;
    }, [normalizedAvailableFiles]);

    const sharedStudentIdsByFileId = useMemo(() => {
        const map = new Map<string, string[]>();
        (filesOverview?.files || []).forEach((file) => {
            map.set(file.id, Array.isArray(file.sharedWith) ? file.sharedWith : []);
        });
        return map;
    }, [filesOverview?.files]);

    const sectionStudentId = open ? (lesson?.studentId || studentId[0]) : undefined;
    const { data: studentNotesData, refetch: refetchStudentNotes } = useStudentNotes(sectionStudentId);
    const { data: studentHomeworkData, refetch: refetchStudentHomework } = useStudentHomework(sectionStudentId);

    const persistedLessonMaterialsNote = useMemo(() => {
        if (!lesson?.id) return null;
        return (studentNotesData?.data || []).find(
            (item: any) =>
                item?.lessonId === lesson.id &&
                typeof item?.content === "string" &&
                isLessonMaterialsNoteContent(item.content),
        ) as { id: string; content: string } | undefined || null;
    }, [studentNotesData?.data, lesson?.id]);

    const persistedLessonMaterials = useMemo(
        () => parseLessonMaterialsNote(persistedLessonMaterialsNote?.content),
        [persistedLessonMaterialsNote?.content],
    );

    const persistedLessonHomeworkItems = useMemo(() => {
        if (!lesson?.id) return [] as LessonPanelHomeworkItem[];
        return (studentHomeworkData?.data || [])
            .map((item: any) => normalizeHomeworkForPanel(item))
            .filter((item): item is LessonPanelHomeworkItem => !!item)
            .filter((item) => item.lessonId === lesson.id);
    }, [studentHomeworkData?.data, lesson?.id]);

    // ── Payments data ──
    const { data: paymentsRaw, refetch: refetchPayments } = useApi<{ data: any[] }>(
        lesson?.id ? "/payments" : null,
        { studentId: lesson?.studentId },
        { skip: !open || !lesson?.id },
    );
    const lessonPayments = (paymentsRaw?.data || []).filter(
        (p: any) => p.lessonId === lesson?.id || p.lesson?.id === lesson?.id,
    );

    const persistedLessonPaymentItems = useMemo(() => {
        return lessonPayments
            .map((item) => normalizePaymentForPanel(item))
            .filter((item): item is LessonPanelPaymentItem => !!item);
    }, [lessonPayments]);

    const removedHomeworkIdSet = useMemo(() => new Set(removedHomeworkIds), [removedHomeworkIds]);

    const visibleHomeworkItems = useMemo(() => {
        if (!isExisting || !lesson?.id) {
            return sessionHomeworkItems.filter((item) => !removedHomeworkIdSet.has(item.id));
        }
        const map = new Map<string, LessonPanelHomeworkItem>();
        persistedLessonHomeworkItems.forEach((item) => map.set(item.id, item));
        sessionHomeworkItems.forEach((item) => {
            if (item.lessonId === lesson.id || !item.lessonId) map.set(item.id, item);
        });
        return Array.from(map.values()).filter((item) => !removedHomeworkIdSet.has(item.id));
    }, [isExisting, lesson?.id, persistedLessonHomeworkItems, sessionHomeworkItems, removedHomeworkIdSet]);

    const savedMaterialsFromHomework = useMemo(() => {
        const map = new Map<string, HomeworkFile>();
        visibleHomeworkItems.forEach((homework) => {
            homework.linkedFiles.forEach((file) => {
                const key = file.provider ? makeSelectionKey(file.provider, file.id) : `manual:${file.id}`;
                map.set(key, file);
            });
        });
        return Array.from(map.values());
    }, [visibleHomeworkItems]);

    const visiblePaymentItems = useMemo(() => {
        if (!isExisting || !lesson?.id) return sessionPaymentItems;
        const map = new Map<string, LessonPanelPaymentItem>();
        persistedLessonPaymentItems.forEach((item) => map.set(item.id, item));
        sessionPaymentItems.forEach((item) => {
            if (item.lessonId === lesson.id || !item.lessonId) map.set(item.id, item);
        });
        return Array.from(map.values());
    }, [isExisting, lesson?.id, persistedLessonPaymentItems, sessionPaymentItems]);

    /* ════════════════════════════════════════════════════════
       Lifecycle
       ════════════════════════════════════════════════════════ */

    useEffect(() => { setMounted(true); }, []);

    useEffect(() => {
        if (open) {
            setShouldRender(true);
            let raf1 = 0;
            let raf2 = 0;
            raf1 = requestAnimationFrame(() => {
                raf2 = requestAnimationFrame(() => {
                    setIsPanelVisible(true);
                });
            });
            return () => { cancelAnimationFrame(raf1); cancelAnimationFrame(raf2); };
        }
        setIsPanelVisible(false);
        return;
    }, [open]);

    useEffect(() => {
        if (!shouldRender) setIsPanelVisible(false);
    }, [shouldRender]);

    const handleTransitionEnd = () => {
        if (!open && !isPanelVisible) setShouldRender(false);
    };

    useEffect(() => {
        if (!open) return;
        setActionError(null);
        setConfirmDelete(false);
        setPaymentModalOpen(false);
        setSessionPaymentItems([]);
        setCreateStudentModalVisible(false);
        setAddSubjectModalVisible(false);
        setHwFormVisible(false);
        setHwTask("");
        setHwDueDate("");
        setHwLinkedFiles([]);
        setMaterialsPickerOpen(false);
        setHomeworkMaterialsPickerOpen(false);
        setDraftSelectedKeys([]);
        setSessionHomeworkItems([]);
        setHwEditingId(null);
        setHwBusyId(null);
        setRemovedHomeworkIds([]);
        setLessonMaterials([]);
        setMaterialsDirty(false);
        setStatusTouchedManually(false);
        setFormError(null);
        setTouched({ student: false, subject: false, date: false, time: false });
        initForm(lesson);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open]);

    useEffect(() => {
        if (!open) return;
        const onKey = (e: KeyboardEvent) => {
            if (e.key === "Escape") { e.stopPropagation(); onClose(); }
        };
        document.addEventListener("keydown", onKey);
        return () => document.removeEventListener("keydown", onKey);
    }, [open, onClose]);

    useEffect(() => {
        if (!open || materialsDirty) return;
        if (isExisting) {
            setLessonMaterials(persistedLessonMaterials);
            return;
        }
        setLessonMaterials([]);
    }, [open, isExisting, persistedLessonMaterials, materialsDirty]);

    /* ════════════════════════════════════════════════════════
       Form init
       ════════════════════════════════════════════════════════ */

    const initForm = useCallback((l: Lesson | null | undefined) => {
        if (l) {
            const matched = students.find(
                (s) => s.id === l.studentId || s.name === l.studentName,
            );
            setStudentId(matched ? [matched.id] : l.studentId ? [l.studentId] : []);
            const lessonSubject = normalizeSubjectName(l.subject);
            setSubject(lessonSubject ? [lessonSubject] : []);
            setDate(l.date);
            setTime(l.startTime);
            setDuration([String(l.duration || "60")]);
            setFormat([l.format?.toLowerCase() || "online"]);
            setStatus(toEditableStatus(l.status));
            setStatusTouchedManually(true);
            setLocation("");
            setCost(String(l.rate));
            setRepeat(false);
            setNote(l.notes || "");
        } else {
            setStudentId(defaultStudent ? [defaultStudent.id] : []);
            setSubject([]);
            setDate(defaultDate || "");
            setTime(defaultTime || "");
            setDuration(["60"]);
            setFormat(["online"]);
            setStatus(inferDefaultStatus(defaultDate || ""));
            setStatusTouchedManually(false);
            setLocation("");
            setCost("");
            setRepeat(false);
            setNote("");
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [students, defaultStudent, defaultDate, defaultTime]);

    // Auto-fill subject & cost from student (new only)
    useEffect(() => {
        if (!isExisting && studentId.length > 0) {
            const s = students.find((st) => st.id === studentId[0]);
            if (s) {
                const mergedSubjects = Array.from(
                    new Set([
                        ...splitSubjectNames(s.subject),
                        ...splitSubjectNames((s as any)?.subjects),
                    ]),
                );

                if (mergedSubjects.length === 1) {
                    const singleSubject = mergedSubjects[0];
                    if (singleSubject) {
                        setSubject((prev) => (prev[0] === singleSubject ? prev : [singleSubject]));
                    }
                } else if (!subject.length && mergedSubjects.length === 0) {
                    const fallbackSubject = normalizeSubjectName(s.subject);
                    if (fallbackSubject) setSubject([fallbackSubject]);
                }

                if (mergedSubjects.length > 1) {
                    setSubject((prev) => {
                        if (!prev[0]) return prev;
                        return mergedSubjects.includes(prev[0]) ? prev : [];
                    });
                }

                if (!cost) setCost(String(s.rate || ""));
            }
        } else if (!isExisting && studentId.length === 0) {
            setSubject([]);
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [studentId, isExisting]);

    /* ════════════════════════════════════════════════════════
       Handlers
       ════════════════════════════════════════════════════════ */

    const handleClose = () => onClose();

    const handleAddSubject = () => setAddSubjectModalVisible(true);

    const handleSubjectCreated = async (subjectName: string) => {
        setSubject([subjectName]);
        markTouched("subject");
        await Promise.allSettled([refetchSettings(), refreshUser()]);
    };

    const syncLessonMaterials = useCallback(async (targetStudentId: string, targetLessonId: string) => {
        if (isExisting && !materialsDirty) return;

        const uniqueById = new Map<string, HomeworkFile>();
        lessonMaterials.forEach((file) => {
            if (!file?.id) return;
            uniqueById.set(file.id, file);
        });
        const uniqueMaterials = Array.from(uniqueById.values());

        if (uniqueMaterials.length > 0) {
            await Promise.allSettled(
                uniqueMaterials.map((file) => {
                    const sharedIds = new Set(sharedStudentIdsByFileId.get(file.id) || []);
                    sharedIds.add(targetStudentId);
                    return updateFileShare(file.id, {
                        studentIds: Array.from(sharedIds),
                        applyToChildren: false,
                    });
                }),
            );
        }

        if (persistedLessonMaterialsNote?.id) {
            if (uniqueMaterials.length === 0) {
                await deleteNote(targetStudentId, persistedLessonMaterialsNote.id);
            } else {
                await updateNote(
                    targetStudentId,
                    persistedLessonMaterialsNote.id,
                    buildLessonMaterialsNote(uniqueMaterials),
                );
            }
        } else if (uniqueMaterials.length > 0) {
            await createNote(
                targetStudentId,
                buildLessonMaterialsNote(uniqueMaterials),
                targetLessonId,
            );
        }

        void refetchStudentNotes().catch(() => undefined);
    }, [
        isExisting,
        materialsDirty,
        lessonMaterials,
        sharedStudentIdsByFileId,
        persistedLessonMaterialsNote?.id,
        refetchStudentNotes,
    ]);

    const handleSubmit = async () => {
        const hasHomeworkDraft =
            hwFormVisible &&
            (hwTask.trim().length > 0 || !!hwDueDate || hwLinkedFiles.length > 0);

        if (hwSaving) {
            setFormError("Дождитесь сохранения домашнего задания.");
            return;
        }

        if (hasHomeworkDraft) {
            setFormError("Сохраните или отмените черновик домашнего задания.");
            return;
        }

        const hasStudent = studentId.length > 0;
        const resolvedSubject =
            subject[0] || (hasSingleStudentSubject ? selectedStudentSubjects[0] : undefined);
        const hasSubject = Boolean(resolvedSubject);
        const hasDate = !!date;
        const hasTime = !!time;
        const durationMinutes = Number(duration[0]);
        const selectedApiStatus = toApiStatus(status);

        setTouched({ student: true, subject: true, date: true, time: true });

        if (!hasStudent || !hasSubject || !hasDate || !hasTime) {
            setFormError("Заполните обязательные поля.");
            return;
        }

        if (!duration.length || !Number.isFinite(durationMinutes) || durationMinutes <= 0) {
            setFormError("Укажите длительность занятия в минутах.");
            return;
        }

        setSaving(true);
        setFormError(null);
        try {
            const scheduledAt = new Date(`${date}T${time}`).toISOString();
            const recurrence = !isExisting && repeat
                ? { enabled: true, until: buildRecurrenceUntil(date), weekdays: [getIsoWeekday(date)] }
                : undefined;

            if (isExisting && lesson) {
                await updateLesson(lesson.id, {
                    subject: resolvedSubject,
                    scheduledAt,
                    duration: durationMinutes,
                    format: format[0].toUpperCase(),
                    location: location || undefined,
                    rate: Number(cost) || undefined,
                    notes: note,
                });

                const previousStatus = toEditableStatus(lesson.status);
                if (status !== previousStatus) {
                    await updateLessonStatus(lesson.id, selectedApiStatus);
                    if (lesson.studentId) {
                        void createNote(
                            lesson.studentId,
                            buildStatusHistoryText(status, date, time),
                            lesson.id,
                        ).catch(() => undefined);
                    }
                }

                if (lesson.studentId && (materialsDirty || lessonMaterials.length > 0)) {
                    await syncLessonMaterials(lesson.studentId, lesson.id);
                }
            } else {
                const created = await createLesson({
                    studentId: studentId[0],
                    subject: resolvedSubject,
                    scheduledAt,
                    duration: durationMinutes,
                    format: format[0].toUpperCase(),
                    location: location || undefined,
                    rate: Number(cost) || undefined,
                    notes: note,
                    recurrence,
                });

                const createdLessons = Array.isArray(created) ? created : created ? [created] : [];
                const primaryCreatedLessonId =
                    createdLessons.find((item: any) => typeof item?.id === "string")?.id || null;

                if (primaryCreatedLessonId && studentId[0]) {
                    const unlinkedHomeworkIds = sessionHomeworkItems
                        .filter((item) => !item.lessonId && !item.id.startsWith("tmp-"))
                        .map((item) => item.id);

                    if (unlinkedHomeworkIds.length > 0) {
                        const unlinkedSet = new Set(unlinkedHomeworkIds);
                        await Promise.allSettled(
                            unlinkedHomeworkIds.map((homeworkId) =>
                                updateHomework(studentId[0], homeworkId, { lessonId: primaryCreatedLessonId }),
                            ),
                        );
                        setSessionHomeworkItems((prev) =>
                            prev.map((item) =>
                                unlinkedSet.has(item.id) ? { ...item, lessonId: primaryCreatedLessonId } : item,
                            ),
                        );
                    }

                    // Create tmp homework items that were deferred until lesson was saved
                    const tmpHomeworkItems = sessionHomeworkItems.filter(
                        (item) => item.id.startsWith("tmp-") && !removedHomeworkIds.includes(item.id),
                    );
                    if (tmpHomeworkItems.length > 0) {
                        await Promise.allSettled(
                            tmpHomeworkItems.map((item) =>
                                createHomework(studentId[0], {
                                    task: item.task,
                                    dueAt: item.dueAt || undefined,
                                    lessonId: primaryCreatedLessonId,
                                    fileIds: item.linkedFiles.map((f) => f.id),
                                }),
                            ),
                        );
                    }

                    // Link session payments to the newly created lesson
                    const unlinkedPaymentIds = sessionPaymentItems
                        .filter((item) => !item.lessonId && item.id)
                        .map((item) => item.id);
                    if (unlinkedPaymentIds.length > 0) {
                        await Promise.allSettled(
                            unlinkedPaymentIds.map((paymentId) =>
                                updatePayment(paymentId, { lessonId: primaryCreatedLessonId }),
                            ),
                        );
                    }

                    if (lessonMaterials.length > 0) {
                        await syncLessonMaterials(studentId[0], primaryCreatedLessonId);
                    }
                }

                if (status !== "planned" && createdLessons.length > 0) {
                    await Promise.all(
                        createdLessons
                            .map((item: any) => item?.id)
                            .filter(Boolean)
                            .map((id: string) => updateLessonStatus(id, selectedApiStatus)),
                    );
                }

                const creationMessage = `Занятие создано (${formatHistoryDate(date, time)})`;
                const statusMessage = buildStatusHistoryText(status, date, time);

                if (createdLessons.length > 0) {
                    await Promise.allSettled(
                        createdLessons.flatMap((item: any) => {
                            const createdStudentId = item?.studentId || studentId[0];
                            const createdLessonId = item?.id;
                            if (!createdStudentId) return [];
                            const tasks: Array<Promise<unknown>> = [
                                createNote(createdStudentId, creationMessage, createdLessonId),
                            ];
                            if (status !== "planned") {
                                tasks.push(createNote(createdStudentId, statusMessage, createdLessonId));
                            }
                            return tasks;
                        }),
                    );
                } else if (studentId[0]) {
                    void createNote(studentId[0], creationMessage).catch(() => undefined);
                    if (status !== "planned") {
                        void createNote(studentId[0], statusMessage).catch(() => undefined);
                    }
                }
            }

            await onSaved?.();
            handleClose();
        } catch (err) {
            setFormError(codedErrorMessage("LESSON-SAVE", err));
        } finally {
            setSaving(false);
        }
    };

    const handleDeleteConfirm = async () => {
        if (!lesson || !onDeleted) return;
        try {
            await deleteLesson(lesson.id);
            onDeleted(lesson.id);
        } catch {
            setActionError("Не удалось удалить занятие.");
        }
        setConfirmDelete(false);
        handleClose();
    };

    const handleStudentCreated = async (createdStudent?: Student) => {
        await refetchStudents();
        if (!createdStudent?.id) return;
        setStudentId([createdStudent.id]);
        markTouched("student");
        if (!isExisting) {
            if (!subject.length) {
                const matchedSubject = normalizeSubjectName(createdStudent.subject);
                if (matchedSubject) setSubject([matchedSubject]);
            }
            if (!cost && typeof createdStudent.rate === "number" && createdStudent.rate > 0) {
                setCost(String(createdStudent.rate));
            }
        }
    };

    const openMaterialsPicker = () => {
        setDraftSelectedKeys(
            lessonMaterials
                .map((file) => {
                    if (file.provider) {
                        const directKey = makeSelectionKey(file.provider, file.id);
                        if (fileBySelectionKey.has(directKey)) return directKey;
                    }
                    const fallback = normalizedAvailableFiles.find((a) => a.id === file.id);
                    if (fallback?.provider) return makeSelectionKey(fallback.provider, fallback.id);
                    return null;
                })
                .filter((key): key is string => !!key),
        );
        setMaterialsPickerOpen(true);
    };

    const openHomeworkMaterialsPicker = () => {
        setHomeworkMaterialsPickerOpen(true);
    };

    const resetHomeworkForm = () => {
        setHwFormVisible(false);
        setHwEditingId(null);
        setHwTask("");
        setHwDueDate("");
        setHwLinkedFiles([]);
        setHomeworkMaterialsPickerOpen(false);
    };

    const handleEditHomework = (homework: LessonPanelHomeworkItem) => {
        setHwEditingId(homework.id);
        setHwTask(homework.task);
        setHwDueDate(toDateInputValue(homework.dueAt));
        setHwLinkedFiles(homework.linkedFiles);
        setHwFormVisible(true);
        setActionError(null);
    };

    const handleDeleteHomework = async (homework: LessonPanelHomeworkItem) => {
        const targetStudentId = lesson?.studentId || studentId[0];
        if (!targetStudentId) {
            setActionError("Сначала выберите ученика.");
            return;
        }
        setHwBusyId(homework.id);
        setActionError(null);
        try {
            const isLocalOnly = homework.id.startsWith("tmp-");
            if (!isLocalOnly) await deleteHomework(targetStudentId, homework.id);
            setSessionHomeworkItems((prev) => prev.filter((item) => item.id !== homework.id));
            setRemovedHomeworkIds((prev) => prev.includes(homework.id) ? prev : [...prev, homework.id]);
            if (hwEditingId === homework.id) resetHomeworkForm();
            void refetchStudentHomework().catch(() => undefined);
            void createNote(targetStudentId, "Домашнее задание удалено", lesson?.id).catch(() => undefined);
        } catch (err) {
            setActionError(codedErrorMessage("HW-DELETE", err));
        } finally {
            setHwBusyId(null);
        }
    };

    const handleHomeworkSubmit = async () => {
        if (!hwTask.trim()) return;
        const targetStudentId = lesson?.studentId || studentId[0];
        if (!targetStudentId) {
            setActionError("Сначала выберите ученика.");
            return;
        }
        setHwSaving(true);
        setActionError(null);
        try {
            const taskText = hwTask.trim();
            const linkedFileIds = hwLinkedFiles.map((file) => file.id);

            if (hwEditingId) {
                const editingItem = visibleHomeworkItems.find((item) => item.id === hwEditingId);
                let normalizedHomework: LessonPanelHomeworkItem;
                if (hwEditingId.startsWith("tmp-")) {
                    normalizedHomework = {
                        id: hwEditingId,
                        task: taskText,
                        dueAt: hwDueDate || undefined,
                        lessonId: editingItem?.lessonId || lesson?.id || null,
                        linkedFiles: [...hwLinkedFiles],
                    };
                } else {
                    const updatedHomework = await updateHomework(targetStudentId, hwEditingId, {
                        task: taskText,
                        dueAt: hwDueDate || undefined,
                        lessonId: lesson?.id || editingItem?.lessonId || undefined,
                        fileIds: linkedFileIds,
                    });
                    normalizedHomework = normalizeHomeworkForPanel(updatedHomework) || {
                        id: hwEditingId,
                        task: taskText,
                        dueAt: hwDueDate || undefined,
                        lessonId: lesson?.id || editingItem?.lessonId || null,
                        linkedFiles: [...hwLinkedFiles],
                    };
                }
                setSessionHomeworkItems((prev) => [
                    normalizedHomework,
                    ...prev.filter((item) => item.id !== normalizedHomework.id),
                ]);
                setRemovedHomeworkIds((prev) => prev.filter((id) => id !== normalizedHomework.id));
                void refetchStudentHomework().catch(() => undefined);
                void createNote(targetStudentId, "Домашнее задание обновлено", lesson?.id).catch(() => undefined);
                resetHomeworkForm();
                return;
            }

            const createdHomework = !isExisting
                ? null
                : await createHomework(targetStudentId, {
                    task: taskText,
                    dueAt: hwDueDate || undefined,
                    lessonId: lesson?.id || undefined,
                    fileIds: linkedFileIds,
                });
            const fallbackHomework: LessonPanelHomeworkItem = {
                id: `tmp-${Date.now()}`,
                task: taskText,
                dueAt: hwDueDate || undefined,
                lessonId: lesson?.id || null,
                linkedFiles: [...hwLinkedFiles],
            };
            const normalizedHomework: LessonPanelHomeworkItem = createdHomework
                ? normalizeHomeworkForPanel(createdHomework) || fallbackHomework
                : fallbackHomework;
            setSessionHomeworkItems((prev) => [
                normalizedHomework,
                ...prev.filter((item) => item.id !== normalizedHomework.id),
            ]);
            void refetchStudentHomework().catch(() => undefined);
            void createNote(
                targetStudentId,
                `Домашнее задание: ${taskText.length > 80 ? `${taskText.slice(0, 77)}...` : taskText}`,
                lesson?.id,
            ).catch(() => undefined);
            if (linkedFileIds.length > 0) {
                void createNote(
                    targetStudentId,
                    `Добавлены материалы к домашнему заданию (${linkedFileIds.length})`,
                    lesson?.id,
                ).catch(() => undefined);
            }
            resetHomeworkForm();
        } catch (err) {
            setActionError(codedErrorMessage(hwEditingId ? "HW-UPDATE" : "HW-CREATE", err));
        } finally {
            setHwSaving(false);
        }
    };

    /* ════════════════════════════════════════════════════════
       Derived state
       ════════════════════════════════════════════════════════ */

    const currentStudent = studentId.length ? students.find((s) => s.id === studentId[0]) : null;
    const selectedStudentSubjects = useMemo(() => {
        if (!currentStudent) return [] as string[];

        const unique = new Set<string>();
        splitSubjectNames(currentStudent.subject).forEach((item) => unique.add(item));
        splitSubjectNames((currentStudent as any)?.subjects).forEach((item) => unique.add(item));
        return Array.from(unique);
    }, [currentStudent]);

    const paymentDefaultStudent = lesson?.studentId
        ? {
            id: lesson.studentId,
            name: lesson.studentName,
            accountId: lesson.studentAccountId ?? null,
        }
        : currentStudent
            ? {
                id: currentStudent.id,
                name: currentStudent.name,
                accountId: currentStudent.accountId ?? null,
            }
            : null;

    const studentOptions = [
        ...students.map((s) => ({
            value: s.id,
            content: s.name || "Ученик",
            data: {
                avatarUrl: (s as any).avatarUrl,
                accountId: s.accountId ?? null,
            },
        })),
        { value: ADD_STUDENT_OPTION_VALUE, content: "Добавить ученика", data: {} },
    ];

    const studentError = touched.student && !studentId.length;
    const dateError = touched.date && !date;
    const timeError = touched.time && !time;
    const hasSelectedStudent = isExisting || studentId.length > 0;
    const hasSingleStudentSubject = !isExisting && selectedStudentSubjects.length === 1;
    const hasMultipleStudentSubjects = !isExisting && selectedStudentSubjects.length > 1;
    const resolvedSubjectValue =
        subject[0] || (hasSingleStudentSubject ? selectedStudentSubjects[0] : "");
    const subjectError = touched.subject && !resolvedSubjectValue;
    const availableSubjectItems = hasMultipleStudentSubjects
        ? selectedStudentSubjects.map((item) => ({ value: item, content: item }))
        : subjectItems;
    const showingLessonMaterialsDraft = lessonMaterials.length > 0;
    const materialItemsForSection = showingLessonMaterialsDraft ? lessonMaterials : savedMaterialsFromHomework;

    /* ════════════════════════════════════════════════════════
       Render
       ════════════════════════════════════════════════════════ */

    if (!mounted) return null;
    if (!shouldRender && !open) return null;

    const renderStudentOption = (
        option: {
            value: string;
            content?: string;
            data?: {
                avatarUrl?: string;
                accountId?: string | null;
            };
        },
    ) => {
        const optionLabel =
            typeof option.content === "string" && option.content.trim().length
                ? option.content
                : "Ученик";
        if (option.value === ADD_STUDENT_OPTION_VALUE) {
            return (
                <div className="app-select-option-action">
                    <div className="app-select-option-action__icon">
                        +
                    </div>
                    <GText variant="body-1">Добавить ученика</GText>
                </div>
            );
        }
        return (
            <div className="app-select-option-entity">
                <StudentAvatar
                    student={{ name: optionLabel, avatarUrl: option.data?.avatarUrl }}
                    size="s"
                />
                <div className="app-select-option-entity__meta">
                    <span className="app-select-option-entity__title">
                        <StudentNameWithBadge
                            name={optionLabel}
                            hasRepetoAccount={Boolean(option.data?.accountId)}
                        />
                    </span>
                </div>
            </div>
        );
    };

    const panelContent = (
        <div
            ref={panelRef}
            className={`lp2 ${isPanelVisible ? "lp2--open" : ""}`}
            style={{ zIndex: PANEL_Z }}
            onTransitionEnd={handleTransitionEnd}
            role="dialog"
            aria-modal="false"
            aria-label={lesson ? `Занятие: ${lesson.subject}` : "Новое занятие"}
        >
            {/* ══ Top bar ══ */}
            <div className="lp2__topbar">
                <button
                    type="button"
                    className="lp2__back"
                    onClick={handleClose}
                    aria-label="Назад"
                >
                    <GIcon data={ArrowLeft as IconData} size={18} />
                </button>

                <div className="lp2__topbar-actions">
                    {isExisting && onDeleted && (
                        <GButton view="flat" size="s" onClick={() => setConfirmDelete(true)} title="Удалить">
                            <GIcon data={TrashBin as IconData} size={16} />
                        </GButton>
                    )}
                </div>
            </div>

            {/* ══ Scrollable content ══ */}
            <div className="lp2__scroll">
                <div className="lp2__center">
                    <h1 className="lp2__page-title">
                        {isExisting ? "Редактирование занятия" : "Новое занятие"}
                    </h1>

                    {actionError && (
                        <Alert theme="danger" view="filled" corners="rounded" message={actionError}
                            onClose={() => setActionError(null)} style={{ marginBottom: 24 }} />
                    )}

                    {/* ──────── Ученик ──────── */}
                    <SectionTitle>Ученик</SectionTitle>

                    <AppSelect
                        label="Ученик"
                        required
                        error={studentError ? "Выберите ученика" : undefined}
                        options={studentOptions}
                        value={studentId}
                        onUpdate={(value: string[]) => {
                            if (value[0] === ADD_STUDENT_OPTION_VALUE) {
                                setCreateStudentModalVisible(true);
                                markTouched("student");
                                return;
                            }
                            setStudentId(value);
                            markTouched("student");
                        }}
                        renderOption={renderStudentOption}
                        renderSelectedOption={(option: any) => {
                            const selectedStudent = students.find((s) => s.id === option.value);
                            const selectedLabel =
                                typeof option?.content === "string" && option.content.trim().length
                                    ? option.content
                                    : selectedStudent?.name || "Ученик";
                            return (
                                <div className="app-select-selected-entity">
                                    {selectedStudent ? (
                                        <StudentAvatar student={selectedStudent} size="xs" />
                                    ) : (
                                        <StudentAvatar
                                            student={{ name: selectedLabel, avatarUrl: option?.data?.avatarUrl }}
                                            size="xs"
                                        />
                                    )}
                                    <span className="app-select-selected-entity__text">
                                        <StudentNameWithBadge
                                            name={selectedLabel}
                                            hasRepetoAccount={Boolean(selectedStudent?.accountId ?? option?.data?.accountId)}
                                        />
                                    </span>
                                </div>
                            );
                        }}
                        placeholder="Выберите ученика"
                        filterable
                    />

                    <AppSelect
                        label="Статус"
                        options={statusItems}
                        value={[status]}
                        onUpdate={(value: string[]) => {
                            if (!value.length) return;
                            setStatus(value[0] as EditableLessonStatus);
                            setStatusTouchedManually(true);
                        }}
                    />

                    {/* ──────── О занятии ──────── */}
                    <SectionTitle>О занятии</SectionTitle>

                    <AppField label="Предмет" required error={subjectError ? "Обязательное поле" : undefined}>
                        {!hasSelectedStudent ? (
                            <TextInput
                                value=""
                                placeholder="Сначала выберите ученика"
                                size="xl"
                                disabled
                            />
                        ) : hasSingleStudentSubject ? (
                            <TextInput
                                value={selectedStudentSubjects[0] || ""}
                                size="xl"
                                disabled
                            />
                        ) : (
                            <Select
                                options={availableSubjectItems}
                                value={subject}
                                onUpdate={(value: string[]) => {
                                    if (value[0] === ADD_SUBJECT_OPTION_VALUE) {
                                        markTouched("subject");
                                        handleAddSubject();
                                        return;
                                    }
                                    setSubject(value);
                                    markTouched("subject");
                                }}
                                placeholder="Выберите предмет"
                                size="xl"
                                width="max"
                                filterable
                                popupClassName="app-select-popup"
                                popupPlacement="bottom-start"
                            />
                        )}
                    </AppField>

                    <AppField label="Место / ссылка">
                        <TextInput
                            value={location}
                            onUpdate={setLocation}
                            placeholder="Zoom, Skype или адрес"
                            size="xl"
                        />
                    </AppField>

                    {/* ──────── Когда ──────── */}
                    <SectionTitle>Когда планируете занятие?</SectionTitle>

                    <div className="lp2-row">
                        <AppField label="Дата" required error={dateError ? "Обязательное поле" : undefined} half>
                            <StyledDateInput
                                value={date}
                                onUpdate={(value: string) => {
                                    setDate(value);
                                    markTouched("date");
                                    if (!isExisting && !statusTouchedManually) setStatus(inferDefaultStatus(value));
                                }}
                                style={{
                                    height: 40,
                                    padding: 0,
                                    fontSize: 15,
                                    border: "none",
                                    borderRadius: 0,
                                    background: "transparent",
                                }}
                            />
                        </AppField>

                        <AppSelect
                            label="Время начала"
                            required
                            error={timeError ? "Обязательное поле" : undefined}
                            half
                            options={timeItems}
                            value={time ? [time] : []}
                            onUpdate={(value: string[]) => { setTime(value[0] || ""); markTouched("time"); }}
                            placeholder="Выберите время"
                        />
                    </div>

                    <div className="lp2-row">
                        <AppSelect
                            label="Длительность"
                            half
                            options={durationItems}
                            value={duration}
                            onUpdate={setDuration}
                        />

                        <AppSelect
                            label="Формат"
                            half
                            options={formatItems}
                            value={format}
                            onUpdate={setFormat}
                        />
                    </div>

                    {/* ──────── Оплата ──────── */}
                    <SectionTitle>Оплата и заметки</SectionTitle>

                    <AppField label="Стоимость (₽)">
                        <TextInput
                            value={cost}
                            onUpdate={setCost}
                            placeholder="2100"
                            size="xl"
                        />
                    </AppField>

                    {!isExisting && (
                        <div className="lp2-invite-card">
                            <div className="lp2-invite-card__text">
                                <GText variant="body-2" className="lp2-invite-card__title">
                                    Повторять еженедельно
                                </GText>
                                {repeat && (
                                    <GText variant="body-2" color="secondary" className="lp2-invite-card__subtitle">
                                        В тот же день и время каждую неделю
                                    </GText>
                                )}
                            </div>
                            <Switch checked={repeat} onUpdate={setRepeat} size="l" />
                        </div>
                    )}

                    <AppField label="Заметки">
                        <TextArea
                            value={note}
                            onUpdate={setNote}
                            placeholder="Подготовить новый материал..."
                            rows={3}
                            size="xl"
                        />
                    </AppField>

                    {/* ──────── Домашнее задание ──────── */}
                    <SectionTitle>Домашнее задание</SectionTitle>

                    {!hwFormVisible && visibleHomeworkItems.length === 0 && (
                        <div className="lp2-empty">
                            {isExisting
                                ? "Домашнее задание не назначено"
                                : "Добавьте домашнее задание при создании занятия"}
                        </div>
                    )}

                    {visibleHomeworkItems.length > 0 && (
                        <div className="lp2-hw-list">
                            {visibleHomeworkItems.map((homework) => {
                                const filesPreview = homework.linkedFiles.slice(0, 2).map((f) => f.name).join(", ");
                                const hasMoreFiles = homework.linkedFiles.length > 2;
                                return (
                                    <div key={homework.id} className="lp2-hw-item">
                                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                            <GText variant="body-1" style={{ fontWeight: 600, flex: 1, minWidth: 0 }} ellipsis>
                                                {homework.task}
                                            </GText>
                                            <GButton view="flat" size="s" disabled={!!hwBusyId && hwBusyId !== homework.id}
                                                onClick={() => handleEditHomework(homework)}>Редактировать</GButton>
                                            <GButton view="flat" size="s" loading={hwBusyId === homework.id}
                                                disabled={!!hwBusyId && hwBusyId !== homework.id}
                                                onClick={() => void handleDeleteHomework(homework)}>Удалить</GButton>
                                        </div>
                                        <GText variant="caption-2" color="secondary">
                                            Срок: {formatOptionalDate(homework.dueAt)}
                                        </GText>
                                        {homework.linkedFiles.length > 0 && (
                                            <GText variant="caption-2" color="secondary">
                                                Материалы: {filesPreview}{hasMoreFiles ? ` и еще ${homework.linkedFiles.length - 2}` : ""}
                                            </GText>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    {!hwFormVisible && (
                        <button type="button" className="lp2-add-btn" onClick={() => setHwFormVisible(true)}>
                            <GIcon data={Plus as IconData} size={16} />
                            Добавить домашнее задание
                        </button>
                    )}

                    {hwFormVisible && (
                        <div className="lp2-hw-form">
                            <AppField label="Описание задания">
                                <TextArea value={hwTask} onUpdate={setHwTask}
                                    placeholder="Выучить параграф 5, решить задачи №12-18..." rows={3} size="xl" />
                            </AppField>
                            <AppField label="Срок сдачи">
                                <StyledDateInput value={hwDueDate} onUpdate={setHwDueDate}
                                    style={{
                                        height: 40,
                                        padding: 0,
                                        fontSize: 15,
                                        border: "none",
                                        borderRadius: 0,
                                        background: "transparent",
                                    }} />
                            </AppField>

                            {hwLinkedFiles.length > 0 && (
                                <div className="lp2-materials">
                                    <GText variant="caption-2" color="secondary" style={{ marginBottom: 8 }}>
                                        Прикрепленные материалы к домашнему заданию
                                    </GText>
                                    {hwLinkedFiles.map((file) => (
                                        <div key={file.provider ? makeSelectionKey(file.provider, file.id) : file.id}
                                            className="lp2-material-row">
                                            <GIcon data={((file.type || "file") === "folder" ? Folder : File) as IconData} size={16} />
                                            <GText variant="body-1" style={{ flex: 1, minWidth: 0 }} ellipsis>{file.name}</GText>
                                            <GButton view="flat" size="s" onClick={() =>
                                                setHwLinkedFiles((prev) =>
                                                    prev.filter((f) => !(f.id === file.id && f.provider === file.provider)),
                                                )
                                            }>
                                                <GIcon data={TrashBin as IconData} size={14} />
                                            </GButton>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {connectedProviders.length > 0 && (
                                <button
                                    type="button"
                                    className="hw-material-upload-btn"
                                    onClick={openHomeworkMaterialsPicker}
                                >
                                    <span className="hw-material-upload-btn__icon">
                                        <GIcon data={Plus as IconData} size={20} />
                                    </span>
                                    <span className="hw-material-upload-btn__content">
                                        <span className="hw-material-upload-btn__title">Загрузить материалы</span>
                                        <span className="hw-material-upload-btn__hint">{homeworkMaterialsHint}</span>
                                    </span>
                                </button>
                            )}

                            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
                                <GButton view="outlined" size="l" onClick={resetHomeworkForm}>Отмена</GButton>
                                <GButton view="action" size="l" disabled={!hwTask.trim()} loading={hwSaving}
                                    onClick={() => void handleHomeworkSubmit()}>
                                    {hwEditingId ? "Сохранить изменения" : "Сохранить"}
                                </GButton>
                            </div>
                        </div>
                    )}

                    {/* ──────── Материалы ──────── */}
                    <SectionTitle>Материалы к занятию</SectionTitle>

                    {materialItemsForSection.length > 0 ? (
                        <div className="lp2-materials">
                            <GText variant="caption-2" color="secondary" style={{ marginBottom: 8 }}>
                                {showingLessonMaterialsDraft ? "Выбрано для занятия" : "Сохранено в домашних заданиях"}
                            </GText>
                            {materialItemsForSection.map((file) => (
                                <div key={file.provider ? makeSelectionKey(file.provider, file.id) : file.id}
                                    className="lp2-material-row">
                                    <GIcon data={(file.type || "file") === "folder" ? (Folder as IconData) : (File as IconData)} size={16} />
                                    <GText variant="body-1" style={{ flex: 1, minWidth: 0 }} ellipsis>{file.name}</GText>
                                    {showingLessonMaterialsDraft && (
                                        <GButton view="flat" size="s" onClick={() =>
                                            {
                                                setMaterialsDirty(true);
                                                setLessonMaterials((prev) =>
                                                    prev.filter((f) => !(f.id === file.id && f.provider === file.provider)),
                                                );
                                            }
                                        }>
                                            <GIcon data={TrashBin as IconData} size={14} />
                                        </GButton>
                                    )}
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="lp2-empty">Материалы не прикреплены</div>
                    )}

                    <button type="button" className="lp2-add-btn" onClick={openMaterialsPicker}>
                        <GIcon data={Plus as IconData} size={16} />
                        Прикрепить материалы
                    </button>

                    {/* ──────── Оплата (список) ──────── */}
                    <SectionTitle>Оплата</SectionTitle>

                    {visiblePaymentItems.length > 0 ? (
                        <div className="lp2-payments">
                            {visiblePaymentItems.map((payment) => {
                                const paymentStatus = payment.status.toUpperCase();
                                const isPaid = paymentStatus === "PAID";
                                const isOverdue = paymentStatus === "OVERDUE";
                                return (
                                    <div key={payment.id} className="lp2-payment-row">
                                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
                                            <GText variant="body-1" style={{ fontWeight: 600 }}>
                                                {payment.amount.toLocaleString("ru-RU")} ₽
                                            </GText>
                                            <GLabel theme={isPaid ? "success" : isOverdue ? "danger" : "warning"} size="s">
                                                {isPaid ? "Оплачено" : isOverdue ? "Просрочено" : "Ожидает"}
                                            </GLabel>
                                        </div>
                                        <GText variant="caption-2" color="secondary">
                                            {(payment.method || "—").toUpperCase()} · {formatOptionalDate(payment.date)}
                                        </GText>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="lp2-empty">
                            {isExisting
                                ? status === "completed" ? "Оплата не зафиксирована" : "Оплата будет доступна после проведения"
                                : "Оплата пока не добавлена"}
                        </div>
                    )}

                    <button type="button" className="lp2-add-btn" onClick={() => setPaymentModalOpen(true)}>
                        <GIcon data={Plus as IconData} size={16} />
                        Добавить оплату
                    </button>

                    {/* ──────── Отзыв ──────── */}
                    {isExisting && lesson?.status === "completed" && (
                        <>
                            <SectionTitle>Отзыв ученика</SectionTitle>

                            {lesson?.hasReview ? (
                                <div className="lp2-review">
                                    <div style={{ color: "var(--g-color-text-brand)", fontSize: 20, lineHeight: 1 }}>
                                        {[1, 2, 3, 4, 5].map((star) => star <= (lesson.reviewRating || 0) ? "★" : "☆").join(" ")}
                                    </div>
                                    <GText variant="body-1" color="secondary">Оценка: {lesson.reviewRating || 0}/5</GText>
                                    {lesson.reviewFeedback && (
                                        <GText variant="body-1" style={{ whiteSpace: "pre-wrap", marginTop: 4 }}>{lesson.reviewFeedback}</GText>
                                    )}
                                </div>
                            ) : (
                                <div className="lp2-empty">
                                    Отзыв пока не оставлен
                                </div>
                            )}
                        </>
                    )}

                    {formError && (
                        <Alert theme="danger" view="filled" corners="rounded" message={formError} style={{ marginTop: 24 }} />
                    )}
                </div>
            </div>

            {/* ══ Bottom bar ══ */}
            <div className="lp2__bottombar">
                <GButton
                    view="action"
                    size="xl"
                    disabled={hwSaving || !!hwBusyId || materialsPickerOpen}
                    loading={saving}
                    onClick={handleSubmit}
                    width="max"
                    className="lp2__submit"
                >
                    {isExisting ? "Сохранить изменения" : "Создать занятие"}
                </GButton>
            </div>
        </div>
    );

    const nestedModals = (
        <>
            <AppDialog
                open={confirmDelete}
                onClose={() => setConfirmDelete(false)}
                size="s"
                caption="Подтвердите удаление"
                footer={{
                    onClickButtonApply: handleDeleteConfirm,
                    textButtonApply: "Да, удалить",
                    propsButtonApply: { view: "outlined-danger" },
                    onClickButtonCancel: () => setConfirmDelete(false),
                    textButtonCancel: "Нет",
                }}
            >
                <GText variant="body-2" color="secondary">
                    Занятие будет удалено без возможности восстановления.
                </GText>
            </AppDialog>

            <CreateStudentModal
                visible={createStudentModalVisible}
                onClose={() => setCreateStudentModalVisible(false)}
                onCreated={handleStudentCreated}
            />

            <AddSubjectModal
                open={addSubjectModalVisible}
                onClose={() => setAddSubjectModalVisible(false)}
                settingsData={settingsData}
                onSaved={handleSubjectCreated}
            />

            <MaterialsPickerDialog
                open={materialsPickerOpen}
                onClose={() => setMaterialsPickerOpen(false)}
                selectedFiles={lessonMaterials}
                availableFiles={availableHomeworkFiles}
                connectedProviders={connectedProviders}
                defaultProvider={defaultMaterialsProvider}
                onRefreshAvailableFiles={refetchFilesOverview}
                onApply={(files) => {
                    setLessonMaterials(files);
                    setMaterialsDirty(true);
                }}
            />

            <MaterialsPickerDialog
                open={homeworkMaterialsPickerOpen}
                onClose={() => setHomeworkMaterialsPickerOpen(false)}
                selectedFiles={hwLinkedFiles}
                availableFiles={availableHomeworkFiles}
                connectedProviders={connectedProviders}
                defaultProvider={defaultMaterialsProvider}
                onRefreshAvailableFiles={refetchFilesOverview}
                onApply={setHwLinkedFiles}
                caption="Материалы к домашнему заданию"
            />

            <CreatePaymentModal
                visible={paymentModalOpen}
                onClose={() => setPaymentModalOpen(false)}
                hideLesson={!isExisting}
                onCreated={async (createdPayment) => {
                    const normalizedPayment = normalizePaymentForPanel(createdPayment);
                    if (normalizedPayment) {
                        setSessionPaymentItems((prev) => [
                            normalizedPayment,
                            ...prev.filter((item) => item.id !== normalizedPayment.id),
                        ]);
                    }
                    if (paymentDefaultStudent?.id) {
                        const noteText = normalizedPayment
                            ? `Добавлена оплата ${normalizedPayment.amount.toLocaleString("ru-RU")} ₽`
                            : "Добавлена оплата";
                        void createNote(paymentDefaultStudent.id, noteText, lesson?.id).catch(() => undefined);
                    }
                    setPaymentModalOpen(false);
                    void refetchPayments().catch(() => undefined);
                    await onSaved?.();
                }}
                defaultStudent={paymentDefaultStudent}
            />
        </>
    );

    return (
        <>
            {createPortal(panelContent, document.body)}
            {nestedModals}
        </>
    );
};

export default LessonPanelV2;
