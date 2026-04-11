import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import GravityLayout from "@/components/GravityLayout";
import { Text, Card, Button, Icon, TextInput, Label, Modal, SegmentedRadioGroup } from "@gravity-ui/uikit";
import { Plus, Magnifier } from "@gravity-ui/icons";
import type { IconData } from "@gravity-ui/uikit";
import CreatePaymentModal from "@/components/CreatePaymentModal";
import { usePayments } from "@/hooks/usePayments";
import { getMethodLabel, getStatusLabel } from "@/mocks/finance-tutor";
import type { Payment } from "@/types/finance";

const tabOptions = [
    { value: "all", content: "Все" },
    { value: "paid", content: "Оплачено" },
];

const PaymentsListPage = () => {
    const router = useRouter();
    const [tab, setTab] = useState("all");
    const [search, setSearch] = useState("");
    const [selected, setSelected] = useState<Payment | null>(null);
    const [createModal, setCreateModal] = useState(false);

    useEffect(() => {
        if (router.query.create === "1") {
            setCreateModal(true);
            router.replace("/payments", undefined, { shallow: true });
        }
    }, [router.query.create]);

    const { data: paymentsData, loading } = usePayments({
        status: tab === "all" ? undefined : tab,
        page: 1,
        limit: 50,
    });
    const filtered = (paymentsData?.data || []).filter((p) => {
        if (!search) return true;
        return p.studentName.toLowerCase().includes(search.toLowerCase());
    });

    return (
        <GravityLayout title="Оплаты">
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
                <SegmentedRadioGroup
                    size="m"
                    value={tab}
                    onUpdate={setTab}
                    options={tabOptions}
                />
                <div style={{ display: "flex", gap: 8 }}>
                    <Button view="action" size="m" onClick={() => setCreateModal(true)}>
                        <Icon data={Plus as IconData} size={16} />
                        Записать оплату
                    </Button>
                    <TextInput
                        size="m"
                        placeholder="Поиск..."
                        value={search}
                        onUpdate={setSearch}
                        startContent={<Icon data={Magnifier as IconData} size={16} />}
                        style={{ width: 220 }}
                    />
                </div>
            </div>

            {filtered.length === 0 ? (
                <Card view="outlined" style={{ padding: "48px 24px", textAlign: "center", background: "var(--g-color-base-float)" }}>
                    <Text variant="subheader-2" style={{ display: "block", marginBottom: 8 }}>Нет оплат</Text>
                    <Text variant="body-1" color="secondary" style={{ display: "block", marginBottom: 16 }}>
                        Здесь будут отображаться записи об оплатах.
                    </Text>
                    <Button view="action" size="m" onClick={() => setCreateModal(true)}>
                        Записать оплату
                    </Button>
                </Card>
            ) : (
                <Card view="outlined" style={{ background: "var(--g-color-base-float)", overflow: "hidden" }}>
                    <table style={{ width: "100%", borderCollapse: "collapse" }}>
                        <thead>
                            <tr style={{ borderBottom: "1px solid var(--g-color-line-generic)" }}>
                                {["Дата", "Ученик", "Сумма", "Способ", "Статус"].map((h) => (
                                    <th
                                        key={h}
                                        style={{
                                            padding: "10px 20px",
                                            textAlign: "left",
                                            fontWeight: 500,
                                            fontSize: 13,
                                            color: "var(--g-color-text-secondary)",
                                        }}
                                    >
                                        {h}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.map((p) => (
                                <tr
                                    key={p.id}
                                    onClick={() => setSelected(p)}
                                    style={{
                                        cursor: "pointer",
                                        borderBottom: "1px solid var(--g-color-line-generic)",
                                        transition: "background 0.15s",
                                    }}
                                    onMouseEnter={(e) => (e.currentTarget.style.background = "var(--g-color-base-simple-hover)")}
                                    onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                                >
                                    <td style={{ padding: "12px 20px" }}>
                                        <Text variant="body-1">{p.date}</Text>
                                    </td>
                                    <td style={{ padding: "12px 20px" }}>
                                        <Text variant="body-1" style={{ fontWeight: 600 }}>{p.studentName}</Text>
                                    </td>
                                    <td style={{ padding: "12px 20px" }}>
                                        <Text variant="body-1" style={{ fontWeight: 600, fontVariantNumeric: "tabular-nums" }}>
                                            {p.amount.toLocaleString("ru-RU")} ₽
                                        </Text>
                                    </td>
                                    <td style={{ padding: "12px 20px" }}>
                                        <Text variant="body-1">{getMethodLabel(p.method)}</Text>
                                    </td>
                                    <td style={{ padding: "12px 20px" }}>
                                        <Label theme="success" size="s">
                                            {getStatusLabel(p.status)}
                                        </Label>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </Card>
            )}

            {/* Detail modal */}
            <Modal open={!!selected} onClose={() => setSelected(null)}>
                <div style={{ padding: 24, minWidth: 360 }}>
                    <Text variant="subheader-2" style={{ display: "block", marginBottom: 20 }}>
                        Детали оплаты
                    </Text>
                    {selected && (
                        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                            <DetailRow label="Ученик" value={selected.studentName} bold />
                            <DetailRow label="Сумма" value={selected.amount.toLocaleString("ru-RU") + " ₽"} bold />
                            <DetailRow label="Дата" value={selected.date} />
                            <DetailRow label="Способ" value={getMethodLabel(selected.method)} />
                            <DetailRow label="Статус" value={getStatusLabel(selected.status)} />
                            {selected.comment && (
                                <DetailRow label="Комментарий" value={selected.comment} />
                            )}
                        </div>
                    )}
                    <div style={{ marginTop: 20, display: "flex", justifyContent: "flex-end" }}>
                        <Button view="normal" size="m" onClick={() => setSelected(null)}>
                            Закрыть
                        </Button>
                    </div>
                </div>
            </Modal>

            <CreatePaymentModal
                visible={createModal}
                onClose={() => setCreateModal(false)}
            />
        </GravityLayout>
    );
};

const DetailRow = ({ label, value, bold }: { label: string; value: string; bold?: boolean }) => (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <Text variant="body-1" color="secondary">{label}</Text>
        <Text variant="body-1" style={bold ? { fontWeight: 600 } : undefined}>{value}</Text>
    </div>
);

export default PaymentsListPage;
