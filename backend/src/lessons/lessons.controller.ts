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
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags, ApiQuery } from '@nestjs/swagger';
import { CurrentUser } from '../common/decorators';
import { LessonsService } from './lessons.service';
import { CreateLessonDto, UpdateLessonDto, UpdateLessonStatusDto } from './dto';

@ApiTags('Lessons')
@ApiBearerAuth()
@Controller('lessons')
export class LessonsController {
  constructor(private readonly lessonsService: LessonsService) {}

  @Get()
  @ApiQuery({ name: 'from', required: false, description: 'ISO date start' })
  @ApiQuery({ name: 'to', required: false, description: 'ISO date end' })
  @ApiQuery({ name: 'studentId', required: false })
  findAll(
    @CurrentUser('id') userId: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('studentId') studentId?: string,
  ) {
    return this.lessonsService.findAll(userId, { from, to, studentId });
  }

  @Get(':id')
  findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.lessonsService.findOne(id, userId);
  }

  @Post()
  create(
    @CurrentUser('id') userId: string,
    @Body() dto: CreateLessonDto,
  ) {
    return this.lessonsService.create(userId, dto);
  }

  @Patch(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('id') userId: string,
    @Body() dto: UpdateLessonDto,
  ) {
    return this.lessonsService.update(id, userId, dto);
  }

  @Patch(':id/status')
  updateStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('id') userId: string,
    @Body() dto: UpdateLessonStatusDto,
  ) {
    return this.lessonsService.updateStatus(id, userId, dto);
  }

  @Delete(':id')
  @ApiQuery({ name: 'deleteRecurrence', required: false, type: Boolean })
  remove(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('id') userId: string,
    @Query('deleteRecurrence') deleteRecurrence?: boolean,
  ) {
    return this.lessonsService.remove(id, userId, deleteRecurrence);
  }
}
