import Link from "next/link";
import { useMemo, useState } from "react";
import { Icon } from "@gravity-ui/uikit";
import { Xmark } from "@gravity-ui/icons";
import type { IconData } from "@gravity-ui/uikit";
import { useDebts, useExpiringPackages, useTodayLessons } from "@/hooks/useDashboard";

const formatAmount = (value: number) =>
    `${value.toLocaleString("ru-RU")}\u00A0₽`;

const studentsWord = (count: number) => {
    const mod10 = count % 10;
    const mod100 = count % 100;
    if (mod10 === 1 && mod100 !== 11) return "ученик";
    if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return "ученика";
    return "учеников";
};

const packagesWord = (count: number) => {
    const mod10 = count % 10;
    const mod100 = count % 100;
    if (mod10 === 1 && mod100 !== 11) return "пакет";
    if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return "пакета";
    return "пакетов";
};

const lessonsWord = (count: number) => {
    const mod10 = count % 10;
    const mod100 = count % 100;
    if (mod10 === 1 && mod100 !== 11) return "занятие";
    if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return "занятия";
    return "занятий";
};

const tasksWord = (count: number) => {
    const mod10 = count % 10;
    const mod100 = count % 100;
    if (mod10 === 1 && mod100 !== 11) return "задача";
    if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return "задачи";
    return "задач";
};

const moreTasksLabel = (count: number) => `Еще ${count} ${tasksWord(count)}`;

type TileProps = {
    href: string;
    kicker: string;
    title: string;
    meta: string;
    tone?: "default" | "urgent";
};

type TileLinkProps = TileProps & {
    className?: string;
    onClick?: () => void;
};

const Tile = ({ href, kicker, title, meta, tone = "default", className, onClick }: TileLinkProps) => (
    <Link
        href={href}
        className={`repeto-task-tile${tone === "urgent" ? " repeto-task-tile--urgent" : ""}${className ? ` ${className}` : ""}`}
        onClick={onClick}
    >
        <span className="repeto-task-tile__kicker">{kicker}</span>
        <span className="repeto-task-tile__title">{title}</span>
        <span className="repeto-task-tile__meta">{meta}</span>
    </Link>
);

const TaskStackPreview = ({ tasks, onOpen }: { tasks: TileProps[]; onOpen: () => void }) => {
    const first = tasks[0];
    const hiddenCount = tasks.length - 1;

    return (
        <button
            type="button"
            className="repeto-task-stack"
            data-count={tasks.length}
            onClick={onOpen}
            aria-haspopup="dialog"
            aria-label={hiddenCount > 0 ? `Открыть задачи. ${moreTasksLabel(hiddenCount)}` : "Открыть задачу"}
        >
            {tasks.length > 2 && <span className="repeto-task-stack__layer repeto-task-stack__layer--third" />}
            {tasks.length > 1 && <span className="repeto-task-stack__layer repeto-task-stack__layer--second" />}
            <span className="repeto-task-stack__card">
                <span className="repeto-task-tile__kicker">{first.kicker}</span>
                <span className="repeto-task-tile__title">{first.title}</span>
                <span className="repeto-task-tile__meta">
                    {hiddenCount > 0 ? moreTasksLabel(hiddenCount) : first.meta}
                </span>
            </span>
        </button>
    );
};

const TaskTiles = () => {
    const { data: debts = [] } = useDebts(20);
    const { data: packages = [] } = useExpiringPackages();
    const { data: todayLessons = [] } = useTodayLessons();
    const [mobileOpen, setMobileOpen] = useState(false);

    const debtSummary = useMemo(() => {
        const total = debts.reduce((sum, s) => sum + Math.max(0, -s.balance), 0);
        const count = debts.filter((s) => s.balance < 0).length;
        return { total, count };
    }, [debts]);

    const packagesSummary = useMemo(() => {
        const count = packages.length;
        const nearest = packages[0]?.validUntil;
        const urgent = packages.some(
            (p) => p.lessonsTotal - p.lessonsUsed <= 2
        );
        return { count, nearest, urgent };
    }, [packages]);

    const lessonsSummary = useMemo(() => {
        const upcoming = todayLessons.filter((l) => l.status === "planned");
        const nextLesson = upcoming[0];
        return {
            upcomingCount: upcoming.length,
            nextTime: nextLesson?.startTime,
            nextStudent: nextLesson?.studentName,
        };
    }, [todayLessons]);

    const taskItems = useMemo<TileProps[]>(() => {
        const items: TileProps[] = [];

        if (debtSummary.count > 0) {
            items.push({
                href: "/finance/payments",
                kicker: "Задача",
                title: "Напомните об оплате",
                meta: `${debtSummary.count} ${studentsWord(debtSummary.count)} · ${formatAmount(debtSummary.total)}`,
                tone: "urgent",
            });
        }

        if (packagesSummary.count > 0) {
            items.push({
                href: "/packages",
                kicker: "Задача",
                title:
                    packagesSummary.count === 1
                        ? "Истекает пакет занятий"
                        : `Истекают ${packagesSummary.count} ${packagesWord(packagesSummary.count)}`,
                meta: packagesSummary.nearest
                    ? `Ближайший — до ${packagesSummary.nearest}`
                    : "Предложите продлить",
                tone: packagesSummary.urgent ? "urgent" : "default",
            });
        }

        if (lessonsSummary.upcomingCount > 0) {
            items.push({
                href: "/schedule",
                kicker: "Сегодня",
                title:
                    lessonsSummary.upcomingCount === 1
                        ? "1 занятие впереди"
                        : `${lessonsSummary.upcomingCount} ${lessonsWord(lessonsSummary.upcomingCount)} впереди`,
                meta: lessonsSummary.nextTime
                    ? `Ближайшее в ${lessonsSummary.nextTime}${
                          lessonsSummary.nextStudent
                              ? ` · ${lessonsSummary.nextStudent}`
                              : ""
                      }`
                    : "Проверьте расписание",
            });
        }

        return items.slice(0, 3);
    }, [debtSummary, packagesSummary, lessonsSummary]);

    if (taskItems.length === 0) {
        return null;
    }

    return (
        <section className="repeto-task-panel" aria-label="Задачи">
            <div className="repeto-task-tiles" data-count={taskItems.length}>
                {taskItems.map((task) => (
                    <Tile key={`${task.href}-${task.title}`} {...task} />
                ))}
            </div>

            <TaskStackPreview tasks={taskItems} onOpen={() => setMobileOpen(true)} />

            {mobileOpen && (
                <div className="repeto-task-mobile-modal" role="dialog" aria-modal="true" aria-labelledby="repeto-task-mobile-title">
                    <button
                        type="button"
                        className="repeto-task-mobile-modal__backdrop"
                        aria-label="Закрыть задачи"
                        onClick={() => setMobileOpen(false)}
                    />
                    <div className="repeto-task-mobile-modal__panel">
                        <div className="repeto-task-mobile-modal__head">
                            <h2 id="repeto-task-mobile-title" className="repeto-task-mobile-modal__title">
                                Задачи
                            </h2>
                            <button
                                type="button"
                                className="repeto-task-mobile-modal__close"
                                aria-label="Закрыть"
                                onClick={() => setMobileOpen(false)}
                            >
                                <Icon data={Xmark as IconData} size={18} />
                            </button>
                        </div>
                        <div className="repeto-task-mobile-modal__list">
                            {taskItems.map((task) => (
                                <Tile
                                    key={`${task.href}-${task.title}`}
                                    {...task}
                                    className="repeto-task-tile--modal"
                                    onClick={() => setMobileOpen(false)}
                                />
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </section>
    );
};

export default TaskTiles;
