import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AvailabilityService } from '../availability/availability.service';
import { NotificationsService } from '../notifications/notifications.service';

const PORTAL_REVIEW_PREFIX = 'PORTAL_REVIEW:';

@Injectable()
export class PublicService {
  constructor(
    private prisma: PrismaService,
    private availability: AvailabilityService,
    private notifications: NotificationsService,
  ) {}

  private normalizePhone(value?: string | null): string {
    return (value || '').replace(/\D/g, '');
  }

  private parsePortalReview(content: string): { rating: number; feedback?: string } | null {
    if (!content.startsWith(PORTAL_REVIEW_PREFIX)) return null;
    try {
      const parsed = JSON.parse(content.slice(PORTAL_REVIEW_PREFIX.length));
      const rating = Number(parsed.rating);
      if (!Number.isFinite(rating) || rating < 1 || rating > 5) return null;
      const feedback =
        typeof parsed.feedback === 'string' && parsed.feedback.trim().length > 0
          ? parsed.feedback.trim()
          : undefined;
      return { rating, feedback };
    } catch {
      return null;
    }
  }

  async getTutorProfile(slug: string) {
    const user = await this.prisma.user.findUnique({
      where: { slug },
      select: {
        id: true,
        published: true,
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
        createdAt: true,
      },
    });

    if (!user || !user.published) throw new NotFoundException('Tutor not found');

    const weeklySlotsCount = await this.prisma.tutorAvailability.count({
      where: { userId: user.id },
    });

    // Build enriched subjects from subjectDetails or plain names
    const details = user.subjectDetails as any[] | null;
    const enrichedSubjects = details && Array.isArray(details) && details.length > 0
      ? details.filter((d: any) => d.name?.trim()).map((d: any) => ({
          name: d.name,
          duration: Number(d.duration) || 60,
          price: Number(d.price) || 0,
        }))
      : user.subjects.map((name) => ({ name, duration: 60, price: 0 }));

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
        const parsed = this.parsePortalReview(note.content);
        if (!parsed) return null;
        return {
          studentName: note.student.name,
          rating: parsed.rating,
          feedback: parsed.feedback || null,
          date: note.createdAt,
        };
      })
      .filter(Boolean);

    return {
      slug: user.slug,
      name: user.name,
      tagline: user.tagline,
      subjects: enrichedSubjects,
      aboutText: user.aboutText,
      avatarUrl: user.avatarUrl,
      lessonsCount: user.lessonsCount,
      rating: user.rating,
      reviewsCount: reviews.length,
      reviews,
      contacts: {
        phone: user.phone,
        whatsapp: user.whatsapp,
      },
      memberSince: user.createdAt,
      hasWorkingDays: weeklySlotsCount > 0,
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
      date: string;
      startTime: string;
      clientName: string;
      clientPhone: string;
      clientEmail?: string;
      comment?: string;
    },
  ) {
    const user = await this.prisma.user.findUnique({
      where: { slug },
      select: { id: true, published: true },
    });

    if (!user || !user.published) throw new NotFoundException('Tutor not found');

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

    const booking = await this.prisma.bookingRequest.create({
      data: {
        userId: user.id,
        subject: data.subject,
        date,
        startTime: data.startTime,
        duration: 30,
        clientName: data.clientName,
        clientPhone: data.clientPhone,
        clientEmail: data.clientEmail,
        comment: data.comment,
      },
    });

    // Create notification for the tutor
    const dateStr = date.toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'long',
    });
    const comment = data.comment?.trim();

    await this.notifications.create({
      userId: user.id,
      type: 'BOOKING_NEW' as any,
      title: 'Новая заявка на занятие',
      description: `${data.clientName} · ${data.subject} · ${dateStr} в ${data.startTime}${
        comment ? ` · Комментарий: ${comment}` : ''
      }`,
      bookingRequestId: booking.id,
      actionUrl: `/notifications`,
    });

    const normalizedClientPhone = this.normalizePhone(data.clientPhone);
    const normalizedClientEmail = data.clientEmail?.trim().toLowerCase();

    let portalToken: string | null = null;
    if (normalizedClientPhone || normalizedClientEmail) {
      const students = await this.prisma.student.findMany({
        where: {
          userId: user.id,
          portalToken: { not: null },
        },
        select: {
          portalToken: true,
          phone: true,
          email: true,
        },
      });

      const matched = students.find((student) => {
        const emailMatch =
          !!normalizedClientEmail &&
          !!student.email &&
          student.email.trim().toLowerCase() === normalizedClientEmail;

        const phoneMatch =
          !!normalizedClientPhone &&
          this.normalizePhone(student.phone) === normalizedClientPhone;

        return emailMatch || phoneMatch;
      });

      portalToken = matched?.portalToken || null;
    }

    return {
      ...booking,
      portalToken,
    };
  }
}
