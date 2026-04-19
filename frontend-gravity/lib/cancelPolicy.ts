export function formatCancelPolicyHoursWord(hours: number): string {
    const abs = Math.abs(hours) % 100;
    const last = abs % 10;
    if (abs > 10 && abs < 20) return "часов";
    if (last === 1) return "час";
    if (last >= 2 && last <= 4) return "часа";
    return "часов";
}

export function formatCancelPolicyActionLabel(action?: string): string {
    const normalized = (action || "").trim().toLowerCase();

    if (
        normalized === "full" ||
        normalized === "full_charge" ||
        normalized === "charge"
    ) {
        return "100% стоимости занятия";
    }
    if (normalized === "half" || normalized === "half_charge") {
        return "50% стоимости занятия";
    }
    if (normalized === "none" || normalized === "no_charge") {
        return "без списания";
    }
    if (!normalized) {
        return "100% стоимости занятия";
    }

    return action || "100% стоимости занятия";
}

export function formatCancelPolicyPreferredPaymentMethod(method?: string): string {
    const normalized = (method || "").trim().toLowerCase();
    if (!normalized) return "СБП";

    if (normalized === "cash") return "Наличные";
    if (normalized === "transfer") return "Перевод на карту";
    if (normalized === "sbp") return "СБП";

    return method || "СБП";
}
