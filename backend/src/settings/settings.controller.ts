import {
  Controller,
  Get,
  Patch,
  Post,
  Delete,
  Body,
  Param,
  Query,
  UseInterceptors,
  UploadedFile,
  ParseFilePipe,
  FileTypeValidator,
  MaxFileSizeValidator,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../common/decorators';
import { SettingsService } from './settings.service';
import { GoogleCalendarService } from '../google-calendar/google-calendar.service';
import { YandexCalendarService } from '../yandex-calendar/yandex-calendar.service';
import {
  UpdateAccountDto,
  ChangePasswordDto,
  UpdateNotificationsDto,
  UpdatePoliciesDto,
  ConnectYukassaDto,
  StartYandexDiskDto,
  CompleteYandexDiskDto,
  ConnectYandexDiskTokenDto,
  CompleteGoogleCalendarDto,
  CompleteGoogleDriveDto,
  ConnectYandexCalendarTokenDto,
} from './dto';

@ApiTags('Settings')
@ApiBearerAuth()
@Controller('settings')
export class SettingsController {
  constructor(
    private readonly settingsService: SettingsService,
    private readonly googleCalendarService: GoogleCalendarService,
    private readonly yandexCalendarService: YandexCalendarService,
  ) {}

  @Get()
  getSettings(@CurrentUser('id') userId: string) {
    return this.settingsService.getSettings(userId);
  }

  @Get('account/slug')
  checkAccountSlug(
    @CurrentUser('id') userId: string,
    @Query('value') value?: string,
    @Query('name') name?: string,
  ) {
    return this.settingsService.checkSlugAvailability(userId, value, name);
  }

  @Patch('account')
  updateAccount(
    @CurrentUser('id') userId: string,
    @Body() dto: UpdateAccountDto,
  ) {
    return this.settingsService.updateAccount(userId, dto);
  }

  @Post('avatar')
  @UseInterceptors(FileInterceptor('file'))
  uploadAvatar(
    @CurrentUser('id') userId: string,
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new FileTypeValidator({ fileType: /image\/(jpeg|png|webp|gif)/ }),
          new MaxFileSizeValidator({ maxSize: 5 * 1024 * 1024 }),
        ],
      }),
    )
    file: Express.Multer.File,
  ) {
    return this.settingsService.uploadAvatar(userId, file);
  }

  @Post('change-password')
  changePassword(
    @CurrentUser('id') userId: string,
    @Body() dto: ChangePasswordDto,
  ) {
    return this.settingsService.changePassword(userId, dto);
  }

  @Patch('notifications')
  updateNotifications(
    @CurrentUser('id') userId: string,
    @Body() dto: UpdateNotificationsDto,
  ) {
    return this.settingsService.updateNotifications(userId, dto);
  }

  @Patch('policies')
  updatePolicies(
    @CurrentUser('id') userId: string,
    @Body() dto: UpdatePoliciesDto,
  ) {
    return this.settingsService.updatePolicies(userId, dto);
  }

  @Post('certificates')
  @UseInterceptors(FileInterceptor('file'))
  uploadCertificate(
    @CurrentUser('id') userId: string,
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new FileTypeValidator({ fileType: /image\/(jpeg|png|webp|gif)|application\/pdf/ }),
          new MaxFileSizeValidator({ maxSize: 10 * 1024 * 1024 }),
        ],
      }),
    )
    file: Express.Multer.File,
    @Body('title') title?: string,
  ) {
    return this.settingsService.uploadCertificate(userId, file, title);
  }

  @Delete('certificates/:id')
  deleteCertificate(
    @CurrentUser('id') userId: string,
    @Param('id') certId: string,
  ) {
    return this.settingsService.deleteCertificate(userId, certId);
  }

  @Post('integrations/yukassa')
  connectYukassa(
    @CurrentUser('id') userId: string,
    @Body() dto: ConnectYukassaDto,
  ) {
    return this.settingsService.connectYukassa(userId, { shopId: dto.shopId, secretKey: dto.secretKey });
  }

  @Post('integrations/yandex-disk/start')
  startYandexDiskConnect(
    @CurrentUser('id') userId: string,
    @Body() dto: StartYandexDiskDto,
  ) {
    return this.settingsService.startYandexDiskConnect(userId, dto.rootPath);
  }

  @Post('integrations/yandex-disk/complete')
  completeYandexDiskConnect(
    @CurrentUser('id') userId: string,
    @Body() dto: CompleteYandexDiskDto,
  ) {
    return this.settingsService.completeYandexDiskConnect(userId, dto.code, dto.state);
  }

  @Post('integrations/yandex-disk/connect-token')
  connectYandexDiskToken(
    @CurrentUser('id') userId: string,
    @Body() dto: ConnectYandexDiskTokenDto,
  ) {
    return this.settingsService.connectYandexDiskToken(userId, dto.token, dto.rootPath);
  }

  @Post('integrations/yandex-disk/sync')
  syncYandexDisk(@CurrentUser('id') userId: string) {
    return this.settingsService.syncYandexDisk(userId);
  }

  // ── Google Calendar ──

  @Post('integrations/google-calendar/start')
  startGoogleCalendarConnect(@CurrentUser('id') userId: string) {
    return this.googleCalendarService.startConnect(userId);
  }

  @Post('integrations/google-calendar/complete')
  completeGoogleCalendarConnect(
    @CurrentUser('id') userId: string,
    @Body() dto: CompleteGoogleCalendarDto,
  ) {
    return this.googleCalendarService.completeConnect(userId, dto.code);
  }

  @Post('integrations/google-calendar/sync')
  syncGoogleCalendar(@CurrentUser('id') userId: string) {
    return this.googleCalendarService.syncAllLessons(userId);
  }

  @Post('integrations/google-calendar/pull')
  pullGoogleCalendar(@CurrentUser('id') userId: string) {
    return this.googleCalendarService.pullChanges(userId);
  }

  // ── Google Drive ──

  @Post('integrations/google-drive/start')
  startGoogleDriveConnect(@CurrentUser('id') userId: string) {
    return this.settingsService.startGoogleDriveConnect(userId);
  }

  @Post('integrations/google-drive/complete')
  completeGoogleDriveConnect(
    @CurrentUser('id') userId: string,
    @Body() dto: CompleteGoogleDriveDto,
  ) {
    return this.settingsService.completeGoogleDriveConnect(userId, dto.code);
  }

  // ── Yandex Calendar ──

  @Post('integrations/yandex-calendar/start')
  startYandexCalendarConnect(@CurrentUser('id') userId: string) {
    return this.yandexCalendarService.startConnect(userId);
  }

  @Post('integrations/yandex-calendar/connect-token')
  connectYandexCalendarToken(
    @CurrentUser('id') userId: string,
    @Body() dto: ConnectYandexCalendarTokenDto,
  ) {
    return this.yandexCalendarService.connectToken(userId, dto.token);
  }

  @Post('integrations/yandex-calendar/sync')
  syncYandexCalendar(@CurrentUser('id') userId: string) {
    return this.yandexCalendarService.syncAllLessons(userId);
  }

  @Post('integrations/yandex-calendar/pull')
  pullYandexCalendar(@CurrentUser('id') userId: string) {
    return this.yandexCalendarService.pullChanges(userId);
  }

  @Delete('integrations/:type')
  disconnectIntegration(
    @CurrentUser('id') userId: string,
    @Param('type') type: string,
  ) {
    return this.settingsService.disconnectIntegration(userId, type);
  }

  @Delete('account')
  deleteAccount(
    @CurrentUser('id') userId: string,
    @Body() body: { password: string },
  ) {
    return this.settingsService.deleteAccount(userId, body.password);
  }
}
