import { useEffect, useState, useCallback, useRef, useMemo } from "react";
import { createPortal } from "react-dom";
import {
    Text,
    Button,
    Label,
    Icon,
    Select,
    SegmentedRadioGroup,
    TextInput,
    TextArea,
    Checkbox,
    Alert,
} from "@gravity-ui/uikit";
import {
    Xmark,
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
    useStudentHomework,
    createHomework,
    updateHomework,
    deleteHomework,
    createNote,
} from "@/hooks/useStudents";
import { useApi } from "@/hooks/useApi";
import type { CloudProvider, FilesOverviewResponse } from "@/types/files";
import type { Lesson, LessonStatus } from "@/types/schedule";
import type { Student } from "@/types/student";
import type { HomeworkFile } from "@/mocks/student-details";
import StudentAvatar from "@/components/StudentAvatar";
import StyledDateInput from "@/components/StyledDateInput";
import CreateStudentModal from "@/components/CreateStudentModal";
import AddSubjectModal from "@/components/AddSubjectModal";
import CreatePaymentModal from "@/components/CreatePaymentModal";
import AppDialog from "@/components/AppDialog";
import MaterialsPickerDialog from "@/components/MaterialsPickerDialog";
import { codedErrorMessage } from "@/lib/errorCodes";
import { useRouter } from "next/router";
import { useAuth } from "@/contexts/AuthContext";

const GText = Text as any;
const GButton = Button as any;
const GLabel = Label as any;
const GIcon = Icon as any;
const GSelect = Select as any;
const GSegmentedRadioGroup = SegmentedRadioGroup as any;

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
// Gravity UI Select popup uses inline z-index: 1000 on the floating layer.
// Keep panel below it so dropdowns remain interactive.
const PANEL_Z = 950;

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

const providerLabel = (provider: CloudProvider) =>
    provider === "google-drive" ? "Google Drive" : "Яндекс Диск";

const sortByTypeAndName = (a: HomeworkFile, b: HomeworkFile) => {
    const aType = a.type || "file";
    const bType = b.type || "file";

    if (aType !== bType) {
        return aType === "folder" ? -1 : 1;
    }

    return a.name.localeCompare(b.name, "ru");
};

const ROOT_FOLDER_ID = "ROOT";

const makeSelectionKey = (provider: CloudProvider, itemId: string) =>
    `${provider}:${itemId}`;

const normalizeSubjectName = (value: unknown) => {
    if (typeof value !== "string") {
        return "";
    }
    return value.trim();
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

const errorWrapStyle = (invalid: boolean) =>
    invalid
        ? { border: "1px solid var(--g-color-line-danger)", borderRadius: 8, padding: 2 }
        : undefined;

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

const formatOptionalDate = (value?: string) => {
    if (!value) return "—";

    if (/^\d{2}\.\d{2}\.\d{4}$/.test(value)) {
        return value;
    }

    if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
        const [year, month, day] = value.split("-");
        return `${day}.${month}.${year}`;
    }

    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) {
        return value;
    }

    return parsed.toLocaleDateString("ru-RU", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
    });
};

const toDateInputValue = (value?: string) => {
    if (!value) return "";

    if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
        return value;
    }

    if (/^\d{2}\.\d{2}\.\d{4}$/.test(value)) {
        const [day, month, year] = value.split(".");
        return `${year}-${month}-${day}`;
    }

    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) {
        return "";
    }

    const year = parsed.getFullYear();
    const month = String(parsed.getMonth() + 1).padStart(2, "0");
    const day = String(parsed.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
};

const mapHomeworkLinkedFiles = (files: any[]): HomeworkFile[] => {
    return files
        .map((file) => {
            if (!file || typeof file !== "object") {
                return null;
            }

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
    if (!raw || typeof raw !== "object") {
        return null;
    }

    const id = String(raw.id || "").trim();
    if (!id) {
        return null;
    }

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
    if (!raw || typeof raw !== "object") {
        return null;
    }

    const id = String(raw.id || "").trim();
    if (!id) {
        return null;
    }

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

type LessonPanelProps = {
    open: boolean;
    onClose: () => void;
    lesson?: Lesson | null;
    onSaved?: () => void | Promise<void>;
    onDeleted?: (lessonId: string) => void;
    defaultStudent?: { id: string; name: string } | null;
    defaultDate?: string;
    defaultTime?: string;
};

/* ═══════════════════════════════════════════════════════════
   Sub-components
   ═══════════════════════════════════════════════════════════ */

const FieldRow = ({
    label,
    required,
    children,
}: {
    label: string;
    required?: boolean;
    children: React.ReactNode;
}) => (
    <div className="repeto-lp__field">
        <GText as="div" variant="body-1" className="repeto-lp__field-label">
            {label}{required ? " *" : ""}
        </GText>
        {children}
    </div>
);

const SectionBlock = ({
    title,
    children,
    action,
}: {
    title: string;
    children: React.ReactNode;
    action?: React.ReactNode;
}) => (
    <div className="repeto-lp__section">
        <div className="repeto-lp__section-header">
            <GText variant="subheader-1" as="div">{title}</GText>
            {action}
        </div>
        {children}
    </div>
);

/* ═══════════════════════════════════════════════════════════
   Student option renderer (avatar + name)
   ═══════════════════════════════════════════════════════════ */

const renderStudentOption = (
    option: { value: string; content?: string; data?: { avatarUrl?: string; color?: string } },
) => {
    const optionLabel =
        typeof option.content === "string" && option.content.trim().length
            ? option.content
            : "Ученик";

    if (option.value === ADD_STUDENT_OPTION_VALUE) {
        return (
            <div className="repeto-lp__student-option repeto-lp__student-option--add">
                <div className="repeto-lp__student-option-icon">+</div>
                <GText variant="body-1">Добавить ученика</GText>
            </div>
        );
    }
    return (
        <div className="repeto-lp__student-option">
            <div
                className="repeto-lp__student-option-avatar"
                style={{ background: option.data?.color || "var(--g-color-base-brand)" }}
            >
                {optionLabel.charAt(0).toUpperCase()}
            </div>
            <GText variant="body-1">{optionLabel}</GText>
        </div>
    );
};

/* ═══════════════════════════════════════════════════════════
   Main component
   ═══════════════════════════════════════════════════════════ */

const LessonPanel = ({
    open,
    onClose,
    lesson,
    onSaved,
    onDeleted,
    defaultStudent,
    defaultDate,
    defaultTime,
}: LessonPanelProps) => {
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
    const [draftSelectedKeys, setDraftSelectedKeys] = useState<string[]>([]);
    const [openAccordions, setOpenAccordions] = useState<CloudProvider[]>([]);
    const [providerSearch, setProviderSearch] = useState<
        Partial<Record<CloudProvider, string>>
    >({});
    const [currentFolderByProvider, setCurrentFolderByProvider] = useState<
        Partial<Record<CloudProvider, string | null>>
    >({});
    const [hwSaving, setHwSaving] = useState(false);
    const [hwBusyId, setHwBusyId] = useState<string | null>(null);
    const [sessionHomeworkItems, setSessionHomeworkItems] = useState<LessonPanelHomeworkItem[]>([]);
    const [removedHomeworkIds, setRemovedHomeworkIds] = useState<string[]>([]);

    const subjectItems = useMemo(() => {
        const names = new Set<string>();

        const remember = (value: unknown) => {
            const normalized = normalizeSubjectName(value);
            if (normalized) {
                names.add(normalized);
            }
        };

        const subjectDetails = Array.isArray(settingsData?.subjectDetails)
            ? settingsData.subjectDetails
            : [];

        subjectDetails.forEach((item: any) => {
            remember(item?.name);
        });

        const settingsSubjects = Array.isArray(settingsData?.subjects)
            ? settingsData.subjects
            : [];
        settingsSubjects.forEach((item: unknown) => remember(item));

        const authSubjects = Array.isArray(user?.subjects) ? (user?.subjects ?? []) : [];
        authSubjects.forEach((item: unknown) => remember(item));

        remember(lesson?.subject);
        remember(subject[0]);

        const options = Array.from(names).map((name) => ({
            value: name,
            content: name,
        }));

        return [
            ...options,
            { value: ADD_SUBJECT_OPTION_VALUE, content: "Добавить предмет" },
        ];
    }, [
        lesson?.subject,
        settingsData?.subjectDetails,
        settingsData?.subjects,
        subject,
        user?.subjects,
    ]);

    const { data: filesOverview } = useApi<FilesOverviewResponse>(
        open && (hwFormVisible || materialsPickerOpen) ? "/files" : null,
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

        if (connectedProviders.includes(preferred)) {
            return preferred;
        }

        return connectedProviders[0];
    }, [settingsData?.homeworkDefaultCloud, connectedProviders]);

    const normalizedAvailableFiles = useMemo(() => {
        const deduped = new Map<string, HomeworkFile>();

        availableHomeworkFiles.forEach((item) => {
            if (!item.provider) {
                return;
            }

            deduped.set(makeSelectionKey(item.provider, item.id), item);
        });

        return Array.from(deduped.values());
    }, [availableHomeworkFiles]);

    const pickerProviders = useMemo<CloudProvider[]>(() => {
        if (connectedProviders.length > 0) {
            return Array.from(new Set(connectedProviders));
        }

        const inferred = normalizedAvailableFiles
            .map((item) => item.provider)
            .filter((provider): provider is CloudProvider => !!provider);

        return Array.from(new Set(inferred));
    }, [connectedProviders, normalizedAvailableFiles]);

    const itemsByProvider = useMemo(() => {
        const map = new Map<CloudProvider, HomeworkFile[]>();

        pickerProviders.forEach((provider) => {
            map.set(provider, []);
        });

        normalizedAvailableFiles.forEach((item) => {
            const provider = item.provider;
            if (!provider) {
                return;
            }

            const bucket = map.get(provider) || [];
            bucket.push(item);
            map.set(provider, bucket);
        });

        map.forEach((items, provider) => {
            map.set(provider, [...items].sort(sortByTypeAndName));
        });

        return map;
    }, [normalizedAvailableFiles, pickerProviders]);

    const providerMetaByProvider = useMemo(() => {
        const map = new Map<
            CloudProvider,
            {
                childrenByParent: Map<string, HomeworkFile[]>;
                itemById: Map<string, HomeworkFile>;
            }
        >();

        itemsByProvider.forEach((items, provider) => {
            const childrenByParent = new Map<string, HomeworkFile[]>();
            const itemById = new Map<string, HomeworkFile>();

            for (const item of items) {
                const parentId = item.parentId || ROOT_FOLDER_ID;
                const bucket = childrenByParent.get(parentId) || [];
                bucket.push(item);
                childrenByParent.set(parentId, bucket);
                itemById.set(item.id, item);
            }

            childrenByParent.forEach((children, parentId) => {
                childrenByParent.set(parentId, [...children].sort(sortByTypeAndName));
            });

            map.set(provider, {
                childrenByParent,
                itemById,
            });
        });

        return map;
    }, [itemsByProvider]);

    const fileBySelectionKey = useMemo(() => {
        const map = new Map<string, HomeworkFile>();

        normalizedAvailableFiles.forEach((item) => {
            if (!item.provider) {
                return;
            }

            map.set(makeSelectionKey(item.provider, item.id), item);
        });

        return map;
    }, [normalizedAvailableFiles]);

    const selectedDraftKeySet = useMemo(
        () => new Set(draftSelectedKeys),
        [draftSelectedKeys],
    );

    const selectedAvailableItems = useMemo(() => {
        return draftSelectedKeys
            .map((key) => fileBySelectionKey.get(key))
            .filter((item): item is HomeworkFile => !!item);
    }, [draftSelectedKeys, fileBySelectionKey]);

    const sectionStudentId = open ? (lesson?.studentId || studentId[0]) : undefined;
    const { data: studentHomeworkData, refetch: refetchStudentHomework } = useStudentHomework(
        sectionStudentId,
    );

    const persistedLessonHomeworkItems = useMemo(() => {
        if (!lesson?.id) {
            return [] as LessonPanelHomeworkItem[];
        }

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

    const removedHomeworkIdSet = useMemo(
        () => new Set(removedHomeworkIds),
        [removedHomeworkIds],
    );

    const visibleHomeworkItems = useMemo(() => {
        if (!isExisting || !lesson?.id) {
            return sessionHomeworkItems.filter((item) => !removedHomeworkIdSet.has(item.id));
        }

        const map = new Map<string, LessonPanelHomeworkItem>();
        persistedLessonHomeworkItems.forEach((item) => {
            map.set(item.id, item);
        });

        sessionHomeworkItems.forEach((item) => {
            if (item.lessonId === lesson.id || !item.lessonId) {
                map.set(item.id, item);
            }
        });

        return Array.from(map.values()).filter((item) => !removedHomeworkIdSet.has(item.id));
    }, [
        isExisting,
        lesson?.id,
        persistedLessonHomeworkItems,
        sessionHomeworkItems,
        removedHomeworkIdSet,
    ]);

    const savedMaterialsFromHomework = useMemo(() => {
        const map = new Map<string, HomeworkFile>();

        visibleHomeworkItems.forEach((homework) => {
            homework.linkedFiles.forEach((file) => {
                const key = file.provider
                    ? makeSelectionKey(file.provider, file.id)
                    : `manual:${file.id}`;
                map.set(key, file);
            });
        });

        return Array.from(map.values());
    }, [visibleHomeworkItems]);

    const visiblePaymentItems = useMemo(() => {
        if (!isExisting || !lesson?.id) {
            return sessionPaymentItems;
        }

        const map = new Map<string, LessonPanelPaymentItem>();

        persistedLessonPaymentItems.forEach((item) => {
            map.set(item.id, item);
        });

        sessionPaymentItems.forEach((item) => {
            if (item.lessonId === lesson.id || !item.lessonId) {
                map.set(item.id, item);
            }
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

            return () => {
                cancelAnimationFrame(raf1);
                cancelAnimationFrame(raf2);
            };
        }

        setIsPanelVisible(false);
        return;
    }, [open]);

    useEffect(() => {
        if (!shouldRender) {
            setIsPanelVisible(false);
        }
    }, [shouldRender]);

    const handleTransitionEnd = () => {
        if (!open && !isPanelVisible) {
            setShouldRender(false);
        }
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
        setDraftSelectedKeys([]);
        setOpenAccordions([]);
        setProviderSearch({});
        setCurrentFolderByProvider({});
        setSessionHomeworkItems([]);
        setHwEditingId(null);
        setHwBusyId(null);
        setRemovedHomeworkIds([]);
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
        if (open) {
            document.body.style.overflow = "hidden";
            return () => { document.body.style.overflow = ""; };
        }
    }, [open]);

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
        if (isExisting || !studentId.length) return;
        const s = students.find((st) => st.id === studentId[0]);
        if (s) {
            if (!subject.length) {
                const matchedSubject = normalizeSubjectName(s.subject);
                if (matchedSubject) setSubject([matchedSubject]);
            }
            if (!cost) setCost(String(s.rate || ""));
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [studentId]);

    /* ════════════════════════════════════════════════════════
       Handlers
       ════════════════════════════════════════════════════════ */

    const handleClose = () => onClose();

    const handleAddSubject = () => {
        setAddSubjectModalVisible(true);
    };

    const handleSubjectCreated = async (subjectName: string) => {
        setSubject([subjectName]);
        markTouched("subject");
        await Promise.allSettled([refetchSettings(), refreshUser()]);
    };

    const handleOverlayClick = (e: React.MouseEvent) => {
        if (e.target === e.currentTarget) handleClose();
    };

    const handleSubmit = async () => {
        const hasStudent = studentId.length > 0;
        const hasSubject = subject.length > 0;
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
                ? {
                    enabled: true,
                    until: buildRecurrenceUntil(date),
                    weekdays: [getIsoWeekday(date)],
                }
                : undefined;

            if (isExisting && lesson) {
                await updateLesson(lesson.id, {
                    subject: subject[0],
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
            } else {
                const created = await createLesson({
                    studentId: studentId[0],
                    subject: subject[0],
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
                                updateHomework(studentId[0], homeworkId, {
                                    lessonId: primaryCreatedLessonId,
                                }),
                            ),
                        );

                        setSessionHomeworkItems((prev) =>
                            prev.map((item) =>
                                unlinkedSet.has(item.id)
                                    ? { ...item, lessonId: primaryCreatedLessonId }
                                    : item,
                            ),
                        );
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
                if (matchedSubject) {
                    setSubject([matchedSubject]);
                }
            }
            if (!cost && typeof createdStudent.rate === "number" && createdStudent.rate > 0) {
                setCost(String(createdStudent.rate));
            }
        }
    };

    const openMaterialsPicker = () => {
        setDraftSelectedKeys(
            hwLinkedFiles
                .map((file) => {
                    if (file.provider) {
                        const directKey = makeSelectionKey(file.provider, file.id);
                        if (fileBySelectionKey.has(directKey)) {
                            return directKey;
                        }
                    }

                    const fallback = normalizedAvailableFiles.find(
                        (available) => available.id === file.id,
                    );

                    if (fallback?.provider) {
                        return makeSelectionKey(fallback.provider, fallback.id);
                    }

                    return null;
                })
                .filter((key): key is string => !!key),
        );
        setOpenAccordions([]);
        setProviderSearch({});
        setCurrentFolderByProvider({});
        setMaterialsPickerOpen(true);
    };

    const toggleAccordion = (provider: CloudProvider) => {
        setOpenAccordions((prev) =>
            prev.includes(provider)
                ? prev.filter((value) => value !== provider)
                : [...prev, provider],
        );
    };

    const toggleDraftItem = (
        provider: CloudProvider,
        item: HomeworkFile,
        checked: boolean,
    ) => {
        setDraftSelectedKeys((prev) => {
            const next = new Set(prev);
            const key = makeSelectionKey(provider, item.id);

            if (checked) {
                next.add(key);
            } else {
                next.delete(key);
            }

            return Array.from(next);
        });
    };

    const setProviderSearchValue = (provider: CloudProvider, value: string) => {
        setProviderSearch((prev) => ({
            ...prev,
            [provider]: value,
        }));
    };

    const getProviderVisibleItems = (provider: CloudProvider) => {
        const providerItems = itemsByProvider.get(provider) || [];
        const query = (providerSearch[provider] || "").trim().toLowerCase();

        if (query) {
            return providerItems.filter((item) =>
                item.name.toLowerCase().includes(query),
            );
        }

        const currentFolderId = currentFolderByProvider[provider] || null;
        const parentKey = currentFolderId || ROOT_FOLDER_ID;
        const children =
            providerMetaByProvider.get(provider)?.childrenByParent.get(parentKey) || [];

        return children;
    };

    const selectAllInProvider = (provider: CloudProvider) => {
        const visibleItems = getProviderVisibleItems(provider);
        setDraftSelectedKeys((prev) => {
            const next = new Set(prev);
            visibleItems.forEach((item) =>
                next.add(makeSelectionKey(provider, item.id)),
            );
            return Array.from(next);
        });
    };

    const clearAllInProvider = (provider: CloudProvider) => {
        const visibleKeys = new Set(
            getProviderVisibleItems(provider).map((item) =>
                makeSelectionKey(provider, item.id),
            ),
        );

        setDraftSelectedKeys((prev) =>
            prev.filter((key) => !visibleKeys.has(key)),
        );
    };

    const clearAllSelection = () => {
        setDraftSelectedKeys([]);
    };

    const openFolder = (provider: CloudProvider, folderId: string) => {
        setCurrentFolderByProvider((prev) => ({
            ...prev,
            [provider]: folderId,
        }));
    };

    const buildProviderBreadcrumbs = (provider: CloudProvider) => {
        const currentFolderId = currentFolderByProvider[provider] || null;
        if (!currentFolderId) {
            return [] as Array<{ id: string; name: string }>;
        }

        const itemById = providerMetaByProvider.get(provider)?.itemById;
        if (!itemById) {
            return [] as Array<{ id: string; name: string }>;
        }

        const crumbs: Array<{ id: string; name: string }> = [];
        const visited = new Set<string>();
        let cursorId: string | null = currentFolderId;

        while (cursorId) {
            if (visited.has(cursorId)) {
                break;
            }

            visited.add(cursorId);
            const item = itemById.get(cursorId);
            if (!item) {
                break;
            }

            crumbs.unshift({ id: item.id, name: item.name });
            cursorId = item.parentId || null;
        }

        return crumbs;
    };

    const applyMaterialsSelection = () => {
        const selectedItems = draftSelectedKeys
            .map((key) => fileBySelectionKey.get(key))
            .filter((item): item is HomeworkFile => !!item);

        const manualFiles = hwLinkedFiles.filter(
            (file) =>
                !normalizedAvailableFiles.some(
                    (available) =>
                        available.id === file.id &&
                        available.provider === file.provider,
                ),
        );

        setHwLinkedFiles([...manualFiles, ...selectedItems]);
        setMaterialsPickerOpen(false);
    };

    const handleRemoveLinkedMaterial = (fileToRemove: HomeworkFile) => {
        setHwLinkedFiles((prev) =>
            prev.filter(
                (file) =>
                    !(
                        file.id === fileToRemove.id &&
                        file.provider === fileToRemove.provider
                    ),
            ),
        );
    };

    const resetHomeworkForm = () => {
        setHwFormVisible(false);
        setHwEditingId(null);
        setHwTask("");
        setHwDueDate("");
        setHwLinkedFiles([]);
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
            setActionError("Сначала выберите ученика в заголовке.");
            return;
        }

        setHwBusyId(homework.id);
        setActionError(null);

        try {
            const isLocalOnly = homework.id.startsWith("tmp-");
            if (!isLocalOnly) {
                await deleteHomework(targetStudentId, homework.id);
            }

            setSessionHomeworkItems((prev) =>
                prev.filter((item) => item.id !== homework.id),
            );
            setRemovedHomeworkIds((prev) =>
                prev.includes(homework.id) ? prev : [...prev, homework.id],
            );

            if (hwEditingId === homework.id) {
                resetHomeworkForm();
            }

            void refetchStudentHomework().catch(() => undefined);
            void createNote(targetStudentId, "Домашнее задание удалено", lesson?.id).catch(
                () => undefined,
            );
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
            setActionError("Сначала выберите ученика в заголовке.");
            return;
        }

        setHwSaving(true);
        setActionError(null);

        try {
            const taskText = hwTask.trim();
            const linkedFileIds = hwLinkedFiles.map((file) => file.id);

            if (hwEditingId) {
                const editingItem = visibleHomeworkItems.find(
                    (item) => item.id === hwEditingId,
                );

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

                    normalizedHomework =
                        normalizeHomeworkForPanel(updatedHomework) || {
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
                setRemovedHomeworkIds((prev) =>
                    prev.filter((id) => id !== normalizedHomework.id),
                );

                void refetchStudentHomework().catch(() => undefined);
                void createNote(targetStudentId, "Домашнее задание обновлено", lesson?.id).catch(
                    () => undefined,
                );

                resetHomeworkForm();
                return;
            }

            const createdHomework = await createHomework(targetStudentId, {
                task: taskText,
                dueAt: hwDueDate || undefined,
                lessonId: lesson?.id || undefined,
                fileIds: linkedFileIds,
            });

            const normalizedHomework =
                normalizeHomeworkForPanel(createdHomework) || {
                    id: `tmp-${Date.now()}`,
                    task: taskText,
                    dueAt: hwDueDate || undefined,
                    lessonId: lesson?.id || null,
                    linkedFiles: [...hwLinkedFiles],
                };

            setSessionHomeworkItems((prev) => [
                normalizedHomework,
                ...prev.filter((item) => item.id !== normalizedHomework.id),
            ]);

            void refetchStudentHomework().catch(() => undefined);

            void createNote(
                targetStudentId,
                `Домашнее задание: ${
                    taskText.length > 80 ? `${taskText.slice(0, 77)}...` : taskText
                }`,
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

    const currentStudent = studentId.length
        ? students.find((s) => s.id === studentId[0])
        : null;

    const paymentDefaultStudent = lesson?.studentId
        ? { id: lesson.studentId, name: lesson.studentName }
        : currentStudent
            ? { id: currentStudent.id, name: currentStudent.name }
            : null;

    const studentOptions = [
        ...students.map((s) => ({
            value: s.id,
            content: s.name || "Ученик",
            data: { avatarUrl: (s as any).avatarUrl, color: (s as any).color },
        })),
        { value: ADD_STUDENT_OPTION_VALUE, content: "Добавить ученика", data: {} },
    ];

    const studentError = touched.student && !studentId.length;
    const subjectError = touched.subject && !subject.length;
    const dateError = touched.date && !date;
    const timeError = touched.time && !time;
    const showingDraftMaterials = hwLinkedFiles.length > 0;
    const materialItemsForSection = showingDraftMaterials
        ? hwLinkedFiles
        : savedMaterialsFromHomework;

    /* ════════════════════════════════════════════════════════
       Render
       ════════════════════════════════════════════════════════ */

    if (!mounted) return null;
    if (!shouldRender && !open) return null;

    const panelContent = (
        <>
            {/* Overlay */}
            <div
                className={`repeto-lp-overlay ${isPanelVisible ? "repeto-lp-overlay--open" : ""}`}
                style={{ zIndex: PANEL_Z - 1 }}
                onClick={handleOverlayClick}
                aria-hidden="true"
            />

            {/* Panel */}
            <div
                ref={panelRef}
                className={`repeto-lp ${isPanelVisible ? "repeto-lp--open" : ""}`}
                style={{ zIndex: PANEL_Z }}
                onTransitionEnd={handleTransitionEnd}
                role="dialog"
                aria-modal="true"
                aria-label={lesson ? `Занятие: ${lesson.subject}` : "Новое занятие"}
            >
                {/* ── Header: always shows student selector ── */}
                <div className="repeto-lp__header">
                    <div className="repeto-lp__header-top">
                        <div className="repeto-lp__header-student-select" style={errorWrapStyle(studentError)}>
                            <GSelect
                                className="repeto-lp__header-select-control"
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
                                        <div className="repeto-lp__student-selected">
                                            {selectedStudent ? (
                                                <StudentAvatar student={selectedStudent} size="xs" />
                                            ) : (
                                                <div
                                                    className="repeto-lp__student-option-avatar repeto-lp__student-option-avatar--xs"
                                                    style={{ background: option.data?.color || "var(--g-color-base-brand)" }}
                                                >
                                                    {selectedLabel.charAt(0).toUpperCase()}
                                                </div>
                                            )}
                                            <GText variant="subheader-2">{selectedLabel}</GText>
                                        </div>
                                    );
                                }}
                                placeholder="Выберите ученика"
                                size="xl"
                                width="max"
                                filterable
                                popupClassName="repeto-lp-popup"
                            />
                        </div>

                        <div className="repeto-lp__header-actions">
                            <div className="repeto-lp__status-select">
                                <Select
                                    className="repeto-lp__header-select-control"
                                    options={statusItems}
                                    value={[status]}
                                    onUpdate={(value: string[]) => {
                                        if (!value.length) return;
                                        setStatus(value[0] as EditableLessonStatus);
                                        setStatusTouchedManually(true);
                                    }}
                                    size="xl"
                                    width="max"
                                    popupClassName="repeto-lp-popup"
                                />
                            </div>

                            {/* Delete */}
                            {isExisting && onDeleted && (
                                <GButton
                                    view="flat"
                                    size="s"
                                    onClick={() => setConfirmDelete(true)}
                                    title="Удалить занятие"
                                >
                                    <GIcon data={TrashBin as IconData} size={14} />
                                </GButton>
                            )}

                            {/* Close */}
                            <GButton
                                view="flat"
                                size="m"
                                onClick={handleClose}
                                className="repeto-lp__close"
                            >
                                <GIcon data={Xmark as IconData} size={16} />
                            </GButton>
                        </div>
                    </div>

                    {studentError && (
                        <div style={{ padding: "0 24px 8px" }}>
                            <GText as="div" variant="caption-2" style={{ color: "var(--g-color-text-danger)" }}>
                                Выберите ученика
                            </GText>
                        </div>
                    )}
                </div>

                {/* ── Scrollable body ── */}
                <div className="repeto-lp__body">
                    {actionError && (
                        <Alert
                            theme="danger"
                            view="filled"
                            corners="rounded"
                            message={actionError}
                            onClose={() => setActionError(null)}
                            style={{ marginBottom: 16 }}
                        />
                    )}

                    {/* ─── Core form ─── */}
                    <div className="repeto-lp__form">
                        <SectionBlock title="О занятии">
                            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                                <FieldRow label="Предмет" required>
                                    <div style={errorWrapStyle(subjectError)} onClick={() => markTouched("subject")}>
                                        <Select
                                            options={subjectItems}
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
                                            size="l"
                                            width="max"
                                            filterable
                                            popupClassName="repeto-lp-popup"
                                        />
                                    </div>
                                    {subjectError && (
                                        <GText
                                            as="div"
                                            variant="caption-2"
                                            style={{ marginTop: 4, color: "var(--g-color-text-danger)" }}
                                        >
                                            Обязательное поле
                                        </GText>
                                    )}
                                </FieldRow>

                                <FieldRow label="Место / ссылка">
                                    <TextInput
                                        value={location}
                                        onUpdate={setLocation}
                                        placeholder="Zoom / адрес"
                                        size="l"
                                    />
                                </FieldRow>
                            </div>
                        </SectionBlock>

                        <SectionBlock title="Когда планируете занятие?">
                            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                                <div className="repeto-lp__field-row">
                                    <FieldRow label="Дата" required>
                                        <div style={errorWrapStyle(dateError)} onClick={() => markTouched("date")}>
                                            <StyledDateInput
                                                value={date}
                                                onUpdate={(value: string) => {
                                                    setDate(value);
                                                    markTouched("date");
                                                    if (!isExisting && !statusTouchedManually) {
                                                        setStatus(inferDefaultStatus(value));
                                                    }
                                                }}
                                                style={{ height: 36, padding: "0 10px" }}
                                            />
                                        </div>
                                        {dateError && (
                                            <GText
                                                as="div"
                                                variant="caption-2"
                                                style={{ marginTop: 4, color: "var(--g-color-text-danger)" }}
                                            >
                                                Обязательное поле
                                            </GText>
                                        )}
                                    </FieldRow>

                                    <FieldRow label="Время начала" required>
                                        <div style={errorWrapStyle(timeError)} onClick={() => markTouched("time")}>
                                            <Select
                                                options={timeItems}
                                                value={time ? [time] : []}
                                                onUpdate={(value: string[]) => {
                                                    setTime(value[0] || "");
                                                    markTouched("time");
                                                }}
                                                placeholder="Выберите время"
                                                size="l"
                                                width="max"
                                                popupClassName="repeto-lp-popup repeto-lp-popup--compact"
                                            />
                                        </div>
                                        {timeError && (
                                            <GText
                                                as="div"
                                                variant="caption-2"
                                                style={{ marginTop: 4, color: "var(--g-color-text-danger)" }}
                                            >
                                                Обязательное поле
                                            </GText>
                                        )}
                                    </FieldRow>
                                </div>

                                <div className="repeto-lp__field-row">
                                    <FieldRow label="Длительность">
                                        <Select
                                            options={durationItems}
                                            value={duration}
                                            onUpdate={setDuration}
                                            size="l"
                                            width="max"
                                            popupClassName="repeto-lp-popup repeto-lp-popup--compact"
                                        />
                                    </FieldRow>

                                    <FieldRow label="Формат">
                                        <div className="repeto-lp__format-toggle">
                                            <GSegmentedRadioGroup
                                                size="m"
                                                value={format[0] || "online"}
                                                onUpdate={(value: string) => setFormat([value])}
                                                options={formatItems}
                                            />
                                        </div>
                                    </FieldRow>
                                </div>
                            </div>
                        </SectionBlock>

                        <SectionBlock title="Оплата и заметки">
                            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                                <FieldRow label="Стоимость (₽)">
                                    <TextInput
                                        value={cost}
                                        onUpdate={setCost}
                                        placeholder="2100"
                                        size="l"
                                    />
                                </FieldRow>

                                {!isExisting && (
                                    <>
                                        <Checkbox checked={repeat} onUpdate={setRepeat} size="l">
                                            Повторять еженедельно
                                        </Checkbox>
                                        {repeat && (
                                            <GText
                                                as="div"
                                                variant="caption-2"
                                                color="secondary"
                                                style={{ marginTop: -8 }}
                                            >
                                                Повтор создаётся на 12 месяцев вперёд в тот же день и время.
                                            </GText>
                                        )}
                                    </>
                                )}

                                <FieldRow label="Заметки">
                                    <TextArea
                                        value={note}
                                        onUpdate={setNote}
                                        placeholder="Подготовить новый материал..."
                                        rows={3}
                                        size="l"
                                    />
                                </FieldRow>
                            </div>
                        </SectionBlock>
                    </div>

                    {formError && (
                        <Alert
                            theme="danger"
                            view="filled"
                            corners="rounded"
                            message={formError}
                            style={{ marginTop: 12 }}
                        />
                    )}

                    {/* ── Extra sections (always visible in one panel flow) ── */}
                    <div className="repeto-lp__extras">
                        {/* Homework */}
                        <SectionBlock
                            title="Домашнее задание"
                            action={
                                !hwFormVisible && (
                                    <GButton view="flat" size="s" onClick={() => setHwFormVisible(true)}>
                                        <GIcon data={Plus as IconData} size={14} />
                                        Добавить
                                    </GButton>
                                )
                            }
                        >
                            {!hwFormVisible && visibleHomeworkItems.length === 0 && (
                                <div className="repeto-lp__empty-state">
                                    <GText variant="body-2" color="secondary">
                                        {isExisting
                                            ? "Домашнее задание не назначено"
                                            : "Добавьте домашнее задание сразу при создании занятия"}
                                    </GText>
                                </div>
                            )}

                            {visibleHomeworkItems.length > 0 && (
                                <div
                                    style={{
                                        display: "flex",
                                        flexDirection: "column",
                                        gap: 8,
                                        marginBottom: hwFormVisible ? 12 : 0,
                                    }}
                                >
                                    {visibleHomeworkItems.map((homework) => {
                                        const filesPreview = homework.linkedFiles
                                            .slice(0, 2)
                                            .map((file) => file.name)
                                            .join(", ");
                                        const hasMoreFiles = homework.linkedFiles.length > 2;

                                        return (
                                            <div
                                                key={homework.id}
                                                style={{
                                                    display: "flex",
                                                    flexDirection: "column",
                                                    gap: 4,
                                                    border: "1px solid var(--g-color-line-generic)",
                                                    borderRadius: 8,
                                                    padding: "8px 10px",
                                                }}
                                            >
                                                <div
                                                    style={{
                                                        display: "flex",
                                                        alignItems: "center",
                                                        gap: 8,
                                                    }}
                                                >
                                                    <GText
                                                        variant="body-2"
                                                        style={{ fontWeight: 600, flex: 1, minWidth: 0 }}
                                                        ellipsis
                                                    >
                                                        {homework.task}
                                                    </GText>
                                                    <GButton
                                                        view="flat"
                                                        size="s"
                                                        disabled={!!hwBusyId && hwBusyId !== homework.id}
                                                        onClick={() => handleEditHomework(homework)}
                                                    >
                                                        Редактировать
                                                    </GButton>
                                                    <GButton
                                                        view="flat"
                                                        size="s"
                                                        loading={hwBusyId === homework.id}
                                                        disabled={!!hwBusyId && hwBusyId !== homework.id}
                                                        onClick={() => void handleDeleteHomework(homework)}
                                                    >
                                                        Удалить
                                                    </GButton>
                                                </div>
                                                <GText variant="caption-2" color="secondary">
                                                    Срок: {formatOptionalDate(homework.dueAt)}
                                                </GText>
                                                {homework.linkedFiles.length > 0 && (
                                                    <GText variant="caption-2" color="secondary">
                                                        Материалы: {filesPreview}
                                                        {hasMoreFiles
                                                            ? ` и еще ${homework.linkedFiles.length - 2}`
                                                            : ""}
                                                    </GText>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            )}

                            {hwFormVisible && (
                                <div className="repeto-lp__hw-form">
                                    <FieldRow label="Описание задания">
                                        <TextArea
                                            value={hwTask}
                                            onUpdate={setHwTask}
                                            placeholder="Выучить параграф 5, решить задачи №12-18..."
                                            rows={3}
                                            size="l"
                                        />
                                    </FieldRow>
                                    <FieldRow label="Срок сдачи">
                                        <StyledDateInput
                                            value={hwDueDate}
                                            onUpdate={setHwDueDate}
                                            style={{ height: 36, padding: "0 10px" }}
                                        />
                                    </FieldRow>
                                    <div className="repeto-lp__hw-form-actions">
                                        <GButton
                                            view="outlined"
                                            size="m"
                                            onClick={resetHomeworkForm}
                                        >
                                            Отмена
                                        </GButton>
                                        <GButton
                                            view="action"
                                            size="m"
                                            disabled={!hwTask.trim()}
                                            loading={hwSaving}
                                            onClick={() => void handleHomeworkSubmit()}
                                        >
                                            {hwEditingId ? "Сохранить изменения" : "Сохранить"}
                                        </GButton>
                                    </div>
                                </div>
                            )}
                        </SectionBlock>

                        {/* Materials */}
                        <SectionBlock
                            title="Материалы к занятию"
                            action={
                                <GButton view="flat" size="s" onClick={openMaterialsPicker}>
                                    <GIcon data={Plus as IconData} size={14} />
                                    Прикрепить материалы
                                </GButton>
                            }
                        >
                            {materialItemsForSection.length > 0 ? (
                                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                                    <GText variant="caption-2" color="secondary">
                                        {showingDraftMaterials
                                            ? "Выбрано для домашнего задания"
                                            : "Сохранено в домашних заданиях"}
                                    </GText>

                                    {materialItemsForSection.map((file) => (
                                        <div
                                            key={file.provider ? makeSelectionKey(file.provider, file.id) : file.id}
                                            style={{
                                                display: "flex",
                                                alignItems: "center",
                                                gap: 8,
                                                padding: "6px 10px",
                                                border: "1px solid var(--g-color-line-generic)",
                                                borderRadius: 6,
                                            }}
                                        >
                                            <GIcon
                                                data={
                                                    (file.type || "file") === "folder"
                                                        ? (Folder as IconData)
                                                        : (File as IconData)
                                                }
                                                size={14}
                                            />
                                            <div style={{ flex: 1, minWidth: 0 }}>
                                                <GText variant="body-2" style={{ fontWeight: 600 }} ellipsis>
                                                    {file.name}
                                                </GText>
                                            </div>
                                            {showingDraftMaterials && (
                                                <GButton
                                                    view="flat"
                                                    size="s"
                                                    className="repeto-icon-action-btn"
                                                    title="Удалить файл"
                                                    aria-label="Удалить файл"
                                                    onClick={() => handleRemoveLinkedMaterial(file)}
                                                >
                                                    <GIcon data={TrashBin as IconData} size={14} />
                                                </GButton>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="repeto-lp__empty-state">
                                    <GText variant="body-2" color="secondary">
                                        Материалы не прикреплены
                                    </GText>
                                </div>
                            )}
                        </SectionBlock>

                        {/* Payment */}
                        <SectionBlock
                            title="Оплата"
                            action={
                                <GButton view="flat" size="s" onClick={() => setPaymentModalOpen(true)}>
                                    <GIcon data={Plus as IconData} size={14} />
                                    Добавить оплату
                                </GButton>
                            }
                        >
                            {visiblePaymentItems.length > 0 ? (
                                <div className="repeto-lp__payment-list">
                                    {visiblePaymentItems.map((payment) => {
                                        const status = payment.status.toUpperCase();
                                        const isPaid = status === "PAID";
                                        const isOverdue = status === "OVERDUE";

                                        return (
                                            <div key={payment.id} className="repeto-lp__payment-item">
                                                <div className="repeto-lp__payment-item-top">
                                                    <GText variant="body-2" style={{ fontWeight: 600 }}>
                                                        {payment.amount.toLocaleString("ru-RU")} ₽
                                                    </GText>
                                                    <GLabel
                                                        theme={isPaid ? "success" : isOverdue ? "danger" : "warning"}
                                                        size="s"
                                                    >
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
                                <div className="repeto-lp__empty-state">
                                    <GText variant="body-2" color="secondary">
                                        {isExisting
                                            ? status === "completed"
                                                ? "Оплата за занятие не зафиксирована"
                                                : "Оплата будет доступна после проведения занятия"
                                            : "Оплата пока не добавлена"}
                                    </GText>
                                </div>
                            )}
                        </SectionBlock>

                        {/* Review */}
                        <SectionBlock title="Отзыв ученика">
                            {lesson?.hasReview ? (
                                <div className="repeto-lp__review">
                                    <div className="repeto-lp__review-stars">
                                        {[1, 2, 3, 4, 5].map((star) =>
                                            star <= (lesson.reviewRating || 0) ? "★" : "☆",
                                        ).join(" ")}
                                    </div>
                                    <GText variant="body-2" color="secondary">
                                        Оценка: {lesson.reviewRating || 0}/5
                                    </GText>
                                    {lesson.reviewFeedback && (
                                        <GText variant="body-2" style={{ whiteSpace: "pre-wrap", marginTop: 4 }}>
                                            {lesson.reviewFeedback}
                                        </GText>
                                    )}
                                </div>
                            ) : (
                                <GText variant="body-2" color="secondary">
                                    {isExisting
                                        ? "Отзыв пока не оставлен"
                                        : "После проведения занятия отзыв ученика появится здесь."}
                                </GText>
                            )}
                        </SectionBlock>
                    </div>
                </div>

                {/* ── Footer ── */}
                <div className="repeto-lp__footer">
                    <GButton view="outlined" size="l" onClick={handleClose}>
                        Отмена
                    </GButton>
                    <GButton view="action" size="l" loading={saving} onClick={handleSubmit}>
                        {isExisting ? "Сохранить изменения" : "Создать занятие"}
                    </GButton>
                </div>
            </div>
        </>
    );

    /* ── Nested modals: rendered OUTSIDE panelContent to be above the panel ── */
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
                selectedFiles={hwLinkedFiles}
                availableFiles={availableHomeworkFiles}
                connectedProviders={connectedProviders}
                defaultProvider={defaultMaterialsProvider}
                onApply={setHwLinkedFiles}
            />

            {false && (
            <AppDialog
                size="s"
                open={materialsPickerOpen}
                onClose={() => setMaterialsPickerOpen(false)}
                caption="Выбор материалов"
                footer={{
                    onClickButtonApply: applyMaterialsSelection,
                    textButtonApply: "Готово",
                    onClickButtonCancel: () => setMaterialsPickerOpen(false),
                    textButtonCancel: "Отмена",
                }}
            >
                {connectedProviders.length === 0 ? (
                    <Alert
                        theme="info"
                        view="filled"
                        corners="rounded"
                        title="Облачные диски не подключены"
                        message={
                            <div
                                style={{
                                    display: "flex",
                                    flexDirection: "column",
                                    gap: 10,
                                }}
                            >
                                <GText variant="body-2" color="secondary">
                                    Подключите Яндекс.Диск или Google Drive в настройках интеграций.
                                </GText>
                                <div>
                                    <GButton
                                        view="outlined"
                                        size="m"
                                        onClick={() =>
                                            router.push("/settings?tab=integrations")
                                        }
                                    >
                                        Открыть настройки
                                    </GButton>
                                </div>
                            </div>
                        }
                    />
                ) : pickerProviders.length === 0 ? (
                    <GText variant="body-2" color="secondary">
                        Нет доступных источников материалов.
                    </GText>
                ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                        {selectedAvailableItems.length > 0 && (
                            <div
                                style={{
                                    border: "1px solid var(--g-color-line-generic)",
                                    borderRadius: 10,
                                    padding: "10px 12px",
                                    background: "var(--g-color-base-background)",
                                }}
                            >
                                <div
                                    style={{
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "space-between",
                                        gap: 8,
                                        marginBottom: 6,
                                    }}
                                >
                                    <GText variant="body-2" style={{ fontWeight: 600 }}>
                                        Выбрано: {selectedAvailableItems.length}
                                    </GText>
                                    <GButton
                                        view="flat"
                                        size="s"
                                        onClick={clearAllSelection}
                                    >
                                        Очистить
                                    </GButton>
                                </div>

                                <GText variant="caption-2" color="secondary">
                                    {selectedAvailableItems
                                        .slice(0, 3)
                                        .map((item) => item.name)
                                        .join(", ")}
                                    {selectedAvailableItems.length > 3
                                        ? ` и еще ${selectedAvailableItems.length - 3}`
                                        : ""}
                                </GText>
                            </div>
                        )}

                        {pickerProviders.map((provider) => {
                            const providerItems = itemsByProvider.get(provider) || [];
                            const isOpen = openAccordions.includes(provider);
                            const visibleItems = getProviderVisibleItems(provider);
                            const currentFolderId = currentFolderByProvider[provider] || null;
                            const breadcrumbs = buildProviderBreadcrumbs(provider);
                            const isEmpty = providerItems.length === 0;

                            return (
                                <div
                                    key={provider}
                                    style={{
                                        border: "1px solid var(--g-color-line-generic)",
                                        borderRadius: 10,
                                        overflow: "hidden",
                                    }}
                                >
                                    <button
                                        type="button"
                                        onClick={() => {
                                            if (!isEmpty) {
                                                toggleAccordion(provider);
                                            }
                                        }}
                                        style={{
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "space-between",
                                            width: "100%",
                                            border: "none",
                                            background: "var(--g-color-base-background)",
                                            padding: "12px 14px",
                                            cursor: isEmpty ? "default" : "pointer",
                                            textAlign: "left",
                                        }}
                                    >
                                        <div style={{ minWidth: 0 }}>
                                            <GText variant="subheader-2">
                                                {providerLabel(provider)}
                                            </GText>
                                            {isEmpty && (
                                                <GText variant="caption-2" color="secondary">
                                                    Пусто
                                                </GText>
                                            )}
                                        </div>

                                        <GIcon
                                            data={ChevronDown as IconData}
                                            size={14}
                                            style={{
                                                transform: isOpen
                                                    ? "rotate(180deg)"
                                                    : "rotate(0deg)",
                                                opacity: isEmpty ? 0.4 : 1,
                                                transition: "transform 120ms ease",
                                            }}
                                        />
                                    </button>

                                    {isOpen && !isEmpty && (
                                        <div
                                            style={{
                                                borderTop:
                                                    "1px solid var(--g-color-line-generic)",
                                                maxHeight: 280,
                                                overflowY: "auto",
                                                overflowX: "hidden",
                                                background:
                                                    "var(--g-color-base-background)",
                                            }}
                                        >
                                            <div
                                                style={{
                                                    display: "flex",
                                                    gap: 8,
                                                    padding: "10px 14px",
                                                    borderBottom:
                                                        "1px solid var(--g-color-line-generic)",
                                                    flexWrap: "wrap",
                                                }}
                                            >
                                                <TextInput
                                                    value={providerSearch[provider] || ""}
                                                    onUpdate={(value) =>
                                                        setProviderSearchValue(provider, value)
                                                    }
                                                    size="m"
                                                    placeholder="Поиск по материалам"
                                                    style={{ flex: 1, minWidth: 220 }}
                                                />
                                                <GButton
                                                    size="s"
                                                    view="outlined"
                                                    onClick={() => selectAllInProvider(provider)}
                                                >
                                                    Выбрать все
                                                </GButton>
                                                <GButton
                                                    size="s"
                                                    view="flat"
                                                    onClick={() => clearAllInProvider(provider)}
                                                >
                                                    Снять все
                                                </GButton>
                                            </div>

                                            {currentFolderId && (
                                                <div
                                                    style={{
                                                        display: "flex",
                                                        alignItems: "center",
                                                        flexWrap: "wrap",
                                                        gap: 4,
                                                        padding: "8px 14px 6px",
                                                        borderBottom:
                                                            "1px solid var(--g-color-line-generic)",
                                                    }}
                                                >
                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            setCurrentFolderByProvider((prev) => ({
                                                                ...prev,
                                                                [provider]: null,
                                                            }))
                                                        }
                                                        style={{
                                                            border: "none",
                                                            background: "none",
                                                            padding: 0,
                                                            cursor: "pointer",
                                                            fontSize: 12,
                                                            fontWeight: 600,
                                                            color: "var(--g-color-text-brand)",
                                                        }}
                                                    >
                                                        Корень
                                                    </button>
                                                    {breadcrumbs.map((crumb) => (
                                                        <span
                                                            key={crumb.id}
                                                            style={{
                                                                display: "inline-flex",
                                                                alignItems: "center",
                                                                gap: 4,
                                                            }}
                                                        >
                                                            <GText
                                                                variant="caption-2"
                                                                color="secondary"
                                                            >
                                                                /
                                                            </GText>
                                                            {crumb.id === currentFolderId ? (
                                                                <GText
                                                                    variant="caption-2"
                                                                    style={{ fontWeight: 600 }}
                                                                >
                                                                    {crumb.name}
                                                                </GText>
                                                            ) : (
                                                                <button
                                                                    type="button"
                                                                    onClick={() =>
                                                                        setCurrentFolderByProvider((prev) => ({
                                                                            ...prev,
                                                                            [provider]: crumb.id,
                                                                        }))
                                                                    }
                                                                    style={{
                                                                        border: "none",
                                                                        background: "none",
                                                                        padding: 0,
                                                                        cursor: "pointer",
                                                                        fontSize: 12,
                                                                        fontWeight: 600,
                                                                        color: "var(--g-color-text-brand)",
                                                                    }}
                                                                >
                                                                    {crumb.name}
                                                                </button>
                                                            )}
                                                        </span>
                                                    ))}
                                                </div>
                                            )}

                                            {visibleItems.length === 0 ? (
                                                <div
                                                    style={{
                                                        padding: "14px",
                                                        textAlign: "center",
                                                    }}
                                                >
                                                    <GText
                                                        variant="body-2"
                                                        color="secondary"
                                                    >
                                                        Ничего не найдено
                                                    </GText>
                                                </div>
                                            ) : (
                                                visibleItems.map((item, index) => {
                                                    const isFolder =
                                                        (item.type || "file") === "folder";
                                                    const selectionKey = makeSelectionKey(
                                                        provider,
                                                        item.id,
                                                    );

                                                    return (
                                                        <div
                                                            key={makeSelectionKey(provider, item.id)}
                                                            title={item.name}
                                                            style={{
                                                                display: "grid",
                                                                gridTemplateColumns:
                                                                    "auto auto minmax(0, 1fr) auto",
                                                                alignItems: "center",
                                                                gap: 10,
                                                                minWidth: 0,
                                                                padding: "10px 14px",
                                                                borderTop:
                                                                    index === 0
                                                                        ? "none"
                                                                        : "1px solid var(--g-color-line-generic)",
                                                            }}
                                                        >
                                                            <Checkbox
                                                                size="m"
                                                                checked={selectedDraftKeySet.has(
                                                                    selectionKey,
                                                                )}
                                                                onUpdate={(checked) =>
                                                                    toggleDraftItem(
                                                                        provider,
                                                                        item,
                                                                        checked,
                                                                    )
                                                                }
                                                            />
                                                            <GIcon
                                                                data={
                                                                    isFolder
                                                                        ? (Folder as IconData)
                                                                        : (File as IconData)
                                                                }
                                                                size={14}
                                                            />

                                                            {isFolder ? (
                                                                <button
                                                                    type="button"
                                                                    onClick={() =>
                                                                        openFolder(provider, item.id)
                                                                    }
                                                                    style={{
                                                                        border: "none",
                                                                        background: "none",
                                                                        padding: 0,
                                                                        cursor: "pointer",
                                                                        minWidth: 0,
                                                                        textAlign: "left",
                                                                    }}
                                                                >
                                                                    <GText
                                                                        variant="body-2"
                                                                        style={{
                                                                            fontWeight: 600,
                                                                            color: "var(--g-color-text-brand)",
                                                                        }}
                                                                        ellipsis
                                                                    >
                                                                        {item.name}
                                                                    </GText>
                                                                </button>
                                                            ) : (
                                                                <GText
                                                                    variant="body-2"
                                                                    style={{ fontWeight: 600 }}
                                                                    ellipsis
                                                                >
                                                                    {item.name}
                                                                </GText>
                                                            )}

                                                            {isFolder ? (
                                                                <GButton
                                                                    view="flat"
                                                                    size="s"
                                                                    onClick={() =>
                                                                        openFolder(provider, item.id)
                                                                    }
                                                                >
                                                                    <GIcon
                                                                        data={ChevronRight as IconData}
                                                                        size={12}
                                                                    />
                                                                </GButton>
                                                            ) : (
                                                                <span />
                                                            )}
                                                        </div>
                                                    );
                                                })
                                            )}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}
            </AppDialog>
            )}

            <CreatePaymentModal
                visible={paymentModalOpen}
                onClose={() => setPaymentModalOpen(false)}
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

                        void createNote(
                            paymentDefaultStudent.id,
                            noteText,
                            lesson?.id,
                        ).catch(() => undefined);
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

export default LessonPanel;
