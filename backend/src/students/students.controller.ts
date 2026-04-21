import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  ParseUUIDPipe,
  HttpCode,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags, ApiQuery } from '@nestjs/swagger';
import { CurrentUser } from '../common/decorators';
import { StudentsService } from './students.service';
import { CreateStudentDto, UpdateStudentDto } from './dto';

@ApiTags('Students')
@ApiBearerAuth()
@Controller('students')
export class StudentsController {
  constructor(private readonly studentsService: StudentsService) {}

  @Get()
  @ApiQuery({ name: 'status', required: false })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'sort', required: false })
  @ApiQuery({ name: 'order', required: false, enum: ['asc', 'desc'] })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  findAll(
    @CurrentUser('id') userId: string,
    @Query('status') status?: string,
    @Query('search') search?: string,
    @Query('sort') sort?: string,
    @Query('order') order?: 'asc' | 'desc',
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.studentsService.findAll(userId, {
      status,
      search,
      sort,
      order,
      page,
      limit,
    });
  }

  @Get('check-email')
  @ApiQuery({ name: 'email', required: true })
  checkEmail(
    @Query('email') email: string,
  ) {
    return this.studentsService.checkEmail(email);
  }

  @Get(':id')
  findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.studentsService.findOne(id, userId);
  }

  @Post()
  create(
    @CurrentUser('id') userId: string,
    @Body() dto: CreateStudentDto,
  ) {
    return this.studentsService.create(userId, dto);
  }

  @Patch(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('id') userId: string,
    @Body() dto: UpdateStudentDto,
  ) {
    return this.studentsService.update(id, userId, dto);
  }

  @Delete(':id')
  remove(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.studentsService.remove(id, userId);
  }

  // ── Notes ──

  @Get(':id/notes')
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  findNotes(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('id') userId: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.studentsService.findNotes(id, userId, { page, limit });
  }

  @Post(':id/notes')
  createNote(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('id') userId: string,
    @Body() body: { content: string; lessonId?: string },
  ) {
    return this.studentsService.createNote(id, userId, body);
  }

  @Patch(':id/notes/:noteId')
  updateNote(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('noteId', ParseUUIDPipe) noteId: string,
    @CurrentUser('id') userId: string,
    @Body() body: { content: string },
  ) {
    return this.studentsService.updateNote(id, noteId, userId, body);
  }

  @Delete(':id/notes/:noteId')
  @HttpCode(204)
  deleteNote(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('noteId', ParseUUIDPipe) noteId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.studentsService.deleteNote(id, noteId, userId);
  }

  // ── Homework ──

  @Get(':id/homework')
  @ApiQuery({ name: 'status', required: false })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  findHomework(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('id') userId: string,
    @Query('status') status?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.studentsService.findHomework(id, userId, { status, page, limit });
  }

  @Post(':id/homework')
  createHomework(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('id') userId: string,
    @Body() body: { task: string; dueAt?: string; lessonId?: string; fileIds?: string[] },
  ) {
    return this.studentsService.createHomework(id, userId, body);
  }

  @Patch(':id/homework/:hwId')
  updateHomework(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('hwId', ParseUUIDPipe) hwId: string,
    @CurrentUser('id') userId: string,
    @Body()
    body: {
      task?: string;
      dueAt?: string;
      status?: string;
      lessonId?: string | null;
      fileIds?: string[];
    },
  ) {
    return this.studentsService.updateHomework(id, hwId, userId, body);
  }

  @Delete(':id/homework/:hwId')
  @HttpCode(204)
  deleteHomework(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('hwId', ParseUUIDPipe) hwId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.studentsService.deleteHomework(id, hwId, userId);
  }

  // ── Portal account ──

  /**
   * Tutor-triggered: create or link a self-service StudentAccount for this
   * student and send an invite email. Replaces legacy portal-link endpoints.
   */
  @Post(':id/activate-account')
  activateAccount(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.studentsService.activateAccount(id, userId);
  }

  @Post(':id/unlink-account')
  unlinkAccount(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.studentsService.unlinkAccount(id, userId);
  }
}
