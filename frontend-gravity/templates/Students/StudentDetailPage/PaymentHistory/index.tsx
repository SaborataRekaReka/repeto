import { Card, Text, Button, Icon, Label } from "@gravity-ui/uikit";
import { CirclePlus } from "@gravity-ui/icons";
import type { IconData } from "@gravity-ui/uikit";
import type { Payment } from "@/types/finance";
import { getMethodLabel } from "@/mocks/finance-tutor";

type PaymentHistoryProps = {
    payments: Payment[];
    onAdd?: () => void;
};

const paymentStatusTheme = (
    status: string
): "success" | "danger" | "normal" => {
    switch (status) {
        case "paid":
            return "success";
        case "pending":
            return "normal";
        case "cancelled":
            return "danger";
        default:
            return "normal";
    }
};

const paymentStatusLabel = (status: string) => {
    switch (status) {
        case "paid":
            return "Оплачено";
        case "pending":
            return "Ожидает";
        case "cancelled":
            return "Отменено";
        default:
            return status;
    }
};

const PaymentHistory = ({ payments, onAdd }: PaymentHistoryProps) => {
    const totalPaid = payments
        .filter((p) => p.status === "paid")
        .reduce((sum, p) => sum + p.amount, 0);

    return (
        <div>
            <div
                style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    marginBottom: 16,
                }}
            >
                <Text variant="subheader-2">Оплаты</Text>
                {onAdd && (
                    <Button view="action" size="s" onClick={onAdd}>
                        <Icon data={CirclePlus as IconData} size={14} />
                        Записать оплату
                    </Button>
                )}
            </div>

            {payments.length === 0 ? (
                <Card
                    view="outlined"
                    style={{ padding: "48px 24px", textAlign: "center" }}
                >
                    <Text variant="body-1" color="secondary">
                        Оплат пока нет
                    </Text>
                </Card>
            ) : (
                <Card view="outlined" style={{ overflow: "hidden" }}>
                    <table className="repeto-students-table">
                        <thead>
                            <tr>
                                <th>Дата</th>
                                <th>Сумма</th>
                                <th>Способ</th>
                                <th>Статус</th>
                            </tr>
                        </thead>
                        <tbody>
                            {payments.map((payment) => (
                                <tr key={payment.id}>
                                    <td>
                                        <Text variant="body-2">
                                            {payment.date}
                                        </Text>
                                    </td>
                                    <td>
                                        <Text variant="body-2">
                                            {payment.amount.toLocaleString(
                                                "ru-RU"
                                            )}{" "}
                                            ₽
                                        </Text>
                                    </td>
                                    <td>
                                        <Text
                                            variant="body-1"
                                            color="secondary"
                                        >
                                            {getMethodLabel(payment.method)}
                                        </Text>
                                    </td>
                                    <td>
                                        <Label
                                            theme={paymentStatusTheme(
                                                payment.status
                                            )}
                                            size="xs"
                                        >
                                            {paymentStatusLabel(payment.status)}
                                        </Label>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    <div
                        style={{
                            padding: "12px 16px",
                            borderTop:
                                "1px solid var(--g-color-line-generic)",
                            display: "flex",
                            justifyContent: "space-between",
                        }}
                    >
                        <Text variant="body-1">Оплачено:</Text>
                        <Text
                            variant="body-2"
                            style={{ color: "#22C55E" }}
                        >
                            {totalPaid.toLocaleString("ru-RU")} ₽
                        </Text>
                    </div>
                </Card>
            )}
        </div>
    );
};

export default PaymentHistory;
