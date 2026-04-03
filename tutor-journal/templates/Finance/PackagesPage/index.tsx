import { useState } from "react";
import { useMediaQuery } from "react-responsive";
import Layout from "@/components/Layout";
import Tabs from "@/components/Tabs";
import Icon from "@/components/Icon";
import TablePagination from "@/components/TablePagination";
import CreatePackageModal from "@/components/CreatePackageModal";
import { useHydrated } from "@/hooks/useHydrated";
import { getInitials, getSubjectBgColor } from "@/mocks/students";
import {
    packages,
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
    const { mounted } = useHydrated();
    const isTablet = useMediaQuery({ query: "(max-width: 1023px)" });

    const filtered =
        tab === "all"
            ? packages
            : packages.filter((p) =>
                  tab === "completed"
                      ? p.status === "completed" || p.status === "expired"
                      : p.status === tab
              );

    return (
        <Layout title="Пакеты занятий">
            <Tabs
                className="mb-6"
                items={tabs}
                value={tab}
                setValue={setTab}
            />
            <div className="flex items-center justify-between mb-6">
                <button
                    className="btn-purple btn-small"
                    onClick={() => setCreateModal(true)}
                >
                    <Icon name="add-circle" />
                    <span>Новый пакет</span>
                </button>
            </div>

            {filtered.length === 0 ? (
                <div className="card px-5 py-12 text-center">
                    <div className="mb-2 text-h5">Пакетов нет</div>
                    <div className="text-sm text-n-3 dark:text-white/50">
                        Создайте пакет занятий для ученика
                    </div>
                </div>
            ) : mounted && isTablet ? (
                <div className="space-y-3">
                    {filtered.map((pkg) => (
                        <PackageCard key={pkg.id} pkg={pkg} />
                    ))}
                </div>
            ) : (
                <div className="card">
                    <table className="table-custom">
                        <thead>
                            <tr>
                                <th className="th-custom">Ученик</th>
                                <th className="th-custom">Предмет</th>
                                <th className="th-custom">Прогресс</th>
                                <th className="th-custom text-right">
                                    Сумма
                                </th>
                                <th className="th-custom lg:hidden">
                                    Действует до
                                </th>
                                <th className="th-custom">Статус</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.map((pkg) => (
                                <tr key={pkg.id}>
                                    <td className="td-custom">
                                        <div className="flex items-center">
                                            <div
                                                className={`flex items-center justify-center w-8 h-8 mr-3 rounded-full text-xs font-bold text-n-1 ${getSubjectBgColor(
                                                    pkg.subject
                                                )}`}
                                            >
                                                {getInitials(pkg.studentName)}
                                            </div>
                                            <span className="text-sm font-bold">
                                                {pkg.studentName}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="td-custom text-sm">
                                        {pkg.subject}
                                    </td>
                                    <td className="td-custom">
                                        <div className="flex items-center gap-2">
                                            <div className="w-20 h-2 bg-n-4/50 rounded-full overflow-hidden dark:bg-white/10">
                                                <div
                                                    className={`h-full rounded-full ${getProgressColor(
                                                        pkg.lessonsUsed,
                                                        pkg.lessonsTotal
                                                    )}`}
                                                    style={{
                                                        width: `${
                                                            (pkg.lessonsUsed /
                                                                pkg.lessonsTotal) *
                                                            100
                                                        }%`,
                                                    }}
                                                ></div>
                                            </div>
                                            <span className="text-xs font-bold">
                                                {pkg.lessonsUsed}/
                                                {pkg.lessonsTotal}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="td-custom text-sm font-bold text-right">
                                        {pkg.totalPrice.toLocaleString("ru-RU")}{" "}
                                        ₽
                                    </td>
                                    <td className="td-custom text-sm lg:hidden">
                                        {pkg.validUntil}
                                    </td>
                                    <td className="td-custom">
                                        <span
                                            className={`px-2 py-0.5 text-xs font-bold ${getPackageStatusColor(
                                                pkg.status
                                            )}`}
                                        >
                                            {getPackageStatusLabel(pkg.status)}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
            <CreatePackageModal
                visible={createModal}
                onClose={() => setCreateModal(false)}
            />
        </Layout>
    );
};

const PackageCard = ({ pkg }: { pkg: LessonPackage }) => {
    const remaining = pkg.lessonsTotal - pkg.lessonsUsed;
    return (
        <div className="card p-5">
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
                <div className="w-full h-2 bg-n-4/50 rounded-full overflow-hidden dark:bg-white/10">
                    <div
                        className={`h-full rounded-full ${getProgressColor(
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
                    {pkg.totalPrice.toLocaleString("ru-RU")} ₽ · до{" "}
                    {pkg.validUntil}
                </span>
            </div>
        </div>
    );
};

export default PackagesPage;
