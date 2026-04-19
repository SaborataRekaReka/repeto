import { Module } from '@nestjs/common';
import { PublicController } from './public.controller';
import { PublicService } from './public.service';
import { AvailabilityModule } from '../availability/availability.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { MessengerModule } from '../messenger/messenger.module';
import { StudentAuthModule } from '../student-auth/student-auth.module';

@Module({
  imports: [AvailabilityModule, NotificationsModule, MessengerModule, StudentAuthModule],
  controllers: [PublicController],
  providers: [PublicService],
})
export class PublicModule {}
