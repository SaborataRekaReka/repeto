import { Module } from '@nestjs/common';
import { SettingsController } from './settings.controller';
import { SettingsService } from './settings.service';
import { FilesModule } from '../files/files.module';
import { GoogleCalendarModule } from '../google-calendar/google-calendar.module';
import { YandexCalendarModule } from '../yandex-calendar/yandex-calendar.module';

@Module({
  imports: [FilesModule, GoogleCalendarModule, YandexCalendarModule],
  controllers: [SettingsController],
  providers: [SettingsService],
})
export class SettingsModule {}
