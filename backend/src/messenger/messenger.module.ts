import { Module } from '@nestjs/common';
import Redis from 'ioredis';
import { AppConfigService } from '../config/app-config.service';
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
      inject: [AppConfigService],
      useFactory: (cfg: AppConfigService) => new Redis(cfg.redisUrl),
    },
  ],
  exports: [TelegramService, MaxService, MessengerDeliveryService, BotPollerService],
})
export class MessengerModule {}
