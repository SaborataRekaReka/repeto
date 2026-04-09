import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsBoolean } from 'class-validator';

export class UpdatePoliciesDto {
  @ApiPropertyOptional({ example: '12' })
  @IsOptional()
  @IsString()
  cancelTimeHours?: string;

  @ApiPropertyOptional({ example: 'full' })
  @IsOptional()
  @IsString()
  lateCancelAction?: string;

  @ApiPropertyOptional({ example: 'full' })
  @IsOptional()
  @IsString()
  noShowAction?: string;

  @ApiPropertyOptional({ example: 'sbp' })
  @IsOptional()
  @IsString()
  defaultPaymentMethod?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isSelfEmployed?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  receiptReminder?: boolean;
}
