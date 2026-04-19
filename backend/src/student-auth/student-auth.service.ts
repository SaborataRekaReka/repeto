import {
  BadRequestException,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as crypto from 'crypto';
import * as nodemailer from 'nodemailer';
import { v4 as uuidv4 } from 'uuid';
import { PrismaService } from '../prisma/prisma.service';

const OTP_CODE_LENGTH = 6;
const OTP_TTL_MINUTES = 15;
const OTP_MAX_ATTEMPTS = 5;
const OTP_SEND_COOLDOWN_SECONDS = 45;
const REFRESH_TTL_DAYS = 30;

type OtpPurpose = 'LOGIN' | 'BOOKING';

@Injectable()
export class StudentAuthService {
  private readonly logger = new Logger(StudentAuthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  private normalizeEmail(raw: string) {
    return (raw || '').trim().toLowerCase();
  }

  private generateCode() {
    let code = '';
    for (let i = 0; i < OTP_CODE_LENGTH; i += 1) {
      code += crypto.randomInt(0, 10).toString();
    }
    return code;
  }

  private hashCode(code: string) {
    const secret =
      process.env.STUDENT_OTP_SECRET ||
      process.env.JWT_SECRET ||
      'repeto-dev-student-otp';
    return crypto.createHmac('sha256', secret).update(code).digest('hex');
  }

  /**
   * Create (or rotate) an OTP for a given email & purpose, and email it.
   * Returns the code in dev if email delivery fails (logged).
   */
  async issueOtp(email: string, purpose: OtpPurpose = 'LOGIN') {
    const normalizedEmail = this.normalizeEmail(email);
    if (!normalizedEmail || !normalizedEmail.includes('@')) {
      throw new BadRequestException('Некорректный email');
    }

    // Cooldown: prevent spam — if last OTP for this (email, purpose) was issued <45s ago, reuse it silently.
    const recent = await this.prisma.studentOtp.findFirst({
      where: {
        email: normalizedEmail,
        purpose,
        createdAt: { gt: new Date(Date.now() - OTP_SEND_COOLDOWN_SECONDS * 1000) },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (recent) {
      return {
        email: normalizedEmail,
        expiresInMinutes: OTP_TTL_MINUTES,
        cooldown: true,
      };
    }

    // Clean up expired OTPs for hygiene
    await this.prisma.studentOtp.deleteMany({
      where: { OR: [{ expiresAt: { lt: new Date() } }, { email: normalizedEmail, purpose }] },
    });

    const code = this.generateCode();
    const codeHash = this.hashCode(code);
    const expiresAt = new Date(Date.now() + OTP_TTL_MINUTES * 60 * 1000);

    await this.prisma.studentOtp.create({
      data: {
        email: normalizedEmail,
        codeHash,
        purpose,
        expiresAt,
      },
    });

    try {
      await this.sendOtpEmail(normalizedEmail, code, purpose);
    } catch (error) {
      this.logger.error(
        `Failed to send student OTP to ${normalizedEmail}`,
        error instanceof Error ? error.stack : String(error),
      );
      // Dev-only log: still let caller know we couldn't reach email.
      if (process.env.NODE_ENV !== 'production') {
        this.logger.log(`[DEV][STUDENT_OTP][${purpose}] ${normalizedEmail}: ${code}`);
      }
    }

    return {
      email: normalizedEmail,
      expiresInMinutes: OTP_TTL_MINUTES,
      cooldown: false,
    };
  }

  /**
   * Verify a BOOKING-purpose OTP for a public booking form and sign the
   * student in. Creates StudentAccount + Student (linked to this tutor) so the
   * student immediately sees their unconfirmed booking in /student.
   */
  async verifyBookingOtpAndSignIn(params: {
    email: string;
    code: string;
    tutorUserId: string;
    fallbackName: string;
    subject: string;
    phone?: string;
    telegramChatId?: string | null;
    maxChatId?: string | null;
  }) {
    const normalizedEmail = this.normalizeEmail(params.email);

    const otp = await this.prisma.studentOtp.findFirst({
      where: { email: normalizedEmail, purpose: 'BOOKING' },
      orderBy: { createdAt: 'desc' },
    });

    if (!otp) {
      throw new BadRequestException('Сначала запросите код');
    }
    if (otp.expiresAt < new Date()) {
      await this.prisma.studentOtp.deleteMany({ where: { id: otp.id } });
      throw new BadRequestException('Срок действия кода истёк. Запросите новый.');
    }
    if (otp.attempts >= OTP_MAX_ATTEMPTS) {
      throw new BadRequestException('Превышено число попыток. Запросите новый код.');
    }

    const codeHash = this.hashCode(params.code.trim());
    if (otp.codeHash !== codeHash) {
      await this.prisma.studentOtp.update({
        where: { id: otp.id },
        data: { attempts: { increment: 1 } },
      });
      throw new BadRequestException('Неверный код');
    }

    await this.prisma.studentOtp.deleteMany({ where: { id: otp.id } });

    // Upsert StudentAccount
    const now = new Date();
    const existingAccount = await this.prisma.studentAccount.findUnique({
      where: { email: normalizedEmail },
    });

    const account = existingAccount
      ? await this.prisma.studentAccount.update({
          where: { id: existingAccount.id },
          data: {
            emailVerifiedAt: existingAccount.emailVerifiedAt || now,
            lastLoginAt: now,
            status: existingAccount.status === 'INVITED' ? 'ACTIVE' : existingAccount.status,
            name: existingAccount.name || params.fallbackName,
          },
        })
      : await this.prisma.studentAccount.create({
          data: {
            email: normalizedEmail,
            name: params.fallbackName,
            emailVerifiedAt: now,
            lastLoginAt: now,
            status: 'ACTIVE',
          },
        });

    // Ensure a Student row exists for (tutorUserId, account). Prefer linking an
    // existing Student with matching phone/email first; otherwise create one
    // so the student's portal can show the pending booking immediately.
    const tutor = await this.prisma.user.findUnique({
      where: { id: params.tutorUserId },
      select: { subjectDetails: true },
    });
    const details = (tutor?.subjectDetails as any[]) || [];
    const subjectInfo = details.find(
      (d) => d?.name && String(d.name).toLowerCase() === params.subject.toLowerCase(),
    );
    const rate = Number(subjectInfo?.price) || 0;

    let student = await this.prisma.student.findFirst({
      where: {
        userId: params.tutorUserId,
        OR: [
          { accountId: account.id },
          { email: normalizedEmail },
          ...(params.phone ? [{ phone: params.phone }] : []),
        ],
      },
    });

    if (student) {
      const updateData: Record<string, any> = {};
      if (!student.accountId) updateData.accountId = account.id;
      if (!student.email && normalizedEmail) updateData.email = normalizedEmail;
      if (params.telegramChatId && !student.telegramChatId) {
        updateData.telegramChatId = params.telegramChatId;
      }
      if (params.maxChatId && !student.maxChatId) {
        updateData.maxChatId = params.maxChatId;
      }
      if (Object.keys(updateData).length > 0) {
        student = await this.prisma.student.update({
          where: { id: student.id },
          data: updateData,
        });
      }
    } else {
      student = await this.prisma.student.create({
        data: {
          userId: params.tutorUserId,
          accountId: account.id,
          name: params.fallbackName,
          email: normalizedEmail,
          phone: params.phone || undefined,
          telegramChatId: params.telegramChatId || undefined,
          maxChatId: params.maxChatId || undefined,
          subject: params.subject,
          rate,
          status: 'ACTIVE',
        },
      });
    }

    const tokens = await this.generateTokens(account.id);

    return {
      account: {
        id: account.id,
        email: account.email,
        name: account.name,
        status: account.status,
      },
      studentId: student.id,
      ...tokens,
    };
  }

  /**
   * Verify OTP code (without producing a session — for purpose=BOOKING).
   * Returns true if code matches and consumes it.
   */
  async verifyOtpSilent(email: string, code: string, purpose: OtpPurpose) {
    const normalizedEmail = this.normalizeEmail(email);
    const codeHash = this.hashCode(code.trim());

    const otp = await this.prisma.studentOtp.findFirst({
      where: { email: normalizedEmail, purpose },
      orderBy: { createdAt: 'desc' },
    });

    if (!otp) return false;

    if (otp.expiresAt < new Date()) {
      await this.prisma.studentOtp.deleteMany({ where: { id: otp.id } });
      return false;
    }

    if (otp.attempts >= OTP_MAX_ATTEMPTS) {
      return false;
    }

    if (otp.codeHash !== codeHash) {
      await this.prisma.studentOtp.update({
        where: { id: otp.id },
        data: { attempts: { increment: 1 } },
      });
      return false;
    }

    await this.prisma.studentOtp.deleteMany({ where: { id: otp.id } });
    return true;
  }

  /**
   * Login flow: verify OTP and issue tokens. Upserts StudentAccount by email.
   */
  async verifyLoginOtp(email: string, code: string) {
    const normalizedEmail = this.normalizeEmail(email);

    const otp = await this.prisma.studentOtp.findFirst({
      where: { email: normalizedEmail, purpose: 'LOGIN' },
      orderBy: { createdAt: 'desc' },
    });

    if (!otp) {
      throw new BadRequestException('Сначала запросите код');
    }

    if (otp.expiresAt < new Date()) {
      await this.prisma.studentOtp.deleteMany({ where: { id: otp.id } });
      throw new BadRequestException('Срок действия кода истёк. Запросите новый.');
    }

    if (otp.attempts >= OTP_MAX_ATTEMPTS) {
      throw new BadRequestException('Превышено число попыток. Запросите новый код.');
    }

    const codeHash = this.hashCode(code.trim());
    if (otp.codeHash !== codeHash) {
      await this.prisma.studentOtp.update({
        where: { id: otp.id },
        data: { attempts: { increment: 1 } },
      });
      throw new BadRequestException('Неверный код');
    }

    // Consume OTP
    await this.prisma.studentOtp.deleteMany({ where: { id: otp.id } });

    const now = new Date();

    // Find account — it may not exist yet (student invited but hasn't logged in).
    let account = await this.prisma.studentAccount.findUnique({
      where: { email: normalizedEmail },
    });

    // If no account exists, check whether any Student records reference this
    // email (tutor-created students with invite). If so, create the account
    // now — the student has just proved ownership of the email via OTP.
    let isFirstLogin = false;
    if (!account) {
      const studentsWithEmail = await this.prisma.student.findMany({
        where: { email: normalizedEmail },
        select: { id: true, name: true, accountId: true },
      });

      if (!studentsWithEmail.length) {
        throw new BadRequestException(
          'Аккаунт ученика не найден. Попросите репетитора отправить вам приглашение или запишитесь через страницу репетитора.',
        );
      }

      account = await this.prisma.studentAccount.create({
        data: {
          email: normalizedEmail,
          name: studentsWithEmail[0].name,
          emailVerifiedAt: now,
          lastLoginAt: now,
          status: 'ACTIVE',
        },
      });

      // Link all unlinked Student records to the new account.
      await this.prisma.student.updateMany({
        where: { email: normalizedEmail, accountId: null },
        data: { accountId: account.id },
      });

      isFirstLogin = true;
    } else {
      account = await this.prisma.studentAccount.update({
        where: { id: account.id },
        data: {
          lastLoginAt: now,
          emailVerifiedAt: account.emailVerifiedAt || now,
          status: account.status === 'INVITED' ? 'ACTIVE' : account.status,
        },
      });
    }

    const tokens = await this.generateTokens(account.id);

    return {
      account: {
        id: account.id,
        email: account.email,
        name: account.name,
        status: account.status,
      },
      needsSetup: isFirstLogin,
      ...tokens,
    };
  }

  async refresh(refreshToken: string | undefined) {
    if (!refreshToken) throw new UnauthorizedException();

    const stored = await this.prisma.studentRefreshToken.findUnique({
      where: { token: refreshToken },
    });

    if (!stored || stored.expiresAt < new Date()) {
      if (stored) {
        await this.prisma.studentRefreshToken.deleteMany({ where: { id: stored.id } });
      }
      throw new UnauthorizedException();
    }

    const accountId = stored.accountId;
    await this.prisma.studentRefreshToken.deleteMany({ where: { id: stored.id } });
    return this.generateTokens(accountId);
  }

  async logout(refreshToken: string | undefined) {
    if (refreshToken) {
      await this.prisma.studentRefreshToken.deleteMany({ where: { token: refreshToken } });
    }
  }

  async getMe(accountId: string) {
    const account = await this.prisma.studentAccount.findUnique({
      where: { id: accountId },
    });
    if (!account) throw new UnauthorizedException();

    const tutorCount = await this.prisma.student.count({
      where: { accountId: account.id },
    });

    return {
      id: account.id,
      email: account.email,
      name: account.name,
      avatarUrl: account.avatarUrl,
      status: account.status,
      lastLoginAt: account.lastLoginAt,
      tutorCount,
    };
  }

  // ── Tokens ──

  private async generateTokens(accountId: string) {
    const accessToken = this.jwtService.sign(
      { sub: accountId, role: 'student' },
      { expiresIn: process.env.JWT_ACCESS_EXPIRES_IN || '15m' },
    );

    const refreshTokenValue = uuidv4();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + REFRESH_TTL_DAYS);

    await this.prisma.studentRefreshToken.create({
      data: {
        accountId,
        token: refreshTokenValue,
        expiresAt,
      },
    });

    return { accessToken, refreshToken: refreshTokenValue };
  }

  // ── Email delivery (mirrors AuthService.sendEmailWithConfiguredProvider) ──

  /**
   * Send a welcome email notifying a newly-created student account that they can now log in.
   * Used after tutor approves the very first booking, or after "Create personal page" button.
   */
  async sendAccountInviteEmail(email: string, tutorName: string) {
    const normalizedEmail = this.normalizeEmail(email);
    const loginUrl = this.buildStudentLoginUrl();

    const subject = `${tutorName} пригласил(а) вас в Repeto`;
    const html = [
      '<p>Здравствуйте!</p>',
      `<p>${tutorName} пригласил(а) вас в Repeto.</p>`,
      '<p>Откройте ссылку ниже, подтвердите email одноразовым кодом, и кабинет ученика создастся автоматически.</p>',
      '<p>В нём вы сможете видеть расписание, домашние задания, материалы и оплаты.</p>',
      `<p><a href="${loginUrl}">Войти в кабинет ученика</a></p>`,
      '<p>Вход — по email и одноразовому коду. Пароль не нужен.</p>',
      '<p>Если у вас несколько репетиторов в Repeto, вы сможете переключаться между ними в кабинете.</p>',
    ].join('');

    const text = [
      'Здравствуйте!',
      '',
      `${tutorName} пригласил(а) вас в Repeto.`,
      'Подтвердите email одноразовым кодом — и кабинет ученика создастся автоматически.',
      'Войти можно по ссылке:',
      loginUrl,
      '',
      'Вход — по email и одноразовому коду. Пароль не нужен.',
    ].join('\n');

    try {
      const sentViaSmtp = await this.trySmtp({ email: normalizedEmail, subject, html, text });
      if (sentViaSmtp) return;

      const sentViaResend = await this.tryResend({ email: normalizedEmail, subject, html, text });
      if (sentViaResend) return;

      this.logger.warn(
        `No email provider configured (SMTP or Resend). Student invite email was not sent to ${normalizedEmail}.`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to send student invite email to ${normalizedEmail}`,
        error instanceof Error ? error.stack : String(error),
      );
    }
  }

  private buildStudentLoginUrl() {
    const raw = process.env.FRONTEND_URL || 'http://localhost:3300';
    const primary =
      raw
        .split(',')
        .map((v) => v.trim())
        .find(Boolean) || 'http://localhost:3300';
    return `${primary.replace(/\/+$/, '')}/auth?view=student`;
  }

  private async sendOtpEmail(email: string, code: string, purpose: OtpPurpose) {
    const subject =
      purpose === 'BOOKING'
        ? 'Подтверждение заявки на занятие · Repeto'
        : 'Код входа в личный кабинет ученика · Repeto';

    const intro =
      purpose === 'BOOKING'
        ? 'Вы оставили заявку на занятие через Repeto. Подтвердите свой email кодом ниже:'
        : 'Введите этот одноразовый код для входа в личный кабинет ученика:';

    const html = [
      '<p>Здравствуйте.</p>',
      `<p>${intro}</p>`,
      `<p style="font-size:24px;font-weight:700;letter-spacing:6px">${code}</p>`,
      `<p>Код действителен ${OTP_TTL_MINUTES} минут.</p>`,
      '<p>Если это были не вы, просто проигнорируйте письмо.</p>',
    ].join('');

    const text = [
      'Здравствуйте.',
      '',
      intro,
      `Ваш код: ${code}`,
      `Код действителен ${OTP_TTL_MINUTES} минут.`,
      'Если это были не вы, просто проигнорируйте письмо.',
    ].join('\n');

    const sentViaSmtp = await this.trySmtp({ email, subject, html, text });
    if (sentViaSmtp) return;

    const sentViaResend = await this.tryResend({ email, subject, html, text });
    if (sentViaResend) return;

    throw new Error('No email provider configured (SMTP or Resend).');
  }

  private async trySmtp(params: {
    email: string;
    subject: string;
    html: string;
    text: string;
  }) {
    const host = (process.env.SMTP_HOST || '').trim();
    const user = (process.env.SMTP_USER || '').trim();
    const pass = process.env.SMTP_PASS || '';
    if (!host || !user || !pass) return false;

    const parsedPort = Number.parseInt(process.env.SMTP_PORT || '465', 10);
    const port = Number.isFinite(parsedPort) ? parsedPort : 465;
    const secureRaw = (process.env.SMTP_SECURE || '').trim().toLowerCase();
    const secure = secureRaw
      ? ['true', '1', 'yes'].includes(secureRaw)
      : port === 465;
    const from =
      (process.env.SMTP_FROM_EMAIL || '').trim() || `Repeto <${user}>`;

    const transporter = nodemailer.createTransport({
      host,
      port,
      secure,
      auth: { user, pass },
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

  private async tryResend(params: {
    email: string;
    subject: string;
    html: string;
    text: string;
  }) {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) return false;

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
      const details = await response.text().catch(() => 'unknown');
      throw new Error(`Resend ${response.status}: ${details}`);
    }

    return true;
  }
}
