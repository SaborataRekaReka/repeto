import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class TelegramService {
  private readonly logger = new Logger(TelegramService.name);
  private readonly botToken = process.env.TELEGRAM_BOT_TOKEN || '';

  get isConfigured(): boolean {
    return !!this.botToken;
  }

  async sendMessage(chatId: string, text: string): Promise<boolean> {
    if (!this.botToken || !chatId) return false;

    try {
      const url = `https://api.telegram.org/bot${this.botToken}/sendMessage`;
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId,
          text,
          parse_mode: 'HTML',
        }),
      });

      if (!res.ok) {
        const body = await res.text();
        this.logger.warn(`Telegram send failed: ${res.status} ${body}`);
        return false;
      }

      return true;
    } catch (error) {
      this.logger.error(`Telegram send error: ${error}`);
      return false;
    }
  }

  async verifyBot(): Promise<{ ok: boolean; username?: string }> {
    if (!this.botToken) return { ok: false };
    try {
      const url = `https://api.telegram.org/bot${this.botToken}/getMe`;
      const res = await fetch(url);
      const data = await res.json();

      if (data.ok && data.result) {
        return { ok: true, username: data.result.username };
      }

      return { ok: false };
    } catch {
      return { ok: false };
    }
  }

  async getUpdates(offset?: number): Promise<Array<{
    update_id: number;
    message?: { chat: { id: number }; text?: string; from?: { first_name?: string } };
  }>> {
    if (!this.botToken) return [];
    try {
      const params = new URLSearchParams({ timeout: '0' });
      if (offset !== undefined) params.set('offset', String(offset));
      const url = `https://api.telegram.org/bot${this.botToken}/getUpdates?${params}`;
      const res = await fetch(url);
      const data = await res.json();
      return data.ok ? data.result : [];
    } catch (error) {
      this.logger.error(`Telegram getUpdates error: ${error}`);
      return [];
    }
  }

  get botUsername(): Promise<string | null> {
    return this.verifyBot().then(r => r.username || null);
  }
}
