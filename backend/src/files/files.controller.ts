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
}
