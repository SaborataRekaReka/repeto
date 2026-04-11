import { Module } from '@nestjs/common';
import { PortalController } from './portal.controller';
import { PortalService } from './portal.service';
import { NotificationsModule } from '../notifications/notifications.module';
import { MessengerModule } from '../messenger/messenger.module';

@Module({
  imports: [NotificationsModule, MessengerModule],
  controllers: [PortalController],
  providers: [PortalService],
})
export class PortalModule {}
