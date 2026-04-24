import Link from "next/link";
import { useMemo } from "react";
import { useDebts, useExpiringPackages, useTodayLessons } from "@/hooks/useDashboard";

/**
 * Tochka-style "Задача" tiles row — three compact lavender cards summarising
 * the most actionable signals on the dashboard (debts, expiring packages,
 * next lesson). Links route to the relevant section.
 */
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

type TileProps = {
    href: string;
    kicker: string;
    title: string;
    meta: string;
    tone?: "default" | "urgent";
};

const Tile = ({ href, kicker, title, meta, tone = "default" }: TileProps) => (
    <Link
        href={href}
        className={`repeto-task-tile${tone === "urgent" ? " repeto-task-tile--urgent" : ""}`}
    >
        <span className="repeto-task-tile__kicker">{kicker}</span>
        <span className="repeto-task-tile__title">{title}</span>
        <span className="repeto-task-tile__meta">{meta}</span>
    </Link>
);

const TaskTiles = () => {
    const { data: debts = [] } = useDebts(20);
    const { data: packages = [] } = useExpiringPackages();
    const { data: todayLessons = [] } = useTodayLessons();

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
            count: todayLessons.length,
            upcomingCount: upcoming.length,
            nextTime: nextLesson?.startTime,
            nextStudent: nextLesson?.studentName,
        };
    }, [todayLessons]);

    const debtTile: TileProps = debtSummary.count > 0
        ? {
              href: "/payments",
              kicker: "Задача",
              title: "Напомните об оплате",
              meta: `${debtSummary.count} ${studentsWord(debtSummary.count)} · ${formatAmount(debtSummary.total)}`,
              tone: "urgent",
          }
        : {
              href: "/payments",
              kicker: "Всё хорошо",
              title: "Долгов нет",
              meta: "Ученики заплатили вовремя",
          };

    const packagesTile: TileProps = packagesSummary.count > 0
        ? {
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
          }
        : {
              href: "/packages",
              kicker: "Пакеты",
              title: "Все пакеты в норме",
              meta: "Истекающих нет",
          };

    const lessonsTile: TileProps = lessonsSummary.upcomingCount > 0
        ? {
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
          }
        : {
              href: "/schedule",
              kicker: "Сегодня",
              title: "Свободный день",
              meta: "Занятий не запланировано",
          };

    return (
        <div className="repeto-task-tiles">
            <Tile {...debtTile} />
            <Tile {...packagesTile} />
            <Tile {...lessonsTile} />
        </div>
    );
};

export default TaskTiles;
