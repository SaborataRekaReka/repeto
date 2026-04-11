import { Injectable, Logger } from '@nestjs/common';

const MAX_API_BASE = 'https://platform-api.max.ru';
const LEGACY_MAX_API_BASE = 'https://api.max.ru/bot/v1';

@Injectable()
export class MaxService {
  private readonly logger = new Logger(MaxService.name);
  private readonly botToken = process.env.MAX_BOT_TOKEN || '';

  get isConfigured(): boolean {
    return !!this.botToken;
  }

  async sendMessage(chatId: string, text: string): Promise<boolean> {
    if (!this.botToken || !chatId) return false;

    try {
      // Current MAX API format
      let res = await fetch(`${MAX_API_BASE}/messages?chat_id=${encodeURIComponent(chatId)}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: this.botToken,
        },
        body: JSON.stringify({
          text,
        }),
      });

      // Backward-compatible fallback for older API endpoint
      if (!res.ok && (res.status === 401 || res.status === 404 || res.status === 405)) {
        const legacyUrl = `${LEGACY_MAX_API_BASE}/messages?access_token=${this.botToken}`;
        res = await fetch(legacyUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: chatId,
            text,
          }),
        });
      }

      if (!res.ok) {
        const body = await res.text();
        this.logger.warn(`Max send failed: ${res.status} ${body}`);
        return false;
      }

      return true;
    } catch (error) {
      this.logger.error(`Max send error: ${error}`);
      return false;
    }
  }

  async verifyBot(): Promise<{ ok: boolean; name?: string; username?: string }> {
    if (!this.botToken) return { ok: false };
    try {
      // Current MAX API format
      let res = await fetch(`${MAX_API_BASE}/me`, {
        headers: { Authorization: this.botToken },
      });
      let data = await res.json().catch(() => ({}));

      // Backward-compatible fallback
      if (!res.ok) {
        const legacyUrl = `${LEGACY_MAX_API_BASE}/me?access_token=${this.botToken}`;
        res = await fetch(legacyUrl);
        data = await res.json().catch(() => ({}));
      }

      if (data?.user_id) {
        return {
          ok: true,
          name: data.name || data.first_name || data.username,
          username: data.username || undefined,
        };
      }

      return { ok: false };
    } catch {
      return { ok: false };
    }
  }

  async getUpdates(marker?: number): Promise<Array<{
    update_type: string;
    timestamp: number;
    message?: { sender: { user_id: number; name?: string }; body?: { text?: string }; recipient?: { chat_id: number } };
    chat_id?: number;
    payload?: string | null;
  }>> {
    if (!this.botToken) return [];
    try {
      const params = new URLSearchParams();
      if (marker !== undefined) params.set('marker', String(marker));
      const url = `${MAX_API_BASE}/updates${params.toString() ? `?${params.toString()}` : ''}`;
      let res = await fetch(url, {
        headers: { Authorization: this.botToken },
      });
      let data = await res.json().catch(() => ({}));

      // Backward-compatible fallback
      if (!res.ok) {
        const legacyParams = new URLSearchParams({ access_token: this.botToken });
        if (marker !== undefined) legacyParams.set('marker', String(marker));
        const legacyUrl = `${LEGACY_MAX_API_BASE}/updates?${legacyParams}`;
        res = await fetch(legacyUrl);
        data = await res.json().catch(() => ({}));
      }

      return data.updates || [];
    } catch (error) {
      this.logger.error(`Max getUpdates error: ${error}`);
      return [];
    }
  }
}
