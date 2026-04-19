import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsBoolean, IsArray } from 'class-validator';

export class UpdateNotificationsDto {
  @ApiPropertyOptional({
    example: ['EMAIL', 'PUSH'],
    description: 'Selected notification channels',
    isArray: true,
    enum: ['EMAIL', 'PUSH', 'TELEGRAM', 'MAX'],
  })
  @IsOptional()
  @IsArray()
  channels?: string[];

  @ApiPropertyOptional({ example: 'email' })
  @IsOptional()
  @IsString()
  channel?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  studentReminder?: boolean;

  @ApiPropertyOptional({ example: '2' })
  @IsOptional()
  @IsString()
  studentReminderHours?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  selfReminder?: boolean;

  @ApiPropertyOptional({ example: '30' })
  @IsOptional()
  @IsString()
  selfReminderMins?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  paymentReminder?: boolean;

  @ApiPropertyOptional({ example: '3' })
  @IsOptional()
  @IsString()
  paymentReminderDays?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  cancelNotify?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  weeklyReport?: boolean;

  @ApiPropertyOptional({ example: 'mon' })
  @IsOptional()
  @IsString()
  reportDay?: string;
}
