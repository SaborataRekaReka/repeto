export type SubjectDraft = { name: string; price: string; duration: string };

export const DEFAULT_SUBJECT: SubjectDraft = { name: "", price: "", duration: "60" };

export type EducationEntry = { id: string; institution: string; program: string; years: string };
export type CertificateEntry = { id: string; title: string; fileUrl: string; uploadedAt: string };

export const formatOptions = [
    { value: "online", content: "Онлайн (Zoom / Google Meet)" },
    { value: "offline", content: "Очно" },
    { value: "both", content: "Онлайн и Очно" },
];

export const accountAnimatedIconPaths = {
    add: "/icons/sidebar-animated/additem.json",
    remove: "/icons/sidebar-animated/trash.json",
    upload: "/icons/sidebar-animated/document-upload.json",
} as const;

export function createDraftEducationId() {
    if (typeof globalThis !== "undefined" && globalThis.crypto?.randomUUID) {
        return `edu-${globalThis.crypto.randomUUID()}`;
    }
    return `edu-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export function isPdfUrl(value?: string | null): boolean {
    const normalized = String(value || "").split("?")[0].toLowerCase();
    return normalized.endsWith(".pdf");
}

export function formatSubjectPrice(value: string): string {
    const normalized = String(value || "").replace(/\s+/g, "").replace(",", ".");
    const numeric = Number(normalized);
    if (!Number.isFinite(numeric) || numeric <= 0) {
        return "—";
    }
    return `${Math.round(numeric).toLocaleString("ru-RU")} ₽`;
}

export function formatSubjectDuration(value: string): string {
    const numeric = Number(String(value || "").replace(/\s+/g, ""));
    if (!Number.isFinite(numeric) || numeric <= 0) {
        return "—";
    }
    return `${Math.round(numeric)} мин`;
}

export function getSavedPaymentRequisites(settings: any): string {
    const direct = typeof settings?.paymentRequisites === "string"
        ? settings.paymentRequisites.trim()
        : "";

    if (direct) {
        return direct;
    }

    const nested = settings?.paymentSettings?.studentPaymentDetails?.requisites;
    return typeof nested === "string" ? nested.trim() : "";
}

export function summarizePaymentRequisites(value: string): string {
    const trimmed = value.trim();
    if (!trimmed) {
        return "";
    }

    const digits = (trimmed.match(/\d/g) || []).join("");
    if (digits.length >= 4) {
        return `*${digits.slice(-4)}`;
    }

    const firstLine = trimmed
        .split(/\r?\n/)
        .map((line) => line.trim())
        .find(Boolean);

    if (!firstLine) {
        return "";
    }

    return firstLine.length > 18 ? `${firstLine.slice(0, 18).trimEnd()}…` : firstLine;
}

export function extractCardNumber(value: string): string {
    const matches = value.match(/(?:\d[\s-]*){16,20}/g) || [];
    for (const match of matches) {
        const digits = match.match(/\d/g)?.join("") || "";
        if (digits.length >= 16 && digits.length <= 20) {
            const chunks = digits.match(/.{1,4}/g);
            return chunks ? chunks.join(" ") : digits;
        }
    }
    return "";
}

export function extractSbpPhone(value: string): string {
    const sbpLine = value
        .split(/\r?\n/)
        .map((line) => line.trim())
        .find((line) => /сбп/i.test(line));

    if (sbpLine) {
        return sbpLine;
    }

    const match = value.match(/(?:\+7|8)[\d\s().-]{9,20}\d/);
    return match ? match[0].trim() : "";
}

export function getSavedPaymentCardNumber(settings: any): string {
    const direct = typeof settings?.paymentCardNumber === "string"
        ? settings.paymentCardNumber.trim()
        : "";

    if (direct) {
        return direct;
    }

    const nested = settings?.paymentSettings?.studentPaymentDetails;
    const fromNested = typeof nested?.cardNumber === "string"
        ? nested.cardNumber.trim()
        : typeof nested?.card === "string"
            ? nested.card.trim()
            : "";

    if (fromNested) {
        return fromNested;
    }

    return extractCardNumber(getSavedPaymentRequisites(settings));
}

export function getSavedPaymentSbpPhone(settings: any): string {
    const direct = typeof settings?.paymentSbpPhone === "string"
        ? settings.paymentSbpPhone.trim()
        : "";

    if (direct) {
        return direct;
    }

    const nested = settings?.paymentSettings?.studentPaymentDetails;
    const fromNested = typeof nested?.sbpPhone === "string"
        ? nested.sbpPhone.trim()
        : typeof nested?.sbp === "string"
            ? nested.sbp.trim()
            : "";

    if (fromNested) {
        return fromNested;
    }

    return extractSbpPhone(getSavedPaymentRequisites(settings));
}
