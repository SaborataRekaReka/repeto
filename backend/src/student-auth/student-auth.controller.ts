import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Query,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { Request, Response } from 'express';
import { Public } from '../common/decorators';
import { CurrentStudent } from './current-student.decorator';
import { RequestStudentOtpDto, VerifyStudentOtpDto } from './dto';
import { StudentAuthGuard } from './student-auth.guard';
import { StudentAuthService } from './student-auth.service';

@ApiTags('StudentAuth')
@Controller('student-auth')
export class StudentAuthController {
  constructor(private readonly service: StudentAuthService) {}

  @Public()
  @Throttle({ auth: { ttl: 60000, limit: 5 } })
  @Post('request-otp')
  @HttpCode(HttpStatus.OK)
  requestOtp(@Body() dto: RequestStudentOtpDto) {
    return this.service.issueOtp(dto.email, 'LOGIN');
  }

  @Public()
  @Post('testing/issue-and-read-otp')
  @HttpCode(HttpStatus.OK)
  issueAndReadOtpForTesting(
    @Req() req: Request,
    @Body()
    body: {
      email: string;
      purpose?: 'LOGIN' | 'BOOKING';
      code?: string;
    },
  ) {
    this.assertTestingAccess(req);
    return this.service.issueOtpForTesting(body.email, body.purpose || 'LOGIN', body.code);
  }

  @Public()
  @Get('testing/latest-otp')
  latestOtpForTesting(
    @Req() req: Request,
    @Query('email') email: string,
    @Query('purpose') purpose?: 'LOGIN' | 'BOOKING',
  ) {
    this.assertTestingAccess(req);
    return this.service.getLatestOtpForTesting(email, purpose || 'LOGIN');
  }

  @Public()
  @Throttle({ auth: { ttl: 60000, limit: 10 } })
  @Post('verify-otp')
  @HttpCode(HttpStatus.OK)
  async verifyOtp(
    @Body() dto: VerifyStudentOtpDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.service.verifyLoginOtp(dto.email, dto.code);
    this.setRefreshCookie(res, result.refreshToken);
    return {
      account: result.account,
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
      needsSetup: result.needsSetup ?? false,
    };
  }

  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refresh(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const refreshToken = req.cookies?.['student_refresh_token'];
    const tokens = await this.service.refresh(refreshToken);
    this.setRefreshCookie(res, tokens.refreshToken);
    return { accessToken: tokens.accessToken };
  }

  @Public()
  @Post('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  async logout(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const refreshToken = req.cookies?.['student_refresh_token'];
    await this.service.logout(refreshToken);
    res.clearCookie('student_refresh_token');
  }

  @Public()
  @UseGuards(StudentAuthGuard)
  @Get('me')
  getMe(@CurrentStudent('id') accountId: string) {
    return this.service.getMe(accountId);
  }

  private setRefreshCookie(res: Response, token: string) {
    res.cookie('student_refresh_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
      path: '/',
    });
  }

  private assertTestingAccess(req: Request) {
    if (process.env.NODE_ENV === 'production') {
      throw new ForbiddenException('Testing endpoint is disabled in production');
    }

    const expectedKey = String(process.env.E2E_TEST_HARNESS_KEY || '').trim();
    if (!expectedKey) {
      return;
    }

    const provided = String(req.headers['x-test-harness-key'] || '').trim();
    if (provided !== expectedKey) {
      throw new ForbiddenException('Invalid test harness key');
    }
  }
}
