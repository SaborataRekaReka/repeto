import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../common/decorators';
import { FilesService } from './files.service';
import { UpdateFileShareDto } from './dto';

@ApiTags('Files')
@ApiBearerAuth()
@Controller('files')
export class FilesController {
  constructor(private readonly filesService: FilesService) {}

  @Get()
  getFiles(@CurrentUser('id') userId: string) {
    return this.filesService.getFilesOverview(userId);
  }

  @Patch(':id/share')
  updateFileShare(
    @CurrentUser('id') userId: string,
    @Param('id', ParseUUIDPipe) fileId: string,
    @Body() dto: UpdateFileShareDto,
  ) {
    return this.filesService.updateFileShare(userId, fileId, dto);
  }

  @Post('yandex-disk/sync')
  syncYandexDisk(@CurrentUser('id') userId: string) {
    return this.filesService.syncFromYandexDisk(userId);
  }

  @Post('yandex-disk/sync-folder/:id')
  syncYandexDiskFolder(
    @CurrentUser('id') userId: string,
    @Param('id', ParseUUIDPipe) folderId: string,
  ) {
    return this.filesService.syncYandexDiskFolder(userId, folderId);
  }

  @Post('google-drive/sync')
  syncGoogleDrive(@CurrentUser('id') userId: string) {
    return this.filesService.syncFromGoogleDrive(userId);
  }

  @Post('google-drive/sync-folder/:id')
  syncGoogleDriveFolder(
    @CurrentUser('id') userId: string,
    @Param('id', ParseUUIDPipe) folderId: string,
  ) {
    return this.filesService.syncGoogleDriveFolder(userId, folderId);
  }
}
