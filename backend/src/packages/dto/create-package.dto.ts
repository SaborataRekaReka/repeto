import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsUUID,
  IsString,
  IsNumber,
  Min,
  IsOptional,
  IsDateString,
  IsBoolean,
} from 'class-validator';

export class CreatePackageDto {
  @ApiPropertyOptional({ description: 'Student id for private package' })
  @IsOptional()
  @IsUUID()
  studentId?: string;

  @ApiPropertyOptional({ description: 'Package is available on public page' })
  @IsOptional()
  @IsBoolean()
  isPublic?: boolean;

  @ApiProperty({ example: 'Математика' })
  @IsString()
  subject: string;

  @ApiProperty({ example: 8 })
  @IsNumber()
  @Min(1)
  lessonsTotal: number;

  @ApiProperty({ example: 16000 })
  @IsNumber()
  @Min(0)
  totalPrice: number;

  @ApiPropertyOptional({ description: 'Valid until date (ISO)' })
  @IsOptional()
  @IsDateString()
  validUntil?: string;

  @ApiPropertyOptional({ description: 'Package comment' })
  @IsOptional()
  @IsString()
  comment?: string;
}
