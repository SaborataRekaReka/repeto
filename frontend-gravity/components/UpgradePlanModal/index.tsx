import { useEffect, useMemo, useState } from "react";
import { Button, Text } from "@gravity-ui/uikit";
import AppDialog from "@/components/AppDialog";

type PlatformPlanId = "start" | "profi" | "center";
type PlatformBillingCycle = "month" | "year";

type UpgradePlanModalProps = {
    visible: boolean;
    loading: boolean;
    error: string | null;
    currentPlanId: PlatformPlanId;
    currentBillingCycle: PlatformBillingCycle;
    targetPlanId: PlatformPlanId;
    activatedAt?: string | null;
    expiresAt?: string | null;
    onClose: () => void;
    onSubmit: (billingCycle: PlatformBillingCycle) => void;
};

const PLAN_META: Record<PlatformPlanId, { label: string; month: number; year: number }> = {
    start: {
        label: "Старт",
        month: 0,
        year: 0,
    },
    profi: {
        label: "Практика",
        month: 300,
        year: 250 * 12,
    },
    center: {
        label: "Репетиторский центр",
        month: 1500,
        year: 1250 * 12,
    },
};

const DAY_MS = 24 * 60 * 60 * 1000;

function resolvePlanRank(planId: PlatformPlanId): number {
    if (planId === "start") return 1;
    if (planId === "profi") return 2;
    return 3;
}

function resolvePlanPrice(planId: PlatformPlanId, billingCycle: PlatformBillingCycle): number {
    return PLAN_META[planId][billingCycle];
}

function formatRub(value: number): string {
    return `${Math.max(0, Math.round(value)).toLocaleString("ru-RU")} ₽`;
}

const UpgradePlanModal = ({
    visible,
    loading,
    error,
    currentPlanId,
    currentBillingCycle,
    targetPlanId,
    activatedAt,
    expiresAt,
    onClose,
    onSubmit,
}: UpgradePlanModalProps) => {
    const [billingCycle, setBillingCycle] = useState<PlatformBillingCycle>(currentBillingCycle);

    useEffect(() => {
        if (!visible) return;
        setBillingCycle(currentBillingCycle);
    }, [visible, currentBillingCycle]);

    const preview = useMemo(() => {
        const baseAmountRub = resolvePlanPrice(targetPlanId, billingCycle);

        if (resolvePlanRank(targetPlanId) <= resolvePlanRank(currentPlanId)) {
            return {
                baseAmountRub,
                creditAmountRub: 0,
                amountRub: baseAmountRub,
                remainingDays: 0,
            };
        }

        const expiresDate = expiresAt ? new Date(expiresAt) : null;
        if (!expiresDate || !Number.isFinite(expiresDate.getTime())) {
            return {
                baseAmountRub,
                creditAmountRub: 0,
                amountRub: baseAmountRub,
                remainingDays: 0,
            };
        }

        const nowMs = Date.now();
        const expiresMs = expiresDate.getTime();
        if (expiresMs <= nowMs) {
            return {
                baseAmountRub,
                creditAmountRub: 0,
                amountRub: baseAmountRub,
                remainingDays: 0,
            };
        }

        const activatedDate = activatedAt ? new Date(activatedAt) : null;
        const fallbackPeriodMs =
            currentBillingCycle === "year" ? 365 * DAY_MS : 30 * DAY_MS;

        const fullPeriodMs =
            activatedDate && Number.isFinite(activatedDate.getTime()) && expiresMs > activatedDate.getTime()
                ? expiresMs - activatedDate.getTime()
                : fallbackPeriodMs;

        const remainingMs = expiresMs - nowMs;
        const ratio = Math.max(0, Math.min(1, remainingMs / fullPeriodMs));
        const sourceAmountRub = resolvePlanPrice(currentPlanId, currentBillingCycle);
        const creditAmountRub = Math.max(0, Math.round(sourceAmountRub * ratio));

        return {
            baseAmountRub,
            creditAmountRub,
            amountRub: Math.max(0, baseAmountRub - creditAmountRub),
            remainingDays: Number((remainingMs / DAY_MS).toFixed(1)),
        };
    }, [activatedAt, billingCycle, currentBillingCycle, currentPlanId, expiresAt, targetPlanId]);

    const cycleLabel = billingCycle === "year" ? "год" : "месяц";

    return (
        <AppDialog
            open={visible}
            onClose={onClose}
            size="m"
            caption="Повышение тарифа"
            footer={{
                textButtonCancel: "Отмена",
                onClickButtonCancel: onClose,
                textButtonApply:
                    preview.amountRub > 0
                        ? "Перейти к оплате"
                        : "Активировать без доплаты",
                onClickButtonApply: () => onSubmit(billingCycle),
                propsButtonApply: {
                    loading,
                    disabled: loading,
                },
                propsButtonCancel: {
                    disabled: loading,
                },
            }}
        >
            <div className="repeto-upgrade-plan-modal">
                <div className="repeto-upgrade-plan-modal__step">Шаг 3: Оплата</div>

                <Text variant="body-1" color="secondary" style={{ display: "block" }}>
                    Оставшиеся дни текущего тарифа автоматически зачтутся в оплату нового
                    тарифа пропорционально их стоимости.
                </Text>

                <div className="repeto-upgrade-plan-modal__plans">
                    <div className="repeto-upgrade-plan-modal__plan">
                        <Text variant="caption-2" color="secondary" style={{ display: "block" }}>
                            Текущий тариф
                        </Text>
                        <Text variant="body-2" style={{ display: "block" }}>
                            {PLAN_META[currentPlanId].label}
                        </Text>
                    </div>
                    <div className="repeto-upgrade-plan-modal__plan repeto-upgrade-plan-modal__plan--next">
                        <Text variant="caption-2" color="secondary" style={{ display: "block" }}>
                            Новый тариф
                        </Text>
                        <Text variant="body-2" style={{ display: "block" }}>
                            {PLAN_META[targetPlanId].label}
                        </Text>
                    </div>
                </div>

                <div className="repeto-upgrade-plan-modal__cycle-switcher" role="group" aria-label="Период тарифа">
                    <Button
                        type="button"
                        size="m"
                        view={billingCycle === "month" ? "action" : "outlined"}
                        onClick={() => setBillingCycle("month")}
                        disabled={loading}
                    >
                        Помесячно
                    </Button>
                    <Button
                        type="button"
                        size="m"
                        view={billingCycle === "year" ? "action" : "outlined"}
                        onClick={() => setBillingCycle("year")}
                        disabled={loading}
                    >
                        За год
                    </Button>
                </div>

                <div className="repeto-upgrade-plan-modal__summary">
                    <div className="repeto-upgrade-plan-modal__summary-row">
                        <Text variant="body-1" color="secondary">Базовая стоимость ({cycleLabel})</Text>
                        <Text variant="body-2">{formatRub(preview.baseAmountRub)}</Text>
                    </div>
                    <div className="repeto-upgrade-plan-modal__summary-row">
                        <Text variant="body-1" color="secondary">
                            Зачет остатка ({preview.remainingDays > 0 ? `${preview.remainingDays} дн.` : "0 дн."})
                        </Text>
                        <Text variant="body-2">-{formatRub(preview.creditAmountRub)}</Text>
                    </div>
                    <div className="repeto-upgrade-plan-modal__summary-row repeto-upgrade-plan-modal__summary-row--total">
                        <Text variant="body-2">К оплате</Text>
                        <Text variant="subheader-2">{formatRub(preview.amountRub)}</Text>
                    </div>
                </div>

                {error ? (
                    <Text variant="body-2" color="danger" style={{ display: "block" }}>
                        {error}
                    </Text>
                ) : null}
            </div>
        </AppDialog>
    );
};

export default UpgradePlanModal;
