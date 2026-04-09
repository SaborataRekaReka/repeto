import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  UseInterceptors,
  UploadedFile,
  ParseFilePipe,
  MaxFileSizeValidator,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { Public } from '../common/decorators';
import { PortalService } from './portal.service';

@ApiTags('Portal')
@Controller('portal')
export class PortalController {
  constructor(private readonly portalService: PortalService) {}

  @Public()
  @Get(':token')
  getPortalData(@Param('token') token: string) {
    return this.portalService.getPortalData(token);
  }

  @Public()
  @Post(':token/lessons/:lessonId/cancel')
  cancelLesson(
    @Param('token') token: string,
    @Param('lessonId') lessonId: string,
  ) {
    return this.portalService.cancelLesson(token, lessonId);
  }

  @Public()
  @Post(':token/lessons/:lessonId/reschedule')
  requestReschedule(
    @Param('token') token: string,
    @Param('lessonId') lessonId: string,
    @Body('newDate') newDate: string,
    @Body('newTime') newTime: string,
  ) {
    return this.portalService.requestReschedule(token, lessonId, newDate, newTime);
  }

  @Public()
  @Post(':token/lessons/:lessonId/feedback')
  submitLessonFeedback(
    @Param('token') token: string,
    @Param('lessonId') lessonId: string,
    @Body('rating') rating: number,
    @Body('feedback') feedback?: string,
  ) {
    return this.portalService.submitLessonFeedback(
      token,
      lessonId,
      rating,
      feedback,
    );
  }

  @Public()
  @Patch(':token/homework/:homeworkId')
  toggleHomework(
    @Param('token') token: string,
    @Param('homeworkId') homeworkId: string,
    @Body('done') done: boolean,
  ) {
    return this.portalService.toggleHomework(token, homeworkId, done);
  }

  @Public()
  @Post(':token/homework/:homeworkId/upload')
  @UseInterceptors(FileInterceptor('file'))
  uploadHomeworkFile(
    @Param('token') token: string,
    @Param('homeworkId') homeworkId: string,
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 5 * 1024 * 1024 }),
        ],
      }),
    )
    file: Express.Multer.File,
  ) {
    return this.portalService.uploadHomeworkFile(token, homeworkId, file);
  }

  @Public()
  @Delete(':token/homework/:homeworkId/upload')
  removeHomeworkFile(
    @Param('token') token: string,
    @Param('homeworkId') homeworkId: string,
    @Body('fileUrl') fileUrl: string,
  ) {
    return this.portalService.removeHomeworkFile(token, homeworkId, fileUrl);
  }
}
