import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsUUID,
  IsDateString,
  IsNumber,
  Min,
  IsOptional,
  IsEnum,
  ValidateNested,
  IsBoolean,
  IsArray,
  IsInt,
  MaxLength,
} from 'class-validator';
import { Type } from 'class-transformer';
import { LessonFormat } from '@prisma/client';

class RecurrenceDto {
  @ApiProperty()
  @IsBoolean()
  enabled: boolean;

  @ApiPropertyOptional({ description: 'Repeat until date (ISO)' })
  @IsOptional()
  @IsDateString()
  until?: string;

  @ApiPropertyOptional({
    example: [1, 3, 5],
    description: 'Weekdays (1=Mon, 7=Sun)',
  })
  @IsOptional()
  @IsArray()
  @IsInt({ each: true })
  weekdays?: number[];
}

export class CreateLessonDto {
  @ApiProperty()
  @IsUUID()
  studentId: string;

  @ApiProperty({ example: 'Математика' })
  @IsString()
  @MaxLength(100)
  subject: string;

  @ApiProperty({ description: 'ISO datetime' })
  @IsDateString()
  scheduledAt: string;

  @ApiProperty({ example: 60, description: 'Duration in minutes' })
  @IsNumber()
  @Min(15)
  duration: number;

  @ApiPropertyOptional({ enum: LessonFormat, default: LessonFormat.ONLINE })
  @IsOptional()
  @IsEnum(LessonFormat)
  format?: LessonFormat;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(200)
  location?: string;

  @ApiProperty({ example: 2000, description: 'Lesson rate (rubles)' })
  @IsNumber()
  @Min(0)
  rate: number;

  @ApiPropertyOptional({ description: 'Tutor note for lesson' })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  notes?: string;

  @ApiPropertyOptional({ type: RecurrenceDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => RecurrenceDto)
  recurrence?: RecurrenceDto;
}
