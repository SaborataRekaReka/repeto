import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AvailabilityService } from '../availability/availability.service';
import { NotificationsService } from '../notifications/notifications.service';
import { BotPollerService } from '../messenger/bot-poller.service';
import { StudentAuthService } from '../student-auth/student-auth.service';
import { mapCancelPolicy } from '../common/utils/cancel-policy';
import {
  PORTAL_REVIEW_PREFIX,
  parsePortalReviewNote,
} from '../common/utils/lesson-note';
import {
  extractQualificationVerificationSets,
  normalizeCertificateEntries,
  normalizeEducationEntries,
  resolveQualificationVerificationLabel,
  splitExperienceLines,
} from '../common/utils/qualification-verification';

type ReminderMethod = 'telegram' | 'max' | 'email' | 'push';

@Injectable()
export class PublicService {
  constructor(
    private prisma: PrismaService,
    private availability: AvailabilityService,
    private notifications: NotificationsService,
    private botPoller: BotPollerService,
    private studentAuth: StudentAuthService,
  ) {}

  private normalizePhone(value?: string | null): string {
    return (value || '').replace(/\D/g, '');
  }

  async getBookingContactStatus(slug: string, phone?: string, email?: string) {
    const user = await this.prisma.user.findUnique({
      where: { slug },
      select: { id: true, published: true },
    });

    if (!user || !user.published) throw new NotFoundException('Tutor not found');

    const normalizedPhone = this.normalizePhone(phone);
    const normalizedEmail = email?.trim().toLowerCase();

    if (!normalizedPhone && !normalizedEmail) {
      return {
        found: false,
        telegramConnected: false,
        maxConnected: false,
        emailKnown: false,
        hasAccount: false,
      };
    }

    const students = await this.prisma.student.findMany({
      where: { userId: user.id },
      select: {
        id: true,
        phone: true,
        email: true,
        accountId: true,
        telegramChatId: true,
        maxChatId: true,
      },
    });

    const matched = students.find((student) => {
      const emailMatch =
        !!normalizedEmail &&
        !!student.email &&
        student.email.trim().toLowerCase() === normalizedEmail;

      const phoneMatch =
        !!normalizedPhone &&
        this.normalizePhone(student.phone) === normalizedPhone;

      return emailMatch || phoneMatch;
    });

    if (!matched) {
      return {
        found: false,
        telegramConnected: false,
        maxConnected: false,
        emailKnown: !!normalizedEmail,
        hasAccount: false,
      };
    }

    return {
      found: true,
      telegramConnected: !!matched.telegramChatId,
      maxConnected: !!matched.maxChatId,
      emailKnown: !!matched.email,
      hasAccount: !!matched.accountId,
    };
  }

  async getTutorProfile(slug: string) {
    const user = await this.prisma.user.findUnique({
      where: { slug },
      select: {
        id: true,
        published: true,
        showPublicPackages: true,
        name: true,
        slug: true,
        subjects: true,
        subjectDetails: true,
        tagline: true,
        aboutText: true,
        avatarUrl: true,
        lessonsCount: true,
        rating: true,
        phone: true,
        whatsapp: true,
        vk: true,
        website: true,
        cancelPolicySettings: true,
        education: true,
        experience: true,
        qualificationVerified: true,
        qualificationLabel: true,
        certificates: true,
        paymentSettings: true,
        createdAt: true,
      },
    });

    if (!user || !user.published) throw new NotFoundException('Tutor not found');

    // Build enriched subjects from subjectDetails or plain names
    const details = user.subjectDetails as any[] | null;
    const enrichedSubjects = details && Array.isArray(details) && details.length > 0
      ? details.filter((d: any) => d.name?.trim()).map((d: any) => ({
          name: d.name,
          duration: Number(d.duration) || 60,
          price: Number(d.price) || 0,
        }))
      : user.subjects.map((name) => ({ name, duration: 60, price: 0 }));

    const subjectPriceMap = new Map(
      enrichedSubjects.map((subject) => [subject.name, Number(subject.price) || 0]),
    );

    const [weeklySlotsCount, publicPackagesRaw] = await Promise.all([
      this.prisma.tutorAvailability.count({
        where: { userId: user.id },
      }),
      user.showPublicPackages
        ? this.prisma.package.findMany({
            where: {
              userId: user.id,
              isPublic: true,
              status: 'ACTIVE',
              OR: [{ validUntil: null }, { validUntil: { gte: new Date() } }],
            },
            orderBy: { createdAt: 'desc' },
            take: 20,
          })
        : Promise.resolve([]),
    ]);

    const publicPackages = publicPackagesRaw.map((pkg) => {
      const baseLessonPrice = subjectPriceMap.get(pkg.subject) || 0;
      const originalTotalPrice =
        baseLessonPrice > 0 ? baseLessonPrice * pkg.lessonsTotal : null;
      const discountAmount =
        originalTotalPrice && originalTotalPrice > pkg.totalPrice
          ? originalTotalPrice - pkg.totalPrice
          : 0;

      return {
        id: pkg.id,
        subject: pkg.subject,
        lessonsTotal: pkg.lessonsTotal,
        totalPrice: pkg.totalPrice,
        pricePerLesson:
          pkg.lessonsTotal > 0
            ? Math.round(pkg.totalPrice / pkg.lessonsTotal)
            : pkg.totalPrice,
        originalTotalPrice,
        discountAmount,
        discountPercent:
          originalTotalPrice && discountAmount > 0
            ? Math.round((discountAmount / originalTotalPrice) * 100)
            : 0,
        validUntil: pkg.validUntil,
        comment: pkg.comment,
      };
    });

    // Fetch portal reviews for this tutor
    const reviewNotes = await this.prisma.lessonNote.findMany({
      where: {
        content: { startsWith: PORTAL_REVIEW_PREFIX },
        lesson: { is: { userId: user.id } },
      },
      select: {
        content: true,
        createdAt: true,
        student: { select: { name: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    const reviews = reviewNotes
      .map((note) => {
        const parsed = parsePortalReviewNote(note.content);
        if (!parsed) return null;
        return {
          studentName: note.student.name,
          rating: parsed.rating,
          feedback: parsed.feedback || null,
          date: note.createdAt,
        };
      })
      .filter(
        (
          item,
        ): item is {
          studentName: string;
          rating: number;
          feedback: string | null;
          date: Date;
        } => !!item,
      );

    const reviewsCount = reviews.length;
    const averageReviewRating =
      reviewsCount > 0
        ? Math.round(
            (reviews.reduce((sum, review) => sum + review.rating, 0) / reviewsCount) *
              10,
          ) / 10
        : null;
    const persistedRating = Number(user.rating);
    const normalizedPersistedRating = Number.isFinite(persistedRating)
      ? persistedRating
      : null;
    const profileRating = averageReviewRating ?? normalizedPersistedRating;

    const cancelPolicySettings =
      user.cancelPolicySettings && typeof user.cancelPolicySettings === 'object'
        ? (user.cancelPolicySettings as Record<string, unknown>)
        : {};
    const defaultPaymentMethodRaw = String(
      cancelPolicySettings.defaultPaymentMethod ?? '',
    )
      .trim()
      .toLowerCase();
    const preferredPaymentMethod = ['sbp', 'cash', 'transfer'].includes(
      defaultPaymentMethodRaw,
    )
      ? defaultPaymentMethodRaw
      : 'sbp';
    const qualificationLabel = user.qualificationVerified ? 'Верифицирован' : null;
    const verificationSets = extractQualificationVerificationSets(user.paymentSettings);

    const education = normalizeEducationEntries(user.education).map((entry) => {
      const verified = verificationSets.education.has(entry.id) || entry.legacyVerified;
      return {
        id: entry.id,
        institution: entry.institution,
        program: entry.program,
        years: entry.years,
        verified,
        verificationLabel: resolveQualificationVerificationLabel(verified),
      };
    });

    const experienceLines = splitExperienceLines(user.experience).map((entry) => {
      const verified = verificationSets.experience.has(entry.id);
      return {
        ...entry,
        verified,
        verificationLabel: resolveQualificationVerificationLabel(verified),
      };
    });

    const certificates = normalizeCertificateEntries(user.certificates).map((entry) => {
      const verified = verificationSets.certificates.has(entry.id) || entry.legacyVerified;
      return {
        id: entry.id,
        title: entry.title,
        fileUrl: entry.fileUrl,
        uploadedAt: entry.uploadedAt,
        verified,
        verificationLabel: resolveQualificationVerificationLabel(verified),
      };
    });

    return {
      slug: user.slug,
      name: user.name,
      tagline: user.tagline,
      subjects: enrichedSubjects,
      showPublicPackages: user.showPublicPackages,
      publicPackages,
      aboutText: user.aboutText,
      avatarUrl: user.avatarUrl,
      lessonsCount: user.lessonsCount,
      rating: profileRating,
      reviewsCount,
      reviews,
      contacts: {
        phone: user.phone,
        whatsapp: user.whatsapp,
        vk: user.vk,
        website: user.website,
      },
      cancelPolicy: mapCancelPolicy(user.cancelPolicySettings),
      preferredPaymentMethod,
      memberSince: user.createdAt,
      hasWorkingDays: weeklySlotsCount > 0,
      education,
      experience: user.experience,
      experienceLines,
      qualificationVerified: user.qualificationVerified,
      qualificationLabel,
      certificates,
    };
  }

  /** Get free time slots for a tutor for the next N days. */
  async getTutorSlots(slug: string, from?: string, to?: string) {
    const user = await this.prisma.user.findUnique({
      where: { slug },
      select: { id: true, published: true },
    });

    if (!user || !user.published) throw new NotFoundException('Tutor not found');

    const fromDate = from ? new Date(from) : new Date();
    const toDate = to
      ? new Date(to)
      : new Date(fromDate.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 days ahead

    return this.availability.getFreeSlots(user.id, fromDate, toDate);
  }

  /** Create a booking request for a trial lesson. */
  async createBooking(
    slug: string,
    data: {
      subject: string;
      packageId?: string;
      date: string;
      startTime: string;
      clientName: string;
      clientPhone: string;
      clientEmail?: string;
      comment?: string;
      telegramLinkCode?: string;
      maxLinkCode?: string;
      reminderChannels?: ReminderMethod[];
      reminderMinutesBefore?: number;
    },
  ) {
    const user = await this.prisma.user.findUnique({
      where: { slug },
      select: { id: true, published: true, showPublicPackages: true },
    });

    if (!user || !user.published) throw new NotFoundException('Tutor not found');

    let selectedPublicPackage: {
      id: string;
      subject: string;
      lessonsTotal: number;
      totalPrice: number;
      validUntil: Date | null;
      comment: string | null;
    } | null = null;

    if (data.packageId) {
      if (!user.showPublicPackages) {
        throw new BadRequestException('Выбранный пакет недоступен');
      }

      const pkg = await this.prisma.package.findFirst({
        where: {
          id: data.packageId,
          userId: user.id,
          status: 'ACTIVE',
          isPublic: true,
        },
        select: {
          id: true,
          subject: true,
          lessonsTotal: true,
          totalPrice: true,
          validUntil: true,
          comment: true,
        },
      });

      if (!pkg || (pkg.validUntil && pkg.validUntil < new Date())) {
        throw new BadRequestException('Выбранный пакет недоступен');
      }

      selectedPublicPackage = pkg;
    }

    // Verify the slot is actually free
    const date = new Date(data.date);
    const nextDay = new Date(date);
    nextDay.setDate(nextDay.getDate() + 1);

    const freeSlots = await this.availability.getFreeSlots(user.id, date, nextDay);
    const isAvailable = freeSlots.some(
      (s) => s.date === data.date && s.time === data.startTime,
    );

    if (!isAvailable) {
      throw new BadRequestException('Выбранное время уже занято');
    }

    // Resolve messenger link codes → chat IDs
    const telegramChatId = data.telegramLinkCode
      ? await this.botPoller.resolveTelegramLink(data.telegramLinkCode)
      : null;
    const maxChatId = data.maxLinkCode
      ? await this.botPoller.resolveMaxLink(data.maxLinkCode)
      : null;

    const allowedChannels: ReminderMethod[] = ['telegram', 'max', 'email', 'push'];
    const reminderChannels = Array.isArray(data.reminderChannels)
      ? data.reminderChannels.filter((ch): ch is ReminderMethod => allowedChannels.includes(ch as ReminderMethod))
      : [];
    const reminderMinutesBefore = Number(data.reminderMinutesBefore);
    const reminderMins = Number.isFinite(reminderMinutesBefore)
      ? Math.max(15, Math.min(7 * 24 * 60, Math.round(reminderMinutesBefore)))
      : undefined;

    const reminderMeta = reminderChannels.length > 0
      ? `Напоминания: ${reminderChannels.map((ch) => {
          switch (ch) {
            case 'telegram': return 'Telegram';
            case 'max': return 'Max';
            case 'email': return 'Почта';
            case 'push': return 'Push';
            default: return ch;
          }
        }).join(', ')}${reminderMins ? ` · за ${reminderMins >= 60 ? `${Math.round(reminderMins / 60)} ч` : `${reminderMins} мин`}` : ''}`
      : null;

    const packageMeta = selectedPublicPackage
      ? `Публичный пакет: ${selectedPublicPackage.subject} · ${selectedPublicPackage.lessonsTotal} занятий · ${selectedPublicPackage.totalPrice.toLocaleString('ru-RU')} ₽`
      : null;

    const mergedComment = [packageMeta, data.comment?.trim(), reminderMeta]
      .filter(Boolean)
      .join('\n\n');

    const bookingSubject = selectedPublicPackage?.subject || data.subject;

    const booking = await this.prisma.bookingRequest.create({
      data: {
        userId: user.id,
        packageId: selectedPublicPackage?.id,
        subject: bookingSubject,
        date,
        startTime: data.startTime,
        duration: 30,
        clientName: data.clientName,
        clientPhone: data.clientPhone,
        clientEmail: data.clientEmail,
        comment: mergedComment || undefined,
        telegramChatId: telegramChatId || undefined,
        maxChatId: maxChatId || undefined,
      },
    });

    // Create notification for the tutor
    const dateStr = date.toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'long',
    });
    const comment = mergedComment;

    await this.notifications.create({
      userId: user.id,
      type: 'BOOKING_NEW' as any,
      title: 'Новая заявка на занятие',
      description: `${data.clientName} · ${bookingSubject} · ${dateStr} в ${data.startTime}${
        comment ? ` · Комментарий: ${comment}` : ''
      }`,
      bookingRequestId: booking.id,
      actionUrl: `/notifications`,
    });

    const normalizedClientPhone = this.normalizePhone(data.clientPhone);
    const normalizedClientEmail = data.clientEmail?.trim().toLowerCase();

    // Send a booking-purpose OTP to verify the email address. The portal
    // account itself is only created after the tutor approves the booking
    // (see NotificationsService.confirmBooking).
    if (normalizedClientEmail) {
      this.studentAuth
        .issueOtp(normalizedClientEmail, 'BOOKING')
        .catch(() => {
          /* issueOtp logs internally; best-effort send */
        });
    }

    // Still attempt to pick up messenger chat IDs onto a matching existing
    // student record (same tutor, same phone/email) for continuity.
    if (normalizedClientPhone || normalizedClientEmail) {
      const matched = await this.prisma.student.findFirst({
        where: {
          userId: user.id,
          OR: [
            ...(normalizedClientEmail ? [{ email: normalizedClientEmail }] : []),
            ...(normalizedClientPhone ? [{ phone: data.clientPhone }] : []),
          ],
        },
        select: { id: true, telegramChatId: true, maxChatId: true },
      });

      if (matched && (telegramChatId || maxChatId)) {
        const updateData: Record<string, string> = {};
        if (telegramChatId && !matched.telegramChatId) updateData.telegramChatId = telegramChatId;
        if (maxChatId && !matched.maxChatId) updateData.maxChatId = maxChatId;
        if (Object.keys(updateData).length > 0) {
          await this.prisma.student.update({
            where: { id: matched.id },
            data: updateData,
          });
        }
      }
    }

    return {
      ...booking,
      otpSent: !!normalizedClientEmail,
    };
  }

  /**
   * Verify the BOOKING-purpose OTP for a public booking form and sign the
   * student in. Creates / links StudentAccount + Student for the given tutor.
   */
  async verifyBookingEmailForSlug(
    slug: string,
    data: { email: string; code: string; bookingRequestId?: string },
  ) {
    const user = await this.prisma.user.findUnique({
      where: { slug },
      select: { id: true, published: true },
    });
    if (!user || !user.published) throw new NotFoundException('Tutor not found');

    const normalizedEmail = (data.email || '').trim().toLowerCase();
    if (!normalizedEmail || !normalizedEmail.includes('@')) {
      throw new BadRequestException('Некорректный email');
    }

    // Pull the most recent pending booking from this tutor+email to prefill
    // name/subject/phone/chat IDs on the Student row.
    const booking = data.bookingRequestId
      ? await this.prisma.bookingRequest.findFirst({
          where: {
            id: data.bookingRequestId,
            userId: user.id,
            clientEmail: normalizedEmail,
          },
        })
      : await this.prisma.bookingRequest.findFirst({
          where: { userId: user.id, clientEmail: normalizedEmail },
          orderBy: { createdAt: 'desc' },
        });

    return this.studentAuth.verifyBookingOtpAndSignIn({
      email: normalizedEmail,
      code: data.code,
      tutorUserId: user.id,
      fallbackName: booking?.clientName || normalizedEmail.split('@')[0],
      subject: booking?.subject || 'Занятие',
      phone: booking?.clientPhone || undefined,
      telegramChatId: booking?.telegramChatId || undefined,
      maxChatId: booking?.maxChatId || undefined,
    });
  }
}
