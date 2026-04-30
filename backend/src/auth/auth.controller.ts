import {
  Controller,
  Post,
  Get,
  Body,
  Req,
  Res,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { Request, Response } from 'express';
import { AuthService } from './auth.service';
import {
  RegisterDto,
  VerifyRegisterCodeDto,
  StartRegistrationPaymentDto,
  CompleteRegistrationDto,
  StartPlatformAccessPaymentDto,
  CompletePlatformAccessPaymentDto,
  LoginDto,
  ForgotPasswordDto,
  ResetPasswordDto,
} from './dto';
import { Public, CurrentUser } from '../common/decorators';
import { getRequestMeta } from '../common/utils/request-meta';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Throttle({ auth: { ttl: 60000, limit: 5 } })
  @Post('register')
  @HttpCode(HttpStatus.OK)
  async requestRegisterCode(@Body() dto: RegisterDto) {
    return this.authService.requestRegisterCode(dto);
  }

  @Public()
  @Get('register/plans')
  getRegistrationPlans() {
    return this.authService.getRegistrationPlans();
  }

  @Public()
  @Throttle({ auth: { ttl: 60000, limit: 10 } })
  @Post('register/verify-code')
  @HttpCode(HttpStatus.OK)
  verifyRegisterCode(@Body() dto: VerifyRegisterCodeDto) {
    return this.authService.verifyRegisterCode(dto);
  }

  @Public()
  @Throttle({ auth: { ttl: 60000, limit: 20 } })
  @Post('register/start-payment')
  @HttpCode(HttpStatus.OK)
  startRegistrationPayment(@Body() dto: StartRegistrationPaymentDto) {
    return this.authService.startRegistrationPayment(dto);
  }

  @Public()
  @Throttle({ auth: { ttl: 60000, limit: 20 } })
  @Post('register/complete')
  @HttpCode(HttpStatus.OK)
  async completeRegistration(
    @Body() dto: CompleteRegistrationDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.authService.completeRegistration(dto, getRequestMeta(req));
    this.setRefreshCookie(res, result.refreshToken);
    return { user: result.user, accessToken: result.accessToken };
  }

  @Post('platform-access/start-payment')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  startPlatformAccessPayment(
    @CurrentUser('id') userId: string,
    @Body() dto: StartPlatformAccessPaymentDto,
  ) {
    return this.authService.startPlatformAccessPayment(userId, dto);
  }

  @Post('platform-access/complete')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  completePlatformAccessPayment(
    @CurrentUser('id') userId: string,
    @Body() dto: CompletePlatformAccessPaymentDto,
  ) {
    return this.authService.completePlatformAccessPayment(userId, dto);
  }

  @Public()
  @Throttle({ auth: { ttl: 60000, limit: 10 } })
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(
    @Body() dto: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.authService.login(dto);
    this.setRefreshCookie(res, result.refreshToken);
    return { user: result.user, accessToken: result.accessToken };
  }

  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refresh(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const refreshToken = req.cookies?.['refresh_token'];
    const tokens = await this.authService.refresh(refreshToken);
    this.setRefreshCookie(res, tokens.refreshToken);
    return { accessToken: tokens.accessToken };
  }

  @Post('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiBearerAuth()
  async logout(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const refreshToken = req.cookies?.['refresh_token'];
    await this.authService.logout(refreshToken);
    res.clearCookie('refresh_token');
  }

  @Get('me')
  @ApiBearerAuth()
  async me(@CurrentUser('id') userId: string) {
    return this.authService.getMe(userId);
  }

  @Public()
  @Throttle({ auth: { ttl: 3600000, limit: 3 } })
  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  async forgotPassword(@Body() dto: ForgotPasswordDto) {
    await this.authService.forgotPassword(dto.email);
    return { message: 'Если аккаунт существует, письмо отправлено' };
  }

  @Public()
  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  async resetPassword(@Body() dto: ResetPasswordDto) {
    await this.authService.resetPassword(dto.token, dto.password);
    return { message: 'Пароль успешно изменён' };
  }

  private setRefreshCookie(res: Response, token: string) {
    res.cookie('refresh_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      path: '/',
    });
  }
}
