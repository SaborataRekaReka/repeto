import { ApiError } from "@/lib/api";

function normalizeContext(context: string): string {
    const cleaned = context.toUpperCase().replace(/[^A-Z0-9]/g, "");
    return cleaned || "GEN";
}

function getStatus(error: unknown): number | null {
    if (error instanceof ApiError) return error.status;
    if (typeof error === "object" && error && "status" in error) {
        const status = (error as { status?: unknown }).status;
        if (typeof status === "number") return status;
    }
    if (typeof error === "object" && error && "statusCode" in error) {
        const statusCode = (error as { statusCode?: unknown }).statusCode;
        if (typeof statusCode === "number") return statusCode;
    }
    return null;
}

function getSource(error: unknown): string {
    if (!error) return "unknown";
    if (typeof error === "string") return error;
    if (error instanceof Error) return `${error.name}:${error.message}`;
    try {
        return JSON.stringify(error);
    } catch {
        return String(error);
    }
}

function shortHash(value: string): string {
    let hash = 0;
    for (let i = 0; i < value.length; i += 1) {
        hash = (hash * 31 + value.charCodeAt(i)) | 0;
    }
    return Math.abs(hash).toString(36).toUpperCase().padStart(4, "0").slice(0, 4);
}

function getKind(error: unknown, status: number | null): string {
    if (typeof status === "number") {
        if (status >= 500) return "SRV";
        if (status >= 400) return "REQ";
    }
    if (error instanceof TypeError && /fetch|network/i.test(error.message)) return "NET";
    return "GEN";
}

export function buildErrorCode(context: string, error?: unknown): string {
    const status = getStatus(error);
    const kind = getKind(error, status);
    const suffix = shortHash(getSource(error));
    const ctx = normalizeContext(context);
    if (typeof status === "number") {
        return `${ctx}-${kind}${status}-${suffix}`;
    }
    return `${ctx}-${kind}-${suffix}`;
}

function extractReadableMessage(error?: unknown): string | null {
    if (error instanceof ApiError) {
        const message = (error.message || "").trim();
        if (message && message !== "Запрос не выполнен") return message;
    }

    if (typeof error === "object" && error) {
        const payload = error as { message?: unknown; details?: unknown; error?: unknown };

        if (Array.isArray(payload.details)) {
            const details = payload.details
                .filter((item): item is string => typeof item === "string")
                .map((item) => item.trim())
                .filter(Boolean);
            if (details.length > 0) return details.join("; ");
        }

        if (Array.isArray(payload.message)) {
            const message = payload.message
                .filter((item): item is string => typeof item === "string")
                .map((item) => item.trim())
                .filter(Boolean);
            if (message.length > 0) return message.join("; ");
        }

        if (typeof payload.message === "string") {
            const message = payload.message.trim();
            if (message && message !== "Запрос не выполнен") return message;
        }

        if (typeof payload.error === "string") {
            const fallback = payload.error.trim();
            if (fallback) return fallback;
        }
    }

    if (error instanceof Error) {
        const message = (error.message || "").trim();
        if (message && message !== "Запрос не выполнен") return message;
    }

    return null;
}

export function codedErrorMessage(context: string, error?: unknown): string {
    const code = buildErrorCode(context, error);
    const readableMessage = extractReadableMessage(error);
    if (!readableMessage) return `Код ошибки: ${code}`;
    const needsDot = /[.!?]$/.test(readableMessage) ? "" : ".";
    return `${readableMessage}${needsDot} Код ошибки: ${code}`;
}
