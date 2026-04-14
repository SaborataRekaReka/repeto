import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import * as nodemailer from 'nodemailer';
import { v4 as uuidv4 } from 'uuid';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterDto, VerifyRegisterCodeDto, LoginDto } from './dto';

const REGISTRATION_CODE_LENGTH = 6;
const REGISTRATION_CODE_TTL_MINUTES = 15;
const REGISTRATION_MAX_ATTEMPTS = 5;

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  async requestRegisterCode(dto: RegisterDto) {
    const email = dto.email.trim().toLowerCase();

    const existing = await this.prisma.user.findUnique({
      where: { email },
    });
    if (existing) {
      throw new ConflictException('Пользователь с таким email уже существует');
    }

    const passwordHash = await bcrypt.hash(dto.password, 12);
    const code = this.generateRegistrationCode();
    const codeHash = this.hashRegistrationCode(code);
    const expiresAt = new Date(Date.now() + REGISTRATION_CODE_TTL_MINUTES * 60 * 1000);

    await this.prisma.registrationVerification.deleteMany({
      where: { expiresAt: { lt: new Date() } },
    });

    await this.prisma.registrationVerification.upsert({
      where: { email },
      create: {
        email,
        name: dto.name,
        phone: dto.phone ? this.normalizePhone(dto.phone) : null,
        passwordHash,
        codeHash,
        expiresAt,
        attempts: 0,
      },
      update: {
        name: dto.name,
        phone: dto.phone ? this.normalizePhone(dto.phone) : null,
        passwordHash,
        codeHash,
        expiresAt,
        attempts: 0,
      },
    });

    try {
      await this.sendRegistrationCodeEmail(email, dto.name, code);
    } catch (error) {
      this.logger.error(
        `Failed to send registration code email for ${email}`,
        error instanceof Error ? error.stack : String(error),
      );
      throw new BadRequestException('Не удалось отправить код. Попробуйте позже');
    }

    return {
      message: 'Код подтверждения отправлен на email',
      email,
      expiresInMinutes: REGISTRATION_CODE_TTL_MINUTES,
    };
  }

  async verifyRegisterCode(dto: VerifyRegisterCodeDto) {
    const email = dto.email.trim().toLowerCase();
    const codeHash = this.hashRegistrationCode(dto.code.trim());

    const verification = await this.prisma.registrationVerification.findUnique({
      where: { email },
    });

    if (!verification) {
      throw new BadRequestException('Сначала запросите код подтверждения');
    }

    if (verification.expiresAt < new Date()) {
      await this.prisma.registrationVerification.deleteMany({
        where: { id: verification.id },
      });
      throw new BadRequestException('Срок действия кода истек. Запросите новый код');
    }

    if (verification.attempts >= REGISTRATION_MAX_ATTEMPTS) {
      throw new BadRequestException('Превышено число попыток. Запросите новый код');
    }

    if (verification.codeHash !== codeHash) {
      await this.prisma.registrationVerification.update({
        where: { id: verification.id },
        data: { attempts: { increment: 1 } },
      });
      throw new BadRequestException('Неверный код подтверждения');
    }

    const user = await this.prisma.$transaction(async (tx) => {
      const existing = await tx.user.findUnique({
        where: { email },
      });

      if (existing) {
        await tx.registrationVerification.deleteMany({
          where: { id: verification.id },
        });
        throw new ConflictException('Пользователь с таким email уже существует');
      }

      const createdUser = await tx.user.create({
        data: {
          email,
          passwordHash: verification.passwordHash,
          name: verification.name,
          phone: verification.phone,
        },
      });

      await tx.registrationVerification.deleteMany({
        where: { id: verification.id },
      });

      return createdUser;
    });

    const tokens = await this.generateTokens(user.id);
    return {
      user: this.sanitizeUser(user),
      ...tokens,
    };
  }

  async login(dto: LoginDto) {
    const user = await this.findUserByEmail(dto.email);
    if (!user) {
      throw new UnauthorizedException('Неверный email или пароль');
    }

    const isValid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!isValid) {
      throw new UnauthorizedException('Неверный email или пароль');
    }

    const tokens = await this.generateTokens(user.id);
    return {
      user: this.sanitizeUser(user),
      ...tokens,
    };
  }

  async refresh(refreshToken: string) {
    if (!refreshToken) {
      throw new UnauthorizedException('Refresh token не предоставлен');
    }

    const stored = await this.prisma.refreshToken.findUnique({
      where: { token: refreshToken },
    });
    if (!stored || stored.expiresAt < new Date()) {
      if (stored) {
        await this.prisma.refreshToken.deleteMany({ where: { id: stored.id } });
      }
      throw new UnauthorizedException('Refresh token истёк или недействителен');
    }

    // Rotate: delete old, create new (atomically)
    const userId = stored.userId;
    await this.prisma.refreshToken.deleteMany({ where: { id: stored.id } });
    return this.generateTokens(userId);
  }

  async logout(refreshToken: string) {
    if (refreshToken) {
      await this.prisma.refreshToken.deleteMany({
        where: { token: refreshToken },
      });
    }
  }

  async getMe(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new UnauthorizedException();
    return this.sanitizeUser(user);
  }

  async forgotPassword(email: string) {
    const user = await this.prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });
    // Always return 200 to prevent email enumeration
    if (!user) return;

    const rawResetToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = this.hashResetToken(rawResetToken);
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await this.prisma.passwordResetToken.deleteMany({
      where: {
        OR: [
          { userId: user.id },
          { expiresAt: { lt: new Date() } },
        ],
      },
    });

    await this.prisma.passwordResetToken.create({
      data: {
        userId: user.id,
        tokenHash,
        expiresAt,
      },
    });

    const frontendUrl = process.env.FRONTEND_URL ||
      (process.env.NODE_ENV === 'production' ? '' : 'http://localhost:3300');
    if (!frontendUrl) {
      this.logger.error('FRONTEND_URL is required in production for password reset links');
      return;
    }
    const resetUrl = `${frontendUrl}/registration?token=${encodeURIComponent(rawResetToken)}`;

    try {
      await this.sendPasswordResetEmail(user.email, user.name, resetUrl);
    } catch (error) {
      // Keep response indistinguishable for security reasons.
      this.logger.error(
        `Failed to send password reset email for user ${user.id}`,
        error instanceof Error ? error.stack : String(error),
      );
    }
  }

  async resetPassword(token: string, newPassword: string) {
    if (!token || token.length < 20) {
      throw new BadRequestException('Некорректный токен восстановления');
    }

    const tokenHash = this.hashResetToken(token);
    const stored = await this.prisma.passwordResetToken.findUnique({
      where: { tokenHash },
      select: {
        id: true,
        userId: true,
        usedAt: true,
        expiresAt: true,
      },
    });

    if (!stored || stored.usedAt || stored.expiresAt < new Date()) {
      throw new BadRequestException('Ссылка восстановления недействительна или истекла');
    }

    const passwordHash = await bcrypt.hash(newPassword, 12);

    await this.prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: stored.userId },
        data: { passwordHash },
      });

      await tx.passwordResetToken.update({
        where: { id: stored.id },
        data: { usedAt: new Date() },
      });

      await tx.passwordResetToken.deleteMany({
        where: {
          userId: stored.userId,
          id: { not: stored.id },
        },
      });

      await tx.refreshToken.deleteMany({ where: { userId: stored.userId } });
    });
  }

  private generateRegistrationCode() {
    let code = '';
    for (let index = 0; index < REGISTRATION_CODE_LENGTH; index += 1) {
      code += crypto.randomInt(0, 10).toString();
    }
    return code;
  }

  private hashRegistrationCode(code: string) {
    const secret =
      process.env.AUTH_REGISTRATION_CODE_SECRET ||
      process.env.JWT_SECRET ||
      'repeto-dev-registration-code';
    return crypto.createHmac('sha256', secret).update(code).digest('hex');
  }

  private async sendRegistrationCodeEmail(
    email: string,
    name: string,
    code: string,
  ) {
    const subject = 'Код подтверждения Repeto';
    const html = [
      `<p>Здравствуйте, ${name || 'пользователь'}.</p>`,
      '<p>Введите код ниже для подтверждения регистрации:</p>',
      `<p style="font-size:24px;font-weight:700;letter-spacing:6px">${code}</p>`,
      `<p>Код действителен ${REGISTRATION_CODE_TTL_MINUTES} минут.</p>`,
      '<p>Если это были не вы, просто проигнорируйте письмо.</p>',
    ].join('');

    const text = [
      `Здравствуйте, ${name || 'пользователь'}.`,
      '',
      `Ваш код подтверждения Repeto: ${code}`,
      `Код действителен ${REGISTRATION_CODE_TTL_MINUTES} минут.`,
      'Если это были не вы, просто проигнорируйте письмо.',
    ].join('\n');

    await this.sendEmailWithConfiguredProvider({
      email,
      subject,
      html,
      text,
      devFallbackLog: `[DEV][REGISTRATION_CODE] ${email}: ${code}`,
    });
  }

  private hashResetToken(token: string) {
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  private async sendPasswordResetEmail(
    email: string,
    name: string,
    resetUrl: string,
  ) {
    const subject = 'Сброс пароля Repeto';
    const html = [
      `<p>Здравствуйте, ${name || 'пользователь'}.</p>`,
      '<p>Вы запросили восстановление пароля в Repeto.</p>',
      `<p><a href="${resetUrl}">Нажмите здесь, чтобы задать новый пароль</a></p>`,
      '<p>Ссылка действительна 1 час.</p>',
      '<p>Если это были не вы, просто проигнорируйте письмо.</p>',
    ].join('');

    const text = [
      `Здравствуйте, ${name || 'пользователь'}.`,
      '',
      'Вы запросили восстановление пароля в Repeto.',
      `Ссылка для сброса пароля: ${resetUrl}`,
      'Ссылка действительна 1 час.',
      'Если это были не вы, просто проигнорируйте письмо.',
    ].join('\n');

    await this.sendEmailWithConfiguredProvider({
      email,
      subject,
      html,
      text,
    });
  }

  private async sendEmailWithConfiguredProvider(params: {
    email: string;
    subject: string;
    html: string;
    text: string;
    devFallbackLog?: string;
  }) {
    const sentViaSmtp = await this.trySendViaSmtp(params);
    if (sentViaSmtp) {
      return;
    }

    const sentViaResend = await this.trySendViaResend(params);
    if (sentViaResend) {
      return;
    }

    this.logger.warn('No email provider configured (SMTP or Resend). Email was not sent.');
    if (params.devFallbackLog) {
      this.logger.log(params.devFallbackLog);
    }
  }

  private async trySendViaSmtp(params: {
    email: string;
    subject: string;
    html: string;
    text: string;
  }) {
    const host = (process.env.SMTP_HOST || '').trim();
    const user = (process.env.SMTP_USER || '').trim();
    const pass = process.env.SMTP_PASS || '';
    const hasSmtpHints = Boolean(
      host ||
      user ||
      pass ||
      process.env.SMTP_PORT ||
      process.env.SMTP_SECURE ||
      process.env.SMTP_FROM_EMAIL,
    );

    if (!hasSmtpHints) {
      return false;
    }

    if (!host || !user || !pass) {
      this.logger.warn('SMTP is partially configured. Set SMTP_HOST, SMTP_USER and SMTP_PASS.');
      return false;
    }

    const parsedPort = Number.parseInt(process.env.SMTP_PORT || '465', 10);
    const port = Number.isFinite(parsedPort) ? parsedPort : 465;
    const secure = this.resolveSmtpSecure(port, process.env.SMTP_SECURE);
    const from =
      (process.env.SMTP_FROM_EMAIL || '').trim() ||
      `Repeto <${user}>`;

    const transporter = nodemailer.createTransport({
      host,
      port,
      secure,
      auth: {
        user,
        pass,
      },
    });

    await transporter.sendMail({
      from,
      to: [params.email],
      subject: params.subject,
      html: params.html,
      text: params.text,
    });

    return true;
  }

  private async trySendViaResend(params: {
    email: string;
    subject: string;
    html: string;
    text: string;
  }) {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      return false;
    }

    const from = process.env.RESEND_FROM_EMAIL || 'Repeto <noreply@repeto.ru>';

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from,
        to: [params.email],
        subject: params.subject,
        html: params.html,
        text: params.text,
      }),
    });

    if (!response.ok) {
      const details = await response.text().catch(() => 'unknown error');
      throw new Error(`Resend error ${response.status}: ${details}`);
    }

    return true;
  }

  private resolveSmtpSecure(port: number, rawValue?: string) {
    const normalized = (rawValue || '').trim().toLowerCase();
    if (!normalized) {
      return port === 465;
    }

    return normalized === 'true' || normalized === '1' || normalized === 'yes';
  }

  private async generateTokens(userId: string) {
    const accessToken = this.jwtService.sign(
      { sub: userId, role: 'tutor' },
      { expiresIn: process.env.JWT_ACCESS_EXPIRES_IN || '15m' },
    );

    const refreshTokenValue = uuidv4();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    await this.prisma.refreshToken.create({
      data: {
        userId,
        token: refreshTokenValue,
        expiresAt,
      },
    });

    return { accessToken, refreshToken: refreshTokenValue };
  }

  private async findUserByEmail(email: string) {
    const normalizedEmail = email.trim().toLowerCase();

    if (!normalizedEmail || !normalizedEmail.includes('@')) {
      return null;
    }

    return this.prisma.user.findUnique({
      where: { email: normalizedEmail },
    });
  }

  private normalizePhone(phone: string) {
    const digitsOnly = phone.replace(/\D/g, '');
    if (!digitsOnly) {
      return '';
    }

    if (digitsOnly.length === 11 && digitsOnly.startsWith('8')) {
      return `+7${digitsOnly.slice(1)}`;
    }

    if (digitsOnly.length === 11 && digitsOnly.startsWith('7')) {
      return `+${digitsOnly}`;
    }

    if (digitsOnly.length === 10) {
      return `+7${digitsOnly}`;
    }

    return `+${digitsOnly}`;
  }

  private sanitizeUser(user: {
    id: string;
    email: string;
    name: string;
    phone: string | null;
    whatsapp: string | null;
    slug: string | null;
    timezone: string;
    avatarUrl: string | null;
    subjects: string[];
    aboutText: string | null;
  }) {
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      phone: user.phone,
      whatsapp: user.whatsapp,
      slug: user.slug,
      timezone: user.timezone,
      avatarUrl: user.avatarUrl,
      subjects: user.subjects,
      aboutText: user.aboutText,
    };
  }
}
