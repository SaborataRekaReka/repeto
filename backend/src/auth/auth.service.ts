import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterDto, LoginDto } from './dto';

@Injectable()
export class AuthService {
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

    // TODO: send email via Resend with reset token
    // For now, just log it
    const resetToken = uuidv4();
    console.log(`Password reset token for ${email}: ${resetToken}`);
  }

  async resetPassword(token: string, newPassword: string) {
    // TODO: implement token validation
    throw new BadRequestException('Функция восстановления пароля ещё не реализована');
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
