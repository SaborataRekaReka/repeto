import { Module } from '@nestjs/common';
import { PortalController } from './portal.controller';
import { PortalService } from './portal.service';
import { NotificationsModule } from '../notifications/notifications.module';
import { MessengerModule } from '../messenger/messenger.module';
import { StudentAuthModule } from '../student-auth/student-auth.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [NotificationsModule, MessengerModule, StudentAuthModule, AuthModule],
  controllers: [PortalController],
  providers: [PortalService],
})
export class PortalModule {}
