import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import * as crypto from 'crypto';
import * as nodemailer from 'nodemailer';
import { v4 as uuidv4 } from 'uuid';
import { PrismaService } from '../prisma/prisma.service';
import {
  RegisterDto,
  VerifyRegisterCodeDto,
  StartRegistrationPaymentDto,
  CompleteRegistrationDto,
  StartPlatformAccessPaymentDto,
  CompletePlatformAccessPaymentDto,
  RegistrationPlanId,
  RegistrationBillingCycle,
  LoginDto,
} from './dto';
import {
  calculatePlatformAccessExpiresAt,
  getPlatformAccessState,
  isPlatformBillingCycle,
  isPlatformPlanId,
  normalizePlatformAccess,
} from '../common/utils/platform-access';
import { resolveUserRole } from '../common/utils/admin-access';

const REGISTRATION_CODE_LENGTH = 6;
const REGISTRATION_CODE_TTL_MINUTES = 15;
const REGISTRATION_MAX_ATTEMPTS = 5;
const REGISTRATION_PAYMENT_TOKEN_TTL_MINUTES = 60;

type RegistrationPlanConfig = {
  id: RegistrationPlanId;
  name: string;
  subtitle: string;
  studentLimit: number | null;
  monthlyPriceRub: number;
  yearlyMonthlyPriceRub: number;
};

type YookassaPaymentStatus = {
  id: string;
  status: string;
  paid?: boolean;
  amount?: {
    value?: string;
    currency?: string;
  };
  metadata?: Record<string, unknown>;
  confirmation?: {
    confirmation_url?: string;
  };
};

type PlatformAccessCharge = {
  amountRub: number;
  baseAmountRub: number;
  creditAmountRub: number;
  sourcePlanId: RegistrationPlanId | null;
  sourceBillingCycle: RegistrationBillingCycle | null;
  remainingDays: number;
};

const REGISTRATION_PLANS: Record<RegistrationPlanId, RegistrationPlanConfig> = {
  [RegistrationPlanId.START]: {
    id: RegistrationPlanId.START,
    name: 'Старт',
    subtitle: 'Полный доступ для старта',
    studentLimit: 1,
    monthlyPriceRub: 0,
    yearlyMonthlyPriceRub: 0,
  },
  [RegistrationPlanId.PROFI]: {
    id: RegistrationPlanId.PROFI,
    name: 'Практика',
    subtitle: 'Оптимально для частного репетитора',
    studentLimit: 15,
    monthlyPriceRub: 300,
    yearlyMonthlyPriceRub: 250,
  },
  [RegistrationPlanId.CENTER]: {
    id: RegistrationPlanId.CENTER,
    name: 'Репетиторский центр',
    subtitle: 'Для команды и роста без ограничений',
    studentLimit: null,
    monthlyPriceRub: 1500,
    yearlyMonthlyPriceRub: 1250,
  },
};

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

  getRegistrationPlans() {
    return {
      defaultPlanId: RegistrationPlanId.PROFI,
      defaultBillingCycle: RegistrationBillingCycle.MONTH,
      plans: Object.values(REGISTRATION_PLANS).map((plan) => ({
        id: plan.id,
        name: plan.name,
        subtitle: plan.subtitle,
        studentLimit: plan.studentLimit,
        monthlyPriceRub: plan.monthlyPriceRub,
        yearlyMonthlyPriceRub: plan.yearlyMonthlyPriceRub,
        yearlyTotalRub: plan.yearlyMonthlyPriceRub * 12,
      })),
    };
  }

  async verifyRegisterCode(dto: VerifyRegisterCodeDto) {
    const email = dto.email.trim().toLowerCase();
    const codeHash = this.hashRegistrationCode(dto.code.trim());

    const verification = await this.getActiveRegistrationVerification(email);

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

    const verificationToken = this.jwtService.sign(
      {
        typ: 'registration_payment',
        email: verification.email,
        codeHash: verification.codeHash,
      },
      { expiresIn: `${REGISTRATION_PAYMENT_TOKEN_TTL_MINUTES}m` },
    );

    return {
      verificationToken,
      email: verification.email,
      expiresInMinutes: REGISTRATION_PAYMENT_TOKEN_TTL_MINUTES,
    };
  }

  async startRegistrationPayment(dto: StartRegistrationPaymentDto) {
    const verification = await this.resolveRegistrationVerification(dto.verificationToken);
    const amountRub = this.resolveRegistrationAmount(dto.planId, dto.billingCycle);

    if (amountRub <= 0) {
      return {
        requiresPayment: false,
        amountRub: 0,
      };
    }

    const payment = await this.createYookassaPayment({
      source: 'registration',
      email: verification.email,
      planId: dto.planId,
      billingCycle: dto.billingCycle,
      amountRub,
      returnUrl: this.getAuthPageUrl(),
    });

    const confirmationUrl = payment.confirmation?.confirmation_url;
    if (!confirmationUrl) {
      throw new BadRequestException('Платежная страница не была создана. Повторите попытку.');
    }

    return {
      requiresPayment: true,
      amountRub,
      paymentId: payment.id,
      confirmationUrl,
    };
  }

  async completeRegistration(dto: CompleteRegistrationDto) {
    const verification = await this.resolveRegistrationVerification(dto.verificationToken);
    const amountRub = this.resolveRegistrationAmount(dto.planId, dto.billingCycle);

    if (amountRub > 0) {
      if (!dto.paymentId) {
        throw new BadRequestException('Не найден платёж для завершения регистрации');
      }

      const payment = await this.getRegistrationPayment(dto.paymentId);
      if (payment.status !== 'succeeded' || !payment.paid) {
        throw new BadRequestException('Оплата ещё не подтверждена. Завершите платеж в ЮKassa.');
      }

      const paidAmountRub = this.parseYookassaAmount(payment.amount?.value);
      if (paidAmountRub !== amountRub) {
        throw new BadRequestException('Сумма платежа не совпадает с выбранным тарифом.');
      }

      const metadata = payment.metadata || {};
      const paymentSource = String(metadata.source || '').trim();
      const paymentEmail = String(metadata.email || '').trim().toLowerCase();
      const paymentPlanId = String(metadata.planId || '').trim();
      const paymentBilling = String(metadata.billingCycle || '').trim();

      if (
        paymentSource !== 'registration' ||
        paymentEmail !== verification.email ||
        paymentPlanId !== dto.planId ||
        paymentBilling !== dto.billingCycle
      ) {
        throw new BadRequestException('Платеж не соответствует текущей регистрации.');
      }
    }

    const activatedAt = new Date();
    const platformAccess = {
      status: 'active',
      planId: dto.planId,
      billingCycle: dto.billingCycle,
      activatedAt: activatedAt.toISOString(),
      expiresAt: calculatePlatformAccessExpiresAt(activatedAt, dto.billingCycle).toISOString(),
      amountRub,
      paymentId: dto.paymentId || null,
    };

    const user = await this.prisma.$transaction(async (tx) => {
      const existing = await tx.user.findUnique({
        where: { email: verification.email },
      });

      if (existing) {
        throw new ConflictException('Пользователь с таким email уже существует');
      }

      const createdUser = await tx.user.create({
        data: {
          email: verification.email,
          passwordHash: verification.passwordHash,
          name: verification.name,
          phone: verification.phone,
          paymentSettings: {
            platformAccess,
          } as any,
        },
      });

      await tx.registrationVerification.deleteMany({
        where: { id: verification.id },
      });

      return createdUser;
    });

    const tokens = await this.generateTokens(user.id, user.email);
    return {
      user: this.sanitizeUser(user),
      ...tokens,
    };
  }

  async startPlatformAccessPayment(
    userId: string,
    dto: StartPlatformAccessPaymentDto,
  ) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new UnauthorizedException();
    }

    const currentAccess = normalizePlatformAccess(user.paymentSettings);
    const planId =
      this.resolvePlanId(dto.planId) ||
      this.resolvePlanId(currentAccess?.planId) ||
      RegistrationPlanId.PROFI;
    const billingCycle =
      this.resolveBillingCycle(dto.billingCycle) ||
      this.resolveBillingCycle(currentAccess?.billingCycle) ||
      RegistrationBillingCycle.MONTH;
    const charge = this.resolvePlatformAccessCharge({
      currentAccess,
      planId,
      billingCycle,
    });
    const amountRub = charge.amountRub;

    if (amountRub <= 0) {
      const updatedUser = await this.activatePlatformAccessForUser(user.id, {
        planId,
        billingCycle,
        amountRub: charge.baseAmountRub,
        paymentId: null,
      });

      return {
        requiresPayment: false,
        amountRub,
        baseAmountRub: charge.baseAmountRub,
        creditAmountRub: charge.creditAmountRub,
        sourcePlanId: charge.sourcePlanId,
        sourceBillingCycle: charge.sourceBillingCycle,
        remainingDays: charge.remainingDays,
        planId,
        billingCycle,
        user: this.sanitizeUser(updatedUser),
      };
    }

    const payment = await this.createYookassaPayment({
      source: 'platform_access_renewal',
      email: user.email,
      userId: user.id,
      planId,
      billingCycle,
      amountRub,
      baseAmountRub: charge.baseAmountRub,
      creditAmountRub: charge.creditAmountRub,
      returnUrl: this.getDashboardRenewUrl(),
    });

    const confirmationUrl = payment.confirmation?.confirmation_url;
    if (!confirmationUrl) {
      throw new BadRequestException('Платежная страница не была создана. Повторите попытку.');
    }

    return {
      requiresPayment: true,
      amountRub,
      baseAmountRub: charge.baseAmountRub,
      creditAmountRub: charge.creditAmountRub,
      sourcePlanId: charge.sourcePlanId,
      sourceBillingCycle: charge.sourceBillingCycle,
      remainingDays: charge.remainingDays,
      planId,
      billingCycle,
      paymentId: payment.id,
      confirmationUrl,
    };
  }

  async completePlatformAccessPayment(
    userId: string,
    dto: CompletePlatformAccessPaymentDto,
  ) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new UnauthorizedException();
    }

    const payment = await this.getRegistrationPayment(dto.paymentId);
    if (payment.status !== 'succeeded' || !payment.paid) {
      throw new BadRequestException('Оплата ещё не подтверждена. Завершите платеж в ЮKassa.');
    }

    const metadata = payment.metadata || {};
    const paymentSource = String(metadata.source || '').trim();
    const paymentUserId = String(metadata.userId || '').trim();
    const paymentEmail = String(metadata.email || '').trim().toLowerCase();
    const planId = this.resolvePlanId(metadata.planId);
    const billingCycle = this.resolveBillingCycle(metadata.billingCycle);
    const chargeAmountRub = this.parseMetadataAmount(metadata.chargeAmountRub);
    const baseAmountRub = this.parseMetadataAmount(metadata.baseAmountRub);
    const creditAmountRub = this.parseMetadataAmount(metadata.creditAmountRub);

    if (
      paymentSource !== 'platform_access_renewal' ||
      paymentUserId !== user.id ||
      paymentEmail !== user.email.toLowerCase() ||
      !planId ||
      !billingCycle
    ) {
      throw new BadRequestException('Платеж не соответствует вашему аккаунту.');
    }

    const fallbackBaseAmountRub = this.resolveRegistrationAmount(planId, billingCycle);
    const resolvedBaseAmountRub =
      baseAmountRub !== null ? baseAmountRub : fallbackBaseAmountRub;
    const amountRub = chargeAmountRub !== null ? chargeAmountRub : fallbackBaseAmountRub;
    const resolvedCreditAmountRub = Math.max(
      0,
      creditAmountRub !== null
        ? creditAmountRub
        : resolvedBaseAmountRub - amountRub,
    );

    if (amountRub < 0 || resolvedBaseAmountRub < 0) {
      throw new BadRequestException('Неверные данные платежа.');
    }

    const paidAmountRub = this.parseYookassaAmount(payment.amount?.value);
    if (paidAmountRub !== amountRub) {
      throw new BadRequestException('Сумма платежа не совпадает с выбранным тарифом.');
    }

    const updatedUser = await this.activatePlatformAccessForUser(user.id, {
      planId,
      billingCycle,
      amountRub: resolvedBaseAmountRub,
      paymentId: payment.id,
    });

    return {
      user: this.sanitizeUser(updatedUser),
      amountRub,
      baseAmountRub: resolvedBaseAmountRub,
      creditAmountRub: resolvedCreditAmountRub,
      planId,
      billingCycle,
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

    const tokens = await this.generateTokens(user.id, user.email);
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
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { email: true },
    });
    if (!user) {
      throw new UnauthorizedException();
    }
    await this.prisma.refreshToken.deleteMany({ where: { id: stored.id } });
    return this.generateTokens(userId, user.email);
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

    const frontendUrl =
      process.env.NODE_ENV === 'production'
        ? this.resolveFrontendUrl('')
        : this.resolveFrontendUrl('http://localhost:3300');
    if (!frontendUrl) {
      this.logger.error('FRONTEND_URL is required in production for password reset links');
      return;
    }
    const resetUrl = `${frontendUrl}/auth?token=${encodeURIComponent(rawResetToken)}`;

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

  private async getActiveRegistrationVerification(email: string) {
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

    return verification;
  }

  private decodeRegistrationPaymentToken(token: string) {
    try {
      const payload = this.jwtService.verify<{
        typ?: string;
        email?: string;
        codeHash?: string;
      }>(token);

      const email = (payload.email || '').trim().toLowerCase();
      const codeHash = (payload.codeHash || '').trim();

      if (payload.typ !== 'registration_payment' || !email || !codeHash) {
        throw new BadRequestException('Некорректная сессия регистрации');
      }

      return { email, codeHash };
    } catch {
      throw new BadRequestException('Сессия регистрации истекла. Запросите код заново.');
    }
  }

  private async resolveRegistrationVerification(verificationToken: string) {
    const tokenPayload = this.decodeRegistrationPaymentToken(verificationToken);
    const verification = await this.getActiveRegistrationVerification(tokenPayload.email);

    if (verification.codeHash !== tokenPayload.codeHash) {
      throw new BadRequestException('Сессия регистрации устарела. Подтвердите код снова.');
    }

    return verification;
  }

  private resolveRegistrationAmount(
    planId: RegistrationPlanId,
    billingCycle: RegistrationBillingCycle,
  ) {
    const plan = REGISTRATION_PLANS[planId];
    if (!plan) {
      throw new BadRequestException('Неизвестный тариф');
    }

    if (billingCycle === RegistrationBillingCycle.YEAR) {
      return plan.yearlyMonthlyPriceRub * 12;
    }

    return plan.monthlyPriceRub;
  }

  private resolvePlatformAccessCharge(params: {
    currentAccess: ReturnType<typeof normalizePlatformAccess>;
    planId: RegistrationPlanId;
    billingCycle: RegistrationBillingCycle;
  }): PlatformAccessCharge {
    const baseAmountRub = this.resolveRegistrationAmount(
      params.planId,
      params.billingCycle,
    );

    const sourcePlanId = this.resolvePlanId(params.currentAccess?.planId);
    const sourceBillingCycle = this.resolveBillingCycle(
      params.currentAccess?.billingCycle,
    );

    const fallback: PlatformAccessCharge = {
      amountRub: baseAmountRub,
      baseAmountRub,
      creditAmountRub: 0,
      sourcePlanId,
      sourceBillingCycle,
      remainingDays: 0,
    };

    if (!sourcePlanId || !sourceBillingCycle) {
      return fallback;
    }

    if (this.resolvePlanRank(params.planId) <= this.resolvePlanRank(sourcePlanId)) {
      return fallback;
    }

    const expiresAt = params.currentAccess?.expiresAt
      ? new Date(params.currentAccess.expiresAt)
      : null;

    if (!expiresAt || !Number.isFinite(expiresAt.getTime())) {
      return fallback;
    }

    const nowMs = Date.now();
    const expiresAtMs = expiresAt.getTime();
    if (expiresAtMs <= nowMs) {
      return fallback;
    }

    let fullPeriodMs = 0;
    const activatedAt = params.currentAccess?.activatedAt
      ? new Date(params.currentAccess.activatedAt)
      : null;

    if (activatedAt && Number.isFinite(activatedAt.getTime())) {
      fullPeriodMs = expiresAtMs - activatedAt.getTime();
    }

    if (fullPeriodMs <= 0) {
      fullPeriodMs =
        sourceBillingCycle === RegistrationBillingCycle.YEAR
          ? 365 * 24 * 60 * 60 * 1000
          : 30 * 24 * 60 * 60 * 1000;
    }

    const remainingMs = expiresAtMs - nowMs;
    const ratio = Math.max(0, Math.min(1, remainingMs / fullPeriodMs));
    const sourceAmountRub = this.resolveRegistrationAmount(
      sourcePlanId,
      sourceBillingCycle,
    );
    const creditAmountRub = Math.max(0, Math.round(sourceAmountRub * ratio));
    const amountRub = Math.max(0, baseAmountRub - creditAmountRub);
    const remainingDays = Number((remainingMs / (24 * 60 * 60 * 1000)).toFixed(1));

    return {
      amountRub,
      baseAmountRub,
      creditAmountRub,
      sourcePlanId,
      sourceBillingCycle,
      remainingDays,
    };
  }

  private resolvePlanRank(planId: RegistrationPlanId): number {
    if (planId === RegistrationPlanId.START) return 1;
    if (planId === RegistrationPlanId.PROFI) return 2;
    return 3;
  }

  private resolvePlanId(rawValue: unknown): RegistrationPlanId | null {
    const normalized = typeof rawValue === 'string' ? rawValue.trim().toLowerCase() : rawValue;
    if (!isPlatformPlanId(normalized)) {
      return null;
    }

    return normalized as RegistrationPlanId;
  }

  private resolveBillingCycle(rawValue: unknown): RegistrationBillingCycle | null {
    const normalized = typeof rawValue === 'string' ? rawValue.trim().toLowerCase() : rawValue;
    if (!isPlatformBillingCycle(normalized)) {
      return null;
    }

    return normalized as RegistrationBillingCycle;
  }

  private async activatePlatformAccessForUser(
    userId: string,
    params: {
      planId: RegistrationPlanId;
      billingCycle: RegistrationBillingCycle;
      amountRub: number;
      paymentId: string | null;
    },
  ) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { paymentSettings: true },
    });
    if (!user) {
      throw new UnauthorizedException();
    }

    const currentPaymentSettings =
      user.paymentSettings && typeof user.paymentSettings === 'object' && !Array.isArray(user.paymentSettings)
        ? (user.paymentSettings as Record<string, unknown>)
        : {};

    const activatedAt = new Date();
    const platformAccess = {
      status: 'active',
      planId: params.planId,
      billingCycle: params.billingCycle,
      activatedAt: activatedAt.toISOString(),
      expiresAt: calculatePlatformAccessExpiresAt(activatedAt, params.billingCycle).toISOString(),
      amountRub: params.amountRub,
      paymentId: params.paymentId,
    };

    return this.prisma.user.update({
      where: { id: userId },
      data: {
        paymentSettings: {
          ...currentPaymentSettings,
          platformAccess,
        } as any,
      },
    });
  }

  private getYookassaCredentials() {
    const shopId =
      (process.env.YUKASSA_PLATFORM_SHOP_ID || process.env.YUKASSA_SHOP_ID || '').trim();
    const secretKey =
      (process.env.YUKASSA_PLATFORM_SECRET_KEY || process.env.YUKASSA_SECRET_KEY || '').trim();

    if (!shopId || !secretKey) {
      throw new BadRequestException(
        'Платежи временно недоступны: не настроены ключи ЮKassa',
      );
    }

    return { shopId, secretKey };
  }

  private getAuthPageUrl() {
    const base = this.resolveFrontendUrl('http://localhost:3300');
    return `${base}/auth?view=signup&step=payment`;
  }

  private getDashboardRenewUrl() {
    const base = this.resolveFrontendUrl('http://localhost:3300');
    return `${base}/dashboard?renew=1`;
  }

  private resolveFrontendUrl(fallback: string) {
    const raw = process.env.FRONTEND_URL || '';
    const primary =
      raw
        .split(',')
        .map((value) => value.trim())
        .find(Boolean) || fallback;

    return primary.replace(/\/+$/, '');
  }

  private formatAmountForYookassa(amountRub: number) {
    return amountRub.toFixed(2);
  }

  private parseYookassaAmount(rawValue?: string) {
    if (!rawValue) return 0;
    const normalized = Number.parseFloat(rawValue);
    if (!Number.isFinite(normalized)) return 0;
    return Math.round(normalized);
  }

  private parseMetadataAmount(rawValue: unknown): number | null {
    if (typeof rawValue === 'number' && Number.isFinite(rawValue)) {
      return Math.round(rawValue);
    }

    if (typeof rawValue === 'string') {
      const normalized = Number.parseFloat(rawValue);
      if (Number.isFinite(normalized)) {
        return Math.round(normalized);
      }
    }

    return null;
  }

  private async createYookassaPayment(params: {
    source: 'registration' | 'platform_access_renewal';
    email: string;
    userId?: string;
    planId: RegistrationPlanId;
    billingCycle: RegistrationBillingCycle;
    amountRub: number;
    baseAmountRub?: number;
    creditAmountRub?: number;
    returnUrl: string;
  }): Promise<YookassaPaymentStatus> {
    const { shopId, secretKey } = this.getYookassaCredentials();
    const authHeader = Buffer.from(`${shopId}:${secretKey}`).toString('base64');
    const descriptionPlan = REGISTRATION_PLANS[params.planId]?.name || params.planId;

    const response = await fetch('https://api.yookassa.ru/v3/payments', {
      method: 'POST',
      headers: {
        Authorization: `Basic ${authHeader}`,
        'Content-Type': 'application/json',
        'Idempotence-Key': crypto.randomUUID(),
      },
      body: JSON.stringify({
        amount: {
          value: this.formatAmountForYookassa(params.amountRub),
          currency: 'RUB',
        },
        capture: true,
        confirmation: {
          type: 'redirect',
          return_url: params.returnUrl,
        },
        description: `Repeto: тариф ${descriptionPlan} (${params.billingCycle === RegistrationBillingCycle.YEAR ? 'год' : 'месяц'})`,
        metadata: {
          source: params.source,
          email: params.email,
          planId: params.planId,
          billingCycle: params.billingCycle,
          chargeAmountRub: params.amountRub,
          baseAmountRub:
            params.baseAmountRub !== undefined ? params.baseAmountRub : params.amountRub,
          creditAmountRub: params.creditAmountRub || 0,
          ...(params.userId ? { userId: params.userId } : {}),
        },
      }),
    });

    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      this.logger.warn(
        `YooKassa create payment failed: ${response.status} ${JSON.stringify(payload)}`,
      );
      throw new BadRequestException('Не удалось создать платеж. Попробуйте еще раз.');
    }

    return payload as YookassaPaymentStatus;
  }

  private async getRegistrationPayment(paymentId: string): Promise<YookassaPaymentStatus> {
    const { shopId, secretKey } = this.getYookassaCredentials();
    const authHeader = Buffer.from(`${shopId}:${secretKey}`).toString('base64');

    const response = await fetch(
      `https://api.yookassa.ru/v3/payments/${encodeURIComponent(paymentId)}`,
      {
        method: 'GET',
        headers: {
          Authorization: `Basic ${authHeader}`,
          'Content-Type': 'application/json',
        },
      },
    );

    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      this.logger.warn(
        `YooKassa payment status failed: ${response.status} ${JSON.stringify(payload)}`,
      );
      throw new BadRequestException('Не удалось проверить статус платежа. Попробуйте снова.');
    }

    return payload as YookassaPaymentStatus;
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

  private async generateTokens(userId: string, userEmail: string) {
    const role = resolveUserRole(userEmail);
    const accessToken = this.jwtService.sign(
      { sub: userId, role },
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
    paymentSettings?: unknown;
  }) {
    const platformAccess = normalizePlatformAccess(user.paymentSettings);
    const platformAccessState = getPlatformAccessState(user.paymentSettings);
    const role = resolveUserRole(user.email);

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
      role,
      platformAccess,
      platformAccessState,
    };
  }
}
