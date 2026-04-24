import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  MaxFileSizeValidator,
  NotFoundException,
  Param,
  ParseFilePipe,
  Patch,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { Throttle } from '@nestjs/throttler';
import { Public } from '../common/decorators';
import { CurrentStudent } from '../student-auth/current-student.decorator';
import { StudentAuthGuard } from '../student-auth/student-auth.guard';
import { PrismaService } from '../prisma/prisma.service';
import { PortalService } from './portal.service';

@ApiTags('StudentPortal')
@ApiBearerAuth()
@Public()
@UseGuards(StudentAuthGuard)
@Throttle({ portal: { ttl: 60000, limit: 30 } })
@Controller('student-portal')
export class PortalController {
  constructor(
    private readonly portalService: PortalService,
    private readonly prisma: PrismaService,
  ) {}

  @Get('tutors')
  async listTutors(@CurrentStudent('id') accountId: string) {
    const account = await this.prisma.studentAccount.findUnique({
      where: { id: accountId },
      select: { email: true },
    });

    const students = await this.prisma.student.findMany({
      where: { accountId },
      select: {
        id: true,
        subject: true,
        status: true,
        user: { select: { id: true, name: true, slug: true, avatarUrl: true } },
      },
      orderBy: { createdAt: 'asc' },
    });

    const entries = students.map((s) => ({
      studentId: s.id,
      tutorId: s.user.id,
      tutorName: s.user.name,
      tutorSlug: s.user.slug,
      tutorAvatarUrl: s.user.avatarUrl,
      subject: s.subject,
      status: s.status.toLowerCase(),
    }));

    // Fallback: include tutors where the account email has pending bookings
    // but no linked Student row yet (legacy booking data).
    if (account?.email) {
      const existingTutorIds = new Set(entries.map((e) => e.tutorId));
      const pending = await this.prisma.bookingRequest.findMany({
        where: {
          clientEmail: account.email,
          status: 'PENDING',
        },
        select: {
          id: true,
          subject: true,
          user: { select: { id: true, name: true, slug: true, avatarUrl: true } },
        },
        orderBy: { createdAt: 'asc' },
      });

      for (const p of pending) {
        if (existingTutorIds.has(p.user.id)) continue;
        existingTutorIds.add(p.user.id);
        entries.push({
          studentId: `pending:${p.id}`,
          tutorId: p.user.id,
          tutorName: p.user.name,
          tutorSlug: p.user.slug,
          tutorAvatarUrl: p.user.avatarUrl,
          subject: p.subject,
          status: 'pending',
        });
      }
    }

    return entries;
  }

  @Get('students/:studentId/data')
  async getData(
    @CurrentStudent('id') accountId: string,
    @Param('studentId') studentId: string,
  ) {
    if (studentId.startsWith('pending:')) {
      return this.buildPendingOnlyData(accountId, studentId.slice('pending:'.length));
    }
    await this.assertOwnership(accountId, studentId);
    return this.portalService.getPortalData(studentId);
  }

  @Post('students/:studentId/lessons/:lessonId/cancel')
  async cancelLesson(
    @CurrentStudent('id') accountId: string,
    @Param('studentId') studentId: string,
    @Param('lessonId') lessonId: string,
  ) {
    await this.assertOwnership(accountId, studentId);
    return this.portalService.cancelLesson(studentId, lessonId);
  }

  @Post('students/:studentId/lessons/:lessonId/reschedule')
  async reschedule(
    @CurrentStudent('id') accountId: string,
    @Param('studentId') studentId: string,
    @Param('lessonId') lessonId: string,
    @Body('newDate') newDate: string,
    @Body('newTime') newTime: string,
  ) {
    await this.assertOwnership(accountId, studentId);
    return this.portalService.requestReschedule(studentId, lessonId, newDate, newTime);
  }

  @Post('students/:studentId/pending-bookings/:bookingId/cancel')
  async cancelPendingBooking(
    @CurrentStudent('id') accountId: string,
    @Param('studentId') studentId: string,
    @Param('bookingId') bookingId: string,
  ) {
    const context = await this.assertPendingBookingOwnership(
      accountId,
      studentId,
      bookingId,
    );

    return this.portalService.cancelPendingBooking(
      context.bookingId,
      context.tutorId,
      context.studentDisplayName,
    );
  }

  @Post('students/:studentId/pending-bookings/:bookingId/reschedule')
  async reschedulePendingBooking(
    @CurrentStudent('id') accountId: string,
    @Param('studentId') studentId: string,
    @Param('bookingId') bookingId: string,
    @Body('newDate') newDate: string,
    @Body('newTime') newTime: string,
  ) {
    const context = await this.assertPendingBookingOwnership(
      accountId,
      studentId,
      bookingId,
    );

    return this.portalService.reschedulePendingBooking(
      context.bookingId,
      context.tutorId,
      context.studentDisplayName,
      newDate,
      newTime,
    );
  }

  @Post('students/:studentId/lessons/:lessonId/feedback')
  async feedback(
    @CurrentStudent('id') accountId: string,
    @Param('studentId') studentId: string,
    @Param('lessonId') lessonId: string,
    @Body('rating') rating: number,
    @Body('feedback') feedback?: string,
  ) {
    await this.assertOwnership(accountId, studentId);
    return this.portalService.submitLessonFeedback(studentId, lessonId, rating, feedback);
  }

  @Patch('students/:studentId/profile')
  async updateProfile(
    @CurrentStudent('id') accountId: string,
    @Param('studentId') studentId: string,
    @Body('name') name?: string,
    @Body('phone') phone?: string,
    @Body('grade') grade?: string,
    @Body('age') age?: number,
    @Body('parentName') parentName?: string,
    @Body('parentPhone') parentPhone?: string,
    @Body('parentEmail') parentEmail?: string,
  ) {
    await this.assertOwnership(accountId, studentId);
    const updateData: Record<string, any> = {};
    if (name && name.trim()) updateData.name = name.trim();
    if (phone !== undefined) updateData.phone = phone ? phone.trim() : null;
    if (grade !== undefined) updateData.grade = grade ? grade.trim() : null;
    if (age !== undefined) {
      const safeAge = Number.isFinite(age) && age > 0 ? Math.floor(age) : null;
      updateData.age = safeAge;
    }
    if (parentName !== undefined) updateData.parentName = parentName ? parentName.trim() : null;
    if (parentPhone !== undefined) updateData.parentPhone = parentPhone ? parentPhone.trim() : null;
    if (parentEmail !== undefined) updateData.parentEmail = parentEmail ? parentEmail.trim() : null;
    if (Object.keys(updateData).length === 0) {
      return { ok: true };
    }
    await this.prisma.student.update({
      where: { id: studentId },
      data: updateData,
    });
    return { ok: true };
  }

  @Post('avatar')
  @UseInterceptors(FileInterceptor('file'))
  async uploadAvatar(
    @CurrentStudent('id') accountId: string,
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 5 * 1024 * 1024 }),
        ],
      }),
    )
    file: Express.Multer.File,
  ) {
    const allowedMimes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowedMimes.includes(file.mimetype)) {
      throw new ForbiddenException('Unsupported image type');
    }
    return this.portalService.uploadAvatar(accountId, file);
  }

  @Patch('students/:studentId/homework/:homeworkId')
  async toggleHomework(
    @CurrentStudent('id') accountId: string,
    @Param('studentId') studentId: string,
    @Param('homeworkId') homeworkId: string,
    @Body('done') done: boolean,
  ) {
    await this.assertOwnership(accountId, studentId);
    return this.portalService.toggleHomework(studentId, homeworkId, done);
  }

  @Post('students/:studentId/homework/:homeworkId/upload')
  @UseInterceptors(FileInterceptor('file'))
  async uploadHomeworkFile(
    @CurrentStudent('id') accountId: string,
    @Param('studentId') studentId: string,
    @Param('homeworkId') homeworkId: string,
    @UploadedFile(
      new ParseFilePipe({
        validators: [new MaxFileSizeValidator({ maxSize: 5 * 1024 * 1024 })],
      }),
    )
    file: Express.Multer.File,
  ) {
    await this.assertOwnership(accountId, studentId);
    return this.portalService.uploadHomeworkFile(studentId, homeworkId, file);
  }

  @Delete('students/:studentId/homework/:homeworkId/upload')
  async removeHomeworkFile(
    @CurrentStudent('id') accountId: string,
    @Param('studentId') studentId: string,
    @Param('homeworkId') homeworkId: string,
    @Body('fileUrl') fileUrl: string,
  ) {
    await this.assertOwnership(accountId, studentId);
    return this.portalService.removeHomeworkFile(studentId, homeworkId, fileUrl);
  }

  /**
   * Returns pre-filled profile data for the student setup page.
   * Merges data from all Student rows linked to this account.
   */
  @Get('setup')
  async getSetupData(@CurrentStudent('id') accountId: string) {
    const account = await this.prisma.studentAccount.findUnique({
      where: { id: accountId },
      select: { id: true, email: true, name: true, avatarUrl: true },
    });
    if (!account) throw new NotFoundException('Account not found');

    const students = await this.prisma.student.findMany({
      where: { accountId },
      select: {
        name: true,
        phone: true,
        email: true,
        age: true,
        grade: true,
        parentName: true,
        parentPhone: true,
        parentEmail: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    // Pick the first non-empty value from linked Student rows.
    const pick = (field: keyof typeof students[0]) =>
      students.map((s) => s[field]).find((v) => v != null && v !== '') || null;

    return {
      name: account.name || pick('name') || '',
      email: account.email,
      avatarUrl: account.avatarUrl || null,
      phone: pick('phone') || '',
      age: pick('age') || null,
      grade: pick('grade') || '',
      parentName: pick('parentName') || '',
      parentPhone: pick('parentPhone') || '',
      parentEmail: pick('parentEmail') || '',
    };
  }

  /**
   * Complete the student's profile setup. Updates the StudentAccount name
   * and all linked Student rows with the provided contact info.
   */
  @Patch('profile')
  async completeProfileSetup(
    @CurrentStudent('id') accountId: string,
    @Body()
    body: {
      name?: string;
      phone?: string;
      age?: number;
      grade?: string;
      parentName?: string;
      parentPhone?: string;
      parentEmail?: string;
    },
  ) {
    const account = await this.prisma.studentAccount.findUnique({
      where: { id: accountId },
    });
    if (!account) throw new NotFoundException('Account not found');

    // Update account name.
    const trimmedName = (body.name || '').trim();
    if (trimmedName) {
      await this.prisma.studentAccount.update({
        where: { id: accountId },
        data: { name: trimmedName },
      });
    }

    // Update all linked Student rows with contact info from the student.
    const studentUpdate: Record<string, any> = {};
    if (trimmedName) studentUpdate.name = trimmedName;
    if (body.phone !== undefined) studentUpdate.phone = (body.phone || '').trim() || null;
    if (body.age !== undefined) studentUpdate.age = body.age || null;
    if (body.grade !== undefined) studentUpdate.grade = (body.grade || '').trim() || null;
    if (body.parentName !== undefined) studentUpdate.parentName = (body.parentName || '').trim() || null;
    if (body.parentPhone !== undefined) studentUpdate.parentPhone = (body.parentPhone || '').trim() || null;
    if (body.parentEmail !== undefined) {
      studentUpdate.parentEmail = (body.parentEmail || '').trim().toLowerCase() || null;
    }

    if (Object.keys(studentUpdate).length > 0) {
      await this.prisma.student.updateMany({
        where: { accountId },
        data: studentUpdate,
      });
    }

    return { ok: true };
  }

  private async assertOwnership(accountId: string, studentId: string) {
    const student = await this.prisma.student.findUnique({
      where: { id: studentId },
      select: { accountId: true },
    });
    if (!student) throw new NotFoundException('Student not found');
    if (student.accountId !== accountId) throw new ForbiddenException();
  }

  private async assertPendingBookingOwnership(
    accountId: string,
    studentId: string,
    bookingId: string,
  ) {
    const account = await this.prisma.studentAccount.findUnique({
      where: { id: accountId },
      select: { email: true, name: true },
    });
    if (!account) {
      throw new ForbiddenException();
    }

    const booking = await this.prisma.bookingRequest.findUnique({
      where: { id: bookingId },
      select: {
        id: true,
        userId: true,
        status: true,
        clientEmail: true,
        clientPhone: true,
      },
    });

    if (!booking) {
      throw new NotFoundException('Booking not found');
    }

    if (booking.status !== 'PENDING') {
      throw new BadRequestException('Заявка уже обработана');
    }

    const normalizedAccountEmail = account.email.trim().toLowerCase();
    const normalizedBookingEmail = (booking.clientEmail || '').trim().toLowerCase();
    const bookingMatchesAccount =
      !!normalizedBookingEmail && normalizedBookingEmail === normalizedAccountEmail;

    if (studentId.startsWith('pending:')) {
      const expectedBookingId = studentId.slice('pending:'.length);
      if (expectedBookingId !== booking.id || !bookingMatchesAccount) {
        throw new ForbiddenException();
      }

      return {
        bookingId: booking.id,
        tutorId: booking.userId,
        studentDisplayName: account.name || 'Ученик',
      };
    }

    const student = await this.prisma.student.findUnique({
      where: { id: studentId },
      select: {
        accountId: true,
        userId: true,
        phone: true,
        email: true,
      },
    });

    if (!student) {
      throw new NotFoundException('Student not found');
    }
    if (student.accountId !== accountId) {
      throw new ForbiddenException();
    }
    if (student.userId !== booking.userId) {
      throw new ForbiddenException();
    }

    const normalizedStudentEmail = (student.email || '').trim().toLowerCase();
    const normalizedStudentPhone = (student.phone || '').trim();
    const normalizedBookingPhone = (booking.clientPhone || '').trim();

    const bookingMatchesStudent =
      bookingMatchesAccount ||
      (!!normalizedStudentEmail && normalizedStudentEmail === normalizedBookingEmail) ||
      (!!normalizedStudentPhone && normalizedStudentPhone === normalizedBookingPhone);

    if (!bookingMatchesStudent) {
      throw new ForbiddenException();
    }

    return {
      bookingId: booking.id,
      tutorId: booking.userId,
      studentDisplayName: account.name || 'Ученик',
    };
  }

  private async buildPendingOnlyData(accountId: string, bookingId: string) {
    const account = await this.prisma.studentAccount.findUnique({
      where: { id: accountId },
      select: { id: true, email: true, name: true },
    });
    if (!account) throw new ForbiddenException();

    const booking = await this.prisma.bookingRequest.findUnique({
      where: { id: bookingId },
      include: {
        user: {
          select: {
            name: true,
            slug: true,
            phone: true,
            whatsapp: true,
            avatarUrl: true,
          },
        },
      },
    });
    if (!booking) throw new NotFoundException('Booking not found');
    if (booking.status !== 'PENDING') throw new NotFoundException('Booking not found');
    if (!booking.clientEmail || booking.clientEmail.toLowerCase() !== account.email.toLowerCase()) {
      throw new ForbiddenException();
    }

    const months = [
      'января', 'февраля', 'марта', 'апреля', 'мая', 'июня',
      'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря',
    ];
    const days = ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'];
    const d = new Date(booking.date);
    const dateLabel = `${d.getDate()} ${months[d.getMonth()]}, ${days[d.getDay()]}`;

    return {
      studentName: account.name,
      studentEmail: account.email,
      tutorName: booking.user.name,
      tutorSlug: booking.user.slug || '',
      tutorPhone: booking.user.phone || '',
      tutorWhatsapp: booking.user.whatsapp || undefined,
      tutorAvatarUrl: booking.user.avatarUrl || null,
      tutorRating: null,
      tutorReviewsCount: 0,
      balance: 0,
      ratePerLesson: 0,
      package: null,
      cancelPolicy: null,
      upcomingLessons: [],
      recentLessons: [],
      recentPayments: [],
      homework: [],
      files: [],
      pendingBookings: [
        {
          id: booking.id,
          subject: booking.subject,
          date: dateLabel,
          startTime: booking.startTime,
          duration: booking.duration,
        },
      ],
      notifications: null,
    };
  }
}
