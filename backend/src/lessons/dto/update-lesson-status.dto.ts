import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { LessonStatus } from '@prisma/client';

export class UpdateLessonStatusDto {
  @ApiProperty({ enum: LessonStatus })
  @IsEnum(LessonStatus)
  status: LessonStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  cancelReason?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  note?: string;
}
