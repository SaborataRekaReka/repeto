import { Text, Button, Icon } from "@gravity-ui/uikit";
import { Plus, CirclePlus, CreditCard, HandPointUp } from "@gravity-ui/icons";
import type { IconData } from "@gravity-ui/uikit";
import type { Payment } from "@/types/finance";
import { getMethodLabel } from "@/mocks/finance-tutor";

const GText = Text as any;
const GButton = Button as any;
const GIcon = Icon as any;

type PaymentHistoryProps = {
    payments: Payment[];
    onAdd?: () => void;
};

const paymentStatusLabel = (status: string) => {
    switch (status) {
        case "paid":
            return "Зачислено";
        case "pending":
            return "Ожидает";
        case "cancelled":
            return "Отменено";
        default:
            return status;
    }
};

const paymentStatusColor = (status: string) => {
    switch (status) {
        case "paid":
            return "#22a053";
        case "pending":
            return "var(--g-color-text-secondary)";
        case "cancelled":
            return "var(--g-color-text-danger)";
        default:
            return "var(--g-color-text-secondary)";
    }
};

const methodIcon = (method: string): IconData => {
    switch (method) {
        case "sbp":
            return HandPointUp as IconData;
        case "cash":
            return CreditCard as IconData;
        case "yukassa":
            return CreditCard as IconData;
        case "transfer":
        default:
            return CreditCard as IconData;
    }
};

const methodBg = (method: string): string => {
    switch (method) {
        case "sbp":
            return "#e0f2e9";
        case "cash":
            return "#e8e8e8";
        case "yukassa":
            return "#dce4f0";
        case "transfer":
        default:
            return "#e8e8e8";
    }
};

const methodFg = (method: string): string => {
    switch (method) {
        case "sbp":
            return "#2d8a56";
        case "cash":
            return "#555";
        case "yukassa":
            return "#3b5998";
        case "transfer":
        default:
            return "#555";
    }
};

/** Group payments by date string, preserving order */
const groupByDate = (payments: Payment[]) => {
    const map = new Map<string, Payment[]>();
    for (const p of payments) {
        const key = p.date;
        const list = map.get(key);
        if (list) list.push(p);
        else map.set(key, [p]);
    }
    return Array.from(map.entries());
};

const formatDateHeading = (dateStr: string) => {
    // dateStr = "DD.MM.YYYY"
    const parts = dateStr.split(".");
    if (parts.length !== 3) return dateStr;
    const d = new Date(`${parts[2]}-${parts[1]}-${parts[0]}`);
    if (Number.isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString("ru-RU", { day: "numeric", month: "long" });
};

const PaymentHistory = ({ payments, onAdd }: PaymentHistoryProps) => {
    const groups = groupByDate(payments);

    return (
        <div className="tab-section">
            {onAdd && (
                <div className="tab-section__actions">
                    <button type="button" className="tab-action-btn" onClick={onAdd}>
                        <span className="tab-action-btn__icon">
                            <GIcon data={CirclePlus as IconData} size={20} />
                        </span>
                        Записать оплату
                    </button>
                </div>
            )}

            {payments.length === 0 && (
                <div className="lp2-empty">Оплат пока нет</div>
            )}

            {groups.map(([date, items]) => (
                <div key={date} style={{ marginBottom: 24 }}>
                    <div style={{ fontWeight: 700, fontSize: 18, marginBottom: 16 }}>
                        {formatDateHeading(date)}
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
                        {items.map((payment, idx) => (
                            <div key={payment.id}>
                                {idx > 0 && (
                                    <div style={{
                                        height: 1,
                                        background: "var(--g-color-line-generic)",
                                        margin: "0 0 0 0",
                                    }} />
                                )}
                                <div style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 20,
                                    padding: "18px 0",
                                }}>
                                    {/* Left: amount + status */}
                                    <div style={{ minWidth: 120, flexShrink: 0 }}>
                                        <div style={{
                                            fontSize: 17,
                                            fontWeight: 500,
                                            color: paymentStatusColor(payment.status),
                                            lineHeight: 1.3,
                                        }}>
                                            {payment.status === "paid" ? "+ " : ""}
                                            {payment.amount.toLocaleString("ru-RU")} ₽
                                        </div>
                                        <div style={{
                                            fontSize: 13,
                                            color: paymentStatusColor(payment.status),
                                            marginTop: 2,
                                        }}>
                                            {paymentStatusLabel(payment.status)}
                                        </div>
                                    </div>

                                    {/* Middle: method + comment + date */}
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <div style={{ fontWeight: 600, fontSize: 15, lineHeight: 1.3 }}>
                                            {getMethodLabel(payment.method)}
                                        </div>
                                        {payment.comment && (
                                            <div style={{
                                                fontSize: 14,
                                                color: "var(--g-color-text-secondary)",
                                                marginTop: 2,
                                                lineHeight: 1.4,
                                            }}>
                                                {payment.comment}
                                            </div>
                                        )}
                                        <div style={{
                                            fontSize: 13,
                                            color: "var(--g-color-text-secondary)",
                                            marginTop: 2,
                                        }}>
                                            {payment.date}
                                        </div>
                                    </div>

                                    {/* Right: method icon */}
                                    <div style={{
                                        width: 44,
                                        height: 44,
                                        borderRadius: "50%",
                                        background: methodBg(payment.method),
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        flexShrink: 0,
                                        color: methodFg(payment.method),
                                    }}>
                                        <GIcon
                                            data={methodIcon(payment.method)}
                                            size={20}
                                        />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            ))}
        </div>
    );
};

export default PaymentHistory;
