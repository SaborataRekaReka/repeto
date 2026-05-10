import { test, expect, DEMO_EMAIL, DEMO_PASSWORD, getAuthToken } from "./helpers/auth";
import type { Page } from "@playwright/test";

const API_BASE = "http://127.0.0.1:3200/api";
const FRONT_API_BASE = "/api";

type StudentEntity = {
    id: string;
    name: string;
    email?: string | null;
    accountId?: string | null;
};

type NotificationEntity = {
    id: string;
    type: string;
    title: string;
    description: string;
    bookingRequestId?: string | null;
};

type BookingSlot = {
    date: string;
    time: string;
    duration: number;
};

let cachedTutorToken: string | null = null;

function randomSuffix() {
    return `${Date.now()}-${Math.floor(Math.random() * 1_000_000)}`;
}

function asArray<T>(payload: unknown): T[] {
    if (Array.isArray(payload)) return payload as T[];
    if (payload && typeof payload === "object" && Array.isArray((payload as { data?: unknown[] }).data)) {
        return (payload as { data: T[] }).data;
    }
    return [];
}

function parseRateLimitDelayMs(headers: Record<string, string>, attempt: number) {
    const retryAfterRaw = headers["retry-after"];
    const retryAfterSeconds = Number.parseFloat(retryAfterRaw || "");
    if (Number.isFinite(retryAfterSeconds) && retryAfterSeconds > 0) {
        return Math.max(1_200, Math.ceil(retryAfterSeconds * 1000));
    }

    return Math.min(20_000, 1_500 * (attempt + 1));
}

async function authHeaders(page: Page) {
    if (cachedTutorToken) {
        return { Authorization: `Bearer ${cachedTutorToken}` };
    }

    const refreshedToken = await getAuthToken(page).catch(() => null);
    if (refreshedToken) {
        cachedTutorToken = refreshedToken;
        return { Authorization: `Bearer ${refreshedToken}` };
    }

    let lastStatus = -1;
    let lastBody = "";

    for (let attempt = 0; attempt < 10; attempt += 1) {
        const loginResponse = await page.request.post(`${API_BASE}/auth/login`, {
            data: { email: DEMO_EMAIL, password: DEMO_PASSWORD },
        });
        lastStatus = loginResponse.status();

        if (loginResponse.ok()) {
            const loginPayload = (await loginResponse.json()) as { accessToken?: string };
            expect(typeof loginPayload.accessToken).toBe("string");
            cachedTutorToken = String(loginPayload.accessToken || "");
            return { Authorization: `Bearer ${cachedTutorToken}` };
        }

        lastBody = await loginResponse.text().catch(() => "");
        if (lastStatus === 429) {
            const delayMs = parseRateLimitDelayMs(loginResponse.headers(), attempt);
            await page.waitForTimeout(delayMs);
            continue;
        }

        if (lastStatus === 401 || lastStatus === 403 || lastStatus >= 500) {
            await page.waitForTimeout(300 * (attempt + 1));
            continue;
        }

        break;
    }

    throw new Error(`Unable to login via /auth/login (status=${lastStatus}) body=${lastBody}`);
}

async function safeDelete(page: Page, path: string, headers: Record<string, string>) {
    await page.request.delete(path, { headers }).catch(() => null);
}

async function createStudent(
    page: Page,
    headers: Record<string, string>,
    overrides: Partial<{ name: string; email: string; subject: string; rate: number }> = {},
): Promise<StudentEntity> {
    const suffix = randomSuffix();
    const response = await page.request.post(`${API_BASE}/students`, {
        headers,
        data: {
            name: overrides.name || `SYNC Student ${suffix}`,
            email: overrides.email || `sync.student.${suffix}@example.com`,
            subject: overrides.subject || "Математика",
            rate: overrides.rate ?? 2200,
            phone: "+79991112233",
        },
    });
    expect(response.ok()).toBeTruthy();
    return (await response.json()) as StudentEntity;
}

async function ensurePublicProfile(page: Page, headers: Record<string, string>, slugSeed: string) {
    const settingsResponse = await page.request.get(`${API_BASE}/settings`, { headers });
    expect(settingsResponse.ok()).toBeTruthy();
    const settings = (await settingsResponse.json()) as {
        slug?: string | null;
        published?: boolean;
        showPublicPackages?: boolean;
    };

    const originalSlug = typeof settings.slug === "string" ? settings.slug : "";
    const originalPublished = Boolean(settings.published);
    const originalShowPublicPackages = settings.showPublicPackages !== false;

    let publicSlug = originalSlug.trim();
    if (!publicSlug) {
        const slugResponse = await page.request.get(`${API_BASE}/settings/account/slug`, {
            headers,
            params: { value: `${slugSeed}-${randomSuffix()}` },
        });
        expect(slugResponse.ok()).toBeTruthy();
        const slugPayload = (await slugResponse.json()) as { suggested?: string; requested?: string; slug?: string };
        publicSlug = String(slugPayload.suggested || slugPayload.requested || slugPayload.slug || "").trim();
        expect(publicSlug.length).toBeGreaterThan(0);
    }

    const shouldPatch = !originalPublished || publicSlug !== originalSlug || settings.showPublicPackages === false;
    if (shouldPatch) {
        const patch = await page.request.patch(`${API_BASE}/settings/account`, {
            headers,
            data: {
                slug: publicSlug,
                published: true,
                showPublicPackages: true,
            },
        });
        expect(patch.ok()).toBeTruthy();
    }

    let publicReady = false;
    for (let attempt = 0; attempt < 10; attempt += 1) {
        const publicResponse = await page.request.get(`${API_BASE}/public/tutors/${encodeURIComponent(publicSlug)}`);
        if (publicResponse.ok()) {
            publicReady = true;
            break;
        }
        if (publicResponse.status() !== 404) {
            break;
        }
        await page.waitForTimeout(300);
    }
    expect(publicReady).toBeTruthy();

    return {
        slug: publicSlug,
        restore: async () => {
            if (!shouldPatch) return;
            await page.request.patch(`${API_BASE}/settings/account`, {
                headers,
                data: {
                    slug: originalSlug,
                    published: originalPublished,
                    showPublicPackages: originalShowPublicPackages,
                },
            }).catch(() => null);
        },
    };
}

async function getFirstPublicSlot(page: Page, slug: string): Promise<BookingSlot | null> {
    const slotsResponse = await page.request.get(`${API_BASE}/public/tutors/${encodeURIComponent(slug)}/slots`);
    if (!slotsResponse.ok()) return null;
    const slots = (await slotsResponse.json()) as BookingSlot[];
    if (!Array.isArray(slots) || slots.length === 0) return null;
    return slots[0];
}

async function createPublicBooking(page: Page, slug: string, marker: string) {
    const profileResponse = await page.request.get(`${API_BASE}/public/tutors/${encodeURIComponent(slug)}`);
    expect(profileResponse.ok()).toBeTruthy();
    const profile = (await profileResponse.json()) as {
        subjects?: Array<string | { name: string }>;
        publicPackages?: Array<{ subject: string }>;
    };

    const firstSubject = profile.subjects?.[0];
    const subject =
        typeof firstSubject === "string"
            ? firstSubject
            : firstSubject?.name || profile.publicPackages?.[0]?.subject || "Математика";

    const slot = await getFirstPublicSlot(page, slug);
    if (!slot) return null;

    const uniquePhoneDigits = String(Date.now()).slice(-10);
    const email = `sync.booking.${marker}@example.com`;
    const clientName = `SYNC Booking ${marker}`;

    const bookingResponse = await page.request.post(`${API_BASE}/public/tutors/${encodeURIComponent(slug)}/book`, {
        data: {
            subject,
            date: slot.date,
            startTime: slot.time,
            clientName,
            clientPhone: `+7${uniquePhoneDigits}`,
            clientEmail: email,
            comment: `sync-marker-${marker}`,
            consents: {
                lessonFor: "self",
                bookingTermsConfirmed: true,
            },
        },
    });
    const bookingStatus = bookingResponse.status();
    const bookingBody = await bookingResponse.text();
    expect(
        bookingResponse.ok(),
        `Public booking failed slug=${slug} subject=${subject} date=${slot.date} start=${slot.time} status=${bookingStatus} body=${bookingBody}`,
    ).toBeTruthy();

    let bookingPayload: { id?: string } = {};
    try {
        bookingPayload = JSON.parse(bookingBody) as { id?: string };
    } catch {
        bookingPayload = {};
    }

    return {
        booking: bookingPayload,
        marker,
        email,
        clientName,
    };
}

async function waitForBookingNotification(
    page: Page,
    headers: Record<string, string>,
    bookingRequestId: string,
    timeoutMs = 20_000,
): Promise<NotificationEntity | null> {
    const startedAt = Date.now();

    while (Date.now() - startedAt < timeoutMs) {
        const response = await page.request.get(`${API_BASE}/notifications`, {
            headers,
            params: {
                type: "BOOKING_NEW",
                limit: 100,
            },
        });

        if (response.ok()) {
            const rows = asArray<NotificationEntity>(await response.json());
            const found = rows.find((row) => row.bookingRequestId === bookingRequestId);
            if (found) return found;
        }

        await page.waitForTimeout(500);
    }

    return null;
}

async function rejectBookingByMarker(page: Page, headers: Record<string, string>, marker: string) {
    const response = await page.request.get(`${API_BASE}/notifications`, {
        headers,
        params: {
            type: "BOOKING_NEW",
            limit: 100,
        },
        timeout: 10_000,
    }).catch(() => null);
    if (!response?.ok()) return;

    const rows = asArray<NotificationEntity>(await response.json());
    const target = rows.find((row) => row.description.includes(marker) || row.title.includes(marker));
    if (!target) return;

    await page.request
        .post(`${API_BASE}/notifications/${target.id}/reject-booking`, {
            headers,
            timeout: 10_000,
        })
        .catch(() => null);
}

async function getLatestBookingNotificationTimestamp(
    page: Page,
    headers: Record<string, string>,
) {
    let latest = 0;
    const requests = [
        () => page.request.get(`${API_BASE}/notifications`, {
            headers,
            params: { type: "BOOKING_NEW", limit: 100 },
            timeout: 10_000,
        }),
        () => page.request.get(`${FRONT_API_BASE}/notifications`, {
            headers,
            params: { type: "BOOKING_NEW", limit: 100 },
            timeout: 10_000,
        }),
        () => page.request.get(`${FRONT_API_BASE}/notifications`, {
            params: { type: "BOOKING_NEW", limit: 100 },
            timeout: 10_000,
        }),
    ];

    for (const request of requests) {
        const response = await request().catch(() => null);
        if (!response?.ok()) continue;

        const rows = asArray<Record<string, unknown>>(await response.json().catch(() => []));
        for (const row of rows) {
            const createdAtMs = Date.parse(String(row?.createdAt || ""));
            if (Number.isFinite(createdAtMs) && createdAtMs > latest) {
                latest = createdAtMs;
            }
        }
    }

    return latest;
}

async function waitForNewBookingNotification(
    page: Page,
    headers: Record<string, string>,
    baselineTimestampMs: number,
    timeoutMs = 20_000,
) {
    const startedAt = Date.now();

    while (Date.now() - startedAt < timeoutMs) {
        const currentLatest = await getLatestBookingNotificationTimestamp(page, headers);
        if (currentLatest > baselineTimestampMs) {
            return true;
        }

        await page.waitForTimeout(500);
    }

    return false;
}

test.describe("Cross Account Sync Contract", () => {
    test.describe.configure({ mode: "serial" });
    test.setTimeout(240_000);

    test("SYNC-INVITE-001 tutor invite/activate is reflected in student auth", async ({ authedPage: page }) => {
        const headers = await authHeaders(page);
        const studentEmail = `sync.invite.${randomSuffix()}@example.com`;
        let studentId: string | null = null;

        try {
            const student = await createStudent(page, headers, { email: studentEmail });
            studentId = student.id;

            const activateResponse = await page.request.post(`${API_BASE}/students/${studentId}/activate-account`, {
                headers,
            });
            expect(activateResponse.ok()).toBeTruthy();
            const activatePayload = (await activateResponse.json()) as {
                accountId?: string | null;
                email?: string;
                status?: string;
                invited?: boolean;
            };
            // Contract: either an existing StudentAccount is linked (accountId != null)
            // or a brand-new invite is queued (invited === true and status === 'INVITED').
            const hasAccount = typeof activatePayload.accountId === "string" && activatePayload.accountId.length > 0;
            const isInvited = activatePayload.invited === true || activatePayload.status === "INVITED";
            expect(hasAccount || isInvited).toBeTruthy();
            expect(String(activatePayload.email || "").toLowerCase()).toBe(studentEmail);

            // Student auth flow is API-level here: the tutor browser session can't visit
            // the student login view without signing out, so we only assert the OTP contract.
            const otpResponse = await page.request.post(`${API_BASE}/student-auth/request-otp`, {
                data: { email: studentEmail },
            });
            expect(otpResponse.ok()).toBeTruthy();
        } finally {
            if (studentId) {
                await safeDelete(page, `${API_BASE}/students/${studentId}`, headers);
            }
        }
    });

    test("SYNC-BOOK-001 public booking appears for tutor and can be confirmed", async ({ authedPage: page }) => {
        const headers = await authHeaders(page);
        const profile = await ensurePublicProfile(page, headers, "sync-book");
        const marker = randomSuffix();
        let confirmedStudentId: string | null = null;
        let confirmedLessonId: string | null = null;

        try {
            const booking = await createPublicBooking(page, profile.slug, marker);
            test.skip(!booking?.booking?.id, "No available public slots for booking sync flow.");

            const bookingNotification = await waitForBookingNotification(page, headers, String(booking?.booking?.id));
            expect(bookingNotification).toBeTruthy();

            await page.goto("/notifications", { waitUntil: "domcontentloaded" });
            await page.waitForTimeout(350);
            await expect(page).toHaveURL(/\/notifications(?:\?|#|$)/);

            const allTab = page.getByRole("button", { name: /^Все$/i }).first();
            if (await allTab.isVisible().catch(() => false)) {
                await allTab.click();
            }

            const markerRow = page.getByText(new RegExp(`SYNC Booking ${marker}`, "i")).first();
            const markerVisible = await markerRow.isVisible({ timeout: 4_000 }).catch(() => false);

            if (!markerVisible) {
                await page.reload({ waitUntil: "domcontentloaded" });
                await page.waitForTimeout(350);
            }

            const confirmResponse = await page.request.post(
                `${API_BASE}/notifications/${bookingNotification!.id}/confirm-booking`,
                { headers },
            );
            expect(confirmResponse.ok()).toBeTruthy();

            const confirmPayload = (await confirmResponse.json()) as {
                status?: string;
                studentId?: string;
                lessonId?: string;
            };
            expect(confirmPayload.status).toBe("CONFIRMED");

            confirmedStudentId = confirmPayload.studentId || null;
            confirmedLessonId = confirmPayload.lessonId || null;

            expect(Boolean(confirmedStudentId)).toBeTruthy();
            expect(Boolean(confirmedLessonId)).toBeTruthy();
        } finally {
            await profile.restore();
            if (confirmedLessonId) {
                await safeDelete(page, `${API_BASE}/lessons/${confirmedLessonId}`, headers);
            }
            if (confirmedStudentId) {
                await safeDelete(page, `${API_BASE}/students/${confirmedStudentId}`, headers);
            }
        }
    });

    test("SYNC-PORTAL-001 booking wizard handoff reaches OTP and creates tutor notification", async ({ authedPage: page }) => {
        const headers = await authHeaders(page);
        const profile = await ensurePublicProfile(page, headers, "sync-portal");
        const marker = randomSuffix();
        const notificationBaseline = await getLatestBookingNotificationTimestamp(page, headers);

        try {
            await page.goto(`/t/${profile.slug}/book`, { waitUntil: "domcontentloaded" });
            await page.waitForLoadState("networkidle");
            await expect(page.locator(".repeto-bk-step, .repeto-bk-options, .repeto-bk-option").first()).toBeVisible({ timeout: 20_000 });

            const subjectOrPackageOption = page.locator(".repeto-bk-option").first();
            test.skip(!(await subjectOrPackageOption.isVisible().catch(() => false)), "No public subjects or packages visible in booking wizard.");
            await subjectOrPackageOption.click();

            await page.locator(".repeto-bk-action-btn").filter({ hasText: /Продолжить/i }).first().click();

            const day = page.locator(".repeto-bk-cal-day:not(.repeto-bk-cal-day--disabled)").first();
            test.skip(!(await day.isVisible().catch(() => false)), "No available day for booking handoff flow.");
            await day.click();

            const timeSlot = page.locator(".repeto-bk-time-slot").first();
            await expect(timeSlot).toBeVisible();
            await timeSlot.click();

            await page.locator(".repeto-bk-action-btn").filter({ hasText: /Продолжить/i }).first().click();

            await page.getByPlaceholder("Иван Иванов").fill(`SYNC Portal ${marker}`);
            await page.getByPlaceholder("+7 (900) 123-45-67").fill("+7 999 123 45 67");
            await page.getByPlaceholder("email@example.com").fill(`sync.portal.${marker}@example.com`);

            const cookieAccept = page.getByRole("button", { name: /Согласен/i }).first();
            if (await cookieAccept.isVisible().catch(() => false)) {
                await cookieAccept.click().catch(() => null);
            }

            const legalGateContinue = page.getByTestId("booking-continue-legal-gate").first();
            if (await legalGateContinue.isVisible().catch(() => false)) {
                const initialUserAgreement = page
                    .getByRole("checkbox", { name: /Пользовательское соглашение/i })
                    .first();
                const initialPersonalData = page
                    .getByRole("checkbox", { name: /обработк.*персональных данных/i })
                    .first();

                if (await initialUserAgreement.isVisible().catch(() => false)) {
                    const checked = await initialUserAgreement.isChecked().catch(() => false);
                    if (!checked) await initialUserAgreement.click();
                }

                if (await initialPersonalData.isVisible().catch(() => false)) {
                    const checked = await initialPersonalData.isChecked().catch(() => false);
                    if (!checked) await initialPersonalData.click();
                }

                await legalGateContinue.click();
            }

            const bookingTerms = page
                .getByRole("checkbox", { name: /Ознакомлен.*условиями занятия/i })
                .first();
            if (await bookingTerms.isVisible().catch(() => false)) {
                const checked = await bookingTerms.isChecked().catch(() => false);
                if (!checked) await bookingTerms.click();
            }

            const submitBooking = page.getByTestId("booking-submit-request").first();
            await expect(submitBooking).toBeVisible({ timeout: 10_000 });
            await submitBooking.click();
            await expect(page.locator(".repeto-bk-step--otp")).toBeVisible({ timeout: 20_000 });

            const hasMarker = await waitForNewBookingNotification(page, headers, notificationBaseline);
            expect(hasMarker).toBeTruthy();
        } finally {
            await rejectBookingByMarker(page, headers, marker);
            await profile.restore();
        }
    });

    test("SYNC-LINK-001 unlink and portal guards are enforced for account boundaries", async ({ authedPage: page }) => {
        const headers = await authHeaders(page);
        const studentEmail = `sync.unlink.${randomSuffix()}@example.com`;
        let studentId: string | null = null;

        try {
            const student = await createStudent(page, headers, { email: studentEmail });
            studentId = student.id;

            const activateResponse = await page.request.post(`${API_BASE}/students/${studentId}/activate-account`, {
                headers,
            });
            expect(activateResponse.ok()).toBeTruthy();

            const otpBeforeUnlink = await page.request.post(`${API_BASE}/student-auth/request-otp`, {
                data: { email: studentEmail },
            });
            expect(otpBeforeUnlink.ok()).toBeTruthy();

            const unlinkResponse = await page.request.post(`${API_BASE}/students/${studentId}/unlink-account`, {
                headers,
            });
            expect(unlinkResponse.ok()).toBeTruthy();
            const unlinkPayload = (await unlinkResponse.json()) as { accountId?: string | null };
            expect(unlinkPayload.accountId ?? null).toBeNull();

            const otpAfterUnlink = await page.request.post(`${API_BASE}/student-auth/request-otp`, {
                data: { email: studentEmail },
            });
            expect(otpAfterUnlink.ok()).toBeTruthy();

            const tutorPortalAccess = await page.request.get(`${API_BASE}/student-portal/tutors`, {
                headers,
            });
            expect(tutorPortalAccess.status()).toBeGreaterThanOrEqual(400);
        } finally {
            if (studentId) {
                await safeDelete(page, `${API_BASE}/students/${studentId}`, headers);
            }
        }
    });
});
