import {
  Controller,
  Delete,
  Get,
  Patch,
  Post,
  Param,
  Query,
  Body,
  ParseUUIDPipe,
} from '@nestjs/common';
import { SkipThrottle } from '@nestjs/throttler';
import { ApiBearerAuth, ApiTags, ApiQuery } from '@nestjs/swagger';
import { CurrentUser } from '../common/decorators';
import { NotificationsService } from './notifications.service';

@ApiTags('Notifications')
@ApiBearerAuth()
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  @ApiQuery({ name: 'type', required: false })
  @ApiQuery({ name: 'read', required: false, type: Boolean })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  findAll(
    @CurrentUser('id') userId: string,
    @Query('type') type?: string,
    @Query('read') read?: boolean,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.notificationsService.findAll(userId, {
      type,
      read,
      page,
      limit,
    });
  }

  @Get('unread-count')
  @SkipThrottle()
  async getUnreadCount(@CurrentUser('id') userId: string) {
    const count = await this.notificationsService.getUnreadCount(userId);
    return { count };
  }

  @Get('push/public-key')
  getPushPublicKey() {
    return this.notificationsService.getPushPublicKey();
  }

  @Post('push/subscribe')
  subscribePush(
    @CurrentUser('id') userId: string,
    @Body() body: { subscription?: unknown },
  ) {
    return this.notificationsService.subscribePush(userId, body?.subscription);
  }

  @Post('push/unsubscribe')
  unsubscribePush(
    @CurrentUser('id') userId: string,
    @Body() body: { endpoint?: string },
  ) {
    return this.notificationsService.unsubscribePush(userId, body?.endpoint || '');
  }

  @Get('testing/messenger-outbox')
  getMessengerOutbox(
    @CurrentUser('id') userId: string,
    @Query('studentId') studentId?: string,
  ) {
    return this.notificationsService.getMessengerOutbox(userId, studentId);
  }

  @Delete('testing/messenger-outbox')
  clearMessengerOutbox(@CurrentUser('id') userId: string) {
    return this.notificationsService.clearMessengerOutbox(userId);
  }

  @Patch(':id/read')
  markAsRead(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.notificationsService.markAsRead(id, userId);
  }

  @Post(':id/read')
  markAsReadCompat(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.notificationsService.markAsRead(id, userId);
  }

  @Patch('read-all')
  markAllAsRead(@CurrentUser('id') userId: string) {
    return this.notificationsService.markAllAsRead(userId);
  }

  @Post('read-all')
  markAllAsReadCompat(@CurrentUser('id') userId: string) {
    return this.notificationsService.markAllAsRead(userId);
  }

  @Post(':id/confirm-booking')
  confirmBooking(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.notificationsService.confirmBooking(id, userId);
  }

  @Post(':id/reject-booking')
  rejectBooking(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.notificationsService.rejectBooking(id, userId);
  }

  @Post(':id/confirm-reschedule')
  confirmReschedule(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.notificationsService.confirmReschedule(id, userId);
  }

  @Post(':id/reject-reschedule')
  rejectReschedule(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.notificationsService.rejectReschedule(id, userId);
  }

  @Post('send-debt-reminder/:studentId')
  sendDebtReminder(
    @Param('studentId', ParseUUIDPipe) studentId: string,
    @CurrentUser('id') userId: string,
    @Body() body: { comment?: string },
  ) {
    return this.notificationsService.sendDebtReminder(userId, studentId, body?.comment);
  }

  @Post('send-reminder/:studentId')
  sendReminder(
    @Param('studentId', ParseUUIDPipe) studentId: string,
    @CurrentUser('id') userId: string,
    @Body() body: {
      type: 'payment' | 'lesson' | 'homework';
      lessonIds?: string[];
      homeworkIds?: string[];
      comment?: string;
      notifyParent?: boolean;
    },
  ) {
    return this.notificationsService.sendReminder(userId, studentId, body);
  }
}
