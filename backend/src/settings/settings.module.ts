import { Module } from '@nestjs/common';
import { SettingsController } from './settings.controller';
import { SettingsService } from './settings.service';
import { FilesModule } from '../files/files.module';
import { GoogleCalendarModule } from '../google-calendar/google-calendar.module';
import { YandexCalendarModule } from '../yandex-calendar/yandex-calendar.module';
import { LegalModule } from '../legal/legal.module';

@Module({
  imports: [FilesModule, GoogleCalendarModule, YandexCalendarModule, LegalModule],
  controllers: [SettingsController],
  providers: [SettingsService],
})
export class SettingsModule {}
