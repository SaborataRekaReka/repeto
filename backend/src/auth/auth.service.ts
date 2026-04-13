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
import { v4 as uuidv4 } from 'uuid';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterDto, LoginDto } from './dto';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  async register(dto: RegisterDto) {
    const existing = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase() },
    });
    if (existing) {
      throw new ConflictException('Пользователь с таким email уже существует');
    }

    const passwordHash = await bcrypt.hash(dto.password, 12);
    const user = await this.prisma.user.create({
      data: {
        email: dto.email.toLowerCase(),
        passwordHash,
        name: dto.name,
        phone: dto.phone ? this.normalizePhone(dto.phone) : null,
      },
    });

    const tokens = await this.generateTokens(user.id);
    return {
      user: this.sanitizeUser(user),
      ...tokens,
    };
  }

  async login(dto: LoginDto) {
    const user = await this.findUserForLogin(dto.email);
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

  private hashResetToken(token: string) {
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  private async sendPasswordResetEmail(
    email: string,
    name: string,
    resetUrl: string,
  ) {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      this.logger.warn('RESEND_API_KEY is not configured. Password reset email was not sent.');
      return;
    }

    const from = process.env.RESEND_FROM_EMAIL || 'Repeto <noreply@repeto.ru>';

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

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from,
        to: [email],
        subject,
        html,
        text,
      }),
    });

    if (!response.ok) {
      const details = await response.text().catch(() => 'unknown error');
      throw new Error(`Resend error ${response.status}: ${details}`);
    }
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

  private async findUserForLogin(login: string) {
    const rawLogin = login.trim();

    if (!rawLogin) {
      return null;
    }

    if (rawLogin.includes('@')) {
      return this.prisma.user.findUnique({
        where: { email: rawLogin.toLowerCase() },
      });
    }

    const normalizedInputPhone = this.normalizePhone(rawLogin);
    if (!normalizedInputPhone) {
      return null;
    }

    const directMatch = await this.prisma.user.findFirst({
      where: {
        phone: normalizedInputPhone,
      },
    });

    if (directMatch) {
      return directMatch;
    }

    const usersWithPhone = await this.prisma.user.findMany({
      where: { phone: { not: null } },
      select: { id: true, phone: true },
    });

    const legacyMatch = usersWithPhone.find((user) => {
      if (!user.phone) {
        return false;
      }
      return this.normalizePhone(user.phone) === normalizedInputPhone;
    });

    if (!legacyMatch) {
      return null;
    }

    return this.prisma.user.findUnique({
      where: { id: legacyMatch.id },
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
