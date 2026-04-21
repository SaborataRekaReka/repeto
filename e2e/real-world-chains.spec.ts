import { test, expect, getAuthToken } from "./helpers/auth";
import type { Page } from "@playwright/test";

const API_BASE = "/api";
const HARNESS_KEY = String(process.env.E2E_TEST_HARNESS_KEY || "").trim();
const SECOND_TUTOR_EMAIL = String(process.env.E2E_SECOND_TUTOR_EMAIL || "").trim();
const SECOND_TUTOR_PASSWORD = String(process.env.E2E_SECOND_TUTOR_PASSWORD || "").trim();

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
  lessonId?: string | null;
  studentId?: string | null;
};

type BookingSlot = {
  date: string;
  time: string;
  duration: number;
};

function randomSuffix() {
  return `${Date.now()}-${Math.floor(Math.random() * 1_000_000)}`;
}

function asArray<T>(payload: unknown): T[] {
  if (Array.isArray(payload)) return payload as T[];
  if (
    payload &&
    typeof payload === "object" &&
    Array.isArray((payload as { data?: unknown[] }).data)
  ) {
    return (payload as { data: T[] }).data;
  }
  return [];
}

function formatYmd(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatHm(date: Date) {
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  return `${hours}:${minutes}`;
}

async function authHeaders(page: Page) {
  const token = await getAuthToken(page);
  return { Authorization: `Bearer ${token}` };
}

async function safeDelete(page: Page, path: string, headers: Record<string, string>) {
  await page.request.delete(path, { headers }).catch(() => null);
}

async function createStudent(
  page: Page,
  headers: Record<string, string>,
  overrides: Partial<{
    name: string;
    email: string;
    phone: string;
    subject: string;
    rate: number;
  }> = {},
): Promise<StudentEntity> {
  const suffix = randomSuffix();
  const response = await page.request.post(`${API_BASE}/students`, {
    headers,
    data: {
      name: overrides.name || `RWC Student ${suffix}`,
      email: overrides.email || `rwc.student.${suffix}@example.com`,
      phone: overrides.phone || "+79990001122",
      subject: overrides.subject || "Математика",
      rate: overrides.rate ?? 2400,
    },
  });
  expect(response.ok()).toBeTruthy();
  return (await response.json()) as StudentEntity;
}

async function activateStudentAccount(
  page: Page,
  headers: Record<string, string>,
  studentId: string,
) {
  const response = await page.request.post(`${API_BASE}/students/${studentId}/activate-account`, {
    headers,
  });
  expect(response.ok()).toBeTruthy();
  const payload = (await response.json()) as {
    accountId?: string | null;
    invited?: boolean;
    status?: string | null;
  };
  const hasAccount = typeof payload.accountId === "string" && payload.accountId.trim().length > 0;
  const isInvited = payload.invited === true || payload.status === "INVITED";
  expect(hasAccount || isInvited).toBeTruthy();
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
    const slugPayload = (await slugResponse.json()) as {
      suggested?: string;
      requested?: string;
      slug?: string;
    };
    publicSlug = String(
      slugPayload.suggested || slugPayload.requested || slugPayload.slug || "",
    ).trim();
    expect(publicSlug.length).toBeGreaterThan(0);
  }

  const shouldPatch =
    !originalPublished ||
    publicSlug !== originalSlug ||
    settings.showPublicPackages === false;
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
    const publicResponse = await page.request.get(
      `${API_BASE}/public/tutors/${encodeURIComponent(publicSlug)}`,
    );
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
      await page.request
        .patch(`${API_BASE}/settings/account`, {
          headers,
          data: {
            slug: originalSlug,
            published: originalPublished,
            showPublicPackages: originalShowPublicPackages,
          },
        })
        .catch(() => null);
    },
  };
}

async function getFirstPublicSlot(page: Page, slug: string): Promise<BookingSlot | null> {
  const slotsResponse = await page.request.get(
    `${API_BASE}/public/tutors/${encodeURIComponent(slug)}/slots`,
  );
  if (!slotsResponse.ok()) return null;
  const slots = (await slotsResponse.json()) as BookingSlot[];
  if (!Array.isArray(slots) || slots.length === 0) return null;
  return slots[0];
}

async function createPublicBooking(params: {
  page: Page;
  slug: string;
  slot: BookingSlot;
  marker: string;
  email: string;
  phone: string;
  clientName: string;
}) {
  const profileResponse = await params.page.request.get(
    `${API_BASE}/public/tutors/${encodeURIComponent(params.slug)}`,
  );
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

  const bookingResponse = await params.page.request.post(
    `${API_BASE}/public/tutors/${encodeURIComponent(params.slug)}/book`,
    {
      data: {
        subject,
        date: params.slot.date,
        startTime: params.slot.time,
        clientName: params.clientName,
        clientPhone: params.phone,
        clientEmail: params.email,
        comment: `rwc-marker-${params.marker}`,
      },
    },
  );
  expect(bookingResponse.ok()).toBeTruthy();

  const payload = (await bookingResponse.json()) as { id?: string };
  return {
    bookingId: String(payload.id || ""),
    subject,
  };
}

async function waitForTutorNotification(
  page: Page,
  headers: Record<string, string>,
  type: string,
  predicate: (row: NotificationEntity) => boolean,
  timeoutMs = 20_000,
) {
  const startedAt = Date.now();

  while (Date.now() - startedAt < timeoutMs) {
    const response = await page.request.get(`${API_BASE}/notifications`, {
      headers,
      params: {
        type,
        limit: 100,
      },
    });

    if (response.ok()) {
      const rows = asArray<NotificationEntity>(await response.json());
      const found = rows.find(predicate);
      if (found) return found;
    }

    await page.waitForTimeout(500);
  }

  return null;
}

function harnessHeaders() {
  if (!HARNESS_KEY) {
    return {};
  }

  return {
    "x-test-harness-key": HARNESS_KEY,
  };
}

async function loginStudentViaHarness(page: Page, email: string) {
  const issueResponse = await page.request.post(
    `${API_BASE}/student-auth/testing/issue-and-read-otp`,
    {
      headers: harnessHeaders(),
      data: {
        email,
        purpose: "LOGIN",
      },
    },
  );

  if (issueResponse.status() === 403 || issueResponse.status() === 404) {
    return null;
  }

  expect(issueResponse.ok()).toBeTruthy();
  const issuePayload = (await issueResponse.json()) as { code?: string };
  const code = String(issuePayload.code || "").trim();
  expect(code).toMatch(/^\d{6}$/);

  const verifyResponse = await page.request.post(`${API_BASE}/student-auth/verify-otp`, {
    data: {
      email,
      code,
    },
  });
  expect(verifyResponse.ok()).toBeTruthy();

  const verifyPayload = (await verifyResponse.json()) as {
    accessToken?: string;
    account?: {
      id?: string;
      email?: string;
    };
  };

  return {
    accessToken: String(verifyPayload.accessToken || ""),
    accountId: String(verifyPayload.account?.id || ""),
  };
}

async function clearMessengerOutbox(page: Page, headers: Record<string, string>) {
  const response = await page.request.delete(`${API_BASE}/notifications/testing/messenger-outbox`, {
    headers,
  });

  if (response.status() === 403 || response.status() === 404) {
    return false;
  }

  expect(response.ok()).toBeTruthy();
  return true;
}

async function maybePickFileId(page: Page, headers: Record<string, string>) {
  const response = await page.request.get(`${API_BASE}/files`, { headers });
  if (!response.ok()) return [] as string[];

  const payload = (await response.json()) as {
    files?: Array<{ id?: string; type?: string }>;
  };

  const files = Array.isArray(payload.files) ? payload.files : [];
  const firstFile = files.find((row) => String(row.type || "").toLowerCase() === "file");
  if (!firstFile?.id) return [] as string[];

  return [firstFile.id];
}

async function loginTutorWithCredentials(page: Page, email: string, password: string) {
  const response = await page.request.post(`${API_BASE}/auth/login`, {
    data: {
      email,
      password,
    },
  });

  if (!response.ok()) {
    return null;
  }

  const payload = (await response.json()) as { accessToken?: string };
  const token = String(payload.accessToken || "").trim();
  return token || null;
}

test.describe("Real World Chains", () => {
  test.describe.configure({ mode: "serial" });
  test.setTimeout(300_000);

  test("RWC-BOOK-001 booking->confirm->portal->reschedule->messenger", async ({ authedPage: page }) => {
    const headers = await authHeaders(page);
    const profile = await ensurePublicProfile(page, headers, "rwc-book");
    const slot = await getFirstPublicSlot(page, profile.slug);
    test.skip(!slot, "No available public slot for real-world booking chain.");

    const marker = randomSuffix();
    const studentEmail = `rwc.booking.${marker}@example.com`;
    const studentPhone = `+7${String(Date.now()).slice(-10)}`;

    let studentId: string | null = null;
    let lessonId: string | null = null;

    try {
      const student = await createStudent(page, headers, {
        name: `RWC Booking ${marker}`,
        email: studentEmail,
        phone: studentPhone,
        subject: "Математика",
        rate: 2600,
      });
      studentId = student.id;

      await activateStudentAccount(page, headers, studentId);
      await clearMessengerOutbox(page, headers);

      const booking = await createPublicBooking({
        page,
        slug: profile.slug,
        slot: slot!,
        marker,
        email: studentEmail,
        phone: studentPhone,
        clientName: student.name,
      });
      expect(booking.bookingId.length).toBeGreaterThan(0);

      const bookingNotification = await waitForTutorNotification(
        page,
        headers,
        "BOOKING_NEW",
        (row) => row.bookingRequestId === booking.bookingId,
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
      studentId = String(confirmPayload.studentId || studentId || "");
      lessonId = String(confirmPayload.lessonId || "");
      expect(studentId.length).toBeGreaterThan(0);
      expect(lessonId.length).toBeGreaterThan(0);

      const studentSession = await loginStudentViaHarness(page, studentEmail);
      test.skip(!studentSession || !studentSession.accessToken, "Student OTP harness is unavailable in this environment.");
      const studentPortalHeaders = { Authorization: `Bearer ${studentSession!.accessToken}` };

      const tutorsResponse = await page.request.get(`${API_BASE}/student-portal/tutors`, {
        headers: studentPortalHeaders,
      });
      expect(tutorsResponse.ok()).toBeTruthy();
      const tutors = (await tutorsResponse.json()) as Array<{
        studentId?: string;
        tutorId?: string;
      }>;
      expect(Array.isArray(tutors)).toBeTruthy();
      expect(tutors.some((row) => row.studentId === studentId)).toBeTruthy();

      const dataResponse = await page.request.get(`${API_BASE}/student-portal/students/${studentId}/data`, {
        headers: studentPortalHeaders,
      });
      expect(dataResponse.ok()).toBeTruthy();
      const portalData = (await dataResponse.json()) as {
        upcomingLessons?: Array<{ id?: string }>;
      };
      const upcomingLessons = Array.isArray(portalData.upcomingLessons)
        ? portalData.upcomingLessons
        : [];
      expect(upcomingLessons.some((row) => row.id === lessonId)).toBeTruthy();

      const rescheduleAt = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000);
      rescheduleAt.setHours(11, 30, 0, 0);

      const rescheduleResponse = await page.request.post(
        `${API_BASE}/student-portal/students/${studentId}/lessons/${lessonId}/reschedule`,
        {
          headers: studentPortalHeaders,
          data: {
            newDate: formatYmd(rescheduleAt),
            newTime: formatHm(rescheduleAt),
          },
        },
      );
      expect(rescheduleResponse.ok()).toBeTruthy();

      const rescheduleNotification = await waitForTutorNotification(
        page,
        headers,
        "RESCHEDULE_REQUESTED",
        (row) => row.lessonId === lessonId,
      );
      expect(rescheduleNotification).toBeTruthy();

      const confirmRescheduleResponse = await page.request.post(
        `${API_BASE}/notifications/${rescheduleNotification!.id}/confirm-reschedule`,
        { headers },
      );
      expect(confirmRescheduleResponse.ok()).toBeTruthy();

      const outboxResponse = await page.request.get(`${API_BASE}/notifications/testing/messenger-outbox`, {
        headers,
        params: { studentId },
      });

      if (outboxResponse.status() !== 403 && outboxResponse.status() !== 404) {
        expect(outboxResponse.ok()).toBeTruthy();
        const outbox = (await outboxResponse.json()) as {
          mode?: string;
          records?: Array<{ eventType?: string; studentId?: string }>;
        };

        const records = Array.isArray(outbox.records) ? outbox.records : [];
        expect(["record", "live"]).toContain(String(outbox.mode || ""));
        expect(
          records.some(
            (row) => row.eventType === "lesson_assigned" && row.studentId === studentId,
          ),
        ).toBeTruthy();
      }
    } finally {
      await profile.restore();
      if (lessonId) {
        await safeDelete(page, `${API_BASE}/lessons/${lessonId}`, headers);
      }
      if (studentId) {
        await safeDelete(page, `${API_BASE}/students/${studentId}`, headers);
      }
    }
  });

  test("RWC-BOOK-004 late cancel creates penalty and tutor notification", async ({ authedPage: page }) => {
    const headers = await authHeaders(page);
    const marker = randomSuffix();

    const studentEmail = `rwc.cancel.${marker}@example.com`;
    let studentId: string | null = null;
    let lessonId: string | null = null;

    try {
      const student = await createStudent(page, headers, {
        name: `RWC Cancel ${marker}`,
        email: studentEmail,
        subject: "Физика",
        rate: 3300,
      });
      studentId = student.id;

      await activateStudentAccount(page, headers, studentId);

      const lessonAt = new Date(Date.now() + 30 * 60 * 1000);
      const lessonCreateResponse = await page.request.post(`${API_BASE}/lessons`, {
        headers,
        data: {
          studentId,
          subject: "Физика",
          scheduledAt: lessonAt.toISOString(),
          duration: 60,
          rate: 3300,
          format: "ONLINE",
        },
      });
      expect(lessonCreateResponse.ok()).toBeTruthy();

      const lesson = (await lessonCreateResponse.json()) as { id?: string };
      lessonId = String(lesson.id || "");
      expect(lessonId.length).toBeGreaterThan(0);

      const studentSession = await loginStudentViaHarness(page, studentEmail);
      test.skip(!studentSession || !studentSession.accessToken, "Student OTP harness is unavailable in this environment.");
      const studentPortalHeaders = { Authorization: `Bearer ${studentSession!.accessToken}` };

      const cancelResponse = await page.request.post(
        `${API_BASE}/student-portal/students/${studentId}/lessons/${lessonId}/cancel`,
        {
          headers: studentPortalHeaders,
        },
      );
      expect(cancelResponse.ok()).toBeTruthy();

      const cancelledLesson = (await cancelResponse.json()) as {
        status?: string;
        lateCancelCharge?: number | null;
      };

      expect(cancelledLesson.status).toBe("CANCELLED_STUDENT");
      expect(Number(cancelledLesson.lateCancelCharge || 0)).toBeGreaterThan(0);

      const cancelNotification = await waitForTutorNotification(
        page,
        headers,
        "LESSON_CANCELLED",
        (row) => row.lessonId === lessonId,
      );
      expect(cancelNotification).toBeTruthy();
    } finally {
      if (lessonId) {
        await safeDelete(page, `${API_BASE}/lessons/${lessonId}`, headers);
      }
      if (studentId) {
        await safeDelete(page, `${API_BASE}/students/${studentId}`, headers);
      }
    }
  });

  test("RWC-HW-001/002 tutor homework->student sees->done+upload", async ({ authedPage: page }) => {
    const headers = await authHeaders(page);
    const marker = randomSuffix();

    const studentEmail = `rwc.homework.${marker}@example.com`;
    let studentId: string | null = null;
    let lessonId: string | null = null;
    let homeworkId: string | null = null;

    try {
      const student = await createStudent(page, headers, {
        name: `RWC Homework ${marker}`,
        email: studentEmail,
        subject: "Химия",
        rate: 2700,
      });
      studentId = student.id;

      await activateStudentAccount(page, headers, studentId);

      const lessonAt = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000);
      const createLessonResponse = await page.request.post(`${API_BASE}/lessons`, {
        headers,
        data: {
          studentId,
          subject: "Химия",
          scheduledAt: lessonAt.toISOString(),
          duration: 60,
          rate: 2700,
          format: "ONLINE",
        },
      });
      expect(createLessonResponse.ok()).toBeTruthy();
      const lessonPayload = (await createLessonResponse.json()) as { id?: string };
      lessonId = String(lessonPayload.id || "");
      expect(lessonId.length).toBeGreaterThan(0);

      const maybeFileIds = await maybePickFileId(page, headers);
      const createHomeworkResponse = await page.request.post(`${API_BASE}/students/${studentId}/homework`, {
        headers,
        data: {
          task: `RWC homework task ${marker}`,
          dueAt: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
          lessonId,
          fileIds: maybeFileIds,
        },
      });
      expect(createHomeworkResponse.ok()).toBeTruthy();

      const homeworkPayload = (await createHomeworkResponse.json()) as { id?: string };
      homeworkId = String(homeworkPayload.id || "");
      expect(homeworkId.length).toBeGreaterThan(0);

      const studentSession = await loginStudentViaHarness(page, studentEmail);
      test.skip(!studentSession || !studentSession.accessToken, "Student OTP harness is unavailable in this environment.");
      const studentPortalHeaders = { Authorization: `Bearer ${studentSession!.accessToken}` };

      const dataBeforeResponse = await page.request.get(
        `${API_BASE}/student-portal/students/${studentId}/data`,
        {
          headers: studentPortalHeaders,
        },
      );
      expect(dataBeforeResponse.ok()).toBeTruthy();

      const dataBefore = (await dataBeforeResponse.json()) as {
        homework?: Array<{
          id?: string;
          task?: string;
          linkedFiles?: Array<{ id?: string }>;
        }>;
      };

      const homeworkRows = Array.isArray(dataBefore.homework) ? dataBefore.homework : [];
      const createdHomework = homeworkRows.find((row) => row.id === homeworkId);
      expect(createdHomework).toBeTruthy();
      expect(String(createdHomework?.task || "")).toContain("RWC homework task");

      if (maybeFileIds.length > 0) {
        expect(Array.isArray(createdHomework?.linkedFiles)).toBeTruthy();
        expect((createdHomework?.linkedFiles || []).length).toBeGreaterThan(0);
      }

      const toggleResponse = await page.request.patch(
        `${API_BASE}/student-portal/students/${studentId}/homework/${homeworkId}`,
        {
          headers: studentPortalHeaders,
          data: { done: true },
        },
      );
      expect(toggleResponse.ok()).toBeTruthy();
      const toggled = (await toggleResponse.json()) as { status?: string };
      expect(toggled.status).toBe("COMPLETED");

      const uploadResponse = await page.request.post(
        `${API_BASE}/student-portal/students/${studentId}/homework/${homeworkId}/upload`,
        {
          headers: studentPortalHeaders,
          multipart: {
            file: {
              name: `rwc-homework-${marker}.txt`,
              mimeType: "text/plain",
              buffer: Buffer.from("repeto rwc homework upload", "utf-8"),
            },
          },
        },
      );
      if (!uploadResponse.ok()) {
        expect(uploadResponse.status()).toBe(400);
        const uploadPayload = (await uploadResponse.json().catch(() => null)) as
          | { message?: string }
          | string
          | null;
        const uploadText = typeof uploadPayload === "string"
          ? uploadPayload
          : String(uploadPayload?.message || "");
        test.skip(
          /не подключен|подключите интеграцию|диск/i.test(uploadText),
          "Homework upload requires connected cloud disk integration in this environment.",
        );
        expect(uploadResponse.ok()).toBeTruthy();
      }

      const dataAfterResponse = await page.request.get(
        `${API_BASE}/student-portal/students/${studentId}/data`,
        {
          headers: studentPortalHeaders,
        },
      );
      expect(dataAfterResponse.ok()).toBeTruthy();

      const dataAfter = (await dataAfterResponse.json()) as {
        homework?: Array<{
          id?: string;
          done?: boolean;
          studentUploads?: Array<{ url?: string }>;
        }>;
      };
      const updatedHomework = (Array.isArray(dataAfter.homework) ? dataAfter.homework : []).find(
        (row) => row.id === homeworkId,
      );
      expect(updatedHomework).toBeTruthy();
      expect(Boolean(updatedHomework?.done)).toBeTruthy();
      expect((updatedHomework?.studentUploads || []).length).toBeGreaterThan(0);

      const homeworkNotification = await waitForTutorNotification(
        page,
        headers,
        "HOMEWORK_SUBMITTED",
        (row) => row.studentId === studentId,
      );
      expect(homeworkNotification).toBeTruthy();
    } finally {
      if (homeworkId && studentId) {
        await page.request
          .delete(`${API_BASE}/students/${studentId}/homework/${homeworkId}`, { headers })
          .catch(() => null);
      }
      if (lessonId) {
        await safeDelete(page, `${API_BASE}/lessons/${lessonId}`, headers);
      }
      if (studentId) {
        await safeDelete(page, `${API_BASE}/students/${studentId}`, headers);
      }
    }
  });

  test("RWC-MULTI-001 same student switches between two tutors", async ({ authedPage: page }) => {
    test.skip(
      !SECOND_TUTOR_EMAIL || !SECOND_TUTOR_PASSWORD,
      "Set E2E_SECOND_TUTOR_EMAIL and E2E_SECOND_TUTOR_PASSWORD for multi-tutor chain.",
    );

    const firstTutorHeaders = await authHeaders(page);
    const marker = randomSuffix();
    const studentEmail = `rwc.multi.${marker}@example.com`;

    let firstTutorStudentId: string | null = null;
    let secondTutorStudentId: string | null = null;
    let secondTutorToken: string | null = null;

    try {
      const firstStudent = await createStudent(page, firstTutorHeaders, {
        name: `RWC Multi ${marker}`,
        email: studentEmail,
        subject: "Английский",
        rate: 2500,
      });
      firstTutorStudentId = firstStudent.id;
      await activateStudentAccount(page, firstTutorHeaders, firstTutorStudentId);

      secondTutorToken = await loginTutorWithCredentials(
        page,
        SECOND_TUTOR_EMAIL,
        SECOND_TUTOR_PASSWORD,
      );
      test.skip(!secondTutorToken, "Second tutor credentials are invalid.");

      const secondTutorHeaders = {
        Authorization: `Bearer ${secondTutorToken}`,
      };

      const secondCreateResponse = await page.request.post(`${API_BASE}/students`, {
        headers: secondTutorHeaders,
        data: {
          name: `RWC Multi ${marker}`,
          email: studentEmail,
          subject: "Английский",
          rate: 2300,
          phone: "+79993334455",
        },
      });
      expect(secondCreateResponse.ok()).toBeTruthy();
      const secondStudent = (await secondCreateResponse.json()) as { id?: string };
      secondTutorStudentId = String(secondStudent.id || "");
      expect(secondTutorStudentId.length).toBeGreaterThan(0);

      const secondActivateResponse = await page.request.post(
        `${API_BASE}/students/${secondTutorStudentId}/activate-account`,
        {
          headers: secondTutorHeaders,
        },
      );
      expect(secondActivateResponse.ok()).toBeTruthy();

      const studentSession = await loginStudentViaHarness(page, studentEmail);
      test.skip(!studentSession || !studentSession.accessToken, "Student OTP harness is unavailable in this environment.");
      const studentPortalHeaders = { Authorization: `Bearer ${studentSession!.accessToken}` };

      const tutorsResponse = await page.request.get(`${API_BASE}/student-portal/tutors`, {
        headers: studentPortalHeaders,
      });
      expect(tutorsResponse.ok()).toBeTruthy();
      const tutors = (await tutorsResponse.json()) as Array<{ tutorId?: string }>;

      const uniqueTutorIds = new Set(
        tutors
          .map((row) => String(row.tutorId || "").trim())
          .filter((value) => value.length > 0),
      );

      expect(uniqueTutorIds.size).toBeGreaterThanOrEqual(2);
    } finally {
      if (secondTutorStudentId && secondTutorToken) {
        await page.request
          .delete(`${API_BASE}/students/${secondTutorStudentId}`, {
            headers: {
              Authorization: `Bearer ${secondTutorToken}`,
            },
          })
          .catch(() => null);
      }

      if (firstTutorStudentId) {
        await safeDelete(page, `${API_BASE}/students/${firstTutorStudentId}`, firstTutorHeaders);
      }
    }
  });
});
