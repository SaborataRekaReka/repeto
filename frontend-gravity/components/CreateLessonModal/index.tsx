import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { createPortal } from "react-dom";
import {
    TextInput,
    TextArea,
    Select,
    Checkbox,
    Text,
    Button,
    Icon,
} from "@gravity-ui/uikit";
import { ArrowLeft } from "@gravity-ui/icons";
import type { IconData } from "@gravity-ui/uikit";
import { useStudents } from "@/hooks/useStudents";
import { createLesson, updateLesson } from "@/hooks/useLessons";
import type { Lesson } from "@/types/schedule";
import type { Student } from "@/types/student";
import StyledDateInput from "@/components/StyledDateInput";
import StyledTimeInput from "@/components/StyledTimeInput";
import CreateStudentModal from "@/components/CreateStudentModal";
import AddSubjectModal from "@/components/AddSubjectModal";
import { Lp2Field, Lp2Row } from "@/components/Lp2Field";
import { codedErrorMessage } from "@/lib/errorCodes";
import { useAuth } from "@/contexts/AuthContext";
import { useApi } from "@/hooks/useApi";

const durationItems = [
    { value: "30", content: "30 минут" },
    { value: "45", content: "45 минут" },
    { value: "60", content: "60 минут" },
    { value: "90", content: "90 минут" },
    { value: "120", content: "120 минут" },
];

const formatItems = [
    { value: "online", content: "Онлайн" },
    { value: "offline", content: "Очно" },
];

const ADD_STUDENT_OPTION_VALUE = "__add_student_option__";
const ADD_SUBJECT_OPTION_VALUE = "__add_subject_option__";
const RECURRENCE_WEEKS_AHEAD = 52;
const STUDENT_BADGE_COLORS = ["#7a98ff", "#9f7aea", "#e29a6a", "#6fb38b", "#5ca8a8"];

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

function getStudentBadgeColor(name: string) {
    let hash = 0;
    for (let i = 0; i < name.length; i += 1) {
        hash = (hash * 31 + name.charCodeAt(i)) >>> 0;
    }
    return STUDENT_BADGE_COLORS[hash % STUDENT_BADGE_COLORS.length];
}

type CreateLessonModalProps = {
    visible: boolean;
    onClose: () => void;
    onCreated?: (savedLesson?: Lesson | Lesson[]) => void | Promise<void>;
    lesson?: Lesson | null;
    defaultStudent?: { id: string; name: string } | null;
    defaultDate?: string;
    defaultTime?: string;
};

type RequiredField = "student" | "subject" | "date" | "time";

const PANEL_Z = 950;

const CreateLessonModal = ({
    visible,
    onClose,
    onCreated,
    lesson,
    defaultStudent,
    defaultDate,
    defaultTime,
}: CreateLessonModalProps) => {
    const panelRef = useRef<HTMLDivElement>(null);
    const [mounted, setMounted] = useState(false);
    const [shouldRender, setShouldRender] = useState(false);
    const [isPanelVisible, setIsPanelVisible] = useState(false);

    useEffect(() => { setMounted(true); }, []);

    useEffect(() => {
        if (visible) {
            setShouldRender(true);
            const raf1 = requestAnimationFrame(() => {
                requestAnimationFrame(() => setIsPanelVisible(true));
            });
            return () => cancelAnimationFrame(raf1);
        } else {
            setIsPanelVisible(false);
        }
    }, [visible]);

    const handleTransitionEnd = useCallback(() => {
        if (!isPanelVisible) setShouldRender(false);
    }, [isPanelVisible]);

    const handleClose = useCallback(() => {
        setIsPanelVisible(false);
        setTimeout(() => onClose(), 350);
    }, [onClose]);

    useEffect(() => {
        if (!visible) return;
        const handler = (e: KeyboardEvent) => { if (e.key === "Escape") handleClose(); };
        document.addEventListener("keydown", handler);
        return () => document.removeEventListener("keydown", handler);
    }, [visible, handleClose]);

    const { user, refreshUser } = useAuth();
    const isEdit = !!lesson;
    const { data: studentsData, refetch: refetchStudents } = useStudents({ limit: 200 }, { skip: !visible });
    const { data: settingsData, refetch: refetchSettings } = useApi<any>("/settings", undefined, { skip: !visible });
    const students = studentsData?.data || [];

    const [studentId, setStudentId] = useState<string[]>([]);
    const [subject, setSubject] = useState<string[]>([]);

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
        subjectDetails.forEach((item: any) => remember(item?.name));

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

    const studentItems = [
        ...students.map((s) => ({
            value: s.id,
            content: s.name,
            data: { color: getStudentBadgeColor(s.name) },
        })),
        { value: ADD_STUDENT_OPTION_VALUE, content: "Добавить ученика" },
    ];

    const [date, setDate] = useState("");
    const [time, setTime] = useState("");
    const [duration, setDuration] = useState<string[]>(["60"]);
    const [format, setFormat] = useState<string[]>(["online"]);
    const [location, setLocation] = useState("");
    const [cost, setCost] = useState("");
    const [repeat, setRepeat] = useState(false);
    const [note, setNote] = useState("");
    const [saving, setSaving] = useState(false);
    const [formError, setFormError] = useState<string | null>(null);
    const [createStudentModalVisible, setCreateStudentModalVisible] = useState(false);
    const [addSubjectModalVisible, setAddSubjectModalVisible] = useState(false);
    const [touched, setTouched] = useState<Record<RequiredField, boolean>>({
        student: false,
        subject: false,
        date: false,
        time: false,
    });

    const markTouched = (field: RequiredField) => {
        setTouched((prev) => (prev[field] ? prev : { ...prev, [field]: true }));
    };

    useEffect(() => {
        if (!visible) {
            setCreateStudentModalVisible(false);
            setAddSubjectModalVisible(false);
        }
    }, [visible]);

    const handleSubjectCreated = async (subjectName: string) => {
        setSubject([subjectName]);
        markTouched("subject");
        await Promise.allSettled([refetchSettings(), refreshUser()]);
    };

    const handleStudentCreated = async (createdStudent?: Student) => {
        await refetchStudents();

        if (!createdStudent?.id) return;

        setStudentId([createdStudent.id]);
        markTouched("student");

        if (!isEdit) {
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

    useEffect(() => {
        if (!visible) return;
        setFormError(null);
        setTouched({ student: false, subject: false, date: false, time: false });

        if (lesson) {
            const matched = students.find((s) => s.name === lesson.studentName);
            setStudentId(matched ? [matched.id] : []);
            const lessonSubject = normalizeSubjectName(lesson.subject);
            setSubject(lessonSubject ? [lessonSubject] : []);
            setDate(lesson.date);
            setTime(lesson.startTime);
            const dur = durationItems.find(
                (d) => d.value === String(lesson.duration)
            );
            setDuration([dur?.value || "60"]);
            const fmt = formatItems.find(
                (f) => f.value === lesson.format?.toLowerCase()
            );
            setFormat([fmt?.value || "online"]);
            setCost(String(lesson.rate));
            setNote(lesson.notes || "");
        } else {
            setStudentId(defaultStudent ? [defaultStudent.id] : []);
            setSubject([]);
            setDate(defaultDate || "");
            setTime(defaultTime || "");
            setDuration(["60"]);
            setFormat(["online"]);
            setLocation("");
            setCost("");
            setRepeat(false);
            setNote("");
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [visible, defaultDate, defaultTime]);

    // Auto-fill subject & cost from student
    useEffect(() => {
        if (!isEdit && studentId.length > 0) {
            const s = students.find((st) => st.id === studentId[0]);
            if (s) {
                if (!subject.length) {
                    const matchedSubject = normalizeSubjectName(s.subject);
                    if (matchedSubject) setSubject([matchedSubject]);
                }
                if (!cost) setCost(String(s.rate || ""));
            }
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [studentId]);

    const handleSubmit = async () => {
        const requiresStudent = !isEdit;
        const hasStudent = studentId.length > 0;
        const hasSubject = subject.length > 0;
        const hasDate = !!date;
        const hasTime = !!time;

        setTouched({
            student: requiresStudent,
            subject: true,
            date: true,
            time: true,
        });

        if ((requiresStudent && !hasStudent) || !hasSubject || !hasDate || !hasTime) {
            setFormError("Заполните обязательные поля.");
            return;
        }

        setSaving(true);
        setFormError(null);
        try {
            const scheduledAt = new Date(`${date}T${time}`).toISOString();
            const recurrence = !isEdit && repeat
                ? {
                    enabled: true,
                    until: buildRecurrenceUntil(date),
                    weekdays: [getIsoWeekday(date)],
                }
                : undefined;
            let savedLesson: unknown;

            if (isEdit && lesson) {
                savedLesson = await updateLesson(lesson.id, {
                    subject: subject[0],
                    scheduledAt,
                    duration: Number(duration[0]),
                    format: format[0].toUpperCase(),
                    location: location || undefined,
                    rate: Number(cost) || undefined,
                    notes: note,
                });
            } else {
                savedLesson = await createLesson({
                    studentId: studentId[0],
                    subject: subject[0],
                    scheduledAt,
                    duration: Number(duration[0]),
                    format: format[0].toUpperCase(),
                    location: location || undefined,
                    rate: Number(cost) || undefined,
                    notes: note,
                    recurrence,
                });
            }

            await onCreated?.(savedLesson as Lesson | Lesson[]);
            handleClose();
        } catch (err) {
            setFormError(codedErrorMessage("LESSON-SAVE", err));
        } finally {
            setSaving(false);
        }
    };

    const studentError = !isEdit && touched.student && !studentId.length;
    const subjectError = touched.subject && !subject.length;
    const dateError = touched.date && !date;
    const timeError = touched.time && !time;

    const renderStudentOption = (option: any) => {
        const optionLabel =
            typeof option?.content === "string" && option.content.trim().length
                ? option.content
                : "Ученик";

        if (option?.value === ADD_STUDENT_OPTION_VALUE) {
            return (
                <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "4px 0", color: "var(--g-color-text-brand)" }}>
                    <div
                        style={{
                            width: 28,
                            height: 28,
                            borderRadius: "50%",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: 18,
                            fontWeight: 600,
                            color: "var(--g-color-text-brand)",
                            border: "1px dashed var(--g-color-line-brand)",
                            flexShrink: 0,
                        }}
                    >
                        +
                    </div>
                    <Text variant="body-1">Добавить ученика</Text>
                </div>
            );
        }

        return (
            <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "4px 0" }}>
                <div
                    style={{
                        width: 28,
                        height: 28,
                        borderRadius: "50%",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "#fff",
                        fontWeight: 600,
                        fontSize: 13,
                        flexShrink: 0,
                        background: option?.data?.color || getStudentBadgeColor(optionLabel),
                    }}
                >
                    {optionLabel.charAt(0).toUpperCase()}
                </div>
                <Text variant="body-1">{optionLabel}</Text>
            </div>
        );
    };

    if (!mounted || (!shouldRender && !visible)) return null;

    const panelContent = (
        <div
            ref={panelRef}
            className={`lp2 ${isPanelVisible ? "lp2--open" : ""}`}
            style={{ zIndex: PANEL_Z }}
            onTransitionEnd={handleTransitionEnd}
            role="dialog"
            aria-modal="false"
            aria-label={isEdit ? "Редактирование занятия" : "Новое занятие"}
        >
            <div className="lp2__topbar">
                <button type="button" className="lp2__back" onClick={handleClose} aria-label="Назад">
                    <Icon data={ArrowLeft as IconData} size={18} />
                </button>
                <div className="lp2__topbar-actions" />
            </div>

            <div className="lp2__scroll">
                <div className="lp2__center">
                    <h1 className="lp2__page-title">{isEdit ? "Редактирование занятия" : "Новое занятие"}</h1>

                    {!isEdit && (
                        <Lp2Field label="Ученик *" error={studentError} errorText="Обязательное поле">
                            <Select
                                options={studentItems}
                                renderOption={renderStudentOption}
                                value={studentId}
                                onUpdate={(value) => {
                                    if (value[0] === ADD_STUDENT_OPTION_VALUE) {
                                        setCreateStudentModalVisible(true);
                                        markTouched("student");
                                        return;
                                    }
                                    setStudentId(value);
                                    markTouched("student");
                                }}
                                placeholder="Выберите ученика"
                                size="l"
                                width="max"
                                filterable
                                popupWidth="fit"
                                popupPlacement={["bottom-start", "top-start"]}
                                popupClassName="lp2-popup"
                            />
                        </Lp2Field>
                    )}

                    <Lp2Field label="Предмет *" error={subjectError} errorText="Обязательное поле">
                        <Select
                            options={subjectItems}
                            value={subject}
                            onUpdate={(value) => {
                                if (value[0] === ADD_SUBJECT_OPTION_VALUE) {
                                    markTouched("subject");
                                    setAddSubjectModalVisible(true);
                                    return;
                                }
                                setSubject(value);
                                markTouched("subject");
                            }}
                            placeholder="Выберите предмет"
                            size="l"
                            width="max"
                            filterable
                            popupClassName="lp2-popup"
                        />
                    </Lp2Field>

                    <Lp2Row>
                        <Lp2Field label="Дата *" half error={dateError} errorText="Обязательное поле">
                            <StyledDateInput
                                value={date}
                                onUpdate={(value) => {
                                    setDate(value);
                                    markTouched("date");
                                }}
                                style={{ height: 36, padding: 0 }}
                            />
                        </Lp2Field>
                        <Lp2Field label="Время начала *" half error={timeError} errorText="Обязательное поле">
                            <StyledTimeInput
                                value={time}
                                onUpdate={(value) => {
                                    setTime(value);
                                    markTouched("time");
                                }}
                                showClockIcon={false}
                                style={{ height: 36, padding: 0 }}
                            />
                        </Lp2Field>
                    </Lp2Row>

                    <Lp2Row>
                        <Lp2Field label="Длительность" half>
                            <Select
                                options={durationItems}
                                value={duration}
                                onUpdate={setDuration}
                                size="l"
                                width="max"
                                popupClassName="lp2-popup"
                            />
                        </Lp2Field>
                        <Lp2Field label="Формат" half>
                            <Select
                                options={formatItems}
                                value={format}
                                onUpdate={setFormat}
                                size="l"
                                width="max"
                                popupClassName="lp2-popup"
                            />
                        </Lp2Field>
                    </Lp2Row>

                    <Lp2Field label="Место / ссылка">
                        <TextInput
                            value={location}
                            onUpdate={setLocation}
                            placeholder="Zoom / адрес"
                            size="l"
                        />
                    </Lp2Field>

                    <Lp2Field label="Стоимость (₽)">
                        <TextInput
                            value={cost}
                            onUpdate={setCost}
                            placeholder="2100"
                            size="l"
                        />
                    </Lp2Field>

                    {!isEdit && (
                        <>
                            <Checkbox
                                checked={repeat}
                                onUpdate={setRepeat}
                                size="l"
                            >
                                Повторять еженедельно
                            </Checkbox>
                            {repeat && (
                                <Text as="div" variant="caption-2" color="secondary">
                                    Повтор создаётся на 12 месяцев вперёд в тот же день и время.
                                </Text>
                            )}
                        </>
                    )}

                    <Lp2Field label="Заметка">
                        <TextArea
                            value={note}
                            onUpdate={setNote}
                            placeholder="Заметка к занятию…"
                            rows={3}
                            size="l"
                        />
                    </Lp2Field>

                    {formError && (
                        <Text as="div" variant="body-1" style={{ color: "var(--g-color-text-danger)" }}>
                            {formError}
                        </Text>
                    )}
                </div>
            </div>

            <div className="lp2__bottombar">
                <Button
                    className="lp2__submit"
                    view="action"
                    size="xl"
                    width="max"
                    onClick={handleSubmit}
                    loading={saving}
                >
                    Сохранить
                </Button>
            </div>

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
        </div>
    );

    return createPortal(panelContent, document.body);
};

export default CreateLessonModal;