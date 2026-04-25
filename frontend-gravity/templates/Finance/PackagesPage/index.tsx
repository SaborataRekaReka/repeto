import { useState, useMemo } from "react";
import {
    Text,
    Button,
    Icon,
    TextInput,
    Loader,
} from "@gravity-ui/uikit";
import {
    Magnifier,
    ObjectAlignJustifyVertical,
} from "@gravity-ui/icons";
import type { IconData } from "@gravity-ui/uikit";
import GravityLayout from "@/components/GravityLayout";
import PageOverlay from "@/components/PageOverlay";
import StudentNameWithBadge from "@/components/StudentNameWithBadge";
import StudentAvatar from "@/components/StudentAvatar";
import CreatePackageModal from "@/components/CreatePackageModal";
import { usePackages } from "@/hooks/usePackages";
import PillTabs from "@/components/PillTabs";
import { getPackageStatusLabel } from "@/mocks/packages";
import type { LessonPackage } from "@/types/package";

const filterTabs: { value: string; label: string }[] = [
    { value: "all", label: "Все" },
    { value: "active", label: "Активные" },
    { value: "completed", label: "Завершённые" },
    { value: "expired", label: "Истекли" },
];

const packageTypeTabs: Array<{ value: "private" | "public"; label: string }> = [
    { value: "private", label: "Обычные пакеты" },
    { value: "public", label: "Публичные пакеты" },
];

function statusChipClass(status: string): string {
    if (status === "active") return "repeto-sl-cell-chip--active";
    if (status === "expired") return "repeto-sl-cell-chip--paused";
    return "repeto-sl-cell-chip--archived";
}

function progressColor(used: number, total: number): string {
    const pct = total > 0 ? used / total : 0;
    if (pct < 0.5) return "#2ca84a";
    if (pct < 0.8) return "#c9a225";
    return "#d14343";
}

const PackagesPage = () => {
    const [tab, setTab] = useState<string>("all");
    const [packageType, setPackageType] = useState<"private" | "public">("private");
    const [search, setSearch] = useState<string>("");
    const [createModal, setCreateModal] = useState<boolean>(false);
    const [editingPackage, setEditingPackage] = useState<LessonPackage | null>(null);

    const { data: packagesData, loading, refetch } = usePackages({
        status: tab === "all" ? undefined : tab,
        limit: 50,
    });

    const { data: allPackagesData, refetch: refetchAllPackages } = usePackages({ limit: 1000 });
    const { packageTypeCounts, statusStats } = useMemo(() => {
        const all = allPackagesData?.data || [];
        const privatePackages = all.filter((p) => !p.isPublic);
        const publicPackages = all.filter((p) => !!p.isPublic);
        const scopedPackages = packageType === "public" ? publicPackages : privatePackages;

        return {
            packageTypeCounts: {
                private: privatePackages.length,
                public: publicPackages.length,
            },
            statusStats: {
                total: scopedPackages.length,
                active: scopedPackages.filter((p) => p.status === "active").length,
                completed: scopedPackages.filter((p) => p.status === "completed").length,
                expired: scopedPackages.filter((p) => p.status === "expired").length,
            },
        };
    }, [allPackagesData, packageType]);

    const filtered = [...(packagesData?.data || [])]
        .filter((p) => (packageType === "public" ? !!p.isPublic : !p.isPublic))
        .filter((p) => {
            if (!search) return true;
            const q = search.toLowerCase();
            return (
                p.studentName.toLowerCase().includes(q) ||
                (p.subject || "").toLowerCase().includes(q)
            );
        })
        .sort((a, b) => {
            const aTime = a.createdAtValue ? new Date(a.createdAtValue).getTime() : 0;
            const bTime = b.createdAtValue ? new Date(b.createdAtValue).getTime() : 0;
            if (aTime !== bTime) return bTime - aTime;
            return b.id.localeCompare(a.id);
        });

    const hasSearch = search.trim().length > 0;
    const isPublicPackagesTab = packageType === "public";

    const openCreatePackage = () => {
        setEditingPackage(null);
        setCreateModal(true);
    };

    const handlePackageCreated = async () => {
        setEditingPackage(null);
        setCreateModal(false);
        await Promise.all([refetch(), refetchAllPackages()]);
    };

    const overlayNav = [
        {
            key: "create",
            label: "Новый пакет",
            icon: ObjectAlignJustifyVertical as IconData,
        },
    ];

    const handleOverlayNav = (key: string) => {
        if (key === "create") {
            openCreatePackage();
        }
    };

    return (
        <GravityLayout title="Пакеты">
            <PageOverlay
                title="Пакеты"
                breadcrumb="Дашборд"
                backHref="/dashboard"
                nav={overlayNav}
                onNavChange={handleOverlayNav}
            >
                <div className="repeto-packages-type-tabs" role="tablist" aria-label="Тип пакетов">
                    {packageTypeTabs.map((typeTab) => {
                        const isActive = packageType === typeTab.value;
                        return (
                            <button
                                key={typeTab.value}
                                type="button"
                                role="tab"
                                aria-selected={isActive}
                                className={`repeto-packages-type-tab${
                                    isActive ? " repeto-packages-type-tab--active" : ""
                                }`}
                                onClick={() => setPackageType(typeTab.value)}
                            >
                                <span>{typeTab.label}</span>
                                <span className="repeto-packages-type-tab__count">
                                    {packageTypeCounts[typeTab.value]}
                                </span>
                            </button>
                        );
                    })}
                </div>

                <div className="repeto-sl-search-row">
                    <TextInput
                        size="l"
                        placeholder="Ученик или предмет"
                        value={search}
                        onUpdate={setSearch}
                        className="repeto-sl-search"
                        startContent={
                            <Icon
                                data={Magnifier as IconData}
                                size={16}
                                style={{
                                    color: "var(--g-color-text-hint)",
                                    marginLeft: 6,
                                    marginRight: 4,
                                }}
                            />
                        }
                    />
                </div>

                <div className="repeto-sl-tabs-row">
                    <PillTabs
                        value={tab}
                        onChange={(v) => setTab(v)}
                        options={filterTabs.map((t) => ({
                            value: t.value,
                            label: t.label,
                            count:
                                t.value === "all"
                                    ? statusStats.total
                                    : t.value === "active"
                                    ? statusStats.active
                                    : t.value === "completed"
                                    ? statusStats.completed
                                    : statusStats.expired,
                        }))}
                        ariaLabel="Фильтр пакетов"
                    />
                </div>

                {loading ? (
                    <div style={{ padding: "64px 0", textAlign: "center" }}>
                        <Loader size="m" />
                    </div>
                ) : filtered.length === 0 ? (
                    <div className="repeto-sl-empty">
                        <Text variant="subheader-2" style={{ marginBottom: 8, display: "block" }}>
                            {hasSearch ? "Ничего не найдено" : "Пакетов пока нет"}
                        </Text>
                        <Text variant="body-1" color="secondary" style={{ marginBottom: 24, display: "block" }}>
                            {hasSearch
                                ? "Попробуйте изменить запрос или очистить поиск."
                                : "Создайте пакет занятий для ученика — это удобно для оптовых договорённостей."}
                        </Text>
                        {hasSearch && (
                            <Button view="outlined" size="l" onClick={() => setSearch("")}>Очистить поиск</Button>
                        )}
                    </div>
                ) : (
                    <div className="repeto-sl-table">
                        <div
                            className={`repeto-sl-list-header repeto-sl-list-header--packages${
                                isPublicPackagesTab ? " repeto-sl-list-header--packages-public" : ""
                            }`}
                        >
                            <span className="repeto-sl-lh__col">Ученик</span>
                            {!isPublicPackagesTab && <span className="repeto-sl-lh__col">Прогресс</span>}
                            <span className="repeto-sl-lh__col">Занятия</span>
                            <span className="repeto-sl-lh__col repeto-sl-lh__col--rate">Сумма</span>
                            {!isPublicPackagesTab && <span className="repeto-sl-lh__col">Действует до</span>}
                            <span className="repeto-sl-lh__col">Статус</span>
                            <span className="repeto-sl-lh__col">&nbsp;</span>
                        </div>

                        <div className="repeto-sl-list">
                            {filtered.map((pkg) => {
                                const pct = pkg.lessonsTotal > 0
                                    ? Math.min(100, (pkg.lessonsUsed / pkg.lessonsTotal) * 100)
                                    : 0;
                                return (
                                    <div
                                        key={pkg.id}
                                        className={`repeto-sl-row repeto-sl-row--packages${
                                            isPublicPackagesTab ? " repeto-sl-row--packages-public" : ""
                                        }`}
                                        onClick={() => {
                                            setEditingPackage(pkg);
                                        }}
                                    >
                                        <div className="repeto-sl-row__cell repeto-sl-row__cell--name">
                                            <StudentAvatar
                                                student={{ name: pkg.studentName, avatarUrl: undefined }}
                                                size="s"
                                                style={{ marginRight: 10, flexShrink: 0 }}
                                            />
                                            <div className="repeto-sl-row__name-text">
                                                <span className="repeto-sl-row__primary">
                                                    <StudentNameWithBadge
                                                        name={pkg.studentName}
                                                        hasRepetoAccount={Boolean(pkg.studentAccountId)}
                                                        truncate
                                                    />
                                                </span>
                                                <span className="repeto-sl-row__secondary">{pkg.subject}</span>
                                            </div>
                                        </div>
                                        {!isPublicPackagesTab && (
                                            <div className="repeto-sl-row__cell">
                                                <div className="repeto-sl-progress">
                                                    <div
                                                        className="repeto-sl-progress__bar"
                                                        style={{
                                                            width: `${pct}%`,
                                                            background: progressColor(pkg.lessonsUsed, pkg.lessonsTotal),
                                                        }}
                                                    />
                                                </div>
                                            </div>
                                        )}
                                        <div className="repeto-sl-row__cell">
                                            <span className="repeto-sl-cell-money">
                                                {pkg.lessonsUsed}/{pkg.lessonsTotal}
                                            </span>
                                        </div>
                                        <div className="repeto-sl-row__cell repeto-sl-row__cell--rate">
                                            <span className="repeto-sl-cell-money">
                                                {pkg.totalPrice.toLocaleString("ru-RU")}&nbsp;₽
                                            </span>
                                        </div>
                                        {!isPublicPackagesTab && (
                                            <div className="repeto-sl-row__cell">
                                                <span className="repeto-sl-row__secondary">
                                                    {pkg.validUntil || "—"}
                                                </span>
                                            </div>
                                        )}
                                        <div className="repeto-sl-row__cell">
                                            <span className={`repeto-sl-cell-chip ${statusChipClass(pkg.status)}`}>
                                                {getPackageStatusLabel(pkg.status)}
                                            </span>
                                        </div>
                                        <div className="repeto-sl-row__cell repeto-sl-row__cell--actions">
                                            &nbsp;
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
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
                    defaultPublic={false}
                />
            </PageOverlay>
        </GravityLayout>
    );
};

export default PackagesPage;
