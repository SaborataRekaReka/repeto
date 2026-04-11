import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import { TelegramService } from './telegram.service';
import { MaxService } from './max.service';

/** TTL for pending booking link codes: 30 minutes */
const LINK_TTL_MS = 30 * 60 * 1000;

type PendingLink = { chatId: string; createdAt: number };

@Injectable()
export class BotPollerService implements OnModuleInit {
  private readonly logger = new Logger(BotPollerService.name);
  private telegramOffset?: number;
  private maxMarker?: number;

  /** Temporary store: linkCode → chatId (for booking flow) */
  private pendingTelegramLinks = new Map<string, PendingLink>();
  private pendingMaxLinks = new Map<string, PendingLink>();

  constructor(
    private readonly prisma: PrismaService,
    private readonly telegram: TelegramService,
    private readonly max: MaxService,
  ) {}

  async onModuleInit() {
    if (this.telegram.isConfigured) {
      this.logger.log('Telegram bot poller enabled');
    }
    if (this.max.isConfigured) {
      this.logger.log('Max bot poller enabled');
    }
  }

  /** Resolve a pending link code → chatId. Removes it from the store. */
  resolveTelegramLink(code: string): string | null {
    const entry = this.pendingTelegramLinks.get(code);
    if (!entry) return null;
    this.pendingTelegramLinks.delete(code);
    if (Date.now() - entry.createdAt > LINK_TTL_MS) return null;
    return entry.chatId;
  }

  resolveMaxLink(code: string): string | null {
    const entry = this.pendingMaxLinks.get(code);
    if (!entry) return null;
    this.pendingMaxLinks.delete(code);
    if (Date.now() - entry.createdAt > LINK_TTL_MS) return null;
    return entry.chatId;
  }

  /** Check if a link code has been consumed (without removing it). */
  hasTelegramLink(code: string): boolean {
    const entry = this.pendingTelegramLinks.get(code);
    return !!entry && Date.now() - entry.createdAt <= LINK_TTL_MS;
  }

  hasMaxLink(code: string): boolean {
    const entry = this.pendingMaxLinks.get(code);
    return !!entry && Date.now() - entry.createdAt <= LINK_TTL_MS;
  }

  @Cron(CronExpression.EVERY_10_SECONDS)
  async pollTelegram() {
    if (!this.telegram.isConfigured) return;

    const updates = await this.telegram.getUpdates(this.telegramOffset);
    for (const update of updates) {
      this.telegramOffset = update.update_id + 1;

      const text = update.message?.text;
      const chatId = update.message?.chat?.id;
      if (!text || !chatId) continue;

      if (text.startsWith('/start ')) {
        const payload = text.slice(7).trim();
        if (payload.startsWith('book_')) {
          await this.handleBookingLink('telegram', String(chatId), payload);
        } else {
          await this.linkStudent('telegram', String(chatId), payload);
        }
      }
    }
  }

  @Cron(CronExpression.EVERY_10_SECONDS)
  async pollMax() {
    if (!this.max.isConfigured) return;

    const updates = await this.max.getUpdates(this.maxMarker);
    for (const update of updates) {
      if (update.timestamp) {
        this.maxMarker = update.timestamp;
      }

      if (update.update_type === 'bot_started') {
        const payload = (update.payload || '').trim();
        const chatId = update.chat_id;
        if (payload && chatId) {
          if (payload.startsWith('book_')) {
            await this.handleBookingLink('max', String(chatId), payload);
          } else {
            await this.linkStudent('max', String(chatId), payload);
          }
        }
        continue;
      }

      if (update.update_type !== 'message_created') continue;

      const text = update.message?.body?.text;
      const chatId = update.message?.recipient?.chat_id || update.message?.sender?.user_id;
      if (!text || !chatId) continue;

      if (text.startsWith('/start ')) {
        const payload = text.slice(7).trim();
        if (payload.startsWith('book_')) {
          await this.handleBookingLink('max', String(chatId), payload);
        } else {
          await this.linkStudent('max', String(chatId), payload);
        }
      }
    }
  }

  /** Cleanup expired pending links every 5 minutes */
  @Cron(CronExpression.EVERY_5_MINUTES)
  cleanupExpiredLinks() {
    const now = Date.now();
    for (const [code, entry] of this.pendingTelegramLinks) {
      if (now - entry.createdAt > LINK_TTL_MS) this.pendingTelegramLinks.delete(code);
    }
    for (const [code, entry] of this.pendingMaxLinks) {
      if (now - entry.createdAt > LINK_TTL_MS) this.pendingMaxLinks.delete(code);
    }
  }

  private async handleBookingLink(
    platform: 'telegram' | 'max',
    chatId: string,
    linkCode: string,
  ) {
    if (platform === 'telegram') {
      this.pendingTelegramLinks.set(linkCode, { chatId, createdAt: Date.now() });
      await this.telegram.sendMessage(chatId, '✅ Отлично! Уведомления будут подключены после записи на занятие.');
    } else {
      this.pendingMaxLinks.set(linkCode, { chatId, createdAt: Date.now() });
      await this.max.sendMessage(chatId, '✅ Отлично! Уведомления будут подключены после записи на занятие.');
    }
    this.logger.log(`Stored pending ${platform} link: ${linkCode} → chat ${chatId}`);
  }

  private async linkStudent(
    platform: 'telegram' | 'max',
    chatId: string,
    portalToken: string,
  ) {
    if (!portalToken || portalToken.length < 10) return;

    const student = await this.prisma.student.findUnique({
      where: { portalToken },
      select: { id: true, name: true, telegramChatId: true, maxChatId: true },
    });

    if (!student) {
      this.logger.warn(`Deep link: no student found for token ${portalToken.slice(0, 8)}...`);
      const message = 'Ссылка недействительна. Попросите репетитора отправить актуальную ссылку на портал.';
      if (platform === 'telegram') {
        await this.telegram.sendMessage(chatId, message);
      } else {
        await this.max.sendMessage(chatId, message);
      }
      return;
    }

    const field = platform === 'telegram' ? 'telegramChatId' : 'maxChatId';
    const currentValue = student[field];

    if (currentValue === chatId) {
      const message = `✅ ${student.name}, вы уже подключены к уведомлениям!`;
      if (platform === 'telegram') {
        await this.telegram.sendMessage(chatId, message);
      } else {
        await this.max.sendMessage(chatId, message);
      }
      return;
    }

    await this.prisma.student.update({
      where: { id: student.id },
      data: { [field]: chatId },
    });

    const platformName = platform === 'telegram' ? 'Telegram' : 'Макс';
    const message = `✅ Готово! ${student.name}, вы будете получать уведомления о занятиях в ${platformName}.`;

    if (platform === 'telegram') {
      await this.telegram.sendMessage(chatId, message);
    } else {
      await this.max.sendMessage(chatId, message);
    }

    this.logger.log(`Linked ${platform} chat ${chatId} to student ${student.id} (${student.name})`);
  }
}
