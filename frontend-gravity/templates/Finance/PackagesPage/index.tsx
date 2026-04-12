import { useState } from "react";
import GravityLayout from "@/components/GravityLayout";
import { Text, Card, Button, Icon, Label, SegmentedRadioGroup } from "@gravity-ui/uikit";
import { Plus } from "@gravity-ui/icons";
import type { IconData } from "@gravity-ui/uikit";
import CreatePackageModal from "@/components/CreatePackageModal";
import { usePackages } from "@/hooks/usePackages";
import { getPackageStatusLabel } from "@/mocks/packages";
import { getInitials } from "@/mocks/students";
import type { LessonPackage } from "@/types/package";

const tabOptions = [
    { value: "all", content: "Все" },
    { value: "active", content: "Активные" },
    { value: "completed", content: "Завершённые" },
];

function statusTheme(status: string): "success" | "danger" | "normal" | "info" {
    if (status === "active") return "success";
    if (status === "expired" || status === "cancelled") return "danger";
    if (status === "completed") return "normal";
    return "info";
}

function progressColor(used: number, total: number): string {
    const pct = total > 0 ? used / total : 0;
    if (pct < 0.5) return "#2ca84a";
    if (pct < 0.8) return "#c9a225";
    return "#d14343";
}

const PackagesPage = () => {
    const [tab, setTab] = useState("all");
    const [createModal, setCreateModal] = useState(false);
    const [editingPackage, setEditingPackage] = useState<LessonPackage | null>(null);

    const { data: packagesData, loading, refetch } = usePackages({
        status: tab === "all" ? undefined : tab,
        limit: 50,
    });
    const filtered = [...(packagesData?.data || [])].sort((a, b) => {
        const aTime = a.createdAtValue ? new Date(a.createdAtValue).getTime() : 0;
        const bTime = b.createdAtValue ? new Date(b.createdAtValue).getTime() : 0;
        if (aTime !== bTime) return bTime - aTime;
        return b.id.localeCompare(a.id);
    });

    const handlePackageCreated = () => {
        setTab("all");
        setEditingPackage(null);
        refetch();
    };

    return (
        <GravityLayout title="Пакеты занятий">
            <div className="repeto-students-toolbar">
                <SegmentedRadioGroup
                    size="m"
                    value={tab}
                    onUpdate={setTab}
                    options={tabOptions}
                />
                <Button view="action" size="m" onClick={() => setCreateModal(true)}>
                    <Icon data={Plus as IconData} size={16} />
                    Новый пакет
                </Button>
            </div>
            <Text variant="caption-2" color="secondary" style={{ display: "block", marginBottom: 10 }}>
                Сортировка: сначала новые (по дате создания).
            </Text>

            {loading ? (
                <Card view="outlined" style={{ padding: "40px 24px", textAlign: "center", background: "var(--g-color-base-float)" }}>
                    <Text color="secondary">Загрузка...</Text>
                </Card>
            ) : filtered.length === 0 ? (
                <Card view="outlined" style={{ padding: "48px 24px", textAlign: "center", background: "var(--g-color-base-float)" }}>
                    <Text variant="subheader-2" style={{ display: "block", marginBottom: 8 }}>Пакетов пока нет</Text>
                    <Text variant="body-1" color="secondary" style={{ display: "block", marginBottom: 16 }}>
                        Создайте пакет занятий для ученика.
                    </Text>
                    <Button view="action" size="m" onClick={() => setCreateModal(true)}>
                        Новый пакет
                    </Button>
                </Card>
            ) : (
                <Card view="outlined" style={{ background: "var(--g-color-base-float)", overflow: "hidden" }}>
                    {filtered.map((pkg, i) => (
                        <div
                            key={pkg.id}
                            onClick={() => setEditingPackage(pkg)}
                            style={{
                                display: "flex",
                                alignItems: "center",
                                padding: "14px 20px",
                                borderTop: i > 0 ? "1px solid var(--g-color-line-generic)" : undefined,
                                cursor: "pointer",
                                transition: "background 0.15s",
                            }}
                            onMouseEnter={(e) => (e.currentTarget.style.background = "var(--g-color-base-simple-hover)")}
                            onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                        >
                            <div
                                style={{
                                    width: 36,
                                    height: 36,
                                    borderRadius: "50%",
                                    background: "rgba(174,122,255,0.1)",
                                    color: "var(--g-color-text-brand)",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    fontWeight: 700,
                                    fontSize: 13,
                                    flexShrink: 0,
                                    marginRight: 12,
                                }}
                            >
                                {getInitials(pkg.studentName)}
                            </div>
                            <div style={{ flex: 1, minWidth: 0, marginRight: 16 }}>
                                <Text variant="body-1" style={{ fontWeight: 600 }}>{pkg.studentName}</Text>
                                <Text variant="caption-2" color="secondary" style={{ display: "block" }}>{pkg.subject}</Text>
                            </div>
                            <div style={{ flexShrink: 0, width: 80, marginRight: 16 }}>
                                <div style={{ height: 4, background: "var(--g-color-base-generic)", borderRadius: 2, overflow: "hidden" }}>
                                    <div
                                        style={{
                                            height: "100%",
                                            borderRadius: 2,
                                            background: progressColor(pkg.lessonsUsed, pkg.lessonsTotal),
                                            width: `${(pkg.lessonsUsed / pkg.lessonsTotal) * 100}%`,
                                        }}
                                    />
                                </div>
                            </div>
                            <Text variant="body-1" style={{ flexShrink: 0, width: 60, fontVariantNumeric: "tabular-nums" }}>
                                {pkg.lessonsUsed}/{pkg.lessonsTotal}
                            </Text>
                            <Text variant="body-1" style={{ flexShrink: 0, width: 80, textAlign: "right", fontWeight: 600, fontVariantNumeric: "tabular-nums", marginRight: 16 }}>
                                {pkg.totalPrice.toLocaleString("ru-RU")} ₽
                            </Text>
                            <Text variant="caption-2" color="secondary" style={{ flexShrink: 0, width: 80, textAlign: "center" }}>
                                {pkg.validUntil || "—"}
                            </Text>
                            <div style={{ flexShrink: 0, width: 90, textAlign: "right", marginLeft: 16 }}>
                                <Label theme={statusTheme(pkg.status)} size="s">
                                    {getPackageStatusLabel(pkg.status)}
                                </Label>
                            </div>
                        </div>
                    ))}
                </Card>
            )}

            <CreatePackageModal
                visible={createModal || !!editingPackage}
                onClose={() => { setCreateModal(false); setEditingPackage(null); }}
                onCreated={handlePackageCreated}
                packageData={editingPackage}
            />
        </GravityLayout>
    );
};

export default PackagesPage;
