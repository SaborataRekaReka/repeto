import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Alert, Card, Text, Button, Icon } from "@gravity-ui/uikit";
import {
    ArrowLeft,
    File as FileIcon,
    ArrowUpRightFromSquare,
    TrashBin,
    Plus,
    Calendar,
    CircleCheck,
    Link as LinkIcon,
} from "@gravity-ui/icons";
import type { IconData } from "@gravity-ui/uikit";
import { studentApi } from "@/lib/studentAuth";
import type { PortalHomework, StudentUpload } from "@/types/student-portal";
import PortalModal from "./PortalModal";

type HomeworkTabProps = {
    homework: PortalHomework[];
    studentId: string;
};

const HOMEWORK_BATCH_SIZE = 5;
const MAX_FILE_SIZE = 5 * 1024 * 1024;

const normalizeHomeworkUploads = (items: PortalHomework[]) =>
    items.map((item) => ({
        ...item,
        studentUploads: item.studentUploads || [],
    }));

const buildHomeworkPreview = (task: string) => {
    const normalized = task.replace(/\s+/g, " ").trim();
    if (normalized.length <= 140) {
        return normalized;
    }
    return `${normalized.slice(0, 137)}...`;
};

const HomeworkTab = ({ homework: initial, studentId }: HomeworkTabProps) => {
    const [homework, setHomework] = useState<PortalHomework[]>(() =>
        normalizeHomeworkUploads(initial)
    );
    const [shown, setShown] = useState(() =>
        Math.min(HOMEWORK_BATCH_SIZE, initial.length)
    );
    const [loadingMoreHomework, setLoadingMoreHomework] = useState(false);
    const [updatingId, setUpdatingId] = useState<string | null>(null);
    const [uploadingId, setUploadingId] = useState<string | null>(null);
    const [actionError, setActionError] = useState<string | null>(null);
    const [openedHomeworkId, setOpenedHomeworkId] = useState<string | null>(null);
    const [isHomeworkModalOpen, setIsHomeworkModalOpen] = useState(false);
    const encodedStudentId = encodeURIComponent(studentId);
    const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({});
    const loadMoreRef = useRef<HTMLDivElement | null>(null);
    const loadMoreTimerRef = useRef<number | null>(null);

    useEffect(() => {
        const normalized = normalizeHomeworkUploads(initial);
        setHomework(normalized);
        setShown(Math.min(HOMEWORK_BATCH_SIZE, normalized.length));
        setLoadingMoreHomework(false);
        setActionError(null);
    }, [initial]);

    useEffect(() => {
        if (!openedHomeworkId) {
            return;
        }
        const exists = homework.some((item) => item.id === openedHomeworkId);
        if (!exists) {
            setIsHomeworkModalOpen(false);
            setOpenedHomeworkId(null);
        }
    }, [homework, openedHomeworkId]);

    const closeHomeworkModal = useCallback(() => {
        setIsHomeworkModalOpen(false);
    }, []);

    const openHomeworkModal = useCallback((id: string) => {
        setOpenedHomeworkId(id);
        setIsHomeworkModalOpen(true);
    }, []);

    const setHomeworkDone = async (id: string, nextDone: boolean) => {
        const current = homework.find((h) => h.id === id);
        if (!current) return;

        if (current.done === nextDone) {
            return;
        }

        setActionError(null);
        setUpdatingId(id);
        try {
            await studentApi(`/student-portal/students/${encodedStudentId}/homework/${id}`, {
                method: "PATCH",
                body: JSON.stringify({ done: nextDone }),
            });
            setHomework((prev) =>
                prev.map((h) => (h.id === id ? { ...h, done: nextDone } : h))
            );
        } catch {
            setActionError("Не удалось обновить статус домашки. Попробуйте снова.");
        } finally {
            setUpdatingId(null);
        }
    };

    const handleFileUpload = async (hwId: string, file: File) => {
        if (file.size > MAX_FILE_SIZE) {
            setActionError("Файл слишком большой. Максимум 5 МБ.");
            return;
        }

        setActionError(null);
        setUploadingId(hwId);
        try {
            const formData = new FormData();
            formData.append("file", file);
            const data = await studentApi<{
                id: string;
                name: string;
                size: number;
                url: string;
            }>(
                `/student-portal/students/${encodedStudentId}/homework/${hwId}/upload`,
                {
                    method: "POST",
                    body: formData,
                },
            );
            const upload: StudentUpload = {
                id: data.id,
                name: data.name,
                size:
                    data.size >= 1024 * 1024
                        ? (data.size / (1024 * 1024)).toFixed(1) + " МБ"
                        : Math.round(data.size / 1024) + " КБ",
                uploadedAt: new Date().toLocaleDateString("ru-RU", {
                    day: "numeric",
                    month: "short",
                }),
                expiresAt: "",
                url: data.url,
            };
            setHomework((prev) =>
                prev.map((h) =>
                    h.id === hwId
                        ? { ...h, studentUploads: [...(h.studentUploads || []), upload] }
                        : h
                )
            );
        } catch {
            setActionError("Не удалось загрузить файл. Попробуйте снова.");
        } finally {
            setUploadingId(null);
        }
    };

    const handleRemoveUpload = async (hwId: string, uploadId: string) => {
        const hw = homework.find((h) => h.id === hwId);
        const upload = hw?.studentUploads?.find((u) => u.id === uploadId);
        if (!upload?.url) return;
        try {
            await studentApi(`/student-portal/students/${encodedStudentId}/homework/${hwId}/upload`, {
                method: "DELETE",
                body: JSON.stringify({ fileUrl: upload.url }),
            });
        } catch {
            // best-effort removal
        }
        setHomework((prev) =>
            prev.map((h) =>
                h.id === hwId
                    ? {
                          ...h,
                          studentUploads: (h.studentUploads || []).filter(
                              (u) => u.id !== uploadId
                          ),
                      }
                    : h
            )
        );
    };

    const loadMoreHomework = useCallback(() => {
        if (loadingMoreHomework || shown >= homework.length) {
            return;
        }

        setLoadingMoreHomework(true);

        if (loadMoreTimerRef.current) {
            window.clearTimeout(loadMoreTimerRef.current);
        }

        loadMoreTimerRef.current = window.setTimeout(() => {
            setShown((prev) => Math.min(prev + HOMEWORK_BATCH_SIZE, homework.length));
            setLoadingMoreHomework(false);
            loadMoreTimerRef.current = null;
        }, 320);
    }, [homework.length, loadingMoreHomework, shown]);

    useEffect(() => {
        if (shown >= homework.length) {
            return;
        }

        const node = loadMoreRef.current;
        if (!node || typeof IntersectionObserver === "undefined") {
            return;
        }

        const observer = new IntersectionObserver(
            (entries) => {
                if (entries.some((entry) => entry.isIntersecting)) {
                    loadMoreHomework();
                }
            },
            { rootMargin: "160px 0px" }
        );

        observer.observe(node);

        return () => observer.disconnect();
    }, [homework.length, loadMoreHomework, shown]);

    useEffect(
        () => () => {
            if (loadMoreTimerRef.current) {
                window.clearTimeout(loadMoreTimerRef.current);
            }
        },
        []
    );

    const openedHomework = useMemo(
        () => (openedHomeworkId ? homework.find((h) => h.id === openedHomeworkId) || null : null),
        [homework, openedHomeworkId]
    );

    if (homework.length === 0) {
        return (
            <div className="repeto-portal-section--spaced">
                <Text variant="subheader-2" className="repeto-portal-plain-section-title">
                    Домашние задания
                </Text>
                <Card view="outlined" className="repeto-portal-empty-card">
                    <Text variant="subheader-2" as="div" style={{ marginBottom: 4 }}>
                        Нет текущих заданий
                </Text>
                    <Text variant="body-1" color="secondary">
                        Когда репетитор задаст домашнее задание, оно появится здесь.
                    </Text>
                </Card>
            </div>
        );
    }

    return (
        <div className="repeto-portal-section--spaced">
            {actionError && (
                <Alert
                    theme="danger"
                    view="filled"
                    corners="rounded"
                    title="Не удалось выполнить действие"
                    message={actionError}
                    onClose={() => setActionError(null)}
                    style={{ marginBottom: 12 }}
                />
            )}

            <Text variant="subheader-2" className="repeto-portal-plain-section-title">
                Домашние задания
            </Text>

            <div className="repeto-portal-stack repeto-portal-stack--md">
                {homework.slice(0, shown).map((h) => {
                        const dueLabel = h.due && h.due.trim() ? h.due : "Без срока";
                        const hasTutorMaterials = (h.linkedFiles?.length || 0) > 0;
                        const hasStudentMaterials = (h.studentUploads?.length || 0) > 0;
                        const hasAnyMaterials = hasTutorMaterials || hasStudentMaterials;
                        const actionLabel =
                            updatingId === h.id
                                ? "Сохраняем..."
                                : h.done
                                  ? "Выполнено"
                                  : "Выполнить";

                        return (
                            <Card
                                key={h.id}
                                view="outlined"
                                className={`repeto-portal-item-card repeto-portal-item-card--homework${
                                    h.done ? " repeto-portal-item-card--done" : ""
                                }`}
                            >
                                <div
                                    className="repeto-portal-homework-open-surface"
                                    role="button"
                                    tabIndex={0}
                                    onClick={() => openHomeworkModal(h.id)}
                                    onKeyDown={(event) => {
                                        if (event.key === "Enter" || event.key === " ") {
                                            event.preventDefault();
                                            openHomeworkModal(h.id);
                                        }
                                    }}
                                >
                                    <div className="repeto-portal-item-row repeto-portal-item-row--homework">
                                        <div className="repeto-portal-item-main repeto-portal-item-main--centered">
                                            <div
                                                className="repeto-portal-item-mainline repeto-portal-item-mainline--centered"
                                                style={{ gap: 8 }}
                                            >
                                                <Icon data={Calendar as IconData} size={16} />
                                                <Text variant="body-2" style={{ fontWeight: 600 }}>
                                                    {dueLabel}
                                                </Text>
                                            </div>
                                            <Text
                                                variant="body-1"
                                                className="repeto-portal-homework-task"
                                                style={
                                                    h.done
                                                        ? {
                                                              textDecoration: "line-through",
                                                              color: "var(--g-color-text-secondary)",
                                                          }
                                                        : undefined
                                                }
                                                ellipsis
                                            >
                                                {buildHomeworkPreview(h.task)}
                                            </Text>

                                            {hasAnyMaterials && (
                                                <div className="repeto-portal-homework-materials">
                                                    {hasTutorMaterials && (
                                                        <span
                                                            className="repeto-portal-homework-material-chip"
                                                            title={`Материалы репетитора: ${h.linkedFiles?.length || 0}`}
                                                        >
                                                            <Icon data={LinkIcon as IconData} size={14} />
                                                            <span>{h.linkedFiles?.length || 0}</span>
                                                        </span>
                                                    )}
                                                    {hasStudentMaterials && (
                                                        <span
                                                            className="repeto-portal-homework-material-chip"
                                                            title={`Материалы ученика: ${h.studentUploads?.length || 0}`}
                                                        >
                                                            <Icon data={LinkIcon as IconData} size={14} />
                                                            <span>{h.studentUploads?.length || 0}</span>
                                                        </span>
                                                    )}
                                                </div>
                                            )}
                                        </div>

                                        <div className="repeto-portal-item-side repeto-portal-item-side--homework">
                                            <div className="repeto-portal-homework-actions">
                                                <button
                                                    type="button"
                                                    className={`repeto-portal-homework-quick-action${
                                                        h.done
                                                            ? " repeto-portal-homework-quick-action--done"
                                                            : ""
                                                    }`}
                                                    onClick={(event) => {
                                                        event.stopPropagation();
                                                        if (!h.done) {
                                                            void setHomeworkDone(h.id, true);
                                                        }
                                                    }}
                                                    onKeyDown={(event) => {
                                                        event.stopPropagation();
                                                    }}
                                                    aria-label={
                                                        h.done
                                                            ? "Домашнее задание выполнено"
                                                            : "Выполнить домашнее задание"
                                                    }
                                                    disabled={h.done || updatingId === h.id}
                                                >
                                                    <Icon data={CircleCheck as IconData} size={18} />
                                                    <span>{actionLabel}</span>
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </Card>
                        );
                })}
            </div>

            {shown < homework.length && (
                <div
                    ref={loadMoreRef}
                    className="repeto-portal-infinite-loader"
                    aria-live="polite"
                    aria-label="Загружаем домашние задания"
                >
                    <span className="repeto-portal-infinite-loader__spinner" aria-hidden="true" />
                </div>
            )}

            {openedHomework && (
                <PortalModal
                    open={isHomeworkModalOpen}
                    onClose={closeHomeworkModal}
                    onClosed={() => setOpenedHomeworkId(null)}
                    ariaLabel="Домашнее задание"
                    overlayClassName="lp2-overlay"
                    overlayOpenClassName="lp2-overlay--open"
                    panelClassName="lp2 lp2--homework lp2--portal-homework"
                    panelOpenClassName="lp2--open"
                >
                    <div className="lp2__topbar">
                        <button
                            type="button"
                            className="lp2__back"
                            onClick={closeHomeworkModal}
                            aria-label="Закрыть"
                        >
                            <Icon data={ArrowLeft as IconData} size={18} />
                        </button>
                        <Text variant="subheader-2">Домашнее задание</Text>
                        <div className="lp2__topbar-actions" />
                    </div>

                    <div className="lp2__scroll">
                        <div className="lp2__center lp2__center--homework lp2__center--portal-homework">
                            <div className="repeto-portal-stack repeto-portal-homework-modal">
                                <div className="repeto-portal-item-mainline repeto-portal-homework-modal__due">
                                    <Icon data={Calendar as IconData} size={16} />
                                    <Text variant="body-2" style={{ fontWeight: 600 }}>
                                        {openedHomework.due && openedHomework.due.trim()
                                            ? openedHomework.due
                                            : "Без срока"}
                                    </Text>
                                </div>

                                <Text
                                    variant="body-1"
                                    className={`repeto-portal-homework-modal__task${
                                        openedHomework.done
                                            ? " repeto-portal-homework-modal__task--done"
                                            : ""
                                    }`}
                                >
                                    {openedHomework.task}
                                </Text>

                                {openedHomework.linkedFiles &&
                                    openedHomework.linkedFiles.length > 0 && (
                                        <div className="repeto-portal-stack repeto-portal-homework-modal__section">
                                            <Text
                                                variant="caption-1"
                                                color="secondary"
                                                className="repeto-portal-homework-modal__section-title"
                                            >
                                                Материалы от репетитора
                                            </Text>
                                            <div className="repeto-portal-stack repeto-portal-homework-modal__uploads">
                                                {openedHomework.linkedFiles.map((file) => (
                                                    <a
                                                        key={file.id}
                                                        href={file.cloudUrl}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="repeto-portal-file-row repeto-portal-file-pill"
                                                    >
                                                        <div className="repeto-portal-file-row__left">
                                                            <Icon data={FileIcon as IconData} size={18} />
                                                            <div className="repeto-portal-file-row__meta">
                                                                <Text
                                                                    variant="body-1"
                                                                    as="div"
                                                                    ellipsis
                                                                    className="repeto-portal-file-row__title"
                                                                    style={{ fontWeight: 600 }}
                                                                >
                                                                    {file.name}
                                                                </Text>
                                                                {file.size && (
                                                                    <Text
                                                                        variant="caption-1"
                                                                        color="secondary"
                                                                        as="div"
                                                                        className="repeto-portal-file-row__subtitle"
                                                                    >
                                                                        {file.size}
                                                                    </Text>
                                                                )}
                                                            </div>
                                                        </div>
                                                        <span className="repeto-portal-file-pill__open">
                                                            <span>Открыть</span>
                                                            <Icon
                                                                data={ArrowUpRightFromSquare as IconData}
                                                                size={14}
                                                            />
                                                        </span>
                                                    </a>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                <div className="repeto-portal-stack repeto-portal-homework-modal__section">
                                    <div
                                        className="repeto-portal-item-mainline repeto-portal-homework-modal__section-head"
                                    >
                                        <Text
                                            variant="caption-1"
                                            color="secondary"
                                            className="repeto-portal-homework-modal__section-title"
                                        >
                                            Мои файлы
                                        </Text>
                                        <Text
                                            variant="caption-1"
                                            color="secondary"
                                            className="repeto-portal-homework-modal__section-hint"
                                        >
                                            до 5 МБ · хранятся 3 дня
                                        </Text>
                                    </div>

                                    {openedHomework.studentUploads &&
                                        openedHomework.studentUploads.length > 0 && (
                                            <div className="repeto-portal-stack repeto-portal-homework-modal__uploads">
                                                {openedHomework.studentUploads.map((upload) => (
                                                    <Card
                                                        key={upload.id}
                                                        view="outlined"
                                                        className="repeto-portal-upload-card"
                                                    >
                                                        <Icon data={FileIcon as IconData} size={16} />
                                                        <div style={{ flex: 1, minWidth: 0 }}>
                                                            <Text
                                                                variant="caption-1"
                                                                ellipsis
                                                                style={{
                                                                    fontWeight: 600,
                                                                    display: "block",
                                                                }}
                                                            >
                                                                {upload.name}
                                                            </Text>
                                                            <Text variant="caption-1" color="secondary">
                                                                {upload.size}
                                                                {upload.expiresAt
                                                                    ? ` · до ${upload.expiresAt}`
                                                                    : ""}
                                                            </Text>
                                                        </div>
                                                        <Button
                                                            view="flat-danger"
                                                            size="xs"
                                                            onClick={() =>
                                                                handleRemoveUpload(
                                                                    openedHomework.id,
                                                                    upload.id
                                                                )
                                                            }
                                                        >
                                                            <Icon data={TrashBin as IconData} size={14} />
                                                        </Button>
                                                    </Card>
                                                ))}
                                            </div>
                                        )}

                                    <input
                                        ref={(el) => {
                                            fileInputRefs.current[openedHomework.id] = el;
                                        }}
                                        type="file"
                                        hidden
                                        onChange={(e) => {
                                            const file = e.target.files?.[0];
                                            if (file) {
                                                void handleFileUpload(openedHomework.id, file);
                                            }
                                            e.target.value = "";
                                        }}
                                    />

                                    <button
                                        type="button"
                                        className="hw-material-upload-btn repeto-portal-homework-modal__upload-trigger"
                                        onClick={() =>
                                            fileInputRefs.current[openedHomework.id]?.click()
                                        }
                                        disabled={uploadingId === openedHomework.id}
                                    >
                                        <span className="hw-material-upload-btn__icon">
                                            <Icon data={Plus as IconData} size={20} />
                                        </span>
                                        <span className="hw-material-upload-btn__content">
                                            <span className="hw-material-upload-btn__title">
                                                {uploadingId === openedHomework.id
                                                    ? "Загружаем файл..."
                                                    : "Загрузить файл"}
                                            </span>
                                            <span className="hw-material-upload-btn__hint">
                                                до 5 МБ · хранятся 3 дня
                                            </span>
                                        </span>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="lp2__bottombar">
                        <div className="lp2__actions lp2__actions--split">
                            <Button
                                view="outlined"
                                size="xl"
                                className="lp2__action lp2__action--secondary"
                                onClick={closeHomeworkModal}
                            >
                                Закрыть
                            </Button>
                            <Button
                                view="action"
                                size="xl"
                                className="lp2__action"
                                loading={updatingId === openedHomework.id}
                                disabled={updatingId === openedHomework.id}
                                onClick={() =>
                                    void setHomeworkDone(
                                        openedHomework.id,
                                        !openedHomework.done
                                    )
                                }
                            >
                                {openedHomework.done ? "Вернуть в работу" : "Выполнено"}
                            </Button>
                        </div>
                    </div>
                </PortalModal>
            )}
        </div>
    );
};

export default HomeworkTab;
