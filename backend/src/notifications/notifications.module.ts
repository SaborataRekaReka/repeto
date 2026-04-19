import { Module } from '@nestjs/common';
import { NotificationsController } from './notifications.controller';
import { NotificationsService } from './notifications.service';
import { MessengerModule } from '../messenger/messenger.module';
import { PushNotificationsService } from './push-notifications.service';
import { StudentAuthModule } from '../student-auth/student-auth.module';

@Module({
  imports: [MessengerModule, StudentAuthModule],
  controllers: [NotificationsController],
  providers: [NotificationsService, PushNotificationsService],
  exports: [NotificationsService],
})
export class NotificationsModule {}
