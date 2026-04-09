import { Module } from '@nestjs/common';
import { YandexCalendarService } from './yandex-calendar.service';

@Module({
  providers: [YandexCalendarService],
  exports: [YandexCalendarService],
})
export class YandexCalendarModule {}
