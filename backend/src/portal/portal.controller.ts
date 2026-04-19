import {
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

  private async assertOwnership(accountId: string, studentId: string) {
    const student = await this.prisma.student.findUnique({
      where: { id: studentId },
      select: { accountId: true },
    });
    if (!student) throw new NotFoundException('Student not found');
    if (student.accountId !== accountId) throw new ForbiddenException();
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