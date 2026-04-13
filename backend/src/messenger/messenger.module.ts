import { Module } from '@nestjs/common';
import Redis from 'ioredis';
import { TelegramService } from './telegram.service';
import { MaxService } from './max.service';
import { MessengerDeliveryService } from './messenger-delivery.service';
import { ReminderSchedulerService } from './reminder-scheduler.service';
import { BotPollerService } from './bot-poller.service';

@Module({
  providers: [
    TelegramService,
    MaxService,
    MessengerDeliveryService,
    ReminderSchedulerService,
    BotPollerService,
    {
      provide: 'REDIS',
      useFactory: () => new Redis(process.env.REDIS_URL || 'redis://localhost:6379'),
    },
  ],
  exports: [TelegramService, MaxService, MessengerDeliveryService, BotPollerService],
})
export class MessengerModule {}
