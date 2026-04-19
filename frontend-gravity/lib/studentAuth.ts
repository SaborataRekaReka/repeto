/**
 * Minimal client for the student OTP auth flow. Tokens are kept in
 * localStorage under dedicated keys so that they don't collide with the tutor
 * session managed by AuthContext.
 */
import { ApiError } from "@/lib/api";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "/api";
const ACCESS_KEY = "repeto:student:accessToken";
const REFRESH_KEY = "repeto:student:refreshToken";

export type StudentAccount = {
    id: string;
    email: string;
    name?: string | null;
    status: "INVITED" | "ACTIVE" | "PAUSED";
};

export type StudentAuthResponse = {
    accessToken: string;
    refreshToken?: string;
    account: StudentAccount;
    needsSetup?: boolean;
};

type StudentRefreshResponse = {
    accessToken: string;
};

export function getStudentAccessToken(): string | null {
    if (typeof window === "undefined") return null;
    return window.localStorage.getItem(ACCESS_KEY);
}

export function getStudentRefreshToken(): string | null {
    if (typeof window === "undefined") return null;
    return window.localStorage.getItem(REFRESH_KEY);
}

export function setStudentTokens(access: string, refresh?: string) {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(ACCESS_KEY, access);
    if (refresh) {
        window.localStorage.setItem(REFRESH_KEY, refresh);
    }
}

export function clearStudentTokens() {
    if (typeof window === "undefined") return;
    window.localStorage.removeItem(ACCESS_KEY);
    window.localStorage.removeItem(REFRESH_KEY);
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
    const isFormData =
        typeof FormData !== "undefined" && init.body instanceof FormData;

    const res = await fetch(`${API_BASE}${path}`, {
        ...init,
        credentials: "include",
        headers: {
            ...(!isFormData ? { "Content-Type": "application/json" } : {}),
            ...(init.headers || {}),
        },
    });
    const data = await res.json().catch(() => null);
    if (!res.ok) {
        throw new ApiError(res.status, res.statusText, data);
    }
    return data as T;
}

export function requestStudentOtp(email: string, _purpose: "LOGIN" | "BOOKING" = "LOGIN") {
    void _purpose;
    return request<{ email: string; expiresInMinutes: number; cooldown?: boolean }>(`/student-auth/request-otp`, {
        method: "POST",
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
    });
}

export async function verifyStudentOtp(email: string, code: string) {
    const res = await request<StudentAuthResponse>(`/student-auth/verify-otp`, {
        method: "POST",
        body: JSON.stringify({ email: email.trim().toLowerCase(), code: code.trim() }),
    });
    setStudentTokens(res.accessToken, res.refreshToken);
    return res;
}

export async function verifyBookingEmail(
    slug: string,
    email: string,
    code: string,
    bookingRequestId?: string,
) {
    const res = await request<StudentAuthResponse & { studentId: string }>(
        `/public/tutors/${encodeURIComponent(slug)}/verify-booking-email`,
        {
            method: "POST",
            body: JSON.stringify({
                email: email.trim().toLowerCase(),
                code: code.trim(),
                bookingRequestId,
            }),
        },
    );
    setStudentTokens(res.accessToken, res.refreshToken);
    return res;
}

export async function refreshStudentSession(): Promise<StudentRefreshResponse | null> {
    try {
        const res = await request<StudentRefreshResponse>(`/student-auth/refresh`, {
            method: "POST",
        });
        setStudentTokens(res.accessToken);
        return res;
    } catch {
        clearStudentTokens();
        return null;
    }
}

export async function studentLogout() {
    try {
        await request(`/student-auth/logout`, {
            method: "POST",
        });
    } catch {
        /* ignore */
    } finally {
        clearStudentTokens();
    }
}

export async function studentApi<T>(path: string, init: RequestInit = {}): Promise<T> {
    const isFormData =
        typeof FormData !== "undefined" && init.body instanceof FormData;

    const exec = async (token: string | null): Promise<Response> => {
        return fetch(`${API_BASE}${path}`, {
            ...init,
            credentials: "include",
            headers: {
                ...(!isFormData ? { "Content-Type": "application/json" } : {}),
                ...(token ? { Authorization: `Bearer ${token}` } : {}),
                ...(init.headers || {}),
            },
        });
    };

    let res = await exec(getStudentAccessToken());
    if (res.status === 401) {
        const refreshed = await refreshStudentSession();
        if (refreshed) {
            res = await exec(refreshed.accessToken);
        }
    }

    const data = await res.json().catch(() => null);
    if (!res.ok) {
        throw new ApiError(res.status, res.statusText, data);
    }
    return data as T;
}
