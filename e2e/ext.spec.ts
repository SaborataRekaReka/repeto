import { test, expect, getAuthToken, loginViaUI } from "./helpers/auth";
import type { Page } from "@playwright/test";

const API_BASE = "/api";

type StudentEntity = {
    id: string;
    name: string;
    subject: string;
    rate: number;
    email?: string | null;
    status?: string;
    accountId?: string | null;
};

type LessonEntity = {
    id: string;
    studentId: string;
    status: string;
    scheduledAt: string;
    recurrenceGroupId?: string | null;
};

type PaymentEntity = {
    id: string;
    amount: number;
    method: string;
    lessonId?: string | null;
};

type PackageEntity = {
    id: string;
    isPublic: boolean;
    studentId?: string | null;
    validUntil?: string | null;
};

type NotificationEntity = {
    id: string;
    type: string;
    title: string;
    description: string;
    bookingRequestId?: string | null;
    lessonId?: string | null;
    read?: boolean;
};

type BookingSlot = {
    date: string;
    time: string;
    duration: number;
};

function randomSuffix() {
    return `${Date.now()}-${Math.floor(Math.random() * 1_000_000)}`;
}

function plusDaysDate(days: number) {
    const date = new Date();
    date.setDate(date.getDate() + days);
    return date.toISOString().slice(0, 10);
}

function plusMinutesIso(minutes: number) {
    const date = new Date(Date.now() + minutes * 60 * 1000);
    return date.toISOString();
}

function weekdayOneToSeven(date: Date) {
    const day = date.getDay();
    return day === 0 ? 7 : day;
}

function asArray<T>(payload: unknown): T[] {
    if (Array.isArray(payload)) return payload as T[];
    if (payload && typeof payload === "object" && Array.isArray((payload as { data?: unknown[] }).data)) {
        return (payload as { data: T[] }).data;
    }
    return [];
}

async function authHeaders(page: Page) {
    const accessToken = await getAuthToken(page);
    return { Authorization: `Bearer ${accessToken}` };
}

async function postWithTransientGatewayRetry(
    page: Page,
    path: string,
    options?: Parameters<Page["request"]["post"]>[1],
    maxAttempts = 12,
) {
    const parseRetryDelayMs = (headers: Record<string, string>, attempt: number) => {
        const retryAfter = Number.parseFloat(headers["retry-after"] || "");
        if (Number.isFinite(retryAfter) && retryAfter > 0) {
            return Math.max(1_200, Math.ceil(retryAfter * 1000));
        }

        const reset = Number.parseFloat(headers["x-ratelimit-reset"] || "");
        if (Number.isFinite(reset) && reset > 0) {
            if (reset < 10_000) {
                return Math.max(1_200, Math.ceil(reset * 1000));
            }

            const maybeEpochMs = reset > 1_000_000_000_000 ? reset : reset * 1000;
            const deltaMs = Math.ceil(maybeEpochMs - Date.now());
            if (deltaMs > 0) return Math.max(1_200, deltaMs);
        }

        return Math.min(20_000, 1_500 * (attempt + 1));
    };

    let response = await page.request.post(path, options);
    for (let attempt = 1; attempt < maxAttempts; attempt += 1) {
        const status = response.status();
        if (status !== 429 && status !== 502 && status !== 503 && status !== 504) {
            return response;
        }

        const delayMs = status === 429 ? parseRetryDelayMs(response.headers(), attempt) : Math.min(6_000, 400 * attempt);
        await page.waitForTimeout(delayMs);
        response = await page.request.post(path, options);
    }

    return response;
}

async function gotoAuthed(page: Page, path: string) {
    for (let attempt = 0; attempt < 2; attempt += 1) {
        await page.goto(path, { waitUntil: "domcontentloaded" });
        await page.waitForLoadState("networkidle");

        if (/\/(auth|registration)(?:\?|#|$)/.test(page.url())) {
            await loginViaUI(page);
            continue;
        }

        return;
    }

    throw new Error(`Unable to open route in authenticated state: ${path} (currentURL=${page.url()})`);
}

async function safeDelete(
    page: Page,
    path: string,
    headers: Record<string, string>,
    params?: Record<string, string | number | boolean>,
) {
    try {
        await page.request.delete(path, { headers, params });
    } catch {
        // cleanup best effort
    }
}

async function createStudent(
    page: Page,
    headers: Record<string, string>,
    overrides: Partial<{
        name: string;
        subject: string;
        rate: number;
        email: string;
        phone: string;
    }> = {},
) {
    const suffix = randomSuffix();
    const response = await page.request.post(`${API_BASE}/students`, {
        headers,
        data: {
            name: overrides.name || `EXT Student ${suffix}`,
            subject: overrides.subject || "Математика",
            rate: overrides.rate ?? 2100,
            email: overrides.email || `ext.student.${suffix}@example.com`,
            phone: overrides.phone || "+79991112233",
        },
    });
    expect(response.ok()).toBeTruthy();
    return (await response.json()) as StudentEntity;
}

async function createLesson(
    page: Page,
    headers: Record<string, string>,
    dto: {
        studentId: string;
        subject: string;
        scheduledAt: string;
        duration?: number;
        rate?: number;
        recurrence?: {
            enabled: boolean;
            until?: string;
            weekdays?: number[];
        };
    },
) {
    const response = await page.request.post(`${API_BASE}/lessons`, {
        headers,
        data: {
            studentId: dto.studentId,
            subject: dto.subject,
            scheduledAt: dto.scheduledAt,
            duration: dto.duration ?? 60,
            rate: dto.rate ?? 2000,
            recurrence: dto.recurrence,
        },
    });
    expect(response.ok()).toBeTruthy();
    const payload = await response.json();
    if (Array.isArray(payload)) {
        return payload as LessonEntity[];
    }
    return [payload as LessonEntity];
}

async function ensurePublicProfile(
    page: Page,
    headers: Record<string, string>,
    slugSeed: string,
) {
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
        const slugPayload = (await slugResponse.json()) as {
            suggested?: string;
            requested?: string;
            slug?: string;
        };
        publicSlug = String(slugPayload.suggested || slugPayload.requested || slugPayload.slug || "").trim();
        expect(publicSlug.length).toBeGreaterThan(0);
    }

    const shouldPatch =
        !originalPublished ||
        publicSlug !== originalSlug ||
        settings.showPublicPackages === false;

    if (shouldPatch) {
        const patchResponse = await page.request.patch(`${API_BASE}/settings/account`, {
            headers,
            data: {
                slug: publicSlug,
                published: true,
                showPublicPackages: true,
            },
        });
        expect(patchResponse.ok()).toBeTruthy();
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

    const restore = async () => {
        if (!shouldPatch) return;
        await page.request.patch(`${API_BASE}/settings/account`, {
            headers,
            data: {
                slug: originalSlug,
                published: originalPublished,
                showPublicPackages: originalShowPublicPackages,
            },
        }).catch(() => null);
    };

    return {
        slug: publicSlug,
        restore,
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
        publicPackages?: Array<{ id: string; subject: string }>;
    };

    const firstSubject = profile.subjects?.[0];
    const subject =
        typeof firstSubject === "string"
            ? firstSubject
            : (firstSubject?.name || profile.publicPackages?.[0]?.subject || "Математика");

    const slot = await getFirstPublicSlot(page, slug);
    if (!slot) return null;

    const uniquePhoneDigits = String(Date.now()).slice(-10);
    const bookingResponse = await page.request.post(
        `${API_BASE}/public/tutors/${encodeURIComponent(slug)}/book`,
        {
            data: {
                subject,
                date: slot.date,
                startTime: slot.time,
                clientName: `EXT Booking ${marker}`,
                clientPhone: `+7${uniquePhoneDigits}`,
                clientEmail: `ext.booking.${marker}@example.com`,
                comment: `ext-marker-${marker}`,
            },
        },
    );
    expect(bookingResponse.ok()).toBeTruthy();
    const booking = await bookingResponse.json();
    return {
        booking: booking as { id?: string },
        email: `ext.booking.${marker}@example.com`,
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
            const payload = await response.json();
            const rows = asArray<NotificationEntity>(payload);
            const match = rows.find((row) => row.bookingRequestId === bookingRequestId);
            if (match) return match;
        }
        await page.waitForTimeout(700);
    }

    return null;
}

test.describe("EXT block coverage", () => {
    test.describe.configure({ mode: "serial" });
    test.setTimeout(180_000);

    test("EXT-AUTH-001 auth negative and recovery paths", async ({ page, authedPage }) => {
        const invalidLogin = await postWithTransientGatewayRetry(page, `${API_BASE}/auth/login`, {
            data: {
                email: "demo@repeto.ru",
                password: `wrong-${randomSuffix()}`,
            },
        });
        expect([401, 429]).toContain(invalidLogin.status());

        const verifyCodeWithoutRequest = await postWithTransientGatewayRetry(page, `${API_BASE}/auth/register/verify-code`, {
            data: {
                email: `ext.${randomSuffix()}@example.com`,
                code: "000000",
            },
        });
        expect([400, 429]).toContain(verifyCodeWithoutRequest.status());

        const forgotPasswordUnknown = await postWithTransientGatewayRetry(page, `${API_BASE}/auth/forgot-password`, {
            data: { email: `missing.${randomSuffix()}@example.com` },
        });
        expect(forgotPasswordUnknown.status()).toBeLessThan(500);

        const resetWithInvalidToken = await postWithTransientGatewayRetry(page, `${API_BASE}/auth/reset-password`, {
            data: {
                token: `invalid-token-${randomSuffix()}`,
                password: "Pass1234",
            },
        });
        expect([400, 429]).toContain(resetWithInvalidToken.status());

        const studentOtpUnknown = await postWithTransientGatewayRetry(page, `${API_BASE}/student-auth/request-otp`, {
            data: {
                email: `unknown.student.${randomSuffix()}@example.com`,
            },
        });
        expect([400, 429]).toContain(studentOtpUnknown.status());

        const headers = await authHeaders(authedPage);
        const completePlatformPayment = await authedPage.request.post(`${API_BASE}/auth/platform-access/complete`, {
            headers,
            data: {
                paymentId: `fake-${randomSuffix()}`,
            },
        });
        expect(completePlatformPayment.status()).toBeGreaterThanOrEqual(400);
    });

    test("EXT-STUD-001 students lifecycle with notes/homework/account", async ({ authedPage: page }) => {
        const headers = await authHeaders(page);
        let studentId: string | null = null;
        let noteId: string | null = null;
        let homeworkId: string | null = null;

        try {
            const student = await createStudent(page, headers);
            studentId = student.id;

            const pauseResponse = await page.request.patch(`${API_BASE}/students/${studentId}`, {
                headers,
                data: { status: "PAUSED" },
            });
            expect(pauseResponse.ok()).toBeTruthy();

            const archiveResponse = await page.request.patch(`${API_BASE}/students/${studentId}`, {
                headers,
                data: { status: "ARCHIVED" },
            });
            expect(archiveResponse.ok()).toBeTruthy();

            const restoreResponse = await page.request.patch(`${API_BASE}/students/${studentId}`, {
                headers,
                data: { status: "ACTIVE" },
            });
            expect(restoreResponse.ok()).toBeTruthy();

            const activateAccountResponse = await page.request.post(`${API_BASE}/students/${studentId}/activate-account`, {
                headers,
            });
            expect(activateAccountResponse.ok()).toBeTruthy();

            const unlinkResponse = await page.request.post(`${API_BASE}/students/${studentId}/unlink-account`, {
                headers,
            });
            expect(unlinkResponse.ok()).toBeTruthy();
            const unlinkPayload = (await unlinkResponse.json()) as { accountId?: string | null };
            expect(unlinkPayload.accountId ?? null).toBeNull();

            const createNoteResponse = await page.request.post(`${API_BASE}/students/${studentId}/notes`, {
                headers,
                data: {
                    content: `EXT note ${randomSuffix()}`,
                },
            });
            expect(createNoteResponse.ok()).toBeTruthy();
            const note = (await createNoteResponse.json()) as { id: string; content: string };
            noteId = note.id;
            expect(note.content.length).toBeGreaterThan(0);

            const updateNoteResponse = await page.request.patch(`${API_BASE}/students/${studentId}/notes/${noteId}`, {
                headers,
                data: {
                    content: `EXT note updated ${randomSuffix()}`,
                },
            });
            expect(updateNoteResponse.ok()).toBeTruthy();

            const notesListResponse = await page.request.get(`${API_BASE}/students/${studentId}/notes`, {
                headers,
                params: { limit: 20 },
            });
            expect(notesListResponse.ok()).toBeTruthy();
            const notes = asArray<{ id: string }>(await notesListResponse.json());
            expect(notes.some((row) => row.id === noteId)).toBeTruthy();

            const createHomeworkResponse = await page.request.post(`${API_BASE}/students/${studentId}/homework`, {
                headers,
                data: {
                    task: `EXT homework ${randomSuffix()}`,
                    dueAt: plusDaysDate(7),
                },
            });
            expect(createHomeworkResponse.ok()).toBeTruthy();
            const homework = (await createHomeworkResponse.json()) as { id: string; status: string };
            homeworkId = homework.id;
            expect(homework.status).toBe("PENDING");

            const updateHomeworkResponse = await page.request.patch(`${API_BASE}/students/${studentId}/homework/${homeworkId}`, {
                headers,
                data: {
                    status: "COMPLETED",
                    task: `EXT homework completed ${randomSuffix()}`,
                },
            });
            expect(updateHomeworkResponse.ok()).toBeTruthy();

            const homeworkListResponse = await page.request.get(`${API_BASE}/students/${studentId}/homework`, {
                headers,
                params: { limit: 20 },
            });
            expect(homeworkListResponse.ok()).toBeTruthy();
            const homeworks = asArray<{ id: string; status: string }>(await homeworkListResponse.json());
            const updated = homeworks.find((row) => row.id === homeworkId);
            expect(updated?.status).toBe("COMPLETED");

            const deleteHomeworkResponse = await page.request.delete(`${API_BASE}/students/${studentId}/homework/${homeworkId}`, {
                headers,
            });
            expect(deleteHomeworkResponse.status()).toBe(204);
            homeworkId = null;

            const deleteNoteResponse = await page.request.delete(`${API_BASE}/students/${studentId}/notes/${noteId}`, {
                headers,
            });
            expect(deleteNoteResponse.status()).toBe(204);
            noteId = null;
        } finally {
            if (homeworkId && studentId) {
                await safeDelete(page, `${API_BASE}/students/${studentId}/homework/${homeworkId}`, headers);
            }
            if (noteId && studentId) {
                await safeDelete(page, `${API_BASE}/students/${studentId}/notes/${noteId}`, headers);
            }
            if (studentId) {
                await safeDelete(page, `${API_BASE}/students/${studentId}`, headers);
            }
        }
    });

    test("EXT-SCHED-001 recurrence and lesson statuses matrix", async ({ authedPage: page }) => {
        const headers = await authHeaders(page);
        let studentId: string | null = null;
        const createdLessonIds = new Set<string>();
        let recurrenceAnchorLessonId: string | null = null;

        try {
            const student = await createStudent(page, headers, { subject: "Физика" });
            studentId = student.id;

            const recurrenceStart = new Date(Date.now() + 3 * 60 * 60 * 1000);
            const recurrenceLessons = await createLesson(page, headers, {
                studentId,
                subject: "Физика",
                scheduledAt: recurrenceStart.toISOString(),
                recurrence: {
                    enabled: true,
                    until: plusDaysDate(14),
                    weekdays: [weekdayOneToSeven(recurrenceStart)],
                },
            });
            expect(recurrenceLessons.length).toBeGreaterThan(1);
            recurrenceAnchorLessonId = recurrenceLessons[0].id;
            recurrenceLessons.forEach((lesson) => createdLessonIds.add(lesson.id));

            const cancelledLesson = (await createLesson(page, headers, {
                studentId,
                subject: "Физика",
                scheduledAt: plusMinutesIso(300),
            }))[0];
            createdLessonIds.add(cancelledLesson.id);

            const cancelStatusResponse = await page.request.patch(`${API_BASE}/lessons/${cancelledLesson.id}/status`, {
                headers,
                data: {
                    status: "CANCELLED_STUDENT",
                    cancelReason: "EXT cancel",
                },
            });
            expect(cancelStatusResponse.ok()).toBeTruthy();
            const cancelledPayload = (await cancelStatusResponse.json()) as LessonEntity;
            expect(cancelledPayload.status).toBe("CANCELLED_STUDENT");

            const noShowLesson = (await createLesson(page, headers, {
                studentId,
                subject: "Физика",
                scheduledAt: plusMinutesIso(420),
            }))[0];
            createdLessonIds.add(noShowLesson.id);
            const noShowResponse = await page.request.patch(`${API_BASE}/lessons/${noShowLesson.id}/status`, {
                headers,
                data: {
                    status: "NO_SHOW",
                    note: "EXT no-show",
                },
            });
            expect(noShowResponse.ok()).toBeTruthy();
            const noShowPayload = (await noShowResponse.json()) as LessonEntity;
            expect(noShowPayload.status).toBe("NO_SHOW");

            const completedLesson = (await createLesson(page, headers, {
                studentId,
                subject: "Физика",
                scheduledAt: plusMinutesIso(540),
            }))[0];
            createdLessonIds.add(completedLesson.id);
            const completeResponse = await page.request.patch(`${API_BASE}/lessons/${completedLesson.id}/status`, {
                headers,
                data: {
                    status: "COMPLETED",
                },
            });
            expect(completeResponse.ok()).toBeTruthy();
            const completePayload = (await completeResponse.json()) as LessonEntity;
            expect(completePayload.status).toBe("COMPLETED");

            const reschedulePendingLesson = (await createLesson(page, headers, {
                studentId,
                subject: "Физика",
                scheduledAt: plusMinutesIso(660),
            }))[0];
            createdLessonIds.add(reschedulePendingLesson.id);
            const rescheduleResponse = await page.request.patch(`${API_BASE}/lessons/${reschedulePendingLesson.id}/status`, {
                headers,
                data: {
                    status: "RESCHEDULE_PENDING",
                },
            });
            expect(rescheduleResponse.ok()).toBeTruthy();
            const reschedulePayload = (await rescheduleResponse.json()) as LessonEntity;
            expect(reschedulePayload.status).toBe("RESCHEDULE_PENDING");
        } finally {
            if (recurrenceAnchorLessonId) {
                await safeDelete(page, `${API_BASE}/lessons/${recurrenceAnchorLessonId}`, headers, { deleteRecurrence: true });
                createdLessonIds.delete(recurrenceAnchorLessonId);
            }
            for (const lessonId of createdLessonIds) {
                await safeDelete(page, `${API_BASE}/lessons/${lessonId}`, headers);
            }
            if (studentId) {
                await safeDelete(page, `${API_BASE}/students/${studentId}`, headers);
            }
        }
    });

    test("EXT-SCHED-002 availability and overrides edge cases", async ({ authedPage: page }) => {
        const headers = await authHeaders(page);
        const targetDate = plusDaysDate(3);
        const weeklyBeforeResponse = await page.request.get(`${API_BASE}/availability`, { headers });
        expect(weeklyBeforeResponse.ok()).toBeTruthy();
        const originalWeeklySlots = (await weeklyBeforeResponse.json()) as Array<{
            dayOfWeek: number;
            startTime: string;
            endTime: string;
        }>;

        try {
            const setWeeklyResponse = await page.request.put(`${API_BASE}/availability`, {
                headers,
                data: {
                    slots: [
                        { dayOfWeek: 1, startTime: "10:00", endTime: "11:00" },
                        { dayOfWeek: 3, startTime: "12:00", endTime: "13:00" },
                    ],
                },
            });
            expect(setWeeklyResponse.ok()).toBeTruthy();

            const blockDayResponse = await page.request.put(`${API_BASE}/availability/overrides/${targetDate}`, {
                headers,
                data: {
                    isBlocked: true,
                    slots: [],
                },
            });
            expect(blockDayResponse.ok()).toBeTruthy();

            const overridesBlockedResponse = await page.request.get(`${API_BASE}/availability/overrides`, { headers });
            expect(overridesBlockedResponse.ok()).toBeTruthy();
            const blockedOverrides = (await overridesBlockedResponse.json()) as Array<{
                date: string;
                isBlocked: boolean;
                slots: Array<{ startTime: string; endTime: string }>;
            }>;
            const blockedTarget = blockedOverrides.find((row) => row.date === targetDate);
            expect(blockedTarget?.isBlocked).toBeTruthy();

            const customSlotsResponse = await page.request.put(`${API_BASE}/availability/overrides/${targetDate}`, {
                headers,
                data: {
                    isBlocked: false,
                    slots: [{ startTime: "15:00", endTime: "16:00" }],
                },
            });
            expect(customSlotsResponse.ok()).toBeTruthy();

            const overridesCustomResponse = await page.request.get(`${API_BASE}/availability/overrides`, { headers });
            expect(overridesCustomResponse.ok()).toBeTruthy();
            const customOverrides = (await overridesCustomResponse.json()) as Array<{
                date: string;
                isBlocked: boolean;
                slots: Array<{ startTime: string; endTime: string }>;
            }>;
            const customTarget = customOverrides.find((row) => row.date === targetDate);
            expect(customTarget?.isBlocked).toBeFalsy();
            expect((customTarget?.slots || []).length).toBeGreaterThan(0);

            const deleteOverrideResponse = await page.request.delete(`${API_BASE}/availability/overrides/${targetDate}`, {
                headers,
            });
            expect(deleteOverrideResponse.ok()).toBeTruthy();
        } finally {
            await page.request.put(`${API_BASE}/availability`, {
                headers,
                data: { slots: originalWeeklySlots },
            }).catch(() => null);
            await page.request.delete(`${API_BASE}/availability/overrides/${targetDate}`, {
                headers,
            }).catch(() => null);
        }
    });

    test("EXT-PAY-001 linked/manual payments and method matrix", async ({ authedPage: page }) => {
        const headers = await authHeaders(page);
        let studentId: string | null = null;
        const lessonIds = new Set<string>();
        const paymentIds = new Set<string>();

        try {
            const student = await createStudent(page, headers, { subject: "Алгебра" });
            studentId = student.id;

            const completedLesson = (await createLesson(page, headers, {
                studentId,
                subject: "Алгебра",
                scheduledAt: plusMinutesIso(240),
            }))[0];
            lessonIds.add(completedLesson.id);

            const markCompletedResponse = await page.request.patch(`${API_BASE}/lessons/${completedLesson.id}/status`, {
                headers,
                data: { status: "COMPLETED" },
            });
            expect(markCompletedResponse.ok()).toBeTruthy();

            const linkedPaymentResponse = await page.request.post(`${API_BASE}/payments`, {
                headers,
                data: {
                    studentId,
                    amount: 4200,
                    method: "SBP",
                    lessonId: completedLesson.id,
                    comment: "EXT linked payment",
                },
            });
            expect(linkedPaymentResponse.ok()).toBeTruthy();
            const linkedPayment = (await linkedPaymentResponse.json()) as PaymentEntity;
            paymentIds.add(linkedPayment.id);
            expect(linkedPayment.lessonId).toBe(completedLesson.id);

            const duplicateLinkedResponse = await page.request.post(`${API_BASE}/payments`, {
                headers,
                data: {
                    studentId,
                    amount: 4300,
                    method: "TRANSFER",
                    lessonId: completedLesson.id,
                    comment: "EXT duplicate link",
                },
            });
            expect(duplicateLinkedResponse.status()).toBe(400);

            const plannedLesson = (await createLesson(page, headers, {
                studentId,
                subject: "Алгебра",
                scheduledAt: plusMinutesIso(360),
            }))[0];
            lessonIds.add(plannedLesson.id);

            const linkPlannedLessonPayment = await page.request.post(`${API_BASE}/payments`, {
                headers,
                data: {
                    studentId,
                    amount: 3100,
                    method: "CASH",
                    lessonId: plannedLesson.id,
                },
            });
            expect(linkPlannedLessonPayment.status()).toBe(400);

            const methods = ["CASH", "TRANSFER", "YUKASSA"] as const;
            for (const method of methods) {
                const paymentResponse = await page.request.post(`${API_BASE}/payments`, {
                    headers,
                    data: {
                        studentId,
                        amount: 1200 + paymentIds.size,
                        method,
                        comment: `EXT method ${method}`,
                    },
                });
                expect(paymentResponse.ok()).toBeTruthy();
                const payment = (await paymentResponse.json()) as PaymentEntity;
                paymentIds.add(payment.id);
                expect(payment.method).toBe(method);
            }

            const cashFilterResponse = await page.request.get(`${API_BASE}/payments`, {
                headers,
                params: { method: "CASH", limit: 100 },
            });
            expect(cashFilterResponse.ok()).toBeTruthy();
            const cashRows = asArray<PaymentEntity>(await cashFilterResponse.json());
            expect(cashRows.some((row) => row.method === "CASH")).toBeTruthy();

            const manualPaymentId = Array.from(paymentIds).find((id) => id !== linkedPayment.id);
            expect(Boolean(manualPaymentId)).toBeTruthy();
            if (manualPaymentId) {
                const deleteManualResponse = await page.request.delete(`${API_BASE}/payments/${manualPaymentId}`, {
                    headers,
                });
                expect(deleteManualResponse.ok()).toBeTruthy();
                paymentIds.delete(manualPaymentId);
            }
        } finally {
            for (const paymentId of paymentIds) {
                await safeDelete(page, `${API_BASE}/payments/${paymentId}`, headers);
            }
            for (const lessonId of lessonIds) {
                await safeDelete(page, `${API_BASE}/lessons/${lessonId}`, headers);
            }
            if (studentId) {
                await safeDelete(page, `${API_BASE}/students/${studentId}`, headers);
            }
        }
    });

    test("EXT-PKG-001 public/private packages with validity behavior", async ({ authedPage: page }) => {
        const headers = await authHeaders(page);
        let studentId: string | null = null;
        let privatePackageId: string | null = null;
        let activePublicPackageId: string | null = null;
        let expiredPublicPackageId: string | null = null;
        let restoreProfile: (() => Promise<void>) | null = null;

        try {
            const student = await createStudent(page, headers, { subject: "Геометрия" });
            studentId = student.id;

            const invalidPrivatePackageResponse = await page.request.post(`${API_BASE}/packages`, {
                headers,
                data: {
                    subject: "Геометрия",
                    lessonsTotal: 8,
                    totalPrice: 12000,
                },
            });
            expect(invalidPrivatePackageResponse.status()).toBe(400);

            const privatePackageResponse = await page.request.post(`${API_BASE}/packages`, {
                headers,
                data: {
                    studentId,
                    subject: "Геометрия",
                    lessonsTotal: 8,
                    totalPrice: 12000,
                    comment: "EXT private",
                },
            });
            expect(privatePackageResponse.ok()).toBeTruthy();
            const privatePackage = (await privatePackageResponse.json()) as PackageEntity;
            privatePackageId = privatePackage.id;
            expect(privatePackage.isPublic).toBeFalsy();
            expect(privatePackage.studentId).toBe(studentId);

            const switchToPublicResponse = await page.request.patch(`${API_BASE}/packages/${privatePackageId}`, {
                headers,
                data: {
                    isPublic: true,
                },
            });
            expect(switchToPublicResponse.ok()).toBeTruthy();
            const switchedPackage = (await switchToPublicResponse.json()) as PackageEntity;
            expect(switchedPackage.isPublic).toBeTruthy();
            expect(switchedPackage.studentId ?? null).toBeNull();

            const activePublicPackageResponse = await page.request.post(`${API_BASE}/packages`, {
                headers,
                data: {
                    isPublic: true,
                    subject: "Геометрия",
                    lessonsTotal: 6,
                    totalPrice: 9900,
                    validUntil: plusDaysDate(14),
                    comment: "EXT public active",
                },
            });
            expect(activePublicPackageResponse.ok()).toBeTruthy();
            activePublicPackageId = ((await activePublicPackageResponse.json()) as PackageEntity).id;

            const expiredPublicPackageResponse = await page.request.post(`${API_BASE}/packages`, {
                headers,
                data: {
                    isPublic: true,
                    subject: "Геометрия",
                    lessonsTotal: 4,
                    totalPrice: 6000,
                    validUntil: plusDaysDate(-1),
                    comment: "EXT public expired",
                },
            });
            expect(expiredPublicPackageResponse.ok()).toBeTruthy();
            expiredPublicPackageId = ((await expiredPublicPackageResponse.json()) as PackageEntity).id;

            const publicProfile = await ensurePublicProfile(page, headers, "ext-pkg");
            restoreProfile = publicProfile.restore;

            const publicProfileResponse = await page.request.get(
                `${API_BASE}/public/tutors/${encodeURIComponent(publicProfile.slug)}`,
            );
            expect(publicProfileResponse.ok()).toBeTruthy();
            const profilePayload = (await publicProfileResponse.json()) as {
                publicPackages?: Array<{ id: string }>;
            };
            const publicPackages = profilePayload.publicPackages || [];
            expect(publicPackages.some((pkg) => pkg.id === activePublicPackageId)).toBeTruthy();
            expect(publicPackages.some((pkg) => pkg.id === expiredPublicPackageId)).toBeFalsy();
        } finally {
            if (restoreProfile) {
                await restoreProfile();
            }
            if (privatePackageId) {
                await safeDelete(page, `${API_BASE}/packages/${privatePackageId}`, headers);
            }
            if (activePublicPackageId) {
                await safeDelete(page, `${API_BASE}/packages/${activePublicPackageId}`, headers);
            }
            if (expiredPublicPackageId) {
                await safeDelete(page, `${API_BASE}/packages/${expiredPublicPackageId}`, headers);
            }
            if (studentId) {
                await safeDelete(page, `${API_BASE}/students/${studentId}`, headers);
            }
        }
    });

    test("EXT-FILE-001 files sync branches and share/revoke", async ({ authedPage: page }) => {
        const headers = await authHeaders(page);
        const filesOverviewResponse = await page.request.get(`${API_BASE}/files`, { headers });
        expect(filesOverviewResponse.ok()).toBeTruthy();
        const filesOverview = (await filesOverviewResponse.json()) as {
            cloudConnections?: unknown[];
            files?: Array<{ id: string }>;
            studentAccess?: unknown[];
        };

        expect(Array.isArray(filesOverview.cloudConnections)).toBeTruthy();
        expect(Array.isArray(filesOverview.files)).toBeTruthy();
        expect(Array.isArray(filesOverview.studentAccess)).toBeTruthy();

        // Sync endpoint must respond with a known contract:
        //   2xx    - integration connected and sync succeeded (NestJS @Post returns 201 by default)
        //   400    - integration not configured / invalid folder
        //   401    - provider token expired
        //   502/503 - upstream provider unavailable
        const isAcceptableSyncStatus = (status: number) =>
            (status >= 200 && status < 300) || [400, 401, 502, 503].includes(status);
        const yandexSyncResponse = await page.request.post(`${API_BASE}/files/yandex-disk/sync`, { headers });
        expect(isAcceptableSyncStatus(yandexSyncResponse.status())).toBeTruthy();

        const googleSyncResponse = await page.request.post(`${API_BASE}/files/google-drive/sync`, { headers });
        expect(isAcceptableSyncStatus(googleSyncResponse.status())).toBeTruthy();

        const firstFile = filesOverview.files?.[0];
        if (!firstFile) {
            return;
        }

        let createdStudentId: string | null = null;
        try {
            const activeStudentsResponse = await page.request.get(`${API_BASE}/students`, {
                headers,
                params: { status: "ACTIVE", limit: 1 },
            });
            expect(activeStudentsResponse.ok()).toBeTruthy();
            const activeStudents = asArray<StudentEntity>(await activeStudentsResponse.json());
            let targetStudentId = activeStudents[0]?.id;

            if (!targetStudentId) {
                const createdStudent = await createStudent(page, headers, { subject: "История" });
                createdStudentId = createdStudent.id;
                targetStudentId = createdStudent.id;
            }

            const shareResponse = await page.request.patch(`${API_BASE}/files/${firstFile.id}/share`, {
                headers,
                data: {
                    studentIds: [targetStudentId],
                    applyToChildren: false,
                },
            });
            expect(shareResponse.ok()).toBeTruthy();
            const sharePayload = (await shareResponse.json()) as { success?: boolean; updatedItems?: number };
            expect(sharePayload.success).toBeTruthy();
            expect((sharePayload.updatedItems || 0) >= 1).toBeTruthy();

            const revokeResponse = await page.request.patch(`${API_BASE}/files/${firstFile.id}/share`, {
                headers,
                data: {
                    studentIds: [],
                    applyToChildren: false,
                },
            });
            expect(revokeResponse.ok()).toBeTruthy();
        } finally {
            if (createdStudentId) {
                await safeDelete(page, `${API_BASE}/students/${createdStudentId}`, headers);
            }
        }
    });

    test("EXT-NOTIF-001 booking approve/reject and reschedule negative branch", async ({ authedPage: page }) => {
        const headers = await authHeaders(page);
        const publicProfile = await ensurePublicProfile(page, headers, "ext-notif");

        let confirmedStudentId: string | null = null;
        let confirmedLessonId: string | null = null;

        try {
            const markerConfirm = randomSuffix();
            const bookingConfirm = await createPublicBooking(page, publicProfile.slug, markerConfirm);
            test.skip(!bookingConfirm?.booking?.id, "No available public slots for booking-confirm flow.");

            const bookingNotification = await waitForBookingNotification(
                page,
                headers,
                String(bookingConfirm?.booking?.id),
            );
            expect(bookingNotification).toBeTruthy();

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

            const doubleConfirmResponse = await page.request.post(
                `${API_BASE}/notifications/${bookingNotification!.id}/confirm-booking`,
                { headers },
            );
            expect(doubleConfirmResponse.status()).toBe(400);

            const markerReject = randomSuffix();
            const bookingReject = await createPublicBooking(page, publicProfile.slug, markerReject);
            test.skip(!bookingReject?.booking?.id, "No available public slots for booking-reject flow.");

            const bookingRejectNotification = await waitForBookingNotification(
                page,
                headers,
                String(bookingReject?.booking?.id),
            );
            expect(bookingRejectNotification).toBeTruthy();

            const rejectResponse = await page.request.post(
                `${API_BASE}/notifications/${bookingRejectNotification!.id}/reject-booking`,
                { headers },
            );
            expect(rejectResponse.ok()).toBeTruthy();

            const wrongConfirmReschedule = await page.request.post(
                `${API_BASE}/notifications/${bookingRejectNotification!.id}/confirm-reschedule`,
                { headers },
            );
            expect(wrongConfirmReschedule.status()).toBe(400);

            const wrongRejectReschedule = await page.request.post(
                `${API_BASE}/notifications/${bookingRejectNotification!.id}/reject-reschedule`,
                { headers },
            );
            expect(wrongRejectReschedule.status()).toBe(400);
        } finally {
            await publicProfile.restore();
            if (confirmedLessonId) {
                await safeDelete(page, `${API_BASE}/lessons/${confirmedLessonId}`, headers);
            }
            if (confirmedStudentId) {
                await safeDelete(page, `${API_BASE}/students/${confirmedStudentId}`, headers);
            }
        }
    });

    test("EXT-SET-001 settings guards and persistence", async ({ authedPage: page }) => {
        const headers = await authHeaders(page);
        const settingsResponse = await page.request.get(`${API_BASE}/settings`, { headers });
        expect(settingsResponse.ok()).toBeTruthy();
        const settings = (await settingsResponse.json()) as {
            showPublicPackages?: boolean;
        };
        const originalShowPublicPackages = settings.showPublicPackages !== false;

        try {
            const slugCheckResponse = await page.request.get(`${API_BASE}/settings/account/slug`, {
                headers,
                params: { value: `ext-settings-${randomSuffix()}` },
            });
            expect(slugCheckResponse.ok()).toBeTruthy();
            const slugPayload = (await slugCheckResponse.json()) as { suggested?: string };
            expect(String(slugPayload.suggested || "").length).toBeGreaterThan(0);

            const publishWithoutSlugResponse = await page.request.patch(`${API_BASE}/settings/account`, {
                headers,
                data: {
                    slug: "",
                    published: true,
                },
            });
            expect(publishWithoutSlugResponse.status()).toBe(400);

            const toggleShowPublicPackagesResponse = await page.request.patch(`${API_BASE}/settings/account`, {
                headers,
                data: {
                    showPublicPackages: !originalShowPublicPackages,
                },
            });
            expect(toggleShowPublicPackagesResponse.ok()).toBeTruthy();

            const verifySettingsResponse = await page.request.get(`${API_BASE}/settings`, { headers });
            expect(verifySettingsResponse.ok()).toBeTruthy();
            const verifySettings = (await verifySettingsResponse.json()) as { showPublicPackages?: boolean };
            expect(verifySettings.showPublicPackages !== false).toBe(!originalShowPublicPackages);

            const disconnectUnknownResponse = await page.request.delete(`${API_BASE}/settings/integrations/unknown-ext`, {
                headers,
            });
            expect(disconnectUnknownResponse.status()).toBe(400);

            const disconnectYandexDiskResponse = await page.request.delete(`${API_BASE}/settings/integrations/yandex-disk`, {
                headers,
            });
            expect([200, 204].includes(disconnectYandexDiskResponse.status())).toBeTruthy();
        } finally {
            await page.request.patch(`${API_BASE}/settings/account`, {
                headers,
                data: {
                    showPublicPackages: originalShowPublicPackages,
                },
            }).catch(() => null);
        }
    });

    test("EXT-PUBLIC-001 public profile sections and dialogs", async ({ authedPage: page }) => {
        const headers = await authHeaders(page);
        const publicProfile = await ensurePublicProfile(page, headers, "ext-public");

        try {
            await page.goto(`/t/${publicProfile.slug}`, { waitUntil: "domcontentloaded" });
            await page.waitForLoadState("networkidle");

            await expect(page.locator(".repeto-tp-page").first()).toBeVisible();
            await expect(page.locator(".repeto-tp-section").first()).toBeVisible();

            const allReviewsButton = page.locator("button").filter({ hasText: /Все отзывы/i }).first();
            if (await allReviewsButton.isVisible().catch(() => false)) {
                await allReviewsButton.click();
                await expect(page.locator("[role='dialog']").first()).toBeVisible();
                await page.keyboard.press("Escape");
            }

            const certThumb = page.locator(".repeto-tp-cert-thumb").first();
            if (await certThumb.isVisible().catch(() => false)) {
                await certThumb.click();
                const certDialog = page.locator(".repeto-tp-lightbox-dialog, [role='dialog']").first();
                await expect(certDialog).toBeVisible();
                await page.keyboard.press("Escape");
            }

            const policyTrigger = page.locator("button").filter({ hasText: /Политика/i }).first();
            if (await policyTrigger.isVisible().catch(() => false)) {
                await policyTrigger.click();
                // Policy opens either as a full dialog or as an inline popup/tooltip.
                const policySurface = page
                    .locator("[role='dialog'], .repeto-tp-policy-popup, [role='tooltip']")
                    .first();
                await expect(policySurface).toBeVisible();
                await page.keyboard.press("Escape");
            }
        } finally {
            await publicProfile.restore();
        }
    });

    test("EXT-BOOK-001 full booking wizard until OTP step", async ({ authedPage: page }) => {
        const headers = await authHeaders(page);
        const publicProfile = await ensurePublicProfile(page, headers, "ext-book");
        const marker = randomSuffix();

        try {
            await page.goto(`/t/${publicProfile.slug}/book`, { waitUntil: "domcontentloaded" });
            await page.waitForLoadState("networkidle");
            await expect(page.locator(".repeto-bk-step, .repeto-bk-options, .repeto-bk-option").first()).toBeVisible({ timeout: 20_000 });

            const subjectOrPackageOption = page.locator(".repeto-bk-option").first();
            test.skip(!(await subjectOrPackageOption.isVisible().catch(() => false)), "No public subjects or packages visible in booking wizard.");
            await subjectOrPackageOption.click();

            await page.locator(".repeto-bk-action-btn").filter({ hasText: /Продолжить/i }).first().click();

            const availableDay = page.locator(".repeto-bk-cal-day:not(.repeto-bk-cal-day--disabled)").first();
            test.skip(!(await availableDay.isVisible().catch(() => false)), "No available days in booking calendar.");
            await availableDay.click();

            const firstTimeSlot = page.locator(".repeto-bk-time-slot").first();
            await expect(firstTimeSlot).toBeVisible();
            await firstTimeSlot.click();

            await page.locator(".repeto-bk-action-btn").filter({ hasText: /Продолжить/i }).first().click();

            await page.getByPlaceholder("Иван Иванов").fill(`EXT Wizard ${marker}`);
            await page.getByPlaceholder("+7 (900) 123-45-67").fill("+7 999 123 45 67");
            await page.getByPlaceholder("email@example.com").fill(`ext.wizard.${marker}@example.com`);

            const consentLabel = page.getByText(/персональных данных/i).first();
            await consentLabel.click();

            const submitButton = page.locator(".repeto-bk-action-btn").filter({ hasText: /Подтвердить почту/i }).first();
            await submitButton.click();

            await expect(page.locator(".repeto-bk-step--otp")).toBeVisible({ timeout: 20_000 });

            const notificationsResponse = await page.request.get(`${API_BASE}/notifications`, {
                headers,
                params: { type: "BOOKING_NEW", limit: 100 },
            });
            if (notificationsResponse.ok()) {
                const notifications = asArray<NotificationEntity>(await notificationsResponse.json());
                const createdByMarker = notifications.find((row) => row.description.includes(`EXT Wizard ${marker}`));
                if (createdByMarker) {
                    await page.request.post(`${API_BASE}/notifications/${createdByMarker.id}/reject-booking`, {
                        headers,
                    }).catch(() => null);
                }
            }
        } finally {
            await publicProfile.restore();
        }
    });

    test("EXT-PORTAL-001 student portal auth and otp guard paths", async ({ authedPage: page }) => {
        const headers = await authHeaders(page);
        let studentId: string | null = null;
        const studentEmail = `ext.portal.${randomSuffix()}@example.com`;

        try {
            const student = await createStudent(page, headers, { email: studentEmail, subject: "Химия" });
            studentId = student.id;

            const requestOtpResponse = await page.request.post(`${API_BASE}/student-auth/request-otp`, {
                data: { email: studentEmail },
            });
            expect(requestOtpResponse.ok()).toBeTruthy();

            const verifyWrongOtpResponse = await page.request.post(`${API_BASE}/student-auth/verify-otp`, {
                data: { email: studentEmail, code: "000000" },
            });
            expect(verifyWrongOtpResponse.status()).toBe(400);

            const tutorTokenPortalAccess = await page.request.get(`${API_BASE}/student-portal/tutors`, {
                headers,
            });
            expect(tutorTokenPortalAccess.status()).toBeGreaterThanOrEqual(400);
        } finally {
            if (studentId) {
                await safeDelete(page, `${API_BASE}/students/${studentId}`, headers);
            }
        }
    });

    test("EXT-RESP-001 mobile layout navigation/fab mechanics", async ({ authedPage: page }) => {
        await page.setViewportSize({ width: 390, height: 844 });
        await page.goto("/dashboard", { waitUntil: "domcontentloaded" });
        await page.waitForLoadState("networkidle");

        await expect(page.locator(".repeto-mobile-nav")).toBeVisible();

        const fab = page.locator(".repeto-mobile-fab").first();
        await expect(fab).toBeVisible();
        await fab.click();
        const quickActionsMenu = page.locator(".repeto-quick-actions-menu").first();
        await expect(quickActionsMenu).toBeVisible();
        await page.keyboard.press("Escape");
        await expect(quickActionsMenu).toBeHidden({ timeout: 10_000 });

        await page.goto("/students", { waitUntil: "domcontentloaded" });
        await page.waitForLoadState("networkidle");
        await expect(page.locator(".repeto-mobile-nav")).toBeVisible();
        await expect(page.locator(".page-overlay__title").first()).toBeVisible();
    });

    test("EXT-A11Y-001 keyboard flow and dialog semantics", async ({ authedPage: page }) => {
        await gotoAuthed(page, "/schedule");

        let createLessonButton = page
            .getByRole("button", { name: /Новое занятие|Добавить занятие|Создать занятие/i })
            .first();

        if (!(await createLessonButton.isVisible().catch(() => false))) {
            const mobileFab = page.locator(".repeto-mobile-fab").first();
            if (await mobileFab.isVisible().catch(() => false)) {
                await mobileFab.click().catch(() => null);
                createLessonButton = page.getByRole("button", { name: /занятие/i }).first();
            }
        }

        await expect(createLessonButton).toBeVisible();
        await createLessonButton.click();

        const dialog = page
            .locator("[aria-label='Новое занятие'], [aria-label^='Занятие:'], .lp2[role='dialog'], .repeto-lp[role='dialog']")
            .first();
        await expect(dialog).toBeVisible();

        let focusInsideDialog = false;
        for (let index = 0; index < 12; index += 1) {
            await page.keyboard.press("Tab");
            focusInsideDialog = await dialog.evaluate((dialogElement) => {
                const active = document.activeElement;
                return Boolean(active && dialogElement && dialogElement.contains(active));
            });
            if (focusInsideDialog) {
                break;
            }
        }

        if (!focusInsideDialog) {
            const firstFocusableInDialog = dialog
                .locator("button, input, select, textarea, [tabindex]:not([tabindex='-1'])")
                .first();

            if (await firstFocusableInDialog.isVisible().catch(() => false)) {
                await firstFocusableInDialog.focus();
                focusInsideDialog = await dialog.evaluate((dialogElement) => {
                    const active = document.activeElement;
                    return Boolean(active && dialogElement.contains(active));
                });
            }
        }

        expect(focusInsideDialog).toBeTruthy();

        await page.keyboard.press("Escape");
        await expect(dialog).toBeHidden({ timeout: 10_000 });

        await gotoAuthed(page, "/settings");
        await expect(page.locator("button[aria-label]").first()).toBeVisible();
    });
});
