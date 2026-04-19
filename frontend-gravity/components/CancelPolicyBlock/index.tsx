import { Icon, Label, Text } from "@gravity-ui/uikit";
import type { IconData } from "@gravity-ui/uikit";
import { Clock, CircleInfo, Xmark, CreditCard } from "@gravity-ui/icons";
import {
    formatCancelPolicyActionLabel,
    formatCancelPolicyHoursWord,
    formatCancelPolicyPreferredPaymentMethod,
} from "@/lib/cancelPolicy";

type CancelPolicyBlockProps = {
    freeHours?: number;
    lateCancelAction?: string;
    lateAction?: string;
    noShowAction?: string;
    preferredPaymentMethod?: string;
};

type PolicyRowTheme = "success" | "warning" | "danger";

type PolicyRow = {
    key: string;
    title: string;
    value: string;
    theme: PolicyRowTheme;
    icon: IconData;
};

const CancelPolicyBlock = ({
    freeHours = 24,
    lateCancelAction,
    lateAction,
    noShowAction,
    preferredPaymentMethod,
}: CancelPolicyBlockProps) => {
    const safeFreeHours = Number.isFinite(Number(freeHours)) ? Number(freeHours) : 24;
    const lateCancelActionLabel = formatCancelPolicyActionLabel(
        lateCancelAction || lateAction
    );
    const noShowActionLabel = formatCancelPolicyActionLabel(noShowAction);
    const preferredPayment = formatCancelPolicyPreferredPaymentMethod(
        preferredPaymentMethod
    );

    const rows: PolicyRow[] = [
        {
            key: "free-cancel",
            title: "Бесплатная отмена",
            value: `за ${safeFreeHours} ${formatCancelPolicyHoursWord(safeFreeHours)}`,
            theme: "success",
            icon: Clock as IconData,
        },
        {
            key: "late-cancel",
            title: "Поздняя отмена",
            value: lateCancelActionLabel,
            theme: "warning",
            icon: CircleInfo as IconData,
        },
        {
            key: "no-show",
            title: "Неявка",
            value: noShowActionLabel,
            theme: "danger",
            icon: Xmark as IconData,
        },
    ];

    return (
        <div className="repeto-cancel-policy">
            {rows.map((row) => (
                <div key={row.key} className="repeto-cancel-policy__row">
                    <div className="repeto-cancel-policy__left">
                        <span className="repeto-cancel-policy__icon" aria-hidden="true">
                            <Icon data={row.icon} size={20} />
                        </span>
                        <Text variant="body-1" className="repeto-cancel-policy__label">
                            {row.title}
                        </Text>
                    </div>
                    <Label theme={row.theme} size="s" className="repeto-cancel-policy__tag">
                        {row.value}
                    </Label>
                </div>
            ))}

            <div className="repeto-cancel-policy__payment">
                <Text variant="body-1" color="secondary" className="repeto-cancel-policy__payment-title">
                    Предпочтительный способ оплаты:
                </Text>
                <span className="repeto-cancel-policy__payment-icon" aria-hidden="true">
                    <Icon data={CreditCard as IconData} size={20} />
                </span>
                <Text variant="body-1" className="repeto-cancel-policy__payment-value">
                    {preferredPayment}
                </Text>
            </div>
        </div>
    );
};

export default CancelPolicyBlock;
