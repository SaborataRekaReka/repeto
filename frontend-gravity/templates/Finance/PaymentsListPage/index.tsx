import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/router";
import {
    Alert,
    Text,
    Button,
    Icon,
    TextInput,
    Loader,
} from "@gravity-ui/uikit";
import { Magnifier, TrashBin } from "@gravity-ui/icons";
import type { IconData } from "@gravity-ui/uikit";
import GravityLayout from "@/components/GravityLayout";
import PageOverlay from "@/components/PageOverlay";
import AppDialog from "@/components/AppDialog";
import CreatePaymentModal from "@/components/CreatePaymentModal";
import StudentNameWithBadge from "@/components/StudentNameWithBadge";
import PillTabs from "@/components/PillTabs";
import { deletePayment, usePayments } from "@/hooks/usePayments";
import { getMethodLabel, getStatusLabel } from "@/mocks/finance-tutor";
import type { Payment } from "@/types/finance";
import { codedErrorMessage } from "@/lib/errorCodes";
import FinanceSidebarTools, { financeSectionNav } from "@/templates/Finance/FinanceSidebarTools";

const filterTabs: { value: string; label: string }[] = [
    { value: "all", label: "Все" },
    { value: "paid", label: "Оплачено" },
];

const PaymentsListPage = () => {
    const router = useRouter();
    const [tab, setTab] = useState<string>("all");
    const [search, setSearch] = useState<string>("");
    const [selected, setSelected] = useState<Payment | null>(null);
    const [pendingDelete, setPendingDelete] = useState<Payment | null>(null);
    const [createModal, setCreateModal] = useState<boolean>(false);
    const [deletingPaymentId, setDeletingPaymentId] = useState<string | null>(null);
    const [deleteError, setDeleteError] = useState<string | null>(null);

    useEffect(() => {
        if (router.query.create === "1") {
            setCreateModal(true);
            router.replace("/finance/payments", undefined, { shallow: true });
        }
    }, [router.query.create]);

    const { data: paymentsData, loading, refetch: refetchPayments } = usePayments({
        status: tab === "all" ? undefined : tab,
        page: 1,
        limit: 50,
    });

    // Separate request for totals across statuses
    const { data: allPaymentsData } = usePayments({ page: 1, limit: 1000 });
    const stats = useMemo(() => {
        const all = allPaymentsData?.data || [];
        return {
            total: all.length,
            paid: all.filter((p) => p.status === "paid").length,
        };
    }, [allPaymentsData]);

    const filtered = (paymentsData?.data || []).filter((p) => {
        if (!search) return true;
        return p.studentName.toLowerCase().includes(search.toLowerCase());
    });
    const hasSearch = search.trim().length > 0;

    const requestDeletePayment = (payment: Payment) => {
        if (!payment.isManual || deletingPaymentId) return;
        setDeleteError(null);
        setPendingDelete(payment);
    };

    const handleDeletePayment = async () => {
        if (!pendingDelete || deletingPaymentId) return;
        const payment = pendingDelete;
        setDeletingPaymentId(payment.id);
        try {
            await deletePayment(payment.id);
            if (selected?.id === payment.id) setSelected(null);
            setPendingDelete(null);
            await refetchPayments();
        } catch (error) {
            setDeleteError(codedErrorMessage("PAY-DEL", error));
        } finally {
            setDeletingPaymentId(null);
        }
    };

    const handleFinanceSectionChange = (key: string) => {
        if (key === "overview") {
            void router.push("/finance");
            return;
        }
        void router.push("/finance/payments");
    };

    return (
        <GravityLayout title="Финансы">
            <PageOverlay
                className="page-overlay--finance-dashboard-bg"
                title="Финансы"
                breadcrumb="Дашборд"
                backHref="/dashboard"
                nav={financeSectionNav}
                activeNav="payments"
                onNavChange={handleFinanceSectionChange}
                sidebarHeader={
                    <FinanceSidebarTools
                        onOpenDebtors={() => {
                            void router.push("/students?filter=debt");
                        }}
                    />
                }
            >
                <div className="repeto-sl-search-row">
                    <TextInput
                        size="l"
                        placeholder="Имя ученика"
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
                            count: t.value === "all" ? stats.total : stats.paid,
                        }))}
                        ariaLabel="Фильтр оплат"
                    />
                </div>

                {deleteError && (
                    <Alert
                        theme="danger"
                        view="filled"
                        corners="rounded"
                        title="Не удалось удалить оплату"
                        message={deleteError}
                        style={{ marginBottom: 12 }}
                    />
                )}

                {loading ? (
                    <div style={{ padding: "64px 0", textAlign: "center" }}>
                        <Loader size="m" />
                    </div>
                ) : filtered.length === 0 ? (
                    <div className="repeto-sl-empty">
                        <Text variant="subheader-2" style={{ marginBottom: 8, display: "block" }}>
                            {hasSearch ? "Ничего не найдено" : "Пока нет оплат"}
                        </Text>
                        <Text variant="body-1" color="secondary" style={{ marginBottom: 24, display: "block" }}>
                            {hasSearch
                                ? "Попробуйте изменить запрос или очистить поиск."
                                : "Записывайте оплаты, чтобы видеть историю и баланс учеников."}
                        </Text>
                        {hasSearch && (
                            <Button view="outlined" size="l" onClick={() => setSearch("")}>Очистить поиск</Button>
                        )}
                    </div>
                ) : (
                    <div className="repeto-sl-table">
                        <div className="repeto-sl-list-header repeto-sl-list-header--payments">
                            <span className="repeto-sl-lh__col">Дата</span>
                            <span className="repeto-sl-lh__col">Ученик</span>
                            <span className="repeto-sl-lh__col repeto-sl-lh__col--rate">Сумма</span>
                            <span className="repeto-sl-lh__col">Способ</span>
                            <span className="repeto-sl-lh__col">Статус</span>
                            <span className="repeto-sl-lh__col">&nbsp;</span>
                        </div>

                        <div className="repeto-sl-list">
                            {filtered.map((p) => (
                                <div
                                    key={p.id}
                                    className="repeto-sl-row repeto-sl-row--payments"
                                    onClick={() => setSelected(p)}
                                >
                                    <div className="repeto-sl-row__cell">
                                        <span className="repeto-sl-row__secondary" style={{ color: "var(--g-color-text-primary)" }}>
                                            {p.date}
                                        </span>
                                    </div>
                                    <div className="repeto-sl-row__cell">
                                        <span className="repeto-sl-row__primary">
                                            <StudentNameWithBadge
                                                name={p.studentName}
                                                hasRepetoAccount={Boolean(p.studentAccountId)}
                                                truncate
                                            />
                                        </span>
                                    </div>
                                    <div className="repeto-sl-row__cell repeto-sl-row__cell--rate">
                                        <span className="repeto-sl-cell-money">
                                            {p.amount.toLocaleString("ru-RU")}&nbsp;₽
                                        </span>
                                    </div>
                                    <div className="repeto-sl-row__cell">
                                        <span className="repeto-sl-cell-badge">{getMethodLabel(p.method)}</span>
                                    </div>
                                    <div className="repeto-sl-row__cell">
                                        <span
                                            className={`repeto-sl-cell-chip repeto-sl-cell-chip--${
                                                p.status === "paid" ? "active" : "paused"
                                            }`}
                                        >
                                            {getStatusLabel(p.status)}
                                        </span>
                                    </div>
                                    <div
                                        className="repeto-sl-row__cell repeto-sl-row__cell--actions"
                                        onClick={(e) => e.stopPropagation()}
                                    >
                                        {p.isManual ? (
                                            <button
                                                type="button"
                                                className="repeto-sl-row__menu-btn"
                                                title="Удалить оплату"
                                                aria-label="Удалить оплату"
                                                onClick={() => requestDeletePayment(p)}
                                                disabled={!!deletingPaymentId || !!pendingDelete}
                                            >
                                                <Icon data={TrashBin as IconData} size={16} />
                                            </button>
                                        ) : (
                                            <span style={{ color: "var(--g-color-text-hint)", fontSize: 12 }}>—</span>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                <AppDialog
                    open={!!pendingDelete}
                    onClose={() => { if (!deletingPaymentId) setPendingDelete(null); }}
                    size="s"
                    caption="Подтвердите удаление оплаты"
                    footer={{
                        onClickButtonApply: handleDeletePayment,
                        textButtonApply: "Удалить",
                        propsButtonApply: {
                            view: "outlined-danger",
                            loading: !!deletingPaymentId,
                            disabled: !!deletingPaymentId || !pendingDelete,
                        },
                        onClickButtonCancel: () => setPendingDelete(null),
                        textButtonCancel: "Отмена",
                        propsButtonCancel: { disabled: !!deletingPaymentId },
                    }}
                >
                    <Text variant="body-2" color="secondary">
                        {pendingDelete
                            ? `${pendingDelete.studentName}, ${pendingDelete.amount.toLocaleString("ru-RU")} ₽. Действие нельзя отменить.`
                            : "Действие нельзя отменить."}
                    </Text>
                </AppDialog>

                <CreatePaymentModal
                    visible={createModal || !!selected}
                    onClose={() => {
                        setCreateModal(false);
                        setSelected(null);
                    }}
                    paymentData={selected}
                    onCreated={async () => {
                        await refetchPayments();
                        setCreateModal(false);
                        setSelected(null);
                    }}
                    onDeleted={async () => {
                        setSelected(null);
                        await refetchPayments();
                    }}
                />
            </PageOverlay>
        </GravityLayout>
    );
};

export default PaymentsListPage;
