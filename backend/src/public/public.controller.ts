import {
  Controller,
  Get,
  Post,
  Param,
  Query,
  Body,
  Res,
  HttpCode,
  HttpStatus,
  Req,
} from '@nestjs/common';
import { ApiTags, ApiQuery } from '@nestjs/swagger';
import { Request, Response } from 'express';
import { Public } from '../common/decorators';
import { PublicService } from './public.service';
import { TelegramService } from '../messenger/telegram.service';
import { MaxService } from '../messenger/max.service';
import { BotPollerService } from '../messenger/bot-poller.service';
import { StudentAuthService } from '../student-auth/student-auth.service';
import { getRequestMeta } from '../common/utils/request-meta';

@ApiTags('Public')
@Controller('public')
export class PublicController {
  constructor(
    private readonly publicService: PublicService,
    private readonly telegramService: TelegramService,
    private readonly maxService: MaxService,
    private readonly botPollerService: BotPollerService,
    private readonly studentAuthService: StudentAuthService,
  ) {}

  @Public()
  @Get('tutors/:slug')
  getTutorProfile(@Param('slug') slug: string) {
    return this.publicService.getTutorProfile(slug);
  }

  @Public()
  @Get('tutors/:slug/slots')
  @ApiQuery({ name: 'from', required: false })
  @ApiQuery({ name: 'to', required: false })
  getTutorSlots(
    @Param('slug') slug: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return this.publicService.getTutorSlots(slug, from, to);
  }

  @Public()
  @Get('tutors/:slug/contact-status')
  @ApiQuery({ name: 'phone', required: false })
  @ApiQuery({ name: 'email', required: false })
  getContactStatus(
    @Param('slug') slug: string,
    @Query('phone') phone?: string,
    @Query('email') email?: string,
  ) {
    return this.publicService.getBookingContactStatus(slug, phone, email);
  }

  @Public()
  @Post('tutors/:slug/book')
  createBooking(
    @Param('slug') slug: string,
    @Req() req: Request,
    @Body()
    body: {
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
      reminderChannels?: Array<'telegram' | 'max' | 'email' | 'push'>;
      reminderMinutesBefore?: number;
      legalVersion?: string;
      legalDocumentHash?: string;
      consents: {
        lessonFor?: 'self' | 'child';
        bookingTermsConfirmed?: boolean;
        childLegalRepresentativeConfirmed?: boolean;
        bookingTermsText?: string;
        childLegalRepresentativeText?: string;

        // Backward compatibility for existing clients
        bookingForChild?: boolean;
        childPersonalDataText?: string;
        childPersonalDataAccepted?: boolean;
        bookingTermsAccepted?: boolean;
      };
    },
  ) {
    return this.publicService.createBooking(slug, body, getRequestMeta(req));
  }

  @Public()
  @Post('tutors/:slug/verify-booking-email')
  @HttpCode(HttpStatus.OK)
  async verifyBookingEmail(
    @Param('slug') slug: string,
    @Body()
    body: {
      email: string;
      code: string;
      bookingRequestId?: string;
    },
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.publicService.verifyBookingEmailForSlug(slug, body);
    res.cookie('student_refresh_token', result.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 30 * 24 * 60 * 60 * 1000,
      path: '/',
    });
    return {
      account: result.account,
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
      studentId: result.studentId,
    };
  }

  @Public()
  @Get('bot-info')
  async getBotInfo() {
    const tg = this.telegramService.isConfigured
      ? { configured: true, username: await this.telegramService.botUsername }
      : { configured: false };
    const maxInfo = await this.maxService.verifyBot();
    const max = this.maxService.isConfigured
      ? { configured: true, name: maxInfo.name || null, username: maxInfo.username || null }
      : { configured: false };
    return { telegram: tg, max };
  }

  @Public()
  @Get('link-status/:code')
  async getLinkStatus(@Param('code') code: string) {
    return {
      telegram: await this.botPollerService.hasTelegramLink(code),
      max: await this.botPollerService.hasMaxLink(code),
    };
  }
}
