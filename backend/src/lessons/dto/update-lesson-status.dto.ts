import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';
import { LessonStatus } from '@prisma/client';

export class UpdateLessonStatusDto {
  @ApiProperty({ enum: LessonStatus })
  @IsEnum(LessonStatus)
  status: LessonStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(500)
  cancelReason?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  note?: string;
}
