import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsUUID,
  IsString,
  IsNumber,
  Min,
  IsOptional,
  IsDateString,
} from 'class-validator';

export class CreatePackageDto {
  @ApiProperty()
  @IsUUID()
  studentId: string;

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
