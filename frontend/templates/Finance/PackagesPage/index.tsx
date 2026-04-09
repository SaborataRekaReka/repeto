import { useState } from "react";
import { useMediaQuery } from "react-responsive";
import Layout from "@/components/Layout";
import Tabs from "@/components/Tabs";
import Icon from "@/components/Icon";
import Empty from "@/components/Empty";
import CreatePackageModal from "@/components/CreatePackageModal";
import { useHydrated } from "@/hooks/useHydrated";
import { getInitials, getSubjectBgColor } from "@/mocks/students";
import { usePackages } from "@/hooks/usePackages";
import {
    getPackageStatusLabel,
    getPackageStatusColor,
    getProgressColor,
} from "@/mocks/packages";
import type { LessonPackage } from "@/types/package";

const tabs = [
    { title: "Все", value: "all" },
    { title: "Активные", value: "active" },
    { title: "Завершённые", value: "completed" },
];

const PackagesPage = () => {
    const [tab, setTab] = useState("all");
    const [createModal, setCreateModal] = useState(false);
    const [editingPackage, setEditingPackage] = useState<LessonPackage | null>(
        null
    );
    const { mounted } = useHydrated();
    const isTablet = useMediaQuery({ query: "(max-width: 1023px)" });

    const { data: packagesData, loading, refetch } = usePackages({
        status: tab === "all" ? undefined : tab,
        limit: 50,
    });
    const filtered = packagesData?.data || [];

    const handlePackageCreated = () => {
        setTab("all");
        setEditingPackage(null);
        refetch();
    };

    return (
        <Layout title="Пакеты занятий">
            <div className="flex items-center justify-between mb-6">
                <Tabs
                    items={tabs}
                    value={tab}
                    setValue={setTab}
                />
                <button
                    className="btn-purple btn-small shrink-0 ml-4"
                    onClick={() => setCreateModal(true)}
                >
                    <Icon name="add-circle" />
                    <span>Новый пакет</span>
                </button>
            </div>

            {loading ? (
                <div className="px-5 py-10 text-center text-n-3">Загрузка...</div>
            ) : filtered.length === 0 ? (
                <Empty
                    title="Пакетов пока нет"
                    content="Создайте пакет занятий для ученика, чтобы отслеживать оплаченные и оставшиеся уроки."
                    buttonText="Новый пакет"
                    onClick={() => setCreateModal(true)}
                />
            ) : mounted && isTablet ? (
                <div className="space-y-3">
                    {filtered.map((pkg) => (
                        <PackageCard
                            key={pkg.id}
                            pkg={pkg}
                            onClick={() => setEditingPackage(pkg)}
                        />
                    ))}
                </div>
            ) : (
                <div className="card">
                    {filtered.map((pkg) => (
                        <PackageRow
                            key={pkg.id}
                            pkg={pkg}
                            onClick={() => setEditingPackage(pkg)}
                        />
                    ))}
                </div>
            )}
            <CreatePackageModal
                visible={createModal || !!editingPackage}
                onClose={() => {
                    setCreateModal(false);
                    setEditingPackage(null);
                }}
                onCreated={handlePackageCreated}
                packageData={editingPackage}
            />
        </Layout>
    );
};

const PackageRow = ({
    pkg,
    onClick,
}: {
    pkg: LessonPackage;
    onClick: () => void;
}) => {
    return (
        <div
            className="flex items-center border-t border-n-1 px-5 py-4.5 cursor-pointer transition-colors hover:bg-n-3/10 dark:border-white dark:hover:bg-white/5"
            onClick={onClick}
        >
            <div
                className={`flex items-center justify-center shrink-0 w-8 h-8 mr-3 rounded-full text-xs font-bold text-n-1 ${getSubjectBgColor(
                    pkg.subject
                )}`}
            >
                {getInitials(pkg.studentName)}
            </div>
            <div className="grow mr-4">
                <div className="text-sm font-bold">{pkg.studentName}</div>
                <div className="text-xs text-n-3 dark:text-white/50">
                    {pkg.subject}
                </div>
            </div>
            <div
                className="relative shrink-0 w-18 h-1 mr-4 2xl:hidden"
                style={{
                    backgroundColor:
                        getProgressColor(pkg.lessonsUsed, pkg.lessonsTotal) ===
                        "bg-green-1"
                            ? "#98E9AB"
                            : getProgressColor(
                                  pkg.lessonsUsed,
                                  pkg.lessonsTotal
                              ) === "bg-yellow-1"
                            ? "#F5D565"
                            : "#E99898",
                }}
            >
                <div
                    className="absolute left-0 top-0 bottom-0 bg-n-1/30"
                    style={{
                        width: `${
                            (pkg.lessonsUsed / pkg.lessonsTotal) * 100
                        }%`,
                    }}
                ></div>
            </div>
            <div className="shrink-0 w-[4rem] mr-4 text-xs font-bold md:hidden">
                <Icon className="mr-1 inline dark:fill-white" name="tasks" />
                {pkg.lessonsUsed}/{pkg.lessonsTotal}
            </div>
            <div className="shrink-0 w-[5.5rem] mr-4 text-sm font-bold text-right md:hidden">
                {pkg.totalPrice.toLocaleString("ru-RU")} ₽
            </div>
            <div className="label-stroke shrink-0 w-[7rem] text-center mr-4 lg:hidden">
                {pkg.validUntil || "—"}
            </div>
            <span
                className={`shrink-0 w-[5.5rem] text-center px-2 py-0.5 text-xs font-bold ${getPackageStatusColor(
                    pkg.status
                )}`}
            >
                {getPackageStatusLabel(pkg.status)}
            </span>
        </div>
    );
};

const PackageCard = ({
    pkg,
    onClick,
}: {
    pkg: LessonPackage;
    onClick: () => void;
}) => {
    return (
        <div
            className="card p-5 cursor-pointer hover:border-purple-1/50 transition-colors"
            onClick={onClick}
        >
            <div className="flex items-center mb-3">
                <div
                    className={`flex items-center justify-center w-10 h-10 mr-3 rounded-full text-sm font-bold text-n-1 ${getSubjectBgColor(
                        pkg.subject
                    )}`}
                >
                    {getInitials(pkg.studentName)}
                </div>
                <div>
                    <div className="text-sm font-bold">{pkg.studentName}</div>
                    <div className="text-xs text-n-3 dark:text-white/50">
                        {pkg.subject}
                    </div>
                </div>
                <span
                    className={`ml-auto px-2 py-0.5 text-xs font-bold ${getPackageStatusColor(
                        pkg.status
                    )}`}
                >
                    {getPackageStatusLabel(pkg.status)}
                </span>
            </div>
            <div className="mb-2">
                <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-n-3 dark:text-white/50">
                        Прогресс
                    </span>
                    <span className="text-xs font-bold">
                        {pkg.lessonsUsed}/{pkg.lessonsTotal} занятий
                    </span>
                </div>
                <div className="w-full h-1 bg-n-4/50 overflow-hidden dark:bg-white/10">
                    <div
                        className={`h-full ${getProgressColor(
                            pkg.lessonsUsed,
                            pkg.lessonsTotal
                        )}`}
                        style={{
                            width: `${
                                (pkg.lessonsUsed / pkg.lessonsTotal) * 100
                            }%`,
                        }}
                    ></div>
                </div>
            </div>
            <div className="flex items-center justify-between text-sm">
                <span>
                    {pkg.totalPrice.toLocaleString("ru-RU")} ₽
                </span>
                <div className="label-stroke">
                    до {pkg.validUntil}
                </div>
            </div>
        </div>
    );
};

export default PackagesPage;
