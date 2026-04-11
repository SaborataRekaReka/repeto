import { Module } from '@nestjs/common';
import { LessonsController } from './lessons.controller';
import { LessonsService } from './lessons.service';
import { GoogleCalendarModule } from '../google-calendar/google-calendar.module';
import { YandexCalendarModule } from '../yandex-calendar/yandex-calendar.module';
import { MessengerModule } from '../messenger/messenger.module';

@Module({
  imports: [GoogleCalendarModule, YandexCalendarModule, MessengerModule],
  controllers: [LessonsController],
  providers: [LessonsService],
  exports: [LessonsService],
})
export class LessonsModule {}
