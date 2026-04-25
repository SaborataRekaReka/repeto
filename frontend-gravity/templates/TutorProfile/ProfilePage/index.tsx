import Link from "next/link";
import Layout from "@/components/Layout";
import Icon from "@/components/Icon";
import { getInitials } from "@/lib/formatters";
import { useAuth } from "@/contexts/AuthContext";
import { useDashboardStats } from "@/hooks/useDashboard";
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    Tooltip,
    ResponsiveContainer,
} from "recharts";

const activityData = [
    { day: "Пн", lessons: 5 },
    { day: "Вт", lessons: 4 },
    { day: "Ср", lessons: 6 },
    { day: "Чт", lessons: 3 },
    { day: "Пт", lessons: 5 },
    { day: "Сб", lessons: 2 },
    { day: "Вс", lessons: 0 },
];

const TutorProfilePage = () => {
    const { user } = useAuth();
    const { data: dashStats } = useDashboardStats();

    const stats = [
        { label: "Активных учеников", value: String(dashStats?.activeStudents ?? "—") },
        { label: "Занятий за месяц", value: String(dashStats?.lessonsThisMonth ?? "—") },
        { label: "Доход за месяц", value: dashStats ? `${dashStats.incomeThisMonth.toLocaleString("ru-RU")} ₽` : "—" },
        { label: "С нами", value: "—" },
    ];
    return (
        <Layout title="Профиль">
            <div className="flex lg:flex-col-reverse pt-4">
                <div className="w-[calc(100%-20rem)] pr-[6.625rem] 4xl:w-[calc(100%-14.7rem)] 2xl:pr-20 xl:pr-12 lg:w-full lg:pr-0">
                    <div className="card mb-6">
                        <div className="card-title">Статистика</div>
                        <div className="p-5">
                            <div className="grid grid-cols-4 gap-4 md:grid-cols-2">
                                {stats.map((stat, i) => (
                                    <div
                                        key={i}
                                        className="p-4 border-2 border-n-1 rounded-xl dark:border-white"
                                    >
                                        <div className="text-h4">
                                            {stat.value}
                                        </div>
                                        <div className="mt-1 text-xs text-n-3 dark:text-white/50">
                                            {stat.label}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                    <div className="card">
                        <div className="card-title">
                            Активность за последние 7 дней
                        </div>
                        <div className="p-5">
                            <div className="h-[200px]">
                                <ResponsiveContainer
                                    width="100%"
                                    height="100%"
                                >
                                    <BarChart data={activityData}>
                                        <XAxis
                                            dataKey="day"
                                            tick={{
                                                fontSize: 12,
                                                fontWeight: 700,
                                            }}
                                            axisLine={false}
                                            tickLine={false}
                                        />
                                        <YAxis
                                            tick={{
                                                fontSize: 12,
                                            }}
                                            axisLine={false}
                                            tickLine={false}
                                        />
                                        <Tooltip
                                            formatter={(value: number) => [
                                                value,
                                                "занятий",
                                            ]}
                                        />
                                        <Bar
                                            dataKey="lessons"
                                            fill="var(--accent)"
                                            radius={[8, 8, 0, 0]}
                                        />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="shrink-0 w-[20rem] 4xl:w-[14.7rem] lg:w-full lg:mb-8">
                    <div className="card">
                        <div className="p-5">
                            <div className="flex items-center justify-center w-[7.5rem] h-[7.5rem] mx-auto mb-4 rounded-full bg-purple-3 text-2xl font-bold text-n-1 dark:bg-purple-1/20">
                                {getInitials(user?.name || "")}
                            </div>
                            <div className="text-center">
                                <div className="text-h5">
                                    {user?.name || ""}
                                </div>
                                <div className="mt-1 text-xs text-n-3 dark:text-white/50">
                                    {user?.email || ""}
                                </div>
                                <div className="flex flex-wrap justify-center gap-1.5 mt-3">
                                    {(user?.subjects || []).map((s) => (
                                        <span
                                            key={s}
                                            className="label-stroke text-xs"
                                        >
                                            {s}
                                        </span>
                                    ))}
                                </div>
                                {user?.about && (
                                    <div className="mt-4 pt-4 border-t border-dashed border-n-1 text-sm text-left dark:border-white">
                                        {user.about}
                                    </div>
                                )}
                            </div>
                            <div className="mt-5 pt-5 border-t border-dashed border-n-1 dark:border-white">
                                <Link
                                    href="/settings"
                                    className="btn-purple btn-medium w-full inline-flex items-center justify-center"
                                >
                                    <Icon name="setup" />
                                    <span>Настройки</span>
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </Layout>
    );
};

export default TutorProfilePage;
