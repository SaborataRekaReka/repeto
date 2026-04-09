const STORAGE_KEY = "repeto.portal-token-map.v1";
const COOKIE_KEY = "repeto_portal_token_map_v1";

type PortalTokenMap = Record<string, string>;

function safeParseMap(raw: string | null): PortalTokenMap {
    if (!raw) return {};
    try {
        const parsed = JSON.parse(raw) as unknown;
        if (!parsed || typeof parsed !== "object") return {};
        const obj = parsed as Record<string, unknown>;
        const result: PortalTokenMap = {};
        Object.entries(obj).forEach(([key, value]) => {
            if (typeof key === "string" && typeof value === "string" && key && value) {
                result[key] = value;
            }
        });
        return result;
    } catch {
        return {};
    }
}

function readCookieValue(name: string): string | null {
    if (typeof document === "undefined") return null;
    const prefix = `${name}=`;
    const parts = document.cookie.split(";").map((p) => p.trim());
    const found = parts.find((p) => p.startsWith(prefix));
    return found ? found.slice(prefix.length) : null;
}

function writeCookieValue(name: string, value: string) {
    if (typeof document === "undefined") return;
    document.cookie = `${name}=${value}; path=/; max-age=31536000; samesite=lax`;
}

export function readPortalTokenMap(): PortalTokenMap {
    if (typeof window === "undefined") return {};

    const fromStorage = safeParseMap(localStorage.getItem(STORAGE_KEY));
    const fromCookie = safeParseMap(
        decodeURIComponent(readCookieValue(COOKIE_KEY) || "")
    );

    return {
        ...fromStorage,
        ...fromCookie,
    };
}

export function writePortalTokenMap(map: PortalTokenMap) {
    if (typeof window === "undefined") return;
    const serialized = JSON.stringify(map);
    localStorage.setItem(STORAGE_KEY, serialized);
    writeCookieValue(COOKIE_KEY, encodeURIComponent(serialized));
}

export function getPortalTokenForTutor(slug: string): string | null {
    if (!slug) return null;
    const map = readPortalTokenMap();
    return map[slug] || null;
}

export function setPortalTokenForTutor(slug: string, token: string) {
    if (!slug || !token) return;
    const map = readPortalTokenMap();
    map[slug] = token;
    writePortalTokenMap(map);
}

export function clearPortalTokenForTutor(slug: string) {
    if (!slug) return;
    const map = readPortalTokenMap();
    if (!map[slug]) return;
    delete map[slug];
    writePortalTokenMap(map);
}
