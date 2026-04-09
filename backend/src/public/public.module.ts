import { Module } from '@nestjs/common';
import { PublicController } from './public.controller';
import { PublicService } from './public.service';
import { AvailabilityModule } from '../availability/availability.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [AvailabilityModule, NotificationsModule],
  controllers: [PublicController],
  providers: [PublicService],
})
export class PublicModule {}
